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
