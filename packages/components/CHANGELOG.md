## 3.0.0 (2018-09-05)

### Breaking Change

- `withAPIData` has been removed. Please use the Core Data module or `@wordpress/api-fetch` directly instead.
- `wp.components.Draggable` as a DOM node drag handler has been deprecated. Please, use `wp.components.Draggable` as a wrap component for your DOM node drag handler.
- Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).  If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
- `wp.components.withContext` has been removed. Please use `wp.element.createContext` instead. See: https://reactjs.org/docs/context.html.

### New Feature

- Added a new `Svg` component.
