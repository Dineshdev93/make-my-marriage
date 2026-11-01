# Make My Marriage | Database and API Design v1.0

Companion to PRD v1.1 and System Design v1.0. Scope: Version 1 only.

## 1. Agreed decisions

| # | Topic | Decision |
|---|---|---|
| 1 | Deletion | Hard delete, after a confirmation in the UI |
| 2 | Authorship | Every wedding record stores createdBy and updatedBy (user ids) |
| 3 | Amount input | Whole rupees in the form; stored and sent as integer paise |
| 4 | Phone | 10-digit Indian mobile number; duplicates allowed |
| 5 | Text limits | Names 100, descriptions 500, venue 200 characters |
| 6 | Wedding date | Editable; past dates allowed; countdown shows days ago after the date |
| 7 | Categories | Fixed list in code, no collection |
| 8 | Reads and writes | Pages read data on the server through services. REST routes are used for changes only. |
| 9 | Response format | Success: `{ data }`. Failure: `{ error: { code, message, fields } }` |
| 10 | Updates | PATCH with only the changed fields |
| 11 | Filter and sort | Done in the browser on the loaded list |
| 12 | Concurrent edits | Last write wins |
| 13 | Versioning | None (no /v1) |
| 14 | Rate limiting | Vercel firewall rules on login, register, and reset routes |

## 2. Changes to System Design v1.0

- The /api/family/[token]/... read routes are removed. Family pages read through the same services on the server, using a viewer access context built from the token.
- The GET routes in the API list are removed. Reads happen in server components. A GET route is added later only if a client component needs one.
- Everything else in System Design v1.0 stays as written.

## 3. Database design

### 3.1 Conventions

- Database: MongoDB Atlas, accessed through Mongoose.
- Primary keys are ObjectId (_id). Foreign references are ObjectId fields.
- Money is an integer number of paise. Maximum value for any amount or budget: 100 crore rupees (10,00,00,00,000 paise).
- Date-only fields are YYYY-MM-DD strings and must be real calendar dates. They sort correctly as text.
- Timestamps (createdAt, updatedAt) are UTC dates, managed by Mongoose.
- Every collection except users and passwordResets has weddingId. Every query filters by weddingId from the access context.
- Strings are trimmed before saving. Enums are validated in code and in the schema.

### 3.2 Collections

#### users

| Field | Type | Rules |
|---|---|---|
| _id | ObjectId | |
| name | string | Required, 1 to 100 characters |
| email | string | Required, lowercased, valid email, unique |
| passwordHash | string | Required, bcrypt hash |
| createdAt, updatedAt | date | Automatic |

Indexes: unique on email.

#### weddings

| Field | Type | Rules |
|---|---|---|
| _id | ObjectId | |
| name | string | Required, 1 to 100 characters |
| coupleNames | string | Required, 1 to 150 characters |
| weddingDate | string | Required, YYYY-MM-DD, past dates allowed |
| totalBudgetPaise | integer | Required, from 1 rupee up to the cap |
| editorIds | ObjectId[] | 1 or 2 users |
| familyTokenHash | string or null | SHA-256 of the family link token |
| partnerInvite | object or null | tokenHash, expiresAt (date), usedAt (date or null), createdBy |
| createdBy, updatedBy | ObjectId | User ids |
| createdAt, updatedAt | date | Automatic |

Indexes: unique multikey index on editorIds (a user can be an editor of only one wedding); unique sparse index on familyTokenHash; sparse index on partnerInvite.tokenHash.

#### functions

| Field | Type | Rules |
|---|---|---|
| _id | ObjectId | |
| weddingId | ObjectId | Required |
| name | string | Required, 1 to 100 characters |
| date | string | Required, YYYY-MM-DD |
| venue | string | Optional, up to 200 characters |
| createdBy, updatedBy | ObjectId | User ids |
| createdAt, updatedAt | date | Automatic |

Indexes: weddingId + date.

#### expenses

