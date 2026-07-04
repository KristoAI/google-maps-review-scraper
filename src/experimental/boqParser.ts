import { getPath, numberOrZero, stringOrDefault, stringOrEmpty } from "../sharedParser.js";
import type { ParsedReview } from "../types.js";

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
        if (match && match[1]) authorId = match[1];
    }

    const reviewId = stringOrEmpty(review[5]);

    // Find the "Google" source entry near the end to anchor tail detection
    let googleIdx = -1;
    for (let i = review.length - 1; i >= 6; i--) {
        const el = review[i];
        if (Array.isArray(el) && el[0] === "Google") {
            googleIdx = i;
            break;
        }
    }
    if (googleIdx === -1) return null;

    // Find QA questions array by scanning backwards from googleIdx
    // QA structure: [[["TTD_...", question, ...], ...]]
    let qaIdx = -1;
    for (let i = googleIdx - 1; i >= 6; i--) {
        const el = review[i];
        if (Array.isArray(el) && el.length > 0) {
            const first = el[0];
            if (Array.isArray(first) && first.length > 0 && Array.isArray(first[0]) && typeof first[0][0] === "string") {
                qaIdx = i;
                break;
            }
        }
    }

    let fullText: string | null = null;
    let shortText: string | null = null;
    let language: string | null = null;

    if (qaIdx !== -1) {
        if (qaIdx - 2 >= 0 && typeof review[qaIdx - 2] === "string") {
            shortText = review[qaIdx - 2] as string;
        }
        if (qaIdx - 3 >= 0 && typeof review[qaIdx - 3] === "string") {
            fullText = review[qaIdx - 3] as string;
        }
        if (qaIdx - 4 >= 0 && typeof review[qaIdx - 4] === "string" && review[qaIdx - 4].length === 2) {
            language = review[qaIdx - 4] as string;
        }
    }

    // Fallback: find text by scanning for long strings between review[5] and googleIdx
    if (!fullText && !shortText) {
        for (let i = 6; i < googleIdx; i++) {
            if (typeof review[i] === "string" && review[i].length > 5 && !review[i].startsWith("http")) {
                if (!fullText) {
                    fullText = review[i];
                } else if (review[i] !== fullText && !shortText) {
                    shortText = review[i];
                }
            }
        }
    }

    // Search for image arrays across the entire review (excluding anchor fields)
    let images: ParsedReview["images"] = null;
    for (let i = 6; i < review.length; i++) {
        const el = review[i];
        if (Array.isArray(el) && el.length > 0) {
            const candidates: unknown[] = [];
            for (const item of el) {
                if (Array.isArray(item) && typeof item[0] === "string" && item[0].includes("googleusercontent")) {
                    candidates.push(item);
                }
            }
            if (candidates.length > 0) {
                images = candidates.map((image: unknown) => ({
                    id: stringOrEmpty(getPath(image, [3])),
                    url: stringOrEmpty(getPath(image, [0])),
                    size: { width: 0, height: 0 },
                    location: { lat: 0, long: 0 },
                    caption: null
                }));
                break;
            }
        }
    }

    // Enhance image detection: some image URLs use protocol-relative paths
    if (!images) {
        for (let i = 6; i < review.length; i++) {
            const el = review[i];
            if (Array.isArray(el) && el.length > 0) {
                const candidates: unknown[] = [];
                for (const item of el) {
                    if (Array.isArray(item) && typeof item[0] === "string" && (item[0].startsWith("//") || item[0].startsWith("http")) && !item[0].includes("gstatic.com")) {
                        candidates.push(item);
                    }
                }
                if (candidates.length > 0) {
                    images = candidates.map((image: unknown) => ({
                        id: stringOrEmpty(getPath(image, [3])),
                        url: stringOrEmpty(getPath(image, [0])),
                        size: { width: 0, height: 0 },
                        location: { lat: 0, long: 0 },
                        caption: null
                    }));
                    break;
                }
            }
        }
    }

    return {
        review_id: reviewId,
        time: {
            published,
            last_edited: null
        },
        author: {
            name: authorName,
            profile_url: authorProfileUrl,
            url: authorUrl,
            id: authorId
        },
        review: {
            rating,
            text: fullText ?? shortText,
            language
        },
        images,
        source: "Google Local Search Panel",
        response: null
    };
}

/**
 * Parses raw GetLocalBoqProxy review arrays into the standard ParsedReview format.
 * @param {unknown} reviews - Array of review data from GetLocalBoqProxy.
 * @returns {ParsedReview[]} An array of parsed reviews.
 */
export default function boqParser(reviews: unknown): ParsedReview[] {
    if (!Array.isArray(reviews)) return [];

    const parsedReviews = reviews.map(_parseReview).filter((r): r is ParsedReview => r !== null);

    return parsedReviews;
}
