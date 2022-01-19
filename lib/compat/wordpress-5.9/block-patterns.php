<?php
/**
 * Block patterns functions.
 *
 * @package gutenberg
 */

if ( ! function_exists( '_load_remote_featured_patterns' ) ) {
	/**
	 * Loads featured patterns from patterns directory.
	 */
	function _load_remote_featured_patterns() {
		/**
		 * Filter to disable remote block patterns.
		 *
		 * @since 5.8.0
		 *
		 * @param bool $should_load_remote
		 */
		$should_load_remote = apply_filters( 'should_load_remote_block_patterns', true );

		if ( ! $should_load_remote ) {
			return;
		}

		if ( ! WP_Block_Pattern_Categories_Registry::get_instance()->is_registered( 'featured' ) ) {
			register_block_pattern_category( 'featured', array( 'label' => __( 'Featured', 'gutenberg' ) ) );
		}
		$request             = new WP_REST_Request( 'GET', '/wp/v2/pattern-directory/patterns' );
		$request['category'] = 26; // This is the `Featured` category id from pattern directory.
		$response            = rest_do_request( $request );
		if ( $response->is_error() ) {
			return;
		}
		$patterns = $response->get_data();
		foreach ( $patterns as $pattern ) {
			$pattern_name = sanitize_title( $pattern['title'] );
			$registry     = WP_Block_Patterns_Registry::get_instance();
			// Some patterns might be already registered as core patterns with the `core` prefix.
			$is_registered = $registry->is_registered( $pattern_name ) || $registry->is_registered( "core/$pattern_name" );
			if ( ! $is_registered ) {
				register_block_pattern( $pattern_name, (array) $pattern );
			}
		}
	}

	add_action(
		'current_screen',
		function( $current_screen ) {
			if ( ! get_theme_support( 'core-block-patterns' ) ) {
				return;
			}

			$is_site_editor = ( function_exists( 'gutenberg_is_edit_site_page' ) && gutenberg_is_edit_site_page( $current_screen->id ) );
			if ( $current_screen->is_block_editor || $is_site_editor ) {
				_load_remote_featured_patterns();
			}
		}
	);
}
