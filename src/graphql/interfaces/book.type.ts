import { TRANSACTION_TYPE } from "../../enums";
import { FilterInput, OperatorFields } from "./shared";

export type TransactionInputType = {
  bookId: string;
  transactionType: TRANSACTION_TYPE;
  quantity: number;
  transactionDate?: Date;
};

enum BookFields {
  name = "name",
  id = "id",
  genre = "genre",
  cost = "cost",
  rentPrice = "rentPrice",
  publishedDate = "publishedDate",
}

export type BookFilterInput = FilterInput<BookFields, OperatorFields>;
