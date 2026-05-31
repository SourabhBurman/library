import { FilterInput, OperatorFields } from "./shared";

enum BookFields {
  name = "name",
  id = "id",
  genre = "genre",
  cost = "cost",
  rentPrice = "rentPrice",
  publishedDate = "publishedDate",
}

export type BookFilterInput = FilterInput<BookFields, OperatorFields>;
