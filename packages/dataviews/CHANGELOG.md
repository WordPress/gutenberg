<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 1.2.0 (2024-05-16)

### Internal

-   Replaced `classnames` package with the faster and smaller `clsx` package ([#61138](https://github.com/WordPress/gutenberg/pull/61138)).

## 1.1.0 (2024-05-02)

## 1.0.0 (2024-04-19)

### Breaking changes

-   Removed the `onDetailsChange` event only available for the list layout. We are looking into adding actions to the list layout, including primary ones.

## 0.9.0 (2024-04-03)

### Enhancement

-   The `enumeration` type has been removed and we'll introduce new field types soon. The existing filters will still work as before given they checked for field.elements, which is still a condition filters should have.

## 0.8.0 (2024-03-21)

### Enhancement

-   Two new operators have been added: `isAll` and `isNotAll`. These are meant to represent `AND` operations. For example, `Category is all: Book, Review, Science Fiction` would represent all items that have all three categories selected.
-   DataViews now supports multi-selection. A new set of filter operators has been introduced: `is`, `isNot`, `isAny`, `isNone`. Single-selection operators are `is` and `isNot`, and multi-selection operators are `isAny` and `isNone`. If no operators are declared for a filter, it will support multi-selection. Additionally, the old filter operators `in` and `notIn` operators have been deprecated and will work as `is` and `isNot` respectively. Please, migrate to the new operators as they'll be removed soon.

### Breaking changes

-   Removed the `getPaginationResults` and `sortByTextFields` utils and replaced them with a unique `filterSortAndPaginate` function.

## 0.7.0 (2024-03-06)

## 0.6.0 (2024-02-21)

## 0.5.0 (2024-02-09)

## 0.4.0 (2024-01-24)

## 0.3.0 (2024-01-10)

## 0.2.0 (2023-12-13)
