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
	/**
	* Start: Include for phase 2
	*/
	if ( ! class_exists( 'WP_REST_Widget_Updater_Controller' ) ) {
		require dirname( __FILE__ ) . '/class-wp-rest-widget-updater-controller.php';
	}
	/**
	* End: Include for phase 2
	*/
	require dirname( __FILE__ ) . '/rest-api.php';
}

require dirname( __FILE__ ) . '/client-assets.php';
require dirname( __FILE__ ) . '/i18n.php';
require dirname( __FILE__ ) . '/demo.php';
require dirname( __FILE__ ) . '/widgets.php';
require dirname( __FILE__ ) . '/widgets-page.php';

/**
 * Unregisters the core set of blocks. This should occur on the default
 * priority, immediately prior to Gutenberg's own action binding.
 */
function gutenberg_unregister_core_block_types() {
	$registry    = WP_Block_Type_Registry::get_instance();
	$block_names = array(
		'core/archives',
		'core/block',
		'core/calendar',
		'core/categories',
		'core/latest-comments',
		'core/latest-posts',
		'core/legacy-widget',
		'core/rss',
		'core/shortcode',
		'core/search',
		'core/tag-cloud',
	);

	foreach ( $block_names as $block_name ) {
		if ( $registry->is_registered( $block_name ) ) {
			$registry->unregister( $block_name );
		}
	}
}

if ( file_exists( dirname( __FILE__ ) . '/../build/block-library/blocks' ) ) {
	add_action( 'init', 'gutenberg_unregister_core_block_types' );

	require dirname( __FILE__ ) . '/../build/block-library/blocks/archives.php';
	require dirname( __FILE__ ) . '/../build/block-library/blocks/block.php';
	require dirname( __FILE__ ) . '/../build/block-library/blocks/calendar.php';
	require dirname( __FILE__ ) . '/../build/block-library/blocks/categories.php';
	require dirname( __FILE__ ) . '/../build/block-library/blocks/latest-comments.php';
	require dirname( __FILE__ ) . '/../build/block-library/blocks/latest-posts.php';
	require dirname( __FILE__ ) . '/../build/block-library/blocks/legacy-widget.php';
	require dirname( __FILE__ ) . '/../build/block-library/blocks/rss.php';
	require dirname( __FILE__ ) . '/../build/block-library/blocks/shortcode.php';
	require dirname( __FILE__ ) . '/../build/block-library/blocks/search.php';
	require dirname( __FILE__ ) . '/../build/block-library/blocks/tag-cloud.php';
}
