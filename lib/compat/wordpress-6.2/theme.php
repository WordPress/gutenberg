<?php
/**
 * Theme overrides for WP 6.2.
 *
 * @package gutenberg
 */

/**
 * Store classic sidebars for later use by block themes.
 *
 * Note: This can be a part of the `switch_theme` method in `wp-includes/theme.php`.
 *
 * @param string   $new_name  Name of the new theme.
 * @param WP_Theme $new_theme WP_Theme instance of the new theme.
 */
function gutenberg_set_classic_sidebars( $new_name, $new_theme ) {
	global $wp_registered_sidebars;

	if ( $new_theme->is_block_theme() ) {
		set_theme_mod( 'wp_classic_sidebars', $wp_registered_sidebars );
	}
}
add_action( 'switch_theme', 'gutenberg_set_classic_sidebars', 10, 2 );
