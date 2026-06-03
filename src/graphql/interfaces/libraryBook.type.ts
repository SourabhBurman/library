export type LibraryBookInputType = {
  books?: {
    bookId: string;
    quantity: number;
  }[];
  library: string;
  isAll?: boolean;
  quantityForIsAll?: number;
};
