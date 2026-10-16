# Fields

The fields and actions WordPress core registers on the server for the Entity fields and Entity actions APIs: their PHP declarations and the script modules of their JavaScript parts, side by side.

The package has no JavaScript entry point to import. WordPress registers its PHP and its script modules, and the editor loads each script module on demand, by its id: `@wordpress/fields/<collection>` for the fields, `@wordpress/actions/<collection>` for the actions.

## Entity fields

The Entity fields API declares fields in PHP. What PHP cannot serialize, such as a field's `render` component or its `getElements` callback, ships in a script module registered along with the fields. The `src/entity-fields` folder holds both halves of the fields WordPress core registers, grouped in folders.

### Default fields and field collections

The fields live in folders of `src/entity-fields`:

- `post_type_supports`: the default fields of every post type exposed in the REST API, each derived from a support of the post type or given to every post type (`author`, `comment_status`, `date`, `discussion`, `excerpt`, `featured_media`, `format`, `last_edited_date`, `notesCount`, `parent`, `password`, `ping_status`, `post-content-info`, `scheduled_date`, `slug`, `status`, `sticky`, `template`, `title`). They are registered in code, see below.
- `page`: the fields pages have instead of the defaults (`title`, with a badge for the homepage, the posts page, and the privacy policy page).
- `wp_template`: the fields templates have instead of the defaults (`author`, the theme, plugin, site, or user providing the template, `description`, `description_readonly`, the description of the templates themes and plugins provide, and `title`), plus the reading settings shown for `home` and `index` templates (`posts_page_title`, `posts_per_page`, and `default_comment_status`).
- `wp_template_part`: the fields template parts have instead of the defaults (`author`, the theme, plugin, site, or user providing the template part, and `title`).
- `wp_block`: the fields patterns have instead of the defaults (`excerpt`, their description, `sync-status`, and `title`).
- `attachment`: the fields of the media editor ported to the server so far (`alt_text`, `attached_to`, `author`, `caption`, `date`, `description`, `filename`, `filesize`, `media_dimensions`, `media_thumbnail`, `mime_type`, `modified`, `title`), instead of all the defaults.
- `root_site`: the fields of the site, the `site` entity of the `root` kind, shown in the identity screen of the site editor (`description`, its tagline, `site_icon`, `site_logo`, and `title`). The site is not a post type, so it gets no defaults.

Each field has a folder:

- `<field>/field.php` returns the serializable part of the field: `type`, `label`, `elements`, `filterBy`, and so on. The id of the field is the name of its folder, unless the file sets an `id`.
- `<field>/field.tsx`, when the field has JavaScript parts, exports them as `fieldExtensions`.

And each folder of fields may have:

- `index.ts`, when some of its fields have JavaScript parts: its script module, whose default export maps the id of each of those fields to its `fieldExtensions`.
- `index.php`, for the fields of a single entity: the configuration of a field collection, a plain array described below. It defines no function and hooks nothing. `post_type_supports` has none.

### The default fields of every post type

`wp_register_core_post_type_supports_fields()`, in `src/entity-fields/index.php`, registers the fields of `post_type_supports` on every post type exposed in the REST API, from what each supports, or whatever it supports:

- `author`, for the post types supporting `author`.
- `comment_status`, for the post types supporting `comments`.
- `date`, for every post type but the design ones.
- `discussion`, for the post types supporting `comments` or `trackbacks`.
- `excerpt`, for the post types supporting `excerpt`.
- `featured_media`, for the post types supporting `thumbnail` when the theme supports post thumbnails for them, which a theme may opt into for some post types only.
- `format`, for the post types supporting `post-formats` when the theme supports post formats. Its elements are the formats of the theme, plus `standard`.
- `last_edited_date`, for every post type.
- `notesCount`, for the post types whose `editor` support has the `notes` argument, as with `'supports' => array( 'editor' => array( 'notes' => true ) )`.
- `parent`, for the post types supporting `page-attributes`.
- `password`, for every post type but the design ones.
- `ping_status`, for the post types supporting `trackbacks`.
- `post-content-info`, for the post types supporting `editor`.
- `scheduled_date`, for every post type but the design ones.
- `slug`, for the viewable post types but the design ones.
- `status`, for every post type but the design ones.
- `sticky`, for posts, the only post type with sticky posts.
- `template`, for every post type but the design ones.
- `title`, for the post types supporting `title`.

It reads their definitions with `wp_get_entity_field_collection_fields()` and decides in code which post type gets which field, so a field ported later can depend on anything PHP can check: a theme support, a property of the post type, a combination of supports. Every field is registered with the `@wordpress/fields/post_type_supports` module.

