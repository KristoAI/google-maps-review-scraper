import type { ParsedReview } from "./types.js";

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
 * Parses an array of reviews and returns an array of typed reviews.
 * @param {unknown} reviews - Array of review data wrappers.
 * @returns {ParsedReview[]} An array of the parsed reviews.
 */
export default function parseReviews(reviews: unknown): ParsedReview[] {
	if (!Array.isArray(reviews)) return [];

	const parsedReviews = reviews.map((item): ParsedReview | null => {
		const review = Array.isArray(item) && Array.isArray(item[0]) ? item[0] : item;

		// Safety check for empty or malformed review wrappers
		if (!Array.isArray(review)) return null;

		const responseData = review[3];
		const hasResponse = !!getPath(responseData, [14, 0, 0]);
		const imagesData = getPath(review, [2, 2]);

		return {
			review_id: stringOrEmpty(review[0]),
			time: {
				published: valueOrNull(getPath(review, [1, 2])),
				last_edited: valueOrNull(getPath(review, [1, 3])),
			},
			author: {
				name: stringOrEmpty(getPath(review, [1, 4, 5, 0])),
				profile_url: stringOrEmpty(getPath(review, [1, 4, 5, 1])),
				url: stringOrEmpty(getPath(review, [1, 4, 5, 2, 0])),
				id: stringOrEmpty(getPath(review, [1, 4, 5, 3])),
			},
			review: {
				rating: numberOrZero(getPath(review, [2, 0, 0])),
				text: stringOrNull(getPath(review, [2, 15, 0, 0])),
				language: stringOrNull(getPath(review, [2, 14, 0])),
			},
			images: Array.isArray(imagesData) ? imagesData.map((image: unknown) => ({
				id: stringOrEmpty(getPath(image, [0])),
				url: stringOrEmpty(getPath(image, [1, 6, 0])),
				size: {
					width: numberOrZero(getPath(image, [1, 6, 2, 0])),
					height: numberOrZero(getPath(image, [1, 6, 2, 1])),
				},
				location: {
					friendly: stringOrEmpty(getPath(image, [1, 21, 3, 7, 0])),
					lat: numberOrZero(getPath(image, [1, 8, 0, 2])),
					long: numberOrZero(getPath(image, [1, 8, 0, 1])),
				},
				caption: stringOrNull(getPath(image, [1, 21, 3, 5, 0])),
			})) : null,
			source: stringOrEmpty(getPath(review, [1, 13, 0])),
			response: hasResponse ? {
				text: stringOrNull(getPath(responseData, [14, 0, 0])),
				time: {
					published: valueOrNull(getPath(responseData, [1])),
					last_edited: valueOrNull(getPath(responseData, [2])),
				},
			} : null
		};
	}).filter((r): r is ParsedReview => r !== null); // Remove any failed parses

	return parsedReviews;
}
