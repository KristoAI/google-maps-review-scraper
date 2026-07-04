import { Impit } from "impit";
import { CookieJar } from "tough-cookie";
import type { RotateClientReturn, RotateCookies } from "./types.js";

/**
 * Creates an Impit client configured for rotating Google cookies.
 * @param {Record<string, string>} cookies - Initial cookies to set in the cookie jar.
 * @returns {RotateClientReturn} An object containing the configured Impit client and its CookieJar.
 */
function createRotateClient(cookies: Record<string, string>): RotateClientReturn {
  const cookieJar = new CookieJar();

  if (cookies) {
    for (const [key, value] of Object.entries(cookies)) {
      cookieJar.setCookieSync(
        `${key}=${value}; Domain=google.com; Path=/; Secure; HttpOnly`,
        'https://accounts.google.com'
      );
    }
  }

  const client = new Impit({
    cookieJar: cookieJar,
    browser: "chrome",
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
    }
  });

  return { client, cookieJar };
}

/**
 * Attempts to rotate Google cookies by making a request to the accounts.google.com/RotateCookies endpoint.
 * This function is specifically designed to refresh the __Secure-1PSIDTS cookie.
 * @param {string} psid - The value of the __Secure-1PSID cookie.
 * @param {string} psidts - The value of the __Secure-1PSIDTS cookie.
 * @returns {Promise<string | null>} A promise that resolves to the new __Secure-1PSIDTS cookie value if successful, otherwise null.
 */
export async function rotateCookies({ psid, psidts }: RotateCookies): Promise<string | null> {
  const { client, cookieJar } = createRotateClient({
    "__Secure-1PSID": psid,
    "__Secure-1PSIDTS": psidts
  });

  const url = "https://accounts.google.com/RotateCookies";

  try {
    const response = await client.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "https://accounts.google.com",
        "Referer": "https://accounts.google.com/",
      },
      body: '[000,"-0000000000000000000"]'
    });

    if (!response.ok) {
      console.error(`[RotateCookies] Failed with status: ${response.status} ${response.statusText}`);
      return null;
    }

    const cookies = cookieJar.getCookiesSync(url);
    const newPsidtsCookie = cookies.find(c => c.key === "__Secure-1PSIDTS");

    if (newPsidtsCookie) {
      return newPsidtsCookie.value;
    }

    console.warn("[RotateCookies] Success response received, but no new __Secure-1PSIDTS cookie found in the jar.");
    return null;

  } catch (error) {
    console.error(`[RotateCookies] Network or execution error:`, error);
    return null;
  }
}
