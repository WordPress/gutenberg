<?php
/**
 * Media compatibility functions for WordPress 7.2.
 *
 * @package gutenberg
 */

/**
 * Turns off attaching media to the post on save when attachment pages are enabled.
 *
 * Attaching an image moves its attachment page to a URL under the post, and the
 * old URL then returns a 404. With attachment pages disabled, attachment pages
 * redirect to the file, so there is no page URL to keep.
 *
 * Runs before the default priority so sites can still turn it back on with
 * their own `block_editor_settings_all` filter.
 *
 * @see https://github.com/WordPress/gutenberg/issues/84831
 *
 * @param array $settings Block editor settings.
 * @return array Filtered block editor settings.
 */
function gutenberg_disable_auto_attach_media_with_attachment_pages( $settings ) {
	if ( get_option( 'wp_attachment_pages_enabled' ) ) {
		$settings['autoAttachMediaEnabled'] = false;
	}

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_disable_auto_attach_media_with_attachment_pages', 0 );
