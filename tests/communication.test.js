import { describe, it, expect } from "vitest";
import { inAudience } from "../worker/sharedFiles.js";
import { indianMobile } from "../worker/messaging.js";
import { canRead } from "../worker/rules.js";

describe("shared file audiences", () => {
    const campus = { role: "VOLUNTEER", ambassadorType: "campus" };
    const klass = { role: "VOLUNTEER", ambassadorType: "class" };
    const vol = { role: "VOLUNTEER" };
    const stu = { role: "STUDENT" };
    const f = (audience, userIds) => ({ audience, userIds });
    it("matches each audience to the right people", () => {
        expect(inAudience(f("campus"), "u", campus)).toBe(true);
        expect(inAudience(f("campus"), "u", klass)).toBe(false);
        expect(inAudience(f("class"), "u", klass)).toBe(true);
        expect(inAudience(f("ambassadors"), "u", campus) && inAudience(f("ambassadors"), "u", klass)).toBe(true);
        expect(inAudience(f("ambassadors"), "u", vol)).toBe(false);
        expect(inAudience(f("volunteers"), "u", vol) && inAudience(f("volunteers"), "u", klass)).toBe(true);
        expect(inAudience(f("volunteers"), "u", stu)).toBe(false);
        expect(inAudience(f("everyone"), "u", stu)).toBe(true);
        expect(inAudience(f("selected", ["a", "b"]), "a", stu)).toBe(true);
        expect(inAudience(f("selected", ["a", "b"]), "c", campus)).toBe(false);
        expect(inAudience(f("everyone"), "u", null)).toBe(false);
        expect(inAudience(f("bogus"), "u", campus)).toBe(false);
    });
    it("file metadata and broadcast logs are super-admin only", async () => {
        const ctx = (role, email = "x@example.com") => ({ auth: { uid: "u", email }, profile: async () => ({ role }) });
        expect(await canRead("sharedFiles", ctx("ADMIN"))).toBe(false);
        expect(await canRead("broadcasts", ctx("VOLUNTEER"))).toBe(false);
        expect(await canRead("broadcasts", ctx("SUPER_ADMIN", "hussainkmajmal786@gmail.com"))).toBe(true);
    });
});

describe("Indian mobile numbers", () => {
    it("normalises common formats", () => {
        expect(indianMobile("+91 98765 43210")).toBe("9876543210");
        expect(indianMobile("919876543210")).toBe("9876543210");
        expect(indianMobile("09876543210")).toBe("9876543210");
        expect(indianMobile("98765-43210")).toBe("9876543210");
    });
    it("rejects invalid numbers", () => {
        expect(indianMobile("12345")).toBeNull();
        expect(indianMobile("5876543210")).toBeNull();   // must start 6-9
        expect(indianMobile("")).toBeNull();
        expect(indianMobile(undefined)).toBeNull();
    });
});