| Field | Type | Rules |
|---|---|---|
| _id | ObjectId | |
| weddingId | ObjectId | Required |
| amountPaise | integer | Required, at least 100 (1 rupee), up to the cap |
| category | enum | Venue, Catering, Decoration, Photography, Clothing and Jewellery, Other |
| description | string | Required, 1 to 500 characters |
| expenseDate | string | Required, YYYY-MM-DD |
| functionId | ObjectId or null | Optional; must belong to the same wedding |
| createdBy, updatedBy | ObjectId | User ids |
| createdAt, updatedAt | date | Automatic |

Indexes: weddingId + expenseDate; weddingId + functionId.

#### tasks

| Field | Type | Rules |
|---|---|---|
| _id | ObjectId | |
| weddingId | ObjectId | Required |
| title | string | Required, 1 to 200 characters |
| dueDate | string | Required, YYYY-MM-DD |
| completed | boolean | Default false |
| completedAt | date or null | Set when completed becomes true, cleared on reopen |
| functionId | ObjectId or null | Optional; must belong to the same wedding |
| createdBy, updatedBy | ObjectId | User ids |
| createdAt, updatedAt | date | Automatic |

Indexes: weddingId + dueDate; weddingId + functionId. Pending and overdue are computed, never stored.

#### guests

| Field | Type | Rules |
|---|---|---|
| _id | ObjectId | |
| weddingId | ObjectId | Required |
| name | string | Required, 1 to 100 characters |
| phone | string | Required, 10 digits, starts with 6 to 9, stored as digits only |
| group | string | Required, 1 to 100 characters (family or group) |
| invitationStatus | enum | Not invited, Invited, Confirmed; default Not invited |
| functionIds | ObjectId[] | Reserved for event-level guests. Always empty in V1 and not accepted by the API. |
| createdBy, updatedBy | ObjectId | User ids |
| createdAt, updatedAt | date | Automatic |

Indexes: weddingId + name.

#### passwordResets

| Field | Type | Rules |
|---|---|---|
| _id | ObjectId | |
| userId | ObjectId | Required |
| tokenHash | string | SHA-256 of the reset token |
| expiresAt | date | 1 hour from creation |
| usedAt | date or null | |

Indexes: TTL index on expiresAt; index on tokenHash.

### 3.3 Relationships and delete rules

| Relationship | Rule |
|---|---|
| User to wedding | A user is in at most one wedding (unique multikey index). A wedding has 1 or 2 editors. |
| Wedding to functions, expenses, tasks, guests | One to many through weddingId |
| Expense or task to function | Optional functionId |
| Delete a function | In one transaction: set functionId to null on its expenses and tasks, then delete the function |
| Delete an expense, task, or guest | Removed directly |
| Delete a wedding or account | Not in V1 |

### 3.4 Data rules enforced in the service layer

- A linked functionId must exist in the same wedding, otherwise validation fails.
- Adding the second editor is one atomic update that succeeds only if the wedding has fewer than 2 editors and the invite is valid, unused, and not expired. It then marks the invite used.
- Completing a task sets completedAt. Reopening clears it.
- updatedBy and updatedAt change on every edit.
- Budget overrun never blocks saving an expense.

### 3.5 Calculations

- Total expenses: aggregation that matches weddingId and sums amountPaise.
- Remaining budget: totalBudgetPaise minus total expenses. If negative, the amount exceeded is the absolute value and the warning is shown.
- Overdue: completed is false and dueDate is before today in IST.
- Countdown: whole days from today in IST to weddingDate. Negative means days since the wedding.
- Nothing derived is stored, so edits and deletes always keep totals correct.

## 4. API design

### 4.1 Conventions

- All routes are under /api, accept and return JSON, and need a valid session except register, forgot-password, and reset-password.
- weddingId is never in a request. It comes from the logged-in user's wedding.
- Money fields in the API are integer paise (amountPaise). The form converts whole rupees to paise.
- Dates are YYYY-MM-DD strings. Unknown fields are removed and ignored.
- Mutating requests must come from the app's own origin (Origin header check).
- Only editors can use the routes below. Family never calls the API; they only open server-rendered pages.

