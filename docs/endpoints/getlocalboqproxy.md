# Endpoint: GetLocalBoqProxy

## Endpoint URL

```ruby
https://www.google.com/httpservice/web/PrivateLocalSearchUiDataService/GetLocalBoqProxy
```

## Parameters

- `msc`: Message Service Channel (`gwsrpc`)
- `reqpld`: JSON Payload containing the requested place data and pagination/sort rules.

*Note: Other parameters like `channel`, `client`, `sca_esv`, `hs`, and `opi` are often present in browser requests for telemetry/anti-abuse tracking, but the endpoint functions perfectly without them.*

## Payload Breakdown

The `reqpld` parameter accepts a rigidly structured JSON array. The structure shifts slightly depending on whether it is the initial request or a subsequent paginated request.

### Initial Request Payload

For the first request to retrieve reviews for a Place CID, the payload looks like this:

```json
[null, [null, null, null, null, null, null, null, null, null, [null, 1, null, null, null, null, null, null, null, 10, null, ["0x3ae3ac11ba10554f:0x7a9aff673731a301"]]]]
```

- Index `1` -> `[9]`: The inner array governing the list retrieval.
  - Index `1` -> `[9][1]`: **Sort Order** integer (`1` = Relevant, `2` = Newest, `3` = Highest, `4` = Lowest).
  - Index `1` -> `[9][9]`: **Fetch Limit** integer (determines how many reviews return in the initial fetch. E.g., `10`).
  - Index `1` -> `[9][11]`: Array containing the **Place CID** string.

### Paginated Request Payload

To retrieve more reviews, a pagination token is inserted. Note that the sort order must still be included in paginated requests!

```json
[null, [null, null, null, null, null, null, null, null, null, [null, 1, null, null, null, null, null, null, null, null, null, ["0x3ae3ac11ba10554f:0x7a9aff673731a301"], null, null, null, null, null, null, null, "PAGINATION_TOKEN_HERE"]]]
```

- Index `1` -> `[9][1]`: The **Sort Order** (must match the initial request).
- Index `1` -> `[9][9]`: The fetch limit becomes `null`.
- Index `1` -> `[9][19]`: The **Pagination Token** string (extracted from the response data at `[1][10][6]`).

## Output Differences from listugcposts

- **Search Support**: This endpoint absolutely **does not support text searching**. Passing queries in the URL or payload will either be ignored or cause 400/500 errors.
- **Cookies**: Unlike `listugcposts`, this endpoint does not strictly require the Google Maps `kEI` session token injection or persistent auth cookies for basic read access.
- **Data Structure**: The raw JSON output is heavily flattened and optimized for UI rendering compared to the deeply nested `listugcposts` array tree.
