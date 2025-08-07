export type PaginationInput = {
  pageNumber: number;
  pageSize: number;
};

export type FilterInput<T = any, P = any> = {
  and?: FilterInput<T, P>[];
  or?: FilterInput<T, P>[];
  field: T;
  operator: P;
  value: string | boolean | string[];
};

export enum OperatorFields {
  Eq = "=",
  NotEq = "!=",
  In = "IN",
  Like = "LIKE",
  ILike = "ILIKE",
  Gt = ">",
  Gte = ">=",
  Lt = "<",
  Lte = "<=",
}
