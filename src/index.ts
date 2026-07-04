import { SortEnum, type JsonArray, type ParsedReview, type Scraper } from "./types.js";
import { validateParams, paginateReviews } from "./utils.js";
import fetchSessionToken from "./extraction.js";
import { createClient } from "./client.js";

/**
 * Scrapes reviews from a given Google Maps URL.
 *
 * @param {string} url - The URL of the Google Maps location to scrape reviews from.
 * @param {Object} options - The options for scraping.
 * @param {string} [options.sort_type="relevant"] - The type of sorting for the reviews ("relevant", "newest", "highest_rating", "lowest_rating").
 * @param {string} [options.search_query=""] - The search query to filter reviews.
 * @param {"max" | number} [options.pages="max"] - The number of pages to scrape (default is "max"). If set to a number, it will scrape that number of pages (results will be 10 * pages) or until there are no more reviews.
 * @param {boolean} [options.clean=false] - Whether to return clean reviews or not.
 * @param {boolean} [options.experimental=false] - Whether to use the experimental BoqProxy endpoint.
 * @param {Record<string, string>} [options.cookies] - Cookies containing __Secure-1PSID for authentication (only used for listugcposts/experimental=false).
 * @param {string} [options.proxy.proxyUrl] - Supports HTTP, HTTPS, SOCKS4 and SOCKS5 proxies.
 * @param {boolean} [options.proxy.ignoreTls] - Ignore TLS errors such as invalid certificates. Works only if proxyUrl is set.
 * @returns {Promise<Array|0>} - Returns an array of reviews or 0 if no reviews are found.
 * @throws {Error} - Throws an error if validation, session token fetching, or review fetching fails.
 */
export async function scraper(
    url: string,
    {
        sort_type = "relevant",
        search_query = "",
        pages = "max",
        clean = false,
        experimental = false,
        cookies = undefined,
        proxy: {
            proxyUrl = undefined,
            ignoreTls = false
        } = {}
    }: Scraper = {}
): Promise<ParsedReview[] | JsonArray | 0> {
    validateParams({ url, sort_type, pages, clean });

    const sortValue = SortEnum[sort_type as keyof typeof SortEnum] as 1 | 2 | 3 | 4;

    const m = [...url.matchAll(/!1s([a-zA-Z0-9_:]+)!/g)];
    if (!m[0]?.[1]) {
        throw new Error("Invalid URL");
    }
    const placeId = m[1]?.[1] ? m[1][1] : m[0][1];
    const client = createClient({ proxy: { url: proxyUrl, tls: ignoreTls }, cookies: cookies });

    if (experimental) {
        if (search_query) {
            console.warn("\x1b[33mWarning: The experimental GetLocalBoqProxy endpoint does not support search_query. The query will be ignored.\x1b[0m");
        }
        const { paginateBoqReviews } = await import("./experimental/utils.js");
        const reviews = await paginateBoqReviews({ placeId, sortOrder: sortValue, pages, clean, client });
        if (reviews.length === 0) {
            return 0;
        }
        return reviews;
    }

    const sessionToken = await fetchSessionToken({ placeId, client });

    if (!sessionToken) {
        throw new Error("Could not fetch session token.");
    }

    await new Promise(r => setTimeout(r, 2000));

    const reviews = await paginateReviews({ placeId, sortOrder: sortValue, pages, searchQuery: search_query, clean, sessionToken, client });
    if (reviews.length === 0) {
        return 0;
    }

    return reviews;
}

export { rotateCookies as rotate } from "./rotate.js";
