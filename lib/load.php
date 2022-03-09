<?php
/**
 * Load API functions, register scripts and actions, etc.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

define( 'IS_GUTENBERG_PLUGIN', true );

require_once __DIR__ . '/init.php';
require_once __DIR__ . '/upgrade.php';

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
	if ( ! class_exists( 'WP_REST_Menus_Controller' ) ) {
		require_once __DIR__ . '/class-wp-rest-menus-controller.php';
	}
	if ( ! class_exists( 'WP_REST_Menu_Items_Controller' ) ) {
		require_once __DIR__ . '/class-wp-rest-menu-items-controller.php';
	}
	if ( ! class_exists( 'WP_REST_Block_Navigation_Areas_Controller' ) ) {
		require_once __DIR__ . '/class-wp-rest-block-navigation-areas-controller.php';
	}
	if ( ! class_exists( 'WP_REST_Menu_Locations_Controller' ) ) {
		require_once __DIR__ . '/class-wp-rest-menu-locations-controller.php';
	}
	if ( ! class_exists( 'WP_Rest_Customizer_Nonces' ) ) {
		require_once __DIR__ . '/class-wp-rest-customizer-nonces.php';
	}
	require_once __DIR__ . '/compat/wordpress-5.9/class-gutenberg-rest-templates-controller.php';
	if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
		require_once dirname( __FILE__ ) . '/class-wp-rest-block-editor-settings-controller.php';
	}

	if ( ! class_exists( 'WP_REST_URL_Details_Controller' ) ) {
		require_once __DIR__ . '/class-wp-rest-url-details-controller.php';
	}

	require __DIR__ . '/rest-api.php';
}

require __DIR__ . '/compat.php';
require __DIR__ . '/compat/wordpress-5.9/widget-render-api-endpoint/index.php';
require __DIR__ . '/compat/wordpress-5.9/blocks.php';
require __DIR__ . '/compat/wordpress-5.9/block-patterns.php';
require __DIR__ . '/compat/wordpress-5.9/block-template-utils.php';
require __DIR__ . '/compat/wordpress-5.9/default-editor-styles.php';
require __DIR__ . '/compat/wordpress-5.9/register-global-styles-cpt.php';
require __DIR__ . '/compat/wordpress-5.9/script-loader.php';
require __DIR__ . '/compat/wordpress-6.0/block-editor-settings.php';
require __DIR__ . '/compat/experimental/block-editor-settings-mobile.php';
require __DIR__ . '/compat/wordpress-6.0/get-global-styles-and-settings.php';
require __DIR__ . '/compat/wordpress-5.9/render-svg-filters.php';
require __DIR__ . '/compat/wordpress-5.9/json-file-decode.php';
require __DIR__ . '/compat/wordpress-5.9/translate-settings-using-i18n-schema.php';
require __DIR__ . '/compat/wordpress-5.9/global-styles-css-custom-properties.php';
require __DIR__ . '/compat/wordpress-5.9/class-gutenberg-block-template.php';
require __DIR__ . '/compat/wordpress-5.9/templates.php';
require __DIR__ . '/compat/wordpress-5.9/template-parts.php';
require __DIR__ . '/compat/wordpress-5.9/theme-templates.php';
require __DIR__ . '/editor-settings.php';
require __DIR__ . '/compat/wordpress-5.9/class-wp-theme-json-schema-gutenberg.php';
require __DIR__ . '/compat/wordpress-5.9/class-wp-theme-json-5-9.php';
require __DIR__ . '/compat/wordpress-5.9/class-wp-theme-json-resolver-5-9.php';
require __DIR__ . '/compat/wordpress-5.9/theme.php';
require __DIR__ . '/compat/wordpress-5.9/admin-menu.php';
require __DIR__ . '/full-site-editing/edit-site-page.php';
require __DIR__ . '/compat/wordpress-5.9/block-template.php';
require __DIR__ . '/compat/wordpress-5.9/wp-theme-get-post-templates.php';
require __DIR__ . '/compat/wordpress-5.9/default-theme-supports.php';
require __DIR__ . '/compat/wordpress-5.9/class-wp-rest-global-styles-controller.php';
require __DIR__ . '/compat/wordpress-5.9/rest-active-global-styles.php';
require __DIR__ . '/compat/wordpress-5.9/move-theme-editor-menu-item.php';
require __DIR__ . '/compat/wordpress-6.0/post-lock.php';
require __DIR__ . '/compat/wordpress-6.0/blocks.php';
require __DIR__ . '/compat/wordpress-6.0/block-template-utils.php';
require __DIR__ . '/compat/wordpress-6.0/class-gutenberg-rest-global-styles-controller.php';
require __DIR__ . '/compat/wordpress-6.0/class-gutenberg-rest-pattern-directory-controller.php';
require __DIR__ . '/compat/wordpress-6.0/class-gutenberg-rest-edit-site-export-controller.php';
require __DIR__ . '/compat/wordpress-6.0/class-wp-theme-json-gutenberg.php';
require __DIR__ . '/compat/wordpress-6.0/rest-api.php';
require __DIR__ . '/compat/wordpress-6.0/block-patterns.php';
require __DIR__ . '/compat/wordpress-6.0/block-template.php';
require __DIR__ . '/compat/wordpress-6.0/register-webfonts-from-theme-json.php';
require __DIR__ . '/compat/wordpress-6.0/class-wp-theme-json-resolver-gutenberg.php';
require __DIR__ . '/compat/wordpress-6.0/class-wp-webfonts.php';
require __DIR__ . '/compat/wordpress-6.0/class-wp-webfonts-provider.php';
require __DIR__ . '/compat/wordpress-6.0/class-wp-webfonts-provider-local.php';
require __DIR__ . '/compat/wordpress-6.0/webfonts.php';
require __DIR__ . '/compat/experimental/blocks.php';

require __DIR__ . '/blocks.php';
require __DIR__ . '/block-patterns.php';
require __DIR__ . '/client-assets.php';
require __DIR__ . '/demo.php';
require __DIR__ . '/navigation.php';
require __DIR__ . '/navigation-theme-opt-in.php';
require __DIR__ . '/navigation-page.php';
require __DIR__ . '/experiments-page.php';
require __DIR__ . '/global-styles.php';
require __DIR__ . '/pwa.php';

require __DIR__ . '/block-supports/elements.php';
require __DIR__ . '/block-supports/colors.php';
require __DIR__ . '/block-supports/typography.php';
require __DIR__ . '/block-supports/border.php';
require __DIR__ . '/block-supports/layout.php';
require __DIR__ . '/block-supports/spacing.php';
require __DIR__ . '/block-supports/dimensions.php';
require __DIR__ . '/block-supports/duotone.php';

require __DIR__ . '/theme-export.php';
