<?php
/**
 * Entity fields API.
 *
 * A field definition is the serializable subset of the DataViews Field API:
 * every property that is plain data (`id`, `type`, `label`, `elements`,
 * `filterBy`, `isValid`, …). Properties that are JavaScript callbacks or
 * components (`render`, `Edit` as a component, `getValue`, `setValue`, `sort`,
 * `isVisible`, `getElements`, …) cannot be declared here. They are provided by
 * a script module registered for the entity along with its fields: its default
 * export maps field ids to the properties of each field that are JavaScript. An
 * entity can have several modules. Each module applies to the fields it was
 * registered with, see {@see gutenberg_get_registered_field_modules()}.
 *
 * Fields are registered on the `fields_api_init` action, and only there, on the
 * registry its callbacks receive, see
 * {@see Gutenberg_Fields_Registry::register()},
 * {@see Gutenberg_Fields_Registry::update()}, and
 * {@see Gutenberg_Fields_Registry::unregister()}. The functions below read the
 * registry.
 *
 * @package gutenberg
 */

/**
 * Returns the fields registered for the given entity.
 *
 * @param string $kind The entity kind (e.g. `postType`).
 * @param string $name The entity name (e.g. `page`).
 * @return array[] The list of registered field definitions, in registration
 *                 order. Empty until the `init` action has completed: a
 *                 read before then is refused.
 */
function gutenberg_get_registered_fields( $kind, $name ) {
	return Gutenberg_Fields_Registry::get_instance()->get_registered( $kind, $name );
}

/**
 * Returns the ids of the script modules registered for the given entity.
 *
 * @param string $kind The entity kind (e.g. `postType`).
 * @param string $name The entity name (e.g. `page`).
 * @return array<string, string[]> The ids of the fields each module applies
 *                                 to, keyed by module id, in registration
 *                                 order. Empty until the `init` action has
 *                                 completed: a read before then is refused.
 */
function gutenberg_get_registered_field_modules( $kind, $name ) {
	return Gutenberg_Fields_Registry::get_instance()->get_registered_field_modules( $kind, $name );
}

/**
 * Returns the ids of all script modules registered for any entity.
 *
 * @return array<string, array<string, string[]>> The lists of module ids,
 *                                                keyed by kind, then by
 *                                                name. Empty until the
 *                                                `init` action has
 *                                                completed: a read before
 *                                                then is refused.
 */
function gutenberg_get_all_registered_field_modules() {
	return Gutenberg_Fields_Registry::get_instance()->get_all_registered_field_modules();
}

/**
 * Declares the script modules of the entity fields as dependencies of the
 * editor script.
 *
 * The editor imports the script modules of an entity on demand, with a dynamic
 * `import()` the browser resolves through the import map of the page. Listing
 * the modules as dynamic `module_dependencies` of the `wp-editor` script adds
 * them to the import map of every page that loads the editor script: the post
 * editor, the site editor, and the pages booted by `@wordpress/boot`, whose
 * prerequisites depend on it. A dynamic dependency is only listed in the
 * import map; the module is fetched when it is imported.
 *
 * Reading the registry fires `fields_api_init`, so the fields and their
 * script modules are registered on demand. It only reads the registry on the
 * pages that load the editor script, not on every admin request (heartbeat,
 * Ajax, other screens). It runs on `admin_footer`, the last action before the
 * import map is printed that fires both in the admin template and in the pages
 * rendered outside it, which print the import map themselves. By then `init`
 * has completed, so the supports the default fields derive from are final.
 * The registry only accepts registrations while the action fires, so the
 * modules declared here are the modules of every field the page can show.
 *
 * When called by the `admin_footer` action, `$scripts` is the hook suffix of
 * the page and the global registry is used. In other scenarios (tests), the
 * scripts are given directly.
 *
 * @param WP_Scripts|null $scripts The scripts registry. Defaults to the global one.
 */
function _gutenberg_add_field_modules_to_editor_script( $scripts = null ) {
	if ( ! $scripts instanceof WP_Scripts ) {
		$scripts = wp_scripts();
	}

	// Field registration as well as actions live in packages/editor/src/dataviews/store/private-actions.ts
	// which means any screen that wants to use this mechanism needs to load the editor script.
	if ( ! $scripts->query( 'wp-editor', 'enqueued' ) && ! $scripts->query( 'wp-editor', 'done' ) ) {
		return;
	}

	$kinds = gutenberg_get_all_registered_field_modules();
	if ( empty( $kinds ) ) {
		return;
	}

	$dependencies = $scripts->get_data( 'wp-editor', 'module_dependencies' );
	$dependencies = is_array( $dependencies ) ? $dependencies : array();

	$declared = array();
	foreach ( $dependencies as $dependency ) {
		$declared[] = is_array( $dependency ) ? $dependency['id'] : $dependency;
	}

	$added = false;
	foreach ( $kinds as $entities ) {
		foreach ( $entities as $modules ) {
			foreach ( $modules as $module ) {
				if ( ! in_array( $module, $declared, true ) ) {
					$dependencies[] = array(
						'id'     => $module,
						'import' => 'dynamic',
					);
					$declared[]     = $module;
					$added          = true;
				}
			}
		}
	}

	if ( $added ) {
		// `add_data()` replaces the value, hence the merge above.
		$scripts->add_data( 'wp-editor', 'module_dependencies', $dependencies );
	}
}
add_action( 'admin_footer', '_gutenberg_add_field_modules_to_editor_script' );

