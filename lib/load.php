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
	if ( ! class_exists( 'WP_REST_Widget_Areas_Controller' ) ) {
		require dirname( __FILE__ ) . '/class-experimental-wp-widget-blocks-manager.php';
		require dirname( __FILE__ ) . '/class-wp-rest-widget-areas-controller.php';
	}
	/**
	* End: Include for phase 2
	*/
	require dirname( __FILE__ ) . '/rest-api.php';
}

require dirname( __FILE__ ) . '/compat.php';
require dirname( __FILE__ ) . '/class-wp-block-styles-registry.php';
require dirname( __FILE__ ) . '/blocks.php';
require dirname( __FILE__ ) . '/client-assets.php';
require dirname( __FILE__ ) . '/demo.php';
require dirname( __FILE__ ) . '/widgets.php';
require dirname( __FILE__ ) . '/widgets-page.php';
require dirname( __FILE__ ) . '/customizer.php';
