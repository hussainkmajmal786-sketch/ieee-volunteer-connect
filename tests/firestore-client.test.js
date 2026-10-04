import { describe, it, expect } from "vitest";
import { encode, decode, Timestamp, collection, doc, query, where, orderBy, limit, db, increment, arrayUnion } from "../src/lib/firestore.js";

describe("client value encoding", () => {
    it("round-trips timestamps and keeps sentinels", () => {
        const d = new Date(1234);
        const wire = encode({ at: d, nested: { t: Timestamp.fromMillis(5) }, n: increment(2), u: arrayUnion(d), skip: undefined });
        expect(wire).toEqual({ at: { __ts: 1234 }, nested: { t: { __ts: 5 } }, n: { __op: "increment", n: 2 }, u: { __op: "arrayUnion", values: [{ __ts: 1234 }] } });
        const back = decode({ at: { __ts: 1234 }, list: [{ __ts: 7 }] });
        expect(back.at).toBeInstanceOf(Timestamp);
        expect(back.at.toDate().getTime()).toBe(1234);
        expect(back.list[0].toMillis()).toBe(7);
    });
});

describe("references and queries", () => {
    it("builds Firestore-shaped paths", () => {
        expect(collection(db, "events", "e1", "registrations").path).toBe("events/e1/registrations");
        expect(doc(db, "users", "u1").path).toBe("users/u1");
        expect(doc(collection(db, "events"), "e1").path).toBe("events/e1");
        expect(doc(collection(db, "events")).path).toMatch(/^events\/[A-Za-z0-9]{20}$/);
        expect(() => doc(db, "events")).toThrow();
    });
    it("collects constraints into a query spec", () => {
        const q = query(collection(db, "users"), where("role", "==", "VOLUNTEER"), orderBy("points", "desc"), limit(5));
        expect(q).toEqual({
            type: "query", parent: "users",
            spec: { filters: [{ field: "role", op: "==", value: "VOLUNTEER" }], orderBy: [{ field: "points", dir: "desc" }], limit: 5 },
        });
    });
});
