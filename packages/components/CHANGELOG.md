## 5.1.0 (Unreleased)

### Polish

- Remove `<DateTimePicker />` obsolete `locale` prop (and pass-through to child components) and obsolete `is12Hour` prop pass through to `<DateTime />` [#11649](https://github.com/WordPress/gutenberg/pull/11649) 

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
- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
- `withContext` has been removed. Please use `wp.element.createContext` instead. See: https://reactjs.org/docs/context.html.

### New Feature

- Added a new `AccessibleSVG` component.
