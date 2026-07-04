# Endpoint: getlocalboqproxy

## Endpoint URL

```ruby
https://www.google.com/httpservice/web/PrivateLocalSearchUiDataService/GetLocalBoqProxy
```

## Parameters

- `msc`: Message Service Channel (`gwsrpc`)

- `reqpld`: JSON Payload data (`[null,[null,null,null,null,null,null,null,null,null,[null,1,null,null,null,null,null,null,null,10,null,["0x3ae3ac11ba10554f:0x7a9aff673731a301"]]]]`) [^1]

## JSON Payload Data Breakdown

1. `reqpld` - array
    1. `reqpld[0]` - null
    2. `reqpld[1]` - array
        1. `reqpld[1][0]` - null
        10. `reqpld[1][9]` - array [^2]
            1. `reqpld[1][9][0]` - null
            2. `reqpld[1][9][1]` - enum: Sorting of results [^3]
            10. `reqpld[1][9][9]` - int: Number of results per page (Fetch Limit) [^4]
            12. `reqpld[1][9][11]` - array
                1. `reqpld[1][9][11][0]` - string: `Hex String 1` and `Hex String 2` from the [place url](https://github.com/YasogaN/google-maps-review-scraper/blob/main/docs/urls/place.md#protocol-buffer-data-breakdown) separated by a colon (`:`)
            20. `reqpld[1][9][19]` - string: Base 64 encoded data of page number [^5]

[^1]: Other parameters like `channel`, `client`, `sca_esv`, `hs`, and `opi` are often present in browser requests for telemetry/anti-abuse tracking, but the endpoint functions perfectly without them.
[^2]: This is the inner array governing the list retrieval.
[^3]:| Value | Meaning (First) |
     |-------|-----------------|
     | 1     | Most Relevant   |
     | 2     | Newest          |
     | 3     | Highest Rating  |
     | 4     | Lowest Rating   |
[^4]: This determines how many reviews return in the initial fetch. E.g., `10`. On paginated requests, this becomes `null`.
[^5]: This is the pagination token extracted from the response data at `[1][10][6]`. Only present in paginated requests.

## Output Differences from listugcposts

- **Search Support**: This endpoint absolutely **does not support text searching**. Passing queries in the URL or payload will either be ignored or cause 400/500 errors.

- **Cookies**: Unlike `listugcposts`, this endpoint does not strictly require the Google Maps `kEI` session token injection or persistent auth cookies for basic read access.

- **Data Structure**: The raw JSON output is heavily flattened and optimized for UI rendering compared to the deeply nested `listugcposts` array tree.
