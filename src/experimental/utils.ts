import getBoqUrl from "./boqEndpoint.js";
import boqParser from "./boqParser.js";
import type { BoqPaginate, BoqReviews } from "./types.js";
import type { JsonObject } from "../types.js"

/**
 * Fetches a single page of Google Maps reviews using the experimental BOQ (Backend Query) endpoint.
 *
 * The BOQ endpoint returns a nested JSON structure wrapped in a `)]}'` security prefix,
 * which must be stripped before parsing. This function handles that prefix removal,
 * parses the response, and returns the raw deserialized data for further processing.
 *
 * @param placeId - The Google Maps Place ID to fetch reviews for.
 * @param sortOrder - Sort order for reviews: `1` (Most Relevant), `2` (Newest), `3` (Highest Rating), `4` (Lowest Rating).
 * @param client - The HTTP client instance (Impit) used to make the fetch request.
 * @param paginationToken - An optional pagination token (default: `""`) returned from a previous BOQ response
 *                          to retrieve the next page of reviews. Pass `""` for the first page.
 * @returns The parsed JSON payload from the BOQ endpoint.
 * @throws Will throw if the HTTP response is not OK or if no valid JSON data is found after stripping the prefix.
 */
export async function fetchBoqReviews({ placeId, sortOrder, client, paginationToken = "" }: BoqReviews): Promise<JsonObject> {
    const apiUrl = getBoqUrl({ placeId, sortOrder, paginationToken });
    const response = await client.fetch(apiUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch experimental endpoint: ${response.status} ${response.statusText}`);
    }

    const textData = await response.text();

    // Strip the security prefix ")]}'" that Google prepends to responses
    const parts = textData.split(")]}'");
    const rawJson = parts.length > 1 ? parts[1] : parts[0];

    if (!rawJson) {
        throw new Error("No valid JSON data found in the response.");
    }

    return JSON.parse(rawJson);
}

/**
 * Paginates through multiple pages of BOQ reviews until the requested number of pages is reached
 * or there are no more pagination tokens available.
 *
 * The BOQ response nests review data at `response[1][10][2]`, with an optional pagination
 * continuation token at `response[1][10][6]`. This function handles extracting reviews from
 * that structure, paginating through subsequent pages, and optionally cleaning/parsing the
 * raw nested arrays into structured objects via `boqParser`.
 *
 * @param placeId - The Google Maps Place ID to fetch reviews for.
 * @param sortOrder - Sort order for reviews: `1` (Most Relevant), `2` (Newest), `3` (Highest Rating), `4` (Lowest Rating).
 * @param pages - Number of pages to fetch. Each page yields ~10 reviews. Use the string `"max"` to fetch all available pages.
 * @param clean - If `true`, raw nested review arrays are parsed into structured objects using `boqParser`.
 *                If `false`, the raw array data is returned as-is.
 * @param client - The HTTP client instance (Impit) used for all fetch requests.
 * @returns An array of reviews — either raw nested arrays (if `clean` is `false`) or parsed review objects (if `clean` is `true`).
 *          Returns an empty array if no valid data is found or if an error occurs during pagination.
 */
export async function paginateBoqReviews({ placeId, sortOrder, pages, clean, client }: BoqPaginate) {
    const initialData = await fetchBoqReviews({ placeId, sortOrder, client });

    // Validate the structure of the initial response
    // Expected shape: [number, [...reviews...], ...]
    if (!initialData || !Array.isArray(initialData) || initialData.length < 2) {
        return [];
    }

    // The main payload is at index 1; reviews node is at index 10 of that payload
    const mainPayload = initialData[1];
    if (!mainPayload || !Array.isArray(mainPayload) || mainPayload.length <= 10 || !mainPayload[10]) {
        return [];
    }

    // Extract the reviews array (index 2) and optional pagination token (index 6) from the node
    const node = mainPayload[10];
    if (!Array.isArray(node) || node.length < 3 || !Array.isArray(node[2])) {
        return [];
    }

    let allReviews = [...node[2]];
    let nextToken = node.length > 6 && typeof node[6] === 'string' ? node[6] : "";

    // If no more pages to fetch, return immediately
    if (!nextToken || Number(pages) === 1) {
        return clean ? boqParser(allReviews) : allReviews;
    }

    // Calculate total review limit: ~10 reviews per page
    const maxReviews = pages === "max" ? Infinity : Number(pages) * 10;

    // Paginate through subsequent pages
    while (nextToken && allReviews.length < maxReviews) {
        try {
            const data = await fetchBoqReviews({ placeId, sortOrder, client, paginationToken: nextToken });

            const mPayload = data[1];

            if (!Array.isArray(mPayload)) break;

            if (!mPayload || !mPayload[10]) break;

            const mNode = mPayload[10];
            if (!Array.isArray(mNode) || mNode.length < 3 || !Array.isArray(mNode[2])) break;

            allReviews.push(...mNode[2]);

            // Extract the next pagination token; stop if it's missing or unchanged (prevents infinite loops)
            const newNextToken = mNode.length > 6 && typeof mNode[6] === 'string' ? mNode[6] : "";

            if (!newNextToken || newNextToken === nextToken) {
                break;
            }

            nextToken = newNextToken;
        } catch (error) {
            console.error("\x1b[31mError fetching BOQ page:\x1b[0m", error);
            break;
        }
    }

    // Truncate to maxReviews if not "max"
    if (pages !== "max" && allReviews.length > maxReviews) {
        allReviews = allReviews.slice(0, maxReviews);
    }

    return clean ? boqParser(allReviews) : allReviews;
}
