import { LibraryBook } from "../../entity/library_book.entity";

export type LibraryBookInputType = {
    books?: {
        bookId: string;
        quantity: number;
    }[];
    library: string;
    isAll?: boolean;
    quantityForIsAll?: number;
};