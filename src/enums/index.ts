export enum BOOK_GENRE {
  HORROR = "Horror",
  ROMANCE = "Romance",
  FANTASY = "Fantasy",
  SCIFI = "Science Fiction",
  MYSTERY = "Mystery",
  THRILLER = "Thriller",
  ADVENTURE = "Adventure",
  BIOGRAPHY = "Biography",
  HISTORY = "History",
  SELFHELP = "Self Help",
  BUSINESS = "Business",
  HEALTH = "Health",
  DRAMA = "Drama",
  FINANCE = "Finance",
  TECHNOLOGY = "Technology",
  OTHER = "Other",
}

export enum GENDER {
  MALE = "Male",
  FEMALE = "Female",
  OTHER = "Other",
}

export enum ROLE {
  ADMIN = "Admin",
  LIBRARY_OWNER = "Library_Owner",
  READER = "Reader",
}

export enum TRANSACTION_TYPE {
  BORROW = "Borrow",
  RETURN = "Return",
  PURCHASE = "Purchase",
}

export enum ORDER_STATUS_ENUM {
  BORROWED = "Borrowed",
  RETURNED = "Returned",
  PURCHASED = "Purchased",
}

export const ORDER_STATUS = {
  [TRANSACTION_TYPE.BORROW]: ORDER_STATUS_ENUM.BORROWED,
  [TRANSACTION_TYPE.RETURN]: ORDER_STATUS_ENUM.RETURNED,
  [TRANSACTION_TYPE.PURCHASE]: ORDER_STATUS_ENUM.PURCHASED,
};
