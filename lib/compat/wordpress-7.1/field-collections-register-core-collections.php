<?php
/**
 * Register core field collections.
 *
 * Core field collections are collocated with their script modules under
 * `packages/fields/src/collections/<collection>/`: the serializable field
 * definitions live in a self-registering `fields.php`, the non-serializable
 * extensions in the neighboring `extensions.ts`. The build copies each `fields.php`
 * to `build/scripts/fields/collections/<collection>/fields.php` (see the
 * `wpCopyFiles` config in `packages/fields/package.json`), where this loader
 * picks them up — mirroring how `gutenberg_reregister_core_block_types()`
 * loads block PHP from `build/scripts/block-library/`.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers the core field collections from the built `fields` package.
 *
 * Runs on `init` so that the `__()` calls in the collection files do not
 * trigger just-in-time translation loading before translations are available,
 * and ahead of both consumers of the registry: the REST controller
 * (`rest_api_init`) and the script modules loader (`admin_enqueue_scripts`).
 */
function gutenberg_register_core_field_collections() {
	$collection_files = glob( dirname( __DIR__, 3 ) . '/build/scripts/fields/collections/*/fields.php' );
	if ( empty( $collection_files ) ) {
		return;
	}

	foreach ( $collection_files as $collection_file ) {
		require_once $collection_file;
	}
}
add_action( 'init', 'gutenberg_register_core_field_collections' );