/**
 * Returns the post types whose fields the screen of the site editor being
 * loaded lists, from its `p` query arg.
 *
 * The screens are the routes in
 * packages/edit-site/src/components/site-editor-routes: the lists and the
 * editors of pages, templates, patterns, and template parts. The patterns
 * screen lists both patterns and template parts.
 *
 * @return string[] The post types, empty for any other screen.
 */
function _gutenberg_get_site_editor_screen_post_types() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks what to preload.
	$path     = isset( $_GET['p'] ) && is_string( $_GET['p'] ) ? sanitize_text_field( wp_unslash( $_GET['p'] ) ) : '';
	$segments = explode( '/', trim( $path, '/' ) );

	switch ( $segments[0] ) {
		case 'page':
			return array( 'page' );
		case 'template':
		case 'wp_template':
			return array( 'wp_template' );
		case 'pattern':
			return array( 'wp_block', 'wp_template_part' );
		case 'wp_block':
			return array( 'wp_block' );
		case 'wp_template_part':
			return array( 'wp_template_part' );
	}
	return array();
}

/**
 * Preloads the fields of the post types the post editor or the site editor
 * lists.
 *
 * Both editors read them from the `wp/v2/fields` route before they can list
 * the post fields, see `registerPostTypeSchema` in
 * packages/editor/src/dataviews/store/private-actions.ts. The post editor
 * reads the fields of the edited post type; the site editor those of the
 * edited post, if any, and of the post types of the screen it opens on. The
 * path must match the request of the `getFieldsConfig` core data resolver.
 *
 * @param array                   $paths   REST API paths to preload.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array Filtered preload paths.
 */
