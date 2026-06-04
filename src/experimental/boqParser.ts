import type { ParsedReview } from "../types.js";

function getPath(value: unknown, path: number[]): unknown {
    let current = value;
    for (const index of path) {
        if (!Array.isArray(current)) return undefined;
        current = current[index];
    }
    return current;
}

function stringOrEmpty(value: unknown): string {
    return typeof value === "string" ? value : "";
}

function stringOrDefault(value: unknown, fallback: string): string {
    const text = stringOrEmpty(value);
    return text.length > 0 ? text : fallback;
}

function stringOrNull(value: unknown): string | null {
    return typeof value === "string" && value.length > 0 ? value : null;
}

function numberOrZero(value: unknown): number {
    return typeof value === "number" ? value : 0;
}

function valueOrNull(value: unknown): unknown | null {
    return value ?? null;
}

/**
 * Parses one raw GetLocalBoqProxy review array into the standard ParsedReview format.
 * @param {unknown} review - Review data from GetLocalBoqProxy.
 * @returns {ParsedReview | null} Parsed review data, or null when input is malformed.
 */
function _parseReview(review: unknown): ParsedReview | null {
    if (!Array.isArray(review)) return null;

    const imagesData = review[13];
    const images = Array.isArray(imagesData) ? imagesData.map((image: unknown) => ({
        id: stringOrEmpty(getPath(image, [3])),
        url: stringOrEmpty(getPath(image, [0])),
        size: { width: 0, height: 0 },
        location: { lat: 0, long: 0 },
        caption: null
    })) : null;

    return {
        review_id: stringOrEmpty(review[5]),
        time: {
            published: valueOrNull(getPath(review, [2, 0])),
            last_edited: null
        },
        author: {
            name: stringOrDefault(getPath(review, [3, 0]), "A Google User"),
            profile_url: stringOrEmpty(getPath(review, [3, 1])),
            url: stringOrEmpty(getPath(review, [3, 2])),
            id: "Unknown"
        },
        review: {
            rating: numberOrZero(review[1]),
            text: stringOrNull(review[11]),
            language: null
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
