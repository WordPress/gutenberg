# DataView

This file documents the DataViews UI component, which provides an API to render datasets using different view types (table, grid, etc.).

```js
<DataViews
	data={ pages }
	isLoading= { isLoadingPages }
	view={ view }
	onChangeView={ onChangeView }
	fields={ fields }
	actions={ [ trashPostAction ] }
	paginationInfo={ { totalItems, totalPages } }
/>
```

## Data

The dataset to work with, represented as a one-dimensional array. 

Example:

```js
[
	{ id: 1, title: "Title", ... },
	{ ... }
]
```

## View

The view object configures how the dataset is visible to the user.

Example:

```js
{
	type: 'list',
	perPage: 5,
	page: 1,
	sort: {
		field: 'date',
		direction: 'desc',
	},
	search: '',
	filters: [
		{ field: 'author', operator: 'in', value: 2 },
		{ field: 'status', operator: 'in', value: 'publish,draft' }
	],
	visibleFilters: [ 'author', 'status' ],
	hiddenFields: [ 'date', 'featured-image' ],
	layout: {},
}
```

- `type`: view type, one of `list` or `grid`.
- `perPage`: number of records to show per page.
- `page`: the page that is visible.
- `sort.field`: field used for sorting the dataset.
- `sort.direction`: the direction to use for sorting, one of `asc` or `desc`.
- `search`: the text search applied to the dataset.
- `filters`: the filters applied to the dataset. See filters section.
- `visibleFilters`: the `id` of the filters that are visible in the UI.
- `hiddenFields`: the `id` of the fields that are hidden in the UI.
- `layout`: ...

Note that it's the consumer's responsibility to provide the data and make sure the dataset corresponds to the view's config (sort, pagination, filters, etc.).

Example:

```js
function MyCustomPageList() { 
	const [ view, setView ] = useState( {
		type: 'list',
		page: 1,
		"...": "..."
	} );

	const queryArgs = useMemo( () => {
		const filters = {};
		view.filters.forEach( ( filter ) => {
			if ( filter.field === 'status' && filter.operator === 'in' ) {
				filters.status = filter.value;
			}
			if ( filter.field === 'author' && filter.operator === 'in' ) {
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

	const {
		records
	} = useEntityRecords( 'postType', 'page', queryArgs );

	return (
		<DataViews
			data={ records }
			view={ view }
			onChangeView={ setView }
			"..."
		/>
	);
}
```

## Fields

The fields describe the visible items for each record in the dataset.

Example:

```js
[
	{
		id: 'date',
		header: __( 'Date' ),
		getValue: ( { item } ) => item.date,
		render: ( { item } ) => {
			return (
				<time>{ getFormattedDate( item.date ) }</time>
			);
		}
	},
	{
		id: 'author',
		header: __( 'Author' ),
		getValue: ( { item } ) => item.author,
		render: ( { item } ) => {
			return (
				<a href="...">{ item.author }</a>
			);
		},
		elements: [
			{ value: 1, label: 'Admin' }
			{ value: 2, label: 'User' }
		]
		filters: [ 'enumeration' ],
	}
]
```

- `id`: identifier for the field. Unique.
- `header`: the field's name to be shown in the UI.
- `getValue`: function that returns the value of the field.
- `render`: function that renders the field.
- `elements`: the set of valid values for the field's value.
- `filters`: what filters are available for the user to use. See filters section.

## Filters

Filters describe the conditions a record should match to be listed as part of the dataset. Filters are provided per field.

```js
const field = [
	{
		id: 'author',
		filters: [ 'enumeration' ],
	}
];

<DataViews
	fields={ fields }
/>
```

A filter is an object that may contain the following properties:

- `type`: the type of filter. Only `enumeration` is supported at the moment.
- `elements`: for filters of type `enumeration`, the list of options to show. A one-dimensional array of object with value/label keys, as in `[ { value: 1, label: "Value name" } ]`.
	- `value`: what's serialized into the view's filters.
	- `label`: nice-looking name for users.

As a convenience, field's filter can provide abbreviated versions for the filter. All of following examples result in the same filter:

```js
const field = [
	{
		id: 'author',
		header: __( 'Author' ),
		elements: authors,
		filters: [
			'enumeration',
			{ type: 'enumeration' },
			{ type: 'enumeration', elements: authors },
		],
	}
];
```