function _gutenberg_preload_entity_fields( $paths, $context ) {
	$post_types = array();
	if ( 'core/edit-post' === $context->name && isset( $context->post ) ) {
		$post_types[] = $context->post->post_type;
	} elseif ( 'core/edit-site' === $context->name ) {
		if ( isset( $context->post ) ) {
			$post_types[] = $context->post->post_type;
		}
		$post_types = array_merge( $post_types, _gutenberg_get_site_editor_screen_post_types() );
	}

	foreach ( array_unique( $post_types ) as $post_type ) {
		if ( ! post_type_exists( $post_type ) ) {
			continue;
		}
		$paths[] = add_query_arg(
			array(
				'kind' => 'postType',
				'name' => $post_type,
			),
			'/wp/v2/fields'
		);
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', '_gutenberg_preload_entity_fields', 10, 2 );

/**
 * Registers a collection of the fields WordPress core registers, from
 * packages/core-fields/src/<collection>, copied to
 * build/scripts/core-fields/<collection> by the build.
 *
 * A collection holds a folder per field and an `index.php`:
 *
 * - `<field>/field.php` returns the serializable part of the field. Its id is
 *   the name of the folder, unless the file sets an `id`. The fields are in
 *   the alphabetical order of their folders.
 * - `index.php` returns the function placing the fields: it receives the
 *   registry, the fields of the collection, and the id of the script module
 *   of the collection, and registers each field for the entities it applies
 *   to.
 *
 * The JavaScript parts of the fields, if any, are in `<field>/field.tsx`, and
 * the `index.ts` of the collection gathers them in the
 * `@wordpress/core-fields/<collection>` script module. Only the collections
 * that have one pass `$has_script_module`.
 *
 * @param Gutenberg_Fields_Registry $registry          The registry being read.
 * @param string                    $collection        The name of the collection, e.g. `post_supports`.
 * @param bool                      $has_script_module Whether the collection has a script module.
 * @param string|null               $directory         The directory of the collections. Defaults to
 *                                                     the build output of the package.
 * @return bool Whether the collection was found.
 */
function _gutenberg_register_core_fields_collection( Gutenberg_Fields_Registry $registry, $collection, $has_script_module, $directory = null ) {
	$directory = ( $directory ?? __DIR__ . '/../../../build/scripts/core-fields' ) . '/' . $collection;
	if ( ! is_dir( $directory ) || ! is_file( $directory . '/index.php' ) ) {
		return false;
	}

	$files = glob( $directory . '/*/field.php' );
	sort( $files, SORT_STRING );

	$fields = array();
	foreach ( $files as $file ) {
		$field = require $file;
		if ( ! is_array( $field ) ) {
			continue;
		}
		// The id comes first, like in the fields registered directly.
		$fields[] = array_merge( array( 'id' => basename( dirname( $file ) ) ), $field );
	}

	$place = require $directory . '/index.php';
	$place( $registry, $fields, $has_script_module ? '@wordpress/core-fields/' . $collection : null );

	return true;
}

/**
 * Registers the default fields of every post type exposed in the REST API.
 *
 * These are the fields ported to the server so far; the editor still derives
 * the rest client-side in packages/editor/src/dataviews/store/private-actions.ts
 * and merges these into them. They are the `post_supports` collection, see
 * packages/core-fields/src/post_supports: which post type gets which field
 * depends on its supports. The JavaScript parts of the fields that have any
 * (the author field: its render component, elements, value setter, and
 * visibility) ship in the `@wordpress/core-fields/post_supports` script
 * module, registered along with the field.
 *
 * The fields depend on the supports of the post type, which are not final
 * until `init` completes: core registers its post types on `init` at
 * priority 0, see
 * https://github.com/WordPress/wordpress-develop/blob/b528aeff3b96f089993c17f6dfb3d7aa96433a8b/src/wp-includes/default-filters.php#L592,
 * custom post types are usually registered at the default priority (10),
 * and plugins add or remove supports on `init` too, with
 * add_post_type_support() and remove_post_type_support(). Hence it runs on
 * `fields_api_init`, which the registry fires on its first read, after
 * `init`: while handling a REST request, or on `admin_footer` when the page
 * loads the editor script. At priority 0, so a plugin altering the defaults on
 * the registry at the default priority sees them registered.
 *
 * The post types whose fields differ from the defaults derived from their
 * supports (templates, attachments) adjust them in their own step, hooked
 * to the same action at priority 9, right after this one.
 *
 * @param Gutenberg_Fields_Registry $registry The registry being read.
 */
function _gutenberg_register_posttype_supports_fields( Gutenberg_Fields_Registry $registry ) {
	_gutenberg_register_core_fields_collection( $registry, 'post_supports', true );
}
add_action( 'fields_api_init', '_gutenberg_register_posttype_supports_fields', 0 );

/**
 * Adjusts the default fields of templates.
 *
 * Templates support authors, so they get the default author field like any
 * other post type. Yet they have their own author field, declared
 * client-side in packages/fields/src/fields/template-author/index.tsx, which
 * reads the theme or plugin that provides them instead of the post author.
 *
 * It runs right after the default fields are registered, on
 * `fields_api_init` at priority 9, so a plugin hooking the action at
 * the default priority sees the final defaults.
 *
 * @param Gutenberg_Fields_Registry $registry The registry being read.
 */
function _gutenberg_register_posttype_wp_template_fields( Gutenberg_Fields_Registry $registry ) {
	$registry->unregister( 'postType', 'wp_template', array( 'author' ) );
}
add_action( 'fields_api_init', '_gutenberg_register_posttype_wp_template_fields', 9 );

/**
 * Adjusts the default fields of template parts.
 *
 * Template parts support authors, so they get the default author field like
 * any other post type. Yet they have their own author field, declared
 * client-side in packages/fields/src/fields/template-author/index.tsx, which
 * reads the theme or plugin that provides them instead of the post author.
 *
 * It runs right after the default fields are registered, on
 * `fields_api_init` at priority 9, so a plugin hooking the action at
 * the default priority sees the final defaults.
 *
 * @param Gutenberg_Fields_Registry $registry The registry being read.
 */
function _gutenberg_register_posttype_wp_template_part_fields( Gutenberg_Fields_Registry $registry ) {
	$registry->unregister( 'postType', 'wp_template_part', array( 'author' ) );
}
add_action( 'fields_api_init', '_gutenberg_register_posttype_wp_template_part_fields', 9 );

/**
 * Replaces the default fields of attachments with the media fields.
 *
 * Attachments support authors and comments, so they get the default author
 * and comment status fields like any other post type. Yet the media editor
 * shows its own set of fields, declared client-side in
 * packages/media-fields/src, none of which is a default one. The fields
 * registered by `core` are replaced with the `attachment` collection, see
 * packages/core-fields/src/attachment: the media fields ported to the server
 * so far. They are plain data, so the collection has no script module.
 * Fields registered by plugins in between are kept.
 *
 * It runs right after the default fields are registered, on
 * `fields_api_init` at priority 9, so a plugin hooking the action at
 * the default priority sees the final defaults.
 *
 * @param Gutenberg_Fields_Registry $registry The registry being read.
 */
function _gutenberg_register_posttype_attachment_fields( Gutenberg_Fields_Registry $registry ) {
	_gutenberg_register_core_fields_collection( $registry, 'attachment', false );
}
add_action( 'fields_api_init', '_gutenberg_register_posttype_attachment_fields', 9 );
