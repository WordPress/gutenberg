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

	// WordPress 6.4 compat.
	require_once __DIR__ . '/compat/wordpress-6.4/class-gutenberg-rest-global-styles-revisions-controller-6-4.php';
	require_once __DIR__ . '/compat/wordpress-6.4/class-gutenberg-rest-block-patterns-controller.php';
	require_once __DIR__ . '/compat/wordpress-6.4/rest-api.php';
	require_once __DIR__ . '/compat/wordpress-6.4/theme-previews.php';

	// WordPress 6.5 compat.
	require_once __DIR__ . '/compat/wordpress-6.5/class-gutenberg-rest-global-styles-revisions-controller-6-5.php';
	require_once __DIR__ . '/compat/wordpress-6.5/rest-api.php';

	// Plugin specific code.
	require_once __DIR__ . '/class-wp-rest-global-styles-controller-gutenberg.php';
	require_once __DIR__ . '/rest-api.php';

	// Experimental.
	if ( ! class_exists( 'WP_Rest_Customizer_Nonces' ) ) {
		require_once __DIR__ . '/experimental/class-wp-rest-customizer-nonces.php';
	}
	require_once __DIR__ . '/experimental/class-gutenberg-rest-template-revision-count.php';
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
require __DIR__ . '/compat/plugin/footnotes.php';

/*
 * There are upstream updates to the Tag Processor that may not appear if Gutenberg is running
 * a version of WordPress newer than 6.3 and older than the latest `trunk`. This file should
 * always be loaded so that Gutenberg code can run the newest version of the Tag Processor.
 */
require __DIR__ . '/compat/wordpress-6.4/html-api/class-gutenberg-html-tag-processor-6-4.php';
require __DIR__ . '/compat/wordpress-6.5/html-api/class-gutenberg-html-attribute-token-6-5.php';
require __DIR__ . '/compat/wordpress-6.5/html-api/class-gutenberg-html-span-6-5.php';
require __DIR__ . '/compat/wordpress-6.5/html-api/class-gutenberg-html-text-replacement-6-5.php';
require __DIR__ . '/compat/wordpress-6.5/html-api/class-gutenberg-html-tag-processor-6-5.php';

/*
 * The HTML Processor appeared after WordPress 6.3. If Gutenberg is running on a version of
 * WordPress before it was introduced, these verbatim Core files will be missing.
 */
if ( ! class_exists( 'WP_HTML_Processor' ) ) {
	require __DIR__ . '/compat/wordpress-6.4/html-api/class-wp-html-active-formatting-elements.php';
	require __DIR__ . '/compat/wordpress-6.4/html-api/class-wp-html-open-elements.php';
	require __DIR__ . '/compat/wordpress-6.4/html-api/class-wp-html-processor-state.php';
	require __DIR__ . '/compat/wordpress-6.4/html-api/class-wp-html-token.php';
	require __DIR__ . '/compat/wordpress-6.4/html-api/class-wp-html-unsupported-exception.php';
	require __DIR__ . '/compat/wordpress-6.4/html-api/class-wp-html-processor.php';
}

// WordPress 6.4 compat.
require __DIR__ . '/compat/wordpress-6.4/blocks.php';
require __DIR__ . '/compat/wordpress-6.4/block-hooks.php';
require __DIR__ . '/compat/wordpress-6.4/script-loader.php';
require __DIR__ . '/compat/wordpress-6.4/kses.php';

// WordPress 6.5 compat.
require __DIR__ . '/compat/wordpress-6.5/block-patterns.php';
require __DIR__ . '/compat/wordpress-6.5/class-wp-navigation-block-renderer.php';
require __DIR__ . '/compat/wordpress-6.5/kses.php';

// Experimental features.
require __DIR__ . '/experimental/block-editor-settings-mobile.php';
require __DIR__ . '/experimental/blocks.php';
require __DIR__ . '/experimental/navigation-theme-opt-in.php';
require __DIR__ . '/experimental/kses.php';
require __DIR__ . '/experimental/l10n.php';
require __DIR__ . '/experimental/synchronization.php';

if ( gutenberg_is_experiment_enabled( 'gutenberg-no-tinymce' ) ) {
	require __DIR__ . '/experimental/disable-tinymce.php';
}

require __DIR__ . '/experimental/interactivity-api/class-wp-interactivity-store.php';
require __DIR__ . '/experimental/interactivity-api/store.php';
require __DIR__ . '/experimental/interactivity-api/modules.php';
require __DIR__ . '/experimental/interactivity-api/class-wp-directive-processor.php';
require __DIR__ . '/experimental/interactivity-api/class-wp-directive-context.php';
require __DIR__ . '/experimental/interactivity-api/directive-processing.php';
require __DIR__ . '/experimental/interactivity-api/directives/wp-bind.php';
require __DIR__ . '/experimental/interactivity-api/directives/wp-context.php';
require __DIR__ . '/experimental/interactivity-api/directives/wp-class.php';
require __DIR__ . '/experimental/interactivity-api/directives/wp-style.php';
require __DIR__ . '/experimental/interactivity-api/directives/wp-text.php';

