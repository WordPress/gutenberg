# Core Fields

The fields WordPress core registers on the server for the Fields API: their PHP declarations and their JavaScript parts, side by side.

The Fields API declares fields in PHP. What PHP cannot serialize, such as a field's `render` component or its `getElements` callback, ships in a script module registered along with the fields. This package holds both halves of the fields WordPress core registers, grouped in field collections.

## Field collections

A collection is a folder of `src` holding the fields registered together, for one entity or for every post type:

-   `post_supports`: the default fields of every post type exposed in the REST API, each derived from a support of the post type (`author`, `comment_status`, `notesCount`).
-   `wp_template`: the fields templates have instead of the defaults (`author`, the theme, plugin, site, or user providing the template).
-   `wp_template_part`: the fields template parts have instead of the defaults. It has no fields yet: it opts out of the default author field, since template parts declare their own client-side.
-   `attachment`: the fields of the media editor ported to the server so far (`date`), instead of all the defaults.

Each field has a folder in its collection:

-   `<field>/field.php` returns the serializable part of the field: `type`, `label`, `elements`, `filterBy`, and so on. The id of the field is the name of its folder, unless the file sets an `id`.
-   `<field>/field.tsx`, when the field has JavaScript parts, exports them as `fieldExtensions`.

And each collection has:

-   `index.php`, which returns the configuration of the collection as a plain array, described below. It defines no function and hooks nothing.
-   `index.ts`, when some of its fields have JavaScript parts: the script module of the collection, whose default export maps the id of each of those fields to its `fieldExtensions`.
-   `exclude-post-type-supports.php`, when its post type opts out of fields of the `post_supports` collection: a function hooked to the `fields_api_exclude_post_type_supports` filter, described below.

### Collection configuration

The array `index.php` returns has these keys:

-   `origin` (required): who registers the fields, `'core'` for every collection of this package. It becomes the `origin.registeredBy` of each field.
-   `kind` (required): the entity kind, e.g. `'postType'`.
-   `name` (required): the entity name, e.g. `'wp_template'`, or `null` for every entity of the kind. Only the `postType` kind supports `null`, for every post type exposed in the REST API; a collection for every entity of another kind is reported with `_doing_it_wrong()` and skipped.
-   `module` (optional): the id of the script module of the collection, written out (`'@wordpress/core-fields/<collection>'`). Every field of the collection is registered with it, including the fields without JavaScript parts.

Each field of a collection whose `name` is `null` sets `supports` in its `field.php`, the condition a post type must meet to get it:

-   A support name, e.g. `'supports' => 'author'`: the post type supports it (`post_type_supports()`).
-   A support and argument pair, e.g. `'supports' => array( 'editor', 'notes' )`: the arguments of the support have a truthy value for the argument, as with `'supports' => array( 'editor' => array( 'notes' => true ) )`. A support without arguments meets no pair.

The `supports` of a field only decides where it applies: it is not registered, so it is not part of the `/wp/v2/fields` response. The fields of a collection for a single entity do not set it. An invalid configuration or field is reported with `_doing_it_wrong()` and skipped.

For example, `post_supports/index.php`, whose fields set `supports` (`author` → `'author'`, `comment_status` → `'comments'`, `notesCount` → `array( 'editor', 'notes' )`), and `wp_template/index.php`:

```php
return array(
	'origin' => 'core',
	'kind'   => 'postType',
	'name'   => null,
	'module' => '@wordpress/core-fields/post_supports',
);

return array(
	'origin' => 'core',
	'kind'   => 'postType',
	'name'   => 'wp_template',
	'module' => '@wordpress/core-fields/wp_template',
);
```

### Opting out of the fields derived from supports

A post type whose fields differ from the defaults opts out of some or all of them on the `fields_api_exclude_post_type_supports` filter:

```php
apply_filters( 'fields_api_exclude_post_type_supports', array $excluded, string $post_type, array $collection );
```

