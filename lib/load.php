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

// These files only need to be loaded if within a rest server instance.
// which this class will exist if that is the case.
if ( class_exists( 'WP_REST_Controller' ) ) {
	if ( ! class_exists( 'WP_REST_Block_Editor_Settings_Controller' ) ) {
		require_once __DIR__ . '/experimental/class-wp-rest-block-editor-settings-controller.php';
	}

	// WordPress 6.6 compat.
	require __DIR__ . '/compat/wordpress-6.6/class-gutenberg-rest-global-styles-revisions-controller-6-6.php';
	require __DIR__ . '/compat/wordpress-6.6/class-gutenberg-rest-templates-controller-6-6.php';
	require __DIR__ . '/compat/wordpress-6.6/rest-api.php';

	// WordPress 6.7 compat.
	require __DIR__ . '/compat/wordpress-6.7/class-gutenberg-rest-templates-controller-6-7.php';
	require __DIR__ . '/compat/wordpress-6.7/rest-api.php';

	// Plugin specific code.
	require_once __DIR__ . '/class-wp-rest-global-styles-controller-gutenberg.php';
	require_once __DIR__ . '/class-wp-rest-edit-site-export-controller-gutenberg.php';
	require_once __DIR__ . '/rest-api.php';

	require_once __DIR__ . '/experimental/rest-api.php';
	require_once __DIR__ . '/experimental/kses-allowed-html.php';
}

// Experimental signaling server.
if ( ! class_exists( 'Gutenberg_HTTP_Singling_Server' ) ) {
	require_once __DIR__ . '/experimental/sync/class-gutenberg-http-signaling-server.php';
}

require __DIR__ . '/experimental/editor-settings.php';

// Gutenberg plugin compat.
require __DIR__ . '/compat/plugin/edit-site-routes-backwards-compat.php';
require __DIR__ . '/compat/plugin/fonts.php';

// The Token Map was created during 6.6 in order to support the HTML API. It must be loaded before it.
require __DIR__ . '/compat/wordpress-6.6/class-gutenberg-token-map-6-6.php';
require __DIR__ . '/compat/wordpress-6.7/class-gutenberg-token-map-6-7.php';

require __DIR__ . '/compat/wordpress-6.6/html-api/gutenberg-html5-named-character-references-6-6.php';
require __DIR__ . '/compat/wordpress-6.6/html-api/class-gutenberg-html-decoder-6-6.php';
require __DIR__ . '/compat/wordpress-6.6/html-api/class-gutenberg-html-tag-processor-6-6.php';
require __DIR__ . '/compat/wordpress-6.6/html-api/class-gutenberg-html-open-elements-6-6.php';
require __DIR__ . '/compat/wordpress-6.6/html-api/class-gutenberg-html-stack-event-6-6.php';
require __DIR__ . '/compat/wordpress-6.6/html-api/class-gutenberg-html-processor-state-6-6.php';
require __DIR__ . '/compat/wordpress-6.6/html-api/class-gutenberg-html-processor-6-6.php';

// Type annotations were added in 6.7 so every file is updated.
require __DIR__ . '/compat/wordpress-6.7/html-api/class-gutenberg-html-active-formatting-elements-6-7.php';
require __DIR__ . '/compat/wordpress-6.7/html-api/class-gutenberg-html-attribute-token-6-7.php';
require __DIR__ . '/compat/wordpress-6.7/html-api/class-gutenberg-html-decoder-6-7.php';
require __DIR__ . '/compat/wordpress-6.7/html-api/class-gutenberg-html-open-elements-6-7.php';
require __DIR__ . '/compat/wordpress-6.7/html-api/class-gutenberg-html-span-6-7.php';
require __DIR__ . '/compat/wordpress-6.7/html-api/class-gutenberg-html-stack-event-6-7.php';
require __DIR__ . '/compat/wordpress-6.7/html-api/class-gutenberg-html-text-replacement-6-7.php';
require __DIR__ . '/compat/wordpress-6.7/html-api/class-gutenberg-html-token-6-7.php';
require __DIR__ . '/compat/wordpress-6.7/html-api/class-gutenberg-html-unsupported-exception-6-7.php';
require __DIR__ . '/compat/wordpress-6.7/html-api/class-gutenberg-html-tag-processor-6-7.php';
require __DIR__ . '/compat/wordpress-6.7/html-api/class-gutenberg-html-processor-state-6-7.php';
require __DIR__ . '/compat/wordpress-6.7/html-api/class-gutenberg-html-processor-6-7.php';

