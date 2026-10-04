import { describe, it, expect } from "vitest";
import { canRead, canWrite, uploadProblem, SUPER_ADMIN_EMAIL } from "../worker/rules.js";

// Build a rules context: `as(uid, profile, email)` or `anon`.
const as = (uid, profile, email = `${uid}@example.com`) => ({
    auth: { uid, email },
    profile: async () => profile ?? null,
});
const anon = { auth: null, profile: async () => null };
const student = (uid = "alice") => as(uid, { role: "STUDENT", approvalStatus: "PENDING", points: 0 });
const volunteer = (uid = "vol") => as(uid, { role: "VOLUNTEER" });
const admin = (uid = "admin1") => as(uid, { role: "ADMIN" });
const superAdmin = () => as("super", { role: "SUPER_ADMIN" }, SUPER_ADMIN_EMAIL);

const newStudent = { name: "Alice", email: "a@x.com", role: "STUDENT", points: 0, approvalStatus: "PENDING" };

describe("users — self-signup", () => {
    it("allows a STUDENT signup with PENDING status and 0 points", async () => {
        expect(await canWrite("create", "users/alice", null, newStudent, as("alice"))).toBe(true);
    });
    it("BLOCKS self-signup with role=SUPER_ADMIN / ADMIN", async () => {
        expect(await canWrite("create", "users/alice", null, { ...newStudent, role: "SUPER_ADMIN" }, as("alice"))).toBe(false);
        expect(await canWrite("create", "users/alice", null, { ...newStudent, role: "ADMIN" }, as("alice"))).toBe(false);
    });
    it("BLOCKS self-signup with nonzero points", async () => {
        expect(await canWrite("create", "users/alice", null, { ...newStudent, points: 500 }, as("alice"))).toBe(false);
    });
    it("BLOCKS creating a user doc for someone else's uid", async () => {
        expect(await canWrite("create", "users/bob", null, newStudent, as("alice"))).toBe(false);
    });
});

describe("users — self-update", () => {
    const before = { ...newStudent, approvalStatus: "APPROVED_PENDING_FORM" };
    it("allows STUDENT -> VOLUNTEER self-promotion (finalize flow)", async () => {
        expect(await canWrite("update", "users/alice", before, { ...before, role: "VOLUNTEER", approvalStatus: "ACTIVE" }, student())).toBe(true);
    });
    it("BLOCKS STUDENT self-promoting to ADMIN", async () => {
        expect(await canWrite("update", "users/alice", before, { ...before, role: "ADMIN" }, student())).toBe(false);
    });
    it("BLOCKS VOLUNTEER self-promoting to SUPER_ADMIN", async () => {
        const v = { ...before, role: "VOLUNTEER" };
        expect(await canWrite("update", "users/vol", v, { ...v, role: "SUPER_ADMIN" }, volunteer())).toBe(false);
    });
    it("BLOCKS editing someone else's profile", async () => {
        expect(await canWrite("update", "users/bob", before, { ...before, college: "X" }, student())).toBe(false);
    });
    it("allows ADMIN to promote a VOLUNTEER to ADMIN", async () => {
        const v = { ...before, role: "VOLUNTEER" };
        expect(await canWrite("update", "users/vol", v, { ...v, role: "ADMIN" }, admin())).toBe(true);
    });
    it("BLOCKS unauthenticated reads", async () => {
        expect(await canRead("users", anon)).toBe(false);
        expect(await canRead("users", student())).toBe(true);
    });
});

describe("users — delete", () => {
    it("BLOCKS admin (non-super) from deleting users", async () => {
        expect(await canWrite("delete", "users/vol", newStudent, null, admin())).toBe(false);
    });
    it("BLOCKS an ADMIN using the super-admin role without the super-admin email", async () => {
        expect(await canWrite("delete", "users/vol", newStudent, null, as("x", { role: "SUPER_ADMIN" }))).toBe(false);
    });
    it("allows SUPER_ADMIN to delete users", async () => {
        expect(await canWrite("delete", "users/vol", newStudent, null, superAdmin())).toBe(true);
    });
});

describe("events", () => {
    const evt = { name: "Bootcamp", venue: "Hall", participants: 5 };
    it("allows public read of events (logged out)", async () => {
        expect(await canRead("events", anon)).toBe(true);
    });
    it("BLOCKS non-admin from creating events", async () => {
        expect(await canWrite("create", "events/e1", null, evt, volunteer())).toBe(false);
    });
    it("allows ADMIN to create events with valid fields, BLOCKS empty name", async () => {
        expect(await canWrite("create", "events/e1", null, evt, admin())).toBe(true);
        expect(await canWrite("create", "events/e1", null, { ...evt, name: "" }, admin())).toBe(false);
    });
    it("allows signed-in participant counter change by exactly one", async () => {
        expect(await canWrite("update", "events/e1", evt, { ...evt, participants: 6 }, student())).toBe(true);
        expect(await canWrite("update", "events/e1", evt, { ...evt, participants: 4 }, student())).toBe(true);
    });
    it("BLOCKS participant counter jumps and anonymous counter writes", async () => {
        expect(await canWrite("update", "events/e1", evt, { ...evt, participants: 50 }, student())).toBe(false);
        expect(await canWrite("update", "events/e1", evt, { ...evt, participants: 6 }, anon)).toBe(false);
    });
    it("BLOCKS direct refCounts / refClicks updates from clients", async () => {
        expect(await canWrite("update", "events/e1", evt, { ...evt, refCounts: { alice: 99 } }, student())).toBe(false);
        expect(await canWrite("update", "events/e1", evt, { ...evt, participants: 6, refClicks: { alice: 1 } }, student())).toBe(false);
    });
});

