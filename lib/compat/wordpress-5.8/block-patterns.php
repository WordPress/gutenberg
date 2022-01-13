<?php
/**
 * Block patterns functions.
 *
 * @package gutenberg
 */

if ( ! function_exists( '_load_remote_block_patterns' ) ) {
	/**
	 * Register Core's official patterns from wordpress.org/patterns.
	 *
	 * @since 5.8.0
	 */
	function _load_remote_block_patterns() {
		/**
		 * Filter to disable remote block patterns.
		 *
		 * @since 5.8.0
		 *
		 * @param bool $should_load_remote
		 */
		$should_load_remote = apply_filters( 'should_load_remote_block_patterns', true );

		if ( $should_load_remote ) {
			$request         = new WP_REST_Request( 'GET', '/wp/v2/pattern-directory/patterns' );
			$core_keyword_id = 11; // 11 is the ID for "core".
			$request->set_param( 'keyword', $core_keyword_id );
			$response = rest_do_request( $request );
			if ( $response->is_error() ) {
				return;
			}
			$patterns = $response->get_data();

			foreach ( $patterns as $settings ) {
				$pattern_name = 'core/' . sanitize_title( $settings['title'] );
				register_block_pattern( $pattern_name, (array) $settings );
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
				_load_remote_block_patterns();
			}
		}
	);
}
