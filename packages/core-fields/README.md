# Core Fields

The fields WordPress core registers on the server for the Fields API: their PHP declarations and their JavaScript parts, side by side.

The Fields API declares fields in PHP. What PHP cannot serialize, such as a field's `render` component or its `getElements` callback, ships in a script module registered along with the fields. This package holds both halves of the fields WordPress core registers, grouped in field collections.

## Field collections

A collection is a folder of `src` holding the fields registered together, usually for one entity:

-   `post_supports`: the default fields of every post type exposed in the REST API, each derived from a support of the post type (`author`, `comment_status`, `notesCount`).
-   `wp_template`: the fields templates have instead of the defaults (`author`, the theme, plugin, site, or user providing the template).
-   `attachment`: the fields of the media editor ported to the server so far (`date`).

Each field has a folder in its collection:

-   `<field>/field.php` returns the serializable part of the field: `type`, `label`, `elements`, `filterBy`, and so on. The id of the field is the name of its folder, unless the file sets an `id`.
-   `<field>/field.tsx`, when the field has JavaScript parts, exports them as `fieldExtensions`.

And each collection has:

-   `index.php`, which returns the function placing the fields: it receives the registry, the fields of the collection (in the alphabetical order of their folders), and the id of the script module of the collection, and registers each field for the entities it applies to.
-   `index.ts`, when some of its fields have JavaScript parts: the script module of the collection, whose default export maps the id of each of those fields to its `fieldExtensions`.

The build copies the PHP files to `build/scripts/core-fields`, where the Gutenberg plugin loads the collections on the `fields_api_init` action, see `lib/compat/wordpress-7.2/fields-api.php`. The collections are wired by hand: a new collection needs a hook there and, if it has JavaScript parts, an entry in `wpScriptModuleExports`.

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
