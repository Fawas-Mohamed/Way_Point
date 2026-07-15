export interface PaginationInput {
  page: number;
  pageSize: number;
}

export function toSkipTake({ page, pageSize }: PaginationInput): { skip: number; take: number } {
  return { skip: (page - 1) * pageSize, take: pageSize };
}
