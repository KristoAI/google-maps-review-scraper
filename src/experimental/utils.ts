import { createClient } from "../client.js";
import getBoqUrl from "./boqEndpoint.js";
import boqParser from "./boqParser.js";

export async function fetchBoqReviews(placeId: string, sort: 1 | 2 | 3 | 4, paginationToken = "") {
    const apiUrl = getBoqUrl(placeId, sort, paginationToken);
    const client = createClient();

    const response = await client.fetch(apiUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch experimental endpoint: ${response.status} ${response.statusText}`);
    }

    const textData = await response.text();

    const parts = textData.split(")]}'");
    const rawJson = parts.length > 1 ? parts[1] : parts[0];

    if (!rawJson) {
        throw new Error("No valid JSON data found in the response.");
    }

    return JSON.parse(rawJson);
}

export async function paginateBoqReviews(
    placeId: string,
    sort: 1 | 2 | 3 | 4,
    pages: string | number,
    clean: boolean
) {
    const initialData = await fetchBoqReviews(placeId, sort, "");

    // Check if valid data
    if (!initialData || !Array.isArray(initialData) || initialData.length < 2) {
        return [];
    }

    const mainPayload = initialData[1];
    if (!mainPayload || !Array.isArray(mainPayload) || mainPayload.length <= 10 || !mainPayload[10]) {
        return [];
    }

    const node = mainPayload[10];
    if (!Array.isArray(node) || node.length < 3 || !Array.isArray(node[2])) {
        return [];
    }

    let allReviews = [...node[2]];
    let nextToken = node.length > 6 && typeof node[6] === 'string' ? node[6] : "";

    if (!nextToken || Number(pages) === 1) {
        return clean ? boqParser(allReviews) : allReviews;
    }

    const maxReviews = pages === "max" ? Infinity : Number(pages) * 10;

    while (nextToken && allReviews.length < maxReviews) {
        try {
            const data = await fetchBoqReviews(placeId, sort, nextToken);

            const mPayload = data[1];
            if (!mPayload || !mPayload[10]) break;

            const mNode = mPayload[10];
            if (!Array.isArray(mNode) || mNode.length < 3 || !Array.isArray(mNode[2])) break;

            allReviews.push(...mNode[2]);

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
