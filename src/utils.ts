import listugcposts from "./listugcposts.js";
import { SortEnum, type JsonArray, type Paginate, type ParsedReview, type Reviews, type Validate } from "./types.js";
import parser from "./parser.js";

/**
 * Validates parameters for the Google Maps review scraper.
 * @param {string} url - The URL of the Google Maps location to scrape reviews from.
 * @param {string} sort_type - The type of sorting for the reviews ("relevant", "newest", "highest_rating", "lowest_rating").
 * @param {"max" | number} pages - The number of pages to scrape (default is "max"). If set to a number, it will scrape that number of pages (results will be 10 * pages) or until there are no more reviews.
 * @param {boolean} clean - Whether to return clean reviews or not.
 */
export function validateParams({ url, sort_type, pages, clean }: Validate) {
    try {
        const parsedUrl = new URL(url);
        // Google Maps URLs can be google.com/maps/place/ or maps.app.goo.gl
        // If you strictly want the desktop web version:
        if (!parsedUrl.host.includes("google.com")) {
            throw new Error(`Invalid host: ${parsedUrl.host}`);
        }
    } catch (e) {
        throw new Error(`Invalid URL format: ${url}`);
    }

    if (!(sort_type in SortEnum)) {
        throw new Error(`Invalid sort type: ${sort_type}. Expected: ${Object.keys(SortEnum).join(", ")}`);
    }

    if (pages !== "max" && isNaN(Number(pages))) {
        throw new Error(`Invalid pages value: ${pages}`);
    }

    if (typeof clean !== "boolean") {
        throw new Error(`Invalid value for 'clean': ${clean}`);
    }
}

/**
 * Fetches and handles the XSSI security prefix.
 * @param {string} placeId - The CID (e.g., 0x3ae2575b18d322ff:0x3c53adf6ab35b12b)
 * @param {1 | 2 | 3 | 4} sortOrder - The type of sorting for the reviews (1: Most Relevant, 2: Newest, 3: Highest Rating, 4: Lowest Rating).
 * @param {string} page - The page token for pagination.
 * @param {string} searchQuery - The search query to filter reviews.
 * @param {string} sessionToken - The session token for authentication.
 * @param {Impit} client - The hydrated client instance.
 * @returns {Promise<JsonArray>} The parsed Google Maps response array.
 */
export async function fetchReviews({ placeId, sortOrder, page, searchQuery, sessionToken, client }: Reviews): Promise<JsonArray> {
    const apiUrl = listugcposts({ placeId, sortOrder, page, searchQuery, sessionToken });
    const response = await client.fetch(apiUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const textData = await response.text();

    // Safety check for the prefix before splitting
    const parts = textData.split(")]}'");
    const rawJson = parts.length > 1 ? parts[1] : parts[0];

    if (!rawJson) {
        throw new Error("No valid JSON data found in the response.");
    }

    const data: unknown = JSON.parse(rawJson);
    if (!Array.isArray(data)) {
        throw new Error("Invalid JSON data found in the response.");
    }

    return data as JsonArray;
}

/**
 * Paginates through reviews.
 * @param {string} placeId - The CID (e.g., 0x3ae2575b18d322ff:0x3c53adf6ab35b12b)
 * @param {1 | 2 | 3 | 4} sortOrder - The type of sorting for the reviews (1: Most Relevant, 2: Newest, 3: Highest Rating, 4: Lowest Rating).
 * @param {"max" | number} pages - The number of pages to scrape (default is "max"). If set to a number, it will scrape that number of pages (results will be 10 * pages) or until there are no more reviews.
 * @param {string} searchQuery - The search query to filter reviews.
 * @param {boolean} clean - Whether to return clean reviews or not.
 * @param {string} sessionToken - The session token for authentication.
 * @param {Impit} client - The hydrated client instance.
 * @returns {Promise<ParsedReview[] | JsonArray>} Parsed reviews when clean is true, otherwise raw review data.
 */
export async function paginateReviews({ placeId, sortOrder, pages, searchQuery, sessionToken, client, clean }: Paginate): Promise<ParsedReview[] | JsonArray> {
    const initialData = await fetchReviews({ placeId, sortOrder, page: "", searchQuery, sessionToken, client });

    if (!initialData || !Array.isArray(initialData[2]) || initialData[2].length === 0) {
        return [];
    }

    let allReviews = [...(initialData[2] || [])];
    let nextToken = initialData[1]?.toString().replace(/"/g, "");

    if (!nextToken || Number(pages) === 1) {
        return clean ? parser(allReviews) : allReviews;
    }

    const max = pages === "max" ? Infinity : Number(pages);
    let pageCount = 1;

    while (nextToken && pageCount < max) {
        try {
            const data = await fetchReviews({ placeId, sortOrder, page: nextToken, searchQuery, sessionToken, client });

            if (!Array.isArray(data)) break;

            if (Array.isArray(data[2]) && data[2].length > 0) {
                allReviews.push(...data[2]);
            }

            // Update nextToken for the next iteration
            const newNextToken = data[1]?.toString().replace(/"/g, "");

            if (!newNextToken || newNextToken === nextToken) {
                break;
            }

            nextToken = newNextToken;
            pageCount++;

        } catch (error) {
            console.error("Error fetching page:", error);
            break;
        }
    }

    return clean ? parser(allReviews) : allReviews;

}
