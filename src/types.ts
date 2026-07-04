import type { Impit } from "impit";
import type { CookieJar } from "tough-cookie";

export enum SortEnum {
    "relevant" = 1,
    "newest" = 2,
    "highest_rating" = 3,
    "lowest_rating" = 4
}

export interface ParsedReview {
    review_id: string;
    time: { published: unknown | null; last_edited: unknown | null };
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
    response: { text: string | null; time: { published: unknown | null; last_edited: unknown | null } } | null;
}

type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonObject
    | JsonArray;

export type JsonArray = JsonValue[];

interface JsonObject {
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
    pages: number,
    clean: boolean
}

export interface FetchReviewsParams {
    placeId: string;
    sortOrder: 1 | 2 | 3 | 4;
    client: Impit;
    paginationToken?: string;
}

export interface PaginateReviewsParams {
    placeId: string;
    sortOrder: 1 | 2 | 3 | 4;
    pages: number;
    clean: boolean;
    client: Impit;
}

export interface Scraper {
    url: string;
    sort_type?: string;
    pages?: number;
    clean?: boolean;
    cookies?: Record<string, string> | undefined;
    proxy?: {
        proxyUrl?: string | undefined;
        ignoreTls?: boolean;
    }
}
