import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
    initializeTestEnvironment,
    assertFails,
    assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

const PROJECT_ID = "ieee-vc-storage-rules-test";
const BUCKET = `${PROJECT_ID}.appspot.com`;

let env;

beforeAll(async () => {
    env = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
            host: "127.0.0.1",
            port: 8080,
        },
        storage: {
            rules: readFileSync(resolve(process.cwd(), "storage.rules"), "utf8"),
            host: "127.0.0.1",
            port: 9199,
        },
    });
});

afterAll(async () => {
    await env?.cleanup();
});

beforeEach(async () => {
    await env.clearFirestore();
    await env.clearStorage();
});

function storageFor(uid, token = {}) {
    return env.authenticatedContext(uid, token).storage(`gs://${BUCKET}`);
}

function anonStorage() {
    return env.unauthenticatedContext().storage(`gs://${BUCKET}`);
}

async function seedUser(uid, role) {
    await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), "users", uid), {
            name: uid,
            role,
            approvalStatus: "ACTIVE",
            points: 0,
        });
    });
}

async function seedImage(path) {
    await env.withSecurityRulesDisabled(async (ctx) => {
        await ctx
            .storage(`gs://${BUCKET}`)
            .ref(path)
            .putString("seed", "raw", { contentType: "image/png" });
    });
}

describe("storage images", () => {
    it("allows public reads for event images", async () => {
        await seedImage("events/banner.png");
        await assertSucceeds(anonStorage().ref("events/banner.png").getMetadata());
    });

    it("allows admin image uploads", async () => {
        await seedUser("admin1", "admin");
        await assertSucceeds(
            storageFor("admin1", { role: "admin" })
                .ref("events/banner.png")
                .putString("image", "raw", { contentType: "image/png" })
        );
    });

    it("allows organizer image uploads", async () => {
        await seedUser("org1", "organizer");
        await assertSucceeds(
            storageFor("org1", { role: "organizer" })
                .ref("rewards/badge.webp")
                .putString("image", "raw", { contentType: "image/webp" })
        );
    });

    it("keeps existing uppercase ADMIN uploads working", async () => {
        await seedUser("admin2", "ADMIN");
        await assertSucceeds(
            storageFor("admin2", { role: "ADMIN" })
                .ref("teams/core.gif")
                .putString("image", "raw", { contentType: "image/gif" })
        );
    });

    it("blocks non-admin image uploads", async () => {
        await seedUser("vol1", "VOLUNTEER");
        await assertFails(
            storageFor("vol1", { role: "VOLUNTEER" })
                .ref("events/banner.png")
                .putString("image", "raw", { contentType: "image/png" })
        );
    });

    it("blocks anonymous image uploads", async () => {
        await assertFails(
            anonStorage()
                .ref("events/banner.png")
                .putString("image", "raw", { contentType: "image/png" })
        );
    });

    it("blocks invalid file types", async () => {
        await seedUser("admin1", "admin");
        await assertFails(
            storageFor("admin1", { role: "admin" })
                .ref("events/payload.svg")
                .putString("<svg />", "raw", { contentType: "image/svg+xml" })
        );
    });

    it("blocks uploads outside allowed folders", async () => {
        await seedUser("admin1", "admin");
        await assertFails(
            storageFor("admin1", { role: "admin" })
                .ref("private/payload.png")
                .putString("image", "raw", { contentType: "image/png" })
        );
    });

    it("blocks images larger than 5 MB", async () => {
        await seedUser("admin1", "admin");
        const tooLargeImage = new Uint8Array(5 * 1024 * 1024);
        await assertFails(
            storageFor("admin1", { role: "admin" })
                .ref("events/too-large.png")
                .put(tooLargeImage, { contentType: "image/png" })
        );
    });
});
