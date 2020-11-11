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
	return is_readable( STYLESHEETPATH . '/block-templates/index.html' );
}

/**
 * Show a notice when a Full Site Editing theme is used.
 */
function gutenberg_full_site_editing_notice() {
	if ( ! gutenberg_is_fse_theme() ) {
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
 * Activates the 'menu_order' filter and then hooks into 'menu_order'
 */
add_filter( 'custom_menu_order', '__return_true' );
