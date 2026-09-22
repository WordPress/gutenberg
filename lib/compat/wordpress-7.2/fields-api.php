<?php
/**
 * Entity fields API.
 *
 * A field definition is the serializable subset of the DataViews Field API:
 * every property that is plain data (`id`, `type`, `label`, `elements`,
 * `filterBy`, `isValid`, …). Properties that are JavaScript callbacks or
 * components (`render`, `Edit` as a component, `getValue`, `setValue`,
 * `sort`, `isVisible`, `getElements`, …) cannot be declared here. They are
 * provided by a script module registered for the entity along with its
 * fields: its default export maps field ids to the properties of each field
 * that are JavaScript. An entity can have several modules. Each module applies to
 * the fields it was registered with, see gutenberg_get_registered_field_modules().
 *
 * @package gutenberg
 */

/**
 * Registers fields for the given entity.
 *
 * @param string      $kind          The entity kind (e.g. `postType`).
 * @param string      $name          The entity name (e.g. `page`).
 * @param array[]     $fields        The list of field definitions.
 * @param string|null $script_module Optional. The id of the script module
 *                                   providing the JavaScript parts of the
 *                                   fields (e.g. `my-plugin/page-fields`),
 *                                   registered with
 *                                   wp_register_script_module().
 * @return bool Whether the fields were registered. False when an argument is
 *              invalid, in which case none of the fields is registered.
 */
function gutenberg_register_fields( $kind, $name, $fields, $script_module = null ) {
	return Gutenberg_Fields_Registry::get_instance()->register( $kind, $name, $fields, $script_module );
}

/**
 * Unregisters fields of the given entity.
 *
 * Without ids, the entity is reset and it no longer has any field or script modules registered.
 *
 * @param string        $kind The entity kind (e.g. `postType`).
 * @param string        $name The entity name (e.g. `page`).
 * @param string[]|null $ids  The ids of the fields to unregister. Default
 *                            null, every field of the entity.
 * @return bool Whether any field was unregistered.
 */
function gutenberg_unregister_fields( $kind, $name, $ids = null ) {
	return Gutenberg_Fields_Registry::get_instance()->unregister( $kind, $name, $ids );
}

/**
 * Returns the fields registered for the given entity.
 *
 * @param string $kind The entity kind (e.g. `postType`).
 * @param string $name The entity name (e.g. `page`).
 * @return array[] The list of registered field definitions, in registration
 *                 order.
 */
function gutenberg_get_registered_fields( $kind, $name ) {
	return Gutenberg_Fields_Registry::get_instance()->get_registered( $kind, $name );
}

/**
 * Returns the ids of the script modules registered for the given entity.
 *
 * @param string $kind The entity kind (e.g. `postType`).
 * @param string $name The entity name (e.g. `page`).
 * @return string[] The module ids, unique and in registration order.
 */
function gutenberg_get_registered_field_modules( $kind, $name ) {
	return Gutenberg_Fields_Registry::get_instance()->get_registered_field_modules( $kind, $name );
}

/**
 * Returns the ids of all script modules registered for any entity.
 *
 * @return string[] The module ids, unique and in registration order.
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
 * It runs early on `admin_init`: after `init`, so the fields and their script
 * modules are registered, and before the pages rendered outside the admin
 * template, which render and exit on `admin_init` at the default priority.
 * A field registered later is not covered.
 *
 * When called by the `admin_init` action, which passes no arguments,
 * `$scripts` is an empty string and the global registry is used.
 * In other scenarios (tests), the scripts are given directly.
 *
 * @param WP_Scripts|null $scripts The scripts registry. Defaults to the global one.
 */
function _gutenberg_add_field_modules_to_editor_script( $scripts = null ) {
	if ( ! $scripts instanceof WP_Scripts ) {
		$scripts = wp_scripts();
	}

	// TODO:
	// Field registration as well as actions live in packages/editor/src/dataviews/store/private-actions.ts
	// which means any screen that wants to use this mechanism needs to load the editor script.
	// This is fine for our current use cases (site editor, post editor), but regular wp-admin screens
	// that want to use the fields API will need to load the editor script as well, which is not ideal.
	if ( ! $scripts->query( 'wp-editor', 'registered' ) ) {
		return;
	}

	$entities = gutenberg_get_all_registered_field_modules();
	if ( empty( $entities ) ) {
		return;
	}

	$dependencies = $scripts->get_data( 'wp-editor', 'module_dependencies' );
	$dependencies = is_array( $dependencies ) ? $dependencies : array();

	$declared = array();
	foreach ( $dependencies as $dependency ) {
		$declared[] = is_array( $dependency ) ? $dependency['id'] : $dependency;
	}

	$added = false;
	foreach ( $entities as $modules ) {
		foreach ( $modules as $module ) {
			if ( ! in_array( $module, $declared, true ) ) {
				$dependencies[] = array(
					'id'      => $module,
					'dynamic' => true,
				);
				$declared[]     = $module;
				$added          = true;
			}
		}
	}

	if ( $added ) {
		// `add_data()` replaces the value, hence the merge above.
		$scripts->add_data( 'wp-editor', 'module_dependencies', $dependencies );
	}
}
add_action( 'admin_init', '_gutenberg_add_field_modules_to_editor_script', 5 );
