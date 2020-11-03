<?php
/**
 * Load API functions, register scripts and actions, etc.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Checks whether the Gutenberg experiment is enabled.
 *
 * @since 6.7.0
 *
 * @param string $name The name of the experiment.
 *
 * @return bool True when the experiment is enabled.
 */
function gutenberg_is_experiment_enabled( $name ) {
	$experiments = get_option( 'gutenberg-experiments' );
	return ! empty( $experiments[ $name ] );
}

// These files only need to be loaded if within a rest server instance
// which this class will exist if that is the case.
if ( class_exists( 'WP_REST_Controller' ) ) {
	/**
	* Start: Include for phase 2
	*/
	if ( ! class_exists( 'WP_REST_Sidebars_Controller' ) ) {
		require_once dirname( __FILE__ ) . '/class-wp-rest-sidebars-controller.php';
	}
	if ( ! class_exists( 'WP_REST_Widget_Types_Controller' ) ) {
		require_once dirname( __FILE__ ) . '/class-wp-rest-widget-types-controller.php';
	}
	if ( ! class_exists( 'WP_REST_Widgets_Controller' ) ) {
		require_once dirname( __FILE__ ) . '/class-wp-rest-widgets-controller.php';
	}
	if ( ! class_exists( 'WP_REST_Block_Directory_Controller' ) ) {
		require dirname( __FILE__ ) . '/class-wp-rest-block-directory-controller.php';
	}
	if ( ! class_exists( 'WP_REST_Block_Types_Controller' ) ) {
		require dirname( __FILE__ ) . '/class-wp-rest-block-types-controller.php';
	}
	if ( ! class_exists( 'WP_REST_Menus_Controller' ) ) {
		require_once dirname( __FILE__ ) . '/class-wp-rest-menus-controller.php';
	}
	if ( ! class_exists( 'WP_REST_Menu_Items_Controller' ) ) {
		require_once dirname( __FILE__ ) . '/class-wp-rest-menu-items-controller.php';
	}
	if ( ! class_exists( 'WP_REST_Menu_Locations_Controller' ) ) {
		require_once dirname( __FILE__ ) . '/class-wp-rest-menu-locations-controller.php';
	}
	if ( ! class_exists( 'WP_Rest_Customizer_Nonces' ) ) {
		require_once dirname( __FILE__ ) . '/class-wp-rest-customizer-nonces.php';
	}
	if ( ! class_exists( 'WP_REST_Image_Editor_Controller' ) ) {
		require dirname( __FILE__ ) . '/class-wp-rest-image-editor-controller.php';
	}
	if ( ! class_exists( 'WP_REST_Plugins_Controller' ) ) {
		require_once dirname( __FILE__ ) . '/class-wp-rest-plugins-controller.php';
	}
	if ( ! class_exists( 'WP_REST_Post_Format_Search_Handler' ) ) {
		require_once dirname( __FILE__ ) . '/class-wp-rest-post-format-search-handler.php';
	}
	if ( ! class_exists( 'WP_REST_Term_Search_Handler' ) ) {
		require_once dirname( __FILE__ ) . '/class-wp-rest-term-search-handler.php';
	}
	if ( ! class_exists( 'WP_REST_Batch_Controller' ) ) {
		require_once dirname( __FILE__ ) . '/class-wp-rest-batch-controller.php';
	}
	/**
	* End: Include for phase 2
	*/

	require dirname( __FILE__ ) . '/rest-api.php';
}

if ( ! class_exists( 'WP_Block_Patterns_Registry' ) ) {
	require dirname( __FILE__ ) . '/class-wp-block-patterns-registry.php';
}

if ( ! class_exists( 'WP_Block_Pattern_Categories_Registry' ) ) {
	require dirname( __FILE__ ) . '/class-wp-block-pattern-categories-registry.php';
}

if ( ! class_exists( 'WP_Block' ) ) {
	require dirname( __FILE__ ) . '/class-wp-block.php';
}

if ( ! class_exists( 'WP_Block_List' ) ) {
	require dirname( __FILE__ ) . '/class-wp-block-list.php';
}
if ( ! class_exists( 'WP_Widget_Block' ) ) {
	require_once dirname( __FILE__ ) . '/class-wp-widget-block.php';
}
require_once dirname( __FILE__ ) . '/widgets-page.php';

require dirname( __FILE__ ) . '/compat.php';
require dirname( __FILE__ ) . '/utils.php';

require dirname( __FILE__ ) . '/full-site-editing.php';
require dirname( __FILE__ ) . '/templates.php';
require dirname( __FILE__ ) . '/template-parts.php';
require dirname( __FILE__ ) . '/template-loader.php';
require dirname( __FILE__ ) . '/edit-site-page.php';
require dirname( __FILE__ ) . '/edit-site-export.php';

require dirname( __FILE__ ) . '/block-patterns.php';
require dirname( __FILE__ ) . '/blocks.php';
require dirname( __FILE__ ) . '/client-assets.php';
require dirname( __FILE__ ) . '/block-directory.php';
require dirname( __FILE__ ) . '/demo.php';
require dirname( __FILE__ ) . '/widgets.php';
require dirname( __FILE__ ) . '/navigation.php';
require dirname( __FILE__ ) . '/navigation-page.php';
require dirname( __FILE__ ) . '/experiments-page.php';
require dirname( __FILE__ ) . '/global-styles.php';

if ( ! class_exists( 'WP_Block_Supports' ) ) {
	require_once dirname( __FILE__ ) . '/class-wp-block-supports.php';
}
require dirname( __FILE__ ) . '/block-supports/generated-classname.php';
require dirname( __FILE__ ) . '/block-supports/colors.php';
require dirname( __FILE__ ) . '/block-supports/align.php';
require dirname( __FILE__ ) . '/block-supports/typography.php';
require dirname( __FILE__ ) . '/block-supports/custom-classname.php';
