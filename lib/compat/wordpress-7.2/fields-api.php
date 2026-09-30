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
 * Returns the fields of a collection of the fields WordPress core registers.
 *
 * The collections are in packages/core-fields/src, copied to
 * build/scripts/core-fields by the build. A collection holds a folder per
 * field, whose `field.php` returns the serializable part of the field, and an
 * `index.php` registering the fields for the entities they apply to on the
 * `fields_api_init` action. The Gutenberg plugin loads the `index.php` of each
 * collection, see lib/load.php.
 *
 * The JavaScript parts of the fields, if any, are in `<field>/field.tsx`, and
 * the `index.ts` of the collection gathers them in the
 * `@wordpress/core-fields/<collection>` script module, which the `index.php`
 * registers along with the fields.
 *
 * @param string $directory The directory of the collection.
 * @return array<string, array> The fields of the collection, keyed by id, in
 *                              the alphabetical order of their folders. The
 *                              id of a field is the name of its folder,
 *                              unless its `field.php` sets an `id`, and it
 *                              comes first in the field.
 */
function gutenberg_get_field_collection_fields( $directory ) {
	$files = glob( $directory . '/*/field.php' );
	if ( empty( $files ) ) {
		return array();
	}
	sort( $files, SORT_STRING );

	$fields = array();
	foreach ( $files as $file ) {
		$field = require $file;
		if ( ! is_array( $field ) ) {
			continue;
		}
		// The id comes first, like in the fields registered directly.
		$field                  = array_merge( array( 'id' => basename( dirname( $file ) ) ), $field );
		$fields[ $field['id'] ] = $field;
	}

	return $fields;
}
