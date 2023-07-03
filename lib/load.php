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

	// WordPress 6.2 compat.
	require_once __DIR__ . '/compat/wordpress-6.2/class-gutenberg-rest-block-patterns-controller-6-2.php';
	require_once __DIR__ . '/compat/wordpress-6.2/class-gutenberg-rest-block-pattern-categories-controller.php';
	require_once __DIR__ . '/compat/wordpress-6.2/class-gutenberg-rest-pattern-directory-controller-6-2.php';
	require_once __DIR__ . '/compat/wordpress-6.2/rest-api.php';
	require_once __DIR__ . '/compat/wordpress-6.2/block-patterns.php';
	require_once __DIR__ . '/compat/wordpress-6.2/class-gutenberg-rest-global-styles-controller-6-2.php';

	// WordPress 6.3 compat.
	require_once __DIR__ . '/compat/wordpress-6.3/class-gutenberg-rest-block-patterns-controller-6-3.php';
	require_once __DIR__ . '/compat/wordpress-6.3/class-gutenberg-rest-templates-controller-6-3.php';
	require_once __DIR__ . '/compat/wordpress-6.3/class-gutenberg-rest-global-styles-controller-6-3.php';
	require_once __DIR__ . '/compat/wordpress-6.3/class-gutenberg-rest-global-styles-revisions-controller-6-3.php';
	require_once __DIR__ . '/compat/wordpress-6.3/class-gutenberg-classic-to-block-menu-converter.php';
	require_once __DIR__ . '/compat/wordpress-6.3/class-gutenberg-navigation-fallback.php';
	require_once __DIR__ . '/compat/wordpress-6.3/class-gutenberg-rest-navigation-fallback-controller.php';
	require_once __DIR__ . '/compat/wordpress-6.3/rest-api.php';
	require_once __DIR__ . '/compat/wordpress-6.3/theme-previews.php';
	require_once __DIR__ . '/compat/wordpress-6.3/navigation-block-preloading.php';
	require_once __DIR__ . '/compat/wordpress-6.3/link-template.php';
	require_once __DIR__ . '/compat/wordpress-6.3/block-patterns.php';

	// Experimental.
	if ( ! class_exists( 'WP_Rest_Customizer_Nonces' ) ) {
		require_once __DIR__ . '/experimental/class-wp-rest-customizer-nonces.php';
	}
	require_once __DIR__ . '/experimental/class-gutenberg-rest-template-revision-count.php';

	require_once __DIR__ . '/experimental/rest-api.php';
}

require __DIR__ . '/experimental/editor-settings.php';

// Gutenberg plugin compat.
require __DIR__ . '/compat/plugin/edit-site-routes-backwards-compat.php';

// WordPress 6.2 compat.
require __DIR__ . '/compat/wordpress-6.2/blocks.php';
require __DIR__ . '/compat/wordpress-6.2/script-loader.php';
require __DIR__ . '/compat/wordpress-6.2/block-template-utils.php';
require __DIR__ . '/compat/wordpress-6.2/get-global-styles-and-settings.php';
require __DIR__ . '/compat/wordpress-6.2/default-filters.php';
require __DIR__ . '/compat/wordpress-6.2/site-editor.php';
require __DIR__ . '/compat/wordpress-6.2/block-editor.php';
require __DIR__ . '/compat/wordpress-6.2/theme.php';
require __DIR__ . '/compat/wordpress-6.2/widgets.php';
require __DIR__ . '/compat/wordpress-6.2/menu.php';

if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) {
	require __DIR__ . '/compat/wordpress-6.2/html-api/class-wp-html-attribute-token.php';
	require __DIR__ . '/compat/wordpress-6.2/html-api/class-wp-html-span.php';
	require __DIR__ . '/compat/wordpress-6.2/html-api/class-wp-html-text-replacement.php';
	require __DIR__ . '/compat/wordpress-6.2/html-api/class-wp-html-tag-processor.php';
}

