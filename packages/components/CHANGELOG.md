<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Deprecations

-   Deprecate bottom margin on the following `BaseControl`-based components. Set the `__nextHasNoMarginBottom` prop to true to start opting into the new styles, which will become the default in a future version ([#64408](https://github.com/WordPress/gutenberg/pull/64408)).
    -   `BaseControl`
    -   `CheckboxControl`
    -   `ComboboxControl`
    -   `DimensionControl`
    -   `FocalPointPicker`
    -   `RangeControl`
    -   `SearchControl`
    -   `SelectControl`
    -   `TextControl`
    -   `TextareaControl`
    -   `ToggleControl`
    -   `ToggleGroupControl`
    -   `TreeSelect`

### Enhancements

-   `Composite`: improve Storybook examples and add interactive controls ([#64397](https://github.com/WordPress/gutenberg/pull/64397)).
-   `Composite`: use internal context to forward the composite store to sub-components ([#64493](https://github.com/WordPress/gutenberg/pull/64493)).
-   `QueryControls`: Default to new 40px size ([#64457](https://github.com/WordPress/gutenberg/pull/64457)).
-   `TimePicker`: add `hideLabelFromVision` prop ([#64267](https://github.com/WordPress/gutenberg/pull/64267)).
-   `FocalPointPicker`: Default to new 40px size ([#64456](https://github.com/WordPress/gutenberg/pull/64456)).
-   `DropdownMenuV2`: adopt elevation scale ([#64432](https://github.com/WordPress/gutenberg/pull/64432)).
-   `Popover`: allow `style` prop usage ([#64489](https://github.com/WordPress/gutenberg/pull/64489)).
-   `ToolsPanel`: sets column-gap to 16px for ToolsPanel grid ([#64497](https://github.com/WordPress/gutenberg/pull/64497)).

### Bug Fixes

-   `RangeControl`: tweak mark and label absolute positioning ([#64487](https://github.com/WordPress/gutenberg/pull/64487)).

### Internal

-   `Composite` v2: add `Hover` and `Typeahead` subcomponents ([#64399](https://github.com/WordPress/gutenberg/pull/64399)).
-   `Composite` v2: add focus-related props to `Composite`and`Composite.Item` subcomponents ([#64450](https://github.com/WordPress/gutenberg/pull/64450)).
-   `Composite` v2: add `Context` subcomponent ([#64493](https://github.com/WordPress/gutenberg/pull/64493)).

## 28.5.0 (2024-08-07)

### Bug Fixes

-   `ColorPalette`: Remove extra bottom margin when `CircularOptionPicker` is unneeded ([#63961](https://github.com/WordPress/gutenberg/pull/63961)).
-   `CustomSelectControl`: Restore `describedBy` functionality ([#63957](https://github.com/WordPress/gutenberg/pull/63957)).
-   `Button`: Improve the aria-disabled focus style ([#62480](https://github.com/WordPress/gutenberg/pull/62480)).
-   `Modal`: Fix the dismissal logic for React development mode ([#64132](https://github.com/WordPress/gutenberg/pull/64132)).
-   `Button`: Fix tertiary destructive hover style ([#64152](https://github.com/WordPress/gutenberg/pull/64152)).
-   `Autocompleter UI`: Fix text color when hovering selected item ([#64294](https://github.com/WordPress/gutenberg/pull/64294)).
-   `Heading`: Add the missing `size` prop to the component's props type ([#64299](https://github.com/WordPress/gutenberg/pull/64299)).
-   `TextControl`: Fix the padding of the component to be consistent with the rest of the controls. ([#64326](https://github.com/WordPress/gutenberg/pull/64326)).

### Enhancements

-   `TimeInput`: Expose as subcomponent of `TimePicker` ([#63145](https://github.com/WordPress/gutenberg/pull/63145)).
-   `RadioControl`: add support for option help text ([#63751](https://github.com/WordPress/gutenberg/pull/63751)).
-   `SelectControl`: Infer `value` type from `options` ([#64069](https://github.com/WordPress/gutenberg/pull/64069)).
-   `Guide`: Add `__next40pxDefaultSize` to buttons ([#64181](https://github.com/WordPress/gutenberg/pull/64181)).
-   `SelectControl`: Pass through `options` props ([#64211](https://github.com/WordPress/gutenberg/pull/64211)).
-   `DimensionControl`: Add `__nextHasNoMarginBottom` prop to remove bottom margin ([#64346](https://github.com/WordPress/gutenberg/pull/64346)).

### Internal

-   Upgraded `@ariakit/react` (v0.4.7) and `@ariakit/test` (v0.4.0) ([#64066](https://github.com/WordPress/gutenberg/pull/64066)).
-   `DropdownMenuV2`: break menu item help text on multiple lines for better truncation. ([#63916](https://github.com/WordPress/gutenberg/pull/63916)).
-   `CustomSelectControl`: Support generic props type ([#63985](https://github.com/WordPress/gutenberg/pull/63985)).

## 28.4.0 (2024-07-24)

### Deprecations

-   `FormTokenField`: Deprecate bottom margin. Add a `__nextHasNoMarginBottom` prop to start opting into the margin-free styles that will become the default in a future version, currently scheduled to be WordPress 7.0 ([#63491](https://github.com/WordPress/gutenberg/pull/63491)).

### Bug Fixes

-   `BaseControl`: change label's `display` to `block`. ([#63911](https://github.com/WordPress/gutenberg/pull/63911))
-   `ComboboxControl`: Fix ComboboxControl reset button when using the keyboard. ([#63410](https://github.com/WordPress/gutenberg/pull/63410))
-   `Button`: Never apply `aria-disabled` to anchor ([#63376](https://github.com/WordPress/gutenberg/pull/63376)).
-   `SelectControl`: Fix hover/focus color in wp-admin ([#63855](https://github.com/WordPress/gutenberg/pull/63855)).
-   `ToggleControl`: Fix indentation ([#63903](https://github.com/WordPress/gutenberg/pull/63903)).

### Enhancements

-   `Button`: Rename Button describedBy prop to description and deprecate old name. ([#63486](https://github.com/WordPress/gutenberg/pull/63486))
-   `ToggleGroupControl`: support disabled options ([#63450](https://github.com/WordPress/gutenberg/pull/63450)).
-   `CustomSelectControl`: Stabilize `__experimentalShowSelectedHint` and `options[]. __experimentalHint` props ([#63248](https://github.com/WordPress/gutenberg/pull/63248)).
-   `SelectControl`: Add `"minimal"` variant ([#63265](https://github.com/WordPress/gutenberg/pull/63265)).
-   `FontSizePicker`: tidy up internal logic ([#63553](https://github.com/WordPress/gutenberg/pull/63553)).
-   `ToggleControl`: Update spacing and appearance to adhere to 4px baseline, slightly reducing footprint. Make label treatment and focus styles consistent with `RadioControl` and `CheckboxControl`. ([#63490](https://github.com/WordPress/gutenberg/pull/63490)).
-   `CheckboxControl`: Slightly reduced footprint. Make label treatment, focus styles, and spacing consistent with `ToggleControl` and `RadioControl`. ([#63490](https://github.com/WordPress/gutenberg/pull/63490)).
-   `RadioControl`: Slightly reduced footprint. Make label treatment, focus styles, and spacing consistent with `ToggleControl` and `CheckboxControl`. ([#63490](https://github.com/WordPress/gutenberg/pull/63490)).
-   `FormToggle`: Update spacing and appearance to adhere to 4px baseline, slightly reducing footprint. Make label treatment and focus styles consistent with `RadioControl` and `CheckboxControl`. ([#63490](https://github.com/WordPress/gutenberg/pull/63490)).

### Internal

-   `CustomSelectControl`: switch to ariakit-based implementation ([#63258](https://github.com/WordPress/gutenberg/pull/63258)).
-   `CustomSelectControlV2`: animate select popover appearance. ([#63343](https://github.com/WordPress/gutenberg/pull/63343))
-   `CustomSelectControlV2`: do not flip popover if legacy adapter. ([#63357](https://github.com/WordPress/gutenberg/pull/63357)).
-   `DropdownMenuV2`: invert animation direction. ([#63443](https://github.com/WordPress/gutenberg/pull/63443)).
-   `Tabs`: Vertical Tabs should be 40px min height. ([#63446](https://github.com/WordPress/gutenberg/pull/63446)).
-   `ColorPicker`: Use `minimal` variant for `SelectControl` ([#63676](https://github.com/WordPress/gutenberg/pull/63676)).
-   `Tabs`: keep full opacity of focus ring and remove hover styles on disabled tabs ([#63754](https://github.com/WordPress/gutenberg/pull/63754)).
-   `Placeholder`: Remove unnecssary `placeholder-style` Sass mixin ([#63885](https://github.com/WordPress/gutenberg/pull/63885)).

### Documentation

-   `BaseControl`: Improve the base control help prop documentation. ([#63693](https://github.com/WordPress/gutenberg/pull/63693)).

## 28.3.0 (2024-07-10)

### Enhancements

-   `Tabs`: hyphenate tab labels ([#63337](https://github.com/WordPress/gutenberg/pull/63337)).
-   `Tooltip`: Add support for `className` prop ([#63157](https://github.com/WordPress/gutenberg/pull/63157)).
-   `Toolbar`: Add support for `vertical` orientation ([#60123](https://github.com/WordPress/gutenberg/pull/60123)).
-   `BaseControl`: forward ref on `VisualLabel` ([#63169](https://github.com/WordPress/gutenberg/pull/63169)).
-   `ToolbarButton`: Deprecate `isDisabled` prop and merge with `disabled` ([#63101](https://github.com/WordPress/gutenberg/pull/63101)).
-   `Button`: Stabilize `__experimentalIsFocusable` prop as `accessibleWhenDisabled` ([#62282](https://github.com/WordPress/gutenberg/pull/62282)).
-   `ToolbarButton`: Always keep focusable when disabled ([#63102](https://github.com/WordPress/gutenberg/pull/63102)).
-   `ProgressBar`: Fix indeterminate RTL support. ([#63129](https://github.com/WordPress/gutenberg/pull/63129)).
-   `RangeControl`: Fix RTL support for custom marks ([#63198](https://github.com/WordPress/gutenberg/pull/63198)).
-   `TimePicker`: Add `dateOrder` prop ([#62481](https://github.com/WordPress/gutenberg/pull/62481)).

### Bug Fixes

-   `Tabs`: Make Tabs have a fluid height ([#62027](https://github.com/WordPress/gutenberg/pull/62027)).
-   `UnitControl`: Fix colors when disabled. ([#62970](https://github.com/WordPress/gutenberg/pull/62970))
-   `useUpdateEffect`: Correctly track mounted state in strict mode. ([#62974](https://github.com/WordPress/gutenberg/pull/62974))
-   `UnitControl`: Fix an issue where keyboard shortcuts unintentionally shift focus on Windows OS. ([#62988](https://github.com/WordPress/gutenberg/pull/62988))
-   Fix inaccessibly disabled `Button`s ([#62306](https://github.com/WordPress/gutenberg/pull/62306)).
-   `TimePicker`: Fix time zone overflow ([#63209](https://github.com/WordPress/gutenberg/pull/63209)).
-   `SelectControl`: Fix disabled styles ([#63266](https://github.com/WordPress/gutenberg/pull/63266)).
-   `Tabs`: Fix text-align when text wraps in vertical mode ([#63272](https://github.com/WordPress/gutenberg/pull/63272)).
-   `Tabs`: Fix "With tab icons" Storybook example ([#63297](https://github.com/WordPress/gutenberg/pull/63297)).

### Internal

-   Allow ariakit and framer motion imports in the components package. ([#63123](https://github.com/WordPress/gutenberg/pull/63123))
-   `CustomSelectControlV2`: prevent keyboard event propagation in legacy wrapper. ([#62907](https://github.com/WordPress/gutenberg/pull/62907))
-   `CustomSelectControlV2`: expose legacy wrapper through private APIs. ([#62936](https://github.com/WordPress/gutenberg/pull/62936))
-   `CustomSelectControlV2`: fix item styles ([#62825](https://github.com/WordPress/gutenberg/pull/62825))
-   `CustomSelectControlV2`: add root element wrapper. ([#62803](https://github.com/WordPress/gutenberg/pull/62803))
-   `CustomSelectControlV2`: tweak item inline padding based on size ([#62850](https://github.com/WordPress/gutenberg/pull/62850)).
-   `CustomSelectControlV2`: fix popover styles. ([#62821](https://github.com/WordPress/gutenberg/pull/62821))
-   `CustomSelectControlV2`: fix trigger text alignment in RTL languages ([#62869](https://github.com/WordPress/gutenberg/pull/62869)).
-   `CustomSelectControlV2`: allow wrapping item hint to new line ([#62848](https://github.com/WordPress/gutenberg/pull/62848)).
-   `CustomSelectControlV2`: fix select popover content overflow. ([#62844](https://github.com/WordPress/gutenberg/pull/62844))
-   `CustomSelectControlV2`: keep item checkmark top aligned. ([#63230](https://github.com/WordPress/gutenberg/pull/63230))
-   `CustomSelectControlV2`: keep legacy arrow down behavior only for legacy wrapper. ([#62919](https://github.com/WordPress/gutenberg/pull/62919))
-   `CustomSelectControlV2`: fix trigger button font size. ([#63131](https://github.com/WordPress/gutenberg/pull/63131))
-   `CustomSelectControlV2`: fix labelling with a visually hidden label. ([#63137](https://github.com/WordPress/gutenberg/pull/63137))
-   `CustomSelectControlV2`: allow checkmark wrapper to collapse when not shown. ([#63229](https://github.com/WordPress/gutenberg/pull/63229))
-   Extract `TimeInput` component from `TimePicker` ([#60613](https://github.com/WordPress/gutenberg/pull/60613)).
-   `TimeInput`: Add `label` prop ([#63106](https://github.com/WordPress/gutenberg/pull/63106)).
-   Method style type signatures have been changed to function style ([#62718](https://github.com/WordPress/gutenberg/pull/62718)).
-   `FontSizePicker`: use CustomSelectControl V2 legacy adapter ([#63134](https://github.com/WordPress/gutenberg/pull/63134)).

## 28.2.0 (2024-06-26)

### Enhancements

-   `DropZone`: rewrite animation without depending on framer-motion. ([#62044](https://github.com/WordPress/gutenberg/pull/62044))
-   `__experimentalPaletteEdit`: improve the accessibility. ([#62753](https://github.com/WordPress/gutenberg/pull/62753))

### Internal

-   `CustomSelectControl`: align unit tests for v1 and legacy v2 versions. ([#62706](https://github.com/WordPress/gutenberg/pull/62706))
-   `CustomSelectControlV2`: fix handling of extra option attributes in the `onChange` callbacks and when forwarding them to the option DOM elements. ([#62255](https://github.com/WordPress/gutenberg/pull/62255))
-   `CustomSelectControlV2`: fix setting initial value and reacting to external controlled updates. ([#62733](https://github.com/WordPress/gutenberg/pull/62733))
-   `CustomSelectControlV2`: Handle long strings in selected value ([#62198](https://github.com/WordPress/gutenberg/pull/62198)).

## 28.1.0 (2024-06-15)

### Enhancements

-   Add `text-wrap: balance` fallback to all instances of `text-wrap: pretty` for greater cross browser compatibility. ([#62233](https://github.com/WordPress/gutenberg/pull/62233))
-   Updates the space between input + label to `8px` in CheckboxControl and RadioControl. Also increased the space between RadioControl components to `12px` to make it consistent with CheckboxControl. ([#61696](https://github.com/WordPress/gutenberg/pull/61696))

### Bug Fixes

-   `Tabs`: Prevent accidental overflow in indicator ([#61979](https://github.com/WordPress/gutenberg/pull/61979)).

## 28.0.0 (2024-05-31)

### Breaking Changes

-   Variables like `process.env.IS_GUTENBERG_PLUGIN` have been replaced by `globalThis.IS_GUTENBERG_PLUGIN`. Build systems using `process.env` should be updated ([#61486](https://github.com/WordPress/gutenberg/pull/61486)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

### Enhancements

-   `Tabs`: Animate indicator ([#60560](https://github.com/WordPress/gutenberg/pull/60560)).
-   `ComboboxControl`: Introduce Combobox expandOnFocus prop ([#61705](https://github.com/WordPress/gutenberg/pull/61705)).
-   `ProgressBar`: Expose as public API ([#61062](https://github.com/WordPress/gutenberg/pull/61062)).
-   `ProgressBar`: Simplify default width implementation and make it more easily overridable ([#61976](https://github.com/WordPress/gutenberg/pull/61976)).

### Bug Fixes

-   `Autocomplete`: Stabilize rendering of autocomplete items ([#61877](https://github.com/WordPress/gutenberg/pull/61877)).
-   `TabPanel`: Make the the focus styles consistent with `Tabs`. ([#61317](https://github.com/WordPress/gutenberg/pull/61317)).
-   `InputControl`: Fixed z-index issue where slider dots appeared in front of the Appearance dropdown. ([#61937](https://github.com/WordPress/gutenberg/pull/61937))

### Internal

-   Remove `reduceMotion` util ([#61963](https://github.com/WordPress/gutenberg/pull/61963)).
-   Add type support for CSS Custom Properties ([#61872](https://github.com/WordPress/gutenberg/pull/61872)).
-   Remove usage of deprecated spreading of `key` prop in JSX in CustomSelectControl and FormTokenField components ([#61692](https://github.com/WordPress/gutenberg/pull/61692)).
-   `Tooltip`: Fix Ariakit tooltip store usage ([#61858](https://github.com/WordPress/gutenberg/pull/61858)).
-   `CustomSelectControlV2`: Use `InputBase` for styling ([#60261](https://github.com/WordPress/gutenberg/pull/60261)).

## 27.6.0 (2024-05-16)

### Internal

-   Replaced `classnames` package with the faster and smaller `clsx` package ([#61138](https://github.com/WordPress/gutenberg/pull/61138)).
-   Upgrade `@use-gesture/react` package to `^10.3.1` ([#61503](https://github.com/WordPress/gutenberg/pull/61503)).
-   Upgrade `framer-motion` package to version `^11.1.9` ([#61572](https://github.com/WordPress/gutenberg/pull/61572)).

### Enhancements

-   `FontSizePicker`: Add `vw` and `vh` units to the default units in the font size picker ([#60507](<(https://github.com/WordPress/gutenberg/pull/60607)>).
-   `PaletteEdit`: Use consistent spacing and metrics. ([#61368](https://github.com/WordPress/gutenberg/pull/61368)).
-   `FormTokenField`: Hide label when not defined ([#61336](https://github.com/WordPress/gutenberg/pull/61336)).
-   `ComboboxControl`: supports disabled items ([#61294](https://github.com/WordPress/gutenberg/pull/61294)).
-   Upgraded the @types/react and @types/react-dom packages ([#60796](https://github.com/WordPress/gutenberg/pull/60796)).
-   `Placeholder`: Tweak placeholder style ([#61590](https://github.com/WordPress/gutenberg/pull/61590)).

### Bug Fixes

-   `ToolsPanel`: Fix sticking “Reset” option ([#60621](https://github.com/WordPress/gutenberg/pull/60621)).
-   Fix an issue where types used a synthetic default import ([#61679](https://github.com/WordPress/gutenberg/pull/61679)).

## 27.5.0 (2024-05-02)

### Enhancements

-   Replaced `classnames` package with the faster and smaller `clsx` package ([#61138](https://github.com/WordPress/gutenberg/pull/61138)).
-   `InputControl`: Add a password visibility toggle story ([#60898](https://github.com/WordPress/gutenberg/pull/60898)).
-   `View`: Fix prop types ([#60919](https://github.com/WordPress/gutenberg/pull/60919)).
-   `Placeholder`: Unify appearance across. ([#59275](https://github.com/WordPress/gutenberg/pull/59275)).
-   `Toolbar`: Adjust top toolbar to use same metrics as block toolbar ([#61126](https://github.com/WordPress/gutenberg/pull/61126)).
-   `DropZone`: Avoid a media query on mount [#60546](https://github.com/WordPress/gutenberg/pull/60546)).
-   `ComboboxControl`: Simplify string normalization ([#60893](https://github.com/WordPress/gutenberg/pull/60893)).

### Bug Fixes

-   `BaseControl`, `InputControl`: Remove usage of aria-details from InputControl and BaseControl ([#61203](https://github.com/WordPress/gutenberg/pull/61203)).
-   `SlotFill`: fixed missing `getServerSnapshot` parameter in slot map ([#60943](https://github.com/WordPress/gutenberg/pull/60943)).
-   `Panel`: Fix issue with collapsing panel header ([#61319](https://github.com/WordPress/gutenberg/pull/61319)).

### Internal

-   `FontSizerPicker`: Improve docs for default units ([#60996](https://github.com/WordPress/gutenberg/pull/60996)).

## 27.4.0 (2024-04-19)

### Deprecations

-   `Navigation`: Soft deprecate component ([#59182](https://github.com/WordPress/gutenberg/pull/59182)).

### Enhancements

-   `Tooltip`: Make tests faster ([#60897](https://github.com/WordPress/gutenberg/pull/60897)).
-   `ExternalLink`: Use unicode arrow instead of svg icon ([#60255](https://github.com/WordPress/gutenberg/pull/60255)).
-   `ProgressBar`: Move the indicator width styles from emotion to a CSS variable ([#60388](https://github.com/WordPress/gutenberg/pull/60388)).
-   `Text`: Add `text-wrap: pretty;` to improve wrapping ([#60164](https://github.com/WordPress/gutenberg/pull/60164)).
-   `Navigator`: Navigation to the active path doesn't create a new location history ([#60561](https://github.com/WordPress/gutenberg/pull/60561)).
-   `FormToggle`: Forwards ref to input ([#60234](https://github.com/WordPress/gutenberg/pull/60234)).
-   `ToggleControl`: Forwards ref to FormToggle ([#60234](https://github.com/WordPress/gutenberg/pull/60234)).
-   `CheckboxControl`: Update help text alignment ([#60787](https://github.com/WordPress/gutenberg/pull/60787)).

### Bug Fixes

-   `Truncate`: Fix link control link preview when it displays long URLs ([#60890](https://github.com/WordPress/gutenberg/pull/60890)).

-   `ProgressBar`: Fix CSS variable with invalid value ([#60576](https://github.com/WordPress/gutenberg/pull/60576)).
-   `CheckboxControl`: Fix label text wrap ([#60787](https://github.com/WordPress/gutenberg/pull/60787)).

### Experimental

-   `Tabs`: Fallback to first enabled tab if no active tab id ([#60681](https://github.com/WordPress/gutenberg/pull/60681)).

### Internal

-   Remove CSS hack for Internet Explorer 11 ([#60727](https://github.com/WordPress/gutenberg/pull/60727)).
-   `CheckboxControl`: Streamline size styles ([#60475](https://github.com/WordPress/gutenberg/pull/60475)).
-   Deprecate `reduceMotion` util ([#60839](https://github.com/WordPress/gutenberg/pull/60839)).
-   `InputBase`: Simplify management of focus styles. Affects all components based on `InputControl` (e.g. `SearchControl`, `NumberControl`, `UnitControl`), as well as `SelectControl`, `CustomSelectControl`, and `TreeSelect` ([#60226](https://github.com/WordPress/gutenberg/pull/60226)).
-   Removed dependency on `valtio`, replaced its usage in `SlotFill` with a custom object [#60879](https://github.com/WordPress/gutenberg/pull/60879)).
-   `CustomSelectControlV2`: Support disabled in item types ([#60896](https://github.com/WordPress/gutenberg/pull/60896)).

## 27.3.0 (2024-04-03)

### Bug Fixes

-   `Dropdown`: Fix bug with separator styling. ([#60336](https://github.com/WordPress/gutenberg/pull/60336)).
-   `InputControl`: Ignore IME events when `isPressEnterToChange` is enabled ([#60090](https://github.com/WordPress/gutenberg/pull/60090)).
-   `TextControl`: Apply zero margin to input element ([#60282](https://github.com/WordPress/gutenberg/pull/60282)).

### Experimental

-   `CustomSelectControlV2`: Rename for consistency ([#60178](https://github.com/WordPress/gutenberg/pull/60178)).

### Internal

-   `Popover`, `ColorPicker`: Obviate pointer event trap #59449 ([#59449](https://github.com/WordPress/gutenberg/pull/59449)).
-   `Popover`, `ToggleGroupControl`: Use `useReducedMotion()` ([#60168](https://github.com/WordPress/gutenberg/pull/60168)).
-   `NavigatorProvider`: Simplify the router state logic ([#60190](https://github.com/WordPress/gutenberg/pull/60190)).
-   Update `date-fns` to version `3.6.0` ([#60163](https://github.com/WordPress/gutenberg/pull/60163)).
-   Update `use-lilius` to version `2.0.5` ([#60163](https://github.com/WordPress/gutenberg/pull/60163)).

### Experimental

-   `CustomSelectControlV2`: Fix hint behavior in legacy ([#60183](https://github.com/WordPress/gutenberg/pull/60183)).

## 27.2.0 (2024-03-21)

-   `Dropdown` : Add styling support for `MenuGroup` ([#59723](https://github.com/WordPress/gutenberg/pull/59723)).
-   `Placeholder` : Allow overflow but only when placeholder is selected, to fix a layout shift. ([#59857](https://github.com/WordPress/gutenberg/pull/59857)).

### Enhancements

-   `TextControl`: Add typings for `date`, `time` and `datetime-local` ([#59666](https://github.com/WordPress/gutenberg/pull/59666)).
-   `Text`, `Heading`, `ItemGroup` : Update the line height from 1.2 to 1.4 ([#60041](https://github.com/WordPress/gutenberg/pull/60041)).
-   `Autocomplete` : match the autocomplete styling to that of List View and Command Palette([#60131](https://github.com/WordPress/gutenberg/pull/60131)).

### Deprecations

-   `isSmall` prop in `Button` component has been deprecated. Use `size="small"` prop instead ([#59734](https://github.com/WordPress/gutenberg/pull/59734)).

### Internal

-   `Button`: Keep deprecated props in type definitions ([#59913](https://github.com/WordPress/gutenberg/pull/59913)).

### Bug Fixes

-   `PaletteEdit`: Fix number incrementing of default names for new colors added in non-en-US locales ([#52212](https://github.com/WordPress/gutenberg/pull/52212)).
-   `DateTimePicker`: Change day button size back from 32px to 28px ([#59990](https://github.com/WordPress/gutenberg/pull/59990)).

## 27.1.0 (2024-03-06)

### Bug Fixes

-   `InputControl`: Fix sample code on InputControl docs [#59517](https://github.com/WordPress/gutenberg/pull/59517)
-   `Tooltip`: Explicitly set system font to avoid CSS bleed ([#59307](https://github.com/WordPress/gutenberg/pull/59307)).
-   `HStack`, `VStack`: Stop passing invalid props to underlying element ([#59416](https://github.com/WordPress/gutenberg/pull/59416)).
-   `Button`: Fix focus outline in disabled primary variant ([#59391](https://github.com/WordPress/gutenberg/pull/59391)).
-   `Button`: Place `children` before the icon when `iconPosition` is `right` ([#59489](https://github.com/WordPress/gutenberg/pull/59489)).
-   `ToggleGroupControl`: Fix unwanted backdrop vertical animation ([#59642](https://github.com/WordPress/gutenberg/pull/59642)).

### Internal

-   `SnackbarList`, `Snackbar`: add unit tests ([#59157](https://github.com/WordPress/gutenberg/pull/59157)).
-   Remove unused `useLatestRef()` hook ([#59471](https://github.com/WordPress/gutenberg/pull/59471)).

### Experimental

-   `CustomSelectControlV2`: Remove legacy adapter layer ([#59420](https://github.com/WordPress/gutenberg/pull/59420)).

## 27.0.0 (2024-02-21)

### Breaking Changes

-   `CustomSelectControl`: Remove deprecated `__nextUnconstrainedWidth` prop and promote to default behavior ([#58974](https://github.com/WordPress/gutenberg/pull/58974)).

### Bug Fixes

-   `ToolbarButton`: Center text for short labels ([#59117](https://github.com/WordPress/gutenberg/pull/59117)).

### Internal

-   `ColorPicker`: Style without accessing internal `InputControl` classes ([#59069](https://github.com/WordPress/gutenberg/pull/59069)).
-   Add lint rules for theme color CSS var usage ([#59022](https://github.com/WordPress/gutenberg/pull/59022)).
-   `FormTokenField`: Use `Element.scrollIntoView()` instead of `dom-scroll-into-view` ([#59085](https://github.com/WordPress/gutenberg/pull/59085)).
-   Removing `dom-scroll-into-view` as a dependency of the components package ([#59085](https://github.com/WordPress/gutenberg/pull/59085)).
-   Add higher-order function to ignore IME keydowns ([#59081](https://github.com/WordPress/gutenberg/pull/59081)).

### Experimental

-   `Tabs`: rename `initialTabId` prop to `defaultTabId` ([#59035](https://github.com/WordPress/gutenberg/pull/59035)).

## 26.0.1 (2024-02-13)

### Bug Fixes

-   `Modal`: Add `box-sizing` reset style ([#58905](https://github.com/WordPress/gutenberg/pull/58905)).
-   `Popover`: Fix positioning in nested iframes by upgrading Floating UI packages to their latest versions ([#58932](https://github.com/WordPress/gutenberg/pull/58932)).

### Experimental

-   `CustomSelectControlV2`: Adapt component for legacy usage ([#57902](https://github.com/WordPress/gutenberg/pull/57902)).

## 26.0.0 (2024-02-09)

### Breaking Changes

-   `FontSizePicker`: Remove deprecated `__nextHasNoMarginBottom` prop and promote to default behavior ([#58702](https://github.com/WordPress/gutenberg/pull/58702)).
-   `GradientPicker`: Remove deprecated `__nextHasNoMargin` prop and promote to default behavior ([#58701](https://github.com/WordPress/gutenberg/pull/58701)).
-   `CustomGradientPicker`: Remove deprecated `__nextHasNoMargin` prop and promote to default behavior ([#58699](https://github.com/WordPress/gutenberg/pull/58699)).
-   `AnglePickerControl`: Remove deprecated `__nextHasNoMarginBottom` prop and promote to default behavior ([#58700](https://github.com/WordPress/gutenberg/pull/58700)).

### Enhancements

-   `Button`: Update secondary variant to show the border even in a disabled state. ([#58606](https://github.com/WordPress/gutenberg/pull/58606)).
-   `ConfirmDialog`: Add `__next40pxDefaultSize` to buttons ([#58421](https://github.com/WordPress/gutenberg/pull/58421)).
-   `Snackbar`: Update the warning message ([#58591](https://github.com/WordPress/gutenberg/pull/58591)).
-   `Composite`: Implementing `useCompositeState` with Ariakit ([#57304](https://github.com/WordPress/gutenberg/pull/57304)).
-   Remove deprecation warnings for `__next36pxDefaultSize` prop ([#58703](https://github.com/WordPress/gutenberg/pull/58703)).
-   `CheckboxControl`: Remove ability for label prop to be false ([#58339](https://github.com/WordPress/gutenberg/pull/58339)).
-   `FocalPointPicker`: Apply modern styling ([#58459](https://github.com/WordPress/gutenberg/pull/58459)).

### Bug Fixes

-   `FocalPointPicker`: Allow `PointerCircle` to render in a default centered position when x and y coordinates are undefined ([#58592](https://github.com/WordPress/gutenberg/pull/58592)).
-   `DateTime`: Add a timezone offset value for display purposes. ([#56682](https://github.com/WordPress/gutenberg/pull/56682)).
-   `Placeholder`: Fix Placeholder component padding when body text font size is changed ([#58323](https://github.com/WordPress/gutenberg/pull/58323)).
-   `Placeholder`: Fix Global Styles typography settings bleeding into placeholder component ([#58303](https://github.com/WordPress/gutenberg/pull/58303)).
-   `PaletteEdit`: Fix palette item accessibility in details view ([#58214](https://github.com/WordPress/gutenberg/pull/58214)).
-   `Snackbar`: Fix the auto-dismissal timers ([#58604](https://github.com/WordPress/gutenberg/pull/58604)).
-   `Tabs`: Fix infinite loop in `useEffect` ([#58861](https://github.com/WordPress/gutenberg/pull/58861)).
-   `Popover`: Add `box-sizing` reset style ([#58871](https://github.com/WordPress/gutenberg/pull/58871)).

### Experimental

-   `Guide`, `Modal`: Restore accent color themability ([#58098](https://github.com/WordPress/gutenberg/pull/58098)).
-   `DropdownMenuV2`: Restore accent color themability ([#58130](https://github.com/WordPress/gutenberg/pull/58130)).
-   `Tabs`: improve controlled mode focus handling and keyboard navigation ([#57696](https://github.com/WordPress/gutenberg/pull/57696)).
-   `Tabs`: prevent internal focus from updating too early ([#58625](https://github.com/WordPress/gutenberg/pull/58625)).
-   Expand theming support in the `COLORS` variable object ([#58097](https://github.com/WordPress/gutenberg/pull/58097)).
-   `CustomSelect`: disable `virtualFocus` to fix issue for screenreaders ([#58585](https://github.com/WordPress/gutenberg/pull/58585)).

### Internal

-   `Composite`: Removing Reakit `Composite` implementation ([#58620](https://github.com/WordPress/gutenberg/pull/58620)).
-   Removing Reakit as a dependency of the components package ([#58631](https://github.com/WordPress/gutenberg/pull/58631)).
-   `CustomSelect`: add unit tests ([#58583](https://github.com/WordPress/gutenberg/pull/58583)).
-   `InputBase`: Add `isBorderless` prop ([#58750](https://github.com/WordPress/gutenberg/pull/58750)).
-   `SearchControl`: Replace internal implementation to use `InputControl` ([#56524](https://github.com/WordPress/gutenberg/pull/56524)).

## 25.16.0 (2024-01-24)

### Enhancements

-   `ColorPicker`: improve the UX around HSL sliders ([#57555](https://github.com/WordPress/gutenberg/pull/57555)).
-   `BoxControl`, `BorderControl`, `BorderBoxControl`: Add opt-in prop for 40px default size ([#56185](https://github.com/WordPress/gutenberg/pull/56185)).
-   `PaletteEdit`: improve unit tests ([#57645](https://github.com/WordPress/gutenberg/pull/57645)).
-   `PaletteEdit` and `CircularOptionPicker`: improve unit tests ([#57809](https://github.com/WordPress/gutenberg/pull/57809)).
-   `Tooltip`: no-op when nested inside other `Tooltip` components ([#57202](https://github.com/WordPress/gutenberg/pull/57202)).
-   `Tooltip` and `Button`: tidy up unit tests ([#57975](https://github.com/WordPress/gutenberg/pull/57975)).
-   `BorderControl`, `BorderBoxControl`: Replace style picker with ToggleGroupControl ([#57562](https://github.com/WordPress/gutenberg/pull/57562)).
-   `SlotFill`: fix typo in use-slot-fills return docs ([#57654](https://github.com/WordPress/gutenberg/pull/57654))
-   `Popover`: Adding `constrainTabbing` prop to `useDialog` hook ([#57962](https://github.com/WordPress/gutenberg/pull/57962))

### Bug Fixes

-   `ToggleGroupControl`: Improve controlled value detection ([#57770](https://github.com/WordPress/gutenberg/pull/57770)).
-   `Tooltip`: Improve props forwarding to children of nested `Tooltip` components ([#57878](https://github.com/WordPress/gutenberg/pull/57878)).
-   `Tooltip`: revert prop types to only accept component-specific props ([#58125](https://github.com/WordPress/gutenberg/pull/58125)).
-   `Button`: prevent the component from trashing and re-creating the HTML element ([#56490](https://github.com/WordPress/gutenberg/pull/56490)).

### Experimental

-   `BoxControl`: Update design ([#56665](https://github.com/WordPress/gutenberg/pull/56665)).
-   `CustomSelect`: adjust `renderSelectedValue` to fix sizing ([#57865](https://github.com/WordPress/gutenberg/pull/57865)).
-   `Theme`: Set `color` on wrapper div ([#58095](https://github.com/WordPress/gutenberg/pull/58095)).

## 25.15.0 (2024-01-10)

### Bug Fixes

-   `NumberControl`: Make increment and decrement buttons keyboard accessible. ([#57402](https://github.com/WordPress/gutenberg/pull/57402)).
-   `DropdownMenu V2`: better fallback on browsers that don't support CSS subgrid([#57327](https://github.com/WordPress/gutenberg/pull/57327)).
-   `FontSizePicker`: Use Button API for keeping focus on reset ([#57221](https://github.com/WordPress/gutenberg/pull/57221)).
-   `FontSizePicker`: Fix Reset button focus loss ([#57196](https://github.com/WordPress/gutenberg/pull/57196)).
-   `PaletteEdit`: Consider digits when generating kebab-cased slug ([#56713](https://github.com/WordPress/gutenberg/pull/56713)).
-   `FormTokenField`: Prevent focus being passed to internal buttons when component is disabled ([#57187](https://github.com/WordPress/gutenberg/pull/57187)).
-   `Button`: Fix logic of `has-text` class addition ([#56949](https://github.com/WordPress/gutenberg/pull/56949)).
-   `FormTokenField`: Fix a regression where the suggestion list would re-open after clicking away from the input ([#57002](https://github.com/WordPress/gutenberg/pull/57002)).
-   `Snackbar`: Remove erroneous `__unstableHTML` prop from TypeScript definitions ([#57218](https://github.com/WordPress/gutenberg/pull/57218)).
-   `Truncate`: improve handling of non-string `children` ([#57261](https://github.com/WordPress/gutenberg/pull/57261)).
-   `PaletteEdit`: Don't discard colors with default name and slug ([#54332](https://github.com/WordPress/gutenberg/pull/54332)).
-   `RadioControl`: Fully encapsulate styles ([#57347](https://github.com/WordPress/gutenberg/pull/57347)).
-   `DuotonePicker`: Remove top margin when no duotone options ([#57489](https://github.com/WordPress/gutenberg/pull/57489)).
-   `Snackbar`: Fix icon positioning ([#57377](https://github.com/WordPress/gutenberg/pull/57377)).
-   `GradientPicker`: Use slug while iterating over gradient entries to avoid React "duplicated key" warning ([#57361](https://github.com/WordPress/gutenberg/pull/57361)).
-   `NavigatorProvider`: Exclude `size` value from `contain` CSS rule ([#57498](https://github.com/WordPress/gutenberg/pull/57498)).

### Enhancements

-   Update `ariakit` to version `0.3.10` ([#57325](https://github.com/WordPress/gutenberg/pull/57325)).
-   Update `@ariakit/react` to version `0.3.12` and @ariakit/test to version `0.3.7` ([#57547](https://github.com/WordPress/gutenberg/pull/57547)).
-   `DropdownMenuV2`: do not collapse suffix width ([#57238](https://github.com/WordPress/gutenberg/pull/57238)).
-   `DateTimePicker`: Adjustment of the dot position on DayButton and expansion of the button area. ([#55502](https://github.com/WordPress/gutenberg/pull/55502)).
-   `Modal`: Improve application of body class names ([#55430](https://github.com/WordPress/gutenberg/pull/55430)).
-   `BaseControl`: Connect to context system ([#57408](https://github.com/WordPress/gutenberg/pull/57408)).
-   `InputControl`, `NumberControl`, `UnitControl`, `SelectControl`, `TreeSelect`: Add `compact` size variant ([#57398](https://github.com/WordPress/gutenberg/pull/57398)).
-   `ToggleGroupControl`: Update button size in large variant to be 32px ([#57338](https://github.com/WordPress/gutenberg/pull/57338)).
-   `Tooltip`: improve unit tests ([#57345](https://github.com/WordPress/gutenberg/pull/57345)).

### Experimental

-   `DropdownMenuV2`: remove temporary radix UI based implementation ([#55626](https://github.com/WordPress/gutenberg/pull/55626)).
-   `Tabs`: do not render hidden content ([#57046](https://github.com/WordPress/gutenberg/pull/57046)).
-   `Tabs`: improve hover and text alignment styles ([#57275](https://github.com/WordPress/gutenberg/pull/57275)).
-   `Tabs`: make sure `Tab`s are associated to the right `TabPanel`s, regardless of the order they're rendered in ([#57033](https://github.com/WordPress/gutenberg/pull/57033)).

## 25.14.0 (2023-12-13)

### Enhancements

-   `Navigator`: use vanilla CSS animations instead of `framer-motion` ([#56909](https://github.com/WordPress/gutenberg/pull/56909)).
-   `FormToggle`: fix sass deprecation warning ([#56672](https://github.com/WordPress/gutenberg/pull/56672)).
-   `QueryControls`: Add opt-in prop for 40px default size ([#56576](https://github.com/WordPress/gutenberg/pull/56576)).
-   `CheckboxControl`: Add option to not render label ([#56158](https://github.com/WordPress/gutenberg/pull/56158)).
-   `PaletteEdit`: Gradient pickers to use same width as color pickers ([#56801](https://github.com/WordPress/gutenberg/pull/56801)).
-   `FocalPointPicker`: Add opt-in prop for 40px default size ([#56021](https://github.com/WordPress/gutenberg/pull/56021)).
-   `DimensionControl`: Add opt-in prop for 40px default size ([#56805](https://github.com/WordPress/gutenberg/pull/56805)).
-   `FontSizePicker`: Add opt-in prop for 40px default size ([#56804](https://github.com/WordPress/gutenberg/pull/56804)).
-   `ToolsPanel`/`ToolsPanelHeader`: Added `dropdownMenuProps` to allow customization of the panel's dropdown menu. Also merged default and optional control menu groups ([#55785](https://github.com/WordPress/gutenberg/pull/55785)).

### Bug Fixes

-   `PaletteEdit`: temporary custom gradient not saving ([#56896](https://github.com/WordPress/gutenberg/pull/56896)).
-   `ToggleGroupControl`: react correctly to external controlled updates ([#56678](https://github.com/WordPress/gutenberg/pull/56678)).
-   `ToolsPanel`: fix a performance issue ([#56770](https://github.com/WordPress/gutenberg/pull/56770)).
-   `BorderControl`: adjust `BorderControlDropdown` Button size to fix misaligned border ([#56730](https://github.com/WordPress/gutenberg/pull/56730)).
-   `SlotFillProvider`: Restore contextual Slot/Fills within SlotFillProvider ([#56779](https://github.com/WordPress/gutenberg/pull/56779)).

### Internal

-   `DropdownMenuV2Ariakit`: prevent prefix collapsing if all radios or checkboxes are unselected ([#56720](https://github.com/WordPress/gutenberg/pull/56720)).
-   Move `kebabCase()` function from `block-editor` package and mark it as private API ([#56758](https://github.com/WordPress/gutenberg/pull/56758)).

### Experimental

-   `Tabs`: implement new `tabId` prop ([#56883](https://github.com/WordPress/gutenberg/pull/56883)).
-   `CustomSelect`: add `WordPressComponentsProps` for more flexibility ([#56998](https://github.com/WordPress/gutenberg/pull/56998))

### Experimental

-   `Tabs`: improve focus handling in controlled mode ([#56658](https://github.com/WordPress/gutenberg/pull/56658)).

### Documentation

-   `Search`: Added links to storybook for more information on usage. ([#56815](https://github.com/WordPress/gutenberg/pull/56815)).
-   `Spinner`: Added links to storybook for more information on usage. ([#56953](https://github.com/WordPress/gutenberg/pull/56953)).

## 25.13.0 (2023-11-29)

### Enhancements

-   `FormToggle`: refine animation and improve high contrast styles ([#56515](https://github.com/WordPress/gutenberg/pull/56515)).
-   `Button`: Add focus rings to focusable disabled buttons ([#56383](https://github.com/WordPress/gutenberg/pull/56383)).
-   `InserterButton`: Move mobile InserterButton from components package to block-editor package ([#56494](https://github.com/WordPress/gutenberg/pull/56494))

### Bug Fixes

-   `DateTime`: Make the Timezone indication render a tooltip only when necessary. ([#56214](https://github.com/WordPress/gutenberg/pull/56214)).
-   `ToolsPanelItem`: Use useLayoutEffect to prevent rendering glitch for last panel item styling. ([#56536](https://github.com/WordPress/gutenberg/pull/56536)).
-   `FormTokenField`: Fix broken suggestions scrollbar when the `__experimentalExpandOnFocus` prop is defined ([#56426](https://github.com/WordPress/gutenberg/pull/56426)).
-   `FormTokenField`: `onFocus` prop is now typed as a React `FocusEvent` ([#56426](https://github.com/WordPress/gutenberg/pull/56426)).

### Experimental

-   `Tabs`: Memoize and expose the component context ([#56224](https://github.com/WordPress/gutenberg/pull/56224)).
-   `DropdownMenuV2`: Design tweaks ([#56041](https://github.com/WordPress/gutenberg/pull/56041))

### Documentation

-   `Text` and `Heading`: improve docs around default values and truncation logic ([#56518](https://github.com/WordPress/gutenberg/pull/56518))

### Internal

-   `Slot`: add `style` prop to `bubblesVirtually` version ([#56428](https://github.com/WordPress/gutenberg/pull/56428))
-   Introduce experimental new version of `CustomSelectControl` based on `ariakit` ([#55790](https://github.com/WordPress/gutenberg/pull/55790))
-   `Composite`: add unit tests for `useCompositeState` ([#56645](https://github.com/WordPress/gutenberg/pull/56645)).

## 25.12.0 (2023-11-16)

### Bug Fixes

-   `Toolbar`: Remove CSS rule that prevented focus outline to be visible for toolbar buttons in the `:active` state. ([#56123](https://github.com/WordPress/gutenberg/pull/56123)).

### Internal

-   Migrate `Divider` from `reakit` to `ariakit` ([#55622](https://github.com/WordPress/gutenberg/pull/55622))
-   Migrate `DisclosureContent` from `reakit` to `ariakit` and TypeScript ([#55639](https://github.com/WordPress/gutenberg/pull/55639))
-   Migrate `RadioGroup` from `reakit` to `ariakit` and TypeScript ([#55580](https://github.com/WordPress/gutenberg/pull/55580))

### Experimental

-   `Tabs`: Add `focusable` prop to the `Tabs.TabPanel` sub-component ([#55287](https://github.com/WordPress/gutenberg/pull/55287))
-   `Tabs`: Update sub-components to accept relevant HTML element props ([#55860](https://github.com/WordPress/gutenberg/pull/55860))
-   `DropdownMenuV2`: Fix radio menu item check icon not rendering correctly in some browsers ([#55964](https://github.com/WordPress/gutenberg/pull/55964))
-   `DropdownMenuV2`: prevent default when pressing Escape key to close menu ([#55962](https://github.com/WordPress/gutenberg/pull/55962))

### Enhancements

-   `ToggleGroupControl`: Add opt-in prop for 40px default size ([#55789](https://github.com/WordPress/gutenberg/pull/55789)).
-   `TextControl`: Add opt-in prop for 40px default size ([#55471](https://github.com/WordPress/gutenberg/pull/55471)).

### Bug Fixes

-   `DropdownMenu`: remove extra vertical space around the toggle button ([#56136](https://github.com/WordPress/gutenberg/pull/56136)).
-   Package should not depend on `@ariakit/test`, that package is only needed for testing ([#56091](https://github.com/WordPress/gutenberg/pull/56091)).

## 25.11.0 (2023-11-02)

### Enhancements

-   `InputControl`/`SelectControl`: update `height`/`min-height` to `32px` instead of `30px` to align with modern sizing scale ([#55490](https://github.com/WordPress/gutenberg/pull/55490)).

### Bug Fixes

-   `Autocomplete`: Add `aria-live` announcements for Mac and IOS Voiceover to fix lack of support for `aria-owns` ([#54902](https://github.com/WordPress/gutenberg/pull/54902)).
-   Improve Button saving state accessibility. ([#55547](https://github.com/WordPress/gutenberg/pull/55547))

### Internal

-   Introduce experimental new version of `DropdownMenu` based on `ariakit` ([#54939](https://github.com/WordPress/gutenberg/pull/54939))

## 25.10.0 (2023-10-18)

### Enhancements

-   `ProgressBar`: use text color to ensure enough contrast against background ([#55285](https://github.com/WordPress/gutenberg/pull/55285)).
-   `Notice`: Remove margins from `Notice` component ([#54800](https://github.com/WordPress/gutenberg/pull/54800)).
-   Allow using CSS level 4 viewport-relative units ([54415](https://github.com/WordPress/gutenberg/pull/54415))
-   `ToolsPanel`: do not apply the `className` to prop to `ToolsPanelItem` components when rendered as placeholders ([#55207](https://github.com/WordPress/gutenberg/pull/55207)).
-   `GradientPicker`: remove overflow styles and padding from `ColorPicker` popovers ([#55265](https://github.com/WordPress/gutenberg/pull/55265)).
-   `Tabs`: Expose via private APIs ([#55327](https://github.com/WordPress/gutenberg/pull/55327)).
-   `ColorPalette`/`ToggleGroupControl/ToggleGroupControlOptionBase`: add `type="button"` attribute to native `<button>`s ([#55125](https://github.com/WordPress/gutenberg/pull/55125)).

### Bug Fixes

-   Render a "mouse event trap" when using a `ColorPicker` inside a `Popover` to prevent issues when rendering on top of `iframes` ([#55149](https://github.com/WordPress/gutenberg/pull/55149)).
-   `Modal`: fix closing when contained iframe is focused ([#51602](https://github.com/WordPress/gutenberg/pull/51602)).
-   `Autocomplete`: Fix disappearing results issue when using multiple triggers inline ([#55301](https://github.com/WordPress/gutenberg/pull/55301))

### Internal

-   Update `@ariakit/react` to version `0.3.5` ([#55365](https://github.com/WordPress/gutenberg/pull/55365))
-   `ConfirmDialog`: Migrate to TypeScript. ([#54954](https://github.com/WordPress/gutenberg/pull/54954)).

### New Features

-   `Toolbar`: add new `variant` prop for 'unstyled' option ([#55139](https://github.com/WordPress/gutenberg/pull/55139)).

## 25.9.0 (2023-10-05)

### Enhancements

-   `SearchControl`: polish metrics for `compact` size variant ([#54663](https://github.com/WordPress/gutenberg/pull/54663)).
-   `Button`: deprecating `isPressed` prop in favour of `aria-pressed` ([#54740](https://github.com/WordPress/gutenberg/pull/54740)).
-   `DuotonePicker/ColorListPicker`: Adds appropriate label and description to 'Duotone Filter' picker ([#54473](https://github.com/WordPress/gutenberg/pull/54473)).
-   `Modal`: Accessibly hide/show outer modal when nested ([#54743](https://github.com/WordPress/gutenberg/pull/54743)).
-   `InputControl`, `NumberControl`, `UnitControl`, `SelectControl`, `CustomSelectControl`, `TreeSelect`: Add opt-in prop for next 40px default size, superseding the `__next36pxDefaultSize` prop ([#53819](https://github.com/WordPress/gutenberg/pull/53819)).
-   `Modal`: add a new `size` prop to support preset widths, including a `fill` option to eventually replace the `isFullScreen` prop ([#54471](https://github.com/WordPress/gutenberg/pull/54471)).
-   Wrapped `TextareaControl` in a `forwardRef` call ([#54975](https://github.com/WordPress/gutenberg/pull/54975)).
-   `Composite`/`AlignmentMatrixControl`/`CircularOptionPicker`: Starts the `Composite` migration from `reakit` to `ariakit` ([#54225](https://github.com/WordPress/gutenberg/pull/54225)).

### Bug Fixes

-   `Placeholder`: Improved DOM structure and screen reader announcements ([#45801](https://github.com/WordPress/gutenberg/pull/45801)).
-   `DateTimePicker`: fix onChange callback check so that it also works inside iframes ([#54669](https://github.com/WordPress/gutenberg/pull/54669)).
-   `FormTokenField`: Add `box-sizing` reset style and reset default padding ([#54734](https://github.com/WordPress/gutenberg/pull/54734)).
-   `SlotFill`: Pass `Component` instance to unregisterSlot ([#54765](https://github.com/WordPress/gutenberg/pull/54765)).
-   `Button`: Remove `aria-selected` CSS selector from styling 'active' buttons ([#54931](https://github.com/WordPress/gutenberg/pull/54931)).
-   `Popover`: Apply the CSS in JS styles properly for components used within popovers. ([#54912](https://github.com/WordPress/gutenberg/pull/54912))
-   `Button`: Remove hover styles when `aria-disabled` is set to `true` for the secondary variant. ([#54978](https://github.com/WordPress/gutenberg/pull/54978))
-   `Button`: Revert toggled style selector to use a class instead of attributes ([#55065](https://github.com/WordPress/gutenberg/pull/55065)).

### Internal

-   Update `@ariakit/react` to version `0.3.3` ([#54818](https://github.com/WordPress/gutenberg/pull/54818))
-   `Tooltip`, `Shortcut`: Remove unused `ui/` components from the codebase ([#54573](https://github.com/WordPress/gutenberg/pull/54573))
-   Refactor ariakit usages to use the `render` prop instead of `as` and to use the namespace import ([#54696](https://github.com/WordPress/gutenberg/pull/54696)).
-   Update `uuid` package to 9.0.1 ([#54725](https://github.com/WordPress/gutenberg/pull/54725)).
-   `ContextSystemProvider`: Move out of `ui/` ([#54847](https://github.com/WordPress/gutenberg/pull/54847)).
-   `SlotFill`: Migrate to TypeScript and Convert to Functional Component `<Slot bubblesVirtually />`. ([#51350](https://github.com/WordPress/gutenberg/pull/51350)).
-   `Components`: move `ui/utils` to `utils` and remove `ui/` folder ([#54922](https://github.com/WordPress/gutenberg/pull/54922)).
-   Ensure `@types/` dependencies used by final type files are included in the main dependency field ([#50231](https://github.com/WordPress/gutenberg/pull/50231)).
-   `Text`: Migrate to TypeScript. ([#54953](https://github.com/WordPress/gutenberg/pull/54953)).

### Experimental

-   Introduce `Tabs`, an experimental v2 of `TabPanel`: ([#53960](https://github.com/WordPress/gutenberg/pull/53960)).

## 25.8.0 (2023-09-20)

### Enhancements

-   Add new option `firstContentElement` to Modal's `focusOnMount` prop to allow consumers to focus the first element within the Modal's **contents** ([#54590](https://github.com/WordPress/gutenberg/pull/54590)).
-   `Notice`: Improve accessibility by adding visually hidden text to clarify what a notice text is about and the notice type (success, error, warning, info) ([#54498](https://github.com/WordPress/gutenberg/pull/54498)).
-   Making Circular Option Picker a `listbox`. Note that while this changes some public API, new props are optional, and currently have default values; this will change in another patch ([#52255](https://github.com/WordPress/gutenberg/pull/52255)).
-   `ToggleGroupControl`: Rewrite backdrop animation using framer motion shared layout animations, add better support for controlled and uncontrolled modes ([#50278](https://github.com/WordPress/gutenberg/pull/50278)).
-   `Popover`: Add the `is-positioned` CSS class only after the popover has finished animating ([#54178](https://github.com/WordPress/gutenberg/pull/54178)).
-   `Tooltip`: Replace the existing tooltip to simplify the implementation and improve accessibility while maintaining the same behaviors and API ([#48440](https://github.com/WordPress/gutenberg/pull/48440)).
-   `Dropdown` and `DropdownMenu`: support controlled mode for the dropdown's open/closed state ([#54257](https://github.com/WordPress/gutenberg/pull/54257)).
-   `BorderControl`: Apply proper metrics and simpler text ([#53998](https://github.com/WordPress/gutenberg/pull/53998)).
-   `FormTokenField`: Update styling for consistency and increased visibility ([#54402](https://github.com/WordPress/gutenberg/pull/54402)).
-   `CircularOptionPicker`: Add option to use previous non-listbox behaviour, for contexts where buttons are more appropriate than a list of options ([#54290](https://github.com/WordPress/gutenberg/pull/54290)).
-   `DuotonePicker/ColorListPicker`: Adds appropriate labels to 'Duotone Filter' color pickers ([#54468](https://github.com/WordPress/gutenberg/pull/54468)).
-   `SearchControl`: support new `40px` and `32px` sizes ([#54548](https://github.com/WordPress/gutenberg/pull/54548)).
-   `FormTokenField`: Add `tokenizeOnBlur` prop to add any incompleteTokenValue as a new token when field loses focus ([#54445](https://github.com/WordPress/gutenberg/pull/54445)).
-   `Sandbox`: Add `tabIndex` prop ([#54408](https://github.com/WordPress/gutenberg/pull/54408)).

### Bug Fixes

-   `Notice`: Make the Close button render a tooltip to visually expose its accessible name. All icon buttons must always show a tooltip ([#54498](https://github.com/WordPress/gutenberg/pull/54498)).
-   `Tooltip`: dynamically render in the DOM only when visible ([#54312](https://github.com/WordPress/gutenberg/pull/54312)).
-   `PaletteEdit`: Fix padding in RTL languages ([#54034](https://github.com/WordPress/gutenberg/pull/54034)).
-   `ToolbarItem`: Fix children not showing in rendered components ([#53314](https://github.com/WordPress/gutenberg/pull/53314)).
-   `CircularOptionPicker`: make focus styles resilient to button size changes ([#54196](https://github.com/WordPress/gutenberg/pull/54196)).
-   `InputControl`: Fix focus style size ([#54394](https://github.com/WordPress/gutenberg/pull/54394)).
-   `BorderControl`: Use standard focus style on BorderControl ([#54429](https://github.com/WordPress/gutenberg/pull/54429)).
-   `Color values`: Update borderFocus to ADMIN.theme ([#54425](https://github.com/WordPress/gutenberg/pull/54425)).

### Internal

-   `Toolbar/ToolbarDropdownMenu `: Convert to TypeScript ([#54321](https://github.com/WordPress/gutenberg/pull/54321)).
-   `Composite`: Convert to TypeScript ([#54028](https://github.com/WordPress/gutenberg/pull/54028)).
-   `BorderControl`: Refactor unit tests to use `userEvent` ([#54155](https://github.com/WordPress/gutenberg/pull/54155))
-   `FocusableIframe`: Convert to TypeScript ([#53979](https://github.com/WordPress/gutenberg/pull/53979)).
-   `Popover`: Remove unused `overlay` type from `positionToPlacement` utility function ([#54101](https://github.com/WordPress/gutenberg/pull/54101)).
-   `Higher Order` -- `with-focus-outside`: Convert to TypeScript ([#53980](https://github.com/WordPress/gutenberg/pull/53980)).
-   `IsolatedEventContainer`: Convert unit test to TypeScript ([#54316](https://github.com/WordPress/gutenberg/pull/54316)).
-   `Popover`: Remove `scroll` and `resize` listeners for iframe overflow parents and rely on recently added native Floating UI support ([#54286](https://github.com/WordPress/gutenberg/pull/54286)).
-   `Button`: Update documentation to remove the button `focus` prop ([#54397](https://github.com/WordPress/gutenberg/pull/54397)).
-   `Toolbar/ToolbarGroup`: Convert component to TypeScript ([#54317](https://github.com/WordPress/gutenberg/pull/54317)).
-   `Modal`: add more unit tests ([#54569](https://github.com/WordPress/gutenberg/pull/54569)).

### Experimental

-   `DropdownMenu` v2: Fix submenu chevron direction in RTL languages ([#54036](https://github.com/WordPress/gutenberg/pull/54036).

### New Features

-   `Tooltip`: Add new `hideOnClick` prop ([#54406](https://github.com/WordPress/gutenberg/pull/54406)).
-   `Tooltip`: Add `placement` prop to replace deprecated `position`([#54264](https://github.com/WordPress/gutenberg/pull/54264)).

## 25.7.0 (2023-08-31)

### Breaking Changes

-   Make the `Popover.Slot` optional and render popovers at the bottom of the document's body by default. ([#53889](https://github.com/WordPress/gutenberg/pull/53889), [#53982](https://github.com/WordPress/gutenberg/pull/53982)).

### Enhancements

-   `ProgressBar`: Add transition to determinate indicator ([#53877](https://github.com/WordPress/gutenberg/pull/53877)).
-   Prevent nested `SlotFillProvider` from rendering ([#53940](https://github.com/WordPress/gutenberg/pull/53940)).

### Bug Fixes

-   `SandBox`: Fix the cleanup method in useEffect ([#53796](https://github.com/WordPress/gutenberg/pull/53796)).
-   `PaletteEdit`: Fix the height of the `PaletteItems`. Don't rely on styles only present in the block editor ([#54000](https://github.com/WordPress/gutenberg/pull/54000)).

### Internal

-   `Shortcut`: Add Storybook stories ([#53627](https://github.com/WordPress/gutenberg/pull/53627)).
-   `SlotFill`: Do not render children when using `<Slot bubblesVirtually />`. ([#53272](https://github.com/WordPress/gutenberg/pull/53272))
-   Update `@floating-ui/react-dom` to the latest version ([#46845](https://github.com/WordPress/gutenberg/pull/46845)).

## 25.6.0 (2023-08-16)

### Enhancements

-   `Theme`: Expose via private APIs ([#53262](https://github.com/WordPress/gutenberg/pull/53262)).
-   `ProgressBar`: Use the theme system accent for indicator color ([#53347](https://github.com/WordPress/gutenberg/pull/53347)).
-   `ProgressBar`: Use gray 300 for track color ([#53349](https://github.com/WordPress/gutenberg/pull/53349)).
-   `Modal`: add `headerActions` prop to render buttons in the header. ([#53328](https://github.com/WordPress/gutenberg/pull/53328)).
-   `Snackbar`: Snackbar design and motion improvements ([#53248](https://github.com/WordPress/gutenberg/pull/53248))
-   `NumberControl`: Add `spinFactor` prop for adjusting the amount by which the spin controls change the value ([#52902](https://github.com/WordPress/gutenberg/pull/52902)).
-   `Modal:`: Nuance outside interactions ([#52994](https://github.com/WordPress/gutenberg/pull/52994)).
-   `Button`: Remove default border from the destructive button ([#53607](https://github.com/WordPress/gutenberg/pull/53607)).
-   Components: Move accent colors to theme context ([#53631](https://github.com/WordPress/gutenberg/pull/53631)).
-   `ProgressBar`: Use the new theme system accent for indicator color ([#53632](https://github.com/WordPress/gutenberg/pull/53632)).

### Bug Fixes

-   `Button`: add `:disabled` selector to reset hover color for disabled buttons ([#53411](https://github.com/WordPress/gutenberg/pull/53411)).

### Internal

-   `ControlGroup`, `FormGroup`, `ControlLabel`, `Spinner`: Remove unused `ui/` components from the codebase ([#52953](https://github.com/WordPress/gutenberg/pull/52953)).
-   `MenuItem`: Convert to TypeScript ([#53132](https://github.com/WordPress/gutenberg/pull/53132)).
-   `MenuItem`: Add Storybook stories ([#53613](https://github.com/WordPress/gutenberg/pull/53613)).
-   `MenuGroup`: Add Storybook stories ([#53090](https://github.com/WordPress/gutenberg/pull/53090)).
-   Components: Remove unnecessary utils ([#53679](https://github.com/WordPress/gutenberg/pull/53679)).

## 25.5.0 (2023-08-10)

### New Features

-   Add a new `ProgressBar` component. ([#53030](https://github.com/WordPress/gutenberg/pull/53030)).

### Enhancements

-   `ColorPalette`, `BorderControl`: Don't hyphenate hex value in `aria-label` ([#52932](https://github.com/WordPress/gutenberg/pull/52932)).
-   `MenuItemsChoice`, `MenuItem`: Support a `disabled` prop on a menu item ([#52737](https://github.com/WordPress/gutenberg/pull/52737)).
-   `TabPanel`: Introduce a new version of `TabPanel` with updated internals and improved adherence to ARIA guidance on `tabpanel` focus behavior while maintaining the same functionality and API surface.([#52133](https://github.com/WordPress/gutenberg/pull/52133)).

### Bug Fixes

-   `Modal`: Fix loss of focus when clicking outside ([#52653](https://github.com/WordPress/gutenberg/pull/52653)).

## 25.4.0 (2023-07-20)

### Enhancements

-   `TextControl`: Add `id` prop to allow for custom IDs in `TextControl`s ([#52028](https://github.com/WordPress/gutenberg/pull/52028)).
-   `Navigator`: Add `replace` option to `navigator.goTo()` and `navigator.goToParent()` ([#52456](https://github.com/WordPress/gutenberg/pull/52456)).

### Bug Fixes

-   `Popover`: Pin `react-dropdown-menu` version to avoid breaking changes in dependency updates. ([#52356](https://github.com/WordPress/gutenberg/pull/52356)).
-   `Item`: Unify focus style and add default font styles. ([#52495](https://github.com/WordPress/gutenberg/pull/52495)).
-   `Toolbar`: Fix toolbar items not being tabbable on the first render. ([#52613](https://github.com/WordPress/gutenberg/pull/52613))
-   `FormTokenField`: Fix token overflow when moving cursor left or right. ([#52662](https://github.com/WordPress/gutenberg/pull/52662))

## 25.3.0 (2023-07-05)

### Enhancements

-   `SelectControl`: Added option to set hidden options. ([#51545](https://github.com/WordPress/gutenberg/pull/51545))
-   `RangeControl`: Add `__next40pxDefaultSize` prop to opt into the new 40px default size ([#49105](https://github.com/WordPress/gutenberg/pull/49105)).
-   `Button`: Introduce `size` prop with `default`, `compact`, and `small` variants ([#51842](https://github.com/WordPress/gutenberg/pull/51842)).
-   `ItemGroup`: Update button focus state styles to target `:focus-visible` rather than `:focus`. ([#51787](https://github.com/WordPress/gutenberg/pull/51787)).
-   `Guide`: Don't show Close button when there is only one page, and use default button and accent/theme styling ([#52014](https://github.com/WordPress/gutenberg/pull/52014)).

### Bug Fixes

-   `ConfirmDialog`: Ensure onConfirm isn't called an extra time when submitting one of the buttons using the keyboard ([#51730](https://github.com/WordPress/gutenberg/pull/51730)).
-   `ZStack`: ZStack: fix component bounding box to match children ([#51836](https://github.com/WordPress/gutenberg/pull/51836)).
-   `Modal`: Add small top padding to the content so that avoid cutting off the visible outline when hovering items ([#51829](https://github.com/WordPress/gutenberg/pull/51829)).
-   `DropdownMenu`: fix icon style when dashicon is used ([#43574](https://github.com/WordPress/gutenberg/pull/43574)).
-   `UnitControl`: Fix crash when certain units are used ([#52211](https://github.com/WordPress/gutenberg/pull/52211)).
-   `Guide`: Place focus on the guide's container instead of its first tabbable ([#52300](https://github.com/WordPress/gutenberg/pull/52300)).

## 25.2.0 (2023-06-23)

### Enhancements

-   `UnitControl`: Revamp support for changing unit by typing ([#39303](https://github.com/WordPress/gutenberg/pull/39303)).
-   `Modal`: Update corner radius to be between buttons and the site view frame, in a 2-4-8 system. ([#51254](https://github.com/WordPress/gutenberg/pull/51254)).
-   `ItemGroup`: Update button focus state styles to be inline with other button focus states in the editor. ([#51576](https://github.com/WordPress/gutenberg/pull/51576)).
-   `ItemGroup`: Update button focus state styles to target `:focus-visible` rather than `:focus`. ([#51787](https://github.com/WordPress/gutenberg/pull/51787)).

### Bug Fixes

-   `Popover`: Allow legitimate 0 positions to update popover position ([#51320](https://github.com/WordPress/gutenberg/pull/51320)).
-   `Button`: Remove unnecessary margin from dashicon ([#51395](https://github.com/WordPress/gutenberg/pull/51395)).
-   `Autocomplete`: Announce how many results are available to screen readers when suggestions list first renders ([#51018](https://github.com/WordPress/gutenberg/pull/51018)).

### Internal

-   `ClipboardButton`: Convert to TypeScript ([#51334](https://github.com/WordPress/gutenberg/pull/51334)).
-   `Toolbar`: Replace `reakit` dependency with `@ariakit/react` ([#51623](https://github.com/WordPress/gutenberg/pull/51623)).

### Documentation

-   `SearchControl`: Improve documentation around usage of `label` prop ([#51781](https://github.com/WordPress/gutenberg/pull/51781)).

## 25.1.0 (2023-06-07)

### Enhancements

-   `BorderControl`: Improve color code readability in aria-label ([#51197](https://github.com/WordPress/gutenberg/pull/51197)).
-   `Dropdown` and `DropdownMenu`: use internal context system to automatically pick the toolbar popover variant when rendered inside the `Toolbar` component ([#51154](https://github.com/WordPress/gutenberg/pull/51154)).

### Bug Fixes

-   `FocalPointUnitControl`: Add aria-labels ([#50993](https://github.com/WordPress/gutenberg/pull/50993)).

### Enhancements

-   Wrapped `TabPanel` in a `forwardRef` call ([#50199](https://github.com/WordPress/gutenberg/pull/50199)).
-   `ColorPalette`: Improve readability of color name and value, and improve rendering of partially transparent colors ([#50450](https://github.com/WordPress/gutenberg/pull/50450)).
-   `Button`: Add `__next32pxSmallSize` prop to opt into the new 32px size when the `isSmall` prop is enabled ([#51012](https://github.com/WordPress/gutenberg/pull/51012)).
-   `ItemGroup`: Update styles so all SVGs inherit color from their parent element ([#50819](https://github.com/WordPress/gutenberg/pull/50819)).

### Experimental

-   `DropdownMenu` v2: Tweak styles ([#50967](https://github.com/WordPress/gutenberg/pull/50967), [#51097](https://github.com/WordPress/gutenberg/pull/51097)).
-   `DropdownMenu` v2: change default placement to match the legacy `DropdownMenu` component ([#51133](https://github.com/WordPress/gutenberg/pull/51133)).
-   `DropdownMenu` v2: Render in the default `Popover.Slot` ([#51046](https://github.com/WordPress/gutenberg/pull/51046)).

## 25.0.0 (2023-05-24)

### Breaking Changes

-   `DateTime`: Remove previously deprecated props, `__nextRemoveHelpButton` and `__nextRemoveResetButton` ([#50724](https://github.com/WordPress/gutenberg/pull/50724)).

### Internal

-   `Modal`: Remove children container's unused class name ([#50655](https://github.com/WordPress/gutenberg/pull/50655)).
-   `DropdownMenu`: Convert to TypeScript ([#50187](https://github.com/WordPress/gutenberg/pull/50187)).
-   Added experimental v2 of `DropdownMenu` ([#49473](https://github.com/WordPress/gutenberg/pull/49473)).
-   `ColorPicker`: its private `SelectControl` component no longer hides BackdropUI, thus making its focus state visible for keyboard users ([#50703](https://github.com/WordPress/gutenberg/pull/50703)).

### Bug Fixes

-   `ColorPicker`: Add an outline when the color picker select box is focused([#50609](https://github.com/WordPress/gutenberg/pull/50609)).
-   `InputControl`: Fix focus style to support Windows High Contrast mode ([#50772](https://github.com/WordPress/gutenberg/pull/50772)).
-   `ToggleGroupControl`: Fix focus and selected style to support Windows High Contrast mode ([#50785](https://github.com/WordPress/gutenberg/pull/50785)).
-   `SearchControl`: Adjust icon styles to fix alignment issues in the block inserter ([#50439](https://github.com/WordPress/gutenberg/pull/50439)).

### Enhancements

-   `Tooltip`: Update background color so tooltip boundaries are more visible in the site editor ([#50792](https://github.com/WordPress/gutenberg/pull/50792)).
-   `FontSizePicker`: Tweak the header spacing to be more consistent with other design tools ([#50855](https://github.com/WordPress/gutenberg/pull/50855)).

## 24.0.0 (2023-05-10)

### Breaking Changes

-   `onDragStart` in `<Draggable>` is now a synchronous function to allow setting additional data for `event.dataTransfer` ([#49673](https://github.com/WordPress/gutenberg/pull/49673)).

### Bug Fixes

-   `NavigableContainer`: do not trap focus in `TabbableContainer` ([#49846](https://github.com/WordPress/gutenberg/pull/49846)).
-   Update `<Button>` component to have a transparent background for its tertiary disabled state, to match its enabled state. ([#50496](https://github.com/WordPress/gutenberg/pull/50496)).

### Internal

-   `NavigableContainer`: Convert to TypeScript ([#49377](https://github.com/WordPress/gutenberg/pull/49377)).
-   `ToolbarItem`: Convert to TypeScript ([#49190](https://github.com/WordPress/gutenberg/pull/49190)).
-   Move rich-text related types to the rich-text package ([#49651](https://github.com/WordPress/gutenberg/pull/49651)).
-   `SlotFill`: simplified the implementation and removed unused code ([#50098](https://github.com/WordPress/gutenberg/pull/50098) and [#50133](https://github.com/WordPress/gutenberg/pull/50133)).

### Documentation

-   `TreeGrid`: Update docs with `data-expanded` attribute usage ([#50026](https://github.com/WordPress/gutenberg/pull/50026)).
-   Consolidate multiple versions of `README` and `CONTRIBUTING` docs, and add them to Storybook ([#50226](https://github.com/WordPress/gutenberg/pull/50226)).
-   `DimensionControl`: Use WordPress package instead of react in code example ([#50435](https://github.com/WordPress/gutenberg/pull/50435)).

### Enhancements

-   `FormTokenField`, `ComboboxControl`: Add `__next40pxDefaultSize` prop to opt into the new 40px default size, superseding the `__next36pxDefaultSize` prop ([#50261](https://github.com/WordPress/gutenberg/pull/50261)).
-   `Modal`: Add css class to children container ([#50099](https://github.com/WordPress/gutenberg/pull/50099)).
-   `Button`: Add `__next40pxDefaultSize` prop to opt into the new 40px default size ([#50254](https://github.com/WordPress/gutenberg/pull/50254)).
-   `PaletteEdit`: Allow custom popover configuration ([#49975](https://github.com/WordPress/gutenberg/pull/49975)).
-   Change the default color scheme to use the new WP Blueberry color. See PR description for instructions on how to restore the previous color scheme when using in a non-WordPress context ([#50193](https://github.com/WordPress/gutenberg/pull/50193)).
-   `CheckboxControl`, `CustomGradientPicker`, `FormToggle`, : Refactor and correct the focus style for consistency ([#50127](https://github.com/WordPress/gutenberg/pull/50127)).
-   `Button`, update spacing values in `has-text has-icon` buttons. ([#50277](https://github.com/WordPress/gutenberg/pull/50277)).
-   `Button`, remove custom padding applied to `tertiary` variant. ([#50276](https://github.com/WordPress/gutenberg/pull/50276)).
-   `Modal`: Correct padding for title less confirm variant. ([#50283](https://github.com/WordPress/gutenberg/pull/50283)).

## 23.9.0 (2023-04-26)

### Internal

-   `BottomSheetCell`: Refactor away from Lodash (mobile) ([#49794](https://github.com/WordPress/gutenberg/pull/49794)).
-   `parseStylesVariables()`: Refactor away from Lodash (mobile) ([#49794](https://github.com/WordPress/gutenberg/pull/49794)).
-   Remove Lodash dependency from components package ([#49794](https://github.com/WordPress/gutenberg/pull/49794)).
-   Tweak `WordPressComponent` type so `selector` property is optional ([#49960](https://github.com/WordPress/gutenberg/pull/49960)).
-   Update `Modal` appearance on small screens ([#50039](https://github.com/WordPress/gutenberg/pull/50039)).
-   Update the framer motion dependency to the latest version `10.11.6` ([#49822](https://github.com/WordPress/gutenberg/pull/49822)).

### Enhancements

-   `Draggable`: Add `appendToOwnerDocument` prop to allow elementId based elements to be attached to the ownerDocument body ([#49911](https://github.com/WordPress/gutenberg/pull/49911)).
-   `TreeGrid`: Modify keyboard navigation code to use a data-expanded attribute if aria-expanded is to be controlled outside of the TreeGrid component ([#48461](https://github.com/WordPress/gutenberg/pull/48461)).
-   `Modal`: Equalize internal spacing ([#49890](https://github.com/WordPress/gutenberg/pull/49890)).
-   `Modal`: Increased border radius ([#49870](https://github.com/WordPress/gutenberg/pull/49870)).
-   `Modal`: Updated spacing / dimensions of `isFullScreen` ([#49894](https://github.com/WordPress/gutenberg/pull/49894)).
-   `SlotFill`: Added util for creating private SlotFills and supporting Symbol keys ([#49819](https://github.com/WordPress/gutenberg/pull/49819)).
-   `IconType`: Export for external use ([#49649](https://github.com/WordPress/gutenberg/pull/49649)).

### Bug Fixes

-   `CheckboxControl`: Add support custom IDs ([#49977](https://github.com/WordPress/gutenberg/pull/49977)).

### Documentation

-   `Autocomplete`: Add heading and fix type for `onReplace` in README. ([#49798](https://github.com/WordPress/gutenberg/pull/49798)).
-   `Autocomplete`: Update `Usage` section in README. ([#49965](https://github.com/WordPress/gutenberg/pull/49965)).

## 23.8.0 (2023-04-12)

### Internal

-   `Mobile` Refactor of the KeyboardAwareFlatList component.
-   Update `reakit` dependency to 1.3.11 ([#49763](https://github.com/WordPress/gutenberg/pull/49763)).

### Enhancements

-   `DropZone`: Smooth animation ([#49517](https://github.com/WordPress/gutenberg/pull/49517)).
-   `Navigator`: Add `skipFocus` property in `NavigateOptions`. ([#49350](https://github.com/WordPress/gutenberg/pull/49350)).
-   `Spinner`: add explicit opacity and background styles ([#49695](https://github.com/WordPress/gutenberg/pull/49695)).
-   Make TypeScript types available for consumers ([#49229](https://github.com/WordPress/gutenberg/pull/49229)).

### Bug Fixes

-   `Snackbar`: Fix insufficient color contrast on hover ([#49682](https://github.com/WordPress/gutenberg/pull/49682)).

## 23.7.0 (2023-03-29)

### Internal

-   `Animate`: Convert to TypeScript ([#49243](https://github.com/WordPress/gutenberg/pull/49243)).
-   `CustomGradientPicker`: Convert to TypeScript ([#48929](https://github.com/WordPress/gutenberg/pull/48929)).
-   `ColorPicker`: Convert to TypeScript ([#49214](https://github.com/WordPress/gutenberg/pull/49214)).
-   `GradientPicker`: Convert to TypeScript ([#48316](https://github.com/WordPress/gutenberg/pull/48316)).
-   `FormTokenField`: Add a `__nextHasNoMarginBottom` prop to start opting into the margin-free styles ([48609](https://github.com/WordPress/gutenberg/pull/48609)).
-   `QueryControls`: Replace bottom margin overrides with `__nextHasNoMarginBottom`([47515](https://github.com/WordPress/gutenberg/pull/47515)).

### Enhancements

-   `CustomGradientPicker`: improve initial state UI ([#49146](https://github.com/WordPress/gutenberg/pull/49146)).
-   `AnglePickerControl`: Style to better fit in narrow contexts and improve RTL layout ([#49046](https://github.com/WordPress/gutenberg/pull/49046)).
-   `ImageSizeControl`: Use large 40px sizes ([#49113](https://github.com/WordPress/gutenberg/pull/49113)).

### Bug Fixes

-   `CircularOptionPicker`: force swatches to visually render on top of the rest of the component's content ([#49245](https://github.com/WordPress/gutenberg/pull/49245)).
-   `InputControl`: Fix misaligned textarea input control ([#49116](https://github.com/WordPress/gutenberg/pull/49116)).
-   `ToolsPanel`: Ensure consistency in menu item order ([#49222](https://github.com/WordPress/gutenberg/pull/49222)).
-   `TabPanel`: fix initial tab selection & focus management ([#49368](https://github.com/WordPress/gutenberg/pull/49368)).

### Internal

-   `DuotonePicker`, `DuotoneSwatch`: Convert to TypeScript ([#49060](https://github.com/WordPress/gutenberg/pull/49060)).

## 23.6.0 (2023-03-15)

### Enhancements

-   `FontSizePicker`: Allow custom units for custom font size control ([#48468](https://github.com/WordPress/gutenberg/pull/48468)).
-   `Navigator`: Disable initial screen animation ([#49062](https://github.com/WordPress/gutenberg/pull/49062)).
-   `FormTokenField`: Hide suggestions list on blur event if the input value is invalid ([#48785](https://github.com/WordPress/gutenberg/pull/48785)).

### Bug Fixes

-   `ResponsiveWrapper`: use `aspect-ratio` CSS prop, add support for `SVG` elements ([#48573](https://github.com/WordPress/gutenberg/pull/48573).
-   `ResizeTooltip`: Use `default.fontFamily` on tooltip ([#48805](https://github.com/WordPress/gutenberg/pull/48805).

### Internal

-   `Guide`: Convert to TypeScript ([#47493](https://github.com/WordPress/gutenberg/pull/47493)).
-   `SelectControl`: improve prop types for single vs multiple selection ([#47390](https://github.com/WordPress/gutenberg/pull/47390)).
-   `Navigation`: Convert to TypeScript ([#48742](https://github.com/WordPress/gutenberg/pull/48742)).
-   `PanelBody`: Convert to TypeScript ([#47702](https://github.com/WordPress/gutenberg/pull/47702)).
-   `withFilters` HOC: Convert to TypeScript ([#48721](https://github.com/WordPress/gutenberg/pull/48721)).
-   `withFallbackStyles` HOC: Convert to TypeScript ([#48720](https://github.com/WordPress/gutenberg/pull/48720)).
-   `withFocusReturn` HOC: Convert to TypeScript ([#48748](https://github.com/WordPress/gutenberg/pull/48748)).
-   `navigateRegions` HOC: Convert to TypeScript ([#48632](https://github.com/WordPress/gutenberg/pull/48632)).
-   `withSpokenMessages`: HOC: Convert to TypeScript ([#48163](https://github.com/WordPress/gutenberg/pull/48163)).
-   `withNotices`: HOC: Convert to TypeScript ([#49088](https://github.com/WordPress/gutenberg/pull/49088)).
-   `ToolbarButton`: Convert to TypeScript ([#47750](https://github.com/WordPress/gutenberg/pull/47750)).
-   `DimensionControl(Experimental)`: Convert to TypeScript ([#47351](https://github.com/WordPress/gutenberg/pull/47351)).
-   `PaletteEdit`: Convert to TypeScript ([#47764](https://github.com/WordPress/gutenberg/pull/47764)).
-   `QueryControls`: Refactor away from Lodash (`.groupBy`) ([#48779](https://github.com/WordPress/gutenberg/pull/48779)).
-   `ToolbarContext`: Convert to TypeScript ([#49002](https://github.com/WordPress/gutenberg/pull/49002)).

## 23.5.0 (2023-03-01)

### Enhancements

-   `ToolsPanel`: Separate reset all filter registration from items registration and support global resets ([#48123](https://github.com/WordPress/gutenberg/pull/48123)).

### Internal

-   `CircularOptionPicker`: Convert to TypeScript ([#47937](https://github.com/WordPress/gutenberg/pull/47937)).
-   `TabPanel`: Improve unit test in preparation for controlled component updates ([#48086](https://github.com/WordPress/gutenberg/pull/48086)).
-   `Autocomplete`: performance: avoid setting state on every value change ([#48485](https://github.com/WordPress/gutenberg/pull/48485)).
-   `Higher Order` -- `with-constrained-tabbing`: Convert to TypeScript ([#48162](https://github.com/WordPress/gutenberg/pull/48162)).
-   `Autocomplete`: Convert to TypeScript ([#47751](https://github.com/WordPress/gutenberg/pull/47751)).
-   `Autocomplete`: avoid calling setState on input ([#48565](https://github.com/WordPress/gutenberg/pull/48565)).

## 23.4.0 (2023-02-15)

### Bug Fixes

-   `ToolsPanel`: fix type inconsistencies between types, docs and normal component usage ([47944](https://github.com/WordPress/gutenberg/pull/47944)).
-   `SelectControl`: Fix styling when `multiple` prop is enabled ([#47893](https://github.com/WordPress/gutenberg/pull/43213)).
-   `useAutocompleteProps`, `Autocomplete`: Make accessible when rendered in an iframe ([#47907](https://github.com/WordPress/gutenberg/pull/47907)).

### Enhancements

-   `ColorPalette`, `GradientPicker`, `PaletteEdit`, `ToolsPanel`: add new props to set a custom heading level ([43848](https://github.com/WordPress/gutenberg/pull/43848) and [#47788](https://github.com/WordPress/gutenberg/pull/47788)).
-   `ColorPalette`: ensure text label contrast checking works with CSS variables ([#47373](https://github.com/WordPress/gutenberg/pull/47373)).
-   `Navigator`: Support dynamic paths with parameters ([#47827](https://github.com/WordPress/gutenberg/pull/47827)).
-   `Navigator`: Support hierarchical paths navigation and add `NavigatorToParentButton` component ([#47883](https://github.com/WordPress/gutenberg/pull/47883)).

### Internal

-   `NavigatorButton`: Reuse `Button` types ([47754](https://github.com/WordPress/gutenberg/pull/47754)).
-   `CustomSelectControl`: lock the `__experimentalShowSelectedHint` prop ([#47229](https://github.com/WordPress/gutenberg/pull/47229)).
-   Lock the `__experimentalPopoverPositionToPlacement` function and rename it to `__experimentalPopoverLegacyPositionToPlacement` ([#47505](https://github.com/WordPress/gutenberg/pull/47505)).
-   `ComboboxControl`: Convert to TypeScript ([#47581](https://github.com/WordPress/gutenberg/pull/47581)).
-   `Panel`, `PanelHeader`, `PanelRow`: Convert to TypeScript ([#47259](https://github.com/WordPress/gutenberg/pull/47259)).
-   `BoxControl`: Convert to TypeScript ([#47622](https://github.com/WordPress/gutenberg/pull/47622)).
-   `AnglePickerControl`: Convert to TypeScript ([#45820](https://github.com/WordPress/gutenberg/pull/45820)).
-   `ResizableBox`: refactor styles to TypeScript ([47756](https://github.com/WordPress/gutenberg/pull/47756)).
-   `BorderBoxControl`: migrate tests to TypeScript, remove act() call ([47755](https://github.com/WordPress/gutenberg/pull/47755)).
-   `Toolbar`: Convert to TypeScript ([#47087](https://github.com/WordPress/gutenberg/pull/47087)).
-   `MenuItemsChoice`: Convert to TypeScript ([#47180](https://github.com/WordPress/gutenberg/pull/47180)).
-   `ToolsPanel`: Allow display of optional items when values are updated externally to item controls ([47727](https://github.com/WordPress/gutenberg/pull/47727)).
-   `ToolsPanel`: Ensure display of optional items when values are updated externally and multiple blocks selected ([47864](https://github.com/WordPress/gutenberg/pull/47864)).
-   `Navigator`: add more pattern matching tests, refine existing tests ([47910](https://github.com/WordPress/gutenberg/pull/47910)).
-   `ToolsPanel`: Refactor Storybook examples to TypeScript ([47944](https://github.com/WordPress/gutenberg/pull/47944)).
-   `ToolsPanel`: Refactor unit tests to TypeScript ([48275](https://github.com/WordPress/gutenberg/pull/48275)).

## 23.3.0 (2023-02-01)

### Deprecations

-   `NumberControl`: Clarify deprecation message about `hideHTMLArrows` prop ([#47370](https://github.com/WordPress/gutenberg/pull/47370)).

### Enhancements

-   `Dropdown`: deprecate `position` prop, use `popoverProps` instead ([46865](https://github.com/WordPress/gutenberg/pull/46865)).
-   `Button`: improve padding for buttons with icon and text. ([46764](https://github.com/WordPress/gutenberg/pull/46764)).
-   `ColorPalette`: Use computed color when css variable is passed to `ColorPicker` ([47181](https://github.com/WordPress/gutenberg/pull/47181)).
-   `Popover`: add `overlay` option to the `placement` prop ([47004](https://github.com/WordPress/gutenberg/pull/47004)).

### Internal

-   `Toolbar`: unify Storybook examples under one file, migrate from knobs to controls ([47117](https://github.com/WordPress/gutenberg/pull/47117)).
-   `DropdownMenu`: migrate Storybook to controls ([47149](https://github.com/WordPress/gutenberg/pull/47149)).
-   Removed deprecated `@storybook/addon-knobs` dependency from the package ([47152](https://github.com/WordPress/gutenberg/pull/47152)).
-   `ColorListPicker`: Convert to TypeScript ([#46358](https://github.com/WordPress/gutenberg/pull/46358)).
-   `KeyboardShortcuts`: Convert to TypeScript ([#47429](https://github.com/WordPress/gutenberg/pull/47429)).
-   `ColorPalette`, `BorderControl`, `GradientPicker`: refine types and logic around single vs multiple palettes ([#47384](https://github.com/WordPress/gutenberg/pull/47384)).
-   `Button`: Convert to TypeScript ([#46997](https://github.com/WordPress/gutenberg/pull/46997)).
-   `QueryControls`: Convert to TypeScript ([#46721](https://github.com/WordPress/gutenberg/pull/46721)).
-   `TreeGrid`: Convert to TypeScript ([#47516](https://github.com/WordPress/gutenberg/pull/47516)).
-   `Notice`: refactor to TypeScript ([47118](https://github.com/WordPress/gutenberg/pull/47118)).
-   `Popover`: Take iframe element scaling into account ([47004](https://github.com/WordPress/gutenberg/pull/47004)).

### Bug Fixes

-   `TabPanel`: Fix initial tab selection when the tab declaration is lazily added to the `tabs` array ([47100](https://github.com/WordPress/gutenberg/pull/47100)).
-   `InputControl`: Avoid the "controlled to uncontrolled" warning by forcing the internal `<input />` element to be always in controlled mode ([47250](https://github.com/WordPress/gutenberg/pull/47250)).

## 23.2.0 (2023-01-11)

### Internal

-   `AlignmentMatrixControl`: Update center cell label to 'Center' instead of 'Center Center' ([#46852](https://github.com/WordPress/gutenberg/pull/46852)).
-   `Toolbar`: move all subcomponents under the same folder ([46951](https://github.com/WordPress/gutenberg/pull/46951)).
-   `Dashicon`: remove unnecessary type for `className` prop ([46849](https://github.com/WordPress/gutenberg/pull/46849)).
-   `ColorPicker` & `QueryControls`: Replace bottom margin overrides with `__nextHasNoMarginBottom` ([#46448](https://github.com/WordPress/gutenberg/pull/46448)).
-   `SandBox`: Convert to TypeScript ([#46478](https://github.com/WordPress/gutenberg/pull/46478)).
-   `ResponsiveWrapper`: Convert to TypeScript ([#46480](https://github.com/WordPress/gutenberg/pull/46480)).
-   `ItemGroup`: migrate Storybook to controls, refactor to TypeScript ([46945](https://github.com/WordPress/gutenberg/pull/46945)).

### Bug Fixes

-   `Placeholder`: set fixed right margin for label's icon ([46918](https://github.com/WordPress/gutenberg/pull/46918)).
-   `TreeGrid`: Fix right-arrow keyboard navigation when a row contains more than two focusable elements ([46998](https://github.com/WordPress/gutenberg/pull/46998)).

## 23.1.0 (2023-01-02)

### Breaking Changes

-   `ColorPalette`: The experimental `__experimentalHasMultipleOrigins` prop has been removed ([#46315](https://github.com/WordPress/gutenberg/pull/46315)).

## 23.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

### New Features

-   `TabPanel`: support manual tab activation ([#46004](https://github.com/WordPress/gutenberg/pull/46004)).
-   `TabPanel`: support disabled prop for tab buttons ([#46471](https://github.com/WordPress/gutenberg/pull/46471)).
-   `BaseControl`: Add `useBaseControlProps` hook to help generate id-releated props ([#46170](https://github.com/WordPress/gutenberg/pull/46170)).

### Bug Fixes

-   `ColorPalette`: show "Clear" button even when colors array is empty ([#46001](https://github.com/WordPress/gutenberg/pull/46001)).
-   `InputControl`: Fix internal `Flex` wrapper usage that could add an unintended `height: 100%` ([#46213](https://github.com/WordPress/gutenberg/pull/46213)).
-   `Navigator`: Allow calling `goTo` and `goBack` twice in one render cycle ([#46391](https://github.com/WordPress/gutenberg/pull/46391)).
-   `Modal`: Fix unexpected modal closing in IME Composition ([#46453](https://github.com/WordPress/gutenberg/pull/46453)).
-   `Toolbar`: Fix duplicate focus style on anchor link button ([#46759](https://github.com/WordPress/gutenberg/pull/46759)).
-   `useNavigateRegions`: Ensure region navigation picks the next region based on where the current user focus is located instead of starting at the beginning ([#44883](https://github.com/WordPress/gutenberg/pull/44883)).
-   `ComboboxControl`: Fix unexpected behaviour in IME Composition ([#46827](https://github.com/WordPress/gutenberg/pull/46827)).

### Enhancements

-   `TabPanel`: Simplify tab-focus style. ([#46276](https://github.com/WordPress/gutenberg/pull/46276)).
-   `TabPanel`: Add ability to set icon only tab buttons ([#45005](https://github.com/WordPress/gutenberg/pull/45005)).
-   `InputControl`, `NumberControl`, `UnitControl`: Add `help` prop for additional description ([#45931](https://github.com/WordPress/gutenberg/pull/45931)).
-   `BorderControl`, `ColorPicker` & `QueryControls`: Replace bottom margin overrides with `__nextHasNoMarginBottom` ([#45985](https://github.com/WordPress/gutenberg/pull/45985)).
-   `CustomSelectControl`, `UnitControl`: Add `onFocus` and `onBlur` props ([#46096](https://github.com/WordPress/gutenberg/pull/46096)).
-   `ResizableBox`: Prevent unnecessary paint on resize handles ([#46196](https://github.com/WordPress/gutenberg/pull/46196)).
-   `Popover`: Prevent unnecessary paint caused by using outline ([#46201](https://github.com/WordPress/gutenberg/pull/46201)).
-   `PaletteEdit`: Global styles: add onChange actions to color palette items [#45681](https://github.com/WordPress/gutenberg/pull/45681).
-   Lighten the border color on control components ([#46252](https://github.com/WordPress/gutenberg/pull/46252)).
-   `Popover`: Prevent unnecessary paint when scrolling by using transform instead of top/left positionning ([#46187](https://github.com/WordPress/gutenberg/pull/46187)).
-   `CircularOptionPicker`: Prevent unecessary paint on hover ([#46197](https://github.com/WordPress/gutenberg/pull/46197)).

### Experimental

-   `TextControl`: Restrict `type` prop to `email`, `number`, `password`, `tel`, `text`, `search` or `url` ([#45433](https://github.com/WordPress/gutenberg/pull/45433/)).

### Internal

-   `useControlledValue`: let TypeScript infer the return type ([#46164](https://github.com/WordPress/gutenberg/pull/46164)).
-   `LinkedButton`: remove unnecessary `span` tag ([#46063](https://github.com/WordPress/gutenberg/pull/46063)).
-   NumberControl: refactor styles/tests/stories to TypeScript, replace fireEvent with user-event ([#45990](https://github.com/WordPress/gutenberg/pull/45990)).
-   `useBaseField`: Convert to TypeScript ([#45712](https://github.com/WordPress/gutenberg/pull/45712)).
-   `Dashicon`: Convert to TypeScript ([#45924](https://github.com/WordPress/gutenberg/pull/45924)).
-   `PaletteEdit`: add follow up changelog for #45681 and tests [#46095](https://github.com/WordPress/gutenberg/pull/46095).
-   `AlignmentMatrixControl`: Convert to TypeScript ([#46162](https://github.com/WordPress/gutenberg/pull/46162)).
-   `Theme`: Remove public export ([#46427](https://github.com/WordPress/gutenberg/pull/46427)).
-   `Autocomplete`: Refactor away from `_.find()` ([#46537](https://github.com/WordPress/gutenberg/pull/46537)).
-   `TabPanel`: Refactor away from `_.find()` ([#46537](https://github.com/WordPress/gutenberg/pull/46537)).
-   `BottomSheetPickerCell`: Refactor away from `_.find()` for mobile ([#46537](https://github.com/WordPress/gutenberg/pull/46537)).
-   Refactor global styles context away from `_.find()` for mobile ([#46537](https://github.com/WordPress/gutenberg/pull/46537)).
-   `Dropdown`: Convert to TypeScript ([#45787](https://github.com/WordPress/gutenberg/pull/45787)).

### Documentation

-   `Tooltip`: Add readme and unit tests for `shortcut` prop ([#46092](https://github.com/WordPress/gutenberg/pull/46092)).

## 22.1.0 (2022-11-16)

### Enhancements

-   `ColorPalette`, `BorderBox`, `BorderBoxControl`: polish and DRY prop types, add default values ([#45463](https://github.com/WordPress/gutenberg/pull/45463)).
-   `TabPanel`: Add ability to set icon only tab buttons ([#45005](https://github.com/WordPress/gutenberg/pull/45005)).

### Internal

-   `AnglePickerControl`: remove `:focus-visible' outline on `CircleOutlineWrapper` ([#45758](https://github.com/WordPress/gutenberg/pull/45758))

### Bug Fixes

-   `FormTokenField`: Fix duplicate input in IME composition ([#45607](https://github.com/WordPress/gutenberg/pull/45607)).
-   `Autocomplete`: Check key events more strictly in IME composition ([#45626](https://github.com/WordPress/gutenberg/pull/45626)).
-   `Autocomplete`: Fix unexpected block insertion during IME composition ([#45510](https://github.com/WordPress/gutenberg/pull/45510)).
-   `Icon`: Making size prop work for icon components using dash icon strings ([#45593](https://github.com/WordPress/gutenberg/pull/45593))
-   `ToolsPanelItem`: Prevent unintended calls to onDeselect when parent panel is remounted and item is rendered via SlotFill ([#45673](https://github.com/WordPress/gutenberg/pull/45673))
-   `ColorPicker`: Prevent all number fields from becoming "0" when one of them is an empty string ([#45649](https://github.com/WordPress/gutenberg/pull/45649)).
-   `ToggleControl`: Fix toggle control label text overflow ([#45962](https://github.com/WordPress/gutenberg/pull/45962)).

### Internal

-   `ToolsPanel`: Update to fix `exhaustive-deps` eslint rule ([#45715](https://github.com/WordPress/gutenberg/pull/45715)).
-   `PaletteEditListView`: Update to ignore `exhaustive-deps` eslint rule ([#45467](https://github.com/WordPress/gutenberg/pull/45467)).
-   `Popover`: Update to pass `exhaustive-deps` eslint rule ([#45656](https://github.com/WordPress/gutenberg/pull/45656)).
-   `Flex`: Update to pass `exhaustive-deps` eslint rule ([#45528](https://github.com/WordPress/gutenberg/pull/45528)).
-   `withNotices`: Update to pass `exhaustive-deps` eslint rule ([#45530](https://github.com/WordPress/gutenberg/pull/45530)).
-   `ItemGroup`: Update to pass `exhaustive-deps` eslint rule ([#45531](https://github.com/WordPress/gutenberg/pull/45531)).
-   `TabPanel`: Update to pass `exhaustive-deps` eslint rule ([#45660](https://github.com/WordPress/gutenberg/pull/45660)).
-   `NavigatorScreen`: Update to pass `exhaustive-deps` eslint rule ([#45648](https://github.com/WordPress/gutenberg/pull/45648)).
-   `Draggable`: Convert to TypeScript ([#45471](https://github.com/WordPress/gutenberg/pull/45471)).
-   `MenuGroup`: Convert to TypeScript ([#45617](https://github.com/WordPress/gutenberg/pull/45617)).
-   `useCx`: fix story to satisfy the `react-hooks/exhaustive-deps` eslint rule ([#45614](https://github.com/WordPress/gutenberg/pull/45614))
-   Activate the `react-hooks/exhuastive-deps` eslint rule for the Components package ([#41166](https://github.com/WordPress/gutenberg/pull/41166))
-   `Snackbar`: Convert to TypeScript ([#45472](https://github.com/WordPress/gutenberg/pull/45472)).

### Experimental

-   `ToggleGroupControl`: Only show enclosing border when `isBlock` and not `isDeselectable` ([#45492](https://github.com/WordPress/gutenberg/pull/45492)).
-   `Theme`: Add support for custom `background` color ([#45466](https://github.com/WordPress/gutenberg/pull/45466)).

## 22.0.0 (2022-11-02)

### Breaking Changes

-   `Popover`: The deprecated `range` and `__unstableShift` props have been removed ([#45195](https://github.com/WordPress/gutenberg/pull/45195)).

### Deprecations

-   `Popover`: the deprecation messages for anchor-related props (`anchorRef`, `anchorRect`, `getAnchorRect`) have been updated ([#45195](https://github.com/WordPress/gutenberg/pull/45195)).
-   `RadioGroup`: Mark as deprecated, in favor of `RadioControl` and `ToggleGroupControl` ([#45389](https://github.com/WordPress/gutenberg/pull/45389)).
-   `Popover`: the deprecation messages for anchor-related props (`anchorRef`, `anchorRect`, `getAnchorRect`) have been updated. ([#45195](https://github.com/WordPress/gutenberg/pull/45195)).
-   `Popover`: The `isAlternate` prop has been replaced with a `variant` prop that can be called with the `'toolbar'` string ([#45137](https://github.com/WordPress/gutenberg/pull/45137)).

### New Features

-   `BoxControl` & `CustomSelectControl`: Add `onMouseOver` and `onMouseOut` callback props to allow handling of these events by parent components ([#44955](https://github.com/WordPress/gutenberg/pull/44955))
-   `Popover`: A `variant` prop has been added to style popovers, with `'unstyled'` and `'toolbar'` possible values ([#45137](https://github.com/WordPress/gutenberg/pull/45137)).

### Enhancements

-   `FontSizePicker`: Pass the preset object to the onChange callback to allow conversion from preset slugs to CSS vars ([#44967](https://github.com/WordPress/gutenberg/pull/44967)).
-   `FontSizePicker`: Improved slider design when `withSlider` is set ([#44598](https://github.com/WordPress/gutenberg/pull/44598)).
-   `ToggleControl`: Improved types for the `help` prop, covering the dynamic render function option, and enabled the dynamic `help` behavior only for a controlled component ([#45279](https://github.com/WordPress/gutenberg/pull/45279)).
-   `BorderControl` & `BorderBoxControl`: Replace `__next36pxDefaultSize` with "default" and "large" size variants ([#41860](https://github.com/WordPress/gutenberg/pull/41860)).
-   `UnitControl`: Remove outer wrapper to normalize className placement ([#41860](https://github.com/WordPress/gutenberg/pull/41860)).
-   `ColorPalette`: Fix transparent checkered background pattern ([#45295](https://github.com/WordPress/gutenberg/pull/45295)).
-   `ToggleGroupControl`: Add `isDeselectable` prop to allow deselecting the selected option ([#45123](https://github.com/WordPress/gutenberg/pull/45123)).
-   `FontSizePicker`: Improve hint text shown next to 'Font size' label ([#44966](https://github.com/WordPress/gutenberg/pull/44966)).

### Bug Fixes

-   `useNavigateRegions`: Add new keyboard shortcut alias to cover backtick and tilde keys inconsistencies across browsers ([#45019](https://github.com/WordPress/gutenberg/pull/45019)).
-   `Button`: Tweak the destructive button primary, link, and default variants ([#44427](https://github.com/WordPress/gutenberg/pull/44427)).
-   `UnitControl`: Fix `disabled` style is overridden by core `form.css` style ([#45250](https://github.com/WordPress/gutenberg/pull/45250)).
-   `ItemGroup`: fix RTL `Item` styles when rendered as a button ([#45280](https://github.com/WordPress/gutenberg/pull/45280)).
-   `Button`: Fix RTL alignment for buttons containing an icon and text ([#44787](https://github.com/WordPress/gutenberg/pull/44787)).
-   `TabPanel`: Call `onSelect()` on every tab selection, regardless of whether it was triggered by user interaction ([#44028](https://github.com/WordPress/gutenberg/pull/44028)).
-   `FontSizePicker`: Fallback to font size `slug` if `name` is undefined ([#45041](https://github.com/WordPress/gutenberg/pull/45041)).
-   `AutocompleterUI`: fix issue where autocompleter UI would appear on top of other UI elements ([#44795](https://github.com/WordPress/gutenberg/pull/44795/))
-   `ExternalLink`: Fix to re-enable support for `onClick` event handler ([#45214](https://github.com/WordPress/gutenberg/pull/45214)).
-   `InputControl`: Allow inline styles to be applied to the wrapper not inner input ([#45340](https://github.com/WordPress/gutenberg/pull/45340/))

### Internal

-   `BorderBoxControl`: Convert stories to TypeScript and use Controls ([#45002](https://github.com/WordPress/gutenberg/pull/45002)).
-   `Disabled`: add a note in the docs about the lack of polyfill for the `inert` attribute ([#45272](https://github.com/WordPress/gutenberg/pull/45272))
-   `Snackbar`: updated to satisfy `react/exhaustive-deps` eslint rule ([#44934](https://github.com/WordPress/gutenberg/pull/44934))
-   `AnglePickerControl`: Set Storybook Label control type to 'text' ([#45122](https://github.com/WordPress/gutenberg/pull/45122)).
-   `SlotFill`: updated to satisfy `react/exhaustive-deps` eslint rule ([#44403](https://github.com/WordPress/gutenberg/pull/44403))
-   `Context`: updated to ignore `react/exhaustive-deps` eslint rule ([#45044](https://github.com/WordPress/gutenberg/pull/45044))
-   `Button`: Refactor Storybook to controls and align docs ([#44105](https://github.com/WordPress/gutenberg/pull/44105)).
-   `TabPanel`: updated to satisfy `react/exhaustive-deps` eslint rule ([#44935](https://github.com/WordPress/gutenberg/pull/44935))
-   `ColorPalette`: Convert to TypeScript ([#44632](https://github.com/WordPress/gutenberg/pull/44632)).
-   `UnitControl`: Add tests ([#45260](https://github.com/WordPress/gutenberg/pull/45260)).
-   `Disabled`: Refactor the component to rely on the HTML `inert` attribute.
-   `CustomGradientBar`: Refactor away from Lodash ([#45367](https://github.com/WordPress/gutenberg/pull/45367/)).
-   `TextControl`: Set Storybook control types on `help`, `label` and `type` ([#45405](https://github.com/WordPress/gutenberg/pull/45405)).
-   `Autocomplete`: use Popover's new `placement` prop instead of legacy `position` prop ([#44396](https://github.com/WordPress/gutenberg/pull/44396/)).
-   `SelectControl`: Add `onChange`, `onBlur` and `onFocus` to storybook actions ([#45432](https://github.com/WordPress/gutenberg/pull/45432/)).
-   `FontSizePicker`: Add more comprehensive tests ([#45298](https://github.com/WordPress/gutenberg/pull/45298)).
-   `FontSizePicker`: Refactor to use components instead of helper functions ([#44891](https://github.com/WordPress/gutenberg/pull/44891)).

### Experimental

-   `NumberControl`: Replace `hideHTMLArrows` prop with `spinControls` prop. Allow custom spin controls via `spinControls="custom"` ([#45333](https://github.com/WordPress/gutenberg/pull/45333)).

### Experimental

-   Theming: updated Components package to utilize the new `accent` prop of the experimental `Theme` component.

## 21.3.0 (2022-10-19)

### Bug Fixes

-   `FontSizePicker`: Ensure that fluid font size presets appear correctly in the UI controls ([#44791](https://github.com/WordPress/gutenberg/pull/44791)).
-   `ToggleGroupControl`: Remove unsupported `disabled` prop from types, and correctly mark `label` prop as required ([#45114](https://github.com/WordPress/gutenberg/pull/45114)).
-   `Navigator`: prevent partially hiding focus ring styles, by removing unnecessary overflow rules on `NavigatorScreen` ([#44973](https://github.com/WordPress/gutenberg/pull/44973)).
-   `Navigator`: restore focus only once per location ([#44972](https://github.com/WordPress/gutenberg/pull/44972)).

### Documentation

-   `VisuallyHidden`: Add some notes on best practices around stacking contexts when using this component ([#44867](https://github.com/WordPress/gutenberg/pull/44867)).

### Internal

-   `Modal`: Convert to TypeScript ([#42949](https://github.com/WordPress/gutenberg/pull/42949)).
-   `Sandbox`: Use `toString` to create observe and resize script string ([#42872](https://github.com/WordPress/gutenberg/pull/42872)).
-   `Navigator`: refactor unit tests to TypeScript and to `user-event` ([#44970](https://github.com/WordPress/gutenberg/pull/44970)).
-   `Navigator`: Refactor Storybook code to TypeScript and controls ([#44979](https://github.com/WordPress/gutenberg/pull/44979)).
-   `withFilters`: Refactor away from `_.without()` ([#44980](https://github.com/WordPress/gutenberg/pull/44980/)).
-   `withFocusReturn`: Refactor tests to `@testing-library/react` ([#45012](https://github.com/WordPress/gutenberg/pull/45012)).
-   `ToolsPanel`: updated to satisfy `react/exhaustive-deps` eslint rule ([#45028](https://github.com/WordPress/gutenberg/pull/45028))
-   `Tooltip`: updated to ignore `react/exhaustive-deps` eslint rule ([#45043](https://github.com/WordPress/gutenberg/pull/45043))

## 21.2.0 (2022-10-05)

### Enhancements

-   `FontSizePicker`: Updated to take up full width of its parent and have a 40px Reset button when `size` is `__unstable-large` ([44559](https://github.com/WordPress/gutenberg/pull/44559)).
-   `BorderBoxControl`: Omit unit select when width values are mixed ([#44592](https://github.com/WordPress/gutenberg/pull/44592))
-   `BorderControl`: Add ability to disable unit selection ([#44592](https://github.com/WordPress/gutenberg/pull/44592))

### Bug Fixes

-   `Popover`: fix limitShift logic by adding iframe offset correctly ([#42950](https://github.com/WordPress/gutenberg/pull/42950)).
-   `Popover`: refine position-to-placement conversion logic, add tests ([#44377](https://github.com/WordPress/gutenberg/pull/44377)).
-   `ToggleGroupControl`: adjust icon color when inactive, from `gray-700` to `gray-900` ([#44575](https://github.com/WordPress/gutenberg/pull/44575)).
-   `TokenInput`: improve logic around the `aria-activedescendant` attribute, which was causing unintended focus behavior for some screen readers ([#44526](https://github.com/WordPress/gutenberg/pull/44526)).
-   `NavigatorScreen`: fix focus issue where back button received focus unexpectedly ([#44239](https://github.com/WordPress/gutenberg/pull/44239))
-   `FontSizePicker`: Fix header order in RTL languages ([#44590](https://github.com/WordPress/gutenberg/pull/44590)).

### Enhancements

-   `SuggestionList`: use `requestAnimationFrame` instead of `setTimeout` when scrolling selected item into view. This change improves the responsiveness of the `ComboboxControl` and `FormTokenField` components when rapidly hovering over the suggestion items in the list ([#44573](https://github.com/WordPress/gutenberg/pull/44573)).

### Internal

-   `Mobile` updated to ignore `react/exhaustive-deps` eslint rule ([#44207](https://github.com/WordPress/gutenberg/pull/44207)).
-   `Popover`: refactor unit tests to TypeScript and modern RTL assertions ([#44373](https://github.com/WordPress/gutenberg/pull/44373)).
-   `SearchControl`: updated to ignore `react/exhaustive-deps` eslint rule in native files([#44381](https://github.com/WordPress/gutenberg/pull/44381))
-   `ResizableBox` updated to pass the `react/exhaustive-deps` eslint rule ([#44370](https://github.com/WordPress/gutenberg/pull/44370)).
-   `Sandbox`: updated to satisfy `react/exhaustive-deps` eslint rule ([#44378](https://github.com/WordPress/gutenberg/pull/44378))
-   `FontSizePicker`: Convert to TypeScript ([#44449](https://github.com/WordPress/gutenberg/pull/44449)).
-   `FontSizePicker`: Replace SCSS with Emotion + components ([#44483](https://github.com/WordPress/gutenberg/pull/44483)).

### Experimental

-   Add experimental `Theme` component ([#44668](https://github.com/WordPress/gutenberg/pull/44668)).

## 21.1.0 (2022-09-21)

### Deprecations

-   `Popover`: added new `anchor` prop, supposed to supersede all previous anchor-related props (`anchorRef`, `anchorRect`, `getAnchorRect`). These older anchor-related props are now marked as deprecated and are scheduled to be removed in WordPress 6.3 ([#43691](https://github.com/WordPress/gutenberg/pull/43691)).

### Bug Fixes

-   `Button`: Remove unexpected `has-text` class when empty children are passed ([#44198](https://github.com/WordPress/gutenberg/pull/44198)).
-   The `LinkedButton` to unlink sides in `BoxControl`, `BorderBoxControl` and `BorderRadiusControl` have changed from a rectangular primary button to an icon-only button, with a sentence case tooltip, and default-size icon for better legibility. The `Button` component has been fixed so when `isSmall` and `icon` props are set, and no text is present, the button shape is square rather than rectangular.

### New Features

-   `MenuItem`: Add suffix prop for injecting non-icon and non-shortcut content to menu items ([#44260](https://github.com/WordPress/gutenberg/pull/44260)).
-   `ToolsPanel`: Add subheadings to ellipsis menu and reset text to default control menu items ([#44260](https://github.com/WordPress/gutenberg/pull/44260)).

### Internal

-   `NavigationMenu` updated to ignore `react/exhaustive-deps` eslint rule ([#44090](https://github.com/WordPress/gutenberg/pull/44090)).
-   `RangeControl`: updated to pass `react/exhaustive-deps` eslint rule ([#44271](https://github.com/WordPress/gutenberg/pull/44271)).
-   `UnitControl` updated to pass the `react/exhaustive-deps` eslint rule ([#44161](https://github.com/WordPress/gutenberg/pull/44161)).
-   `Notice`: updated to satisfy `react/exhaustive-deps` eslint rule ([#44157](https://github.com/WordPress/gutenberg/pull/44157))

## 21.0.0 (2022-09-13)

### Deprecations

-   `FontSizePicker`: Deprecate bottom margin style. Add a `__nextHasNoMarginBottom` prop to start opting into the margin-free styles that will become the default in a future version, currently scheduled to be WordPress 6.4 ([#43870](https://github.com/WordPress/gutenberg/pull/43870)).
-   `AnglePickerControl`: Deprecate bottom margin style. Add a `__nextHasNoMarginBottom` prop to start opting into the margin-free styles that will become the default in a future version, currently scheduled to be WordPress 6.4 ([#43867](https://github.com/WordPress/gutenberg/pull/43867)).
-   `Popover`: deprecate `__unstableShift` prop in favour of new `shift` prop. The `__unstableShift` is currently scheduled for removal in WordPress 6.3 ([#43845](https://github.com/WordPress/gutenberg/pull/43845)).
-   `Popover`: removed the `__unstableObserveElement` prop, which is not necessary anymore. The functionality is now supported directly by the component without the need of an external prop ([#43617](https://github.com/WordPress/gutenberg/pull/43617)).

### Bug Fixes

-   `Button`, `Icon`: Fix `iconSize` prop doesn't work with some icons ([#43821](https://github.com/WordPress/gutenberg/pull/43821)).
-   `InputControl`, `NumberControl`, `UnitControl`: Fix margin when `labelPosition` is `bottom` ([#43995](https://github.com/WordPress/gutenberg/pull/43995)).
-   `Popover`: enable auto-updating every animation frame ([#43617](https://github.com/WordPress/gutenberg/pull/43617)).
-   `Popover`: improve the component's performance and reactivity to prop changes by reworking its internals ([#43335](https://github.com/WordPress/gutenberg/pull/43335)).
-   `NavigatorScreen`: updated to satisfy `react/exhaustive-deps` eslint rule ([#43876](https://github.com/WordPress/gutenberg/pull/43876))
-   `Popover`: fix positioning when reference and floating elements are both within an iframe ([#43971](https://github.com/WordPress/gutenberg/pull/43971))

### Enhancements

-   `ToggleControl`: Add `__nextHasNoMargin` prop for opting into the new margin-free styles ([#43717](https://github.com/WordPress/gutenberg/pull/43717)).
-   `CheckboxControl`: Add `__nextHasNoMargin` prop for opting into the new margin-free styles ([#43720](https://github.com/WordPress/gutenberg/pull/43720)).
-   `FocalPointControl`: Add `__nextHasNoMargin` prop for opting into the new margin-free styles ([#43996](https://github.com/WordPress/gutenberg/pull/43996)).
-   `TextControl`, `TextareaControl`: Add `__nextHasNoMargin` prop for opting into the new margin-free styles ([#43782](https://github.com/WordPress/gutenberg/pull/43782)).
-   `Flex`: Remove margin-based polyfill implementation of flex `gap` ([#43995](https://github.com/WordPress/gutenberg/pull/43995)).
-   `RangeControl`: Tweak dark gray marking color to be consistent with the grays in `@wordpress/base-styles` ([#43773](https://github.com/WordPress/gutenberg/pull/43773)).
-   `UnitControl`: Tweak unit dropdown color to be consistent with the grays in `@wordpress/base-styles` ([#43773](https://github.com/WordPress/gutenberg/pull/43773)).
-   `SearchControl`: Add `__nextHasNoMargin` prop for opting into the new margin-free styles ([#43871](https://github.com/WordPress/gutenberg/pull/43871)).
-   `UnitControl`: Consistently hide spin buttons ([#43985](https://github.com/WordPress/gutenberg/pull/43985)).
-   `CardHeader`, `CardBody`, `CardFooter`: Tweak `isShady` background colors to be consistent with the grays in `@wordpress/base-styles` ([#43719](https://github.com/WordPress/gutenberg/pull/43719)).
-   `InputControl`, `SelectControl`: Tweak `disabled` colors to be consistent with the grays in `@wordpress/base-styles` ([#43719](https://github.com/WordPress/gutenberg/pull/43719)).
-   `FocalPointPicker`: Tweak media placeholder background color to be consistent with the grays in `@wordpress/base-styles` ([#43994](https://github.com/WordPress/gutenberg/pull/43994)).
-   `RangeControl`: Tweak rail, track, and mark colors to be consistent with the grays in `@wordpress/base-styles` ([#43994](https://github.com/WordPress/gutenberg/pull/43994)).
-   `UnitControl`: Tweak unit dropdown hover color to be consistent with the grays in `@wordpress/base-styles` ([#43994](https://github.com/WordPress/gutenberg/pull/43994)).

### Internal

-   `Icon`: Refactor tests to `@testing-library/react` ([#44051](https://github.com/WordPress/gutenberg/pull/44051)).
-   Fix TypeScript types for `isValueDefined()` and `isValueEmpty()` utility functions ([#43983](https://github.com/WordPress/gutenberg/pull/43983)).
-   `RadioControl`: Clean up styles to use less custom CSS ([#43868](https://github.com/WordPress/gutenberg/pull/43868)).
-   Remove unused `normalizeArrowKey` utility function ([#43640](https://github.com/WordPress/gutenberg/pull/43640/)).
-   `SearchControl`: Convert to TypeScript ([#43871](https://github.com/WordPress/gutenberg/pull/43871)).
-   `FormFileUpload`: Convert to TypeScript ([#43960](https://github.com/WordPress/gutenberg/pull/43960)).
-   `DropZone`: Convert to TypeScript ([#43962](https://github.com/WordPress/gutenberg/pull/43962)).
-   `ToggleGroupControl`: Rename `__experimentalIsIconGroup` prop to `__experimentalIsBorderless` ([#43771](https://github.com/WordPress/gutenberg/pull/43771/)).
-   `NumberControl`: Add TypeScript types ([#43791](https://github.com/WordPress/gutenberg/pull/43791/)).
-   Refactor `FocalPointPicker` to function component ([#39168](https://github.com/WordPress/gutenberg/pull/39168)).
-   `Guide`: use `code` instead of `keyCode` for keyboard events ([#43604](https://github.com/WordPress/gutenberg/pull/43604/)).
-   `ToggleControl`: Convert to TypeScript and streamline CSS ([#43717](https://github.com/WordPress/gutenberg/pull/43717)).
-   `FocalPointPicker`: Convert to TypeScript ([#43872](https://github.com/WordPress/gutenberg/pull/43872)).
-   `Navigation`: use `code` instead of `keyCode` for keyboard events ([#43644](https://github.com/WordPress/gutenberg/pull/43644/)).
-   `ComboboxControl`: Add unit tests ([#42403](https://github.com/WordPress/gutenberg/pull/42403)).
-   `NavigableContainer`: use `code` instead of `keyCode` for keyboard events, rewrite tests using RTL and `user-event` ([#43606](https://github.com/WordPress/gutenberg/pull/43606/)).
-   `ComboboxControl`: updated to satisfy `react/exhuastive-deps` eslint rule ([#41417](https://github.com/WordPress/gutenberg/pull/41417))
-   `FormTokenField`: Refactor away from Lodash ([#43744](https://github.com/WordPress/gutenberg/pull/43744/)).
-   `NavigatorButton`: updated to satisfy `react/exhaustive-deps` eslint rule ([#42051](https://github.com/WordPress/gutenberg/pull/42051))
-   `TabPanel`: Refactor away from `_.partial()` ([#43895](https://github.com/WordPress/gutenberg/pull/43895/)).
-   `Panel`: Refactor tests to `@testing-library/react` ([#43896](https://github.com/WordPress/gutenberg/pull/43896)).
-   `Popover`: refactor to TypeScript ([#43823](https://github.com/WordPress/gutenberg/pull/43823/)).
-   `BorderControl` and `BorderBoxControl`: replace temporary types with `Popover`'s types ([#43823](https://github.com/WordPress/gutenberg/pull/43823/)).
-   `DimensionControl`: Refactor tests to `@testing-library/react` ([#43916](https://github.com/WordPress/gutenberg/pull/43916)).
-   `withFilters`: Refactor tests to `@testing-library/react` ([#44017](https://github.com/WordPress/gutenberg/pull/44017)).
-   `IsolatedEventContainer`: Refactor tests to `@testing-library/react` ([#44073](https://github.com/WordPress/gutenberg/pull/44073)).
-   `KeyboardShortcuts`: Refactor tests to `@testing-library/react` ([#44075](https://github.com/WordPress/gutenberg/pull/44075)).
-   `Slot`/`Fill`: Refactor tests to `@testing-library/react` ([#44084](https://github.com/WordPress/gutenberg/pull/44084)).
-   `ColorPalette`: Refactor tests to `@testing-library/react` ([#44108](https://github.com/WordPress/gutenberg/pull/44108)).

## 20.0.0 (2022-08-24)

### Deprecations

-   `CustomSelectControl`: Deprecate constrained width style. Add a `__nextUnconstrainedWidth` prop to start opting into the unconstrained width that will become the default in a future version, currently scheduled to be WordPress 6.4 ([#43230](https://github.com/WordPress/gutenberg/pull/43230)).
-   `Popover`: deprecate `__unstableForcePosition` prop in favour of new `flip` and `resize` props. The `__unstableForcePosition` is currently scheduled for removal in WordPress 6.3 ([#43546](https://github.com/WordPress/gutenberg/pull/43546)).

### Bug Fixes

-   `AlignmentMatrixControl`: keep the physical direction in RTL languages ([#43126](https://github.com/WordPress/gutenberg/pull/43126)).
-   `AlignmentMatrixControl`: Fix the `width` prop so it works as intended ([#43482](https://github.com/WordPress/gutenberg/pull/43482)).
-   `SelectControl`, `CustomSelectControl`: Truncate long option strings ([#43301](https://github.com/WordPress/gutenberg/pull/43301)).
-   `ToggleGroupControl`: Fix minor inconsistency in label height ([#43331](https://github.com/WordPress/gutenberg/pull/43331)).
-   `Popover`: fix and improve opening animation ([#43186](https://github.com/WordPress/gutenberg/pull/43186)).
-   `Popover`: fix incorrect deps in hooks resulting in incorrect positioning after calling `update` ([#43267](https://github.com/WordPress/gutenberg/pull/43267/)).
-   `FontSizePicker`: Fix excessive margin between label and input ([#43304](https://github.com/WordPress/gutenberg/pull/43304)).
-   Ensure all dependencies allow version ranges ([#43355](https://github.com/WordPress/gutenberg/pull/43355)).
-   `Popover`: make sure offset middleware always applies the latest frame offset values ([#43329](https://github.com/WordPress/gutenberg/pull/43329/)).
-   `Dropdown`: anchor popover to the dropdown wrapper (instead of the toggle) ([#43377](https://github.com/WordPress/gutenberg/pull/43377/)).
-   `Guide`: Fix error when rendering with no pages ([#43380](https://github.com/WordPress/gutenberg/pull/43380/)).
-   `Disabled`: preserve input values when toggling the `isDisabled` prop ([#43508](https://github.com/WordPress/gutenberg/pull/43508/))

### Enhancements

-   `GradientPicker`: Show custom picker before swatches ([#43577](https://github.com/WordPress/gutenberg/pull/43577)).
-   `CustomGradientPicker`, `GradientPicker`: Add `__nextHasNoMargin` prop for opting into the new margin-free styles ([#43387](https://github.com/WordPress/gutenberg/pull/43387)).
-   `ToolsPanel`: Tighten grid gaps ([#43424](https://github.com/WordPress/gutenberg/pull/43424)).
-   `ColorPalette`: Make popover style consistent ([#43570](https://github.com/WordPress/gutenberg/pull/43570)).
-   `ToggleGroupControl`: Improve TypeScript documentation ([#43265](https://github.com/WordPress/gutenberg/pull/43265)).
-   `ComboboxControl`: Normalize hyphen-like characters to an ASCII hyphen ([#42942](https://github.com/WordPress/gutenberg/pull/42942)).
-   `FormTokenField`: Refactor away from `_.difference()` ([#43224](https://github.com/WordPress/gutenberg/pull/43224/)).
-   `Autocomplete`: use `KeyboardEvent.code` instead of `KeyboardEvent.keyCode` ([#43432](https://github.com/WordPress/gutenberg/pull/43432/)).
-   `ConfirmDialog`: replace (almost) every usage of `fireEvent` with `@testing-library/user-event` ([#43429](https://github.com/WordPress/gutenberg/pull/43429/)).
-   `Popover`: Introduce new `flip` and `resize` props ([#43546](https://github.com/WordPress/gutenberg/pull/43546/)).

### Internal

-   `Tooltip`: Refactor tests to `@testing-library/react` ([#43061](https://github.com/WordPress/gutenberg/pull/43061)).
-   `ClipboardButton`, `FocusableIframe`, `IsolatedEventContainer`, `withConstrainedTabbing`, `withSpokenMessages`: Improve TypeScript types ([#43579](https://github.com/WordPress/gutenberg/pull/43579)).
-   Clean up unused and duplicate `COLORS` values ([#43445](https://github.com/WordPress/gutenberg/pull/43445)).
-   Update `floating-ui` to the latest version ([#43206](https://github.com/WordPress/gutenberg/pull/43206)).
-   `DateTimePicker`, `TimePicker`, `DatePicker`: Switch from `moment` to `date-fns` ([#43005](https://github.com/WordPress/gutenberg/pull/43005)).
-   `DatePicker`: Switch from `react-dates` to `use-lilius` ([#43005](https://github.com/WordPress/gutenberg/pull/43005)).
-   `DateTimePicker`: address feedback after recent refactor to `date-fns` and `use-lilius` ([#43495](https://github.com/WordPress/gutenberg/pull/43495)).
-   `convertLTRToRTL()`: Refactor away from `_.mapKeys()` ([#43258](https://github.com/WordPress/gutenberg/pull/43258/)).
-   `withSpokenMessages`: Update to use `@testing-library/react` ([#43273](https://github.com/WordPress/gutenberg/pull/43273)).
-   `MenuGroup`: Refactor unit tests to use `@testing-library/react` ([#43275](https://github.com/WordPress/gutenberg/pull/43275)).
-   `FormTokenField`: Refactor away from `_.uniq()` ([#43330](https://github.com/WordPress/gutenberg/pull/43330/)).
-   `contextConnect`: Refactor away from `_.uniq()` ([#43330](https://github.com/WordPress/gutenberg/pull/43330/)).
-   `ColorPalette`: Refactor away from `_.uniq()` ([#43330](https://github.com/WordPress/gutenberg/pull/43330/)).
-   `Guide`: Refactor away from `_.times()` ([#43374](https://github.com/WordPress/gutenberg/pull/43374/)).
-   `Disabled`: Convert to TypeScript ([#42708](https://github.com/WordPress/gutenberg/pull/42708)).
-   `Guide`: Update tests to use `@testing-library/react` ([#43380](https://github.com/WordPress/gutenberg/pull/43380)).
-   `Modal`: use `KeyboardEvent.code` instead of deprecated `KeyboardEvent.keyCode`. improve unit tests ([#43429](https://github.com/WordPress/gutenberg/pull/43429/)).
-   `FocalPointPicker`: use `KeyboardEvent.code`, partially refactor tests to modern RTL and `user-event` ([#43441](https://github.com/WordPress/gutenberg/pull/43441/)).
-   `CustomGradientPicker`: use `KeyboardEvent.code` instead of `KeyboardEvent.keyCode` ([#43437](https://github.com/WordPress/gutenberg/pull/43437/)).
-   `Card`: Convert to TypeScript ([#42941](https://github.com/WordPress/gutenberg/pull/42941)).
-   `NavigableContainer`: Refactor away from `_.omit()` ([#43474](https://github.com/WordPress/gutenberg/pull/43474/)).
-   `Notice`: Refactor away from `_.omit()` ([#43474](https://github.com/WordPress/gutenberg/pull/43474/)).
-   `Snackbar`: Refactor away from `_.omit()` ([#43474](https://github.com/WordPress/gutenberg/pull/43474/)).
-   `UnitControl`: Refactor away from `_.omit()` ([#43474](https://github.com/WordPress/gutenberg/pull/43474/)).
-   `BottomSheet`: Refactor away from `_.omit()` ([#43474](https://github.com/WordPress/gutenberg/pull/43474/)).
-   `DropZone`: Refactor away from `_.includes()` ([#43518](https://github.com/WordPress/gutenberg/pull/43518/)).
-   `NavigableMenu`: Refactor away from `_.includes()` ([#43518](https://github.com/WordPress/gutenberg/pull/43518/)).
-   `Tooltip`: Refactor away from `_.includes()` ([#43518](https://github.com/WordPress/gutenberg/pull/43518/)).
-   `TreeGrid`: Refactor away from `_.includes()` ([#43518](https://github.com/WordPress/gutenberg/pull/43518/)).
-   `FormTokenField`: use `KeyboardEvent.code`, refactor tests to modern RTL and `user-event` ([#43442](https://github.com/WordPress/gutenberg/pull/43442/)).
-   `DropdownMenu`: use `KeyboardEvent.code`, refactor tests to model RTL and `user-event` ([#43439](https://github.com/WordPress/gutenberg/pull/43439/)).
-   `Autocomplete`: Refactor away from `_.escapeRegExp()` ([#43629](https://github.com/WordPress/gutenberg/pull/43629/)).
-   `TextHighlight`: Refactor away from `_.escapeRegExp()` ([#43629](https://github.com/WordPress/gutenberg/pull/43629/)).

### Experimental

-   `FormTokenField`: add `__experimentalAutoSelectFirstMatch` prop to auto select the first matching suggestion on typing ([#42527](https://github.com/WordPress/gutenberg/pull/42527/)).
-   `Popover`: Deprecate `__unstableForcePosition`, now replaced by new `flip` and `resize` props ([#43546](https://github.com/WordPress/gutenberg/pull/43546/)).

## 19.17.0 (2022-08-10)

### Bug Fixes

-   `Popover`: make sure that `ownerDocument` is always defined ([#42886](https://github.com/WordPress/gutenberg/pull/42886)).
-   `ExternalLink`: Check if the link is an internal anchor link and prevent anchor links from being opened. ([#42259](https://github.com/WordPress/gutenberg/pull/42259)).
-   `BorderControl`: Ensure box-sizing is reset for the control ([#42754](https://github.com/WordPress/gutenberg/pull/42754)).
-   `InputControl`: Fix acceptance of falsy values in controlled updates ([#42484](https://github.com/WordPress/gutenberg/pull/42484/)).
-   `Tooltip (Experimental)`, `CustomSelectControl`, `TimePicker`: Add missing font-size styles which were necessary in non-WordPress contexts ([#42844](https://github.com/WordPress/gutenberg/pull/42844/)).
-   `TextControl`, `TextareaControl`, `ToggleGroupControl`: Add `box-sizing` reset style ([#42889](https://github.com/WordPress/gutenberg/pull/42889)).
-   `Popover`: fix arrow placement and design ([#42874](https://github.com/WordPress/gutenberg/pull/42874/)).
-   `Popover`: fix minor glitch in arrow [#42903](https://github.com/WordPress/gutenberg/pull/42903)).
-   `ColorPicker`: fix layout overflow [#42992](https://github.com/WordPress/gutenberg/pull/42992)).
-   `ToolsPanel`: Constrain grid columns to 50% max-width ([#42795](https://github.com/WordPress/gutenberg/pull/42795)).
-   `Popover`: anchor correctly to parent node when no explicit anchor is passed ([#42971](https://github.com/WordPress/gutenberg/pull/42971)).
-   `ColorPalette`: forward correctly `popoverProps` in the `CustomColorPickerDropdown` component [#42989](https://github.com/WordPress/gutenberg/pull/42989)).
-   `ColorPalette`, `CustomGradientBar`: restore correct color picker popover position [#42989](https://github.com/WordPress/gutenberg/pull/42989)).
-   `Popover`: fix iframe offset not updating when iframe resizes ([#42971](https://github.com/WordPress/gutenberg/pull/43172)).

### Enhancements

-   `ToggleGroupControlOptionIcon`: Maintain square proportions ([#43060](https://github.com/WordPress/gutenberg/pull/43060/)).
-   `ToggleGroupControlOptionIcon`: Add a required `label` prop so the button is always accessibly labeled. Also removes `showTooltip` from the accepted prop types, as the tooltip will now always be shown. ([#43060](https://github.com/WordPress/gutenberg/pull/43060/)).
-   `SelectControl`, `CustomSelectControl`: Refresh and refactor chevron down icon ([#42962](https://github.com/WordPress/gutenberg/pull/42962)).
-   `FontSizePicker`: Add large size variant ([#42716](https://github.com/WordPress/gutenberg/pull/42716/)).
-   `Popover`: tidy up code, add more comments ([#42944](https://github.com/WordPress/gutenberg/pull/42944)).
-   Add `box-sizing` reset style mixin to utils ([#42754](https://github.com/WordPress/gutenberg/pull/42754)).
-   `ResizableBox`: Make tooltip background match `Tooltip` component's ([#42800](https://github.com/WordPress/gutenberg/pull/42800)).
-   Update control labels to the new uppercase styles ([#42789](https://github.com/WordPress/gutenberg/pull/42789)).
-   `UnitControl`: Update unit dropdown design for the large size variant ([#42000](https://github.com/WordPress/gutenberg/pull/42000)).
-   `BaseControl`: Add `box-sizing` reset style ([#42889](https://github.com/WordPress/gutenberg/pull/42889)).
-   `ToggleGroupControl`, `RangeControl`, `FontSizePicker`: Add `__nextHasNoMarginBottom` prop for opting into the new margin-free styles ([#43062](https://github.com/WordPress/gutenberg/pull/43062)).
-   `BoxControl`: Export `applyValueToSides` util function. ([#42733](https://github.com/WordPress/gutenberg/pull/42733/)).
-   `ColorPalette`: use index while iterating over color entries to avoid React "duplicated key" warning ([#43096](https://github.com/WordPress/gutenberg/pull/43096)).
-   `AnglePickerControl`: Add `__nextHasNoMarginBottom` prop for opting into the new margin-free styles ([#43160](https://github.com/WordPress/gutenberg/pull/43160/)).
-   `ComboboxControl`: Add `__nextHasNoMarginBottom` prop for opting into the new margin-free styles ([#43165](https://github.com/WordPress/gutenberg/pull/43165/)).

### Internal

-   `ToggleGroupControl`: Add `__experimentalIsIconGroup` prop ([#43060](https://github.com/WordPress/gutenberg/pull/43060/)).
-   `Flex`, `FlexItem`, `FlexBlock`: Convert to TypeScript ([#42537](https://github.com/WordPress/gutenberg/pull/42537)).
-   `InputControl`: Fix incorrect `size` prop passing ([#42793](https://github.com/WordPress/gutenberg/pull/42793)).
-   `Placeholder`: Convert to TypeScript ([#42990](https://github.com/WordPress/gutenberg/pull/42990)).
-   `Popover`: rewrite Storybook examples using controls [#42903](https://github.com/WordPress/gutenberg/pull/42903)).
-   `Swatch`: Remove component in favor of `ColorIndicator` [#43068](https://github.com/WordPress/gutenberg/pull/43068)).

## 19.16.0 (2022-07-27)

### Bug Fixes

-   Context System: Stop explicitly setting `undefined` to the `children` prop. This fixes a bug where `Icon` could not be correctly rendered via the `as` prop of a context-connected component ([#42686](https://github.com/WordPress/gutenberg/pull/42686)).
-   `Popover`, `Dropdown`: Fix width when `expandOnMobile` is enabled ([#42635](https://github.com/WordPress/gutenberg/pull/42635/)).
-   `CustomSelectControl`: Fix font size and hover/focus style inconsistencies with `SelectControl` ([#42460](https://github.com/WordPress/gutenberg/pull/42460/)).
-   `AnglePickerControl`: Fix gap between elements in RTL mode ([#42534](https://github.com/WordPress/gutenberg/pull/42534)).
-   `ColorPalette`: Fix background image in RTL mode ([#42510](https://github.com/WordPress/gutenberg/pull/42510)).
-   `RangeControl`: clamp initialPosition between min and max values ([#42571](https://github.com/WordPress/gutenberg/pull/42571)).
-   `Tooltip`: avoid unnecessary re-renders of select child elements ([#42483](https://github.com/WordPress/gutenberg/pull/42483)).
-   `Popover`: Fix offset when the reference element is within an iframe. ([#42417](https://github.com/WordPress/gutenberg/pull/42417)).

### Enhancements

-   `BorderControl`: Improve labelling, tooltips and DOM structure ([#42348](https://github.com/WordPress/gutenberg/pull/42348/)).
-   `BaseControl`: Set zero padding on `StyledLabel` to ensure cross-browser styling ([#42348](https://github.com/WordPress/gutenberg/pull/42348/)).
-   `InputControl`: Implement wrapper subcomponents for adding responsive padding to `prefix`/`suffix` ([#42378](https://github.com/WordPress/gutenberg/pull/42378)).
-   `SelectControl`: Add flag for larger default size ([#42456](https://github.com/WordPress/gutenberg/pull/42456/)).
-   `UnitControl`: Update unit select's focus styles to match input's ([#42383](https://github.com/WordPress/gutenberg/pull/42383)).
-   `ColorPalette`: Display checkered preview background when `value` is transparent ([#42232](https://github.com/WordPress/gutenberg/pull/42232)).
-   `CustomSelectControl`: Add size variants ([#42460](https://github.com/WordPress/gutenberg/pull/42460/)).
-   `CustomSelectControl`: Add flag to opt in to unconstrained width ([#42460](https://github.com/WordPress/gutenberg/pull/42460/)).
-   `Dropdown`: Implement wrapper subcomponent for adding different padding to the dropdown content ([#42595](https://github.com/WordPress/gutenberg/pull/42595/)).
-   `BorderControl`: Render dropdown as prefix within its `UnitControl` ([#42212](https://github.com/WordPress/gutenberg/pull/42212/))
-   `UnitControl`: Update prop types to allow ReactNode as prefix ([#42212](https://github.com/WordPress/gutenberg/pull/42212/))
-   `ToolsPanel`: Updated README with panel layout information and more expansive usage example ([#42615](https://github.com/WordPress/gutenberg/pull/42615)).
-   `ComboboxControl`, `FormTokenField`: Add custom render callback for options in suggestions list ([#42597](https://github.com/WordPress/gutenberg/pull/42597/)).

### Internal

-   `ColorPicker`: Clean up implementation of 40px size ([#42002](https://github.com/WordPress/gutenberg/pull/42002/)).
-   `Divider`: Complete TypeScript migration ([#41991](https://github.com/WordPress/gutenberg/pull/41991)).
-   `Divider`, `Flex`, `Spacer`: Improve documentation for the `SpaceInput` prop ([#42376](https://github.com/WordPress/gutenberg/pull/42376)).
-   `Elevation`: Convert to TypeScript ([#42302](https://github.com/WordPress/gutenberg/pull/42302)).
-   `ScrollLock`: Convert to TypeScript ([#42303](https://github.com/WordPress/gutenberg/pull/42303)).
-   `Shortcut`: Convert to TypeScript ([#42272](https://github.com/WordPress/gutenberg/pull/42272)).
-   `TreeSelect`: Refactor away from `_.compact()` ([#42438](https://github.com/WordPress/gutenberg/pull/42438)).
-   `MediaEdit`: Refactor away from `_.compact()` for mobile ([#42438](https://github.com/WordPress/gutenberg/pull/42438)).
-   `BoxControl`: Refactor away from `_.isEmpty()` ([#42468](https://github.com/WordPress/gutenberg/pull/42468)).
-   `RadioControl`: Refactor away from `_.isEmpty()` ([#42468](https://github.com/WordPress/gutenberg/pull/42468)).
-   `SelectControl`: Refactor away from `_.isEmpty()` ([#42468](https://github.com/WordPress/gutenberg/pull/42468)).
-   `StyleProvider`: Convert to TypeScript ([#42541](https://github.com/WordPress/gutenberg/pull/42541)).
-   `ComboboxControl`: Replace `keyboardEvent.keyCode` with `keyboardEvent.code`([#42569](https://github.com/WordPress/gutenberg/pull/42569)).
-   `ComboboxControl`: Add support for uncontrolled mode ([#42752](https://github.com/WordPress/gutenberg/pull/42752)).

## 19.15.0 (2022-07-13)

### Bug Fixes

-   `BoxControl`: Change ARIA role from `region` to `group` to avoid unwanted ARIA landmark regions ([#42094](https://github.com/WordPress/gutenberg/pull/42094)).
-   `FocalPointPicker`, `FormTokenField`, `ResizableBox`: Fixed SSR breakage ([#42248](https://github.com/WordPress/gutenberg/pull/42248)).
-   `ComboboxControl`: use custom prefix when generating the instanceId ([#42134](https://github.com/WordPress/gutenberg/pull/42134).
-   `Popover`: pass missing anchor ref to the `getAnchorRect` callback prop. ([#42076](https://github.com/WordPress/gutenberg/pull/42076)).
-   `Popover`: call `getAnchorRect` callback prop even if `anchorRefFallback` has no value. ([#42329](https://github.com/WordPress/gutenberg/pull/42329)).
-   Fix `ToolTip` position to ensure it is always positioned relative to the first child of the ToolTip. ([#41268](https://github.com/WordPress/gutenberg/pull/41268))

### Enhancements

-   `ToggleGroupControl`: Add large size variant ([#42008](https://github.com/WordPress/gutenberg/pull/42008/)).
-   `InputControl`: Ensure that the padding between a `prefix`/`suffix` and the text input stays at a reasonable 8px, even in larger size variants ([#42166](https://github.com/WordPress/gutenberg/pull/42166)).

### Internal

-   `Grid`: Convert to TypeScript ([#41923](https://github.com/WordPress/gutenberg/pull/41923)).
-   `TextHighlight`: Convert to TypeScript ([#41698](https://github.com/WordPress/gutenberg/pull/41698)).
-   `Tip`: Convert to TypeScript ([#42262](https://github.com/WordPress/gutenberg/pull/42262)).
-   `Scrollable`: Convert to TypeScript ([#42016](https://github.com/WordPress/gutenberg/pull/42016)).
-   `Spacer`: Complete TypeScript migration ([#42013](https://github.com/WordPress/gutenberg/pull/42013)).
-   `VisuallyHidden`: Convert to TypeScript ([#42220](https://github.com/WordPress/gutenberg/pull/42220)).
-   `TreeSelect`: Refactor away from `_.repeat()` ([#42070](https://github.com/WordPress/gutenberg/pull/42070/)).
-   `FocalPointPicker` updated to satisfy `react/exhaustive-deps` eslint rule ([#41520](https://github.com/WordPress/gutenberg/pull/41520)).
-   `ColorPicker` updated to satisfy `react/exhaustive-deps` eslint rule ([#41294](https://github.com/WordPress/gutenberg/pull/41294)).
-   `Slot`/`Fill`: Refactor away from Lodash ([#42153](https://github.com/WordPress/gutenberg/pull/42153/)).
-   `ComboboxControl`: Refactor away from `_.deburr()` ([#42169](https://github.com/WordPress/gutenberg/pull/42169/)).
-   `FormTokenField`: Refactor away from `_.identity()` ([#42215](https://github.com/WordPress/gutenberg/pull/42215/)).
-   `SelectControl`: Use roles and `@testing-library/user-event` in unit tests ([#42308](https://github.com/WordPress/gutenberg/pull/42308)).
-   `DropdownMenu`: Refactor away from Lodash ([#42218](https://github.com/WordPress/gutenberg/pull/42218/)).
-   `ToolbarGroup`: Refactor away from `_.flatMap()` ([#42223](https://github.com/WordPress/gutenberg/pull/42223/)).
-   `TreeSelect`: Refactor away from `_.flatMap()` ([#42223](https://github.com/WordPress/gutenberg/pull/42223/)).
-   `Autocomplete`: Refactor away from `_.deburr()` ([#42266](https://github.com/WordPress/gutenberg/pull/42266/)).
-   `MenuItem`: Refactor away from `_.isString()` ([#42268](https://github.com/WordPress/gutenberg/pull/42268/)).
-   `Shortcut`: Refactor away from `_.isString()` ([#42268](https://github.com/WordPress/gutenberg/pull/42268/)).
-   `Shortcut`: Refactor away from `_.isObject()` ([#42336](https://github.com/WordPress/gutenberg/pull/42336/)).
-   `RangeControl`: Convert to TypeScript ([#40535](https://github.com/WordPress/gutenberg/pull/40535)).
-   `ExternalLink`: Refactor away from Lodash ([#42341](https://github.com/WordPress/gutenberg/pull/42341/)).
-   `Navigation`: updated to satisfy `react/exhaustive-deps` eslint rule ([#41612](https://github.com/WordPress/gutenberg/pull/41612))

## 19.14.0 (2022-06-29)

### Bug Fixes

-   `ColorPicker`: Remove horizontal scrollbar when using HSL or RGB color input types. ([#41646](https://github.com/WordPress/gutenberg/pull/41646))
-   `ColorPicker`: Widen hex input field for mobile. ([#42004](https://github.com/WordPress/gutenberg/pull/42004))

### Enhancements

-   Wrapped `ColorIndicator` in a `forwardRef` call ([#41587](https://github.com/WordPress/gutenberg/pull/41587)).
-   `ComboboxControl` & `FormTokenField`: Add `__next36pxDefaultSize` flag for larger default size ([#40746](https://github.com/WordPress/gutenberg/pull/40746)).
-   `BorderControl`: Improve TypeScript support. ([#41843](https://github.com/WordPress/gutenberg/pull/41843)).
-   `DatePicker`: highlight today's date. ([#41647](https://github.com/WordPress/gutenberg/pull/41647/)).
-   Allow automatic repositioning of `BorderBoxControl` and `ColorPalette` popovers within smaller viewports ([#41930](https://github.com/WordPress/gutenberg/pull/41930)).

### Internal

-   `Spinner`: Convert to TypeScript and update storybook ([#41540](https://github.com/WordPress/gutenberg/pull/41540/)).
-   `InputControl`: Add tests and update to use `@testing-library/user-event` ([#41421](https://github.com/WordPress/gutenberg/pull/41421)).
-   `FormToggle`: Convert to TypeScript ([#41729](https://github.com/WordPress/gutenberg/pull/41729)).
-   `ColorIndicator`: Convert to TypeScript ([#41587](https://github.com/WordPress/gutenberg/pull/41587)).
-   `Truncate`: Convert to TypeScript ([#41697](https://github.com/WordPress/gutenberg/pull/41697)).
-   `FocalPointPicker`: Refactor away from `_.clamp()` ([#41735](https://github.com/WordPress/gutenberg/pull/41735/)).
-   `RangeControl`: Refactor away from `_.clamp()` ([#41735](https://github.com/WordPress/gutenberg/pull/41735/)).
-   Refactor components `utils` away from `_.clamp()` ([#41735](https://github.com/WordPress/gutenberg/pull/41735/)).
-   `BoxControl`: Refactor utils away from `_.isNumber()` ([#41776](https://github.com/WordPress/gutenberg/pull/41776/)).
-   `Elevation`: Refactor away from `_.isNil()` ([#41785](https://github.com/WordPress/gutenberg/pull/41785/)).
-   `HStack`: Refactor away from `_.isNil()` ([#41785](https://github.com/WordPress/gutenberg/pull/41785/)).
-   `Truncate`: Refactor away from `_.isNil()` ([#41785](https://github.com/WordPress/gutenberg/pull/41785/)).
-   `VStack`: Convert to TypeScript ([#41850](https://github.com/WordPress/gutenberg/pull/41587)).
-   `AlignmentMatrixControl`: Refactor away from `_.flattenDeep()` in utils ([#41814](https://github.com/WordPress/gutenberg/pull/41814/)).
-   `AutoComplete`: Revert recent `exhaustive-deps` refactor ([#41820](https://github.com/WordPress/gutenberg/pull/41820)).
-   `Spacer`: Convert knobs to controls in Storybook ([#41851](https://github.com/WordPress/gutenberg/pull/41851)).
-   `Heading`: Complete TypeScript migration ([#41921](https://github.com/WordPress/gutenberg/pull/41921)).
-   `Navigation`: Refactor away from Lodash functions ([#41865](https://github.com/WordPress/gutenberg/pull/41865/)).
-   `CustomGradientPicker`: Refactor away from Lodash ([#41901](https://github.com/WordPress/gutenberg/pull/41901/)).
-   `SegmentedControl`: Refactor away from `_.values()` ([#41905](https://github.com/WordPress/gutenberg/pull/41905/)).
-   `DimensionControl`: Refactor docs away from `_.partialRight()` ([#41909](https://github.com/WordPress/gutenberg/pull/41909/)).
-   `NavigationItem` updated to ignore `react/exhaustive-deps` eslint rule ([#41639](https://github.com/WordPress/gutenberg/pull/41639)).

## 19.13.0 (2022-06-15)

### Bug Fixes

-   `Tooltip`: Opt in to `__unstableShift` to ensure that the Tooltip is always within the viewport. ([#41524](https://github.com/WordPress/gutenberg/pull/41524))
-   `FormTokenField`: Do not suggest the selected one even if `{ value: string }` is passed ([#41216](https://github.com/WordPress/gutenberg/pull/41216)).
-   `CustomGradientBar`: Fix insertion and control point positioning to more closely follow cursor. ([#41492](https://github.com/WordPress/gutenberg/pull/41492))
-   `FormTokenField`: Added Padding to resolve close button overlap issue ([#41556](https://github.com/WordPress/gutenberg/pull/41556)).
-   `ComboboxControl`: fix the autofocus behavior after resetting the value. ([#41737](https://github.com/WordPress/gutenberg/pull/41737)).

### Enhancements

-   `AnglePickerControl`: Use NumberControl as input field ([#41472](https://github.com/WordPress/gutenberg/pull/41472)).

### Internal

-   `FormTokenField`: Convert to TypeScript and refactor to functional component ([#41216](https://github.com/WordPress/gutenberg/pull/41216)).
-   `Draggable`: updated to satisfy `react/exhaustive-deps` eslint rule ([#41499](https://github.com/WordPress/gutenberg/pull/41499))
-   `RadioControl`: Convert to TypeScript ([#41568](https://github.com/WordPress/gutenberg/pull/41568)).
-   `Flex` updated to satisfy `react/exhaustive-deps` eslint rule ([#41507](https://github.com/WordPress/gutenberg/pull/41507)).
-   `CustomGradientBar` updated to satisfy `react/exhaustive-deps` eslint rule ([#41463](https://github.com/WordPress/gutenberg/pull/41463))
-   `TreeSelect`: Convert to TypeScript ([#41536](https://github.com/WordPress/gutenberg/pull/41536)).
-   `FontSizePicker`: updated to satisfy `react/exhaustive-deps` eslint rule ([#41600](https://github.com/WordPress/gutenberg/pull/41600)).
-   `ZStack`: Convert component story to TypeScript and add inline docs ([#41694](https://github.com/WordPress/gutenberg/pull/41694)).
-   `Dropdown`: Make sure cleanup (closing the dropdown) only runs when the menu has actually been opened.
-   Enhance the TypeScript migration guidelines ([#41669](https://github.com/WordPress/gutenberg/pull/41669)).
-   `ExternalLink`: Convert to TypeScript ([#41681](https://github.com/WordPress/gutenberg/pull/41681)).
-   `InputControl` updated to satisfy `react/exhaustive-deps` eslint rule ([#41601](https://github.com/WordPress/gutenberg/pull/41601))
-   `Modal`: updated to satisfy `react/exhaustive-deps` eslint rule ([#41610](https://github.com/WordPress/gutenberg/pull/41610))

### Experimental

-   `Navigation`: improve unit tests by using `@testing-library/user-event` and modern `@testing-library` assertions; add unit test for controlled component ([#41668](https://github.com/WordPress/gutenberg/pull/41668)).

## 19.12.0 (2022-06-01)

### Bug Fixes

-   `Popover`, `Dropdown`, `CustomGradientPicker`: Fix dropdown positioning by always targeting the rendered toggle, and switch off width in the Popover size middleware to stop reducing the width of the popover. ([#41361](https://github.com/WordPress/gutenberg/pull/41361))
-   Fix `InputControl` blocking undo/redo while focused. ([#40518](https://github.com/WordPress/gutenberg/pull/40518))
-   `ColorPalette`: Correctly update color name label when CSS variables are involved ([#41461](https://github.com/WordPress/gutenberg/pull/41461)).

### Enhancements

-   `SelectControl`: Add `__nextHasNoMarginBottom` prop for opting into the new margin-free styles ([#41269](https://github.com/WordPress/gutenberg/pull/41269)).
-   `ColorPicker`: Strip leading hash character from hex values pasted into input. ([#41223](https://github.com/WordPress/gutenberg/pull/41223))
-   `ColorPicker`: Display detailed color inputs by default. ([#41222](https://github.com/WordPress/gutenberg/pull/41222))
-   Updated design for the `DateTimePicker`, `DatePicker` and `TimePicker` components ([#41097](https://github.com/WordPress/gutenberg/pull/41097)).
-   `DateTimePicker`: Add `__nextRemoveHelpButton` and `__nextRemoveResetButton` for opting into new behaviour where there is no Help and Reset button ([#41097](https://github.com/WordPress/gutenberg/pull/41097)).

### Internal

-   `AlignmentMatrixControl` updated to satisfy `react/exhaustive-deps` eslint rule ([#41167](https://github.com/WordPress/gutenberg/pull/41167))
-   `BorderControl` updated to satisfy `react/exhaustive-deps` eslint rule ([#41259](https://github.com/WordPress/gutenberg/pull/41259))
-   `CheckboxControl`: Add unit tests ([#41165](https://github.com/WordPress/gutenberg/pull/41165)).
-   `BorderBoxControl`: fix some layout misalignments, especially for RTL users ([#41254](https://github.com/WordPress/gutenberg/pull/41254)).
-   `TimePicker`: Update unit tests to use `@testing-library/user-event` ([#41270](https://github.com/WordPress/gutenberg/pull/41270)).
-   `DateTimePicker`: Update `moment` to 2.26.0 and update `react-date` typings ([#41266](https://github.com/WordPress/gutenberg/pull/41266)).
-   `TextareaControl`: Convert to TypeScript ([#41215](https://github.com/WordPress/gutenberg/pull/41215)).
-   `BoxControl`: Update unit tests to use `@testing-library/user-event` ([#41422](https://github.com/WordPress/gutenberg/pull/41422)).
-   `Surface`: Convert to TypeScript ([#41212](https://github.com/WordPress/gutenberg/pull/41212)).
-   `Autocomplete` updated to satisfy `react/exhaustive-deps` eslint rule ([#41382](https://github.com/WordPress/gutenberg/pull/41382))
-   `Dropdown` updated to satisfy `react/exhaustive-deps` eslint rule ([#41505](https://github.com/WordPress/gutenberg/pull/41505))
-   `DateDayPicker` updated to satisfy `react/exhaustive-deps` eslint rule ([#41470](https://github.com/WordPress/gutenberg/pull/41470)).

### Experimental

-   `Spacer`: Add RTL support. ([#41172](https://github.com/WordPress/gutenberg/pull/41172))

## 19.11.0 (2022-05-18)

### Enhancements

-   `BorderControl` now only displays the reset button in its popover when selections have already been made. ([#40917](https://github.com/WordPress/gutenberg/pull/40917))
-   `BorderControl` & `BorderBoxControl`: Add `__next36pxDefaultSize` flag for larger default size ([#40920](https://github.com/WordPress/gutenberg/pull/40920)).
-   `BorderControl` improved focus and border radius styling for component. ([#40951](https://github.com/WordPress/gutenberg/pull/40951))
-   Improve focused `CircularOptionPicker` styling ([#40990](https://github.com/WordPress/gutenberg/pull/40990))
-   `BorderControl`: Make border color consistent with other controls ([#40921](https://github.com/WordPress/gutenberg/pull/40921))
-   `SelectControl`: Remove `lineHeight` setting to fix issue with font descenders being cut off ([#40985](https://github.com/WordPress/gutenberg/pull/40985))

### Internal

-   `DateTimePicker`: Convert to TypeScript ([#40775](https://github.com/WordPress/gutenberg/pull/40775)).
-   `DateTimePicker`: Convert unit tests to TypeScript ([#40957](https://github.com/WordPress/gutenberg/pull/40957)).
-   `CheckboxControl`: Convert to TypeScript ([#40915](https://github.com/WordPress/gutenberg/pull/40915)).
-   `ButtonGroup`: Convert to TypeScript ([#41007](https://github.com/WordPress/gutenberg/pull/41007)).
-   `Popover`: refactor component to use the `floating-ui` library internally ([#40740](https://github.com/WordPress/gutenberg/pull/40740)).

## 19.10.0 (2022-05-04)

### Internal

-   `UnitControl`: migrate unit tests to TypeScript ([#40697](https://github.com/WordPress/gutenberg/pull/40697)).
-   `DatePicker`: Add improved unit tests ([#40754](https://github.com/WordPress/gutenberg/pull/40754)).
-   Setup `user-event` in unit tests inline, once per test ([#40839](https://github.com/WordPress/gutenberg/pull/40839)).
-   `DatePicker`: Update `react-dates` to 21.8.0 ([#40801](https://github.com/WordPress/gutenberg/pull/40801)).

### Enhancements

-   `InputControl`: Add `__next36pxDefaultSize` flag for larger default size ([#40622](https://github.com/WordPress/gutenberg/pull/40622)).
-   `UnitControl`: Add `__next36pxDefaultSize` flag for larger default size ([#40627](https://github.com/WordPress/gutenberg/pull/40627)).
-   `Modal` design adjustments: Blur elements outside of the modal, increase modal title size, use larger close icon, remove header border when modal contents are scrolled. ([#40781](https://github.com/WordPress/gutenberg/pull/40781)).
-   `SelectControl`: Improved TypeScript support ([#40737](https://github.com/WordPress/gutenberg/pull/40737)).
-   `ToggleControlGroup`: Switch to internal `Icon` component for dashicon support ([40717](https://github.com/WordPress/gutenberg/pull/40717)).
-   Improve `ToolsPanel` accessibility. ([#40716](https://github.com/WordPress/gutenberg/pull/40716))

### Bug Fixes

-   The `Button` component now displays the label as the tooltip for icon only buttons. ([#40716](https://github.com/WordPress/gutenberg/pull/40716))
-   Use fake timers and fix usage of async methods from `@testing-library/user-event`. ([#40790](https://github.com/WordPress/gutenberg/pull/40790))
-   UnitControl: avoid calling onChange callback twice when unit changes. ([#40796](https://github.com/WordPress/gutenberg/pull/40796))
-   `UnitControl`: show unit label when units prop has only one unit. ([#40784](https://github.com/WordPress/gutenberg/pull/40784))
-   `AnglePickerControl`: Fix closing of gradient popover when the angle control is clicked. ([#40735](https://github.com/WordPress/gutenberg/pull/40735))

### Internal

-   `TextControl`: Convert to TypeScript ([#40633](https://github.com/WordPress/gutenberg/pull/40633)).

## 19.9.0 (2022-04-21)

### Bug Fixes

-   Consolidate the main black colors to gray-900. Affects `AlignmentMatrixControl`, `InputControl`, `Heading`, `SelectControl`, `Spinner (Experimental)`, and `Text` ([#40391](https://github.com/WordPress/gutenberg/pull/40391)).

### Internal

-   Remove individual color object exports from the `utils/colors-values.js` file. Colors should now be used from the main `COLORS` export([#40387](https://github.com/WordPress/gutenberg/pull/40387)).

### Bug Fixes

-   `InputControl`: allow user to input a value interactively in Storybook, by removing default value argument ([#40410](https://github.com/WordPress/gutenberg/pull/40410)).

## 19.8.0 (2022-04-08)

### Enhancements

-   Update `BorderControl` and `BorderBoxControl` to allow the passing of custom class names to popovers ([#39753](https://github.com/WordPress/gutenberg/pull/39753)).
-   `ToggleGroupControl`: Reintroduce backdrop animation ([#40021](https://github.com/WordPress/gutenberg/pull/40021)).
-   `Card`: Adjust border radius effective size ([#40032](https://github.com/WordPress/gutenberg/pull/40032)).
-   `InputControl`: Improved TypeScript type annotations ([#40119](https://github.com/WordPress/gutenberg/pull/40119)).

### Internal

-   `BaseControl`: Convert to TypeScript ([#39468](https://github.com/WordPress/gutenberg/pull/39468)).

### New Features

-   Add `BorderControl` component ([#37769](https://github.com/WordPress/gutenberg/pull/37769)).
-   Add `BorderBoxControl` component ([#38876](https://github.com/WordPress/gutenberg/pull/38876)).
-   Add `ToggleGroupControlOptionIcon` component ([#39760](https://github.com/WordPress/gutenberg/pull/39760)).

### Bug Fixes

-   Use `Object.assign` instead of `{ ...spread }` syntax to avoid errors in the code generated by TypeScript ([#39932](https://github.com/WordPress/gutenberg/pull/39932)).
-   `ItemGroup`: Ensure that the Item's text color is not overridden by the user agent's button color ([#40055](https://github.com/WordPress/gutenberg/pull/40055)).
-   `Surface`: Use updated UI text color `#1e1e1e` instead of `#000` ([#40055](https://github.com/WordPress/gutenberg/pull/40055)).
-   `CustomSelectControl`: Make chevron consistent with `SelectControl` ([#40049](https://github.com/WordPress/gutenberg/pull/40049)).

## 19.7.0 (2022-03-23)

### Enhancements

-   `CustomSelectControl`: Add `__next36pxDefaultSize` flag for larger default size ([#39401](https://github.com/WordPress/gutenberg/pull/39401)).
-   `BaseControl`: Add `__nextHasNoMarginBottom` prop for opting into the new margin-free styles ([#39325](https://github.com/WordPress/gutenberg/pull/39325)).
-   `Divider`: Make the divider visible by default (`display: inline`) in flow layout containers when the divider orientation is vertical ([#39316](https://github.com/WordPress/gutenberg/pull/39316)).
-   Stop using deprecated `event.keyCode` in favor of `event.key` for keyboard events in `UnitControl` and `InputControl`. ([#39360](https://github.com/WordPress/gutenberg/pull/39360))
-   `ColorPalette`: refine custom color button's label. ([#39386](https://github.com/WordPress/gutenberg/pull/39386))
-   Add `onClick` prop on `FormFileUpload`. ([#39268](https://github.com/WordPress/gutenberg/pull/39268))
-   `FocalPointPicker`: stop using `UnitControl`'s deprecated `unit` prop ([#39504](https://github.com/WordPress/gutenberg/pull/39504)).
-   `CheckboxControl`: Add support for the `indeterminate` state ([#39462](https://github.com/WordPress/gutenberg/pull/39462)).
-   `UnitControl`: add support for the `onBlur` prop ([#39589](https://github.com/WordPress/gutenberg/pull/39589)).

### Internal

-   Delete the `composeStateReducers` utility function ([#39262](https://github.com/WordPress/gutenberg/pull/39262)).
-   `BoxControl`: stop using `UnitControl`'s deprecated `unit` prop ([#39511](https://github.com/WordPress/gutenberg/pull/39511)).

### Bug Fixes

-   `NumberControl`: commit (and constrain) value on `blur` event ([#39186](https://github.com/WordPress/gutenberg/pull/39186)).
-   Fix `UnitControl`'s reset of unit when the quantity value is cleared. ([#39531](https://github.com/WordPress/gutenberg/pull/39531/)).
-   `ResizableBox`: Ensure tooltip text remains on a single line. ([#39623](https://github.com/WordPress/gutenberg/pull/39623)).

### Deprecations

-   `unit` prop in `UnitControl` marked as deprecated ([#39503](https://github.com/WordPress/gutenberg/pull/39503)).

## 19.6.0 (2022-03-11)

### Enhancements

-   `ConfirmDialog`: Add support for custom label text on the confirmation and cancelation buttons ([#38994](https://github.com/WordPress/gutenberg/pull/38994))
-   `InputControl`: Allow `onBlur` for empty values to commit the change when `isPressEnterToChange` is true, and move reset behavior to the ESCAPE key. ([#39109](https://github.com/WordPress/gutenberg/pull/39109)).
-   `TreeGrid`: Add tests for Home/End keyboard navigation. Add `onFocusRow` callback for Home/End keyboard navigation, this was missed in the implementation PR. Modify test for expanding/collapsing a row as row 1 implements this now. Update README with latest changes. ([#39302](https://github.com/WordPress/gutenberg/pull/39302))
-   `ToggleGroupControlOption`: Calculate width from button content and remove `LabelPlaceholderView` ([#39345](https://github.com/WordPress/gutenberg/pull/39345))

### Bug Fixes

-   Normalize `font-family` on `Button`, `ColorPalette`, `ComoboboxControl`, `DateTimePicker`, `FormTokenField`, `InputControl`, `SelectControl`, and `ToggleGroupControl` ([#38969](https://github.com/WordPress/gutenberg/pull/38969)).
-   Fix input value selection of `InputControl`-based controls in Firefox and Safari with axial constraint of drag gesture ([#38968](https://github.com/WordPress/gutenberg/pull/38968)).
-   Fix `UnitControl`'s behavior around updating the unit when a new `value` is passed (i.e. in controlled mode). ([#39148](https://github.com/WordPress/gutenberg/pull/39148)).

## 19.5.0 (2022-02-23)

### Bug Fixes

-   Fix spin buttons of number inputs in Safari ([#38840](https://github.com/WordPress/gutenberg/pull/38840))
-   Show tooltip on toggle custom size button in FontSizePicker ([#38985](https://github.com/WordPress/gutenberg/pull/38985))

### Enhancements

-   `TreeGrid`: Add tests for `onCollapseRow`, `onExpandRow`, and `onFocusRow` callback functions. ([#38942](https://github.com/WordPress/gutenberg/pull/38942)).
-   `TreeGrid`: Update callback tests to use `TreeGridRow` and `TreeGridCell` sub-components. ([#39002](https://github.com/WordPress/gutenberg/pull/39002)).

## 19.4.0 (2022-02-10)

### Bug Fixes

-   Components: Fix `Slot`/`Fill` Emotion `StyleProvider` ([#38237](https://github.com/WordPress/gutenberg/pull/38237))
-   Reduce height and min-width of the reset button on `ComboBoxControl` for consistency. ([#38020](https://github.com/WordPress/gutenberg/pull/38020))
-   Removed unused `rememo` dependency ([#38388](https://github.com/WordPress/gutenberg/pull/38388)).
-   Added `__unstableInputWidth` to `UnitControl` type definition ([#38429](https://github.com/WordPress/gutenberg/pull/38429)).
-   Fixed typing errors for `ColorPicker` ([#38430](https://github.com/WordPress/gutenberg/pull/38430)).
-   Updated destructuring of `Dropdown` props to be TypeScript friendly ([#38431](https://github.com/WordPress/gutenberg/pull/38431)).
-   Added `ts-nocheck` to `ColorIndicator` so it can be used in typed components ([#38433](https://github.com/WordPress/gutenberg/pull/38433)).
-   Added `cx` as a dependency of `useMemo` across the whole package, in order to recalculate the classnames correctly when a component is rendered across more than one `StyleProvider` ([#38541](https://github.com/WordPress/gutenberg/pull/38541)).

### Enhancements

-   Update the visual design of the `Spinner` component. ([#37551](https://github.com/WordPress/gutenberg/pull/37551))
-   `TreeGrid` accessibility enhancements around the expand/collapse functionality. ([#38358](https://github.com/WordPress/gutenberg/pull/38358))
-   `TreeGrid` accessibility: improve browser support for Left Arrow focus to parent row in child row. ([#38639](https://github.com/WordPress/gutenberg/pull/38639))
-   `TreeGrid` accessibility: Add Home/End keys for better keyboard navigation. ([#38679](https://github.com/WordPress/gutenberg/pull/38679))
-   Add `resolvePoint` prop to `FocalPointPicker` to allow updating the value of the picker after a user interaction ([#38247](https://github.com/WordPress/gutenberg/pull/38247))
-   `TreeGrid`: Allow SHIFT key to be held, and add `onFocusRow` callback to the `TreeGrid` component, fired when focus is shifted from one row to another via Up and Down arrow keys. ([#38314](https://github.com/WordPress/gutenberg/pull/38314))

### Experimental

-   `Navigator`: rename `push`/`pop` to `goTo`/`goBack` ([#38582](https://github.com/WordPress/gutenberg/pull/38582))
-   `Navigator`: add `NavigatorButton` and `NavigatorBackButton` components ([#38634](https://github.com/WordPress/gutenberg/pull/38634))
-   `UnitControl`: tidy up utilities and types. In particular, change the type of parsed quantities to `number` (previously it could have been a `string` too). ([#38987](https://github.com/WordPress/gutenberg/pull/38987]))

## 19.3.0 (2022-01-27)

### Enhancements

-   Refine `ExternalLink` to be same size as the text, to appear more as a glyph than an icon. ([#37859](https://github.com/WordPress/gutenberg/pull/37859))
-   Updated `ToolsPanel` header icon to only show "plus" icon when all items are optional and all are currently hidden ([#38262](https://github.com/WordPress/gutenberg/pull/38262))
-   `TreeGrid`: Fix keyboard navigation for expand/collapse table rows in Firefox ([#37983](https://github.com/WordPress/gutenberg/pull/37983))

### Bug Fixes

-   Update the `HexInput` component to accept a pasted value that contains a starting #
-   Update `ToggleGroupControl` background active state to use a simple background color instead of animated backdrop ([38008](https://github.com/WordPress/gutenberg/pull/38008))
-   Update label spacing for the `BoxControl`, `CustomGradientPicker`, `FormTokenField`, `InputControl`, and `ToolsPanel` components to use a bottom margin of `8px` for consistency. ([#37844](https://github.com/WordPress/gutenberg/pull/37844))
-   Add missing styles to the `BaseControl.VisualLabel` component. ([#37747](https://github.com/WordPress/gutenberg/pull/37747))
-   Prevent keyDown events from propagating up in `CustomSelectControl` ([#30557](https://github.com/WordPress/gutenberg/pull/30557))
-   Mark `children` prop as optional in `SelectControl` ([#37872](https://github.com/WordPress/gutenberg/pull/37872))
-   Add memoization of callbacks and context to prevent unnecessary rerenders of the `ToolsPanel` ([#38037](https://github.com/WordPress/gutenberg/pull/38037))
-   Fix space between icons and rail `RangeControl` ([#36935](https://github.com/WordPress/gutenberg/pull/36935))
-   Increase z-index of `ConfirmDialog` to render on top of parent `Popover` components ([#37959](https://github.com/WordPress/gutenberg/pull/37959))

### Experimental

-   Add basic history location support to `Navigator` ([#37416](https://github.com/WordPress/gutenberg/pull/37416)).
-   Add focus restoration to `Navigator` ([#38149](https://github.com/WordPress/gutenberg/pull/38149)).

## 19.2.0 (2022-01-04)

### Experimental

-   Reinstated the ability to pass additional props to the `ToolsPanel` ([#36428](https://github.com/WordPress/gutenberg/pull/36428)).
-   Added an `__unstable-large` size variant to `InputControl`, `SelectControl`, and `UnitControl` for selective migration to the larger 40px heights. ([#35646](https://github.com/WordPress/gutenberg/pull/35646)).
-   Fixed inconsistent padding in `UnitControl` ([#35646](https://github.com/WordPress/gutenberg/pull/35646)).
-   Added support for RTL behavior for the `ZStack`'s `offset` prop ([#36769](https://github.com/WordPress/gutenberg/pull/36769))
-   Fixed race conditions causing conditionally displayed `ToolsPanelItem` components to be erroneously deregistered ([#36588](https://github.com/WordPress/gutenberg/pull/36588)).
-   Added `__experimentalHideHeader` prop to `Modal` component ([#36831](https://github.com/WordPress/gutenberg/pull/36831)).
-   Added experimental `ConfirmDialog` component ([#34153](https://github.com/WordPress/gutenberg/pull/34153)).
-   Divider: improve support for vertical orientation and RTL styles, use start/end logical props instead of top/bottom, change border-color to `currentColor` ([#36579](https://github.com/WordPress/gutenberg/pull/36579)).
-   `ToggleGroupControl`: Avoid calling `onChange` if radio state changed from an incoming value ([#37224](https://github.com/WordPress/gutenberg/pull/37224/)).
-   `ToggleGroupControl`: fix the computation of the backdrop dimensions when rendered in a Popover ([#37067](https://github.com/WordPress/gutenberg/pull/37067)).
-   Add `__experimentalIsRenderedInSidebar` property to the `GradientPicker`and `CustomGradientPicker`. The property changes the color popover behavior to have a special placement behavior appropriate for sidebar UI's.
-   Add `first` and `last` classes to displayed `ToolsPanelItem` group within a `ToolsPanel` ([#37546](https://github.com/WordPress/gutenberg/pull/37546))

### Bug Fixes

-   Fixed spacing between `BaseControl` fields and help text within the `ToolsPanel` ([#36334](https://github.com/WordPress/gutenberg/pull/36334))
-   Replaced hardcoded blue in `ColorPicker` with UI theme color ([#36153](https://github.com/WordPress/gutenberg/pull/36153)).
-   Fixed empty `ToolsPanel` height by correcting menu button line-height ([#36895](https://github.com/WordPress/gutenberg/pull/36895)).
-   Normalized label line-height and spacing within the `ToolsPanel` ([36387](https://github.com/WordPress/gutenberg/pull/36387))
-   Remove unused `reakit-utils` from peer dependencies ([#37369](https://github.com/WordPress/gutenberg/pull/37369)).
-   Update all Emotion dependencies to the latest version to ensure they work correctly with React types ([#37365](https://github.com/WordPress/gutenberg/pull/37365)).
-   `DateTimePicker`: Fix the date format associated to the `is12Hour` prop ([#37465](https://github.com/WordPress/gutenberg/pull/37465))
-   Allowed `ToolsPanel` to register items when `panelId` is `null` due to multiple block selection ([37216](https://github.com/WordPress/gutenberg/pull/37216)).

### Enhancements

-   Wrapped `Modal` in a `forwardRef` call ([#36831](https://github.com/WordPress/gutenberg/pull/36831)).
-   Refactor `DateTime` class component to functional component ([#36835](https://github.com/WordPress/gutenberg/pull/36835))
-   Unify styles for `ColorIndicator` with how they appear in Global Styles ([#37028](https://github.com/WordPress/gutenberg/pull/37028))
-   Add support for rendering the `ColorPalette` in a `Dropdown` when opened in the sidebar ([#37067](https://github.com/WordPress/gutenberg/pull/37067))
-   Show an incremental sequence of numbers (1/2/3/4/5) as a label of the font size, when we have at most five font sizes, where at least one the them contains a complex css value(clamp, var, etc..). We do this because complex css values cannot be calculated properly and the incremental sequence of numbers as labels can help the user better mentally map the different available font sizes. ([#37038](https://github.com/WordPress/gutenberg/pull/37038))
-   Add support for proper borders to color indicators ([#37500](https://github.com/WordPress/gutenberg/pull/37500))
-   Refactor `SuggestionsList` class component to functional component([#36924](https://github.com/WordPress/gutenberg/pull/36924/))

## 19.1.4 (2021-12-13)

### Bug Fixes

-   Improve accessibility and visibility in `ColorPallete` ([#36925](https://github.com/WordPress/gutenberg/pull/36925))

## 19.1.3 (2021-12-06)

-   Fix missing version information in `CHANGELOG.md`.

## 19.1.2 (2021-12-06)

### Bug Fixes

-   Fixed `GradientPicker` not displaying `CustomGradientPicker` when no gradients are provided ([#36900](https://github.com/WordPress/gutenberg/pull/36900)).
-   Fixed error thrown in `ColorPicker` when used in controlled state in color gradients ([#36941](https://github.com/WordPress/gutenberg/pull/36941)).
-   Updated readme to include default value introduced in fix for unexpected movements in the `ColorPicker` ([#35670](https://github.com/WordPress/gutenberg/pull/35670)).
-   Added support for the legacy `extraSmall` value for the `size` prop in the `Card` component ([#37097](https://github.com/WordPress/gutenberg/pull/37097)).

## 19.1.0 (2021-11-29)

### Enhancements

-   Added a `showTooltip` prop to `ToggleGroupControlOption` in order to display tooltip text (using `<Tooltip />`). ([#36726](https://github.com/WordPress/gutenberg/pull/36726)).

### Bug Fixes

-   Fixed a bug which prevented setting `PM` hours correctly in the `DateTimePicker` ([#36878](https://github.com/WordPress/gutenberg/pull/36878)).

## 19.0.2 (2021-11-15)

-   Remove erroneous use of `??=` syntax from `build-module`.

## 19.0.1 (2021-11-07)

### Enhancements

-   Updated the `ColorPalette` and `GradientPicker` components to the latest designs ([#35970](https://github.com/WordPress/gutenberg/pull/35970)).

### Experimental

-   Updated the `ToolsPanel` to use `Grid` internally to manage panel layout ([#35621](https://github.com/WordPress/gutenberg/pull/35621)).
-   Added experimental `__experimentalHasMultipleOrigins` prop to the `ColorPalette` and `GradientPicker` components ([#35970](https://github.com/WordPress/gutenberg/pull/35970)).

## 19.0.0 (2021-10-22)

### New Features

-   Added support for `step="any"` in `NumberControl` and `RangeControl` ([#34542](https://github.com/WordPress/gutenberg/pull/34542)).

### Enhancements

-   Removed the separator shown between `ToggleGroupControl` items ([#35497](https://github.com/WordPress/gutenberg/pull/35497)).
-   The `ColorPicker` component property `onChangeComplete`, a function accepting a color object, was replaced with the property `onChange`, a function accepting a string on ([#35220](https://github.com/WordPress/gutenberg/pull/35220)).
-   The property `disableAlpha`, was removed from the `ColorPicker` component. Use the new opposite property `enableAlpha` instead ([#35220](https://github.com/WordPress/gutenberg/pull/35220)).

### Experimental

-   Removed the `fieldset` wrapper from the `FontAppearanceControl` component ([35461](https://github.com/WordPress/gutenberg/pull/35461)).
-   Refactored the `ToggleGroupControl` component's structure and embedded `ToggleGroupControlButton` directly into `ToggleGroupControlOption` ([#35600](https://github.com/WordPress/gutenberg/pull/35600)).
-   Added support for showing an experimental hint in `CustomSelectControl` ([#35673](https://github.com/WordPress/gutenberg/pull/35673)).

### Breaking Changes

-   The `color` property a `tinycolor2` color object passed on `onChangeComplete` property of the `ColorPicker` component was removed. Please use the new `onChange` property that accepts a string color representation ([#35562](https://github.com/WordPress/gutenberg/pull/35562)).

## 18.0.0 (2021-10-12)

### Breaking Changes

-   Removed the deprecated `position` and `menuLabel` from the `DropdownMenu` component ([#34537](https://github.com/WordPress/gutenberg/pull/34537)).
-   Removed the deprecated `onClickOutside` prop from the `Popover` component ([#34537](https://github.com/WordPress/gutenberg/pull/34537)).
-   Changed `RangeControl` component to not apply `shiftStep` to inputs from its `<input type="range"/>` ([35020](https://github.com/WordPress/gutenberg/pull/35020)).
-   Removed `isAction` prop from `Item`. The component will now rely on `onClick` to render as a `button` ([35152](https://github.com/WordPress/gutenberg/pull/35152)).

### New Features

-   Add an experimental `Navigator` components ([#34904](https://github.com/WordPress/gutenberg/pull/34904)) as a replacement for the previous `Navigation` related components.
-   Update the `ColorPicker` component to the latest design ([#35220](https://github.com/WordPress/gutenberg/pull/35220))

### Bug Fixes

-   Fixed rounding of value in `RangeControl` component when it loses focus while the `SHIFT` key is held. ([#35020](https://github.com/WordPress/gutenberg/pull/35020)).

### Internal

-   Deleted the `createComponent` utility function ([#34929](https://github.com/WordPress/gutenberg/pull/34929)).
-   Deleted the `useJumpStep` utility function ([#35561](https://github.com/WordPress/gutenberg/pull/35561)).

## 17.0.0 (2021-09-09)

### Breaking Changes

-   Removed a min-width from the `DropdownMenu` component, allowing the menu to accommodate thin contents like vertical tools menus ([#33995](https://github.com/WordPress/gutenberg/pull/33995)).

### Bug Fixes

-   Fixed RTL styles in `Flex` component ([#33729](https://github.com/WordPress/gutenberg/pull/33729)).
-   Fixed unit test errors caused by `CSS.supports` being called in a non-browser environment ([#34572](https://github.com/WordPress/gutenberg/pull/34572)).
-   Fixed `ToggleGroupControl`'s backdrop not updating when changing the `isAdaptiveWidth` property ([#34595](https://github.com/WordPress/gutenberg/pull/34595)).

### Internal

-   Renamed `PolymorphicComponent*` types to `WordPressComponent*` ([#34330](https://github.com/WordPress/gutenberg/pull/34330)).

## 16.0.0 (2021-08-23)

### Breaking Changes

-   Updated the visual styles of the RangeControl component ([#33824](https://github.com/WordPress/gutenberg/pull/33824)).

### New Features

-   Add `hideLabelFromVision` prop to `RangeControl` ([#33714](https://github.com/WordPress/gutenberg/pull/33714)).

### Bug Fixes

-   Listen to `resize` events correctly in `useBreakpointIndex`. This hook is used in `useResponsiveValue` and consequently in the `Flex` and `Grid` components ([#33902](https://github.com/WordPress/gutenberg/pull/33902))

## 15.0.0 (2021-07-29)

### Breaking Changes

-   Upgraded React components to work with v17.0 ([#29118](https://github.com/WordPress/gutenberg/pull/29118)). There are no new features in React v17.0 as explained in the [blog post](https://reactjs.org/blog/2020/10/20/react-v17.html).

### Deprecations

-   `isScrollable` prop in `CardBody` default value changed from `true` to `false` ([#33490](https://github.com/WordPress/gutenberg/pull/33490))

### Bug Fixes

-   Added back `box-sizing: border-box` rule to `CardBody`, `CardHeader` and `CardFooter` components [#33511](https://github.com/WordPress/gutenberg/pull/33511).

## 14.2.0 (2021-07-21)

### New Features

-   Update the border color used in `CardBody`, `CardHeader`, `CardFooter`, and `CardDivider` to a different shade of gray, in order to match the color used in other components ([#32566](https://github.com/WordPress/gutenberg/pull/32566)).

### Deprecations

-   `isPrimary`, `isSecondary`, `isTertiary` and `isLink` props in `Button` have been deprecated. Use `variant` instead ([#31713](https://github.com/WordPress/gutenberg/pull/31713)).
-   `isElevated` prop in `Card` has been deprecated. Use `elevation` instead ([#32566](https://github.com/WordPress/gutenberg/pull/32566)).

### Internal

-   `Card`, `CardBody`, `CardHeader`, `CardFooter`, `CardMedia`, and `CardDivider` components have been re-written from the ground up ([#32566](https://github.com/WordPress/gutenberg/pull/32566)).

## 14.1.0 (2021-05-20)

## 14.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at <https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/>.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at <https://nodejs.org/en/about/releases/>.
-   The experimental `Text` component has been completely re-written and enhanced with truncation support and separate variant, size, and weight props to allow for greater control. The previous `variant` prop has been completely removed.

### Deprecations

-   `isReversed` prop in `Flex` component has been deprecated. Use `direction` instead ([#31297](https://github.com/WordPress/gutenberg/pull/31297)).

### Internal

-   `Flex`, `FlexBlock`, and `FlexItem` components have been re-written from the ground up ([#31297](https://github.com/WordPress/gutenberg/pull/31297)).

## 13.0.0 (2021-03-17)

### Breaking Changes

-   `onChange` prop of `FocalPointPicker` is called at the end of drag operations. Previously, it was called repetitively while dragging.

### New Features

-   Supports ref forwarding in `withNotices` and `ResizableBox`.
-   Adds `onDrag` prop of `FocalPointPicker`.

### Bug Fixes

-   Allows focus of the `FocalPointPicker` draggable area and adjustment with arrow keys. This was added in [#22531](https://github.com/WordPress/gutenberg/pull/22264) but was no longer working.

## 12.0.0 (2020-12-17)

### Enhancements

-   ComboboxControl: Deburr option labels before filter

### Breaking Changes

-   Introduce support for other units and advanced CSS properties on `FontSizePicker`. Provided the value passed to the `FontSizePicker` is a string or one of the size options passed is a string, onChange will start to be called with a string value instead of a number. On WordPress usage, font size options are now automatically converted to strings with the default "px" unit added.

## 10.1.0 (2020-09-03)

### New Features

-   Add `ToolbarItem` component.
-   Support `label` prop on the `Toolbar` component.

### Deprecations

-   Deprecate the `Toolbar` component when used without the `label` prop. `ToolbarGroup` should be used instead.

## 10.0.0 (2020-07-07)

### Breaking Changes

-   `NumberControl` no longer automatically transforms values when rendering `value` into a `<input />` HTML element.
-   `Dashicon` component no longer renders SVGs. If you rely on this component, make sure to load the dashicon font.

## 9.6.0 (2020-05-14)

### Bug Fixes

-   Fix and issue that would cause the `Popover` component to throw an error under certain
    circumstances ([#22264](https://github.com/WordPress/gutenberg/pull/22264)).

### Deprecations

-   The `Guide` component no longer supports passing pages as children. Use the `pages` prop instead.
-   The `GuidePage` component is deprecated. Use the `pages` prop in `Guide` instead.

## 9.2.0 (2020-02-10)

### Enhancements

-   The `Notice` component will speak its message. With this new feature, a developer can control either the `spokenMessage` spoken message, or the `politeness` politeness level of the message.
-   The `Snackbar` component will speak its message. With this new feature, a developer can control either the `spokenMessage` spoken message, or the `politeness` politeness level of the message.
-   A `Notice` `actions` member can now assign `isPrimary` to render a primary button action associated with a notice message.

### Bug Fixes

-   Notice will assume a default status of 'info' if none is provided. This resolves an issue where the notice would be assigned a class name `is-undefined`. This was previously the effective default by styled appearance and should not be considered a breaking change in that regard.

## 9.0.0 (2020-01-13)

### New Features

-   Added a new `Guide` component which allows developers to easily present a user guide.

### Breaking Changes

-   `is-button` classname has been removed from the Button component.
-   The `is-default` classname is not applied automatically anymore.
-   By default Button components come with a fixed height and hover styles.

### Bug Fixes

-   Fixes a regression published in version 8.5.0 that would prevent some build tools from including
    styles provided in the packages build-styles directory.

### Deprecations

-   `isDefault` prop in `Button` has been deprecated. Consider using `isSecondary` instead.
-   `IconButton` has been deprecated. Use the `Button` component instead.

## 8.2.0 (2019-08-29)

### New Features

-   The bundled `re-resizable` dependency has been updated from requiring `5.0.1` to requiring `^6.0.0` ([#17011](https://github.com/WordPress/gutenberg/pull/17011)).

## 8.1.0 (2019-08-05)

### New Features

-   Added a new `popoverProps` prop to the `Dropdown` component which allows users of the `Dropdown` component to pass props directly to the `Popover` component.
-   Added and documented `hideLabelFromVision` prop to `BaseControl` used by `SelectControl`, `TextControl`, and `TextareaControl`.
-   Added a new `popoverProps` prop to the `DropdownMenu` component which allows to pass props directly to the nested `Popover` component.
-   Added a new `toggleProps` prop to the `DropdownMenu` component which allows to pass props directly to the nested `IconButton` component.
-   Added a new `menuProps` prop to the `DropdownMenu` component which allows to pass props directly to the nested `NavigableMenu` component.

### Deprecations

-   `menuLabel` prop in `DropdownComponent` has been deprecated. Consider using `menuProps` object and its `aria-label` property instead.
-   `position` prop in `DropdownComponent` has been deprecated. Consider using `popoverProps` object and its `position` property instead.

### Bug Fixes

-   The `Button` component will no longer assign default styling (`is-default` class) when explicitly assigned as primary (the `isPrimary` prop). This should resolve potential conflicts affecting a combination of `isPrimary`, `isDefault`, and `isLarge` / `isSmall`, where the busy animation would appear with incorrect coloring.

### Deprecations

-   The `Popover` component `onClickOutside` prop has been deprecated. Use `onFocusOutside` instead.

### Internal

-   The `Dropdown` component has been refactored to focus changes using the `Popover` component's `onFocusOutside` prop.
-   The `MenuItem` component will now always use an `IconButton`. This prevents a focus loss when clicking a menu item.
-   Package no longer depends on external `react-click-outside` library.

## 8.0.0 (2019-06-12)

### New Features

-   Add new `BlockQuotation` block to the primitives folder to support blockquote in a multiplatform way. [#15482](https://github.com/WordPress/gutenberg/pull/15482).
-   `DropdownMenu` now supports passing a [render prop](https://reactjs.org/docs/render-props.html#using-props-other-than-render) as children for more advanced customization.

### Internal

-   `MenuGroup` no longer uses `NavigableMenu` internally. It needs to be explicitly wrapped with `NavigableMenu` to bring back the same behavior.

### Documentation

-   Added missing documentation for `DropdownMenu` props `menuLabel`, `position`, `className`.

### Breaking Changes

-   `ServerSideRender` is no longer part of components. It was extracted to an independent package `@wordpress/server-side-render`.

### Bug Fixes

-   Although `DateTimePicker` does not allow picking the seconds, passed the current seconds as the selected value for seconds when calling `onChange`. Now it passes zero.

## 7.4.0 (2019-05-21)

### New Features

-   Added a new `HorizontalRule` component.
-   Added a new `Snackbar` component.

### Bug Fixes

-   Fixed display of reset button when using RangeControl `allowReset` prop.
-   Fixed minutes field of `DateTimePicker` missed '0' before single digit values.

## 7.3.0 (2019-04-16)

### New Features

-   Added a new `render` property to `FormFileUpload` component. Allowing users of the component to custom the UI for their needs.
-   Added a new `BaseControl.VisualLabel` component.
-   Added a new `preview` prop to the `Placeholder` component which allows to display a preview, for example a media preview when the Placeholder is used in media editing contexts.
-   Added a new `anchorRect` prop to `Popover` which enables a developer to provide a custom `DOMRect` object at which to position the popover.

### Enhancements

-   Limit `Base Control Label` to the width of its content.

### Bug Fixes

-   Fix `instanceId` prop passed through to `Button` component via `MenuItems` producing React console error. Fixed by removing the unnecessary use of `withInstanceId` on the `MenuItems` component [#14599](https://github.com/WordPress/gutenberg/pull/14599)

## 7.2.0 (2019-03-20)

### Enhancements

-   Make `RangeControl` validation rely on the `checkValidity` provided by the browsers instead of using our own validation.

### Bug Fixes

-   Fix a problem that made `RangeControl` not work as expected with float values.

## 7.1.0 (2019-03-06)

### New Features

-   Added a new `Animate` component.

### Enhancements

-   `withFilters` has been optimized to avoid binding hook handlers for each mounted instance of the component, instead using a single centralized hook delegator.
-   `withFilters` has been optimized to reuse a single shared component definition for all filtered instances of the component.
-   Make `RangeControl` validate min and max properties.

### Bug Fixes

-   Resolves a conflict where two instance of Slot would produce an inconsistent or duplicated rendering output.
-   Allow years between 0 and 1970 in DateTime component.

### New Features

-   `Dropdown` now has a `focusOnMount` prop which is passed directly to the contained `Popover`.
-   `DatePicker` has new prop `isInvalidDate` exposing react-dates' `isOutsideRange`.
-   `DatePicker` allows `null` as accepted value for `currentDate` prop to signify no date selection.

## 7.0.5 (2019-01-03)

## 7.0.4 (2018-12-12)

## 7.0.3 (2018-11-30)

## 7.0.2 (2018-11-22)

## 7.0.1 (2018-11-21)

## 7.0.0 (2018-11-20)

### Breaking Changes

-   `Dropdown.refresh()` has been removed. The contained `Popover` is now automatically refreshed.

## 6.0.2 (2018-11-15)

## 6.0.1 (2018-11-12)

### Bug Fixes

-   Avoid constantly recomputing the popover position.

### Internal

-   Remove `<DateTimePicker />` obsolete `locale` prop (and pass-through to child components) and obsolete `is12Hour` prop pass through to `<DateTime />` [#11649](https://github.com/WordPress/gutenberg/pull/11649)

## 6.0.0 (2018-11-12)

### Breaking Changes

-   The `PanelColor` component has been removed.

## 5.1.1 (2018-11-09)

## 5.1.0 (2018-11-09)

### New Features

-   Adjust a11y roles for MenuItem component, so that aria-checked is used properly, related change in Editor/Components/BlockNavigationList ([#11431](https://github.com/WordPress/gutenberg/issues/11431)).
-   `Popover` components are now automatically refreshed every 0.5s in order to recalculate their size or position.

### Deprecations

-   `Dropdown.refresh()` has been deprecated as the contained `Popover` is now automatically refreshed.

## 5.0.2 (2018-11-03)

### Internal

-   Forward `ref` in the `PanelBody` component.
-   Tooltip are no longer removed when Button becomes disabled, it's left to the component rendering the Tooltip.
-   Forward `ref` support in `TabbableContainer` and `NavigableMenu` components.

## 5.0.1 (2018-10-30)

## 5.0.0 (2018-10-29)

### Breaking Changes

-   `AccessibleSVG` component has been removed. Please use `SVG` instead.

### New Features

-   The `Notice` component accepts an array of action objects via the `actions` prop. Each member object should contain a `label` and either a `url` link string or `onClick` callback function.

## 4.2.1 (2018-10-22)

### Bug Fixes

-   Fix importing `react-dates` stylesheet in production.

## 4.2.0 (2018-10-19)

### New Features

-   Added a new `ColorPicker` component ([#10564](https://github.com/WordPress/gutenberg/pull/10564)).
-   `MenuItem` now accepts an `info` prop for including an extended description.

### Bug Fixes

-   `IconButton` correctly respects a passed `aria-label` prop.

### Deprecations

-   `PanelColor` has been deprecated in favor of `wp.editor.PanelColorSettings`.

## 4.1.2 (2018-10-18)

## 4.1.0 (2018-10-10)

### New Features

-   Added a new `ResizableBox` component.

## 4.0.0 (2018-09-30)

### Breaking Changes

-   `Draggable` as a DOM node drag handler has been removed. Please, use `Draggable` as a wrap component for your DOM node drag handler.

### Deprecations

-   Renamed `AccessibleSVG` component to `SVG`.

## 3.0.0 (2018-09-05)

### Breaking Changes

-   `withAPIData` has been removed. Please use the Core Data module or `@wordpress/api-fetch` directly instead.
-   `Draggable` as a DOM node drag handler has been deprecated. Please, use `Draggable` as a wrap component for your DOM node drag handler.
-   Change how required built-ins are polyfilled with Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)). If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods.
-   `withContext` has been removed. Please use `wp.element.createContext` instead. See: <https://reactjs.org/docs/context.html>.

### New Features

-   Added a new `AccessibleSVG` component.
