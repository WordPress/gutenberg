<?php
/**
 * Updates the site-editor.php file
 *
 * @package gutenberg
 */

/**
 * Remove home template setting for WP 6.2.
 *
 * @param array                   $settings Existing block editor settings.
 * @param WP_Block_Editor_Context $context The current block editor context.
 * @return array
 */
function gutenberg_site_editor_unset_homepage_setting( $settings, $context ) {
	if ( isset( $context->post ) ) {
		return $settings;
	}

	unset( $settings['__unstableHomeTemplate'] );

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_site_editor_unset_homepage_setting', 10, 2 );

/**
 * Overrides the site editor initialization for WordPress 6.2 and cancels the redirection.
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
