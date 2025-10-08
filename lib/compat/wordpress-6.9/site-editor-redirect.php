<?php

/**
 * Maps old site editor urls to the new updated ones.
 *
 * @since 6.9.0
 * @access private
 *
 * @global string $pagenow The filename of the current screen.
 *
 * @return string|false The new URL to redirect to, or false if no redirection is needed.
 */
function gutenberg_get_site_editor_redirection_6_9() {
	global $pagenow;

	if ( 'site-editor.php' !== $pagenow ) {
		return false;
	}

	// The following redirects are for the new permalinks in the site editor.
	// /wp_template/tt5//home -> /wp_registered_template/tt5//home
	if ( isset( $_REQUEST['p'] ) && preg_match( '#^/wp_template/([a-zA-Z0-9-]+//[a-zA-Z0-9-]+)$#', $_REQUEST['p'], $matches ) ) {
		return add_query_arg( array( 'p' => '/wp_registered_template/' . $matches[1] ), remove_query_arg( array( 'p' ) ) );
	}

	return false;
}

/**
 * Redirect old site editor urls to the new updated ones.
 */
function gutenberg_redirect_site_editor_deprecated_urls_6_9() {
	$redirection = gutenberg_get_site_editor_redirection_6_9();
	if ( false !== $redirection ) {
		wp_safe_redirect( $redirection );
		exit;
	}
}
add_action( 'admin_init', 'gutenberg_redirect_site_editor_deprecated_urls_6_9' );
