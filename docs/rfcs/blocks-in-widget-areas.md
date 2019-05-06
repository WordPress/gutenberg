# Blocks in Widget Areas RFC

This RFC outlines the technical approach that we will take to upgrade the widget-editing areas in `wp-admin/widgets.php` and the Customizer to support blocks.

Adding blocks to widget-editing areas was first announced at WCUS 2018, is a [Gutenberg Phase 2][phase-2] project, and appears in Matt's list of [9 Projects for 2019][2019-projects].

![widgets](https://user-images.githubusercontent.com/1202812/51921660-d4ef0e00-23b5-11e9-86c9-5cb25c224d0b.gif)

[phase-2]: https://github.com/WordPress/gutenberg/issues/13113
[2019-projects]: https://make.wordpress.org/core/2018/12/08/9-priorities-for-2019/

## Requirements

- Editing blocks in `wp-admin/widgets.php` and the `wp-admin/customize.php` should use the same block editor that `wp-admin/post-new.php` uses.
- The block editor should read and update blocks in widget-editing areas via the REST API.
- Upgrading WordPress must not affect the appearance of the user's site, or any of their existing widgets.
- Existing Core and third-party widgets must remain functional in the new block-based interface.
- Backwards compatibility must be maintained. That is, themes and plugins that use public widget APIs must remain functional.
- During a transition period, it should be possible to disable the block-based interface and return to the classic widget-editing interface.

## Terminology

A _widget_ is an element in a WordPress site that displays some content. Widgets generally display the same content regardless of what post or page the user is viewing.

A _widget area_ is an area in a WordPress site where widgets can be placed. The active theme defines how many widget areas there are, where they appear, and what they are called.

Regular widgets can only be placed **once** into a widget area. A _multi widget_, however, can be placed several times into a widget area. When a multi widget is used several times, each usage is called an _instance_.

Because many WordPress themes place widgets into a sidebar column, widget areas are often referred to as _sidebars_ or _dynamic sidebars_.

**For more terminology and a detailed overview of how widgets _currently_ work in WordPress, see [#14182][14182].**

[14182]: https://github.com/WordPress/gutenberg/issues/14182

## Prior reading

- [GB14182][] is the issue which tracks adding an API for reading and updating blocks in widget areas.
- [GB13204][] contains design discussion about showing blocks in `wp-admin/widgets.php`.
- [GB13205][] contains design discussion about showing blocks in the Customizer.
- [GB13511][] is a PR which added support for rendering existing widgets as a block in Gutenberg.
- [WP41683][] discusses adding a Widgets REST API endpoint.
- [WP33507][] discusses allowing widgets to be JavaScript-driven. 
- [WP35574][] discusses adding REST API JSON schema information to `WP_Widget`.
- [WP35669][] discusses storing widgets in a custom post type.

[GB14182]: https://github.com/WordPress/gutenberg/issues/14182
[GB13204]: https://github.com/WordPress/gutenberg/issues/13204
[GB13205]: https://github.com/WordPress/gutenberg/issues/13205
[GB13511]: https://github.com/WordPress/gutenberg/issues/13511
[WP41683]: https://core.trac.wordpress.org/ticket/41683
[WP33507]: https://core.trac.wordpress.org/ticket/33507
[WP35574]: https://core.trac.wordpress.org/ticket/35574
[WP35669]: https://core.trac.wordpress.org/ticket/35669

## Frontend

A new `@wordpress/edit-widgets` package contains the UI for the `wp-admin/widgets.php` screen. This is analogous to how `@wordpress/edit-post` contains the UI for `wp-admin/post-new.php`. 

Both WP Admin and the Customizer use the existing [`BlockEditor`][block-editor] component, which provides a generic UI for working with blocks, to display an interface for working with blocks in widget-editing areas.

A new REST API, described in the next section, allows fetching and updating the blocks in a widget area. `@wordpress/edit-widgets` uses this API to fetch blocks which are passed to `BlockEditor`, and to update blocks when `BlockEditor` indicates that changes have been made by the user.

```js
function WidgetArea( { id } ) {
	return (
		<BlockEditor
			// Illustrative only: apiGet() is not a real function. In production,
			// @wordpress/core-data would be used to interface with the REST API.
			blocks={ apiGet( `/wp/v2/widget-areas/${ id }` ) }
			onChange={ ( blocks ) => {
				// Illustrative only: apiPut() is not a real function. In production,
				// @wordpress/core-data would be used to interface with the REST API.
				apiPut( `/wp/v2/widget-areas/${ id }`, blocks );
			} }
		/>
	);
}
```

[block-editor]: https://github.com/WordPress/gutenberg/tree/master/packages/block-editor

## REST API

Fetching and updating the blocks in a widget area is done via new REST API endpoints.

### The widget area resource

The REST API is built around a single resource object: the widget area.

```json
{
	"id": "footer",
	"name": "Footer",
	"description": "",
	"content": {
		"raw": "
			<!-- wp:paragraph -->
			<p>Hello there!</p>
			<!-- /wp:paragraph -->

			<!-- wp:legacy-widget {\"identifier\":\"search-2\",\"instance\":{\"title\":\"\"}} /-->
		",
		"rendered": "
			<p>Hello there!</p>
			<form role=\"search\" method=\"get\" class=\"search-form\" action=\"http://wordpress.test/\">
				...
			</form>
		",
	},
}
```

#### `id`

- Type: `string`
- Access: Read-only

```json
{ "id": "footer" }
```

The unique identifier for the widget area. This is set by the theme using [`register_sidebar()`][register_sidebar]. 

`"wp_inactive"` is a special identifier used for blocks that belong to widget areas that are no longer registered.

[register_sidebar]: https://developer.wordpress.org/reference/functions/register_sidebar/

#### `name`

- Type: `string`
- Access: Read-only

```json
{ "name": "Footer" }
```

The name or title of the widget area displayed in the admin interface. This is set by the theme using [`register_sidebar()`][register_sidebar].

#### `description`

- Type: `string`
- Access: Read-only

```json
{ "description": "" }
```

Description of the widget area displayed in the admin interface. This is set by the theme using [`register_sidebar()`][register_sidebar]. 

#### `content.raw`

- Type: `string`
- Access: Read & write

```json
{ "content": { "raw": "<!-- wp:paragraph --><p>Hello there!</p><!-- /wp:paragraph -->" } }
```

The raw HTML content of the widget area. Contains Gutenberg block markup and is suitable for loading into the block editor.

#### `content.rendered`

- Type: `string`
- Access: Read-only

```json
{ "content": { "rendered": "<p>Hello there!</p>" } }
```

The rendered HTML content of the widget area. Contains only rendered block markup and is suitable for inserting into a website frontend. Is equivelant to the HTML rendered by the [`dynamic_sidebar()`][dynamic_sidebar] function.

[dynamic_sidebar]: https://developer.wordpress.org/reference/functions/dynamic_sidebar/

### Fetching all widget areas

Fetches all registered widget areas.

#### Request

- Method: `GET`
- Route: `/wp/v2/widget-areas`

```
GET /wp/v2/widget-areas
```

#### Response

- Status: `200` if successful
- Body: A list of widget area resources

```json
[
	{
		"id": "footer",
		"name": "Footer",
		"description": "",
		"content": {
			"raw": "<!-- wp:paragraph --><p>Hello there!</p><!-- /wp:paragraph -->",
			"rendered": "<p>Hello there!</p>"
		},
	},
	{
		"id": "sidebar",
		"name": "Sidebar",
		"description": "",
		"content": {
			"raw": "<!-- wp:paragraph --><p>Hello there!</p><!-- /wp:paragraph -->",
			"rendered": "<p>Hello there!</p>"
		},
	}
]
```

### Fetching a single widget area

Fetches a single registered widget area by its ID.

#### Request

- Method: `GET`
- Route: `/wp/v2/widget-areas/:id`
- Parameters:
  - `id`: The unique identifier of the widget area to fetch

```
GET /wp/v2/widget-areas/footer
```

#### Response

- Status:
  - `200` if successful
  - `404` if requested widget area does not exist
- Body: A single widget area resource

```json
{
	"id": "footer",
	"name": "Footer",
	"description": "",
	"content": {
		"raw": "<!-- wp:paragraph --><p>Hello there!</p><!-- /wp:paragraph -->",
		"rendered": "<p>Hello there!</p>"
	},
}
```

### Updating a single widget area

Updates the blocks in a single registered widget area.

#### Request

- Method: `PUT`
- Route: `/wp/v2/widget-areas/:id`
- Parameters:
  - `id`: The unique identifier of the widget area to update
- Body: A single widget area resource

```
PUT /wp/v2/widget-areas/footer

{ "content": { "raw": "<!-- wp:block {\"ref\":123} /-->" } }
```

#### Response

- Status:
  - `200` if successful
  - `404` if specified widget area does not exist
  - `400` if request body is not a valid widget area resource
- Body: The updated widget area resource

```json5
{
	"id": "footer",
	"name": "Footer",
	"description": "",
	"content": {
		"raw": "<!-- wp:block {\"ref\":123} /-->",
		"rendered": "<p>This is a reusable paragraph block</p>"
	},
}
```

## Storage

WordPress currently stores which widgets belong to which widget areas using the `'sidebars_widgets'` site option. This is a serialized PHP array that maps widget area identifiers to a list of widget identifiers that are in that area.

```php
array(
	'footer' => array(
		'search-2',
		'recent-posts-2',
		'recent-comments-2',
	),
	'sidebar' => array(
		'recent-posts-2',
		'recent-comments-2',
	),
	'array_version' => 3,
)
```

This array will be _migrated_ when block widget-editing areas are activated. This happens when the Gutenberg plugin is activated, or when WordPress is updated to the version that includes support for blocks in widget-editing areas.

After migration, the `'array_version'` field is set to `4` and each widget area identifier maps to the ID of a `wp_area` post.

```php
array(
	'footer' => 123,
	'sidebar' => 456,
	'array_version' => 4,
)
```

`wp_area` is a new post type that denotes posts that contain block markup for a widget area. The `wp_area` post type is similar to the `wp_block` post type, except that it is marked as private and therefore not viewable by accessing `wp-admin/edit.php?post_type=wp_area`.

Block markup is stored in the `wp_area` post's `post_content` field, and the `core/legacy-widget` block is used to store widgets that have not been transformed into a block. `wp_area` posts are created lazily when a widget area is saved.

```html
<!-- wp:paragraph --><p>Hello there!</p><!-- /wp:paragraph -->
<!-- wp:legacy-widget {"identifier":"search-2","instance":{"title":""}} /-->
<!-- wp:legacy-widget {"identifier":"recent-posts-2","instance":{"title":"","number":5}} /-->
<!-- wp:legacy-widget {"identifier":"recent-comments-2","instance":{"title":"","number":5}} /-->
```

The `'sidebars_widgets'` is _demigrated_ when the Gutenberg plugin is deactivated. This involves resetting `'array_version'` to `3`, restoring an array that maps widget area identifiers to a list of widget identifiers, and deleting all `wp_area` posts that were previously referenced.

## Backwards Compatibility

### `wp_get_sidebars_widgets()`

[`wp_get_sidebars_widgets()`][wp_get_sidebars_widgets] can now potentially return an associative array that maps strings to integers. This differs from the current behaviour which is to always return an associative array that maps strings to arrays.

Since `wp_get_sidebars_widgets()` is marked `@private`, no effort is made to ensure backwards compatibility beyond incrementing the `'array_version'` field from `3` to `4`.

The same goes for [`wp_set_sidebars_widgets()`][wp_set_sidebars_widgets] and `get_option( 'sidebars_widgets' )`.

[wp_get_sidebars_widgets]: https://developer.wordpress.org/reference/functions/wp_get_sidebars_widgets/
[wp_set_sidebars_widgets]: https://developer.wordpress.org/reference/functions/wp_set_sidebars_widgets/

### `'sidebars_widgets'` filter

The [`'sidebars_widgets'` filter][sidebars_widgets] remains as-is and is passed an associative array that maps widget area identifiers to an an array of widget identifiers.

To do this, sequences of blocks in a widget area will be converted into dynamically registered _blocks widgets_ which outputs the blocks in that sequence.

To illustrate, let's say that the `'footer'` widget area has been migrated.

```php
array(
	'footer' => 123,
	'array_version' => 4,
)
```

The referenced `wp_area` contains some blocks and a legacy widget in its `post_content`.

```html
<!-- wp:paragraph --><p>Hello there!</p><!-- /wp:paragraph -->
<!-- wp:legacy-widget {"identifier":"search-2","instance":{"title":""}} /-->
<!-- wp:separator --><hr class="wp-block-separator"/><!-- /wp:separator -->
<!-- wp:paragraph --><p>Welcome to my cool website!</p><!-- /wp:paragraph -->
```

Now, let's take a look at what the `'sidebars_widgets'` filter receives.

```php
function my_sidebars_widgets_filter( $sidebars_widgets ) {
	var_dump( $sidebars_widgets );
	return $sidebars_widgets;
}
add_filter( 'sidebars_widgets', 'my_sidebars_widgets_filter' );
```

We receive an array that contains three widgets.

```php
array(
	'footer' => array(
		'wp-blocks-cb8d16f47bf5cfa6ef313e813d6b80d6',
		'search-2',
		'wp-blocks-d93dcd8e370f526bf072efcb5138dc53',
	),
	'array_version' => 3,
)
```

The first `wp-blocks-{hash}` widget is a dynamically registered widget that outputs a paragraph, and the second outputs a separator and a paragraph.

[sidebars_widgets]: https://developer.wordpress.org/reference/hooks/sidebars_widgets/

### `dynamic_sidebar()`

Usage of the [`dynamic_sidebar()`][dynamic_sidebar] function remains as-is, though it will now render any blocks in the specified widget area.

There are some nuances that surround how `dynamic_sidebar()` handles the `'before_widget'`, `'after_widget'`, `'before_title'` and `'after_title'` attributes that are associated with the widget area.

The `'before_title'` and `'after_title'` attributes are rendered:

- Before/after the title of a `core/legacy-widget` block is rendered.
- Never, when a non-`core/legacy-widget` block is rendered.

The `'before_widget'` and `'after_widget'` attributes are rendered:

- Before/after a `core/legacy-widget` block is rendered.
- Before/after a _sequence_ of non-`core/legacy-widget` blocks are rendered.

This is done so that all blocks aren't wrapped with `'before_widget'` and `'after_widget'` markup. Instead, **sequences** of blocks are combined together _and then_ wrapped with `'before_widget'` and `'after_widget'` markup. This makes blocks render on old themes as if they were all together in a single widget.

To illustrate, let's say that the `'footer'` widget area is registered so that titles are wrapped in `<h2>` elements and widgets in `<section>` elements.

```php
register_sidebar( array( 
	'id'            => 'footer',
	...
	'before_widget' => '<section>',
	'after_widget'  => '</section>',
	'before_title'  => '<h2>',
	'after_title'   => '</h2>',
) );
```

The `'footer'` widget area has been migrated.

```php
array(
	'footer' => 123,
	'array_version' => 4,
)
```

The referenced `wp_area` contains some blocks and a legacy widget in its `post_content`.

```html
<!-- wp:paragraph --><p>Hello there!</p><!-- /wp:paragraph -->
<!-- wp:legacy-widget {"identifier":"search-2","instance":{"title":"Search"}} /-->
<!-- wp:separator --><hr class="wp-block-separator"/><!-- /wp:separator -->
<!-- wp:paragraph --><p>Welcome to my cool website!</p><!-- /wp:paragraph -->
```

Now, let's call `dynamic_sidebar( 'footer' )`.

```html
<section>
	<p>Hello there!</p>
</section>
<section>
	<h2>Search</h2>
	<form role="search" method="get" class="search-form" action="http://wordpress.test/">
		...
	</form>
</section>
<section>
	<hr class="wp-block-seperator" />
	<p>Welcome to my cool website!</p>
</section>
```

[dynamic_sidebar]: https://developer.wordpress.org/reference/functions/dynamic_sidebar/
[register_sidebar]: https://developer.wordpress.org/reference/functions/register_sidebar/

## Performance

`wp_area` posts will be pre-emptively fetched when rendering a page. That is, all of the posts referenced in `'sidebar_widgets'` will be fetched using a single `SELECT ... FROM wp_posts WHERE ID in ?` query. This ensures that we do not introduce one extra query per widget area.
