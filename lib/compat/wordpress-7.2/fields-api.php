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
 * Fields are registered on the `wp_fields_api_init` action, and only there, on the
 * registry its callbacks receive, see
 * {@see Gutenberg_Fields_Registry::register()},
 * {@see Gutenberg_Fields_Registry::update()}, and
 * {@see Gutenberg_Fields_Registry::unregister()}. The functions below read the
 * registry.
 *
 * Fields can also be declared as files, grouped in a field collection, which
 * a `wp_fields_api_init` callback registers with
 * {@see gutenberg_register_field_collection()}. A collection is for a single
 * entity. WordPress core registers its own fields this way, from
 * packages/core-fields: the defaults every post type derives from its
 * supports in code, the fields of single post types as collections.
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
 * Reading the registry fires `wp_fields_api_init`, so the fields and their
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
remove_action( 'admin_footer', '_wp_add_field_modules_to_editor_script' );
add_action( 'admin_footer', '_gutenberg_add_field_modules_to_editor_script' );

/**
 * Returns the fields of a field collection.
 *
 * A collection holds a folder per field, whose `field.php` returns the
 * serializable part of the field, see
 * {@see gutenberg_register_field_collection()}.
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

/**
 * Reads and validates a field collection, see
 * {@see gutenberg_register_field_collection()} for its format.
 *
 * An invalid configuration is reported with _doing_it_wrong(): the
 * collection is skipped.
 *
 * @param string $directory The directory of the collection.
 * @return array|null The configuration of the collection, with the `module`
 *                    key set and its `fields` as a list, or null when the
 *                    configuration is invalid.
 */
function _gutenberg_get_field_collection( $directory ) {
	$slug   = basename( $directory );
	$file   = $directory . '/index.php';
	$config = is_file( $file ) ? require $file : null;
	$error  = null;

	if ( ! is_array( $config ) ) {
		$error = __( 'The `index.php` of a field collection must return an array.', 'gutenberg' );
	} elseif ( ! isset( $config['origin'] ) || ! is_string( $config['origin'] ) || '' === $config['origin'] ) {
		$error = __( 'The `origin` of a field collection must be a non-empty string.', 'gutenberg' );
	} elseif ( ! isset( $config['kind'] ) || ! is_string( $config['kind'] ) || '' === $config['kind'] ) {
		$error = __( 'The `kind` of a field collection must be a non-empty string.', 'gutenberg' );
	} elseif ( ! isset( $config['name'] ) || ! is_string( $config['name'] ) || '' === $config['name'] ) {
		$error = __( 'The `name` of a field collection must be a non-empty string.', 'gutenberg' );
	} elseif ( isset( $config['module'] ) && ( ! is_string( $config['module'] ) || '' === $config['module'] ) ) {
		$error = __( 'The `module` of a field collection must be the id of a script module.', 'gutenberg' );
	}

	if ( null !== $error ) {
		_doing_it_wrong(
			'gutenberg_register_field_collection',
			/* translators: 1: The name of a field collection. 2: The error. */
			sprintf( __( 'The field collection "%1$s" is skipped. %2$s', 'gutenberg' ), $slug, $error ),
			'7.2.0'
		);
		return null;
	}

	return array_merge(
		$config,
		array(
			'module' => $config['module'] ?? null,
			'fields' => array_values( gutenberg_get_field_collection_fields( $directory ) ),
		)
	);
}

/**
 * Registers the fields of a field collection.
 *
 * A collection is a folder whose `index.php` returns its configuration, with
 * a folder per field whose `field.php` returns the serializable part of the
 * field (see {@see gutenberg_get_field_collection_fields()}). The
 * JavaScript parts of the fields, if any, ship in the script module of the
 * collection. The configuration is an array with these keys:
 *
 * - `origin` (required): who registers the fields: `core`, or the slug of
 *   the plugin or theme. See {@see Gutenberg_Fields_Registry::register()}.
 * - `kind` (required): the entity kind, e.g. `postType`.
 * - `name` (required): the entity name, e.g. `wp_template`.
 * - `module` (optional): the id of the script module providing the
 *   JavaScript parts of the fields. Every field of the collection is
 *   registered with it.
 *
 * The collection registers its fields on the entity, after the fields
 * registered on it before, in the alphabetical order of their folders. The
 * registry skips a field already registered for the entity, and registers
 * the rest of the collection. Like the
 * registry, it does not check that the entity exists: the `/wp/v2/fields`
 * route only serves the fields of the entities the REST API exposes.
 *
 * Fields that apply to several entities, such as the defaults every post
 * type derives from its supports, are registered in code: a
 * `wp_fields_api_init` callback can read their definitions from files with
 * {@see gutenberg_get_field_collection_fields()} and register them on each
 * entity with {@see Gutenberg_Fields_Registry::register()}.
 *
 * It must be called on the `wp_fields_api_init` action, with the registry its
 * callbacks receive. An invalid configuration is reported with
 * _doing_it_wrong() and skipped.
 *
 * @since 7.2.0
 *
 * @param Gutenberg_Fields_Registry $registry  The registry, as received by
 *                                             the `wp_fields_api_init` action.
 * @param string                    $directory The directory of the
 *                                             collection.
 * @return bool Whether the collection is valid and the registry accepted
 *              all of its fields. True as well when it has no fields.
 */
function gutenberg_register_field_collection( $registry, $directory ) {
	if ( ! $registry instanceof Gutenberg_Fields_Registry ) {
		_doing_it_wrong(
			__FUNCTION__,
			__( 'Field collections are registered on the registry the `wp_fields_api_init` action passes to its callbacks.', 'gutenberg' ),
			'7.2.0'
		);
		return false;
	}

	$collection = _gutenberg_get_field_collection( $directory );
	if ( null === $collection ) {
		return false;
	}

	if ( empty( $collection['fields'] ) ) {
		return true;
	}
	$registered = $registry->register( $collection['origin'], $collection['kind'], $collection['name'], $collection['fields'], $collection['module'] );

	return count( $registered ) === count( $collection['fields'] );
}
