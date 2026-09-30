# Core Fields

The fields WordPress core registers on the server for the Fields API: their PHP declarations and their JavaScript parts, side by side.

The Fields API declares fields in PHP. What PHP cannot serialize, such as a field's `render` component or its `getElements` callback, ships in a script module registered along with the fields. This package holds both halves of the fields WordPress core registers, grouped in field collections.

## Field collections

A collection is a folder of `src` holding the fields registered together, for one entity or for every post type:

-   `post_supports`: the default fields of every post type exposed in the REST API, each derived from a support of the post type (`author`, `comment_status`, `notesCount`).
-   `wp_template`: the fields templates have instead of the defaults (`author`, the theme, plugin, site, or user providing the template).
-   `wp_template_part`: the fields template parts have instead of the defaults. It has no fields yet: it excludes the default author field, since template parts declare their own client-side.
-   `attachment`: the fields of the media editor ported to the server so far (`date`), instead of all the defaults.

Each field has a folder in its collection:

-   `<field>/field.php` returns the serializable part of the field: `type`, `label`, `elements`, `filterBy`, and so on. The id of the field is the name of its folder, unless the file sets an `id`.
-   `<field>/field.tsx`, when the field has JavaScript parts, exports them as `fieldExtensions`.

And each collection has:

-   `index.php`, which returns the configuration of the collection as a plain array, described below. It defines no function and hooks nothing.
-   `index.ts`, when some of its fields have JavaScript parts: the script module of the collection, whose default export maps the id of each of those fields to its `fieldExtensions`.

### Collection configuration

The array `index.php` returns has these keys:

-   `origin` (required): who registers the fields, `'core'` for every collection of this package. It becomes the `origin.registeredBy` of each field.
-   `kind` (required): the entity kind, e.g. `'postType'`.
-   `name` (required): the entity name, e.g. `'wp_template'`, or `null` for every entity of the kind. Only the `postType` kind supports `null`, for every post type exposed in the REST API; a collection for every entity of another kind is reported with `_doing_it_wrong()` and skipped.
-   `module` (optional): the id of the script module of the collection, written out (`'@wordpress/core-fields/<collection>'`). Every field of the collection is registered with it, including the fields without JavaScript parts.
-   `exclude_supports` (optional, only for a collection of a single post type): the fields of the collections for every post type this post type does not get. Either `true`, for none of them, or a list of the `supports` of the fields to exclude, each a support name (`'author'`) or a support and argument pair (`array( 'editor', 'notes' )`). The match is exact: excluding `'editor'` does not exclude `array( 'editor', 'notes' )`.

Each field of a collection whose `name` is `null` sets `supports` in its `field.php`, the condition a post type must meet to get it:

-   A support name, e.g. `'supports' => 'author'`: the post type supports it (`post_type_supports()`).
-   A support and argument pair, e.g. `'supports' => array( 'editor', 'notes' )`: the arguments of the support have a truthy value for the argument, as with `'supports' => array( 'editor' => array( 'notes' => true ) )`. A support without arguments meets no pair.

The `supports` of a field only decides where it applies: it is not registered, so it is not part of the `/wp/v2/fields` response. The fields of a collection for a single entity do not set it. An invalid configuration or field is reported with `_doing_it_wrong()` and skipped.

The four core collections:

```php
// post_supports/index.php, whose fields set `supports`: `author` → 'author',
// `comment_status` → 'comments', `notesCount` → array( 'editor', 'notes' ).
return array(
	'origin' => 'core',
	'kind'   => 'postType',
	'name'   => null,
	'module' => '@wordpress/core-fields/post_supports',
);

// wp_template/index.php
return array(
	'origin'           => 'core',
	'kind'             => 'postType',
	'name'             => 'wp_template',
	'module'           => '@wordpress/core-fields/wp_template',
	'exclude_supports' => array( 'author' ),
);

// wp_template_part/index.php
return array(
	'origin'           => 'core',
	'kind'             => 'postType',
	'name'             => 'wp_template_part',
	'exclude_supports' => array( 'author' ),
);

// attachment/index.php
return array(
	'origin'           => 'core',
	'kind'             => 'postType',
	'name'             => 'attachment',
	'exclude_supports' => true,
);
```

### Loading

A single loader, `_gutenberg_register_core_field_collections()` in `lib/compat/wordpress-7.2/fields-api.php`, reads every collection and registers its fields on the `fields_api_init` action at priority 0, once `init` has completed and the supports of the post types are final. A plugin hooking the action at the default priority sees them registered. Each post type exposed in the REST API gets, in this order:

1. The fields of the collections for every post type whose `supports` it meets, except those the collections of the post type exclude.
2. The fields of the collections of the post type. A collection for a post type that does not exist or is not exposed in the REST API registers nothing.

Collections of the same step follow the alphabetical order of their folders, and the fields of a collection that of theirs.

There is no precedence between collections. A collection redefining a field of a collection for every post type must exclude its `supports`: otherwise the registry refuses its fields, reporting the duplicate with `_doing_it_wrong()`, as it would for a plugin registering a field twice.

The source PHP is written as it is in WordPress core. The build copies the PHP files as they are to `build/scripts/core-fields`, where the loader reads them, so a new collection only needs its folder and, if it has JavaScript parts, an entry in `wpScriptModuleExports`.

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
