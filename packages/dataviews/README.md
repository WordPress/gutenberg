# The `@wordpress/dataviews` package

The DataViews package offers two React components and a few utilities to work with a list of data:

-   `DataViews`: to render the dataset using different types of layouts (table, grid, list) and interaction capabilities (search, filters, sorting, etc.).
-   `DataForm`: to edit the items of the dataset.

## Installation

Install the module

```bash
npm install @wordpress/dataviews --save
```

## `DataViews`

<div class="callout callout-info">At <a href="https://wordpress.github.io/gutenberg/">WordPress Gutenberg's Storybook</a> there's an <a href="https://wordpress.github.io/gutenberg/?path=/docs/dataviews-dataviews--docs">example implementation of the Dataviews component</a>.</div>

**Important note** If you're trying to use the `DataViews` component in a WordPress plugin or theme and you're building your scripts using the `@wordpress/scripts` package, you need to import the components from `@wordpress/dataviews/wp` instead of `@wordpress/dataviews`.

### Usage

The `DataViews` component receives data and some other configuration to render the dataset. It'll call the `onChangeView` callback every time the user has interacted with the dataset in some way (sorted, filtered, changed layout, etc.):

![DataViews flow](https://developer.wordpress.org/files/2024/09/368600071-20aa078f-7c3d-406d-8dd0-8b764addd22a.png 'DataViews flow')

Example:

```jsx
const Example = () => {
	const onChangeView = () => {
		/* React to user changes. */
	};

	return (
		<DataViews
			data={ data }
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
			defaultLayouts={ defaultLayouts }
			actions={ actions }
			paginationInfo={ paginationInfo }
		/>
	);
};
```

### Properties

#### `data`: `Object[]`

A one-dimensional array of objects.

Example:

```js
const data = [
	{
		id: 1,
		title: 'Title',
		author: 'Admin',
		date: '2012-04-23T18:25:43.511Z',
	},
	{
		/* ... */
	},
];
```

The data can come from anywhere, from a static JSON file to a dynamic source like a HTTP Request. It's the consumer's responsibility to query the data source appropriately and update the dataset based on the user's choices for sorting, filtering, etc.

Each record should have an `id` that identifies them uniquely. If they don't, the consumer should provide the `getItemId` property to `DataViews`: a function that returns an unique identifier for the record.

#### `getItemId`: `function`

A function that receives an item and returns a unique identifier for it.

It's optional. The field will get a default implementation by `DataViews` that returns the value of the `item[ id ]`.

Example:

```js
// Custom getItemId function.
{
	getItemId={ ( item ) => item.name ?? item.id }
}
```

#### `getItemLevel`: `function`

A function that receives an item and returns its hierarchical level. It's optional, but this property must be passed for DataViews to display the hierarchical levels of the data if `view.showLevels` is true.

Example:

```js
// Example implementation
{
	getItemLevel={ ( item ) => item.level }
}
```

#### `fields`: `Object[]`

The fields describe the visible items for each record in the dataset and how they behave (how to sort them, display them, etc.). See "Fields API" for a description of every property.

Example:

```js
const STATUSES = [
	{ value: 'draft', label: __( 'Draft' ) },
	{ value: 'future', label: __( 'Scheduled' ) },
	{ value: 'pending', label: __( 'Pending Review' ) },
	{ value: 'private', label: __( 'Private' ) },
	{ value: 'publish', label: __( 'Published' ) },
	{ value: 'trash', label: __( 'Trash' ) },
];
const fields = [
	{
		id: 'title',
		label: 'Title',
		enableHiding: false,
	},
	{
		id: 'date',
		label: 'Date',
		render: ( { item } ) => {
			return <time>{ getFormattedDate( item.date ) }</time>;
		},
	},
	{
		id: 'author',
		label: 'Author',
		render: ( { item } ) => {
			return <a href="...">{ item.author }</a>;
		},
		elements: [
			{ value: 1, label: 'Admin' },
			{ value: 2, label: 'User' },
		],
		filterBy: {
			operators: [ 'is', 'isNot' ],
		},
		enableSorting: false,
	},
	{
		id: 'status',
		label: 'Status',
		getValue: ( { item } ) =>
			STATUSES.find( ( { value } ) => value === item.status )?.label ??
			item.status,
		elements: STATUSES,
		filterBy: {
			operators: [ 'isAny' ],
		},
		enableSorting: false,
	},
];
```

#### `view`: `Object`

The view object configures how the dataset is visible to the user.

Example:

```js
const view = {
	type: 'table',
	search: '',
	filters: [
		{ field: 'author', operator: 'is', value: 2 },
		{ field: 'status', operator: 'isAny', value: [ 'publish', 'draft' ] },
	],
	page: 1,
	perPage: 5,
	sort: {
		field: 'date',
		direction: 'desc',
	},
	titleField: 'title',
	fields: [ 'author', 'status' ],
	layout: {},
};
```

Properties:

-   `type`: view type, one of `table`, `grid`, `list`. See "Layout types".
-   `search`: the text search applied to the dataset.
-   `filters`: the filters applied to the dataset. Each item describes:
    -   `field`: which field this filter is bound to.
    -   `operator`: which type of filter it is. See "Operator types".
    -   `value`: the actual value selected by the user.
    -   `isLocked`: whether the filter is locked (cannot be edited by the user).
-   `perPage`: number of records to show per page.
-   `page`: the page that is visible.
-   `sort`:

    -   `field`: the field used for sorting the dataset.
    -   `direction`: the direction to use for sorting, one of `asc` or `desc`.

-   `titleField`: The id of the field representing the title of the record.
-   `mediaField`: The id of the field representing the media of the record.
-   `descriptionField`: The id of the field representing the description of the record.
-   `showTitle`: Whether the title should be shown in the UI. `true` by default.
-   `showMedia`: Whether the media should be shown in the UI. `true` by default.
-   `showDescription`: Whether the description should be shown in the UI. `true` by default.
-   `showLevels`: Whether to display the hierarchical levels for the data. `false` by default. See related `getItemLevel` DataView prop.
-   `groupByField`: The id of the field used for grouping the dataset. Supported by the `grid` and `table` layouts.
-   `fields`: a list of remaining field `id` that are visible in the UI and the specific order in which they are displayed.
-   `layout`: config that is specific to a particular layout type.

##### Properties of `layout`

| Properties of `layout`                                                                      | Table | Grid | List |
| ------------------------------------------------------------------------------------------- | ----- | ---- | ---- |
| `badgeFields`: a list of field's `id` to render without label and styled as badges.         |       | ✓    |      |
| `styles`: additional `width`, `maxWidth`, `minWidth`, `align` styles for each field column. | ✓     |      |      |

**For column alignment (`align` property), follow these guidelines:**
Right-align whenever the cell value is fundamentally quantitative—numbers, decimals, currency, percentages—so that digits and decimal points line up, aiding comparison and calculation. Otherwise, default to left-alignment for all other types (text, codes, labels, dates).

#### `onChangeView`: `function`

Callback executed when the view has changed. It receives the new view object as a parameter.

The view is a representation of the visible state of the dataset: what type of layout is used to display it (table, grid, etc.), how the dataset is filtered, and how it is sorted or paginated. The consumer is responsible for using the view config to query the data provider and ensure the user decisions (sort, pagination, filters, etc.) are respected.

The following example shows how a view object is used to query the WordPress REST API via the entities abstraction. The same can be done with any other data provider.

```js
function MyCustomPageTable() {
	const [ view, setView ] = useState( {
		type: 'table',
		perPage: 5,
		page: 1,
		sort: {
			field: 'date',
			direction: 'desc',
		},
		search: '',
		filters: [
			{ field: 'author', operator: 'is', value: 2 },
			{
				field: 'status',
				operator: 'isAny',
				value: [ 'publish', 'draft' ],
			},
		],
		titleField: 'title',
		fields: [ 'author', 'status' ],
		layout: {},
	} );

	const queryArgs = useMemo( () => {
		const filters = {};
		view.filters.forEach( ( filter ) => {
			if ( filter.field === 'status' && filter.operator === 'isAny' ) {
				filters.status = filter.value;
			}
			if ( filter.field === 'author' && filter.operator === 'is' ) {
				filters.author = filter.value;
			}
		} );
		return {
			per_page: view.perPage,
			page: view.page,
			_embed: 'author',
			order: view.sort?.direction,
			orderby: view.sort?.field,
			search: view.search,
			...filters,
		};
	}, [ view ] );

	const { records } = useEntityRecords( 'postType', 'page', queryArgs );

	return (
		<DataViews
			data={ records }
			view={ view }
			onChangeView={ setView }
			// ...
		/>
	);
}
```

#### `actions`: `Object[]`

A list of actions that can be performed on the dataset. See "Actions API" for more details.

Example:

```js
const actions = [
	{
		id: 'view',
		label: 'View',
		isPrimary: true,
		icon: <Icon icon={ view } />,
		isEligible: ( item ) => item.status === 'published',
		callback: ( items ) => {
			console.log( 'Viewing item:', items[ 0 ] );
		},
	},
	{
		id: 'edit',
		label: 'Edit',
		icon: <Icon icon={ edit } />,
		supportsBulk: true,
		callback: ( items ) => {
			console.log( 'Editing items:', items );
		},
	},
	{
		id: 'delete',
		label: 'Delete',
		supportsBulk: true,
		RenderModal: ( { items, closeModal, onActionPerformed } ) => (
			<div>
				<p>Are you sure you want to delete { items.length } item(s)?</p>
				<Button
					variant="primary"
					onClick={ () => {
						console.log( 'Deleting items:', items );
						onActionPerformed();
						closeModal();
					} }
				>
					Confirm Delete
				</Button>
			</div>
		),
	},
];
```

#### `paginationInfo`: `Object`

-   `totalItems`: the total number of items in the datasets.
-   `totalPages`: the total number of pages, taking into account the total items in the dataset and the number of items per page provided by the user.

#### `search`: `boolean`

Whether the search input is enabled. `true` by default.

#### `searchLabel`: `string`

What text to show in the search input. "Search" by default.

#### `isLoading`: `boolean`

Whether the data is loading. `false` by default.

#### `defaultLayouts`: `Record< string, view >`

This property limits the available layout and provides layout information about active view types. If empty, this enables all layout types (see "Layout Types") with empty layout data.

For example, this is how you'd enable only the table and grid layout type and set whether those layouts show media by default:

```js
const defaultLayouts = {
	table: {
		showMedia: false,
	},
	grid: {
		showMedia: true,
	},
};
```

The `defaultLayouts` property should be an object that includes properties named `table`, `grid`, and/or `list`. These properties are applied to the view object each time the user switches to the corresponding layout.

#### `selection`: `string[]`

The list of selected items' ids.

If `selection` and `onChangeSelection` are provided, the `DataViews` component behaves like a controlled component. Otherwise, it behaves like an uncontrolled component.

Note: `DataViews` still requires at least one bulk action to make items selectable.

#### `onChangeSelection`: `function`

Callback that signals the user selected one of more items. It receives the list of selected items' IDs as a parameter.

If `selection` and `onChangeSelection` are provided, the `DataViews` component behaves like a controlled component. Otherwise, it behaves like an uncontrolled component.

Note: `DataViews` still requires at least one bulk action to make items selectable.

#### `isItemClickable`: `function`

A function that determines if a media field or a primary field is clickable. It receives an item as an argument and returns a boolean value indicating whether the item can be clicked.

#### `renderItemLink`: `React.ComponentType`

A render function used to render clickable items.

It can render regular links, but also allows integration with routing libraries (like TanStack Router or React Router).

The component receives the following props:

-   `item`: The data item that was clicked
-   Additional standard HTML anchor props (className, style, etc.)

```jsx
// Then use it in DataViews
<DataViews
	// ...other props
	renderItemLink={ ( { item, ...props } ) => (
		<Link to={ `/sites/${ item.slug }` } preload="intent" { ...props } />
	) }
/>
```

#### `header`: React component

React component to be rendered next to the view config button.

#### `config`: { perPageSizes: number[] }

Optional. Pass an object with a list of `perPageSizes` to control the available item counts per page (defaults to `[10, 20, 50, 100]`). `perPageSizes` needs to have a minimum of 2 items and a maximum of 6, otherwise the UI component won't be displayed.

#### `empty`: React node

An element to display when the `data` prop is empty. Defaults to `<p>No results</p>`.

### Composition modes

The `DataViews` component supports two composition modes:

-   **Controlled**: This is the default usage mode. `DataViews` renders a full layout out-of-the-box — including search, filters, view switcher, layout grid or table, actions, and pagination. It’s the simplest way to get started and requires minimal setup.

-   **Free composition**: This mode gives developers full control over the layout. You can compose your own UI using internal components — placing them exactly where they’re needed in your interface. This is useful for more advanced or custom layouts, while still relying on the same shared context for user interactions.

The component automatically detects the mode based on the `children` prop. If no `children` are passed, `DataViews` renders its internal layout (controlled mode). If `children` are provided, the component switches to free composition mode, skipping the default layout entirely.

In both modes, user interactions update the same `view` object and share the same behavior. Free composition components rely on context state and don’t require additional props to work, making them safe to use without extra boilerplate.

### Free composition

When you pass the `children` prop to the `DataViews` component, it enters free composition mode. In this mode, `DataViews` no longer renders its built-in layout — instead, it acts as a wrapper that provides access to internal state and shared behavior through context.

This allows you to build your own layout from scratch using the subcomponents exposed by `DataViews`. Each subcomponent automatically connects to the shared context, so you don't need to wire props manually. You can arrange these components however you want and combine them with your own custom elements.

This pattern enables full layout flexibility while keeping the data logic centralized.

The following components are available directly under `DataViews`:

-   `DataViews.Search`
-   `DataViews.FiltersToggle`
-   `DataViews.FiltersToggled`
-   `DataViews.Filters`
-   `DataViews.Layout`
-   `DataViews.LayoutSwitcher`
-   `DataViews.Pagination`
-   `DataViews.BulkActionToolbar`
-   `DataViews.ViewConfig`

#### example

```jsx
import DataViews from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

const CustomLayout = () => {
	// Declare data, fields, etc.

	return (
		<DataViews
			data={ data }
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
			paginationInfo={ paginationInfo }
			defaultLayouts={ { table: {} } }
		>
			<h1>{ __( 'Free composition' ) }</h1>
			<DataViews.Search />
			<DataViews.FiltersToggle />
			<DataViews.FiltersToggled />
			<DataViews.Layout />
			<DataViews.Pagination />
		</DataViews>
	);
};
```

> You can render only the pieces you need, rearrange them freely, or combine them with custom components.

### Accessibility considerations

All `DataViews` subcomponents are designed with accessibility in mind — including keyboard interactions, focus management, and semantic roles. Components like `Search`, `Pagination`, `FiltersToggle`, and `FiltersToggled` already handle these responsibilities internally and can be safely used in custom layouts.

When using free composition, developers are responsible for the outer structure of the layout.

Developers don't need to worry about the internal accessibility logic for individual features. The core behaviors — like search semantics, filter toggles, or pagination focus — are encapsulated.

`FiltersToggle` controls the visibility of the filters panel, and `Filters` renders the actual filters inside it. They work together and should always be used as a pair. While their internal behavior is accessible by default, how they’re positioned and grouped in custom layouts may affect the overall experience — especially for assistive technologies. Extra care is recommended.

## `DataViewsPicker`

<div class="callout callout-info">At <a href="https://wordpress.github.io/gutenberg/">WordPress Gutenberg's Storybook</a> there's an <a href="https://wordpress.github.io/gutenberg/?path=/docs/dataviews-dataviewspicker--docs">example implementation of the DataviewsPicker component</a>.</div>

### Usage

The `DataViewsPicker` component is very similar to the regular `DataViews` component, but is optimized for selection or picking of items.

The component behaves differently to a regular `DataViews` component in the following ways:

-   The items in the view are rendered using the `listbox` and `option` aria roles.
-   Holding the `ctrl` or `cmd` key isn't required for multi-selection of items. The entire item can be clicked to select or deselect it.
-   Individual items do not display any actions. All actions appear in the footer as text buttons.
-   Selection is maintained across multiple pages when the component is paginated.

There are also a few differences in the implementation:

-   Currently only the `pickerGrid` layout is supported for `DataViewsPicker`. This layout is very similar to the regular `grid` layout.
-   The picker component is used as a 'controlled' component, so `selection` and `onChangeSelection` should be provided as props. This is so that implementers can access the full range of selected items across pages.
-   An optional `itemListLabel` prop can be supplied to the `DataViewsPicker` component. This is added as an `aria-label` to the `listbox` element, and should be supplied if there's no heading element associated with the `DataViewsPicker` UI.
-   The `isItemClickable`, `renderItemLink` and `onClickItem` prop are unsupported for `DataViewsPicker`.
-   To implement a multi-selection picker, ensure all actions are declared with `supportsBulk: true`. For single selection use `supportsBulk: false`. When a mixture of bulk and non-bulk actions are provided, the component falls back to single selection.
-   Only the `callback` style of action is supported. `RenderModal` is unsupported.
-   The `isEligible` callback for actions is unsupported.
-   The `isPrimary` option for an action is used to render a `primary` variant of `Button` that can be used as a main call to action.

Example:

```jsx
const Example = () => {
	// When using DataViewsPicker, `selection` should be managed so that the component is 'controlled'.
	const [ selection, setSelection ] = useState( [] );

	// Both actions have `supportsBulk: true`, so the `DataViewsPicker` will allow multi-selection.
	const actions = [
		{
			id: 'confirm',
			label: 'Confirm',
			isPrimary: true,
			supportsBulk: true,
			callback() {
				window.alert( selection.join( ', ' ) );
			},
		},
		{
			id: 'cancel',
			label: 'Cancel',
			supportsBulk: true,
			callback() {
				setSelection( [] );
			},
		},
	];

	return (
		<DataViewsPicker
			actions={ actions }
			data={ data }
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
			defaultLayouts={ defaultLayouts }
			paginationInfo={ paginationInfo }
			selection={ selection }
			onChangeSelection={ setSelection }
		/>
	);
};
```

### Properties

## `DataForm`

<div class="callout callout-info">At <a href="https://wordpress.github.io/gutenberg/">WordPress Gutenberg's Storybook</a> there's and <a href="https://wordpress.github.io/gutenberg/?path=/docs/dataviews-dataform--docs">example implementation of the DataForm component</a>.</div>

### Usage

```jsx
const Example = () => {
	// Declare data, fields, etc.

	return (
		<DataForm
			data={ data }
			fields={ fields }
			form={ form }
			onChange={ onChange }
		/>
	);
};
```

### Properties

#### `data`: `Object`

A single item to be edited.

It can be thought of as a single record coming from the `data` property of `DataViews` — though it doesn't need to be. It can be totally separated or a mix of records if your app supports bulk editing.

#### `fields`: `Object[]`

The fields describe which parts of the data are visible and how they behave (how to edit them, validate them, etc.). See "Fields API" for a description of every property.

Example:

```js
const fields = [
	{
		id: 'title',
		type: 'text',
		label: 'Title',
	},
	{
		id: 'date',
		type: 'datetime',
		label: 'Date',
	},
	{
		id: 'author',
		type: 'text'
		label: 'Author',
		elements: [
			{ value: 1, label: 'Admin' },
			{ value: 2, label: 'User' },
		],
	},
];
```

#### `form`: `Object[]`

-   `layout`: an object describing the layout used to render the top-level fields present in `fields`. See `layout` prop in "Form Field API".
-   `fields`: a list of fields ids that should be rendered. Field ids can also be defined as an object and allow you to define a `layout`, `labelPosition` or `children` if displaying combined fields. See "Form Field API" for a description of every property.

Example:

```js
const form = {
	layout: {
		type: 'panel',
		labelPosition: 'side',
	},
	fields: [
		'title',
		'data',
		{
			id: 'status',
			label: 'Status & Visibility',
			children: [ 'status', 'password' ],
		},
		{
			id: 'featured_media',
			layout: 'regular',
		},
	],
};
```

#### `onChange`: `function`

Callback function that receives an object with the edits done by the user.

Example:

```js
const data = {
	id: 1,
	title: 'Title',
	author: 'Admin',
	date: '2012-04-23T18:25:43.511Z',
};

const onChange = ( edits ) => {
	/*
	 * edits will contain user edits.
	 * For example, if the user edited the title
	 * edits will be:
	 *
	 * {
	 *   title: 'New title'
	 * }
	 *
	 */
};

return (
	<DataForm
		data={ data }
		fields={ fields }
		form={ form }
		onChange={ onChange }
	/>
);
```

### validity

Object that determines the validation status of each field. There's a `useFormValidity` hook that can be used to create the validity object — see the utility below. This section documents the `validity` object in case you want to create it via other means.

The top-level props of the `validity` object are the field IDs. Fields declare their validity status for each of the validation rules supported: `required`, `elements`, `custom`. If a rule is valid, it should not be present in the object; if a field is valid for all the rules, it should not be present in the object either.

For example:

```json
{
  "title": {
    "required": {
      "type": "invalid"
    }
  },
  "author": {
    "elements": {
      "type": "invalid",
      "message": "Value must be one of the elements."
    }
  },
  "publisher": {
    "custom": {
      "type": "validating",
      "message": "Validating..."
    }
  },
  "isbn": {
    "custom": {
      "type": "valid",
      "message": "Valid."
    }
  }
}
```

Each rule, can have a `type` and a `message`.

The `message` is the text to be displayed in the UI controls. The message for the `required` rule is optional, and the built-in browser message will be used if not provided.

The `type` can be:

- `validating`: when the value is being validated (e.g., custom async rule)
- `invalid`: when the value is invalid according to the rule
- `valid`: when the value _became_ valid after having been invalid (e.g., custom async rule)

Note the `valid` status. This is useful for displaying a "Valid." message when the field transitions from invalid to valid.  The `useFormValidity` hook implements this only for the custom async validation.

## Utilities

### `filterSortAndPaginate`

Utility to apply the view config (filters, search, sorting, and pagination) to a dataset client-side.

Parameters:

-   `data`: the dataset, as described in the "data" property of DataViews.
-   `view`: the view config, as described in the "view" property of DataViews.
-   `fields`: the fields config, as described in the "fields" property of DataViews.

Returns an object containing:

-   `data`: the new dataset, with the view config applied.
-   `paginationInfo`: object containing the following properties:
    -   `totalItems`: total number of items for the current view config.
    -   `totalPages`: total number of pages for the current view config.

### `useFormValidity`

Hook to determine the form validation status.

Parameters:

-   `item`: the item being edited.
-   `fields`: the fields config, as described in the "fields" property of DataViews.
-   `form`: the form config, as described in the "form" property of DataViews.

Returns an object containing:

-   `isValid`: a boolean indicating if the form is valid.
-   `validity`: an object containing the errors. Each property is a field ID, containing a description of each error type. See `validity` prop for more info. For example:

```js
{
	fieldId: {
		required: {
			type: 'invalid',
			message: 'Required.' // Optional
		},
		elements: {
			type: 'invalid',
			message: 'Value must be one of the elements.' // Optional
		},
		custom: {
			type: 'validating',
			message: 'Validating...'
		}
	}
}
```

## Actions API

### `id`

The unique identifier of the action.

-   Type: `string`
-   Required
-   Example: `move-to-trash`

### `label`

The user facing description of the action.

-   Type: `string | function`
-   Required
-   Example:

```js
{
	label: Move to Trash
}
```

or

```js
{
	label: ( items ) => ( items.length > 1 ? 'Delete items' : 'Delete item' );
}
```

### `isPrimary`

Whether the action should be displayed inline (primary) or only displayed in the "More actions" menu (secondary).

-   Type: `boolean`
-   Optional

### `icon`

Icon to show for primary actions.

-   Type: SVG element
-   Required for primary actions, optional for secondary actions.

### `isEligible`

Function that determines whether the action can be performed for a given record.

-   Type: `function`
-   Optional. If not present, action is considered eligible for all items.
-   Example:

```js
{
	isEligible: ( item ) => item.status === 'published';
}
```

### `supportsBulk`

Whether the action can operate over multiple items at once.

-   Type: `boolean`
-   Optional
-   Default: `false`

### `disabled`

Whether the action is disabled.

-   Type: `boolean`
-   Optional
-   Default: `false`

### `context`

Where this action would be visible.

-   Type: `string`
-   Optional
-   One of: `list`, `single`

### `callback`

Function that performs the required action.

-   Type: `function`
-   Either `callback` or `RenderModal` must be provided. If `RenderModal` is provided, `callback` will be ignored
-   Example:

```js
{
	callback: ( items, { onActionPerformed } ) => {
		// Perform action.
		onActionPerformed?.( items );
	};
}
```

### `RenderModal`

Component to render UI in a modal for the action.

-   Type: `ReactElement`
-   Either `callback` or `RenderModal` must be provided. If `RenderModal` is provided, `callback` will be ignored.
-   Example:

```jsx
{
	RenderModal: ( { items, closeModal, onActionPerformed } ) => {
		const onSubmit = ( event ) => {
			event.preventDefault();
			// Perform action.
			closeModal?.();
			onActionPerformed?.( items );
		};
		return (
			<form onSubmit={ onSubmit }>
				<p>Modal UI</p>
				<HStack>
					<Button variant="tertiary" onClick={ closeModal }>
						Cancel
					</Button>
					<Button variant="primary" type="submit">
						Submit
					</Button>
				</HStack>
			</form>
		);
	};
}
```

### `hideModalHeader`

Controls visibility of the modal's header when using `RenderModal`.

-   Type: `boolean`
-   Optional
-   When false and using `RenderModal`, the action's label is used in modal header

### `modalHeader`

The header text to show in the modal.

-   Type: `string | (items: Item[]) => string`
-   Optional
-   If a function is provided, it receives the selected items as an argument and should return the header text

### `modalSize`

Specifies the size of the modal window when displaying action content using `RenderModal`.

-   Type: `string`
-   Optional
-   Default: `'medium'`
-   One of: `'small'`, `'medium'`, `'large'`, `'fill'`

Example:

```js
{
	modalSize: 'large';
}
```

### `modalFocusOnMount`

Specifies the focus on mount property of the modal.

-   Type: `boolean` | `string`
-   Optional
-   Default: `true`
-   One of: `true` | `false` | `'firstElement'` | `'firstContentElement'`

Example:

```js
{
	modalFocusOnMount: 'firstContentElement';
}
```

## Fields API

### `id`

The unique identifier of the field.

-   Type: `string`.
-   Required.

Example:

```js
{
	id: 'field_id';
}
```

### `type`

Field type. One of `text`, `integer`, `number`, `datetime`, `date`, `media`, `boolean`, `email`, `password`, `telephone`, `color`, `url`, `array`.

If a field declares a `type`, it gets default implementations for the `sort`, `isValid`, and `Edit` functions if no other values are specified.

-   Type: `string`.
-   Optional.

Example:

```js
{
	type: 'text';
}
```

### `label`

The field's name. This will be used across the UI.

-   Type: `string`.
-   Optional.
-   Defaults to the `id` value.

Example:

```js
{
	label: 'Title';
}
```

### `header`

React component used by the layouts to display the field name — useful to add icons, etc. It's complementary to the `label` property.

-   Type: React component.
-   Optional.
-   Defaults to the `label` value.
-   Props: none.
-   Returns a React element that represents the field's name.

Example:

```js
{
	header: () => {
		/* Returns a react element. */
	};
}
```

### `getValue` and `setValue`

These functions control how field values are read from and written to your data structure.

Both functions are optional and automatically generated from the field's `id` when not provided. The `id` is treated as a dot-notation path (e.g., `"user.profile.name"` accesses `item.user.profile.name`).

#### `getValue`

Function that extracts the field value from an item. This value is used to sort, filter, and display the field.

-   Type: `function`.
-   Optional.
-   Args:
    -   `item`: the data item to be processed.
-   Returns the field's value.

#### `setValue`

Function that creates a partial item object with updated field values. This is used by DataForm for editing operations and determines the structure of data passed to the `onChange` callback.

-   Type: `function`.
-   Optional.
-   Args:
    -   `item`: the current item being edited.
    -   `value`: the new value to be set for the field.
-   Returns a partial item object with the changes to be applied.

#### Simple field access

For basic field access, you only need to specify the field `id`. Both `getValue` and `setValue` are automatically generated:

```js
// Data structure
const item = {
	title: 'Hello World',
	author: 'John Doe'
};

// Field definition
{
	id: 'title',
	label: 'Title'
	// getValue: automatically becomes ( { item } ) => item.title
	// setValue: automatically becomes ( { value } ) => ( { title: value } )
}
```

#### Nested data access

Use dot notation in the field `id` to access nested properties:

```js
// Data structure
const item = {
	user: {
		profile: {
			name: 'John Doe',
			email: 'john@example.com'
		}
	}
};

// Field definition - using dot notation (automatic)
{
	id: 'user.profile.name',
	label: 'User Name'
	// getValue: automatically becomes ( { item } ) => item.user.profile.name
	// setValue: automatically becomes ( { value } ) => ( { user: { profile: { name: value } } } )
}

// Alternative - using simple ID with custom functions
{
	id: 'userName',
	label: 'User Name',
	getValue: ( { item } ) => item.user.profile.name,
	setValue: ( { value } ) => ( {
		user: {
			profile: { name: value }
		}
	} )
}
```

#### Custom data transformation

Provide custom `getValue` and `setValue` functions when you need to transform data between the storage format and display format:

```js
// Data structure
const item = {
	user: {
		preferences: {
			notifications: true
		}
	}
};

// Field definition - transform boolean to string options
{
	id: 'notifications',
	label: 'Notifications',
	Edit: 'radio',
	elements: [
		{ label: 'Enabled', value: 'enabled' },
		{ label: 'Disabled', value: 'disabled' }
	],
	getValue: ( { item } ) =>
		item.user.preferences.notifications === true ? 'enabled' : 'disabled',
	setValue: ( { value } ) => ( {
		user: {
			preferences: { notifications: value === 'enabled' }
		}
	} )
}
```

### `render`

React component that renders the field. This is used by the layouts.

-   Type: React component.
-   Optional.
-   Defaults to `getValue`.
-   Props
    -   `item` value to be processed.
    -   `config` object containing configuration options for the field. It's optional. So far, the only object property available is `sizes`: in fields that are set to be the media field, layouts can pass down the expected size reserved for them so that the field can react accordingly.
-   Returns a React element that represents the field's value.

Example:

```js
{
	render: ( { item } ) => {
		/* React element to be displayed. */
	};
}
```

### `Edit`

React component that renders the control to edit the field.

-   Type: React component | `string`. If it's a string, it needs to be one of `array`, `checkbox`, `color`, `datetime`, `date`, `email`, `telephone`, `url`, `integer`, `number`, `password`, `radio`, `select`, `text`, `toggle`, `textarea`, `toggleGroup`.
-   Required by DataForm. Optional if the field provided a `type`.
-   Props:
    -   `data`: the item to be processed
    -   `field`: the field definition
    -   `onChange`: the callback with the updates
    -   `hideLabelFromVision`: boolean representing if the label should be hidden
-   Returns a React element to edit the field's value.

Example:

```js
// A custom control defined by the field.
{
	Edit: ( { data, field, onChange, hideLabelFromVision } ) => {
		const value = field.getValue( { item: data } );

		return (
			<CustomTimePicker
				value={ value }
				onChange={ onChange }
				hideLabelFromVision
			/>
		);
	};
}
```

```js
// Use one of the core controls.
{
	Edit: 'radio';
}
```

```js
// Edit is optional when field's type is present.
// The field will use the default Edit function for text.
{
	type: 'text';
}
```

```js
// Edit can be provided even if field's type is present.
// The field will use its own custom control.
{
	type: 'text',
	Edit: 'radio'
}
```

### `sort`

Function to sort the records.

-   Type: `function`.
-   Optional.
-   Args
    -   `a`: the first item to compare
    -   `b`: the second item to compare
    -   `direction`: either `asc` (ascending) or `desc` (descending)
-   Returns a number where:
    -   a negative value indicates that `a` should come before `b`
    -   a positive value indicates that `a` should come after `b`
    -   0 indicates that `a` and `b` are considered equal

Example:

```js
// A custom sort function defined by the field.
{
	sort: ( a, b, direction ) => {
		return direction === 'asc'
			? a.localeCompare( b )
			: b.localeCompare( a );
	};
}
```

```js
// If field type is provided,
// the field gets a default sort function.
{
	type: 'number';
}
```

```js
// Even if a field type is provided,
// fields can override the default sort function assigned for that type.
{
	type: 'number';
	sort: ( a, b, direction ) => {
		/* Custom sort */
	};
}
```

### `isValid`

Object that contains the validation rules for the field. If a rule is not met, the control will be marked as invalid and a message will be displayed.

-   `required`: boolean indicating whether the field is required or not. Disabled by default.
-   `elements`: boolean restricting selection to the provided list of elements only. Enabled by default. The `array` Edit control uses it to restrict the input values as well.
-   `custom`: a function that validates a field's value. If the value is invalid, the function should return a string explaining why the value is invalid. Otherwise, the function must return null.

Example:

```js
{
	isValid: {
		custom: ( item: Item, field: NormalizedField<Item> ) => {
			if ( /* item value is invalid */) {
				return 'Reason why item value is invalid';
			}

			return null;
		}
	}
}
```

Note that fields that define a type (e.g., `integer`) come with default validation for the type. For example, the `integer` type if the value is a valid integer:

```js
{
	type: 'integer',
}
```

However, this can be overriden by the field author:

```js
{
	type: 'integer',
	isValid: {
		custom: ( item: Item, field: NormalizedField<Item> ) => {
			/* Your custom validation logic. */
		}
	}
}
```

Fields that define their own Edit component have access to the validation rules via the `field.isValid` object:

```js
{
	Edit: ( { field } ) => {
		return <input required={ !! field.isValid.required } />;
	};
}
```

### `isVisible`

Function that indicates if the field should be visible.

-   Type: `function`.
-   Optional.
-   Args
    -   `item`: the data to be processed
-   Returns a `boolean` indicating if the field should be visible (`true`) or not (`false`).

Example:

```js
// Custom isVisible function.
{
	isVisible: ( item ) => {
		/* Custom implementation. */
	};
}
```

### `enableSorting`

Boolean indicating if the field is sortable.

-   Type: `boolean`.
-   Optional.
-   Defaults to `true`.

Example:

```js
{
	enableSorting: true;
}
```

### `enableHiding`

Boolean indicating if the field can be hidden.

-   Type: `boolean`.
-   Optional.
-   Defaults to `true`.

Example:

```js
{
	enableHiding: true;
}
```

### `enableGlobalSearch`

Boolean indicating if the field is searchable.

-   Type: `boolean`.
-   Optional.
-   Defaults to `false`.

Example:

```js
{
	enableGlobalSearch: true;
}
```

### `elements`

List of valid values for a field. If provided, the field's filter will use these as predefined options instead of using the field's `Edit` function for user input (unless `filterBy` is set to `false`, see below).

-   Type: `array` of objects.
-   Optional.
-   Each object can have the following properties:
    -   `value`: the value to match against the field's value. (Required)
    -   `label`: the name to display to users. (Required)
    -   `description`: optional, a longer description of the item.

Example:

```js
{
	elements: [
		{ value: '1', label: 'Product A' },
		{ value: '2', label: 'Product B' },
		{ value: '3', label: 'Product C' },
		{ value: '4', label: 'Product D' },
	];
}
```


### `filterBy`

Configuration of the filters. By default, fields have filtering enabled using the field's `Edit` function for user input. When `elements` are provided, the filter will use those as predefined options instead. Set to `false` to opt the field out of filtering entirely.

-   Type: `object` | `boolean`.
-   Optional.
-   If `false`, the field will not be available for filtering.
-   If an object, it can have the following properties:
    -   `operators`: the list of operators supported by the field. See "operators" below. A filter will support the `isAny` and `isNone` multi-selection operators by default.
    -   `isPrimary`: boolean, optional. Indicates if the filter is primary. A primary filter is always visible and is not listed in the "Add filter" component, except for the list layout where it behaves like a secondary filter.

Operators:

| Operator             | Selection      | Description                                                                                          | Example                                            |
| -------------------- | -------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `is`                 | Single item    | `EQUAL TO`. The item's field is equal to a single value.                                             | Author is Admin                                    |
| `isNot`              | Single item    | `NOT EQUAL TO`. The item's field is not equal to a single value.                                     | Author is not Admin                                |
| `isAny`              | Multiple items | `OR`. The item's field is present in a list of values.                                               | Author is any: Admin, Editor                       |
| `isNone`             | Multiple items | `NOT OR`. The item's field is not present in a list of values.                                       | Author is none: Admin, Editor                      |
| `isAll`              | Multiple items | `AND`. The item's field has all of the values in the list.                                           | Category is all: Book, Review, Science Fiction     |
| `isNotAll`           | Multiple items | `NOT AND`. The item's field doesn't have all of the values in the list.                              | Category is not all: Book, Review, Science Fiction |
| `lessThan`           | Single item    | `LESS THAN`. The item's field is numerically less than a single value.                               | Age is less than 18                                |
| `greaterThan`        | Single item    | `GREATER THAN`. The item's field is numerically greater than a single value.                         | Age is greater than 65                             |
| `lessThanOrEqual`    | Single item    | `LESS THAN OR EQUAL TO`. The item's field is numerically less than or equal to a single value.       | Age is less than or equal to 18                    |
| `greaterThanOrEqual` | Single item    | `GREATER THAN OR EQUAL TO`. The item's field is numerically greater than or equal to a single value. | Age is greater than or equal to 65                 |
| `contains`           | Text           | `CONTAINS`. The item's field contains the given substring.                                           | Title contains: Mars                               |
| `notContains`        | Text           | `NOT CONTAINS`. The item's field does not contain the given substring.                               | Description doesn't contain: photo                 |
| `startsWith`         | Text           | `STARTS WITH`. The item's field starts with the given substring.                                     | Title starts with: Mar                             |
| `on`                 | Date           | `ON`. The item's field is on a given date (date equality using proper date parsing).                 | Date is on: 2024-01-01                             |
| `notOn`              | Date           | `NOT ON`. The item's field is not on a given date (date inequality using proper date parsing).       | Date is not on: 2024-01-01                         |
| `before`             | Date           | `BEFORE`. The item's field is before a given date.                                                   | Date is before 2024-01-01                          |
| `after`              | Date           | `AFTER`. The item's field is after a given date.                                                     | Date is after 2024-01-01                           |
| `beforeInc`          | Date           | `BEFORE (Inc)`. The item's field is before a given date, including the date.                         | Date is before 2024-01-01, including 2024-01-01    |
| `afterInc`           | Date           | `AFTER (Inc)`. The item's field is after a given date, including the date.                           | Date is after 2024-01-01, including 2024-01-01     |
| `inThePast`          | Date           | `IN THE PAST`. The item's field is within the last N units (days, weeks, months, or years) from now. | Orders placed in the past 7 days                   |
| `over`               | Date           | `OVER`. The item's field is older than N units (days, weeks, months, or years) from now.             | Orders placed over 7 days ago                      |
| `between`            | Multiple items | `BETWEEN`. The item's field is between two values.                                                   | Item count between (inc): 10-180                   |

`is`, `isNot`, `on`, `notOn`, `lessThan`, `greaterThan`, `lessThanOrEqual`, `greaterThanOrEqual`, `before`, `after`, `beforeInc`, `afterInc`, `contains`, `notContains`, and `startsWith` are single-selection operators, while `isAny`, `isNone`, `isAll`, and `isNotAll` are multi-selection. `between` is a special operator that requires two values and it's not supported for preset layout. A filter with no operators declared will support the `isAny` and `isNone` multi-selection operators by default. A filter cannot mix single-selection & multi-selection operators; if a single-selection operator is present in the list of valid operators, the multi-selection ones will be discarded, and the filter won't allow selecting more than one item.

Example:

```js
// Set a filter as primary.
{
	filterBy: {
		isPrimary: true;
	}
}
```

```js
// Configure a filter as single-selection.
{
	filterBy: {
		operators: [ `is`, `isNot` ];
	}
}
```

```js
// Configure a filter as multi-selection with all the options.
{
	filterBy: {
		operators: [ `isAny`, `isNone`, `isAll`, `isNotAll` ];
	}
}
```

```js
// Opt out of filtering entirely.
{
	filterBy: false;
}
```

## Form Field API

### `id`

The unique identifier of the field.

-   Type: `string`.
-   Required.

Example:

```js
{
	id: 'field_id';
}
```

### `layout`

Represents the type of layout used to render the field. It'll be one of Regular, Panel, Card, or Row. This prop is the same as the `form.layout` prop.

#### Regular

-   `type`: `regular`. Required.
-   `labelPosition`: one of `side`, `top`, or `none`. Optional. `top` by default.

For example:

```js
{
	id: 'field_id',
	layout: {
		type: 'regular',
		labelPosition: 'side'
	},
}
```

#### Panel

- `type`: `panel`. Required.
- `labelPosition`: one of `side`, `top`, or `none`. Optional. `top` by default.
- `summary`: Summary field configuration. Optional. Specifies which field(s) to display in the panel header. Can be:
   	- A string (single field ID)
    - An array of strings (multiple field IDs)

When no summary fields are explicitly configured, the panel automatically determines which fields to display using this priority:

1. Use `summary` fields if they exist
2. Fall back to the field definition that matches the form field's id
3. If the form field id doesn't exist, pick the first child field
4. If no field definition is found, return empty summary fields

For example:
```js
{
	id: 'field_id',
	layout: {
		type: 'panel',
		labelPosition: 'top'
	},
}
```

#### Card

-   `type`: `card`. Required.
-   `isOpened`: boolean. Optional. `true` by default.
-   `withHeader`: boolean. Optional. `true` by default.
-   `summary`: Summary field configuration. Optional. Specifies which field(s) to display in the card header. Can be:
    -   A string (single field ID)
    -   An array of strings (multiple field IDs)
    -   An array of objects for per-field visibility control `[{ id: string, visibility: 'always' | 'when-collapsed' }]`

Cards can be collapsed while visible, so you can control when summary fields appear:

-   `'always'`: Show the field in both expanded and collapsed states.
-   `'when-collapsed'`: Show the field only when the card is collapsed. This is the default.

For example:

```js
{
	id: 'field_id',
	layout: {
		type: 'card',
		isOpened: false,
		withHeader: true,
	},
}
```

#### Row

-   `type`: `row`. Required.
-   `alignment`: one of `start`, `center`, or `end`. Optional. `center` by default.

The Row layout displays fields horizontally in a single row. It's particularly useful for grouping related fields that should be displayed side by side. This layout can be used both as a top-level form layout and for individual field groups.

For example:

```js
{
	id: 'field_id',
	layout: {
		type: 'row',
		alignment: 'start'
	},
}
```

### `label`

The label used when displaying a combined field, this requires the use of `children` as well.

-   Type: `string`.

Example:

```js
{
	id: 'field_id',
	label: 'Combined Field',
	children: [ 'field1', 'field2' ]
}
```

### `children`

Groups a set of fields defined within children. For example if you want to display multiple fields within the Panel dropdown you can use children ( see example ).

-   Type: `Array< string | FormField >`.

Example:

```js
{
	id: 'status',
	layout: {
		type: 'panel',
	},
	label: 'Combined Field',
	children: [ 'field1', 'field2' ],
}
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
