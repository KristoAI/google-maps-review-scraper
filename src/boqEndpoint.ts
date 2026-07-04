export interface BoqUrl {
  placeId: string;
  sortOrder: 1 | 2 | 3 | 4;
  paginationToken?: string;
}

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
