<?php
/**
 * Admin menu overrides for WP 6.2.
 *
 * @package gutenberg
 */

/**
 * Updates "Template Parts" menu URL to include `path` query argument.
 *
 * Note: Remove when the minimum required WP version is 6.2.
 * No need to backport in core. Changes are applied in wp-admin/menu.php.
 */
function gutenberg_update_template_parts_menu_url() {
	if ( wp_is_block_theme() ) {
		return;
	}

	if ( ! current_theme_supports( 'block-template-parts' ) ) {
		return;
	}

	global $submenu;
	if ( ! isset( $submenu['themes.php'] ) ) {
		return;
	}

	foreach ( $submenu['themes.php'] as $index => $menu_item ) {
		if ( str_contains( $menu_item[2], 'site-editor.php?postType=wp_template_part' ) && ! str_contains( $menu_item[2], 'path=' ) ) {
			$submenu['themes.php'][ $index ][2] = 'site-editor.php?postType=wp_template_part&path=/wp_template_part/all';
			break;
		}
	}
}
add_action( 'admin_menu', 'gutenberg_update_template_parts_menu_url' );
