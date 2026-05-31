import { TRANSACTION_TYPE } from "../../enums";

export type PlaceOrderInputType = {
    bookId: string;
    libraryId: string;
    transactionType: TRANSACTION_TYPE.BORROW | TRANSACTION_TYPE.PURCHASE
} 

export type ReturnOrder = {
    orderId: string;
}

export type UpdateOrderInputType = {
    orderId: string;
    quantity: number;
}