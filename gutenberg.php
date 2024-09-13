<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Printing since 1440. This is the development plugin for the block editor, site editor, and other future WordPress core functionality.
 * Requires at least: 6.5
 * Requires PHP: 7.2
 * Version: 19.2.0
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
	 *
	 * This constant should be set to a major (two digits) version. For example,
	 * whether the current WP version is 6.4-RC2-57007-src, 6.4, 6.4.1-RC1, or 6.4.2
	 * the constant would be 6.4.
	 *
	 * Generally that would be the currently released WordPress version if the WP development
	 * cycle is in alpha or (early) beta, or the next WordPress version if development is in RC.
	 * In nearly all cases that would be the two digits version of the latest WP branch,
	 * see: https://core.trac.wordpress.org/browser/branches.
	 * The expectation is that the new features, improvements and bug fixes from the current
	 * Gutenberg version will be synced with the current development WordPress version (alpha, beta)
	 * before it is released.
	 *
	 * If WordPress is in late beta ("late" as in few days before RC), and there are features
	 * and/or improvements in the current Gutenberg version that will not be synced with this
	 * WordPress version, the maximum supported WP version should be set to the next release version,
	 * i.e. the current WordPress development version. Generally in this case, late beta,
	 * WordPress wouldn't have been branched yet.
	 * However if WP is currently in RC, it most likely would have been branched already so using
	 * the version of the latest branch as described above would work as expected.
	 *
	 * For example: Currently WordPress 6.4 is in RC. It was branched and development continues
	 * in the 6.4 branch. At the same time development of WordPress 6.5 has already started in trunk.
	 * So the max supported WP version for the next Gutenberg release should be set to 6.4
	 * (same as the latest WP branch). The expectation is that any new features in this Gutenberg
	 * release will be synced/merged to WP 6.5 so this versions of the Gutenberg plugin
	 * should not be used there.
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
 * @since 17.2.0
 *
 * @return string Text for the notices, escaped.
 */
function gutenberg_wordpress_version_too_old_text() {
	if ( current_user_can( 'update_plugins' ) ) {
		$text = sprintf(
			/* translators: %s: Minimum required version */
			__( 'Gutenberg requires WordPress %s or later to function properly. It was disabled to prevent errors. Please upgrade WordPress.', 'gutenberg' ),
			GUTENBERG_MIN_WP_VERSION
		);
	} else {
		$text = sprintf(
			/* translators: %s: Minimum required version */
			__( 'Gutenberg requires WordPress %s or later to function properly. It was disabled to prevent errors. Please ask an administrator to upgrade WordPress.', 'gutenberg' ),
			GUTENBERG_MIN_WP_VERSION
		);
	}

	return esc_html( $text );
}

/**
 * Retiurns the text for the "Gutenberg version is too old" notices.
 *
 * @since 17.2.0
 *
 * @return string Text for the notices, escaped.
 */
function gutenberg_version_too_old_text() {
	if ( current_user_can( 'update_plugins' ) ) {
		$text = __( 'The Gutenberg plugin cannot be used. It is too old for your version of WordPress and was disabled to prevent errors. Please update it.', 'gutenberg' );
	} else {
		$text = __( 'The Gutenberg plugin cannot be used. It is too old for your version of WordPress and was disabled to prevent errors. Please ask an administrator to update it.', 'gutenberg' );
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

	// Show only on the Dashboard and the Plugins screen.
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
 * @since 17.2.0
 */
function gutenberg_version_too_old_notice() {
	$current_screen = get_current_screen();

	// Show only on the Dashboard and the Plugins screen.
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
 * @since 17.2.0
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

		// The text is already HTML escaped.
		$text = gutenberg_wordpress_version_too_old_text();

		$plugin_meta['gutenberg-plugin-notice'] = '<p style="color:red;margin:0.7em 0;">' . $text . '</p>';
	}

	return $plugin_meta;
}

/**
 * Add a "Gutenberg version is too old" plugins list table notice.
 *
 * @since 17.2.0
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

		// The text is already HTML escaped.
		$text = gutenberg_version_too_old_text();

		$plugin_meta['gutenberg-plugin-notice'] = '<p style="color:red;margin:0.7em 0;">' . $text . '</p>';
	}

	return $plugin_meta;
}

/**
 * Add a "(disabled)" notice to the plugin's action links.
 *
 * @since 17.2.0
 *
 * @param string[] $links Array of plugin action links.
 * @param string   $file  Path to the plugin file relative to the plugins directory.
 * @return string[] Updated array of plugin action links.
 */
function gutenberg_disabled_action_links_notice( $links, $file ) {
	$plugin_basename = basename( __DIR__ ) . '/gutenberg.php';

	if ( $file === $plugin_basename ) {
		// Prevent PHP warnings when a plugin uses this filter incorrectly.
		$links = (array) $links;

		$links = array_merge(
			array( 'gutenberg-plugin-notice' => __( '(disabled)', 'gutenberg' ) ),
			$links
		);
	}

	return $links;
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
 *
 * @global string $wp_version             The WordPress version string.
 *
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

		// Add "(disabled)" notice to the plugins action links.
		add_filter( 'plugin_action_links', 'gutenberg_disabled_action_links_notice', 10, 2 );
		add_filter( 'network_admin_plugin_action_links', 'gutenberg_disabled_action_links_notice', 10, 2 );

		// Return early, do not load Gutenberg.
		return;
	} elseif ( version_compare( $wp_version, $max_supported_version, '>=' ) ) {
		/*
		 * Do not load Gutenebrg in newer, unsupported versions of WordPress,
		 * however allow it to load in the next development version.
		 * Example: If GUTENBERG_MAX_WP_VERSION is 6.4, the plugin will load
		 * in 6.5 alpha, beta, and RC, but not in the released 6.5.0.
		 * This will prevent incompatibilities, PHP fatal errors, etc. in production
		 * while still allowing testing with the WP develipment versions.
		 * When loading is prevented ask the users to update Gutenberg.
		 */
		add_action( 'admin_notices', 'gutenberg_version_too_old_notice' );

		// Also add a notice to the plugin's row in the plugins list table.
		add_filter( 'plugin_row_meta', 'gutenberg_version_too_old_plugin_row_meta', 10, 2 );

		// Add "(disabled)" notice to the plugins action links.
		add_filter( 'plugin_action_links', 'gutenberg_disabled_action_links_notice', 10, 2 );
		add_filter( 'network_admin_plugin_action_links', 'gutenberg_disabled_action_links_notice', 10, 2 );

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
