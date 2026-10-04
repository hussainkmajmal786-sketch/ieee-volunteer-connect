import { describe, it, expect } from "vitest";
import { applySet, applyUpdate, buildQuery, parsePath, splitDocPath } from "../worker/docstore.js";

describe("field transforms", () => {
    const now = 1_700_000_000_000;
    it("updateDoc: dotted paths, increment, arrayUnion/Remove, serverTimestamp, deleteField", () => {
        const before = { participants: 2, refCounts: { a: 1 }, completedBy: ["x"], old: 1 };
        const after = applyUpdate(before, {
            participants: { __op: "increment", n: 1 },
            "refCounts.a": { __op: "increment", n: 2 },
            "refCounts.b": { __op: "increment", n: 1 },
            completedBy: { __op: "arrayUnion", values: ["x", "y"] },
            at: { __op: "serverTimestamp" },
            old: { __op: "deleteField" },
        }, { now });
        expect(after).toEqual({ participants: 3, refCounts: { a: 3, b: 1 }, completedBy: ["x", "y"], at: { __ts: now } });
        expect(before.refCounts.a).toBe(1); // input untouched
        expect(applyUpdate({ tags: ["a", "b"] }, { tags: { __op: "arrayRemove", values: ["a"] } }).tags).toEqual(["b"]);
    });
    it("setDoc replaces, setDoc merge keeps other fields", () => {
        expect(applySet({ a: 1, b: 2 }, { a: 5 })).toEqual({ a: 5 });
        expect(applySet({ a: 1, b: 2 }, { a: 5 }, { merge: true })).toEqual({ a: 5, b: 2 });
        expect(applySet(null, { createdAt: { __op: "serverTimestamp" } }, { now })).toEqual({ createdAt: { __ts: now } });
    });
    it("rejects unknown transforms and bad field names", () => {
        expect(() => applyUpdate({}, { a: { __op: "evil" } })).toThrow();
        expect(() => applyUpdate({}, { "a'); DROP": 1 })).toThrow();
    });
});

describe("paths", () => {
    it("validates document vs collection paths", () => {
        expect(splitDocPath("events/e1/registrations/u1")).toEqual({ parent: "events/e1/registrations", id: "u1" });
        expect(() => parsePath("events", "doc")).toThrow();
        expect(() => parsePath("events/e1", "collection")).toThrow();
        expect(() => parsePath("events/../x", "collection")).toThrow();
        expect(() => parsePath("events//x", "doc")).toThrow();
    });
});

describe("query builder", () => {
    it("binds values as parameters and never interpolates them", () => {
        const { sql, params } = buildQuery("users", {
            filters: [{ field: "role", op: "in", value: ["VOLUNTEER", "ADMIN"] }, { field: "name", op: "==", value: "x' OR 1=1 --" }],
            orderBy: [{ field: "points", dir: "desc" }],
            limit: 10,
        });
        expect(sql).not.toContain("OR 1=1");
        expect(params).toEqual(["users", "VOLUNTEER", "ADMIN", "x' OR 1=1 --"]);
        expect(sql).toMatch(/ORDER BY .* DESC, id ASC LIMIT 10$/s);
    });
    it("compares timestamps as epoch ms and supports counts", () => {
        const { params } = buildQuery("linkClicks", { filters: [{ field: "timestamp", op: ">=", value: { __ts: 5 } }] });
        expect(params).toEqual(["linkClicks", 5]);
        expect(buildQuery("linkClicks", { count: true }).sql).toMatch(/^SELECT COUNT\(\*\)/);
    });
    it("rejects injection through field names, operators and limits", () => {
        expect(() => buildQuery("users", { orderBy: [{ field: "points') --", dir: "asc" }] })).toThrow();
        expect(() => buildQuery("users", { filters: [{ field: "a", op: "LIKE", value: 1 }] })).toThrow();
        expect(() => buildQuery("users", { limit: "1; DROP TABLE docs" })).toThrow();
    });
});
