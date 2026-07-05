export interface BoqUrl {
  placeId: string;
  sortOrder: 1 | 2 | 3 | 4;
  paginationToken?: string;
}

/**
 * Build the BOQ API endpoint URL for fetching Google Maps reviews.
 *
 * @param options          - The URL components.
 * @param options.placeId  - The Google Place ID.
 * @param options.sortOrder - Sort order: 1 (most relevant), 2 (newest), 3 (highest), 4 (lowest).
 * @param options.paginationToken - Optional pagination token for subsequent pages.
 * @returns The full BOQ proxy URL.
 */
export default function getBoqUrl({ placeId, sortOrder, paginationToken = "" }: BoqUrl): string {
  let reqpld: unknown[];

  if (!paginationToken) {
    reqpld = [null, [null, null, null, null, null, null, null, null, null, [null, sortOrder, null, null, null, null, null, null, null, 10, null, [placeId]]]];
  } else {
    reqpld = [null, [null, null, null, null, null, null, null, null, null, [null, sortOrder, null, null, null, null, null, null, null, null, null, [placeId], null, null, null, null, null, null, null, paginationToken]]];
  }

  const payloadStr = JSON.stringify(reqpld);
  return `https://www.google.com/httpservice/web/PrivateLocalSearchUiDataService/GetLocalBoqProxy?msc=gwsrpc&reqpld=${encodeURIComponent(payloadStr)}`;
}
