import { SortEnum, type JsonArray, type ParsedReview, type Scraper } from "./types.js";
import { validateParams, paginateReviews } from "./utils.js";
import { createClient } from "./client.js";

export async function scraper(
  {
    url,
    sort_type = "relevant",
    pages = -1,
    clean = false,
    proxy: {
      proxyUrl = undefined,
      ignoreTls = false
    } = {}
  }: Scraper
): Promise<ParsedReview[] | JsonArray> {
  try {
    validateParams({ url, sort_type, pages, clean });

    const sortValue = SortEnum[sort_type as keyof typeof SortEnum] as 1 | 2 | 3 | 4;

    const m = [...url.matchAll(/!1s([a-zA-Z0-9_:]+)!/g)];
    if (!m[0]?.[1]) {
      throw new Error("Invalid URL");
    }
    const placeId = m[1]?.[1] ? m[1][1] : m[0][1];

    const client = createClient({ proxy: { url: proxyUrl, tls: ignoreTls } });

    const reviews = await paginateReviews({ placeId, sortOrder: sortValue, pages, clean, client });

    if (reviews.length === 0) {
      return [];
    }

    return reviews;
  } catch (e) {
    console.error("Scraper Error:", e instanceof Error ? e.message : e);
    return [];
  }
}