### 4.2 Response format

Success:

```json
{ "data": { } }
```

Failure:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Please fix the highlighted fields.", "fields": { "amountPaise": "Amount must be at least 1 rupee." } } }
```

| HTTP | Code | When |
|---|---|---|
| 200 | none | Updated or deleted |
| 201 | none | Created |
| 400 | VALIDATION_ERROR | Invalid input; fields lists each problem |
| 401 | UNAUTHENTICATED | No valid session |
| 403 | FORBIDDEN | Role is not allowed |
| 404 | NOT_FOUND | Record missing or belongs to another wedding |
| 409 | CONFLICT | EMAIL_TAKEN, WEDDING_EXISTS, ALREADY_IN_WEDDING, EDITOR_LIMIT_REACHED |
| 410 | LINK_EXPIRED | Invite or reset link expired or already used |
| 429 | RATE_LIMITED | Too many attempts |
| 500 | INTERNAL_ERROR | Unexpected error, logged to Sentry |

Created records return the full record. Updated records return the full updated record. Deletes return `{ data: { id } }`.

### 4.3 Endpoint summary

| Area | Method and path | Purpose |
|---|---|---|
| Auth | /api/auth/[...nextauth] | Auth.js login and logout |
| Auth | POST /api/auth/register | Create account |
| Auth | POST /api/auth/forgot-password | Send reset email |
| Auth | POST /api/auth/reset-password | Set new password |
| Wedding | POST /api/wedding | Create the wedding (guided setup) |
| Wedding | PATCH /api/wedding | Edit wedding details |
| Invite | POST /api/wedding/partner-invite | Create or replace the partner invite link |
| Invite | POST /api/invite/accept | Partner accepts the invite |
| Family | POST /api/wedding/family-link | Create or regenerate the family link |
| Functions | POST /api/functions | Create |
| Functions | PATCH /api/functions/[id] | Edit |
| Functions | DELETE /api/functions/[id] | Delete |
| Expenses | POST /api/expenses | Create |
| Expenses | PATCH /api/expenses/[id] | Edit |
| Expenses | DELETE /api/expenses/[id] | Delete |
| Tasks | POST /api/tasks | Create |
| Tasks | PATCH /api/tasks/[id] | Edit, complete, or reopen |
| Tasks | DELETE /api/tasks/[id] | Delete |
| Guests | POST /api/guests | Create |
| Guests | PATCH /api/guests/[id] | Edit, including invitation status |
| Guests | DELETE /api/guests/[id] | Delete |

### 4.4 Request details

For every PATCH, all fields are optional but at least one must be present, and the same rules as create apply to each field sent.

#### Auth

| Route | Body | Notes |
|---|---|---|
| POST /api/auth/register | name, email, password | Password 8 to 72 characters (bcrypt limit). 201 on success; 409 EMAIL_TAKEN if the email exists. |
| POST /api/auth/forgot-password | email | Always returns 200 with the same message, whether or not the email exists. Sends a link valid for 1 hour. |
| POST /api/auth/reset-password | token, password | 410 LINK_EXPIRED if the token is invalid, used, or expired. Marks the token used. |

#### Wedding

| Route | Body | Notes |
|---|---|---|
| POST /api/wedding | name, coupleNames, weddingDate, totalBudgetPaise | 409 WEDDING_EXISTS if the user already has a wedding. Adds the user as the first editor. |
| PATCH /api/wedding | any of the same four fields | Editors only |
| POST /api/wedding/partner-invite | none | Returns `{ inviteUrl, expiresAt }`. The full link is shown once. A new invite replaces the old one. |
| POST /api/invite/accept | token | 410 LINK_EXPIRED, 409 EDITOR_LIMIT_REACHED, or 409 ALREADY_IN_WEDDING when it cannot be accepted |
| POST /api/wedding/family-link | none | Returns `{ familyUrl }`. The link is shown once. Regenerating makes the old link stop working. |

#### Functions

| Field | Create | Notes |
|---|---|---|
| name | Required | |
| date | Required | YYYY-MM-DD |
| venue | Optional | Empty value clears it |

#### Expenses

| Field | Create | Notes |
|---|---|---|
| amountPaise | Required | Integer, 100 to the cap |
| category | Required | One of the six categories |
| description | Required | |
| expenseDate | Required | YYYY-MM-DD |
| functionId | Optional | null clears the link |

Example created expense:

```json
{ "data": { "id": "...", "amountPaise": 25000000, "category": "Catering", "description": "Advance to caterer", "expenseDate": "2026-11-20", "functionId": null, "createdBy": "...", "updatedBy": "...", "createdAt": "...", "updatedAt": "..." } }
```

#### Tasks

| Field | Create | Notes |
|---|---|---|
| title | Required | |
| dueDate | Required | YYYY-MM-DD |
| functionId | Optional | null clears the link |
| completed | Optional on create (default false) | PATCH `{ completed: true }` completes; `{ completed: false }` reopens |

The response also includes status: pending, overdue, or completed, computed at response time.

#### Guests

| Field | Create | Notes |
|---|---|---|
| name | Required | |
| phone | Required | 10 digits, starting 6 to 9. Spaces and dashes are removed before checking. |
| group | Required | |
| invitationStatus | Optional (default Not invited) | Not invited, Invited, or Confirmed |

### 4.5 Permissions

| Action | Editor (bride or groom) | Family (link) | Not logged in |
|---|---|---|---|
| View dashboard, expenses, functions, tasks, guests | Yes | Yes (server pages) | No |
| Create, edit, delete records | Yes | No | No |
| Edit wedding details | Yes | No | No |
| Create partner invite or family link | Yes | No | No |
| Accept partner invite | Logged-in user with no wedding | No | Must log in first |

Family pages are reached at /family/[token]. The server hashes the token, finds the wedding, and builds a viewer access context. Services refuse every write for a viewer, even if called by mistake.

## 5. Service layer (server-side reads and writes)

Pages and route handlers both call these functions with an access context.

| Module | Reads | Writes |
|---|---|---|
| wedding | getWedding | createWedding, updateWedding, createPartnerInvite, acceptInvite, regenerateFamilyLink |
| functions | listFunctions, getFunction | createFunction, updateFunction, deleteFunction |
| expenses | listExpenses, getBudgetSummary | createExpense, updateExpense, deleteExpense |
| tasks | listTasks | createTask, updateTask, deleteTask |
| guests | listGuests | createGuest, updateGuest, deleteGuest |
| dashboard | getDashboard | none |

getDashboard returns: wedding name, couple names, wedding date, countdown days, total budget, total expenses, remaining budget, amount exceeded (0 if none), next 5 upcoming functions, next 5 incomplete tasks (overdue first), and counts of pending and overdue tasks.

List functions return all records for the wedding, sorted by date. Search, filter, and sort controls work in the browser.

After a successful change, the page refreshes its server data so totals and summaries show the saved state. The UI never shows success before the server confirms.

## 6. Edge cases to test

- Two editors edit the same record: the later save wins.
- Deleting a function that has expenses and tasks: records stay, links become empty.
- Expense total above budget: saved, with a clear exceeded amount shown.
- Wedding date in the past: allowed; countdown reads days ago.
- Same phone number for two guests: allowed.
- Third user tries to accept an invite: 409 EDITOR_LIMIT_REACHED.
- User already in a wedding opens an invite link: 409 ALREADY_IN_WEDDING.
- Regenerated family link: old link shows not found.
- Record id from another wedding: 404, never 403, so existence is not revealed.

## 7. Remaining open items

- Exact Vercel firewall limits for login, register, and reset (for example, number of attempts per minute per IP).
- Wording of validation and error messages.
- Whether the family link page should show a short "view only" banner (suggested: yes).
