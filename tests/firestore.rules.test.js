import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
    initializeTestEnvironment,
    assertFails,
    assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
} from "firebase/firestore";

const PROJECT_ID = "ieee-vc-rules-test";
const SUPER_ADMIN_EMAIL = "hussainkmajmal786@gmail.com";

let env;

beforeAll(async () => {
    env = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
            host: "127.0.0.1",
            port: 8080,
        },
    });
});

afterAll(async () => {
    await env?.cleanup();
});

beforeEach(async () => {
    await env.clearFirestore();
});

function studentCtx(uid = "u_student") {
    return env.authenticatedContext(uid).firestore();
}
function adminCtx(uid = "u_admin") {
    return env.authenticatedContext(uid).firestore();
}
function superAdminCtx(uid = "u_super") {
    return env
        .authenticatedContext(uid, { email: SUPER_ADMIN_EMAIL })
        .firestore();
}
function anonCtx() {
    return env.unauthenticatedContext().firestore();
}

// Seed a user document via the privileged path so we can test downstream rules
// without depending on the create rule itself.
async function seedUser(uid, data) {
    await env.withSecurityRulesDisabled(async (ctx) => {
        await setDoc(doc(ctx.firestore(), "users", uid), data);
    });
}

describe("users — self-signup", () => {
    it("allows a STUDENT signup with PENDING status and 0 points", async () => {
        await assertSucceeds(
            setDoc(doc(studentCtx("alice").firestore?.() ?? studentCtx("alice"), "users", "alice"), {
                name: "Alice",
                email: "alice@example.com",
                role: "STUDENT",
                approvalStatus: "PENDING",
                points: 0,
                createdAt: serverTimestamp(),
            })
        );
    });

    it("BLOCKS self-signup with role=SUPER_ADMIN (privilege escalation)", async () => {
        await assertFails(
            setDoc(doc(studentCtx("mallory"), "users", "mallory"), {
                name: "Mallory",
                role: "SUPER_ADMIN",
                approvalStatus: "PENDING",
                points: 0,
            })
        );
    });

    it("BLOCKS self-signup with role=ADMIN", async () => {
        await assertFails(
            setDoc(doc(studentCtx("mallory"), "users", "mallory"), {
                name: "Mallory",
                role: "ADMIN",
                approvalStatus: "PENDING",
                points: 0,
            })
        );
    });

    it("BLOCKS self-signup with nonzero points", async () => {
        await assertFails(
            setDoc(doc(studentCtx("alice"), "users", "alice"), {
                name: "Alice",
                role: "STUDENT",
                approvalStatus: "PENDING",
                points: 9999,
            })
        );
    });

    it("BLOCKS creating a user doc for someone else's uid", async () => {
        await assertFails(
            setDoc(doc(studentCtx("alice"), "users", "bob"), {
                name: "Fake Bob",
                role: "STUDENT",
                approvalStatus: "PENDING",
                points: 0,
            })
        );
    });
});