describe("event registrations", () => {
    it("BLOCKS direct registration writes (server endpoint only)", async () => {
        expect(await canWrite("create", "events/e1/registrations/alice", null, { name: "A" }, anon)).toBe(false);
        expect(await canWrite("create", "events/e1/registrations/alice", null, { name: "A" }, student())).toBe(false);
        expect(await canWrite("create", "events/e1/registrations/alice", null, { name: "A" }, admin())).toBe(false);
    });
    it("lets admins and volunteers read registrations, not students", async () => {
        expect(await canRead("events/e1/registrations", admin())).toBe(true);
        expect(await canRead("events/e1/registrations", volunteer())).toBe(true);
        expect(await canRead("events/e1/registrations", student())).toBe(false);
    });
});

describe("linkClicks and referralVisits", () => {
    it("BLOCKS all client writes", async () => {
        for (const ctx of [anon, student(), admin(), superAdmin()]) {
            expect(await canWrite("create", "linkClicks/c1", null, { eventId: "e1" }, ctx)).toBe(false);
            expect(await canWrite("delete", "linkClicks/c1", { eventId: "e1" }, null, ctx)).toBe(false);
            expect(await canWrite("create", "referralVisits/v1", null, { eventId: "e1" }, ctx)).toBe(false);
        }
    });
    it("only admins can read analytics", async () => {
        expect(await canRead("linkClicks", anon)).toBe(false);
        expect(await canRead("linkClicks", volunteer())).toBe(false);
        expect(await canRead("linkClicks", admin())).toBe(true);
        expect(await canRead("referralVisits", volunteer())).toBe(false);
        expect(await canRead("referralVisits", admin())).toBe(true);
    });
});

describe("unknown collections", () => {
    it("BLOCKS reads/writes to collections not in rules", async () => {
        expect(await canRead("secrets", superAdmin())).toBe(false);
        expect(await canWrite("create", "secrets/x", null, { a: 1 }, superAdmin())).toBe(false);
        expect(await canRead("rate_limits", superAdmin())).toBe(false);
    });
});

describe("notifications", () => {
    it("allows ADMIN / SUPER_ADMIN to write, BLOCKS volunteers and anonymous", async () => {
        expect(await canWrite("create", "notifications/n1", null, { message: "hi" }, admin())).toBe(true);
        expect(await canWrite("create", "notifications/n1", null, { message: "hi" }, superAdmin())).toBe(true);
        expect(await canWrite("create", "notifications/n1", null, { message: "hi" }, volunteer())).toBe(false);
        expect(await canWrite("create", "notifications/n1", null, { message: "hi" }, anon)).toBe(false);
    });
    it("allows any signed-in user to read; admins write event notifications", async () => {
        expect(await canRead("notifications", student())).toBe(true);
        expect(await canRead("notifications", anon)).toBe(false);
        expect(await canWrite("create", "events/e1/notifications/n1", null, { message: "hi" }, admin())).toBe(true);
        expect(await canWrite("create", "events/e1/notifications/n1", null, { message: "hi" }, volunteer())).toBe(false);
    });
});

describe("content collections", () => {
    it("public read; admins create/update; only super admin deletes", async () => {
        expect(await canRead("news", anon)).toBe(true);
        expect(await canWrite("create", "news/n1", null, { title: "x" }, admin())).toBe(true);
        expect(await canWrite("delete", "news/n1", { title: "x" }, null, admin())).toBe(false);
        expect(await canWrite("delete", "news/n1", { title: "x" }, null, superAdmin())).toBe(true);
        expect(await canWrite("create", "projects/p1", null, { title: "" }, admin())).toBe(false);
    });
    it("applications: users file their own PENDING application only", async () => {
        expect(await canWrite("create", "applications/a1", null, { userId: "alice", status: "PENDING" }, student())).toBe(true);
        expect(await canWrite("create", "applications/a1", null, { userId: "bob", status: "PENDING" }, student())).toBe(false);
        expect(await canWrite("create", "applications/a1", null, { userId: "alice", status: "APPROVED" }, student())).toBe(false);
    });
    it("tasks need a title and 1..10000 integer points", async () => {
        expect(await canWrite("create", "tasks/t1", null, { title: "T", points: 50 }, admin())).toBe(true);
        expect(await canWrite("create", "tasks/t1", null, { title: "T", points: 0 }, admin())).toBe(false);
        expect(await canWrite("create", "tasks/t1", null, { title: "T", points: 1.5 }, admin())).toBe(false);
    });
});

describe("image uploads (former storage.rules)", () => {
    const ok = { role: "ADMIN", folder: "events", type: "image/png", size: 1000 };
    it("allows admin, organizer and SUPER_ADMIN uploads", () => {
        expect(uploadProblem(ok)).toBeNull();
        expect(uploadProblem({ ...ok, role: "organizer" })).toBeNull();
        expect(uploadProblem({ ...ok, role: "SUPER_ADMIN", folder: "teams" })).toBeNull();
    });
    it("blocks non-admin and anonymous uploads", () => {
        expect(uploadProblem({ ...ok, role: "VOLUNTEER" })).toMatch(/admins/);
        expect(uploadProblem({ ...ok, role: null })).toMatch(/admins/);
    });
    it("blocks invalid types (incl. SVG), other folders and files of 5MB+", () => {
        expect(uploadProblem({ ...ok, type: "image/svg+xml" })).toMatch(/JPEG/);
        expect(uploadProblem({ ...ok, folder: "secrets" })).toMatch(/folder/);
        expect(uploadProblem({ ...ok, size: 5 * 1024 * 1024 })).toMatch(/5MB/);
    });
});
