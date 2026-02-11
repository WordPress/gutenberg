<?php
/**
 * Content Guidelines experimental feature.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

require_once __DIR__ . '/class-gutenberg-content-guidelines-post-type.php';
require_once __DIR__ . '/class-gutenberg-content-guidelines-rest-controller.php';
require_once __DIR__ . '/class-gutenberg-content-guidelines-admin-page.php';

// Register CPT.
add_action( 'init', array( 'Gutenberg_Content_Guidelines_Post_Type', 'register' ) );

// Register post meta with revision support (must run after CPT registration).
add_action( 'init', array( 'Gutenberg_Content_Guidelines_Post_Type', 'register_post_meta' ), 20 );

// Register REST routes.
add_action(
	'rest_api_init',
	function () {
		$controller = new Gutenberg_Content_Guidelines_REST_Controller();
		$controller->register_routes();
	}
);

// Register admin page.
add_action( 'admin_menu', array( 'Gutenberg_Content_Guidelines_Admin_Page', 'register_menu' ) );
add_action( 'admin_enqueue_scripts', array( 'Gutenberg_Content_Guidelines_Admin_Page', 'enqueue_scripts' ) );

/**
 * Add block guideline meta keys to the list of revisioned meta.
 *
 * This allows block-specific guidelines to be captured in revisions
 * without needing to register each meta key individually.
 *
 * @param array $keys The meta keys to revision.
 * @return array Modified meta keys.
 */
function gutenberg_content_guidelines_revision_meta_keys( $keys ) {
	global $wpdb;

	// Get all unique block guideline meta keys from the database.
	$block_keys = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT DISTINCT meta_key FROM $wpdb->postmeta WHERE meta_key LIKE %s",
			$wpdb->esc_like( Gutenberg_Content_Guidelines_Post_Type::BLOCK_META_PREFIX ) . '%'
		)
	);

	return array_unique( array_merge( $keys, $block_keys ) );
}
add_filter( 'wp_post_revision_meta_keys', 'gutenberg_content_guidelines_revision_meta_keys' );

