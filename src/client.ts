
import { Impit } from "impit";
import { CookieJar } from "tough-cookie";
import type { HTTPClient } from "./types.js";

/**
 * Create an HTTP client configured with optional proxy and cookies for scraping.
 *
 * @param options          - Client configuration.
 * @param options.proxy    - Optional proxy settings.
 * @param options.cookies  - Optional key/value cookie pairs to pre-set.
 * @returns A configured `Impit` HTTP client instance.
 */
export function createClient({ proxy, cookies }: HTTPClient): Impit {
    const cookieJar = new CookieJar();

    if (cookies) {
        for (const [key, value] of Object.entries(cookies)) {
            // Defaulting domain to google.com since we are making requests there
            cookieJar.setCookieSync(`${key}=${value}; Domain=google.com`, 'https://www.google.com');
        }
    }

    return new Impit({
        cookieJar: cookieJar,
        browser: "chrome",
        headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
        },
        ...(proxy && proxy.url && { proxyUrl: proxy.url, ignoreTlsErrors: proxy.tls ?? false })
    });
}
