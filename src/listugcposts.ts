import type { ListUgcPosts } from "./types.js";

/**
 * Converts a Google Maps place URL to a listugcposts endpoint URL.
 * @param {string} placeId Google Maps Place ID.
 * @param {1|2|3|4} sortOrder Sorting order (1: Most Relevant, 2: Newest, 3: Highest Rating, 4: Lowest Rating).
 * @param {string} [page=""] Base64 encoding of the page number.
 * @param {string} [searchQuery=""] Search query for filtering reviews.
 * @param {string} sessionToken Session token for authentication.
 * @returns {URL} URL to fetch reviews.
 * @throws Will throw an error if the URL is invalid.
 */
export default function ({ placeId, sortOrder, page = "", searchQuery = "", sessionToken }: ListUgcPosts): URL {
  const type = searchQuery ? "1m7" : "1m6";
  const _sq = searchQuery ? `!3s${encodeURIComponent(searchQuery)}` : "";
  return new URL(`https://www.google.com/maps/rpc/listugcposts?authuser=0&hl=en&gl=US&pb=!${type}!1s${placeId}${_sq}!6m4!4m1!1e1!4m1!1e3!2m2!1i10!2s${page}!5m2!1s${sessionToken}!7e81!8m9!2b1!3b1!5b1!7b1!12m4!1b1!2b1!4m1!1e1!11m4!1e3!2e1!6m1!1i2!13m1!1e${sortOrder}`);
}
