# Core Fields

The fields WordPress core registers on the server for the Fields API: their PHP declarations and their JavaScript parts, side by side.

The Fields API declares fields in PHP. What PHP cannot serialize, such as a field's `render` component or its `getElements` callback, ships in a script module registered along with the fields. This package holds both halves of the fields WordPress core registers, grouped in folders.

## Default fields and field collections

The fields of this package live in folders of `src`:

-   `post_type_supports`: the default fields of every post type exposed in the REST API, each derived from a support of the post type or given to every post type (`author`, `comment_status`, `date`, `discussion`, `excerpt`, `last_edited_date`, `notesCount`, `ping_status`, `post-content-info`, `scheduled_date`, `status`, `sticky`). They are registered in code, see below.
-   `wp_template`: the fields templates have instead of the defaults (`author`, the theme, plugin, site, or user providing the template).
-   `wp_template_part`: the fields template parts have instead of the defaults. It has no fields yet: template parts exclude the default author field, since they declare their own client-side.
-   `attachment`: the fields of the media editor ported to the server so far (`alt_text`, `attached_to`, `author`, `caption`, `date`, `description`, `filename`, `filesize`, `media_dimensions`, `mime_type`, `title`), instead of all the defaults.

Each field has a folder:

-   `<field>/field.php` returns the serializable part of the field: `type`, `label`, `elements`, `filterBy`, and so on. The id of the field is the name of its folder, unless the file sets an `id`.
-   `<field>/field.tsx`, when the field has JavaScript parts, exports them as `fieldExtensions`.

And each folder of fields may have:

-   `index.ts`, when some of its fields have JavaScript parts: its script module, whose default export maps the id of each of those fields to its `fieldExtensions`.
-   `index.php`, for the fields of a single entity: the configuration of a field collection, a plain array described below. It defines no function and hooks nothing. `post_type_supports` has none.

### The default fields of every post type

`register_core_post_type_supports_fields()`, in `src/index.php`, registers the fields of `post_type_supports` on every post type exposed in the REST API, from what each supports, or whatever it supports:

-   `author`, for the post types supporting `author`.
-   `comment_status`, for the post types supporting `comments`.
-   `date`, for every post type but the design ones.
-   `discussion`, for the post types supporting `comments` or `trackbacks`.
-   `excerpt`, for the post types supporting `excerpt`.
-   `last_edited_date`, for every post type.
-   `notesCount`, for the post types whose `editor` support has the `notes` argument, as with `'supports' => array( 'editor' => array( 'notes' => true ) )`.
-   `ping_status`, for the post types supporting `trackbacks`.
-   `post-content-info`, for the post types supporting `editor`.
-   `scheduled_date`, for every post type but the design ones.
-   `status`, for every post type but the design ones.
-   `sticky`, for posts, the only post type with sticky posts.

It reads their definitions with `wp_get_field_collection_fields()` and decides in code which post type gets which field, so a field ported later can depend on anything PHP can check: a theme support, a property of the post type, a combination of supports. Every field is registered with the `@wordpress/core-fields/post_type_supports` module.

It makes no exception for any post type. A post type whose fields differ from the defaults excludes the ones it does not get on the `fields_api_post_type_supports_exclusions` filter, before they are registered:

```php
apply_filters( 'fields_api_post_type_supports_exclusions', string[] $excluded_fields, string $post_type, string[] $all_fields );
```

The value is the list of the ids of the default fields the post type does not get, empty by default. `$all_fields` lists the defaults the post type supports, the ones it would get; the filter does not run for a post type supporting none. Callbacks compose: add to the incoming list rather than replacing it. A value other than a list is reported with `_doing_it_wrong()` and excludes nothing. The filter runs when the registry fires `fields_api_init`, on its first read after `init`, so add callbacks on plugin load or on `init`.

Core hooks it like a plugin would, with `exclude_core_post_type_support_fields()` in `src/index.php`:

-   Templates and template parts exclude `author`, which the `wp_template` collection and the client define for them.
-   Templates, template parts, and patterns exclude `excerpt`, which is their description.
-   Templates, template parts, and navigation menus exclude `post-content-info`, since their content is not text to read.
-   The design post types (templates, template parts, patterns, and navigation menus) exclude the fields about publishing a post (`date`, `scheduled_date`, `status`), since they lay out a site rather than publish content.
-   Attachments exclude every default (`$all_fields`), since the media editor has its own fields.

