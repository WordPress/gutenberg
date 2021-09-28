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
	define( 'GUTENBERG_MIN_WP_VERSION', '5.7' );
}

// Next unsupporetd version.
if ( ! defined( 'GUTENBERG_NEXT_UNSUPPORTED_WP_VERSION' ) ) {
	// The next major WordPress version that is not supported yet.
	// Generally that would be the current WP trunk + 1. This will allow running of
	// the currently released Gutenberg while the next WP version is under development,
	// but not after it has been released.
	// For example if the next unsupported version is 6.0, Gutenberg will still run
	// in 6.0-alpha-12345, 6.0-beta1, etc. but not in 6.0, 6.0.1, 6.0.1-alpha, etc.
	// Also note that `version_compare()` considers 1 < 1.0 < 1.0.0 (before suffixes)
	// so 6.0 < 6.0.0-alpha and 6.0-beta < 6.0.0-alpha are both true. For that reason
	// the constant should be set to major (two digits) WordPress version.
	define( 'GUTENBERG_NEXT_UNSUPPORTED_WP_VERSION', '6.0' );
}

if ( defined( 'ABSPATH' ) ) {
	gutenberg_pre_init();
} else {
	die( 'Invalid request.' );
}

/**
 * Display a "WordPress version is too old" notice.
 *
 * @since 0.1.0
 */
function gutenberg_wordpress_version_too_old_notice() {
	echo '<div class="error"><p>';

	if ( current_user_can( 'update_plugins' ) ) {
		printf(
			/* translators: %s: Minimum required version */
			__( 'The Gutenberg plugin cannot be used. It requires WordPress %s or later to function properly. Please upgrade WordPress.', 'gutenberg' ),
			esc_html( GUTENBERG_MIN_WP_VERSION )
		);
	} else {
		printf(
			/* translators: %s: Minimum required version */
			__( 'The Gutenberg plugin cannot be used. It requires WordPress %s or later to function properly. Please ask an administrator to upgrade WordPress.', 'gutenberg' ),
			esc_html( GUTENBERG_MIN_WP_VERSION )
		);
	}

	echo '</p></div>';
}

/**
 * Display a "Gutenberg version is too old" notice.
 *
 * @since 11.7.0
 */
function gutenberg_version_too_old_notice() {
	echo '<div class="error"><p>';

	if ( current_user_can( 'update_plugins' ) ) {
		printf(
			/* translators: %s: URL to the Plugins screen */
			__( 'The Gutenberg plugin cannot be used. It is too old for your version of WordPress. Please <a href="%s">turn auto-updates on</a> or updage it manually.', 'gutenberg' ),
			admin_url( 'plugins.php' )
		);
	} else {
		_e( 'The Gutenberg plugin cannot be used. It is too old for your version of WordPress. Please ask an administratior to updage it.', 'gutenberg' );
	}

	echo '</p></div>';
}

/**
 * Add a "WordPress version is too old" plugins list table notice.
 *
 * @since 11.7.0
 *
 * @param $links string[] Array of plugin action links.
 * @param $file  string   Path to the plugin file relative to the plugins directory.
 * @return string[] Updated array of plugin action links.
 */
function gutenberg_wordpress_version_too_old_action_links_notice( $links, $file ) {
	$plugin_basename = basename( __DIR__ ) . '/gutenberg.php';

	if ( $file === $plugin_basename && current_user_can( 'manage_options' ) ) {
		// Prevent PHP warnings when a plugin uses this filter incorrectly.
		$links = (array) $links;

		// Can only be a very short notice.
		$text = __( 'WordPress is too old. Gutenberg cannot be used.', 'gutenberg' );

		// The 'button-link-delete' class name makes the text red.
		$links['wp-gutenberg-plugin-notice button-link-delete'] = esc_html( $text );
	}

	return $links;
}

/**
 * Add a "Gutenberg version is too old" plugins list table notice.
 *
 * @since 11.7.0
 *
 * @param $links string[] Array of plugin action links.
 * @param $file  string   Path to the plugin file relative to the plugins directory.
 * @return string[] Updated array of plugin action links.
 */
