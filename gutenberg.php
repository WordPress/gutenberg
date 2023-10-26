<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Printing since 1440. This is the development plugin for the block editor, site editor, and other future WordPress core functionality.
 * Requires at least: 6.2
 * Requires PHP: 7.0
 * Version: 17.1.1
 * Author: Gutenberg Team
 * Text Domain: gutenberg
 *
 * @package gutenberg
 */

### BEGIN AUTO-GENERATED DEFINES
defined( 'GUTENBERG_DEVELOPMENT_MODE' ) or define( 'GUTENBERG_DEVELOPMENT_MODE', true );
### END AUTO-GENERATED DEFINES

// Minimum supported version. Has to match "Requires at least" header above.
if ( ! defined( 'GUTENBERG_MIN_WP_VERSION' ) ) {
	define( 'GUTENBERG_MIN_WP_VERSION', '6.2' );
}

// Max supported version.
if ( ! defined( 'GUTENBERG_MAX_WP_VERSION' ) ) {
	/*
	 * The maximum WordPress version that is supported.
	 * Generally that would be the current WordPress development version from core trunk,
	 * see: https://core.trac.wordpress.org/browser/trunk/src/wp-includes/version.php.
	 * This constant should be set to a major (two digits) version. For example,
	 * whether the current WP development version is 6.4-alpha-12345-src,
	 * the constant would be 6.3.
	 * The expectation is that bug fixes and new features from this Gutenberg release will be
	 * added to the curent WordPress release. If that is not the case, or if the WP version
	 * from trunk is already BETA 1, the constant should be set to the next major WP version.
	 * Following the above example that would be 6.4.
	 */
	define( 'GUTENBERG_MAX_WP_VERSION', '6.4' );
}

if ( defined( 'ABSPATH' ) ) {
	gutenberg_pre_init();
} else {
	die( 'Invalid request.' );
}

/**
 * Retiurns the text for the "WordPress version is too old" notices.
 *
 * @since 16.9.0
 *
 * @return string Text for the notices, escaped.
 */
function gutenberg_wordpress_version_too_old_text() {
	if ( current_user_can( 'update_plugins' ) ) {
		$text = sprintf(
			/* translators: %s: Minimum required version */
			__( 'Gutenberg requires WordPress %s or later to function properly and was not loaded. Please upgrade WordPress.', 'gutenberg' ),
			GUTENBERG_MIN_WP_VERSION
		);
	} else {
		$text = sprintf(
			/* translators: %s: Minimum required version */
			__( 'Gutenberg requires WordPress %s or later to function properly and was not loaded. Please ask an administrator to upgrade WordPress.', 'gutenberg' ),
			GUTENBERG_MIN_WP_VERSION
		);
	}

	return esc_html( $text );
}

/**
 * Retiurns the text for the "Gutenberg version is too old" notices.
 *
 * @since 16.9.0
 *
 * @return string Text for the notices, escaped.
 */
function gutenberg_version_too_old_text() {
	if ( current_user_can( 'update_plugins' ) ) {
		$text = __( 'The Gutenberg plugin cannot be used. It is too old for your version of WordPress. Please turn the auto-update on or update it manually.', 'gutenberg' );
	} else {
		$text = __( 'The Gutenberg plugin cannot be used. It is too old for your version of WordPress. Please ask an administrator to update it.', 'gutenberg' );
	}

	return esc_html( $text );
}

/**
 * Display a "WordPress version is too old" notice.
 *
 * @since 0.1.0
 */
function gutenberg_wordpress_version_too_old_notice() {
	$current_screen = get_current_screen();

	if ( ! $current_screen || ( 'dashboard' !== $current_screen->id && 'plugins' !== $current_screen->id ) ) {
		return;
	}

	echo '<div class="error"><p>';
	echo gutenberg_wordpress_version_too_old_text();
	echo '</p></div>';
}

/**
 * Display a "Gutenberg version is too old" notice.
 *
 * @since 16.9.0
 */
function gutenberg_version_too_old_notice() {
	$current_screen = get_current_screen();

	if ( ! $current_screen || ( 'dashboard' !== $current_screen->id && 'plugins' !== $current_screen->id ) ) {
		return;
	}

	echo '<div class="error"><p>';
	echo gutenberg_version_too_old_text();
	echo '</p></div>';
}

/**
 * Add a "WordPress version is too old" plugins list table notice.
 *
 * @since 16.9.0
 *
 * @param string[] $plugin_meta Array of plugin row meta data.
 * @param string   $file        Path to the plugin file relative to the plugins directory.
 * @return string[] Updated array of plugin row meta data.
 */
