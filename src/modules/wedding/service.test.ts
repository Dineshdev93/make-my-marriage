import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { connectToDatabase } from "@/lib/db";
import { WeddingModel } from "./model";
import { createWedding, getWedding, updateWedding } from "./service";

let mongo: MongoMemoryServer | undefined;
const runMongoIntegrationTests = process.platform !== "win32" || process.env.RUN_MONGO_MEMORY_TESTS === "1";
const input = { name: "Meera and Aarav's Wedding", coupleNames: "Meera and Aarav", weddingDate: "2027-03-14", totalBudgetPaise: 150_000_000 };

beforeAll(async () => {
  if (!runMongoIntegrationTests) return;
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  await connectToDatabase();
  await WeddingModel.init();
});

afterEach(async () => {
  if (mongo) await WeddingModel.deleteMany({});
});

afterAll(async () => {
  if (!mongo) return;
  await mongoose.disconnect();
  await mongo.stop();
});

describe.skipIf(!runMongoIntegrationTests)("wedding service integration", () => {
  it("creates one wedding per editor and allows separate users", async () => {
    const userA = new mongoose.Types.ObjectId().toString();
    const userB = new mongoose.Types.ObjectId().toString();
    const first = await createWedding(userA, input);
    expect(first.editorIds).toEqual([userA]);
    await expect(createWedding(userA, input)).rejects.toMatchObject({ code: "WEDDING_EXISTS", status: 409 });
    const second = await createWedding(userB, input);
    expect(second.id).not.toBe(first.id);
  });

  it("returns only the wedding in editor and viewer contexts", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const own = await createWedding(userId, input);
    const other = await createWedding(new mongoose.Types.ObjectId().toString(), input);
    expect((await getWedding({ weddingId: own.id, userId, role: "editor" })).id).toBe(own.id);
    expect((await getWedding({ weddingId: other.id, role: "viewer" })).id).toBe(other.id);
    await expect(getWedding({ weddingId: new mongoose.Types.ObjectId().toString(), role: "viewer" }))
      .rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });

  it("limits updates to the context wedding and rejects viewer writes", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const own = await createWedding(userId, input);
    const other = await createWedding(new mongoose.Types.ObjectId().toString(), input);
    await updateWedding({ weddingId: own.id, userId, role: "editor" }, { name: "Updated" });
    expect((await getWedding({ weddingId: own.id, role: "viewer" })).name).toBe("Updated");
    expect((await getWedding({ weddingId: other.id, role: "viewer" })).name).toBe(input.name);
    await expect(updateWedding({ weddingId: own.id, role: "viewer" }, { name: "No" }))
      .rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
  });
});
