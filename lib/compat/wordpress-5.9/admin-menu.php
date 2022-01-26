<?php
/**
 * WP Admin Menus changes to match WordPress 5.9
 *
 * @package gutenberg
 */

/**
 * Removes legacy pages from FSE themes.
 */
function gutenberg_remove_legacy_pages() {
	if ( ! wp_is_block_theme() ) {
		return;
	}

	global $submenu;
	if ( ! isset( $submenu['themes.php'] ) ) {
		return;
	}

	$indexes_to_remove = array();
	$customize_menu    = null;
	foreach ( $submenu['themes.php'] as $index => $menu_item ) {
		if ( false !== strpos( $menu_item[2], 'customize.php' ) ) {
			$indexes_to_remove[] = $index;
			$customize_menu      = $menu_item;
		}

		if ( false !== strpos( $menu_item[2], 'site-editor.php' ) ) {
			$indexes_to_remove[] = $index;
		}

		if ( false !== strpos( $menu_item[2], 'gutenberg-widgets' ) ) {
			$indexes_to_remove[] = $index;
		}
	}

	foreach ( $indexes_to_remove as $index ) {
		unset( $submenu['themes.php'][ $index ] );
	}

	// Add Customizer back but with a new sub-menu position when a site requires this feature.
	if ( gutenberg_site_requires_customizer() && $customize_menu ) {
		$submenu['themes.php'][20] = $customize_menu;
	}
}
add_action( 'admin_menu', 'gutenberg_remove_legacy_pages' );

/**
 * Removes legacy adminbar items from FSE themes.
 *
 * @param WP_Admin_Bar $wp_admin_bar The admin-bar instance.
 */
function gutenberg_adminbar_items( $wp_admin_bar ) {

	// Early exit if not a block theme.
	if ( ! wp_is_block_theme() ) {
		return;
	}

	// Remove customizer link, if this site does not rely on them for plugins or theme options.
	if ( ! gutenberg_site_requires_customizer() ) {
		$wp_admin_bar->remove_node( 'customize' );
		$wp_admin_bar->remove_node( 'customize-background' );
		$wp_admin_bar->remove_node( 'customize-header' );
		$wp_admin_bar->remove_node( 'widgets' );
	}

	// Add site-editor link.
	if ( ! is_admin() && current_user_can( 'edit_theme_options' ) ) {
		$wp_admin_bar->add_node(
			array(
				'id'    => 'site-editor',
				'title' => __( 'Edit site', 'gutenberg' ),
				'href'  => admin_url( 'themes.php?page=gutenberg-edit-site' ),
			)
		);
	}
}
add_action( 'admin_bar_menu', 'gutenberg_adminbar_items', 50 );

/**
 * Override Site Editor URLs to use plugin page.
 *
 * @param string $url Admin URL link with path.
 * @param string $path Path relative to the admin URL.
 * @return string Modified Admin URL link.
 */
function gutenberg_override_site_editor_urls( $url, $path ) {
	if ( $path === 'site-editor.php' ) {
		$url = str_replace( $path, 'themes.php?page=gutenberg-edit-site', $url );
	}

	return $url;
}
add_filter( 'admin_url', 'gutenberg_override_site_editor_urls', 10, 2 );

/**
 * Check if any plugin, or theme features, are using the Customizer.
 *
 * @return bool A boolean value indicating if Customizer support is needed.
 */
function gutenberg_site_requires_customizer() {
	if ( has_action( 'customize_register' ) ) {
		return true;
	}

	return false;
}
