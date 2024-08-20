<?php
/**
 * WordPress 6.6 compatibility functions.
 *
 * @package gutenberg
 */

/**
 * Change the Patterns submenu link and remove the Template Parts submenu for
 * the Classic theme. This function should not be backported to core, and should be
 * removed when the required WP core version for Gutenberg is >= 6.6.0.
 *
 * @global array $submenu
 */
function gutenberg_change_patterns_link_and_remove_template_parts_submenu_item() {
	if ( ! wp_is_block_theme() ) {
		global $submenu;

		if ( empty( $submenu['themes.php'] ) ) {
			return;
		}

		foreach ( $submenu['themes.php'] as $key => $item ) {
			if ( 'edit.php?post_type=wp_block' === $item[2] ) {
				$submenu['themes.php'][ $key ][2] = 'site-editor.php?path=/patterns';
			} elseif ( 'site-editor.php?path=/wp_template_part/all' === $item[2] ) {
				unset( $submenu['themes.php'][ $key ] );
			}
		}
	}
}
add_action( 'admin_init', 'gutenberg_change_patterns_link_and_remove_template_parts_submenu_item' );