It makes no exception for any post type. A post type whose fields differ from the defaults unregisters the ones it does not get, once they are registered. Core does it like a plugin would, in `wp_register_core_field_collections()` in `src/entity-fields/index.php`, after the defaults are registered and before the collection of the post type is:

- Templates and template parts unregister `author`, which the `wp_template` and `wp_template_part` collections define for them.
- Templates, template parts, and patterns unregister `excerpt`, which is their description. The template and pattern collections define their own description fields.
- Templates, template parts, and navigation menus unregister `post-content-info`, since their content is not text to read.
- The design post types (templates, template parts, patterns, and navigation menus) unregister the fields about publishing a post (`date`, `password`, `scheduled_date`, `slug`, `status`) and the `template` that renders a post, since they lay out a site rather than publish content.
- Pages, templates, template parts, and patterns unregister `title`, since their collections define their own title fields.
- Attachments unregister every default, since the media editor has its own fields.

### Collection configuration

The array the `index.php` of a collection returns has these keys:

- `origin` (required): who registers the fields, `'core'` for every collection of this package. It becomes the `origin.registeredBy` of each field.
- `kind` (required): the entity kind, e.g. `'postType'`.
- `name` (required): the entity name, e.g. `'wp_template'`.
- `module` (optional): the id of the script module of the collection, written out (`'@wordpress/fields/<collection>'`). Every field of the collection is registered with it, including the fields without JavaScript parts.

An invalid configuration is reported with `_doing_it_wrong()` and skipped. For example, `wp_template/index.php`:

```php
return array(
	'origin' => 'core',
	'kind'   => 'postType',
	'name'   => 'wp_template',
	'module' => '@wordpress/fields/wp_template',
);
```

There is no precedence between collections: the registry skips a field already registered for the entity, reporting the duplicate with `_doing_it_wrong()`, and registers the rest of the collection. A collection redefining a default field needs that field unregistered first.

### Loading

`src/entity-fields/index.php` registers the core fields through the public Entity fields API, exactly as a plugin registers its own. `wp_register_core_field_collections()` runs on the `wp_entity_fields_api_init` action at priority 0: it registers the defaults first, unregisters the ones the core post types do not get, then calls `wp_register_entity_field_collection()` for each collection, listed explicitly. The action fires once `init` has completed, when the supports of the post types are final, and a plugin hooking it at the default priority sees the core fields registered, and can update or unregister them.

`wp_register_entity_field_collection( $directory )` reads one collection and registers its fields, after the fields registered on the entity before, in the alphabetical order of their folders. Like `wp_register_entity_fields()`, it only runs on the `wp_entity_fields_api_init` action. Like the registry, it does not check that the entity exists: the `/wp/v2/entity-fields` route only serves the fields of the entities the REST API exposes. It returns whether the collection is valid and the registry accepted all of its fields.

A plugin does the same with its own collections:

```php
add_action(
	'wp_entity_fields_api_init',
	function () {
		// Books do not get the default comment status.
		wp_unregister_entity_fields( 'postType', 'book', array( 'comment_status' ) );
		wp_register_entity_field_collection( __DIR__ . '/fields/book' );
	}
);
```

The source PHP is written as it is in WordPress core. The Gutenberg build copies the PHP files to `build/scripts/fields`, `lib/load.php` loads `build/scripts/fields/entity-fields/index.php`, and the build prefixes the functions defined in them with `gutenberg_`; the `index.php` and `field.php` files of the collections come out as they are. The functions of the Entity fields API keep their names: the plugin defines them when WordPress does not. The build only prefixes the calls to a function in the file that defines it, which is why the functions of the entity fields all live in `src/entity-fields/index.php`. A new collection needs its folder, an entry in `src/entity-fields/index.php` and, if it has JavaScript parts, an entry in `wpScriptModuleExports`.

The client never imports these modules statically. The editor imports the script module of a collection on demand, when the `/wp/v2/entity-fields` route lists it for an entity, and merges each entry into the field with the same id among the fields registered with that module. That is why each collection with JavaScript parts has a module of its own: `post_type_supports` and `wp_template` both have an `author` field.

### Script modules

The package provides the `@wordpress/fields/attachment`, `@wordpress/fields/page`, `@wordpress/fields/post_type_supports`, `@wordpress/fields/root_site`, `@wordpress/fields/wp_block`, `@wordpress/fields/wp_template`, and `@wordpress/fields/wp_template_part` script modules. Their default export follows the `FieldsScriptParts` shape defined in [`src/entity-fields/types.ts`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/fields/src/entity-fields/types.ts), the same one a plugin's own field module follows.

