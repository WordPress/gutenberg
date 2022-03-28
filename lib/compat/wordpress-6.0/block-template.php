<?php
/**
 * Block template loader functions.
 *
 * @package WordPress
 */

/**
 * Return the correct template for the site's home page.
 *
 * @access private
 * @since 6.0.0
 *
 * @return array|null A template object, or null if none could be found
 */
function gutenberg_resolve_home_template() {
	$show_on_front = get_option( 'show_on_front' );
	$front_page_id = get_option( 'page_on_front' );

	if ( 'page' === $show_on_front && $front_page_id ) {
		return array(
			'postType' => 'page',
			'postId'   => $front_page_id,
		);
	}

	$hierarchy = array( 'front-page', 'home', 'index' );
	$template  = gutenberg_resolve_template( 'home', $hierarchy, '' );

	if ( ! $template ) {
		return null;
	}

	return array(
		'postType' => 'wp_template',
		'postId'   => $template->id,
	);
}
