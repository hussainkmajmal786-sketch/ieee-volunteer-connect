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
