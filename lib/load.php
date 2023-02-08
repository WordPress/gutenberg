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

	// WordPress 6.1 compat.
	require_once __DIR__ . '/compat/wordpress-6.1/class-gutenberg-rest-block-patterns-controller-6-1.php';
	require_once __DIR__ . '/compat/wordpress-6.1/class-gutenberg-rest-templates-controller.php';
	require_once __DIR__ . '/compat/wordpress-6.1/rest-api.php';

	// WordPress 6.2 compat.
	require_once __DIR__ . '/compat/wordpress-6.2/class-gutenberg-rest-block-patterns-controller-6-2.php';
	require_once __DIR__ . '/compat/wordpress-6.2/class-gutenberg-rest-block-pattern-categories-controller.php';
	require_once __DIR__ . '/compat/wordpress-6.2/class-gutenberg-rest-pattern-directory-controller-6-2.php';
	require_once __DIR__ . '/compat/wordpress-6.2/rest-api.php';
	require_once __DIR__ . '/compat/wordpress-6.2/block-patterns.php';
	require_once __DIR__ . '/compat/wordpress-6.2/class-gutenberg-rest-global-styles-controller-6-2.php';

	// WordPress 6.3 compat.
	require_once __DIR__ . '/compat/wordpress-6.3/class-gutenberg-rest-pattern-directory-controller-6-3.php';
	require_once __DIR__ . '/compat/wordpress-6.3/rest-api.php';

	// Experimental.
	if ( ! class_exists( 'WP_Rest_Customizer_Nonces' ) ) {
		require_once __DIR__ . '/experimental/class-wp-rest-customizer-nonces.php';
	}
	require_once __DIR__ . '/experimental/rest-api.php';
}

require __DIR__ . '/experimental/editor-settings.php';

// Gutenberg plugin compat.
require __DIR__ . '/compat/plugin/edit-site-routes-backwards-compat.php';

// WordPress 6.1 compat.
require __DIR__ . '/compat/wordpress-6.1/block-editor-settings.php';
require __DIR__ . '/compat/wordpress-6.1/blocks.php';
require __DIR__ . '/compat/wordpress-6.1/persisted-preferences.php';
require __DIR__ . '/compat/wordpress-6.1/get-global-styles-and-settings.php';
require __DIR__ . '/compat/wordpress-6.1/class-wp-theme-json-data-gutenberg.php';
require __DIR__ . '/compat/wordpress-6.1/block-template-utils.php';
require __DIR__ . '/compat/wordpress-6.1/wp-theme-get-post-templates.php';
require __DIR__ . '/compat/wordpress-6.1/script-loader.php';
require __DIR__ . '/compat/wordpress-6.1/date-settings.php';
require __DIR__ . '/compat/wordpress-6.1/edit-form-blocks.php';
require __DIR__ . '/compat/wordpress-6.1/template-parts-screen.php';
require __DIR__ . '/compat/wordpress-6.1/theme.php';

// WordPress 6.2 compat.
require __DIR__ . '/compat/wordpress-6.2/blocks.php';
require __DIR__ . '/compat/wordpress-6.2/script-loader.php';
require __DIR__ . '/compat/wordpress-6.2/block-template-utils.php';
require __DIR__ . '/compat/wordpress-6.2/get-global-styles-and-settings.php';
require __DIR__ . '/compat/wordpress-6.2/default-filters.php';
require __DIR__ . '/compat/wordpress-6.2/edit-form-blocks.php';
require __DIR__ . '/compat/wordpress-6.2/site-editor.php';
require __DIR__ . '/compat/wordpress-6.2/block-editor.php';
require __DIR__ . '/compat/wordpress-6.2/block-editor-settings.php';
require __DIR__ . '/compat/wordpress-6.2/theme.php';
require __DIR__ . '/compat/wordpress-6.2/widgets.php';

if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) {
	require __DIR__ . '/compat/wordpress-6.2/html-api/class-wp-html-attribute-token.php';
	require __DIR__ . '/compat/wordpress-6.2/html-api/class-wp-html-span.php';
	require __DIR__ . '/compat/wordpress-6.2/html-api/class-wp-html-text-replacement.php';
	require __DIR__ . '/compat/wordpress-6.2/html-api/class-wp-html-tag-processor.php';
}

// Experimental features.
remove_action( 'plugins_loaded', '_wp_theme_json_webfonts_handler' ); // Turns off WP 6.0's stopgap handler for Webfonts API.
require __DIR__ . '/experimental/block-editor-settings-mobile.php';
require __DIR__ . '/experimental/blocks.php';
require __DIR__ . '/experimental/navigation-theme-opt-in.php';
require __DIR__ . '/experimental/kses.php';

// Fonts API.
require __DIR__ . '/experimental/fonts-api/class-wp-fonts-provider.php';
require __DIR__ . '/experimental/fonts-api/deprecations/webfonts-deprecations.php';
require __DIR__ . '/experimental/fonts-api/deprecations/class-wp-webfonts-provider.php';
require __DIR__ . '/experimental/fonts-api/deprecations/class-wp-webfonts.php';
require __DIR__ . '/experimental/fonts-api/class-wp-fonts-utils.php';
require __DIR__ . '/experimental/fonts-api/register-fonts-from-theme-json.php';
require __DIR__ . '/experimental/fonts-api/class-wp-fonts.php';
require __DIR__ . '/experimental/fonts-api/class-wp-fonts-provider-local.php';
require __DIR__ . '/experimental/fonts-api/fonts-api.php';

// Plugin specific code.
require __DIR__ . '/class-wp-theme-json-gutenberg.php';
require __DIR__ . '/class-wp-theme-json-resolver-gutenberg.php';
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
require __DIR__ . '/block-supports/settings.php';
require __DIR__ . '/block-supports/elements.php';
require __DIR__ . '/block-supports/colors.php';
require __DIR__ . '/block-supports/typography.php';
require __DIR__ . '/block-supports/border.php';
require __DIR__ . '/block-supports/layout.php';
require __DIR__ . '/block-supports/position.php';
require __DIR__ . '/block-supports/spacing.php';
require __DIR__ . '/block-supports/dimensions.php';
require __DIR__ . '/block-supports/duotone.php';
require __DIR__ . '/block-supports/anchor.php';
require __DIR__ . '/block-supports/shadow.php';
