<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Bug Fixes

- DataViewsPicker: ensure title overflows correctly in Grid view. ([#72339](https://github.com/WordPress/gutenberg/pull/72339))

### Enhancements

- Dataviews: Make header table view select all checkbox always visible. ([#72050](https://github.com/WordPress/gutenberg/pull/72050))
- Move search icon in search fields to prefix position ([#71984](https://github.com/WordPress/gutenberg/pull/71984)).
- Flip search icons depending on placement ([#72070](https://github.com/WordPress/gutenberg/pull/72070)).
- DataViews: Improve renderItemLink event propagation handling. ([#72081](https://github.com/WordPress/gutenberg/pull/72081)).
- Normalize search field styles ([#72072](https://github.com/WordPress/gutenberg/pull/72072)).
- DataForm control for `date` supports `required` and `custom` validation [#72048](https://github.com/WordPress/gutenberg/pull/72048).
- DataForm control for `datetime` supports `required` and `custom` validation. [#72060](https://github.com/WordPress/gutenberg/pull/72060).
- Standardise DataForm typography. [#72284](https://github.com/WordPress/gutenberg/pull/72284).
- Dataviews: Add support for dynamic modal headers. [#72384](https://github.com/WordPress/gutenberg/pull/72384)

### Breaking changes

- DataForm no longer injects an empty value to the `select` control. Consumers must now explicitly provide it if they need one. [#72241](https://github.com/WordPress/gutenberg/pull/72241)
- DataForm: Add summary field support for both card and panel layouts. The `summary` property has been moved from the field level to the layout level, and so fields using `summary` at the field level must now configure it within the `layout` object. Additionally, the first children will only be used as summary for the panel if 1) there is no `layout.summary` and 2) the form field ID doesn't match any existing field. See README for details. [#71576](https://github.com/WordPress/gutenberg/pull/71576)
- Remove `Data< Item >` type, as it is no longer used internally for a long time. [#72051](https://github.com/WordPress/gutenberg/pull/72051)
- Remove `isDestructive` prop from actions API. Destructive actions should be communicated via flow (opens modal to confirm) and color should be used in the modal. [#72111](https://github.com/WordPress/gutenberg/pull/72111)
- The `isValid.custom` default function that comes with the field type no longer checks for elements. This is now the `isValid.elements` responsibility and can be toggle on/off separately. [#72325](https://github.com/WordPress/gutenberg/pull/72325)
- DataForm: make validation controlled by leveraging a `validity` prop. This also removes `isItemValid` and introduces `useFormValidity` hook to calculate the `validity` prop. [#71412](https://github.com/WordPress/gutenberg/pull/71412)

### Features

- DataForm: add a style prop to set the width of elements in the row layout. [#72066](https://github.com/WordPress/gutenberg/pull/72066)

### Code Quality

- Reorganizes normalize-form-fields and renames `dataforms-layouts/` to `dataform-layout/` to follow the naming schema of any other folder in the package. [#72056](https://github.com/WordPress/gutenberg/pull/72056)
- Moves `utils.ts` to `field-types/utils/render-from-elements.ts`, so it's collocated where it is used. [#72058](https://github.com/WordPress/gutenberg/pull/72058)
- Centralize all top-level utilities in a `utils/` folder, sets a name that reflects on the function name, and uses the default exports. [#72063](https://github.com/WordPress/gutenberg/pull/72063)
- DataForm: refactor RelativeDateControl to use DataFormControl props. [#72361](https://github.com/WordPress/gutenberg/pull/72361)

## 9.1.0 (2025-10-01)

### Features

- Introduce a new `DataViewsPicker` component. [#70971](https://github.com/WordPress/gutenberg/pull/70971) and [#71836](https://github.com/WordPress/gutenberg/pull/71836).
- DataForm: Add support for elements validation in array fields [#71194](https://github.com/WordPress/gutenberg/pull/71194)

### Bug Fixes

- DataViews: keep non-hideable fields out of the hidden-fields list when they’re already invisible. [#71729](https://github.com/WordPress/gutenberg/pull/71729/)
- DataViewsPicker: Hide the space reserved for the title when the title is hidden. [#71865](https://github.com/WordPress/gutenberg/pull/71865)
- Always render a wrapper for media field (prevents layout break when 'itemClickable' is false). [#72078](https://github.com/WordPress/gutenberg/pull/72078).

### Enhancements

- DataViews: Require at least one field to be visible. ([#71625](https://github.com/WordPress/gutenberg/pull/71625))
- DataViews: Expose `DataViews.FiltersToggled` component to be used in free composition. [#71907](https://github.com/WordPress/gutenberg/pull/71907)
- DataViews: Add `number` field and refactor `integer` field based on the `number` field. ([#71797](https://github.com/WordPress/gutenberg/pull/71797))

## 9.0.0 (2025-09-17)

### Breaking changes

- Remove `boolean` form control. Fields using `Edit: 'boolean'` must now use `Edit: 'checkbox'` or `Edit: 'toggle'` instead. Boolean field types now use checkboxes by default. [#71505](https://github.com/WordPress/gutenberg/pull/71505)
- DataViews: Custom `empty` elements are no longer wrapped in `<p>` tags to improve accessibility. [#71561](https://github.com/WordPress/gutenberg/pull/71561)

### Features

- Field API: introduce `setValue` to fix DataViews filters and DataForm panel layout (modal) when working with nested data. [#71604](https://github.com/WordPress/gutenberg/pull/71604)
- Dataform: Add new `telephone` field type and field control. [#71498](https://github.com/WordPress/gutenberg/pull/71498)
- DataForm: introduce a new `row` layout, check the README for details. [#71124](https://github.com/WordPress/gutenberg/pull/71124)
- Dataform: Add new `url` field type and field control. [#71518](https://github.com/WordPress/gutenberg/pull/71518)
- Dataform: Add new `password` field type and field control. [#71545](https://github.com/WordPress/gutenberg/pull/71545)
- DataForm: Add a textarea control for use with the `text` field type ([#71495](https://github.com/WordPress/gutenberg/pull/71495))
- DataViews: support groupBy in the list layout. [#71548](https://github.com/WordPress/gutenberg/pull/71548)
- DataForm: support validation in select control [#71665](https://github.com/WordPress/gutenberg/pull/71665)
- DataForm: support validation in toggleGroup control. ([#71666](https://github.com/WordPress/gutenberg/pull/71666))
- DataForm: Add object configuration support for Edit property with some options. ([#71582](https://github.com/WordPress/gutenberg/pull/71582))
- DataForm: Add summary field support for composed fields. ([#71614](https://github.com/WordPress/gutenberg/pull/71614))
- DataForm: update radio control to support `required` and `custom` validation. [#71664](https://github.com/WordPress/gutenberg/pull/71664)

### Bug Fixes

- DataViews grid layout: make sure media previews have rounded corners. [#71543](https://github.com/WordPress/gutenberg/pull/71543)
- DataForm regular layout: Remove label style overrides as they cause inconsistent results. ([#71574](https://github.com/WordPress/gutenberg/pull/71574))
- DataForm regular layout: Use BaseControl visual label for readonly fields when in top labelPosition. ([#71597](https://github.com/WordPress/gutenberg/pull/71597))

## 8.0.0 (2025-09-03)

### Breaking changes

- Revert the ability to hide the view config via `config` prop and export a `DataViews.Footer` component to support the "Minimal UI" story. [#71276](https://github.com/WordPress/gutenberg/pull/71276)

### Enhancements

-   DataForm: add description support for the combined fields and show the description in the Card layout ([#71380](https://github.com/WordPress/gutenberg/pull/71380)).
-   Add support for hiding the `title` in Grid layouts, with the actions menu rendered over the media preview. [#71369](https://github.com/WordPress/gutenberg/pull/71369)

### Internal

- Display names for Context providers [#71208](https://github.com/WordPress/gutenberg/pull/71208)

### Bug Fixes

-   DataViews: Fix incorrect documentation for `defaultLayouts` prop. [#71334](https://github.com/WordPress/gutenberg/pull/71334)
-   DataViews: Fix mismatched padding on mobile viewports for grid layout [#71455](https://github.com/WordPress/gutenberg/pull/71455)

## 7.0.0 (2025-08-20)

### Breaking changes

- DataForm: introduce a new `card` layout. The `form.type` has been moved under a new `layout` object and it is now `form.layout.type`, check the README for details. [#71100](https://github.com/WordPress/gutenberg/pull/71100)
- Adds a new `config` prop to DataViews that allows hiding the view config control entirely. The `perPageSizes` prop has been moved to be part of this new prop. [#71173](https://github.com/WordPress/gutenberg/pull/71173)

### Features

- Introduce a new `array` DataForm Edit control that supports multi-selection. [#71136](https://github.com/WordPress/gutenberg/pull/71136)
- Add `enableMoving` option to the `table` layout to allow or disallow column moving left and right. [#71120](https://github.com/WordPress/gutenberg/pull/71120)
- Add infinite scroll support across all layout types (grid, list, table). Enable infinite scroll by providing an `infiniteScrollHandler` function in the `paginationInfo` prop and toggling the feature in the view configuration. ([#70955](https://github.com/WordPress/gutenberg/pull/70955))
- Add support for modal in DataForm panel layouts. [#71212](https://github.com/WordPress/gutenberg/pull/71212)

### Enhancements

- Update DataForm stories to better highlight the library's capabilities ([#71268](https://github.com/WordPress/gutenberg/pull/71268)).
- Add two smaller sizs to the grid layout ([#71077](https://github.com/WordPress/gutenberg/pull/71077)).

### Bug Fixes

- Do not throw exception when `view.layout.previewSize` is smaller than the smallest available size. [#71218](https://github.com/WordPress/gutenberg/pull/71218)
- Fix actions horizontal layout consistency when all actions are primary. [#71274](https://github.com/WordPress/gutenberg/pull/71274)

## 6.0.0 (2025-08-07)

### Breaking changes

- Field API: `isValid` is now an object that contains `required` and `custom` validation rules. Additionally, fields should now opt-in into being a "required" field by setting `isValid.required` to `true` (all fields of type `email` and `integer` were required by default). [#70901](https://github.com/WordPress/gutenberg/pull/70901)

### Bug Fixes

- Do not render an empty `&nbsp;` when the title field has level 0. [#71021](https://github.com/WordPress/gutenberg/pull/71021)
- When a field type is `array` and it has elements, the select control should allow multi-selection. [#71000](https://github.com/WordPress/gutenberg/pull/71000)
- Set minimum and maximum number of items in `perPageSizes`, so that the UI control is disabled when the list exceeds those limits. [#71004](https://github.com/WordPress/gutenberg/pull/71004)
- Fix `filterSortAndPaginate` to handle searching fields that have a type of `array` ([#70785](https://github.com/WordPress/gutenberg/pull/70785)).
- Fix user-input filters: empty value for text and integer filters means there's no value to search for (so it returns all items). It also fixes a type conversion where empty strings for integer were converted to 0 [#70956](https://github.com/WordPress/gutenberg/pull/70956/).
- Fix Table layout Title's column wrapping and min-width so that long descriptions can be visualized without scrolling. [#70983](https://github.com/WordPress/gutenberg/pull/70983)

### Features

- Introduce locked filters, as filters that cannot be edited by the user. [#71075](https://github.com/WordPress/gutenberg/pull/71075)
- Add "groupBy" support to the table layout. [#71055](https://github.com/WordPress/gutenberg/pull/71055)
- Elements in the Field API can now provide an empty value that will be used instead of the default. [#70894](https://github.com/WordPress/gutenberg/pull/70894)
- Support Ctrl + Click / Cmd + Click for multiselecting rows in the Table layout ([#70891](https://github.com/WordPress/gutenberg/pull/70891)).
- Add support for the `Edit` control on the date field type ([#70836](https://github.com/WordPress/gutenberg/pull/70836)).
- Add support for responsive image attributes in media fields by adding a `config` prop to `mediaField.render`, containing a `sizes` string. Also simplifies grid logic and fixes imprecisions in grid resizing by changing the observed container. ([#70493](https://github.com/WordPress/gutenberg/pull/70493)).
- `DataViews` empty state can be customized using the new `empty` prop.

### Enhancements

- Make the media item clickable along the title ([#70985](https://github.com/WordPress/gutenberg/pull/70985)).

## 5.0.0 (2025-07-23)

### Bug Fixes

- Fix `filterSortAndPaginate` to handle undefined values for the `is` filter.
- Fix the background color of the action column if the row is selected

### Features

- Add support for grouping items by a field in the `grid` layout by introducing a `groupByField` prop in the View object.
- Add support for free composition in the `DataViews` component by exporting subcomponents: `<DataViews.ViewConfig />`, `<DataViews.Search />`, `<DataViews.Pagination />`, `<DataViews.LayoutSwitcher />`, `<DataViews.Layout />`, `<DataViews.FiltersToggle />`, `<DataViews.Filters />`, `<DataViews.BulkActionToolbar />`.
- `select`, `text`, `email` controls: add `help` support from the field `description` prop.
- `text`, `email` Edit control: add `help` support from the field `description` prop.
- Add new Edit controls: `checkbox`, `toggleGroup`. In the `toggleGroup`, if the field elements (options) have a `description`, then the selected option's description will be also rendered.
- Add new `media`, `boolean`, `email`, `array` and `date` field type definitions.
- Field type definitions are now able to define a default `enableSorting` and `render` function.
- Pin the actions column on the table view when the width is insufficient.
- Enhance filter component styles.
- Add user input filter support based on the `Edit` property of the field type definitions.
- Add new filter operators: `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `contains`, `notContains`, `startsWith`, `between`, `on`, `notOn`, `before`, `after`, `inThePast`, `over`, `beforeInc`, and `afterInc`.
- Add `align` to the `layout.styles` properties, for use in the DataViews table layout. Options are: `start`, `center`, and `end`.
- Allow fields to opt-out of filtering via `field.filterBy: false`.
- Update the field type definitions to declare the default and valid operators they support. Fields with no `type` property can use all operators; if none is provided in the field's config, they'll use `is` and `isNot` by default.
- Adjust the spacing of the `DataForm` based on the type.
- Add `label-position-side` classes to labels in the form field layouts. Ensure that labels in the panel view do not align center, and that all side labels are center aligned.
- Allow readonly fields in DataForm when `readOnly` is set to `true`.
- Adjust the padding when the component is placed inside a `Card`.
- Introduce `perPageSizes` to control the available sizes of the items per page.
- Align media styles in table view with list view for consistency.

### Breaking Changes

- Fields with `Edit` defined or `type` will automatically be considered as filters unless `filterBy` is set to `false`.
- Add `renderItemLink` prop support in the `DataViews` component. It replaces `onClickItem`prop and allows integration with router libraries.

### Internal

- Adds new story that combines DataViews and DataForm.
- Add a story for each FieldTypeDefinition.

## 4.22.0 (2025-06-25)

## 4.21.0 (2025-06-04)

## 4.20.0 (2025-05-22)

## 4.19.0 (2025-05-07)

## 4.18.0 (2025-04-11)

## 4.17.0 (2025-03-27)

## 4.16.0 (2025-03-13)

## 4.15.0 (2025-02-28)

## 4.14.0 (2025-02-12)

## 4.13.0 (2025-01-29)

## 4.12.0 (2025-01-15)

## 4.11.0 (2025-01-02)

### Bug Fixes

-   Fixed commonjs export ([#67962](https://github.com/WordPress/gutenberg/pull/67962))

### Features

- Add support for hierarchical visualization of data. `DataViews` gets a new prop `getItemLevel` that should return the hierarchical level of the item. The view can use `view.showLevels` to display the levels. It's up to the consumer data source to prepare this information.

## 4.10.0 (2024-12-11)

### Breaking Changes

-   Support showing or hiding title, media and description fields ([#67477](https://github.com/WordPress/gutenberg/pull/67477)).
-   Unify the `title`, `media` and `description` fields for the different layouts. So instead of the previous `view.layout.mediaField`, `view.layout.primaryField` and `view.layout.columnFields`, all the layouts now support these three fields with the following config ([#67477](https://github.com/WordPress/gutenberg/pull/67477)):

```js
const view = {
	type: 'table',
	titleField: 'title',
	mediaField: 'media',
	descriptionField: 'description',
	fields: [ 'author', 'date' ],
};
```

### Internal

-   Upgraded `@ariakit/react` (v0.4.13) and `@ariakit/test` (v0.4.5) ([#65907](https://github.com/WordPress/gutenberg/pull/65907)).
-   Upgraded `@ariakit/react` (v0.4.15) and `@ariakit/test` (v0.4.7) ([#67404](https://github.com/WordPress/gutenberg/pull/67404)).

## 4.9.0 (2024-11-27)

### Bug Fixes

-   Fix focus loss when removing all filters or resetting ([#67003](https://github.com/WordPress/gutenberg/pull/67003)).

## 4.8.0 (2024-11-16)

## 4.7.0 (2024-10-30)

## 4.6.0 (2024-10-16)

-   Invert the logic for which icon to show in `DataViews` when using the filter view. Icons now match the action of the button label. ([#65914](https://github.com/WordPress/gutenberg/pull/65914)).

## 4.5.0 (2024-10-03)

## 4.4.0 (2024-09-19)

## 4.3.0 (2024-09-05)

## 4.2.0 (2024-08-21)

## New features

-   Support using a component for field headers or names by providing a `header` property in the field object. The string `label` property (or `id`) is still mandatory. ([#64642](https://github.com/WordPress/gutenberg/pull/64642)).

## Internal

-   The "move left/move right" controls in the table layout (popup displayed on cliking header) are always visible. ([#64646](https://github.com/WordPress/gutenberg/pull/64646)). Before this, its visibility depending on filters, enableSorting, and enableHiding.
-   Filters no longer display the elements' description. ([#64674](https://github.com/WordPress/gutenberg/pull/64674))

## Enhancements

-   Adjust layout of filter / actions row, increase width of search control when the container is narrower. ([#64681](https://github.com/WordPress/gutenberg/pull/64681)).

## 4.1.0 (2024-08-07)

## Internal

-   Upgraded `@ariakit/react` (v0.4.7) ([#64066](https://github.com/WordPress/gutenberg/pull/64066)).

## 4.0.0 (2024-07-24)

### Breaking Changes

-   `onSelectionChange` prop has been renamed to `onChangeSelection` and its argument has been updated to be a list of ids.
-   `setSelection` prop has been removed. Please use `onChangeSelection` instead.
-   `header` field property has been renamed to `label`.
-   `DataForm`'s `visibleFields` prop has been renamed to `fields`.
-   `DataForm`'s `onChange` prop has been update to receive as argument only the fields that have changed.

### New features

-   Support multiple layouts in `DataForm` component and introduce the `panel` layout.

## 3.0.0 (2024-07-10)

### Breaking Changes

-   Replace the `hiddenFields` property in the view prop of `DataViews` with a `fields` property that accepts an array of visible fields instead.
-   Replace the `supportedLayouts` prop in the `DataViews` component with a `defaultLayouts` prop that accepts an object whose keys are the layout names and values are the default view objects for these layouts.

### New features

-   Added a new `DataForm` component to render controls from a given configuration (fields, form), and data.

### Internal

-   Method style type signatures have been changed to function style ([#62718](https://github.com/WordPress/gutenberg/pull/62718)).

## 2.2.0 (2024-06-26)

## 2.1.0 (2024-06-15)

## 2.0.0 (2024-05-31)

### Breaking Changes

-   Legacy support for `in` and `notIn` operators introduced in 0.8 .0 has been removed and they no longer work. Please, convert them to `is` and `isNot` respectively.
-   Variables like `process.env.IS_GUTENBERG_PLUGIN` have been replaced by `globalThis.IS_GUTENBERG_PLUGIN`. Build systems using `process.env` should be updated ([#61486](https://github.com/WordPress/gutenberg/pull/61486)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

### Internal

-   Remove some unused dependencies ([#62010](https://github.com/WordPress/gutenberg/pull/62010)).

### Enhancements

-   `label` prop in Actions API can be either a `string` value or a `function`, in case we want to use information from the selected items. ([#61942](https://github.com/WordPress/gutenberg/pull/61942)).
-   Add `registry` argument to the callback of the actions API. ([#62505](https://github.com/WordPress/gutenberg/pull/62505)).

## 1.2.0 (2024-05-16)

### Internal

-   Replaced `classnames` package with the faster and smaller `clsx` package ([#61138](https://github.com/WordPress/gutenberg/pull/61138)).

## 1.1.0 (2024-05-02)

## 1.0.0 (2024-04-19)

### Breaking Changes

-   Removed the `onDetailsChange` event only available for the list layout. We are looking into adding actions to the list layout, including primary ones.

## 0.9.0 (2024-04-03)

### Enhancements

-   The `enumeration` type has been removed and we'll introduce new field types soon. The existing filters will still work as before given they checked for field.elements, which is still a condition filters should have.

## 0.8.0 (2024-03-21)

### Enhancements

-   Two new operators have been added: `isAll` and `isNotAll`. These are meant to represent `AND` operations. For example, `Category is all: Book, Review, Science Fiction` would represent all items that have all three categories selected.
-   DataViews now supports multi-selection. A new set of filter operators has been introduced: `is`, `isNot`, `isAny`, `isNone`. Single-selection operators are `is` and `isNot`, and multi-selection operators are `isAny` and `isNone`. If no operators are declared for a filter, it will support multi-selection. Additionally, the old filter operators `in` and `notIn` operators have been deprecated and will work as `is` and `isNot` respectively. Please, migrate to the new operators as they'll be removed soon.

### Breaking Changes

-   Removed the `getPaginationResults` and `sortByTextFields` utils and replaced them with a unique `filterSortAndPaginate` function.

## 0.7.0 (2024-03-06)

## 0.6.0 (2024-02-21)

## 0.5.0 (2024-02-09)

## 0.4.0 (2024-01-24)

## 0.3.0 (2024-01-10)

## 0.2.0 (2023-12-13)
