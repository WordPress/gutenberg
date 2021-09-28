<?php
/**
 * Full Site Editing Utils
 *
 * @package gutenberg
 */

/**
 * Returns whether the current theme is an FSE theme or not.
 *
 * @return boolean Whether the current theme is an FSE theme or not.
 */
function gutenberg_is_fse_theme() {
	return is_readable( get_theme_file_path( '/block-templates/index.html' ) );
}

/**
 * Returns whether the current theme is FSE-enabled or not.
 *
 * @return boolean Whether the current theme is FSE-enabled or not.
 */
function gutenberg_supports_block_templates() {
	return gutenberg_is_fse_theme() || current_theme_supports( 'block-templates' );
}

/**
 * Show a notice when a Full Site Editing theme is used.
 */
function gutenberg_full_site_editing_notice() {
	if ( ! gutenberg_is_fse_theme() || 'themes' !== get_current_screen()->base ) {
		return;
	}
	?>
	<div class="notice notice-warning">
		<p><?php _e( 'You\'re using an experimental Full Site Editing theme. Full Site Editing is an experimental feature and potential API changes are to be expected!', 'gutenberg' ); ?></p>
	</div>
	<?php
}
add_action( 'admin_notices', 'gutenberg_full_site_editing_notice' );

/**
 * Removes legacy pages from FSE themes.
 */
function gutenberg_remove_legacy_pages() {
	if ( ! gutenberg_is_fse_theme() ) {
		return;
	}

	global $submenu;
	if ( isset( $submenu['themes.php'] ) ) {
		$indexes_to_remove = array();
		foreach ( $submenu['themes.php'] as $index => $menu_item ) {
			if (
				false !== strpos( $menu_item[2], 'customize.php' ) ||
				false !== strpos( $menu_item[2], 'gutenberg-widgets' )
			) {
				$indexes_to_remove[] = $index;
			}
		}

		foreach ( $indexes_to_remove as $index ) {
			unset( $submenu['themes.php'][ $index ] );
		}
	}
}

add_action( 'admin_menu', 'gutenberg_remove_legacy_pages' );

/**
 * Removes legacy adminbar items from FSE themes.
 *
 * @param WP_Admin_Bar $wp_admin_bar The admin-bar instance.
 */
function gutenberg_adminbar_items( $wp_admin_bar ) {

	// Early exit if not an FSE theme.
	if ( ! gutenberg_is_fse_theme() ) {
		return;
	}

	// Remove customizer link.
	$wp_admin_bar->remove_node( 'customize' );
	$wp_admin_bar->remove_node( 'customize-background' );
	$wp_admin_bar->remove_node( 'customize-header' );
	$wp_admin_bar->remove_node( 'widgets' );

	// Add site-editor link.
	if ( ! is_admin() && current_user_can( 'edit_theme_options' ) ) {
		$wp_admin_bar->add_node(
			array(
				'id'    => 'site-editor',
				'title' => __( 'Edit site', 'gutenberg' ),
				'href'  => admin_url( 'admin.php?page=gutenberg-edit-site' ),
			)
		);
	}
}

add_action( 'admin_bar_menu', 'gutenberg_adminbar_items', 50 );

/**
 * Activates the 'menu_order' filter and then hooks into 'menu_order'
 */
add_filter( 'custom_menu_order', '__return_true' );
add_filter( 'menu_order', 'gutenberg_menu_order' );

/**
 * Filters WordPress default menu order
 *
 * @param array $menu_order Menu Order.
 */
function gutenberg_menu_order( $menu_order ) {
	if ( ! gutenberg_is_fse_theme() ) {
		return $menu_order;
	}

	$new_positions = array(
		// Position the site editor before the appearance menu.
		'gutenberg-edit-site' => array_search( 'themes.php', $menu_order, true ),
	);

	// Traverse through the new positions and move
	// the items if found in the original menu_positions.
	foreach ( $new_positions as $value => $new_index ) {
		$current_index = array_search( $value, $menu_order, true );
		if ( $current_index ) {
			$out = array_splice( $menu_order, $current_index, 1 );
			array_splice( $menu_order, $new_index, 0, $out );
		}
	}
	return $menu_order;
}

/**
 * Tells the script loader to load the scripts and styles of custom block on site editor screen.
 *
 * @param bool $is_block_editor_screen Current decision about loading block assets.
 * @return bool Filtered decision about loading block assets.
 */
function gutenberg_site_editor_load_block_editor_scripts_and_styles( $is_block_editor_screen ) {
	return ( is_callable( 'get_current_screen' ) && get_current_screen() && 'toplevel_page_gutenberg-edit-site' === get_current_screen()->base )
		? true
		: $is_block_editor_screen;
}
add_filter( 'should_load_block_editor_scripts_and_styles', 'gutenberg_site_editor_load_block_editor_scripts_and_styles' );