describe("users — self-update", () => {
    it("allows STUDENT -> VOLUNTEER self-promotion (finalize flow)", async () => {
        await seedUser("alice", {
            name: "Alice",
            role: "STUDENT",
            approvalStatus: "PENDING",
            points: 0,
        });
        await assertSucceeds(
            updateDoc(doc(studentCtx("alice"), "users", "alice"), {
                role: "VOLUNTEER",
                approvalStatus: "ACTIVE",
            })
        );
    });

    it("BLOCKS STUDENT self-promoting to ADMIN", async () => {
        await seedUser("mallory", {
            name: "Mallory",
            role: "STUDENT",
            approvalStatus: "PENDING",
            points: 0,
        });
        await assertFails(
            updateDoc(doc(studentCtx("mallory"), "users", "mallory"), {
                role: "ADMIN",
            })
        );
    });

    it("BLOCKS VOLUNTEER self-promoting to SUPER_ADMIN", async () => {
        await seedUser("eve", {
            name: "Eve",
            role: "VOLUNTEER",
            approvalStatus: "ACTIVE",
            points: 100,
        });
        await assertFails(
            updateDoc(doc(studentCtx("eve"), "users", "eve"), {
                role: "SUPER_ADMIN",
            })
        );
    });

    it("allows ADMIN to promote a VOLUNTEER to ADMIN", async () => {
        await seedUser("admin1", {
            name: "Admin",
            role: "ADMIN",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await seedUser("vol1", {
            name: "Vol",
            role: "VOLUNTEER",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await assertSucceeds(
            updateDoc(doc(adminCtx("admin1"), "users", "vol1"), { role: "ADMIN" })
        );
    });

    it("BLOCKS unauthenticated reads", async () => {
        await seedUser("alice", {
            name: "Alice",
            role: "STUDENT",
            approvalStatus: "PENDING",
            points: 0,
        });
        await assertFails(
            updateDoc(doc(anonCtx(), "users", "alice"), { name: "Hacked" })
        );
    });
});

describe("users — delete", () => {
    it("BLOCKS admin (non-super) from deleting users", async () => {
        await seedUser("admin1", {
            name: "Admin",
            role: "ADMIN",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await seedUser("victim", {
            name: "Victim",
            role: "STUDENT",
            approvalStatus: "PENDING",
            points: 0,
        });
        await assertFails(deleteDoc(doc(adminCtx("admin1"), "users", "victim")));
    });

    it("allows SUPER_ADMIN to delete users", async () => {
        await seedUser("u_super", {
            name: "Super",
            role: "SUPER_ADMIN",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await seedUser("victim", {
            name: "Victim",
            role: "STUDENT",
            approvalStatus: "PENDING",
            points: 0,
        });
        await assertSucceeds(
            deleteDoc(doc(superAdminCtx("u_super"), "users", "victim"))
        );
    });
});

describe("events", () => {
    it("allows public read of events (logged out)", async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), "events", "e1"), {
                name: "Hackathon",
                venue: "Hall A",
            });
        });
        const { getDoc } = await import("firebase/firestore");
        await assertSucceeds(getDoc(doc(anonCtx(), "events", "e1")));
    });

    it("BLOCKS non-admin from creating events", async () => {
        await seedUser("alice", {
            name: "Alice",
            role: "STUDENT",
            approvalStatus: "PENDING",
            points: 0,
        });
        await assertFails(
            setDoc(doc(studentCtx("alice"), "events", "e1"), {
                name: "Sneaky",
                venue: "Nowhere",
            })
        );
    });

    it("allows ADMIN to create events with valid fields", async () => {
        await seedUser("admin1", {
            name: "Admin",
            role: "ADMIN",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await assertSucceeds(
            setDoc(doc(adminCtx("admin1"), "events", "e1"), {
                name: "IEEE Day",
                venue: "Main Hall",
            })
        );
    });

    it("BLOCKS ADMIN create with empty name", async () => {
        await seedUser("admin1", {
            name: "Admin",
            role: "ADMIN",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await assertFails(
            setDoc(doc(adminCtx("admin1"), "events", "e1"), {
                name: "",
                venue: "Main Hall",
            })
        );
    });

    it("allows authenticated participant counter increment by exactly one", async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), "events", "e1"), {
                name: "IEEE Day",
                venue: "Main Hall",
                participants: 10,
            });
        });
        await seedUser("alice", {
            name: "Alice",
            role: "VOLUNTEER",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await assertSucceeds(
            updateDoc(doc(studentCtx("alice"), "events", "e1"), {
                participants: 11,
            })
        );
    });

    it("allows authenticated participant counter decrement by exactly one", async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), "events", "e1"), {
                name: "IEEE Day",
                venue: "Main Hall",
                participants: 10,
            });
        });
        await seedUser("alice", {
            name: "Alice",
            role: "VOLUNTEER",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await assertSucceeds(
            updateDoc(doc(studentCtx("alice"), "events", "e1"), {
                participants: 9,
            })
        );
    });

    it("BLOCKS participant counter jumps", async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), "events", "e1"), {
                name: "IEEE Day",
                venue: "Main Hall",
                participants: 10,
            });
        });
        await seedUser("alice", {
            name: "Alice",
            role: "VOLUNTEER",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await assertFails(
            updateDoc(doc(studentCtx("alice"), "events", "e1"), {
                participants: 15,
            })
        );
    });

    it("BLOCKS unauthenticated participant counter writes", async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), "events", "e1"), {
                name: "IEEE Day",
                venue: "Main Hall",
                participants: 10,
            });
        });
        await assertFails(
            updateDoc(doc(anonCtx(), "events", "e1"), {
                participants: 11,
            })
        );
    });

    it("BLOCKS direct refCounts updates from clients", async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), "events", "e1"), {
                name: "IEEE Day",
                venue: "Main Hall",
                participants: 10,
                refCounts: { alice: 1 },
            });
        });
        await seedUser("alice", {
            name: "Alice",
            role: "VOLUNTEER",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await assertFails(
            updateDoc(doc(studentCtx("alice"), "events", "e1"), {
                refCounts: { alice: 2 },
            })
        );
    });
});

describe("event registrations", () => {
    it("BLOCKS direct event registration writes from anonymous users", async () => {
        await assertFails(
            setDoc(doc(anonCtx(), "events", "e1", "registrations", "r1"), {
                name: "Anon",
                email: "anon@example.com",
            })
        );
    });

    it("BLOCKS direct event registration writes from authenticated users", async () => {
        await seedUser("alice", {
            name: "Alice",
            role: "VOLUNTEER",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await assertFails(
            setDoc(doc(studentCtx("alice"), "events", "e1", "registrations", "alice"), {
                name: "Alice",
                email: "alice@example.com",
            })
        );
    });
});

describe("linkClicks", () => {
    it("BLOCKS anonymous direct click writes", async () => {
        await assertFails(
            setDoc(doc(anonCtx(), "linkClicks", "c1"), {
                eventId: "e1",
                timestamp: new Date(),
            })
        );
    });

    it("BLOCKS authenticated direct click writes", async () => {
        await seedUser("alice", {
            name: "Alice",
            role: "VOLUNTEER",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await assertFails(
            setDoc(doc(studentCtx("alice"), "linkClicks", "c1"), {
                eventId: "e1",
                timestamp: new Date(),
            })
        );
    });

    it("BLOCKS anonymous reads of analytics", async () => {
        const { getDoc } = await import("firebase/firestore");
        await assertFails(getDoc(doc(anonCtx(), "linkClicks", "c1")));
    });

    it("BLOCKS update/delete of click events (immutable log)", async () => {
        await env.withSecurityRulesDisabled(async (ctx) => {
            await setDoc(doc(ctx.firestore(), "linkClicks", "c1"), {
                eventId: "e1",
                timestamp: new Date(),
            });
        });
        await seedUser("admin1", {
            name: "Admin",
            role: "ADMIN",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await assertFails(
            updateDoc(doc(adminCtx("admin1"), "linkClicks", "c1"), { eventId: "e2" })
        );
        await assertFails(deleteDoc(doc(adminCtx("admin1"), "linkClicks", "c1")));
    });
});

describe("unknown collections", () => {
    it("BLOCKS reads/writes to collections not in rules", async () => {
        await seedUser("admin1", {
            name: "Admin",
            role: "ADMIN",
            approvalStatus: "ACTIVE",
            points: 0,
        });
        await assertFails(
            setDoc(doc(adminCtx("admin1"), "randomCollection", "x"), { foo: "bar" })
        );
    });
});
