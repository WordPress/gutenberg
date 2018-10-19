## 4.2.0 (Unreleased)

### New Feature

- Added a new `ColorPicker` component ([#10564](https://github.com/WordPress/gutenberg/pull/10564)).

### Deprecation

- `wp.components.PanelColor` has been deprecated in favor of `wp.editor.PanelColorSettings`.

## 4.1.0 (2018-10-10)

### New Feature

- Added a new `ResizableBox` component.

## 4.0.0 (2018-09-30)

### Breaking Change

- `wp.components.Draggable` as a DOM node drag handler has been removed. Please, use `wp.components.Draggable` as a wrap component for your DOM node drag handler.

### Deprecation

- Renamed `AccessibleSVG` component to `SVG`.

## 3.0.0 (2018-09-05)

### Breaking Change

- `withAPIData` has been removed. Please use the Core Data module or `@wordpress/api-fetch` directly instead.
- `wp.components.Draggable` as a DOM node drag handler has been deprecated. Please, use `wp.components.Draggable` as a wrap component for your DOM node drag handler.
- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
- `wp.components.withContext` has been removed. Please use `wp.element.createContext` instead. See: https://reactjs.org/docs/context.html.

### New Feature

- Added a new `AccessibleSVG` component.