// WordPress 6.3 compat.
require __DIR__ . '/compat/wordpress-6.3/get-global-styles-and-settings.php';
require __DIR__ . '/compat/wordpress-6.3/block-template-utils.php';
require __DIR__ . '/compat/wordpress-6.3/html-api/class-gutenberg-html-tag-processor-6-3.php';
require __DIR__ . '/compat/wordpress-6.3/script-loader.php';
require __DIR__ . '/compat/wordpress-6.3/blocks.php';
require __DIR__ . '/compat/wordpress-6.3/navigation-fallback.php';
require __DIR__ . '/compat/wordpress-6.3/block-editor-settings.php';
require_once __DIR__ . '/compat/wordpress-6.3/kses.php';

// Experimental features.
remove_action( 'plugins_loaded', '_wp_theme_json_webfonts_handler' ); // Turns off WP 6.0's stopgap handler for Webfonts API.
require __DIR__ . '/experimental/behaviors.php';
require __DIR__ . '/experimental/block-editor-settings-mobile.php';
require __DIR__ . '/experimental/blocks.php';
require __DIR__ . '/experimental/navigation-theme-opt-in.php';
require __DIR__ . '/experimental/kses.php';
require __DIR__ . '/experimental/l10n.php';

if ( gutenberg_is_experiment_enabled( 'gutenberg-no-tinymce' ) ) {
	require __DIR__ . '/experimental/disable-tinymce.php';
}

if ( gutenberg_is_experiment_enabled( 'gutenberg-interactivity-api-core-blocks' ) ) {
	require __DIR__ . '/experimental/interactivity-api/blocks.php';
}
require __DIR__ . '/experimental/interactivity-api/class-wp-interactivity-store.php';
require __DIR__ . '/experimental/interactivity-api/store.php';
require __DIR__ . '/experimental/interactivity-api/scripts.php';
require __DIR__ . '/experimental/interactivity-api/class-wp-directive-processor.php';
require __DIR__ . '/experimental/interactivity-api/class-wp-directive-context.php';
require __DIR__ . '/experimental/interactivity-api/directive-processing.php';
require __DIR__ . '/experimental/interactivity-api/directives/wp-bind.php';
require __DIR__ . '/experimental/interactivity-api/directives/wp-context.php';
require __DIR__ . '/experimental/interactivity-api/directives/wp-class.php';
require __DIR__ . '/experimental/interactivity-api/directives/wp-style.php';
require __DIR__ . '/experimental/interactivity-api/directives/wp-text.php';

// Fonts API.
if ( ! class_exists( 'WP_Fonts' ) ) {
	// Fonts API files.
	require __DIR__ . '/experimental/fonts-api/class-wp-fonts-provider.php';
	require __DIR__ . '/experimental/fonts-api/class-wp-fonts-utils.php';
	require __DIR__ . '/experimental/fonts-api/class-wp-fonts.php';
	require __DIR__ . '/experimental/fonts-api/class-wp-fonts-provider-local.php';
	require __DIR__ . '/experimental/fonts-api/class-wp-fonts-resolver.php';
	require __DIR__ . '/experimental/fonts-api/fonts-api.php';

	// BC Layer files, which will not be backported to WP Core.
	require __DIR__ . '/experimental/fonts-api/bc-layer/class-gutenberg-fonts-api-bc-layer.php';
	require __DIR__ . '/experimental/fonts-api/bc-layer/webfonts-deprecations.php';
	require __DIR__ . '/experimental/fonts-api/bc-layer/class-wp-webfonts-utils.php';
	require __DIR__ . '/experimental/fonts-api/bc-layer/class-wp-webfonts-provider.php';
	require __DIR__ . '/experimental/fonts-api/bc-layer/class-wp-webfonts-provider-local.php';
	require __DIR__ . '/experimental/fonts-api/bc-layer/class-wp-webfonts.php';
	require __DIR__ . '/experimental/fonts-api/bc-layer/class-wp-web-fonts.php';
}

// Plugin specific code.
require __DIR__ . '/script-loader.php';
require __DIR__ . '/global-styles-and-settings.php';
require __DIR__ . '/class-wp-theme-json-data-gutenberg.php';
require __DIR__ . '/class-wp-theme-json-gutenberg.php';
require __DIR__ . '/class-wp-theme-json-resolver-gutenberg.php';
require __DIR__ . '/class-wp-duotone-gutenberg.php';
require __DIR__ . '/blocks.php';
require __DIR__ . '/block-editor-settings.php';
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
require __DIR__ . '/block-supports/shadow.php';
require __DIR__ . '/block-supports/behaviors.php';