The value is what the post type does not get from the collections for every post type: a list of field ids, or `true` for all of them. It starts as an empty array. `$collection` is the configuration of the collection being registered (`origin`, `kind`, `name`, `module`), for a callback that only targets one collection. A value other than `true` or a list of strings is reported with `_doing_it_wrong()` and excludes nothing. Callbacks compose: add to the incoming list rather than replacing it, and return `true` unchanged. The filter runs when the registry fires `fields_api_init`, on its first read after `init`, so add callbacks on plugin load or on `init`.

Each core collection that opts out does it in its own `exclude-post-type-supports.php`: `wp_template` and `wp_template_part` exclude `author`, `attachment` excludes everything (`true`). For instance `wp_template/exclude-post-type-supports.php`:

```php
function exclude_post_type_supports_wp_template( $excluded, $post_type ) {
	if ( 'wp_template' !== $post_type || true === $excluded ) {
		return $excluded;
	}

	$excluded   = is_array( $excluded ) ? $excluded : array();
	$excluded[] = 'author';
	return $excluded;
}
add_filter( 'fields_api_exclude_post_type_supports', 'exclude_post_type_supports_wp_template', 10, 2 );
```

There is no precedence between collections: a collection redefining a field of a collection for every post type needs its post type to exclude that field, or the registry refuses its fields, reporting the duplicate with `_doing_it_wrong()`, as it would for a plugin registering a field twice.

### Loading

`src/index.php` registers the core collections through the public Fields API, exactly as a plugin registers its own: it requires the `exclude-post-type-supports.php` files, and `register_core_field_collections()` calls `wp_register_field_collection()` for each collection, listed explicitly, on the `fields_api_init` action at priority 0. The action fires once `init` has completed, when the supports of the post types are final, and a plugin hooking it at the default priority sees the core fields registered.

`wp_register_field_collection( $registry, $directory )` reads one collection and registers its fields on the registry the action passes. A collection for every post type registers, on each post type exposed in the REST API, the fields whose `supports` it meets minus those the filter excludes. A collection for a single post type registers its fields after them, or nothing when the post type does not exist or is not exposed in the REST API. The fields of a collection follow the alphabetical order of their folders. It returns whether the collection is valid and the registry accepted all of its fields.

A plugin does the same with its own collections. With the Gutenberg plugin, the function is `gutenberg_register_field_collection()`:

```php
add_action(
	'fields_api_init',
	function ( $registry ) {
		wp_register_field_collection( $registry, __DIR__ . '/fields/book' );
	}
);

// Books keep their author field, but not the default comment status.
add_filter(
	'fields_api_exclude_post_type_supports',
	function ( $excluded, $post_type ) {
		if ( 'book' === $post_type && true !== $excluded ) {
			$excluded[] = 'comment_status';
		}
		return $excluded;
	},
	10,
	2
);
```

The source PHP is written as it is in WordPress core. The Gutenberg build copies the PHP files to `build/scripts/core-fields`, which `lib/load.php` loads, and prefixes the functions defined in them and `wp_register_field_collection()` with `gutenberg_`; the `index.php` and `field.php` files of the collections come out as they are. A new collection needs its folder, an entry in `src/index.php` and, if it has JavaScript parts, an entry in `wpScriptModuleExports`.

The client never imports this package directly. `loadFields` and `useFields` from [`@wordpress/fields-loader`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/fields-loader/README.md) import the script module of a collection on demand, when the `/wp/v2/fields` route lists it for an entity, and merge each entry into the field with the same id among the fields registered with that module. That is why each collection with JavaScript parts has a module of its own: `post_supports` and `wp_template` both have an `author` field.

## Installation

Install the module:

```bash
npm install @wordpress/core-fields --save
```

_This package assumes that your code will run in an ES2015+ environment. If you're using an environment that has limited or no support for such language features and/or APIs, you should include the polyfill shipped in `@wordpress/babel-preset-default` in your code._

## Usage

The package provides the `@wordpress/core-fields/post_supports` and `@wordpress/core-fields/wp_template` script modules. Their default export follows the `FieldsScriptParts` shape documented in `@wordpress/fields-loader`, the same one a plugin's own field module follows.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
