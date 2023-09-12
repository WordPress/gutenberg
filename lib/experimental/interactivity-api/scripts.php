<?php
/**
 * Utils to optimize the interactive scripts.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Makes sure that interactivity scripts execute after all `wp_store` directives have been printed to the page.
 *
 * In WordPress 6.3+ this is achieved by printing in the head but marking the scripts with defer. This has the benefit
 * of early discovery so the script is loaded by the browser, while at the same time not blocking rendering. In older
 * versions of WordPress, this is achieved by loading the scripts in the footer.
 *
 * @link https://make.wordpress.org/core/2023/07/14/registering-scripts-with-async-and-defer-attributes-in-wordpress-6-3/
 */
function gutenberg_interactivity_move_interactive_scripts_to_the_footer() {
	$supports_defer = version_compare( strtok( get_bloginfo( 'version' ), '-' ), '6.3', '>=' );
	if ( $supports_defer ) {
		// Defer execution of @wordpress/interactivity package but continue loading in head.
		wp_script_add_data( 'wp-interactivity', 'strategy', 'defer' );
		wp_script_add_data( 'wp-interactivity', 'group', 0 );
	} else {
		// Move the @wordpress/interactivity package to the footer.
		wp_script_add_data( 'wp-interactivity', 'group', 1 );
	}

	// Move all the view scripts of the interactive blocks to the footer.
	$registered_blocks = \WP_Block_Type_Registry::get_instance()->get_all_registered();
	foreach ( array_values( $registered_blocks ) as $block ) {
		if ( isset( $block->supports['interactivity'] ) && $block->supports['interactivity'] ) {
			foreach ( $block->view_script_handles as $handle ) {
				// Note that all block view scripts are already made defer by default.
				wp_script_add_data( $handle, 'group', $supports_defer ? 0 : 1 );
			}
		}
	}
}
add_action( 'wp_enqueue_scripts', 'gutenberg_interactivity_move_interactive_scripts_to_the_footer', 11 );