function gutenberg_version_too_old_action_links_notice( $links, $file ) {
	$plugin_basename = basename( __DIR__ ) . '/gutenberg.php';

	if ( $file === $plugin_basename && current_user_can( 'manage_options' ) ) {
		// Prevent PHP warnings when a plugin uses this filter incorrectly.
		$links = (array) $links;

		// Can only be a very short notice.
		$text = __( 'Gutenberg is too old and cannot be used.', 'gutenberg' );

		// The 'button-link-delete' class name makes the text red.
		$links['wp-gutenberg-plugin-notice button-link-delete'] = esc_html( $text );
	}

	return $links;
}

/**
 * Add a "Gutenberg version is getting old. Please update!" notice on the Dashboard.
 *
 * @since 11.7.0
 */
function gutenberg_needs_update_notice() {
	echo '<div class="notice notice-warning is-dismissible"><p>';

	printf(
		/* translators: %s: Too new, unsupported WordPress version */
		__( 'Your version of Gutenberg is getting too old. It will stop working after you upgrade WordPress to %s. Please turn auto-updates on for the Gutenberg plugin or updage it manually.', 'gutenberg' ),
		esc_html( GUTENBERG_NEXT_UNSUPPORTED_WP_VERSION )
	);

	echo '</p></div>';
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

	// Strip '-src' from the version string. Messes up version_compare().
	$wp_version = str_replace( '-src', '', $wp_version );

	// Check if this version of Gutenberg supports the version of WordPress.
	// Compare against major release versions (X.Y) rather than minor (X.Y.Z)
	// unless a minor release is the actual minimum requirement. WordPress reports
	// X.Y for its major releases.
	if ( version_compare( $wp_version, GUTENBERG_MIN_WP_VERSION, '<' ) ) {
		add_action( 'admin_notices', 'gutenberg_wordpress_version_too_old_notice' );

		// Also add a notice to the plugin's row in the plugins list table.
		add_filter( 'plugin_action_links', 'gutenberg_wordpress_version_too_old_action_links_notice', 10, 2 );
		add_filter( 'network_admin_plugin_action_links', 'gutenberg_wordpress_version_too_old_action_links_notice', 10, 2 );

		return;
	} elseif ( version_compare( $wp_version, GUTENBERG_NEXT_UNSUPPORTED_WP_VERSION, '>=' ) ) {
		// Do not load in newer, unsupported versions of WordPress. This will prevent incompatibilities,
		// PHP fatal errors, etc. in the future. Ask the users to update Gutenberg or turn plugin auto-updates on.
		add_action( 'admin_notices', 'gutenberg_version_too_old_notice' );

		// Also add a notice to the plugin's row in the plugins list table.
		add_filter( 'plugin_action_links', 'gutenberg_version_too_old_action_links_notice', 10, 2 );
		add_filter( 'network_admin_plugin_action_links', 'gutenberg_version_too_old_action_links_notice', 10, 2 );

		return;
	} elseif (
		version_compare( $wp_version, GUTENBERG_NEXT_UNSUPPORTED_WP_VERSION, '<' ) &&
		version_compare( $wp_version, GUTENBERG_NEXT_UNSUPPORTED_WP_VERSION . '-alpha', '>=' )
	) {
		// Running in a newer WordPress aplha/beta/RC.
		// Gutenberg will stop loading after this version of WordPress is released and the site is upgraded.
		add_action( 'admin_notices', 'gutenberg_needs_update_notice' );
	}

	// Check if Gutenberg has been built for the first time.
	if ( defined( 'GUTENBERG_DEVELOPMENT_MODE' ) && GUTENBERG_DEVELOPMENT_MODE && ! file_exists( __DIR__ . '/build/blocks' ) ) {
		add_action( 'admin_notices', 'gutenberg_build_files_notice' );
		return;
	}

	// Load the plugin.
	require_once __DIR__ . '/lib/load.php';
}
