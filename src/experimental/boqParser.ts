import { getPath, numberOrZero, stringOrDefault, stringOrEmpty } from "../sharedParser.js";
import type { ParsedReview } from "../types.js";

interface ImageEntry {
    id: string;
    url: string;
}

function _toImageEntry(image: unknown): ImageEntry {
    return {
        id: stringOrEmpty(getPath(image, [3])),
        url: stringOrEmpty(getPath(image, [0])),
    };
}

function _isImageCandidate(item: unknown): boolean {
    if (!Array.isArray(item) || typeof item[0] !== "string") return false;
    if (item[0].includes("googleusercontent")) return true;
    return (item[0].startsWith("//") || item[0].startsWith("http")) && !item[0].includes("gstatic.com");
}

function _findImages(review: unknown[], until: number): ParsedReview["images"] {
    for (let i = 6; i < until; i++) {
        const el = review[i];
        if (!Array.isArray(el) || el.length === 0) continue;
        const entries: unknown[] = [];
        for (const item of el) {
            if (_isImageCandidate(item)) entries.push(item);
        }
        if (entries.length === 0) continue;
        return entries.map(_toImageEntry).map(entry => ({
            ...entry,
            size: { width: 0, height: 0 },
            location: { lat: 0, long: 0 },
            caption: null,
        }));
    }
    return null;
}

function _lastIndex<T>(arr: T[], predicate: (v: T | undefined) => boolean): number {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i])) return i;
    }
    return -1;
}

function _parseReview(review: unknown): ParsedReview | null {
    if (!Array.isArray(review) || review.length < 5) return null;

    const rating = numberOrZero(review[1]);

    const timeArr = review[2];
    const published = Array.isArray(timeArr) ? (timeArr[2] ?? null) : null;

    const authorArr = review[3];
    const authorName = stringOrDefault(Array.isArray(authorArr) ? authorArr[0] : null, "A Google User");
    const authorProfileUrl = stringOrEmpty(Array.isArray(authorArr) ? authorArr[1] : null);
    const authorUrl = stringOrEmpty(Array.isArray(authorArr) ? authorArr[2] : null);
    let authorId = "Unknown";
    if (typeof authorUrl === "string") {
        const match = authorUrl.match(/\/contrib\/(\d+)/);
        if (match?.[1]) authorId = match[1];
    }

    const reviewId = stringOrEmpty(review[5]);

    // Locate the "Google" source entry (fixed tail anchor)
    const googleIdx = _lastIndex(review, el => Array.isArray(el) && el[0] === "Google");
    if (googleIdx === -1) return null;

    // Locate QA data — an array where el[0][0][0] is a string (e.g. "TTD_DAY_OF_VISIT")
    // QA block is the boundary: text lives before it, images may appear near it
    const qaIdx = _lastIndex(
        review.slice(6, googleIdx),
        el => typeof getPath(el, [0, 0, 0]) === "string",
    );
    const qaOffset = qaIdx === -1 ? -1 : qaIdx + 6; // adjust for slice offset

    // Extract text region: [ language?, fullText, shortText, imageCount, QA… ]
    let fullText: string | null = null;
    let shortText: string | null = null;
    let language: string | null = null;

    if (qaOffset !== -1) {
        if (typeof review[qaOffset - 2] === "string") shortText = review[qaOffset - 2];
        if (typeof review[qaOffset - 3] === "string") fullText = review[qaOffset - 3];
        if (typeof review[qaOffset - 4] === "string" && review[qaOffset - 4].length === 2) language = review[qaOffset - 4];
    }

    // Fallback: scan for any non-URL strings between the anchors
    if (!fullText && !shortText) {
        for (let i = 6; i < googleIdx; i++) {
            if (typeof review[i] === "string" && review[i].length > 5 && !review[i].startsWith("http")) {
                if (!fullText) fullText = review[i];
                else if (review[i] !== fullText && !shortText) shortText = review[i];
            }
        }
    }

    const images = _findImages(review, googleIdx);

    return {
        review_id: reviewId,
        time: { published, last_edited: null },
        author: {
            name: authorName,
            profile_url: authorProfileUrl,
            url: authorUrl,
            id: authorId,
        },
        review: { rating, text: fullText ?? shortText, language },
        images,
        source: "Google Local Search Panel",
        response: null,
    };
}

/**
 * Parses raw GetLocalBoqProxy review arrays into the standard ParsedReview format.
 * @param {unknown} reviews - Array of review data from GetLocalBoqProxy.
 * @returns {ParsedReview[]} An array of parsed reviews.
 */
export default function boqParser(reviews: unknown): ParsedReview[] {
    if (!Array.isArray(reviews)) return [];
    return reviews.reduce<ParsedReview[]>((acc, r) => {
        const parsed = _parseReview(r);
        if (parsed) acc.push(parsed);
        return acc;
    }, []);
}