## Entity actions

The actions WordPress core registers for its entities, such as "Rename", "Duplicate" or "Move to trash", live in `src/entity-actions`. They are shown in the DataViews lists of the site editor and in the inspector of the editor.

WordPress registers them on the server through the entity actions API, like a plugin registers its own: the data of each action, such as its label, is registered in PHP, and its JavaScript parts, such as its callback or its modal, are in a script module. The editor reads the actions of an entity from the `/wp/v2/entity-actions` REST API route, imports the script modules the route lists, and merges each action with its JavaScript parts.

### Collections

The actions live in folders of `src/entity-actions`, one per collection:

- `post_type_supports`: the default actions of every post type (`delete-post`, `duplicate-post`, `move-to-trash`, `order-pages`, `permanently-delete`, `rename-post`, `reset-post`, `restore`, `view-post`, and `view-post-revisions`).
- `wp_block`: the actions patterns have on top of the defaults (`duplicate-pattern` and `export-pattern`).
- `wp_template_part`: the actions template parts have on top of the defaults (`duplicate-template-part`).

Each action has a folder named after its id, with the data of the action in `action.php` and its JavaScript parts in `action.tsx`. The `index.ts` of each collection is its script module, whose default export maps the id of each action to its JavaScript parts.

`src/entity-actions/index.php` registers the actions of each post type exposed in the REST API, on the `wp_entity_actions_api_init` action at priority 0, so a plugin hooking it at the default priority can remove or replace them:

- `view-post`, for the viewable post types.
- `view-post-revisions`, for the post types supporting `revisions`.
- `duplicate-post`, for the post types the user can create, except templates, template parts, and patterns. Only in the Gutenberg plugin.
- `duplicate-template-part`, for template parts, when the user can create them and the theme is a block theme.
- `duplicate-pattern`, for patterns, when the user can create them.
- `rename-post`, for the post types supporting `title`.
- `order-pages`, for the post types supporting `page-attributes`.
- `export-pattern`, for patterns.
- `restore`, `reset-post`, `delete-post`, `move-to-trash`, and `permanently-delete`, for every post type. Each one checks which posts it applies to.

The actions are registered in that order, which is the order they are shown in, for the current user: the actions depending on what the user can do are only registered for the users who can. The Gutenberg build copies the PHP files to `build/scripts/fields/entity-actions`, which `lib/load.php` loads, with its `gutenberg_` prefix.

### Prerequisites

The modules use the `wp.*` globals the `wp-editor` script loads, such as `wp.data` and `wp.components`, so they only run on pages that load the editor script. They are dynamic module dependencies of `wp-editor`, which adds them to the import map of every page loading it.

### Script modules

The actions are in the `@wordpress/actions/post_type_supports`, `@wordpress/actions/wp_block`, and `@wordpress/actions/wp_template_part` script modules. They come from this package, which declares their ids in `wpScriptModuleExports` (`{ "path": "...", "id": "@wordpress/actions/<collection>" }`), so they cannot be imported through `@wordpress/fields`; load them by their id. Their default export maps the id of each action to the properties of the DataViews action that PHP cannot serialize, which complete the action the `/wp/v2/entity-actions` route returns:

```js
const { default: actions } = await import(
	'@wordpress/actions/post_type_supports'
);
const renamePost = { ...actionFromTheServer, ...actions[ 'rename-post' ] };
```

A plugin replacing a core action unregisters it, then registers it again with its changes and with the script module of the core action, so the action keeps its JavaScript parts. Merging the changes into the definition `wp_unregister_entity_actions()` returns keeps the rest of the core action, such as its modal options, and registering only when something was unregistered keeps the action away from the users WordPress does not register it for:

```php
add_action( 'wp_entity_actions_api_init', function () {
	$removed = wp_unregister_entity_actions( 'postType', 'page', array( 'move-to-trash' ) );
	if ( ! $removed ) {
		return;
	}
	wp_register_entity_actions(
		'acme',
		'postType',
		'page',
		array(
			array_merge(
				$removed[0],
				array( 'label' => __( 'Move to the bin…', 'acme' ) )
			),
		),
		'@wordpress/actions/post_type_supports'
	);
} );
```

The actions are shown in registration order, so an action registered again moves to the end of the actions of the entity. A property the script module provides takes precedence over the one registered in PHP: the label of `view-post-revisions`, which shows the number of revisions, comes from its module.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
