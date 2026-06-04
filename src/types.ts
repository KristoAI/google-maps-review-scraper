import { Impit } from "impit";
import type { CookieJar } from "tough-cookie";

export enum SortEnum {
    "relevent" = 1, // Maintaining backwards compatibility.
    "relevant" = 1,
    "newest" = 2,
    "highest_rating" = 3,
    "lowest_rating" = 4
}

export interface ParsedReview {
    review_id: string;
    time: { published: any; last_edited: any };
    author: { name: string; profile_url: string; url: string; id: string };
    review: { rating: number; text: string | null; language: string | null };
    images: Array<{
        id: string;
        url: string;
        size: { width: number; height: number };
        location: { friendly?: string; lat: number; long: number };
        caption: string | null;
    }> | null;
    source: string;
    response: { text: string | null; time: { published: any; last_edited: any } } | null;
}

type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonObject
    | JsonArray;

type JsonArray = JsonValue[];

export interface JsonObject {
    [key: string]: JsonValue;
};

export interface ProxyConfig {
    url: string | undefined,
    tls?: boolean
}

export interface HTTPClient {
    proxy: ProxyConfig
    cookies?: Record<string, string> | undefined
}

export interface SessionToken {
    placeId: string,
    client: Impit
}

export interface ListUgcPosts {
    placeId: string,
    sortOrder: 1 | 2 | 3 | 4,
    page: string
    searchQuery: string
    sessionToken: string,
}

export interface RotateClientReturn {
    client: Impit,
    cookieJar: CookieJar
}

export interface RotateCookies {
    psid: string,
    psidts: string
}

export interface Validate {
    url: string,
    sort_type: string,
    pages: string | number,
    clean: boolean
}

export interface Reviews extends ListUgcPosts {
    client: Impit
}

export interface Paginate extends Omit<Reviews, 'page'> {
    clean: boolean
    pages: number | "max"
}