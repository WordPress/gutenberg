<?php
/**
 * Make sure we only have one copy of the Gutenberg plugin active.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

if ( function_exists( 'the_gutenberg_project' ) ) {
	if ( ! defined( 'GUTENBERG_MULTIPLE_COPIES' ) ) {
		/**
		 * Displays an admin notice indicating a problem with the plugin.
		 */
		function gutenberg_multiple_copies_admin_notice() {
			echo '<div class="notice notice-error"><p>';
			_e(
				'You have multiple copies of the Gutenberg plugin active. Please deactivate or delete all but one copy.',
				'gutenberg'
			);
			echo '</p></div>';
		}
		add_action( 'admin_notices', 'gutenberg_multiple_copies_admin_notice' );
		define( 'GUTENBERG_MULTIPLE_COPIES', true );
	}
}
