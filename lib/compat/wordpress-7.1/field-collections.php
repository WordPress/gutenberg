<?php
/**
 * Field Collections Registration System
 *
 * This file provides the API for registering field collections.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

// Global storage for registered field collections.
global $gutenberg_field_collections;
$gutenberg_field_collections = array();

/**
 * Register a field collection.
 *
 * This function registers a field collection that will be available
 * for specific entities (postType, taxonomy, user, etc.).
 *
 * @since 20.8.0
 *
 * @param string      $id            The collection identifier (e.g., 'core/media-fields').
 * @param string      $kind          The entity kind (postType, taxonomy, user, etc.).
 * @param string|null $name          The entity name (attachment, product, etc.) or null for universal.
 * @param array       $fields        Array of field definitions keyed by field ID.
 * @param string|null $fields_module Optional. Script Module handle providing the collection's
 *                                   non-serializable field extensions, or null. Default null.
 */
function gutenberg_register_field_collection( $id, $kind, $name, $fields, $fields_module = null ) {
	global $gutenberg_field_collections;

	if ( empty( $id ) || empty( $kind ) || empty( $fields ) ) {
		_doing_it_wrong( __FUNCTION__, 'Field collection must have "id", "kind", and "fields".', '20.8.0' );
		return;
	}

	// Check if collection with same ID already exists.
	foreach ( $gutenberg_field_collections as $existing_collection ) {
		if ( $existing_collection['id'] === $id ) {
			return;
		}
	}

	/**
	 * Filters the serializable field definitions of a field collection.
	 *
	 * Lets consumers tailor an auto-registered collection — removing,
	 * reordering, relabeling, or adding fields — without re-registering it.
	 * Fires for every collection, whether registered directly or generated
	 * for a post type from its `supports` (see
	 * `gutenberg_register_default_post_type_field_collections()`).
	 *
	 * Pair with the `gutenberg_field_collection_modules` filter when an added
	 * or changed field needs non-serializable behavior (render, Edit, …).
	 *
	 * @since 20.8.0
	 *
	 * @param array       $fields Array of serializable field definitions.
	 * @param string      $id     The collection identifier.
	 * @param string      $kind   The entity kind (postType, taxonomy, user, etc.).
	 * @param string|null $name   The entity name, or null for universal collections.
	 */
	$fields = apply_filters( 'gutenberg_field_collection_fields', $fields, $id, $kind, $name );

	$fields_modules = $fields_module ? array( $fields_module ) : array();

	/**
	 * Filters the script module handles providing a collection's
	 * non-serializable field extensions.
	 *
	 * Each module's default export is a list of `Partial<Field>` keyed by
	 * field id; the client merges every module in order onto the matching
	 * field, so a later module overrides an earlier one property by property
	 * (last wins). Append a handle here to attach JavaScript behavior to a
	 * field added via the `gutenberg_field_collection_fields` filter, or to
	 * override the behavior of an existing one.
	 *
	 * @since 20.8.0
	 *
	 * @param string[]    $fields_modules Script Module handles, in merge order.
	 * @param string      $id             The collection identifier.
	 * @param string      $kind           The entity kind (postType, taxonomy, user, etc.).
	 * @param string|null $name           The entity name, or null for universal collections.
	 */
	$fields_modules = apply_filters( 'gutenberg_field_collection_modules', $fields_modules, $id, $kind, $name );

	$collection = array(
		'id'             => $id,
		'kind'           => $kind,
		'name'           => $name,
		'fields'         => $fields,
		'fields_modules' => array_values( array_unique( $fields_modules ) ),
	);

	$gutenberg_field_collections[] = $collection;
}

/**
 * Get field collections for a specific entity kind and name.
 *
 * @param string $kind Entity kind (postType, taxonomy, user, etc.).
 * @param string $name Entity name (attachment, product, etc.).
 * @return array Array of matching collections.
 */
function gutenberg_get_field_collections( $kind, $name ) {
	global $gutenberg_field_collections;

	$matching_collections = array();

	foreach ( $gutenberg_field_collections as $collection ) {
		// Must match kind.
		if ( $collection['kind'] !== $kind ) {
			continue;
		}

		// Must match specific name or be universal (collection name is null).
		if ( $collection['name'] === $name || null === $collection['name'] ) {
			$matching_collections[] = $collection;
		}
	}

	return $matching_collections;
}

/**
 * Get all registered field collections.
 *
 * @return array Array of all registered collections.
 */
function gutenberg_get_all_field_collections() {
	global $gutenberg_field_collections;
	return $gutenberg_field_collections ?? array();
}

/**
 * Makes the script modules of registered field collections importable.
 *
 * A script module can only be resolved by `import()` if it is present in the
 * page's import map, and WordPress only prints import map entries for modules
 * reachable from an enqueued module's dependency graph. This re-registers the
 * (intentionally empty) `@wordpress/field-collections/loader` module with
 * every collection's `fields_modules` as dynamic dependencies and enqueues it:
 * the modules land in the import map but are only fetched when
 * `useFieldCollections` dynamically imports them.
 *
 * @see packages/field-collections/src/collections/loader.ts
 */
function gutenberg_enqueue_field_collections_loader() {
	$dependencies = array();
	foreach ( gutenberg_get_all_field_collections() as $collection ) {
		foreach ( $collection['fields_modules'] as $fields_module ) {
			$dependencies[ $fields_module ] = array(
				'id'     => $fields_module,
				'import' => 'dynamic',
			);
		}
	}

	if ( empty( $dependencies ) ) {
		return;
	}

	$loader_id = '@wordpress/field-collections/loader';
	$src       = gutenberg_get_script_module_src( $loader_id );
	if ( null === $src ) {
		return;
	}

	wp_deregister_script_module( $loader_id );
	wp_register_script_module( $loader_id, $src, array_values( $dependencies ) );
	wp_enqueue_script_module( $loader_id );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_enqueue_field_collections_loader' );