// WordPress 6.6 compat.
require __DIR__ . '/compat/wordpress-6.6/admin-bar.php';
require __DIR__ . '/compat/wordpress-6.6/blocks.php';
require __DIR__ . '/compat/wordpress-6.6/block-editor.php';
require __DIR__ . '/compat/wordpress-6.6/compat.php';
require __DIR__ . '/compat/wordpress-6.6/resolve-patterns.php';
require __DIR__ . '/compat/wordpress-6.6/block-bindings/pattern-overrides.php';
require __DIR__ . '/compat/wordpress-6.6/block-template-utils.php';
require __DIR__ . '/compat/wordpress-6.6/option.php';
require __DIR__ . '/compat/wordpress-6.6/post.php';

// WordPress 6.7 compat.
require __DIR__ . '/compat/wordpress-6.7/block-templates.php';
require __DIR__ . '/compat/wordpress-6.7/blocks.php';
require __DIR__ . '/compat/wordpress-6.7/block-bindings.php';
require __DIR__ . '/compat/wordpress-6.7/script-modules.php';
require __DIR__ . '/compat/wordpress-6.7/class-wp-block-templates-registry.php';
require __DIR__ . '/compat/wordpress-6.7/compat.php';

// Experimental features.
require __DIR__ . '/experimental/block-editor-settings-mobile.php';
require __DIR__ . '/experimental/blocks.php';
require __DIR__ . '/experimental/navigation-theme-opt-in.php';
require __DIR__ . '/experimental/kses.php';
require __DIR__ . '/experimental/l10n.php';
require __DIR__ . '/experimental/synchronization.php';
require __DIR__ . '/experimental/script-modules.php';
require __DIR__ . '/experimental/posts/load.php';

if ( gutenberg_is_experiment_enabled( 'gutenberg-no-tinymce' ) ) {
	require __DIR__ . '/experimental/disable-tinymce.php';
}

// Load the BC Layer to avoid fatal errors of extenders using the Fonts API.
// @core-merge: do not merge the BC layer files into WordPress Core.
require __DIR__ . '/experimental/font-face/bc-layer/class-wp-fonts-provider.php';
require __DIR__ . '/experimental/font-face/bc-layer/class-wp-fonts-utils.php';
require __DIR__ . '/experimental/font-face/bc-layer/class-wp-fonts.php';
require __DIR__ . '/experimental/font-face/bc-layer/class-wp-fonts-provider-local.php';
require __DIR__ . '/experimental/font-face/bc-layer/class-wp-fonts-resolver.php';
require __DIR__ . '/experimental/font-face/bc-layer/class-gutenberg-fonts-api-bc-layer.php';
require __DIR__ . '/experimental/font-face/bc-layer/webfonts-deprecations.php';
require __DIR__ . '/experimental/font-face/bc-layer/class-wp-webfonts-utils.php';
require __DIR__ . '/experimental/font-face/bc-layer/class-wp-webfonts-provider.php';
require __DIR__ . '/experimental/font-face/bc-layer/class-wp-webfonts-provider-local.php';
require __DIR__ . '/experimental/font-face/bc-layer/class-wp-webfonts.php';
require __DIR__ . '/experimental/font-face/bc-layer/class-wp-web-fonts.php';

// Plugin specific code.
require __DIR__ . '/script-loader.php';
require __DIR__ . '/global-styles-and-settings.php';
require __DIR__ . '/class-wp-theme-json-data-gutenberg.php';
require __DIR__ . '/class-wp-theme-json-gutenberg.php';
require __DIR__ . '/class-wp-theme-json-resolver-gutenberg.php';
require __DIR__ . '/class-wp-theme-json-schema-gutenberg.php';
require __DIR__ . '/class-wp-duotone-gutenberg.php';
require __DIR__ . '/blocks.php';
require __DIR__ . '/block-editor-settings.php';
require __DIR__ . '/client-assets.php';
require __DIR__ . '/demo.php';
require __DIR__ . '/experiments-page.php';
require __DIR__ . '/interactivity-api.php';
require __DIR__ . '/block-template-utils.php';
if ( gutenberg_is_experiment_enabled( 'gutenberg-full-page-client-side-navigation' ) ) {
	require __DIR__ . '/experimental/full-page-client-side-navigation.php';
}

// Copied package PHP files.
if ( is_dir( __DIR__ . '/../build/style-engine' ) ) {
	require_once __DIR__ . '/../build/style-engine/class-wp-style-engine-css-declarations-gutenberg.php';
	require_once __DIR__ . '/../build/style-engine/class-wp-style-engine-css-rule-gutenberg.php';
	require_once __DIR__ . '/../build/style-engine/class-wp-style-engine-css-rules-store-gutenberg.php';
	require_once __DIR__ . '/../build/style-engine/class-wp-style-engine-processor-gutenberg.php';
	require_once __DIR__ . '/../build/style-engine/class-wp-style-engine-gutenberg.php';
	require_once __DIR__ . '/../build/style-engine/style-engine-gutenberg.php';
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
require __DIR__ . '/block-supports/background.php';
require __DIR__ . '/block-supports/block-style-variations.php';

// Data views.
require_once __DIR__ . '/experimental/data-views.php';
