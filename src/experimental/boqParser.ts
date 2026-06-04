import type { ParsedReview } from "../types.js";
import type { BoqParserReturn } from "./types.js";

/**
 * Parses raw GetLocalBoqProxy review arrays into the standard ParsedReview format.
 * @param {unknown} reviews - Array of review data from GetLocalBoqProxy.
 * @returns {ParsedReview[]} An array of parsed reviews.
 */
function _parseReview(review: unknown): ParsedReview | null {
    if (!review || !Array.isArray(review)) return null;

    const images = Array.isArray(review[13]) ? review[13].map((imgData: any) => ({
        id: Array.isArray(imgData) ? imgData[3] : "",
        url: Array.isArray(imgData) ? imgData[0] : "",
        size: { width: 0, height: 0 },
        location: { lat: 0, long: 0 },
        caption: null
    })) : null;

    return {
        review_id: review[5] || "",
        time: {
            published: review[2] && Array.isArray(review[2]) ? review[2][0] : null,
            last_edited: null
        },
        author: {
            name: review[3] && Array.isArray(review[3]) ? review[3][0] : "A Google User",
            profile_url: review[3] && Array.isArray(review[3]) ? review[3][1] : "",
            url: review[3] && Array.isArray(review[3]) ? review[3][2] : "",
            id: "Unknown"
        },
        review: {
            rating: typeof review[1] === "number" ? review[1] : 0,
            text: review[11] || null,
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
export default function boqParser(reviews: unknown): BoqParserReturn {
    if (!Array.isArray(reviews)) return [];

    const parsedReviews = reviews.map(_parseReview).filter((r): r is ParsedReview => r !== null);

    return parsedReviews;
}
