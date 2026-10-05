import { describe, it, expect } from "vitest";
import { safeUrl, youtubeId } from "../src/utils/links.js";

describe("links", () => {
    it("only allows http(s) links", () => {
        expect(safeUrl("https://linkedin.com/in/a")).toBe("https://linkedin.com/in/a");
        expect(safeUrl("javascript:alert(1)")).toBeNull();
        expect(safeUrl("data:text/html,x")).toBeNull();
        expect(safeUrl("")).toBeNull();
    });
    it("reads YouTube ids from common URL shapes", () => {
        for (const u of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtu.be/dQw4w9WgXcQ?t=3", "https://youtube.com/shorts/dQw4w9WgXcQ",
            "https://www.youtube.com/embed/dQw4w9WgXcQ", "https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ"]) {
            expect(youtubeId(u)).toBe("dQw4w9WgXcQ");
        }
        expect(youtubeId("https://vimeo.com/1")).toBeNull();
    });
});

import { filterOptions } from "../src/utils/search.js";
import { cleanList, COLLEGE_BRANCHES, DEPARTMENTS } from "../src/utils/constants.js";

describe("college / department pickers", () => {
    const opts = ["College of Engineering Kidangoor (CEK)", "Government Engineering College, Kottayam", "Saintgits College of Engineering, Kottayam"];
    it("matches every word in any order, prefix matches first", () => {
        expect(filterOptions(opts, "kottayam engineering")).toEqual([opts[1], opts[2]]);
        expect(filterOptions(opts, "cek")).toEqual([opts[0]]);
        expect(filterOptions(opts, "sAINT")).toEqual([opts[2]]);
        expect(filterOptions(opts, "  ")).toBe(opts);
    });
    it("cleans editable lists", () => {
        expect(cleanList([" A ", "a", "", "B", "Other (type it)", null])).toEqual(["A", "B"]);
    });
    it("default lists have no duplicates after cleaning", () => {
        expect(cleanList(COLLEGE_BRANCHES).length).toBeGreaterThan(200);
        expect(cleanList(DEPARTMENTS)).toContain("Computer Science and Engineering (CSE)");
    });
});

import { formatEventDate } from "../src/utils/format.js";

describe("formatEventDate", () => {
    it("formats stored event dates for people", () => {
        expect(formatEventDate("2026-12-12T10:00")).toMatch(/^Sat, 12 Dec 2026 · 10:00 AM$/i);
        expect(formatEventDate("2026-12-12")).toMatch(/^Sat, 12 Dec 2026$/);
        expect(formatEventDate("Next Friday")).toBe("Next Friday");
        expect(formatEventDate(undefined)).toBe("");
    });
});

import { registrationState, closesAt, cleanEventFields, feeLabel, CATEGORY_NAMES } from "../src/utils/events.js";
import { registrationClosedReason } from "../worker/functions.js";

describe("event registration state", () => {
    const now = new Date(2026, 11, 12, 9, 30).getTime(); // 12 Dec 2026, 9:30 local
    it("open, closing, full and over", () => {
        expect(registrationState({ date: "2026-12-20T10:00" }, now)).toMatchObject({ open: true, seatsLeft: null });
        expect(registrationState({ date: "2026-12-20T10:00", registrationDeadline: "2026-12-12T09:00" }, now)).toMatchObject({ open: false, reason: "deadline" });
        expect(registrationState({ date: "2026-12-20T10:00", registrationDeadline: "2026-12-12" }, now).open).toBe(true); // date-only = end of day
        expect(registrationState({ date: "2026-12-20", capacity: 50, participants: 50 }, now)).toMatchObject({ open: false, reason: "full" });
        expect(registrationState({ date: "2026-12-20", capacity: 50, participants: 42 }, now).seatsLeft).toBe(8);
        expect(registrationState({ date: "2026-12-11T10:00" }, now)).toMatchObject({ open: false, reason: "ended" });
        expect(registrationState({ date: "2026-12-11T10:00", endDate: "2026-12-13T18:00" }, now).open).toBe(true);
        expect(registrationState({ date: "someday" }, now).open).toBe(true);
    });
    it("closing order uses the deadline, else the start", () => {
        expect(closesAt({ date: "2026-12-20T10:00", registrationDeadline: "2026-12-15T17:00" })).toBe(new Date(2026, 11, 15, 17, 0).getTime());
        expect(closesAt({ date: "2026-12-20T10:00" })).toBe(new Date(2026, 11, 20, 10, 0).getTime());
    });
    it("server agrees (India time)", () => {
        const istNow = Date.UTC(2026, 11, 12, 4, 0); // 9:30 IST
        expect(registrationClosedReason({ date: "2026-12-20", registrationDeadline: "2026-12-12T09:00" }, istNow)).toMatch(/closed/);
        expect(registrationClosedReason({ date: "2026-12-20", registrationDeadline: "2026-12-12T09:31" }, istNow)).toBeNull();
        expect(registrationClosedReason({ date: "2026-12-20", capacity: 2, participants: 2 }, istNow)).toMatch(/seats/);
        expect(registrationClosedReason({ date: "2026-12-11T10:00" }, istNow)).toMatch(/over/);
    });
    it("cleans form values", () => {
        expect(cleanEventFields({ fee: "₹ 150", capacity: "", tags: "AI, python , AI,," })).toMatchObject({ fee: 150, capacity: null, tags: ["AI", "python"] });
        expect(feeLabel(0)).toBe("Free");
        expect(feeLabel(1500)).toBe("₹1,500");
        expect(CATEGORY_NAMES).toEqual(expect.arrayContaining(["Hackathon", "Tech Fest", "Project Expo", "Conclave", "Cultural", "Sports", "Other"]));
    });
});