require __DIR__ . '/experimental/modules/class-gutenberg-modules.php';

// Fonts API / Font Face.
remove_action( 'plugins_loaded', '_wp_theme_json_webfonts_handler' ); // Turns off WordPress 6.0's stopgap handler.

/*
 * If the Font Library is available, load the Font Face files, else load the Fonts API.
 * This strategy is temporary until the Font Library is merged. It's used here to allow
 * the Font Face (redesigned Fonts API) to be merged before the Font Library while
 * keeping Fonts API available for sites that are using it.
 */
if (
	! defined( 'FONT_LIBRARY_DISABLED' ) || ! FONT_LIBRARY_DISABLED
) {
	// Loads the Font Library.
	if ( ! class_exists( 'WP_Font_Library' ) ) {
		require __DIR__ . '/experimental/fonts/font-library/class-wp-font-collection.php';
		require __DIR__ . '/experimental/fonts/font-library/class-wp-font-library.php';
		require __DIR__ . '/experimental/fonts/font-library/class-wp-font-family-utils.php';
		require __DIR__ . '/experimental/fonts/font-library/class-wp-font-family.php';
		require __DIR__ . '/experimental/fonts/font-library/class-wp-rest-font-families-controller.php';
		require __DIR__ . '/experimental/fonts/font-library/class-wp-rest-font-collections-controller.php';
		require __DIR__ . '/experimental/fonts/font-library/class-wp-rest-autosave-font-families-controller.php';
		require __DIR__ . '/experimental/fonts/font-library/font-library.php';
	}

	// Load the Font Face.
	if ( ! class_exists( 'WP_Font_Face' ) ) {
		require __DIR__ . '/compat/wordpress-6.4/fonts/font-face/class-wp-font-face.php';
		require __DIR__ . '/compat/wordpress-6.4/fonts/font-face/class-wp-font-face-resolver.php';
	}

	/*
	 * As _gutenberg_get_iframed_editor_assets_6_4() overrides Core's _wp_get_iframed_editor_assets(),
	 * load this file to ensure wp_print_font_faces() is invoked to load the styles into the
	 * iframed editor.
	 */
	require __DIR__ . '/compat/wordpress-6.4/fonts/fonts.php';

	// Load the BC Layer to avoid fatal errors of extenders using the Fonts API.
	// @core-merge: do not merge the BC layer files into WordPress Core.
	require __DIR__ . '/experimental/fonts/font-face/bc-layer/class-wp-fonts-provider.php';
	require __DIR__ . '/experimental/fonts/font-face/bc-layer/class-wp-fonts-utils.php';
	require __DIR__ . '/experimental/fonts/font-face/bc-layer/class-wp-fonts.php';
	require __DIR__ . '/experimental/fonts/font-face/bc-layer/class-wp-fonts-provider-local.php';
	require __DIR__ . '/experimental/fonts/font-face/bc-layer/class-wp-fonts-resolver.php';
	require __DIR__ . '/experimental/fonts/font-face/bc-layer/class-gutenberg-fonts-api-bc-layer.php';
	require __DIR__ . '/experimental/fonts/font-face/bc-layer/webfonts-deprecations.php';
	require __DIR__ . '/experimental/fonts/font-face/bc-layer/class-wp-webfonts-utils.php';
	require __DIR__ . '/experimental/fonts/font-face/bc-layer/class-wp-webfonts-provider.php';
	require __DIR__ . '/experimental/fonts/font-face/bc-layer/class-wp-webfonts-provider-local.php';
	require __DIR__ . '/experimental/fonts/font-face/bc-layer/class-wp-webfonts.php';
	require __DIR__ . '/experimental/fonts/font-face/bc-layer/class-wp-web-fonts.php';
} elseif ( ! class_exists( 'WP_Fonts' ) ) {

	// Disables the Font Library.
	// @core-merge: this should not go to core.
	add_action(
		'enqueue_block_editor_assets',
		function () {
			wp_add_inline_script( 'wp-block-editor', 'window.__experimentalDisableFontLibrary = true', 'before' );
		}
	);

	// Turns off Font Face hooks in Core.
	// @since 6.4.0.
	remove_action( 'wp_head', 'wp_print_font_faces', 50 );
	remove_action( 'admin_print_styles', 'wp_print_font_faces', 50 );

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
require __DIR__ . '/class-wp-theme-json-schema-gutenberg.php';
require __DIR__ . '/class-wp-theme-json-resolver-gutenberg.php';
require __DIR__ . '/class-wp-duotone-gutenberg.php';
require __DIR__ . '/blocks.php';
require __DIR__ . '/block-editor-settings.php';
require __DIR__ . '/client-assets.php';
require __DIR__ . '/demo.php';
require __DIR__ . '/experiments-page.php';

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
require __DIR__ . '/block-supports/behaviors.php';
require __DIR__ . '/block-supports/pattern.php';

// Data views.
require_once __DIR__ . '/experimental/data-views.php';
