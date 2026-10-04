import { safeUrl } from "./links";

/** A project's external links: the new `links` list, or legacy github/demo fields. */
export function projectLinks(p) {
    const links = Array.isArray(p?.links) && p.links.length
        ? p.links
        : [{ label: "GitHub", url: p?.github }, { label: "Live Demo", url: p?.demo }];
    return links.map(l => ({ label: l.label || "Link", url: safeUrl(l.url) })).filter(l => l.url);
}

/** Gallery images (cover first), as URLs. */
export function projectImages(p) {
    const all = [p?.coverUrl, ...(Array.isArray(p?.images) ? p.images : [])]
        .map(i => (typeof i === "string" ? i : i?.url))
        .filter(u => typeof u === "string" && u);
    return [...new Set(all)];
}
