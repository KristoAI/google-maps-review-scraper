
import { Impit } from "impit";
import { CookieJar } from "tough-cookie";

export function createClient(cookies?: Record<string, string>) {
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
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
        }
    });
}
