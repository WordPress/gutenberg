<?php
/**
 * Shared helper function for rendering the submenu icon.
 *
 * @package WordPress
 */

/**
 * Returns the submenu SVG chevron icon.
 *
 * Resolves the icon through the WordPress Icon Registry so that themes can
 * override the visual implementation by registering a replacement for the
 * `core/navigation-submenu` icon.
 *
 * @since 5.9.0
 *
 * @return string
 */
function block_core_shared_navigation_render_submenu_icon() {
	$icon = wp_get_icon( 'core/navigation-submenu' );
	if ( '' !== $icon ) {
		return $icon;
	}

	// Fallback for when the Icon Registry is not available.
	return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false"><path d="M1.50002 4L6.00002 8L10.5 4" stroke-width="1.5"></path></svg>';
}
