# Make My Marriage | PRD v1.1

Status: Simple Version 1 (updated from v1.0)

A simple, free workspace for Indian couples to manage wedding expenses, functions, tasks, and a basic guest list.

## What changed from v1.0

- Two editors per wedding: the bride and the groom, with equal rights.
- Family members get view-only access through a shared link, with no login.
- English only.
- Currency is INR with Indian number formatting (for example, ₹12,50,000).
- Everything else stays as in v1.0. Extra features are moved to the Later list.

## 1. Product Overview

**Vision:** Make My Marriage is a simple, free wedding-planning web app for Indian couples. It keeps expenses, functions, tasks, and guests in one place.

**Product principle:** Keep Version 1 simple and useful. Prioritize expense control over feature breadth.

**Goals**

- Set an overall wedding budget and record expenses.
- See total recorded spending and the remaining budget.
- Organize wedding functions and preparation tasks.
- Maintain a basic guest list and invitation status.
- See the essentials on one simple dashboard.

## 2. Users and Access

| Role | Access |
|---|---|
| Bride / Groom (Editors) | Full access: create, view, edit, and delete all wedding records and settings. Both have equal rights. |
| Family (Viewer) | View-only access through a shared link. No login. Cannot create, edit, or delete anything. |

**Rules**

- The first user to sign up creates the wedding workspace and becomes the first editor.
- That user invites the partner with an invite link. The partner signs up or logs in and becomes the second editor.
- A workspace has a maximum of two editors.
- The editor can generate, view, and regenerate the family view link. Regenerating the link disables the old one.
- The family view shows all wedding information, including the budget, in read-only form.
- One account manages one wedding.

## 3. Scope

**Included in Version 1**

- Sign up, log in, and log out for the bride and groom.
- Guided wedding setup: wedding name, couple names, wedding date, and total budget.
- Simple dashboard with budget summary, countdown, upcoming tasks, and upcoming functions.
- Expenses, functions, tasks, and guests (details below).
- Partner invite link and family view-only link.
- Create, view, edit, and delete records, with a confirmation before deleting.
- Persistent storage across sessions and refreshes.

**Later list (not in Version 1)**

- Digital invitation and RSVP
- Photo gallery where guests can view and upload photos
- Live streaming (YouTube link)
- Guest headcount
- Expense payment tracking (advance and balance)
- Category-wise budget
- PDF and Excel export
- Email reminders
- Vendor management, accommodation and travel, shopping lists, AI planning, multiple weddings

## 4. Primary User Journey

1. The user signs up or logs in.
2. The app checks whether a wedding workspace exists.
3. If none exists, the user completes the guided setup. Otherwise the saved data loads.
4. The user arrives at the dashboard.
5. The user manages expenses, functions, tasks, and guests. The partner can do the same after joining.
6. The app saves changes and recalculates the dashboard summaries.
7. The user shares the family view link so relatives can follow along.

## 5. Functional Requirements

### FR-01: Authentication

- Bride and groom can register, log in, and log out.
- Protected pages require authentication.
- Users can access only their own wedding data.
- Passwords are stored using a secure hashing mechanism.

### FR-02: Guided wedding setup

- Required fields: wedding name, couple names, wedding date, total budget.
- Validate fields and show clear error messages.
- Editors can edit the saved wedding details.

### FR-03: Dashboard

- Show wedding name, couple names, date, and countdown.
- Show total budget, total recorded expenses, and remaining budget.
- Show upcoming functions and upcoming tasks.
- Provide four quick actions: Add Expense, Add Function, Add Task, Add Guest.
- Keep the screen simple. Quick actions are hidden in the family view.

### FR-04: Budget and expenses

| Field | Requirement |
|---|---|
| Amount | Required; a valid positive amount in ₹ |
| Category | Required; Venue, Catering, Decoration, Photography, Clothing and Jewellery, Other |
| Description | Required |
| Expense date | Required |
| Linked function | Optional |

- Total recorded expenses equal the sum of saved expense amounts.
- Remaining budget equals total budget minus total recorded expenses.
- If expenses exceed the budget, show the amount exceeded and a clear warning. Do not block the expense.
- Amounts display in Indian number format (₹12,50,000).

### FR-05: Wedding functions

- Fields: name (required), date (required), venue (optional).
- Editors can create, view, edit, and delete functions.
- Upcoming functions appear on the dashboard.
- Deleting a function clears the link from tasks and expenses. It does not delete them.

### FR-06: Task checklist

- Fields: title, due date, completion status, optional linked function.
- Editors can add, view, edit, delete, complete, and reopen tasks.
- An incomplete task with a future due date is pending. An incomplete task whose due date has passed is overdue.
- Completed tasks stay completed even if the due date has passed.

### FR-07: Guest management

| Field | Requirement |
|---|---|
| Guest name | Required |
| Phone number | Required |
| Family / group | Required |
| Invitation status | Required; Not invited, Invited, or Confirmed; updated manually |

- Editors can add, view, edit, and delete guests.

### FR-08: Roles and access

- Both editors have full create, edit, and delete rights.
- The family link gives read-only access to the dashboard, expenses, functions, tasks, and guests.
- The family view has no add, edit, or delete controls, and no settings access.
- Write operations from the family link are rejected on the server, not just hidden in the interface.
- The family link is a long, unguessable token.

### FR-09: Record editing and deletion

- Editors can edit all records. Confirm before deleting.
- Dashboard totals and summaries reflect the latest saved data.

### FR-10: Persistent data

- All wedding data persists across logout, login, refresh, and browser restart.
- If saving fails, show an error. Never show a false success.

## 6. Navigation

| Item | Purpose |
|---|---|
| Dashboard | Overview and quick actions |
| Budget and Expenses | Manage expenses and budget totals |
| Functions | Manage functions |
| Tasks | Manage the checklist |
| Guests | Manage the guest list |
| Wedding Settings | Edit wedding details, invite partner, manage the family link (editors only) |

## 7. Business Rules

- One account has one wedding. One wedding has one overall budget.
- A wedding has at most two editors (bride and groom).
- Family members are view-only and need no account.
- Expense categories are predefined and include Other.
- A budget overrun triggers a warning, not a block.
- Overdue status is calculated for incomplete tasks whose due date has passed.
- Deleting a function never deletes linked expenses or tasks.
- Invitation statuses are maintained manually.

## 8. Non-Functional Requirements

- **Usability:** clear labels, short forms, understandable validation messages, no complex menus.
- **Responsiveness:** works on desktop, tablet, and mobile browsers.
- **Language:** English only.
- **Security:** authentication for editors, server-side authorization for every protected operation, secure password storage.
- **Data integrity:** reliable numeric handling for money, consistent date handling, correct totals after edits and deletions.

## 9. Success Criteria

- A user can register, log in, and create a wedding workspace.
- The partner can join through the invite link and edit equally.
- Family can open the view link and see data without being able to change it.
- Expenses, functions, tasks, and guests work end to end, and budget totals stay accurate.
- Saved records persist across sessions.
- No user can access another wedding's data.

## 10. Items to Confirm During Design

- Whether the wedding date can be changed after setup.
- Phone-number validation rules and money-input rules.
- Behavior for past wedding dates.
- Final desktop and mobile layouts.
- Authentication method, architecture, and deployment.

## 11. Definition of Done

- All Version 1 features are implemented and tested.
- Validation and error handling work correctly.
- Budget calculations match saved expense records.
- Editor and family permissions are tested, including server-side rejection of family write attempts.
- Create, edit, delete, and persistence flows are verified.
- Desktop and mobile layouts are verified.
- No critical defects remain in the core user journey.
