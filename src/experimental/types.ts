import type { Impit } from "impit"

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
  pages: number | "max",
  clean: boolean,
  client: Impit
}
