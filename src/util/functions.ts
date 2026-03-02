import { SelectQueryBuilder } from "typeorm";
import {
  FilterInput,
  OperatorFields,
  PaginationInput,
} from "../graphql/interfaces/shared";

export const setPaginationFilters = <T>(
  queryBuilder: SelectQueryBuilder<T>,
  pagination: PaginationInput,
  filters: FilterInput
) => {
  const { pageNumber = 1, pageSize = 10 } = pagination ?? {};

  if (filters) {
    if (filters.and) {
      filters.and.forEach((filter) => {
        queryBuilder.andWhere(
          `${filter.field} ${OperatorFields[filter.operator]} :value`,
          {
            value: filter.value,
          }
        );
      });
    }

    if (filters.or) {
      filters.or.forEach((filter) => {
        queryBuilder.orWhere(
          `${filter.field} ${OperatorFields[filter.operator]} :value`,
          {
            value: filter.value,
          }
        );
      });
    }
  }

  return queryBuilder.offset((pageNumber - 1) * pageSize).limit(pageSize);
};