### Collection configuration

The array the `index.php` of a collection returns has these keys:

-   `origin` (required): who registers the fields, `'core'` for every collection of this package. It becomes the `origin.registeredBy` of each field.
-   `kind` (required): the entity kind, e.g. `'postType'`.
-   `name` (required): the entity name, e.g. `'wp_template'`.
-   `module` (optional): the id of the script module of the collection, written out (`'@wordpress/core-fields/<collection>'`). Every field of the collection is registered with it, including the fields without JavaScript parts.

An invalid configuration is reported with `_doing_it_wrong()` and skipped. For example, `wp_template/index.php`:

```php
return array(
	'origin' => 'core',
	'kind'   => 'postType',
	'name'   => 'wp_template',
	'module' => '@wordpress/core-fields/wp_template',
);
```

There is no precedence between collections: the registry refuses a field registered twice for the same entity, reporting the duplicate with `_doing_it_wrong()`. A collection redefining a default field needs its post type to exclude that field on the filter.

### Loading

`src/index.php` registers the core fields through the public Fields API, exactly as a plugin registers its own. `register_core_field_collections()` runs on the `fields_api_init` action at priority 0: it registers the defaults first, then calls `wp_register_field_collection()` for each collection, listed explicitly. The action fires once `init` has completed, when the supports of the post types are final, and a plugin hooking it at the default priority sees the core fields registered, and can update or unregister them.

`wp_register_field_collection( $registry, $directory )` reads one collection and registers its fields on the registry the action passes, after the fields registered on the entity before, in the alphabetical order of their folders. Like the registry, it does not check that the entity exists: the `/wp/v2/fields` route only serves the fields of the entities the REST API exposes. It returns whether the collection is valid and the registry accepted all of its fields.

A plugin does the same with its own collections. With the Gutenberg plugin, the functions are `gutenberg_register_field_collection()` and `gutenberg_get_field_collection_fields()`:

```php
add_action(
	'fields_api_init',
	function ( $registry ) {
		wp_register_field_collection( $registry, __DIR__ . '/fields/book' );
	}
);

// Books do not get the default comment status.
add_filter(
	'fields_api_post_type_supports_exclusions',
	function ( $excluded_fields, $post_type ) {
		if ( 'book' === $post_type ) {
			$excluded_fields[] = 'comment_status';
		}
		return $excluded_fields;
	},
	10,
	2
);
```

The source PHP is written as it is in WordPress core. The Gutenberg build copies the PHP files to `build/scripts/core-fields`, which `lib/load.php` loads, and prefixes the functions defined in them, `wp_register_field_collection()`, and `wp_get_field_collection_fields()` with `gutenberg_`; the `index.php` and `field.php` files of the collections come out as they are. The build only prefixes the calls to a function in the file that defines it, which is why the functions of this package all live in `src/index.php`. A new collection needs its folder, an entry in `src/index.php` and, if it has JavaScript parts, an entry in `wpScriptModuleExports`.

The client never imports this package directly. `loadFields` and `useFields` from [`@wordpress/fields-loader`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/fields-loader/README.md) import the script module of a collection on demand, when the `/wp/v2/fields` route lists it for an entity, and merge each entry into the field with the same id among the fields registered with that module. That is why each collection with JavaScript parts has a module of its own: `post_type_supports` and `wp_template` both have an `author` field.

## Installation

Install the module:

```bash
npm install @wordpress/core-fields --save
```

_This package assumes that your code will run in an ES2015+ environment. If you're using an environment that has limited or no support for such language features and/or APIs, you should include the polyfill shipped in `@wordpress/babel-preset-default` in your code._

## Usage

The package provides the `@wordpress/core-fields/attachment`, `@wordpress/core-fields/post_type_supports`, and `@wordpress/core-fields/wp_template` script modules. Their default export follows the `FieldsScriptParts` shape documented in `@wordpress/fields-loader`, the same one a plugin's own field module follows.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
