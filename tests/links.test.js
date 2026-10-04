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
