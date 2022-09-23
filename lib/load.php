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
	if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
		require_once __DIR__ . '/experimental/class-wp-rest-block-editor-settings-controller.php';
	}

	// WordPress 6.0 compat.
	require_once __DIR__ . '/compat/wordpress-6.0/class-gutenberg-rest-global-styles-controller.php';
	require_once __DIR__ . '/compat/wordpress-6.0/class-gutenberg-rest-pattern-directory-controller.php';
	require_once __DIR__ . '/compat/wordpress-6.0/class-gutenberg-rest-edit-site-export-controller.php';
	if ( ! class_exists( 'WP_REST_Block_Pattern_Categories_Controller' ) ) {
		require_once __DIR__ . '/compat/wordpress-6.0/class-wp-rest-block-pattern-categories-controller.php';
	}
	require_once __DIR__ . '/compat/wordpress-6.0/rest-api.php';

	// WordPress 6.1 compat.
	require_once __DIR__ . '/compat/wordpress-6.1/class-gutenberg-rest-block-patterns-controller.php';
	require_once __DIR__ . '/compat/wordpress-6.1/class-gutenberg-rest-templates-controller.php';
	require_once __DIR__ . '/compat/wordpress-6.1/rest-api.php';

	// Experimental.
	if ( ! class_exists( 'WP_Rest_Customizer_Nonces' ) ) {
		require_once __DIR__ . '/experimental/class-wp-rest-customizer-nonces.php';
	}
	require_once __DIR__ . '/experimental/rest-api.php';
}

require __DIR__ . '/experimental/editor-settings.php';

// Gutenberg plugin compat.
require __DIR__ . '/compat/plugin/edit-site-routes-backwards-compat.php';

// WordPress 6.0 compat.
require __DIR__ . '/compat/wordpress-6.0/block-gallery.php';
require __DIR__ . '/compat/wordpress-6.0/block-editor-settings.php';
require __DIR__ . '/compat/wordpress-6.0/get-global-styles-and-settings.php';
require __DIR__ . '/compat/wordpress-6.0/render-svg-filters.php';
require __DIR__ . '/compat/wordpress-6.0/post-lock.php';
require __DIR__ . '/compat/wordpress-6.0/blocks.php';
require __DIR__ . '/compat/wordpress-6.0/block-template-utils.php';
require __DIR__ . '/compat/wordpress-6.0/functions.php';
require __DIR__ . '/compat/wordpress-6.0/class-wp-theme-json-6-0.php';
require __DIR__ . '/compat/wordpress-6.0/class-wp-theme-json-resolver-6-0.php';
require __DIR__ . '/compat/wordpress-6.0/block-patterns.php';
require __DIR__ . '/compat/wordpress-6.0/site-editor.php';
require __DIR__ . '/compat/wordpress-6.0/edit-form-blocks.php';
require __DIR__ . '/compat/wordpress-6.0/block-patterns-update.php';
require __DIR__ . '/compat/wordpress-6.0/client-assets.php';

// WordPress 6.1 compat.
require __DIR__ . '/compat/wordpress-6.1/blocks.php';
require __DIR__ . '/compat/wordpress-6.1/block-editor-settings.php';
require __DIR__ . '/compat/wordpress-6.1/persisted-preferences.php';
require __DIR__ . '/compat/wordpress-6.1/get-global-styles-and-settings.php';
require __DIR__ . '/compat/wordpress-6.1/class-wp-theme-json-data-gutenberg.php';
require __DIR__ . '/compat/wordpress-6.1/class-wp-theme-json-6-1.php';
require __DIR__ . '/compat/wordpress-6.1/class-wp-theme-json-resolver-6-1.php';
require __DIR__ . '/compat/wordpress-6.1/block-template-utils.php';
require __DIR__ . '/compat/wordpress-6.1/wp-theme-get-post-templates.php';
require __DIR__ . '/compat/wordpress-6.1/script-loader.php';
require __DIR__ . '/compat/wordpress-6.1/date-settings.php';
require __DIR__ . '/compat/wordpress-6.1/block-patterns.php';
require __DIR__ . '/compat/wordpress-6.1/edit-form-blocks.php';
require __DIR__ . '/compat/wordpress-6.1/template-parts-screen.php';
require __DIR__ . '/compat/wordpress-6.1/theme.php';

// Experimental features.
remove_action( 'plugins_loaded', '_wp_theme_json_webfonts_handler' ); // Turns off WP 6.0's stopgap handler for Webfonts API.
require __DIR__ . '/experimental/block-editor-settings-mobile.php';
require __DIR__ . '/experimental/register-webfonts-from-theme-json.php';
require __DIR__ . '/experimental/class-wp-theme-json-gutenberg.php';
require __DIR__ . '/experimental/class-wp-theme-json-resolver-gutenberg.php';
require __DIR__ . '/experimental/class-wp-webfonts.php';
require __DIR__ . '/experimental/class-wp-webfonts-provider.php';
require __DIR__ . '/experimental/class-wp-webfonts-provider-local.php';
require __DIR__ . '/experimental/webfonts.php';
require __DIR__ . '/experimental/navigation-theme-opt-in.php';
require __DIR__ . '/experimental/navigation-page.php';

// Plugin specific code.
require __DIR__ . '/blocks.php';
require __DIR__ . '/client-assets.php';
require __DIR__ . '/demo.php';
require __DIR__ . '/experiments-page.php';

// Copied package PHP files.
if ( is_dir( __DIR__ . '/../build/style-engine' ) ) {
	require_once __DIR__ . '/../build/style-engine/style-engine-gutenberg.php';
	require_once __DIR__ . '/../build/style-engine/class-wp-style-engine-gutenberg.php';
	require_once __DIR__ . '/../build/style-engine/class-wp-style-engine-css-declarations-gutenberg.php';
	require_once __DIR__ . '/../build/style-engine/class-wp-style-engine-css-rule-gutenberg.php';
	require_once __DIR__ . '/../build/style-engine/class-wp-style-engine-css-rules-store-gutenberg.php';
	require_once __DIR__ . '/../build/style-engine/class-wp-style-engine-processor-gutenberg.php';
}

// Block supports overrides.
require __DIR__ . '/block-supports/utils.php';
require __DIR__ . '/block-supports/settings.php';
require __DIR__ . '/block-supports/elements.php';
require __DIR__ . '/block-supports/colors.php';
require __DIR__ . '/block-supports/typography.php';
require __DIR__ . '/block-supports/border.php';
require __DIR__ . '/block-supports/layout.php';
require __DIR__ . '/block-supports/spacing.php';
require __DIR__ . '/block-supports/dimensions.php';
require __DIR__ . '/block-supports/duotone.php';
