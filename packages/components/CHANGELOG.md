## Master

### Enhancements

- The `Notice` component will speak its message. With this new feature, a developer can control either the `spokenMessage` spoken message, or the `politeness` politeness level of the message.
- The `Snackbar` component will speak its message. With this new feature, a developer can control either the `spokenMessage` spoken message, or the `politeness` politeness level of the message.
- A `Notice` `actions` member can now assign `isPrimary` to render a primary button action associated with a notice message.

### Bug Fixes

- Notice will assume a default status of 'info' if none is provided. This resolves an issue where the notice would be assigned a class name `is-undefined`. This was previously the effective default by styled appearance and should not be considered a breaking change in that regard.

## 9.0.0 (2020-01-13)

### New Features

- Added a new `Guide` component which allows developers to easily present a user guide.

### Breaking Changes

- `is-button` classname has been removed from the Button component.
- The `is-default` classname is not applied automatically anymore.
- By default Button components come with a fixed height and hover styles.

### Bug Fixes

- Fixes a regression published in version 8.5.0 that would prevent some build tools from including
  styles provided in the packages build-styles directory.

### Deprecations

- `isDefault` prop in `Button` has been deprecated. Consider using `isSecondary` instead.
- `IconButton` has been deprecated. Use the `Button` component instead.

## 8.2.0 (2019-08-29)

### New Features

- The bundled `re-resizable` dependency has been updated from requiring `5.0.1` to requiring `^6.0.0` ([#17011](https://github.com/WordPress/gutenberg/pull/17011)).

## 8.1.0 (2019-08-05)

### New Features

- Added a new `popoverProps` prop to the `Dropdown` component which allows users of the `Dropdown` component to pass props directly to the `Popover` component.
- Added and documented `hideLabelFromVision` prop to `BaseControl` used by `SelectControl`, `TextControl`, and `TextareaControl`.
- Added a new `popoverProps` prop to the `DropdownMenu` component which allows to pass props directly to the nested `Popover` component.
- Added a new `toggleProps` prop to the `DropdownMenu` component which allows to pass props directly to the nested `IconButton` component.
- Added a new `menuProps` prop to the `DropdownMenu` component which allows to pass props directly to the nested `NavigableMenu` component.

### Deprecations

- `menuLabel` prop in `DropdownComponent` has been deprecated. Consider using `menuProps` object and its `aria-label` property instead.
- `position` prop in `DropdownComponent` has been deprecated. Consider using `popoverProps` object and its `position` property instead.

### Bug Fixes

- The `Button` component will no longer assign default styling (`is-default` class) when explicitly assigned as primary (the `isPrimary` prop). This should resolve potential conflicts affecting a combination of `isPrimary`, `isDefault`, and `isLarge` / `isSmall`, where the busy animation would appear with incorrect coloring.

### Deprecations

- The `Popover` component `onClickOutside` prop has been deprecated. Use `onFocusOutside` instead.

### Internal

- The `Dropdown` component has been refactored to focus changes using the `Popover` component's `onFocusOutside` prop.
- The `MenuItem` component will now always use an `IconButton`. This prevents a focus loss when clicking a menu item.
- Package no longer depends on external `react-click-outside` library.

## 8.0.0 (2019-06-12)

### New Feature

- Add new `BlockQuotation` block to the primitives folder to support blockquote in a multiplatform way. [#15482](https://github.com/WordPress/gutenberg/pull/15482).
- `DropdownMenu` now supports passing a [render prop](https://reactjs.org/docs/render-props.html#using-props-other-than-render) as children for more advanced customization.

### Internal

- `MenuGroup` no longer uses `NavigableMenu` internally. It needs to be explicitly wrapped with `NavigableMenu` to bring back the same behavior.

### Documentation

- Added missing documentation for `DropdownMenu` props `menuLabel`, `position`, `className`.

### Breaking Change

- `ServerSideRender` is no longer part of components. It was extracted to an independent package `@wordpress/server-side-render`.

### Bug Fix

- Although `DateTimePicker` does not allow picking the seconds, passed the current seconds as the selected value for seconds when calling `onChange`. Now it passes zero.

## 7.4.0 (2019-05-21)

### New Feature

- Added a new `HorizontalRule` component.
- Added a new `Snackbar` component.

### Bug Fix

- Fixed display of reset button when using RangeControl `allowReset` prop.
- Fixed minutes field of `DateTimePicker` missed '0' before single digit values.

## 7.3.0 (2019-04-16)

### New Features

- Added a new `render` property to `FormFileUpload` component. Allowing users of the component to custom the UI for their needs.
- Added a new `BaseControl.VisualLabel` component.
- Added a new `preview` prop to the `Placeholder` component which allows to display a preview, for example a media preview when the Placeholder is used in media editing contexts.
- Added a new `anchorRect` prop to `Popover` which enables a developer to provide a custom `DOMRect` object at which to position the popover.

### Improvements

- Limit `Base Control Label` to the width of its content.

### Bug fixes

- Fix `instanceId` prop passed through to `Button` component via `MenuItems` producing React console error. Fixed by removing the unnecessary use of `withInstanceId` on the `MenuItems` component [#14599](https://github.com/WordPress/gutenberg/pull/14599)

## 7.2.0 (2019-03-20)

### Improvements

- Make `RangeControl` validation rely on the `checkValidity` provided by the browsers instead of using our own validation.

### Bug Fixes

- Fix a problem that made `RangeControl` not work as expected with float values.

## 7.1.0 (2019-03-06)

### New Features

- Added a new `Animate` component.

### Improvements

- `withFilters` has been optimized to avoid binding hook handlers for each mounted instance of the component, instead using a single centralized hook delegator.
- `withFilters` has been optimized to reuse a single shared component definition for all filtered instances of the component.
- Make `RangeControl` validate min and max properties.

### Bug Fixes

- Resolves a conflict where two instance of Slot would produce an inconsistent or duplicated rendering output.
- Allow years between 0 and 1970 in DateTime component.

### New Feature

- `Dropdown` now has a `focusOnMount` prop which is passed directly to the contained `Popover`.
- `DatePicker` has new prop `isInvalidDate` exposing react-dates' `isOutsideRange`.
- `DatePicker` allows `null` as accepted value for `currentDate` prop to signify no date selection.

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
