/**
 * Generates the URL for the GetLocalBoqProxy endpoint.
 * @param {string} placeId - The CID of the place.
 * @param {1|2|3|4} sortOrder - The sort order (1: Most Relevant, 2: Newest, 3: Highest Rating, 4: Lowest Rating).
 * @param {string} paginationToken - The base64 pagination token.
 * @returns {string} The full URL.
 */
export default function getBoqUrl(placeId: string, sortOrder: 1 | 2 | 3 | 4, paginationToken = "") {
    let reqpld: any[];

    if (!paginationToken) {
        // Initial request includes the sort order
        reqpld = [null, [null, null, null, null, null, null, null, null, null, [null, 1, null, null, null, null, null, null, null, sortOrder, null, [placeId]]]];
    } else {
        // Paginated requests drop the sort order and include the token at index 19
        reqpld = [null, [null, null, null, null, null, null, null, null, null, [null, 1, null, null, null, null, null, null, null, null, null, [placeId], null, null, null, null, null, null, null, paginationToken]]];
    }

    const payloadStr = JSON.stringify(reqpld);
    return `https://www.google.com/httpservice/web/PrivateLocalSearchUiDataService/GetLocalBoqProxy?msc=gwsrpc&reqpld=${encodeURIComponent(payloadStr)}`;
}
