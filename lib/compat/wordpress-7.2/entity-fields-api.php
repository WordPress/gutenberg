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
 * registered with, see {@see wp_get_registered_entity_field_modules()}.
 *
 * Fields are registered on the `wp_entity_fields_api_init` action, and only there,
 * with {@see wp_register_entity_fields()}, {@see wp_update_entity_fields()}, and
 * {@see wp_unregister_entity_fields()}. The other functions read the registry.
 *
 * Fields can also be declared as files, grouped in a field collection, which
 * a `wp_entity_fields_api_init` callback registers with
 * {@see wp_register_entity_field_collection()}. A collection is for a single
 * entity. WordPress core registers its own fields this way, from
 * packages/core-fields: the defaults every post type derives from its
 * supports in code, the fields of single post types as collections.
 *
 * The functions are defined when core does not ship them. When it does, the
 * core functions read the plugin registry, which replaces the core one on
 * `init`, see {@see WP_Entity_Fields_Registry_Gutenberg}.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_register_entity_fields' ) ) {
	/**
	 * Registers fields for an entity, see
	 * {@see WP_Entity_Fields_Registry::register()}.
	 *
	 * It only runs on the `wp_entity_fields_api_init` action.
	 *
	 * @since 7.2.0
	 *
	 * @param string      $origin        Who registers the fields: `core`, or
	 *                                   the slug of the plugin or theme.
	 * @param string      $kind          The entity kind (e.g. `postType`).
	 * @param string      $name          The entity name (e.g. `page`).
	 * @param array[]     $fields        The list of field definitions, each with an `id`.
	 * @param string|null $script_module The id of the script module providing
	 *                                   the JavaScript parts of the fields, if any.
	 * @return string[] The ids of the fields registered, in the order of the
	 *                  call. Empty when none is.
	 */
	function wp_register_entity_fields( $origin, $kind, $name, $fields, $script_module = null ) {
		return WP_Entity_Fields_Registry::get_instance()->register( $origin, $kind, $name, $fields, $script_module );
	}
}

if ( ! function_exists( 'wp_update_entity_fields' ) ) {
	/**
	 * Updates registered fields of an entity, see
	 * {@see WP_Entity_Fields_Registry::update()}.
	 *
	 * It only runs on the `wp_entity_fields_api_init` action.
	 *
	 * @since 7.2.0
	 *
	 * @param string      $origin        Who updates the fields: `core`, or
	 *                                   the slug of the plugin or theme.
	 * @param string      $kind          The entity kind (e.g. `postType`).
	 * @param string      $name          The entity name (e.g. `page`).
	 * @param array[]     $fields        The list of partial field definitions,
	 *                                   each with the `id` of a registered field.
	 * @param string|null $script_module The id of the script module providing
	 *                                   the JavaScript parts of the fields, if any.
	 * @return string[] The ids of the fields updated, in the order of the
	 *                  call. Empty when none is.
	 */
	function wp_update_entity_fields( $origin, $kind, $name, $fields, $script_module = null ) {
		return WP_Entity_Fields_Registry::get_instance()->update( $origin, $kind, $name, $fields, $script_module );
	}
}

if ( ! function_exists( 'wp_unregister_entity_fields' ) ) {
	/**
	 * Unregisters fields of an entity, see
	 * {@see WP_Entity_Fields_Registry::unregister()}.
	 *
	 * It only runs on the `wp_entity_fields_api_init` action.
	 *
	 * @since 7.2.0
	 *
	 * @param string        $kind The entity kind (e.g. `postType`).
	 * @param string        $name The entity name (e.g. `page`).
	 * @param string[]|null $ids  The ids of the fields to unregister. Default
	 *                            null, every field of the entity.
	 * @return array[] The list of the definitions unregistered, in
	 *                 registration order. Empty when none is.
	 */
	function wp_unregister_entity_fields( $kind, $name, $ids = null ) {
		return WP_Entity_Fields_Registry::get_instance()->unregister( $kind, $name, $ids );
	}
}

if ( ! function_exists( 'wp_get_registered_entity_fields' ) ) {
	/**
	 * Returns the fields registered for the given entity.
	 *
	 * @param string $kind The entity kind (e.g. `postType`).
	 * @param string $name The entity name (e.g. `page`).
	 * @return array[] The list of registered field definitions, in registration
	 *                 order. Empty until the `init` action has completed: a
	 *                 read before then is refused.
	 */
	function wp_get_registered_entity_fields( $kind, $name ) {
		return WP_Entity_Fields_Registry::get_instance()->get_registered( $kind, $name );
	}
}

