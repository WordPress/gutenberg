<?php
/**
 * Plugin Name: Gutenberg
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Description: Printing since 1440. This is the development plugin for the new block editor in core. <strong>Meant for development, do not run on real sites.</strong>
 * Version: 0.1.0
 * Author: Gutenberg Team
 *
 * @package gutenberg
 */

### BEGIN AUTO-GENERATED DEFINES
define( 'GUTENBERG_DEVELOPMENT_MODE', true );
### END AUTO-GENERATED DEFINES

// Add check to ensure WordPress Verion.
if ( version_compare( $wp_version, '4.8', '<' ) ) {
	add_action( 'admin_notices', 'gutenberg_wordpress_version_notice' );
	/**
	 * Display a notice and deactivate Gutenberg
	 */
	function gutenberg_wordpress_version_notice() {
		echo '<div class="error"><p>';
		echo __( 'Gutenberg requires WordPress 4.8 or later to function properly. Please upgrade WordPress before activating Gutenberg.', 'gutenberg' );
		echo '</p></div>';

		deactivate_plugins( array( 'gutenberg/gutenberg.php' ) );
	}
} else {
	// Load API functions.
	require_once dirname( __FILE__ ) . '/lib/blocks.php';
	require_once dirname( __FILE__ ) . '/lib/client-assets.php';
	require_once dirname( __FILE__ ) . '/lib/i18n.php';
	require_once dirname( __FILE__ ) . '/lib/register.php';

	// Register server-side code for individual blocks.
	require_once dirname( __FILE__ ) . '/lib/blocks/latest-posts.php';
}
