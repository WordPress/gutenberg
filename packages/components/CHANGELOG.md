## 7.1.0 (Unreleased)

### Improvements

- `withFilters` has been optimized to avoid binding hook handlers for each mounted instance of the component, instead using a single centralized hook delegator.
- `withFilters` has been optimized to reuse a single shared component definition for all filtered instances of the component.

### Bug Fixes

- Resolves a conflict where two instance of Slot would produce an inconsistent or duplicated rendering output.
- Allow years between 0 and 1970 in DateTime component.

### New Feature

- `Dropdown` now has a `focusOnMount` prop which is passed directly to the contained `Popover`.
- `DatePicker` has new prop `isInvalidDate` exposing react-dates' `isOutsideRange`.

## 7.0.5 (2019-01-03)

## 7.0.4 (2018-12-12)

## 7.0.3 (2018-11-30)

## 7.0.2 (2018-11-22)

## 7.0.1 (2018-11-21)

## 7.0.0 (2018-11-20)

### Breaking Change

- `Dropdown.refresh()` has been removed. The contained `Popover` is now automatically refreshed.

## 6.0.2 (2018-11-15)

## 6.0.1 (2018-11-12)

### Bug Fixes

- Avoid constantly recomputing the popover position.

### Polish

- Remove `<DateTimePicker />` obsolete `locale` prop (and pass-through to child components) and obsolete `is12Hour` prop pass through to `<DateTime />` [#11649](https://github.com/WordPress/gutenberg/pull/11649)

## 6.0.0 (2018-11-12)

### Breaking Change

- The `PanelColor` component has been removed.

## 5.1.1 (2018-11-09)

## 5.1.0 (2018-11-09)

### New Feature

- Adjust a11y roles for MenuItem component, so that aria-checked is used properly, related change in Editor/Components/BlockNavigationList ([#11431](https://github.com/WordPress/gutenberg/issues/11431)).
- `Popover` components are now automatically refreshed every 0.5s in order to recalculate their size or position.

### Deprecation

- `Dropdown.refresh()` has been deprecated as the contained `Popover` is now automatically refreshed.

## 5.0.2 (2018-11-03)

### Polish

- Forward `ref` in the `PanelBody` component.
- Tooltip are no longer removed when Button becomes disabled, it's left to the component rendering the Tooltip.
- Forward `ref` support in `TabbableContainer` and `NavigableMenu` components.

## 5.0.1 (2018-10-30)

## 5.0.0 (2018-10-29)

### Breaking Change

- `AccessibleSVG` component has been removed. Please use `SVG` instead.

### New Feature

- The `Notice` component accepts an array of action objects via the `actions` prop. Each member object should contain a `label` and either a `url` link string or `onClick` callback function.

## 4.2.1 (2018-10-22)

### Bug Fix

- Fix importing `react-dates` stylesheet in production.

## 4.2.0 (2018-10-19)

### New Feature

- Added a new `ColorPicker` component ([#10564](https://github.com/WordPress/gutenberg/pull/10564)).
- `MenuItem` now accepts an `info` prop for including an extended description.

### Bug Fix

- `IconButton` correctly respects a passed `aria-label` prop.

### Deprecation

- `PanelColor` has been deprecated in favor of `wp.editor.PanelColorSettings`.

## 4.1.2 (2018-10-18)

## 4.1.0 (2018-10-10)

### New Feature

- Added a new `ResizableBox` component.

## 4.0.0 (2018-09-30)

### Breaking Change

- `Draggable` as a DOM node drag handler has been removed. Please, use `Draggable` as a wrap component for your DOM node drag handler.

### Deprecation

- Renamed `AccessibleSVG` component to `SVG`.

## 3.0.0 (2018-09-05)

### Breaking Change

- `withAPIData` has been removed. Please use the Core Data module or `@wordpress/api-fetch` directly instead.
- `Draggable` as a DOM node drag handler has been deprecated. Please, use `Draggable` as a wrap component for your DOM node drag handler.
- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
- `withContext` has been removed. Please use `wp.element.createContext` instead. See: https://reactjs.org/docs/context.html.

### New Feature

- Added a new `AccessibleSVG` component.
