<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Internal

-   `attached_to`: Narrow the combobox `onChange` handler parameter to `string | null`, following the upstream `ComboboxControl` type fix that removed the accidental `undefined` from the callback type. ([#81568](https://github.com/WordPress/gutenberg/pull/81568))

## 0.18.0 (2026-08-12)

### Bug Fixes

-   `attached_to`: Reserve room for the suggestions so the field's DataForm panel dropdown is placed with space for them, instead of being sized to the row and then crushing them into a box too small to scroll comfortably. Also don't expand the suggestion list until the user searches, debounce the search so a request isn't fired per keystroke, allow re-attaching straight after detaching, and drop the detach link from the help text in favour of the field's own reset button ([#81122](https://github.com/WordPress/gutenberg/issues/81122)).

## 0.17.0 (2026-07-29)

## 0.16.0 (2026-07-14)

### Enhancements

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

## 0.15.0 (2026-07-01)

## 0.14.0 (2026-06-24)

## 0.13.1 (2026-06-16)

## 0.13.0 (2026-06-10)

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).
