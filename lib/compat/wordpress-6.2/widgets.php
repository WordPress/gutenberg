<?php
/**
 * Core Widget APIs for WP 6.2.
 *
 * @package gutenberg
 */

if ( ! function_exists( '_wp_block_theme_stub_sidebars' ) ) {
	/**
	 * Register the previous theme's sidebars for the block themes.
	 *
	 * @return void
	 */
	function _wp_block_theme_stub_sidebars() {
		global $wp_registered_sidebars;

		if ( ! wp_is_block_theme() ) {
			return;
		}

		$legacy_sidebars = get_theme_mod( 'wp_legacy_sidebars' );
		if ( empty( $legacy_sidebars ) ) {
			return;
		}

		// Don't use `register_sidebar` since it will enable the `widgets` support for a theme.
		foreach ( $legacy_sidebars as $sidebar ) {
			$wp_registered_sidebars[ $sidebar['id'] ] = $sidebar;
		}
	}
	add_action( 'widgets_init', '_wp_block_theme_stub_sidebars' );
}
