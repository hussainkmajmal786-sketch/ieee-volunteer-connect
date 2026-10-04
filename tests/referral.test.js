import { describe, it, expect, beforeEach } from "vitest";
import {
    rememberReferral,
    getStoredReferral,
    resolveReferral,
    buildReferralLink,
    referralFunnel,
    ambassadorRows,
    isValidRefId,
    REFERRAL_TTL_MS,
} from "../src/utils/referral";

function memoryStorage() {
    const data = new Map();
    return {
        getItem: (k) => (data.has(k) ? data.get(k) : null),
        setItem: (k, v) => data.set(k, String(v)),
    };
}

describe("referral attribution", () => {
    let storage;
    beforeEach(() => { storage = memoryStorage(); });

    it("remembers the ambassador so it survives a sign-in redirect", () => {
        rememberReferral("evt1", "amb_A", { storage, now: 1000 });
        expect(resolveReferral("evt1", null, { storage, now: 2000 })).toBe("amb_A");
    });

    it("keeps the first ambassador while the attribution is fresh", () => {
        rememberReferral("evt1", "amb_A", { storage, now: 1000 });
        rememberReferral("evt1", "amb_B", { storage, now: 5000 });
        expect(resolveReferral("evt1", "amb_B", { storage, now: 6000 })).toBe("amb_A");
    });

    it("expires stale attributions and lets a new link take over", () => {
        rememberReferral("evt1", "amb_A", { storage, now: 0 });
        const later = REFERRAL_TTL_MS + 1;
        expect(getStoredReferral("evt1", { storage, now: later })).toBeNull();
        rememberReferral("evt1", "amb_B", { storage, now: later });
        expect(getStoredReferral("evt1", { storage, now: later + 1 })).toBe("amb_B");
    });

    it("scopes attribution per event", () => {
        rememberReferral("evt1", "amb_A", { storage, now: 0 });
        expect(resolveReferral("evt2", null, { storage, now: 1 })).toBeNull();
    });

    it("rejects malformed ref ids", () => {
        expect(isValidRefId("abc/../x")).toBe(false);
        expect(isValidRefId("a".repeat(65))).toBe(false);
        rememberReferral("evt1", "bad id!", { storage, now: 0 });
        expect(resolveReferral("evt1", "<script>", { storage, now: 1 })).toBeNull();
    });

    it("survives corrupt storage", () => {
        storage.setItem("_vc_refs", "{not json");
        expect(resolveReferral("evt1", "amb_A", { storage, now: 0 })).toBe("amb_A");
    });

    it("builds an encoded referral link", () => {
        expect(buildReferralLink("https://x.app", "evt1", "amb_A")).toBe("https://x.app/r/evt1/amb_A");
    });
});

describe("referral funnel", () => {
    const event = {
        refClicks: { a: 10, b: 3, c: 1 },
        refVisitors: { a: 8, b: 2, c: 1 },
        refCounts: { a: 2, b: 2 },
    };

    it("computes per-ambassador conversion from unique visitors", () => {
        expect(referralFunnel(event, "a")).toEqual({ clicks: 10, visitors: 8, registrations: 2, conversion: 25 });
        expect(referralFunnel(event, "zzz")).toEqual({ clicks: 0, visitors: 0, registrations: 0, conversion: 0 });
    });

    it("ranks ambassadors by registrations, then visitors", () => {
        expect(ambassadorRows(event).map(r => r.refId)).toEqual(["a", "b", "c"]);
        expect(ambassadorRows({})).toEqual([]);
    });
});
