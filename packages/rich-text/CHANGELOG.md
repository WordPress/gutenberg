## 3.2.0 (Unreleased)

### Internal

- Removed and renamed undocumented functions and constants:
  * Removed `charAt`
  * Removed `getSelectionStart`
  * Removed `getSelectionEnd`
  * Removed `insertLineBreak`
  * Renamed `isEmptyLine` to `__unstableIsEmptyLine`
  * Renamed `insertLineSeparator` to `__unstableInsertLineSeparator`
  * Renamed `apply` to `__unstableApply`
  * Renamed `unstableToDom` to `__unstableToDom`
  * Renamed `LINE_SEPARATOR` to `__UNSTABLE_LINE_SEPARATOR`
  * Renamed `indentListItems` to `__unstableIndentListItems`
  * Renamed `outdentListItems` to `__unstableOutdentListItems`
  * Renamed `changeListType` to `__unstableChangeListType`

## 3.1.0 (2019-03-06)

### Enhancement

- Added format boundaries.
- Removed parameters from `create` to filter out content.
- Removed the `createLinePadding` from `apply`, which is now built in.
- Improved format placeholder.
- Improved dom diffing.

## 3.0.4 (2019-01-03)

## 3.0.3 (2018-12-12)

### Internal

- Internal performance optimizations to avoid excessive expensive creation of DOM documents.

## 3.0.2 (2018-11-21)

## 3.0.1 (2018-11-20)

## 3.0.0 (2018-11-15)

### Breaking Changes

- `toHTMLString` always expects an object instead of multiple arguments.

## 2.0.4 (2018-11-09)

## 2.0.3 (2018-11-09)

### Bug Fix

- Fix Format Type Assignment During Parsing.
- Fix applying formats on multiline values without wrapper tags.

## 2.0.2 (2018-11-03)

## 2.0.1 (2018-10-30)

## 2.0.0 (2018-10-30)

- Remove `@wordpress/blocks` as a dependency.

## 1.0.2 (2018-10-29)

## 1.0.1 (2018-10-19)

## 1.0.0 (2018-10-18)

- Initial release.
