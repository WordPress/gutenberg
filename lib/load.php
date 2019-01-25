<?php
/**
 * Load API functions, register scripts and actions, etc.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

// These files only need to be loaded if within a rest server instance
// which this class will exist if that is the case.
if ( class_exists( 'WP_REST_Controller' ) ) {
	require dirname( __FILE__ ) . '/rest-api.php';
}

require dirname( __FILE__ ) . '/meta-box-partial-page.php';
require dirname( __FILE__ ) . '/blocks.php';
require dirname( __FILE__ ) . '/client-assets.php';
require dirname( __FILE__ ) . '/compat.php';
require dirname( __FILE__ ) . '/plugin-compat.php';
require dirname( __FILE__ ) . '/i18n.php';
require dirname( __FILE__ ) . '/register.php';


// Register server-side code for individual blocks.
if ( ! function_exists( 'render_block_core_archives' ) ) {
	require dirname( __FILE__ ) . '/../packages/block-library/src/archives/index.php';
}
if ( ! function_exists( 'render_block_core_block' ) ) {
	require dirname( __FILE__ ) . '/../packages/block-library/src/block/index.php';
}
if ( ! function_exists( 'render_block_core_categories' ) ) {
	require dirname( __FILE__ ) . '/../packages/block-library/src/categories/index.php';
}
// Currently merged in core as `gutenberg_render_block_core_latest_comments`,
// expected to change soon.
if ( ! function_exists( 'render_block_core_latest_comments' )
	&& ! function_exists( 'gutenberg_render_block_core_latest_comments' ) ) {
	require dirname( __FILE__ ) . '/../packages/block-library/src/latest-comments/index.php';
}
if ( ! function_exists( 'render_block_core_latest_posts' ) ) {
	require dirname( __FILE__ ) . '/../packages/block-library/src/latest-posts/index.php';
}
if ( ! function_exists( 'render_block_core_rss' ) ) {
	require dirname( __FILE__ ) . '/../packages/block-library/src/rss/index.php';
}
if ( ! function_exists( 'render_block_core_shortcode' ) ) {
	require dirname( __FILE__ ) . '/../packages/block-library/src/shortcode/index.php';
}
