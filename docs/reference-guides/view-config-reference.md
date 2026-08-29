# View Configuration Reference

DataViews-powered admin screens (such as the Site Editor's Pages, Templates, Template Parts, and Patterns screens) load their configuration from the server: what layout the screen uses by default, which fields are visible, the preconfigured views offered in the sidebar, and the fields of the Quick Edit form.

The configuration is built per entity — identified by its kind (e.g. `postType`) and name (e.g. `page`) — and can be customized through the dynamic `get_entity_view_config_{$kind}_{$name}` filter, where the dynamic portions are lowercased: the `postType`/`page` entity maps to the `get_entity_view_config_posttype_page` filter. The editor retrieves the result through the `/wp/v2/view-config?kind={kind}&name={name}` REST API endpoint.

Related docs:

- [Server-side view configuration filter](/docs/how-to-guides/curating-the-editor-experience/filters-and-hooks.md#server-side-view-configuration-filter): how to customize the configuration via the `get_entity_view_config_{$kind}_{$name}` filter and its methods (`merge`, `remove`, `replace`, `set`).
- [@wordpress/dataviews](/packages/dataviews/README.md) package.
- Storybook:
    - [DataViews](https://wordpress.github.io/gutenberg/?path=/docs/dataviews-dataviews--docs)
    - [DataViewsPicker](https://wordpress.github.io/gutenberg/?path=/docs/dataviews-dataviewspicker--docs)
    - [DataForm](https://wordpress.github.io/gutenberg/?path=/docs/dataviews-dataform--docs)
    - [Field types](https://wordpress.github.io/gutenberg/?path=/docs/dataviews-fieldtypes--docs)

This section lists the properties of the view configuration. It has four top-level keys:

- [`default_view`](#default_view): the view applied when the user has not made any changes.
- [`default_layouts`](#default_layouts): the layout types available to the user, and the view overrides each one applies.
- [`view_list`](#view_list): the preconfigured views displayed in the screen's sidebar.
- [`form`](#form): the fields of the Quick Edit form.

## default_view

> The view object is the same structure the [DataViews component](/packages/dataviews/README.md#view-object) consumes; see its documentation for the complete list of view properties and filter operators. There are two properties from the DataViews API that cannot be configured via the server filter: `search` and `page`. These are URL-managed that are set by the editor when the user searches or paginates.

The default DataViews configuration for the screen: layout type, visible fields, sorting, filtering, and pagination. It is the view users see before they customize anything.

| Property | Description | Type |
| -------- | ----------- | ---- |
| type | The layout type, one of `table`, `grid`, `list`, or `activity`. | `string` |
| fields | Ids of the fields that are visible, in display order. | `[ string ]` |
| titleField | Id of the field used as the record title. | `string` |
| mediaField | Id of the field used as the record media (e.g. featured image or preview). | `string` |
| descriptionField | Id of the field used as the record description. | `string` |
| showTitle | Whether the title is shown. Defaults to `true`. | `boolean` |
| showMedia | Whether the media is shown. Defaults to `true`. | `boolean` |
| showDescription | Whether the description is shown. Defaults to `true`. | `boolean` |
| showLevels | Whether to display hierarchical levels for the records (e.g. child pages indented under their parent). Defaults to `false`. | `boolean` |
| sort | The default sort: the field id and the direction (`asc` or `desc`). | `{ field, direction }` |
| filters | Filters applied to the dataset. A filter with `isLocked` set cannot be removed by the user. | `[ { field, operator, value, isLocked } ]` |
| perPage | Number of records per page. | `integer` |
| layout | Configuration specific to the selected layout type. See [`default_layouts`](#default_layouts). | `object` |

## default_layouts

The layout types the user can switch between. Each key is a layout type (`table`, `grid`, `list`, `activity`); a type that is not present is not offered in the UI. Each value is a partial view configuration applied when the user switches to that layout type — an empty array means the type is available with no overrides.

| Property | Description | Type |
| -------- | ----------- | ---- |
| table | View overrides applied when the table layout is selected. | `object` |
| grid | View overrides applied when the grid layout is selected. | `object` |
| list | View overrides applied when the list layout is selected. | `object` |

Common overrides are `layout` (layout-specific configuration, such as per-field column `styles` for tables or `badgeFields` for grids) and view properties like `showMedia`:

```php
$default_layouts = array(
	'table' => array(
		'showMedia' => false,
		'layout'    => array(
			'styles' => array(
				'author' => array( 'width' => '1%' ),
			),
		),
	),
	'grid'  => array(
		'showMedia' => true,
		'layout'    => array(
			'badgeFields' => array( 'sync-status' ),
		),
	),
);
```

## view_list

The preconfigured views displayed in the screen's sidebar (e.g. "All pages", "Published", "Drafts"). Each entry is:

| Property | Description | Type |
| -------- | ----------- | ---- |
| title | Title of the view, displayed in the sidebar. | `string` |
| slug | Unique identifier for the view. Used as the member identity when merging patches. | `string` |
| view | Partial view configuration applied on top of `default_view` when the view is selected — typically locked `filters`, but any view property works. Optional. | `object` |

```php
$view_list = array(
	array(
		'title' => __( 'All pages' ),
		'slug'  => 'all',
	),
	array(
		'title' => __( 'Drafts' ),
		'slug'  => 'drafts',
		'view'  => array(
			'filters' => array(
				array(
					'field'    => 'status',
					'operator' => 'isAny',
					'value'    => 'draft',
					'isLocked' => true,
				),
			),
		),
	),
);
```

## form

> The form structure is shared with the [DataForm component](/packages/dataviews/README.md#form-object); see its documentation for the complete Form Field API, including the additional options of each layout type.

The DataForm configuration for the Quick Edit form: which fields are displayed, in which order, and how each one is laid out.

| Property | Description | Type |
| -------- | ----------- | ---- |
| layout | The default layout for the form fields, e.g. `{ 'type' => 'panel' }`. | `{ type }` |
| fields | The fields of the form, in display order. Each entry is a field id, or an object for further configuration (see below). | `[ string \| object ]` |

A field declared as an object accepts:

| Property | Description | Type |
| -------- | ----------- | ---- |
| id | Id of the field. Used as the member identity when merging patches. | `string` |
| label | Label displayed for the field, overriding the field's own. | `string` |
| layout | How the field is rendered: `type` is one of `regular`, `panel`, `card`, or `row`, and `labelPosition` is one of `side`, `top`, or `none`. | `{ type, labelPosition }` |
| children | Fields combined under this entry, following the same shape as `fields`. | `[ string \| object ]` |

Only registered fields are rendered: a form entry whose field is not registered for the entity is dropped by the editor.

```php
$form = array(
	'layout' => array( 'type' => 'panel' ),
	'fields' => array(
		array(
			'id'     => 'featured_media',
			'layout' => array(
				'type'          => 'regular',
				'labelPosition' => 'none',
			),
		),
		array(
			'id'       => 'status',
			'label'    => __( 'Status' ),
			'children' => array( 'status', 'password', 'sticky' ),
		),
		'date',
		'author',
	),
);
```
