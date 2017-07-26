<?php
/**
 * Verify that we can initialize the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Display a notice and deactivate the Gutenberg plugin.
 *
 * @since 0.1.0
 */
function gutenberg_wordpress_version_notice() {
	echo '<div class="error"><p>';
	echo __( 'Gutenberg requires WordPress 4.8 or later to function properly. Please upgrade WordPress before activating Gutenberg.', 'gutenberg' );
	echo '</p></div>';

	deactivate_plugins( array( 'gutenberg/gutenberg.php' ) );
}

/**
 * Verify that we can initialize the Gutenberg editor plugin.
 *
 * @since 0.1.0
 * @return bool Whether we can initialize the plugin.
 */
function gutenberg_can_init() {
	global $wp_version;

	// Strip `-src` and `-beta` suffixes from $wp_version before comparing.
	// Otherwise the comparison returns incorrect results (`4.8-src` < `4.8`).
	if ( version_compare( strtok( $wp_version, '-' ), '4.8', '<' ) ) {
		add_action( 'admin_notices', 'gutenberg_wordpress_version_notice' );
		return false;
	}

	return true;
}
