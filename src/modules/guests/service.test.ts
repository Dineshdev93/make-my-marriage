import mongoose, { Types } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { connectToDatabase } from "@/lib/db";
import { GuestModel } from "./model";
import { createGuest, deleteGuest, getGuestSummary, listGuests, updateGuest } from "./service";

let mongo: MongoMemoryServer | undefined;
const runMongoIntegrationTests = process.platform !== "win32" || process.env.RUN_MONGO_MEMORY_TESTS === "1";
const makeContext = (weddingId: Types.ObjectId, userId = new Types.ObjectId().toString()) => ({ weddingId: weddingId.toString(), userId, role: "editor" as const });
const guestInput = { name: "Asha Sharma", phone: "98765 43210", group: "Sharma family" };

beforeAll(async () => {
  if (!runMongoIntegrationTests) return;
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await connectToDatabase();
  await GuestModel.init();
});

afterEach(async () => {
  if (mongo) await GuestModel.deleteMany({});
});

afterAll(async () => {
  if (!mongo) return;
  await mongoose.disconnect();
  await mongo.stop();
});

describe.skipIf(!runMongoIntegrationTests)("guest service integration", () => {
  it("creates with an empty functionIds list, updates status and deletes", async () => {
    const context = makeContext(new Types.ObjectId());
    const guest = await createGuest(context, guestInput);
    expect(guest).toMatchObject({ phone: "9876543210", invitationStatus: "Not invited", functionIds: [] });
    expect((await updateGuest(context, guest.id, { invitationStatus: "Confirmed" })).invitationStatus).toBe("Confirmed");
    await deleteGuest(context, guest.id);
    expect(await listGuests(context)).toEqual([]);
  });

  it("allows duplicate phones, sorts names case-insensitively, and aggregates the list summary", async () => {
    const context = makeContext(new Types.ObjectId());
    await createGuest(context, { ...guestInput, name: "Zara", invitationStatus: "Invited" });
    await createGuest(context, { ...guestInput, name: "asha", invitationStatus: "Confirmed" });
    await createGuest(context, { ...guestInput, name: "Mina" });
    const guests = await listGuests(context);
    expect(guests.map(({ name }) => name)).toEqual(["asha", "Mina", "Zara"]);
    expect(new Set(guests.map(({ phone }) => phone))).toEqual(new Set(["9876543210"]));
    expect(await getGuestSummary(context)).toEqual({ total: 3, notInvited: 1, invited: 1, confirmed: 1 });
  });

  it("isolates guest data by wedding and rejects viewer writes", async () => {
    const contextA = makeContext(new Types.ObjectId());
    const contextB = makeContext(new Types.ObjectId());
    const guest = await createGuest(contextA, guestInput);
    const viewer = { ...contextA, role: "viewer" as const };
    await expect(createGuest(viewer, guestInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateGuest(viewer, guest.id, { name: "Denied" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(deleteGuest(viewer, guest.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateGuest(contextB, guest.id, { name: "Denied" })).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    await expect(deleteGuest(contextB, guest.id)).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    expect(await listGuests(contextB)).toEqual([]);
    expect((await listGuests(contextA))[0]?.name).toBe("Asha Sharma");
  });
});