if ( ! function_exists( 'wp_get_registered_entity_field_modules' ) ) {
	/**
	 * Returns the script modules registered for the given entity.
	 *
	 * @param string $kind The entity kind (e.g. `postType`).
	 * @param string $name The entity name (e.g. `page`).
	 * @return array[] {
	 *     The script modules, in registration order. Empty until the `init`
	 *     action has completed: a read before then is refused.
	 *
	 *     @type array ...$0 {
	 *         @type string   $id     The id of the script module.
	 *         @type string[] $fields The ids of the fields the module applies
	 *                                to, in registration order.
	 *     }
	 * }
	 */
	function wp_get_registered_entity_field_modules( $kind, $name ) {
		return WP_Entity_Fields_Registry::get_instance()->get_registered_field_modules( $kind, $name );
	}
}

if ( ! function_exists( 'wp_get_all_registered_entity_field_modules' ) ) {
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
	function wp_get_all_registered_entity_field_modules() {
		return WP_Entity_Fields_Registry::get_instance()->get_all_registered_field_modules();
	}
}

if ( ! function_exists( '_wp_add_entity_field_modules_to_editor_script' ) ) {
	/**
	 * Declares the script modules of the entity fields as dependencies of the
	 * editor script, see _wp_add_entity_modules_to_editor_script().
	 *
	 * The fields are loaded by the editor package, see
	 * packages/editor/src/dataviews/store/private-resolvers.ts, which means any
	 * screen that wants to use this mechanism needs to load the editor script.
	 *
	 * When called by the `admin_footer` action, `$scripts` is the hook suffix of
	 * the page and the global registry is used. In other scenarios (tests), the
	 * scripts are given directly.
	 *
	 * @param WP_Scripts|null $scripts The scripts registry. Defaults to the global one.
	 */
	function _wp_add_entity_field_modules_to_editor_script( $scripts = null ) {
		_wp_add_entity_modules_to_editor_script( $scripts, 'wp_get_all_registered_entity_field_modules' );
	}
	add_action( 'admin_footer', '_wp_add_entity_field_modules_to_editor_script' );
}

if ( ! function_exists( 'wp_get_entity_field_collection_fields' ) ) {
	/**
	 * Returns the fields of a field collection, see
	 * {@see WP_Entity_Fields_Registry::get_collection_fields()}.
	 *
	 * @param string $directory The directory of the collection.
	 * @return array<string, array> The fields of the collection, keyed by id, in
	 *                              the alphabetical order of their folders.
	 */
	function wp_get_entity_field_collection_fields( $directory ) {
		return WP_Entity_Fields_Registry::get_instance()->get_collection_fields( $directory );
	}
}

if ( ! function_exists( 'wp_register_entity_field_collection' ) ) {
	/**
	 * Registers the fields of a field collection, see
	 * {@see WP_Entity_Fields_Registry::register_collection()} for the format of a
	 * collection.
	 *
	 * Like wp_register_entity_fields(), it only runs on the `wp_entity_fields_api_init`
	 * action.
	 *
	 * @since 7.2.0
	 *
	 * @param string $directory The directory of the collection.
	 * @return bool Whether the collection is valid and all of its fields are
	 *              registered. True as well when it has no fields.
	 */
	function wp_register_entity_field_collection( $directory ) {
		return WP_Entity_Fields_Registry::get_instance()->register_collection( $directory );
	}
}

/**
 * Preloads the fields of the post types the editors list.
 *
 * The editors read them from the `wp/v2/entity-fields` route, see `useFields`
 * in packages/editor/src/dataviews/fields-loader/index.ts. The post editor
 * reads those of the edited post in the post summary of its inspector. The
 * site editor reads those of the edited post, if any, and of the post types of
 * the screen it opens on. A path must match the request of the
 * `getFieldsConfig` core data resolver, see packages/core-data/src/resolvers.js.
 *
 * It replaces `_wp_preload_entity_fields()`, which WordPress versions before
 * core#14716 ship without the guards of _wp_add_entity_preload_paths().
 *
 * @param mixed $paths   REST API paths to preload.
 * @param mixed $context Optional. Block editor context. Default null.
 * @return mixed Filtered preload paths. See _wp_add_entity_preload_paths().
 */
function _gutenberg_preload_entity_fields( $paths, $context = null ) {
	return _wp_add_entity_preload_paths( $paths, $context, '/wp/v2/entity-fields' );
}
remove_filter( 'block_editor_rest_api_preload_paths', '_wp_preload_entity_fields' );
add_filter( 'block_editor_rest_api_preload_paths', '_gutenberg_preload_entity_fields', 10, 2 );
