<?php

if ( ! function_exists( 'add_gutenberg_options_page' ) ) {
	function gutenberg_add_options_page( $page_title, $menu_title, $capability, $menu_slug, $callback, $position = null ) {
		add_options_page(
			$page_title,
			$menu_title,
			$capability,
			$menu_slug,
			$callback,
			$position,
		);

		// TODO: register page as a Gutenberg settings page
	}
}