function gutenberg_wordpress_version_too_old_plugin_row_meta( $plugin_meta, $file ) {
	$plugin_basename = basename( __DIR__ ) . '/gutenberg.php';

	if ( $file === $plugin_basename ) {
		// Prevent PHP warnings when a plugin uses this filter incorrectly.
		$plugin_meta = (array) $plugin_meta;
		$text        = gutenberg_wordpress_version_too_old_text();

		$plugin_meta['gutenberg-plugin-notice'] = '<p style="color:red;margin:0.7em 0;">' . $text . '</p>';
	}

	return $plugin_meta;
}

/**
 * Add a "Gutenberg version is too old" plugins list table notice.
 *
 * @since 16.9.0
 *
 * @param string[] $plugin_meta Array of plugin row meta data.
 * @param string   $file        Path to the plugin file relative to the plugins directory.
 * @return string[] Updated array of plugin row meta data.
 */
function gutenberg_version_too_old_plugin_row_meta( $plugin_meta, $file ) {
	$plugin_basename = basename( __DIR__ ) . '/gutenberg.php';

	if ( $file === $plugin_basename ) {
		// Prevent PHP warnings when a plugin uses this filter incorrectly.
		$plugin_meta = (array) $plugin_meta;
		$text        = gutenberg_version_too_old_text();

		$plugin_meta['gutenberg-plugin-notice'] = '<p style="color:red;margin:0.7em 0;">' . $text . '</p>';
	}

	return $plugin_meta;
}

/**
 * Display a build notice.
 *
 * @since 0.1.0
 */
function gutenberg_build_files_notice() {
	echo '<div class="error"><p>';
	_e( 'Gutenberg development mode requires files to be built. Run <code>npm install</code> to install dependencies, <code>npm run build</code> to build the files or <code>npm run dev</code> to build the files and watch for changes. Read the <a href="https://github.com/WordPress/gutenberg/blob/HEAD/docs/contributors/code/getting-started-with-code-contribution.md">contributing</a> file for more information.', 'gutenberg' );
	echo '</p></div>';
}

/**
 * Verify that we can initialize the Gutenberg editor, then load it.
 *
 * @since 1.5.0
 */
function gutenberg_pre_init() {
	// Get unmodified $wp_version.
	include ABSPATH . WPINC . '/version.php';

	// Strip '-src' from the WP version string. May interfere with `version_compare()`.
	$wp_version = str_replace( '-src', '', $wp_version );

	/*
	 * Note that `version_compare()` considers 1 < 1.0 < 1.0.0 (before suffixes)
	 * so 6.0 < 6.0.0-alpha and 6.0-beta < 6.0.0-alpha are both true.
	 * To work around any possible problems when comparing with WP development version strings
	 * the GUTENBERG_MAX_WP_VERSION is incremented by one and the comparisons are with `>=`.
	 */
	$max_supported_version = (float) GUTENBERG_MAX_WP_VERSION + 0.1;

	// `version_compare()` expects strings.
	$max_supported_version = (string) $max_supported_version;

	// Check if this version of Gutenberg supports the version of WordPress.
	if ( version_compare( $wp_version, GUTENBERG_MIN_WP_VERSION, '<' ) ) {
		add_action( 'admin_notices', 'gutenberg_wordpress_version_too_old_notice' );

		// Also add a notice to the plugin's row in the plugins list tables.
		add_filter( 'plugin_row_meta', 'gutenberg_wordpress_version_too_old_plugin_row_meta', 10, 2 );

		// Return early, do not load Gutenberg.
		return;
	} elseif ( version_compare( $wp_version, $max_supported_version, '>=' ) || (
		version_compare( $wp_version, $max_supported_version, '<' ) &&
		version_compare( $wp_version, $max_supported_version . '-alpha', '>=' )
	) ) {
		/*
		 * Do not load Gutenebrg in newer, unsupported versions of WordPress. This will prevent incompatibilities,
		 * PHP fatal errors, etc. Ask the users to update Gutenberg or turn plugin auto-updates on.
		*/
		add_action( 'admin_notices', 'gutenberg_version_too_old_notice' );

		// Also add a notice to the plugin's row in the plugins list table.
		add_filter( 'plugin_row_meta', 'gutenberg_version_too_old_plugin_row_meta', 10, 2 );

		return;
	}

	// Check if Gutenberg has been built for the first time.
	if (
		defined( 'GUTENBERG_DEVELOPMENT_MODE' ) &&
		GUTENBERG_DEVELOPMENT_MODE &&
		! file_exists( __DIR__ . '/build/blocks' )
	) {
		add_action( 'admin_notices', 'gutenberg_build_files_notice' );
		return;
	}

	// Load the plugin.
	require_once __DIR__ . '/lib/load.php';
}
