<?php
/**
 * WP_Navigation_Gutenberg class
 *
 * @package gutenberg
 * @since 6.3.0
 */

/**
 * Manages which duotone filters need to be output on the page.
 *
 * @access public
 */
class WP_Navigation_Gutenberg {

	public static function get_fallback_menu() {
		$should_skip = apply_filters( 'block_core_navigation_skip_fallback', false );

		if ( $should_skip ) {
			return array();
		}

		// Get the most recently published Navigation post.
		$navigation_post = static::get_most_recently_published_navigation();

		// If there are no navigation posts then try to find a classic menu
		// and convert it into a block based navigation menu.
		if ( ! $navigation_post ) {
			$navigation_post = gutenberg_block_core_navigation_maybe_use_classic_menu_fallback();
		}

		// If there are no navigation posts then default to a list of Pages.
		if ( ! $navigation_post ) {
			$navigation_post = static::create_default_fallback();
		}

		// If we could not create a fallback then return an error indicating thus.
		// TODO: include data on the reason for failure in this error.
		if ( is_wp_error( $navigation_post ) ) {
			return new WP_Error( 'no_fallback', __( 'Could not create a fallback navigation menu.' ) );
		}

		// We have to fetch the Post by ID
		return get_post( $navigation_post );
	}



	/**
	 * Finds the most recently published `wp_navigation` Post.
	 *
	 * @return WP_Post|null the first non-empty Navigation or null.
	 */
	public static function get_most_recently_published_navigation() {

		// Default to the most recently created menu.
		$parsed_args = array(
			'post_type'              => 'wp_navigation',
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'order'                  => 'DESC',
			'orderby'                => 'date',
			'post_status'            => 'publish',
			'posts_per_page'         => 1, // get only the most recent.
		);

		$navigation_post = new WP_Query( $parsed_args );

		if ( count( $navigation_post->posts ) > 0 ) {
			return $navigation_post->posts[0];
		}

		return null;
	}

	private static function create_default_fallback() {
		$registry = WP_Block_Type_Registry::get_instance();

		// If `core/page-list` is not registered then use empty blocks.
		$default_blocks = $registry->is_registered( 'core/page-list' ) ? '<!-- wp:page-list /-->' : '';
		// Create a new navigation menu from the fallback blocks.

		$wp_insert_post_result = wp_insert_post(
			array(
				'post_content' => $default_blocks,
				'post_title'   => _x( 'Navigation', 'Title of a Navigation menu', 'gutenberg' ),
				'post_name'    => 'navigation',
				'post_status'  => 'publish',
				'post_type'    => 'wp_navigation',
			),
			true // So that we can check whether the result is an error.
		);

		return $wp_insert_post_result;
	}
}
