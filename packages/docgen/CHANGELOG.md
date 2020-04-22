## Master

## 1.7.0 (2020-02-04)

### Bug Fixes

- The built-in Markdown formatter will output text indicating that the type is unknown if a type cannot be parsed. Previously, these would be output wrongly as the `null` type.

## 1.3.0 (2019-08-05)

### Bug Fixes

- Docblocks with CRLF endings are now parsed correctly.

## 1.2.0 (2019-05-21)

### Enhancement

- Docblocks including a `@private` tag will be omitted from the generated result.

### Internal

- Remove unneccessary argument from an instance of `Array#pop`.

## 1.0.0 (2019-03-06)

- Initial release
