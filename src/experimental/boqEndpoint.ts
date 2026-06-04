import type { BoqUrl } from "./types.js";

/**
 * Generates the URL for the GetLocalBoqProxy endpoint.
 * @param {string} placeId - The CID of the place.
 * @param {1|2|3|4} sortOrder - The sort order (1: Most Relevant, 2: Newest, 3: Highest Rating, 4: Lowest Rating).
 * @param {string} paginationToken - The base64 pagination token.
 * @returns {string} The full URL.
 */
export default function getBoqUrl({ placeId, sortOrder, paginationToken = "" }: BoqUrl): string {
    let reqpld: unknown[]

    if (!paginationToken) {
        // Initial request (we pass '10' as the limit instead of 3 to speed up scraping)
        reqpld = [null, [null, null, null, null, null, null, null, null, null, [null, sortOrder, null, null, null, null, null, null, null, 10, null, [placeId]]]];
    } else {
        // Paginated requests
        reqpld = [null, [null, null, null, null, null, null, null, null, null, [null, sortOrder, null, null, null, null, null, null, null, null, null, [placeId], null, null, null, null, null, null, null, paginationToken]]];
    }

    const payloadStr = JSON.stringify(reqpld);
    return `https://www.google.com/httpservice/web/PrivateLocalSearchUiDataService/GetLocalBoqProxy?msc=gwsrpc&reqpld=${encodeURIComponent(payloadStr)}`;
}
