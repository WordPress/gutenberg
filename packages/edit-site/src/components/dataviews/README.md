# DataView

This file documents the DataViews UI component, which provides an API to render datasets using different view types (table, grid, etc.).

```js
<DataViews
	data={ pages }
	isLoading= { isLoadingPages }
	view={ view }
	onChangeView={ onChangeView }
	fields={ fields }
	filters={ filters }
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
	filters: {
		search: '',
		author: 2,
		status: 'publish, draft'
	},
	visibleFilters: [ 'search', 'author', 'status' ],
	hiddenFields: [ 'date', 'featured-image' ],
	layout: {},
}
```

- `type`: view type, one of `list` or `grid`.
- `perPage`: number of records to show per page.
- `page`: the page that is visible.
- `sort.field`: field used for sorting the dataset.
- `sort.direction`: the direction to use for sorting, one of `asc` or `desc`.
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

	const queryArgs = useMemo(
		() => ( {
			per_page: view.perPage,
			page: view.page,
			order: view.sort?.direction,
			orderby: view.sort?.field
			...view.filters
		} ),
		[ view ]
	);

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
		filters: [
			'enumeration'
			{ id: 'author_search', type: 'search', name: __( 'Search by author' ) }
		],
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

Filters describe the conditions a record should match to be listed as part of the dataset.

Filters can be provided globally, as a property of the `DataViews` component, or per field, should they be considered part of a fields' description.

```js
const field = [
	{
		id: 'author',
		filters: [
			'enumeration'
			{ id: 'author_search', type: 'search', name: __( 'Search by author' ) }
		],
	}
];

<DataViews
	fields={ fields }
	filters={ [
		{ id: 'search', type: 'search', name: __( 'Filter list' ) }
	] }
/>
```

A filter is an object that may contain the following properties:

- `id`: unique identifier for the filter. Matches the entity query param. Field filters may omit it, in which case the field's `id` will be used.
- `name`: nice looking name for the filter. Field filters may omit it, in which case the field's `header` will be used.
- `type`: the type of filter. One of `search` or `enumeration`.
- `elements`: for filters of type `enumeration`, the list of options to show. A one-dimensional array of object with value/label keys, as in `[ { value: 1, label: "Value name" } ]`.
	- `value`: what's serialized into the view's filters.
	- `label`: nice-looking name for users.
- `resetValue`: for filters of type `enumeration`, this is the value for the reset option. If none is provided, `''` will be used.
- `resetLabel`: for filters of type `enumeration`, this is the label for the reset option. If none is provided, `All` will be used.

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
			{ id: 'author', type: 'enumeration' },
			{ id: 'author', type: 'enumeration', name: __( 'Author' ) },
			{ id: 'author', type: 'enumeration', name: __( 'Author' ), elements: authors },
		],
	}
];
```
