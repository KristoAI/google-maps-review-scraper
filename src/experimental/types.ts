import type { Impit } from "impit"
import type { ParsedReview } from "../types.js"

export interface BoqUrl {
  placeId: string,
  sortOrder: 1 | 2 | 3 | 4,
  paginationToken?: string
}

export interface BoqReviews extends BoqUrl {
  client: Impit
}

export interface BoqPaginate {
  placeId: string,
  sortOrder: 1 | 2 | 3 | 4,
  pages: string | number,
  clean: boolean,
  client: Impit
}
