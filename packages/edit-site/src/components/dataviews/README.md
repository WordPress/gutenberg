# DataView

This file aims to document the main APIs related to the DataView component.

## View

The view is responsible for configuring how the dataset is visible to the user. For example:

```js
{
	type: 'list',
	page: 1,
	perPage: 5,
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

- `type`: one of `list` or `grid`.
- `page`: the current page.
- `perPage`: number of records per page.
- `sort.field`: field used for sorting.
- `sort.direction`: one of `asc` or `desc`.
- `filters`: the filters applied to the dataset.
- `visibleFilters`: the `id` of the filters that are visible in the UI.
- `hiddenFields`: the `id` of the fields that are hidden in the UI.
- `layout`: ...

The view configuration is used to retrieve the corresponding entity that holds the dataset:

```js
const {
	records: pages,
	isLoading: isLoadingPages,
	totalItems,
	totalPages
} = useEntityRecords( 'postType', 'page', {
	per_page: view.perPage,
	page: view.page,
	order: view.sort?.direction,
	orderby: view.sort?.field
	...view.filters
} );
```

## Fields

The fields describe the dataset. For example:

```js
[
	{
		id: 'author',
		header: __( 'Author' ),
		getValue: ( { item } ) => item.author,
		render: ( {item} ) => {
			return (
				<a href="...">{ item.author }</a>
			);
		},
		elements: [
			{ value: 1, label: 'Admin' }
			{ value: 2, label: 'User' }
		]
		filters: [
			'enumeration',
			{ id: 'author_search', type: 'search', name: __( 'Search by author' ) }
		],
	},
]
```

- `id`: identifier for the field. Unique.
- `header`: the field name for the UI.
- `getValue`: function that returns the value of the field.
- `render`: function that renders the field.
- `elements`: a set of valid values for the field.
- `filters`: what filters are available for the user to use. A filter contains the following properties:
	- `id`: unique identifier for the filter. Matches the entity query param. If not provided, the field's `id` is used.
	- `name`: nice looking name for the filter. If not provided, the field's `header` is used.
	- `type`: the type of filter. One of `search` or `enumeration`.
	- `resetLabel`: the label for the reset option of the filter. If none provided, `All` is used.
	- `resetValue`: the value for the reset option of the filter. If none provedid, `''` is used.

## DataViews

The UI component responsible for rendering the dataset.

```js
<DataViews
	data={ pages }
	isLoading= { isLoadingPages }
	fields={ fields }
	view={ view }
	onChangeView={ onChangeView }
	actions={ [ trashPostAction ] }
	paginationInfo={ { totalItems, totalPages } }
/>
```
