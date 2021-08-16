<?php
/**
 * Load API functions, register scripts and actions, etc.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

// Initialization.
require __DIR__ . '/compat/5.8/init.php';
require __DIR__ . '/experimental/init.php';
require __DIR__ . '/experiments.php';
require __DIR__ . '/init.php';
require __DIR__ . '/legacy/upgrade.php';

// Only load REST API functionality when WordPress has booted the REST API.
if ( class_exists( 'WP_REST_Controller' ) ) {
	// REST API classes.
	require __DIR__ . '/compat/5.8/endpoints/class-wp-rest-pattern-directory-controller.php';
	require __DIR__ . '/compat/5.8/endpoints/class-wp-rest-sidebars-controller.php';
	require __DIR__ . '/compat/5.8/endpoints/class-wp-rest-widget-types-controller.php';
	require __DIR__ . '/compat/5.8/endpoints/class-wp-rest-widgets-controller.php';
	require __DIR__ . '/experiemntal/endpoints/class-wp-rest-customizer-nonces.php';
	require __DIR__ . '/experiemntal/endpoints/class-wp-rest-menu-items-controller.php';
	require __DIR__ . '/experiemntal/endpoints/class-wp-rest-menu-locations-controller.php';
	require __DIR__ . '/experimental/endpoints/class-wp-rest-block-editor-settings-controller.php';
	require __DIR__ . '/experimental/endpoints/class-wp-rest-menus-controller.php';
	require __DIR__ . '/experimental/endpoints/class-wp-rest-url-details-controller.php';
	require __DIR__ . '/experimental/full-site-editing/class-gutenberg-rest-templates-controller.php';

	// REST API functionality.
	require __DIR__ . '/compat/5.8/rest-api.php';
	require __DIR__ . '/experimental/rest-api.php';
}

// Classes.
require __DIR__ . '/compat/5.8/class-wp-theme-json-gutenberg.php';
require __DIR__ . '/compat/5.8/class-wp-theme-json-resolver-gutenberg.php';
require __DIR__ . '/compat/5.8/class-wp-widget-block.php';
require __DIR__ . '/experimental/full-site-editing/class-wp-block-template.php';
require __DIR__ . '/legacy/class-wp-theme-json-schema-v0.php';
require __DIR__ . '/legacy/interface-wp-theme-json-schema.php';

// Functionality.
require __DIR__ . '/blocks.php';
require __DIR__ . '/client-assets.php';
require __DIR__ . '/compat/5.8/block-patterns.php';
require __DIR__ . '/compat/5.8/block-supports/align.php';
require __DIR__ . '/compat/5.8/block-supports/border.php';
require __DIR__ . '/compat/5.8/block-supports/colors.php';
require __DIR__ . '/compat/5.8/block-supports/custom-classname.php';
require __DIR__ . '/compat/5.8/block-supports/duotone.php';
require __DIR__ . '/compat/5.8/block-supports/elements.php';
require __DIR__ . '/compat/5.8/block-supports/generated-classname.php';
require __DIR__ . '/compat/5.8/block-supports/layout.php';
require __DIR__ . '/compat/5.8/block-supports/typography.php';
require __DIR__ . '/compat/5.8/blocks.php';
require __DIR__ . '/compat/5.8/client-assets.php';
require __DIR__ . '/compat/5.8/compat.php';
require __DIR__ . '/compat/5.8/index.php';
require __DIR__ . '/compat/5.8/utils.php';
require __DIR__ . '/compat/5.8/widgets-api.php';
require __DIR__ . '/compat/5.8/widgets-customize.php';
require __DIR__ . '/compat/5.8/widgets-page.php';
require __DIR__ . '/compat/5.8/widgets.php';
require __DIR__ . '/demo.php';
require __DIR__ . '/experimental/block-supports/dimensions.php';
require __DIR__ . '/experimental/editor-settings.php';
require __DIR__ . '/experimental/full-site-editing/block-templates.php';
require __DIR__ . '/experimental/full-site-editing/default-template-types.php';
require __DIR__ . '/experimental/full-site-editing/edit-site-export.php';
require __DIR__ . '/experimental/full-site-editing/edit-site-page.php';
require __DIR__ . '/experimental/full-site-editing/full-site-editing.php';
require __DIR__ . '/experimental/full-site-editing/page-templates.php';
require __DIR__ . '/experimental/full-site-editing/template-loader.php';
require __DIR__ . '/experimental/full-site-editing/template-parts.php';
require __DIR__ . '/experimental/full-site-editing/templates-utils.php';
require __DIR__ . '/experimental/full-site-editing/templates.php';
require __DIR__ . '/experimental/global-styles.php';
require __DIR__ . '/experimental/navigation-page.php';
require __DIR__ . '/experimental/navigation.php';
require __DIR__ . '/experimental/pwa.php';
