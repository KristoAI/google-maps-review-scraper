# Endpoint: getlocalboqproxy

## Endpoint URL

```ruby
https://www.google.com/httpservice/web/PrivateLocalSearchUiDataService/GetLocalBoqProxy
```

## Parameters

- `msc`: Message Service Channel (`gwsrpc`)

- `reqpld`: JSON Payload data (`[null,[null,null,null,null,null,null,null,null,null,[null,1,null,null,null,null,null,null,null,3,null,["0x3ae259f98bd912ed:0xdcc9ab545593fc1b",null,null,"/g/11c504y4md"],null,null,"",null,[1,1,null,[[3],[4],[5],[6],[7]]],null,null,null,null,null,null,0]]]`) [^1]

## JSON Payload Data Breakdown

1. `reqpld` - array
    1. `reqpld[0]` - null
    2. `reqpld[1]` - array
        1. `reqpld[1][0]` - null
        10. `reqpld[1][9]` - array [^2]
            1. `reqpld[1][9][0]` - null
            2. `reqpld[1][9][1]` - enum: Sorting of results [^3]
            10. `reqpld[1][9][9]` - int: Number of results (initial) / `null` (paginated) [^4]
            12. `reqpld[1][9][11]` - array [^5]
                1. `reqpld[1][9][11][0]` - string: `Hex String 1:Hex String 2` from the place URL
                2. `reqpld[1][9][11][1]` - null
                3. `reqpld[1][9][11][2]` - null
                4. `reqpld[1][9][11][3]` - string: Place short URL slug (e.g. `/g/11c504y4md`)
            16. `reqpld[1][9][15]` - null
            17. `reqpld[1][9][16]` - array [^6]
                1. `reqpld[1][9][16][0]` - int: `1`
                2. `reqpld[1][9][16][1]` - int: `1`
                3. `reqpld[1][9][16][2]` - null
                4. `reqpld[1][9][16][3]` - array of category selectors
                    1. `[3]` - rating level
                    2. `[4]` - rating level
                    3. `[5]` - rating level
                    4. `[6]` - rating level
                    5. `[7]` - rating level
            21. `reqpld[1][9][20]` - string: Base 64 encoded pagination token [^7] (paginated requests only)
            24. `reqpld[1][9][23]` - int: `0`

## Response Structure

Top-level response layout:
- `data[0]` - Response metadata / headers
- `data[1]` - Main payload
- `data[1][10]` - Review container node
- `data[1][10][2]` - Array of individual review entries
- `data[1][10][6]` - Pagination token (base64 string, or `null` on the last page)

### Review Entry Layout (variable-length array)

Individual review arrays have **variable length** (typically 30–40 elements) depending on which optional fields are populated. Field positions are **not fixed** — the parser uses dynamic detection based on anchor points rather than hardcoded indices.

**Anchor points (consistent across all reviews):**
- `[1]` - `number`: Rating (1–5)
- `[2]` - `array`: Time info [`relative_string`, `null`, `ms_timestamp`]
- `[3]` - `array`: Author info [`name`, `avatar_url`, `profile_url`, ...]
- `[5]` - `string`: Review ID

**Detected fields (position varies):**
- **Language**: A 2-letter locale code (e.g. `"en"`) found immediately before the full text when present.
- **Full text**: The first (longer) string in a consecutive pair of strings located a few positions before the QA data.
- **Short/truncated text**: The second string in the pair (may be identical to full text for short reviews).
- **Image count**: A small integer just before the QA data array.
- **Images**: Nested arrays containing `googleusercontent.com` URLs, detected by scanning for array-of-arrays patterns.
- **QA data**: Array of question/answer structures, used as an anchor to find text and images by scanning backwards.
- **Tail**: Fixed suffix: `["Google", source_info]`, `user_rating`, `max_rating`, `[null, [category_counts]]`.

## Output Differences from listugcposts

- **Search Support**: This endpoint absolutely **does not support text searching**. Passing queries in the URL or payload will either be ignored or cause 400/500 errors.

- **Cookies**: Unlike `listugcposts`, this endpoint does not strictly require the Google Maps `kEI` session token injection or persistent auth cookies for basic read access.

- **Data Structure**: The raw JSON output is heavily flattened and optimized for UI rendering compared to the deeply nested `listugcposts` array tree.


[^1]: Other parameters like `channel`, `client`, `sca_esv`, `hs`, and `opi` are often present in browser requests for telemetry/anti-abuse tracking, but the endpoint functions perfectly without them.
[^2]: This is the inner array governing the list retrieval.
| [^3]: | Value          | Meaning |
| ----- | -------------- |
| 1     | Most Relevant  |
| 2     | Newest         |
| 3     | Highest Rating |
| 4     | Lowest Rating  |
[^4]: Controls the number of reviews returned in the initial fetch. The fetch limit `10` has been replaced with `3` in newer versions. On paginated requests, this becomes `null`.
[^5]: Expanded from a single place ID string to a 4-element array containing hex IDs and a place slug.
[^6]: Category filter configuration used for rating-level breakdowns.
[^7]: Extracted from the response at `[1][10][6]`. Only present in paginated requests.