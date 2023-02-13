<?php
/**
 * Overrides the site editor initialization for WordPress 6.3.
 *
 * @package gutenberg
 */

/**
 * Overrides the site editor initialization for WordPress 6.3 and cancels the redirection.
 * The logic of this function is not important, we just need to remove the redirection from core.
 *
 * @param string $location Location.
 *
 * @return string Updated location.
 */
function gutenberg_prevent_site_editor_redirection( $location ) {
	if ( strpos( $location, 'site-editor.php' ) !== false && strpos( $location, '?' ) !== false ) {
		return add_query_arg(
			array( 'postId' => 'none' ),
			admin_url( 'site-editor.php' )
		);
	}

	return $location;
}

add_filter( 'wp_redirect', 'gutenberg_prevent_site_editor_redirection', 1 );
