<?php
/**
 * Shared helper function for rendering the submenu icon.
 *
 * @package WordPress
 */

/**
 * Returns the submenu SVG chevron icon.
 *
 * @since 5.9.0
 *
 * @return string
 */
function block_core_shared_navigation_render_submenu_icon() {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false"><path d="M1.50002 4L6.00002 8L10.5 4" stroke-width="1.5"></path></svg>';
}

/**
 * Renders the submenu icon SVG for the Navigation Submenu block.
 *
 * @since 5.9.0
 * @deprecated 7.0.0 Use block_core_shared_navigation_render_submenu_icon() instead.
 *
 * @return string SVG markup for the submenu icon.
 */
function block_core_navigation_submenu_render_submenu_icon() {
	_deprecated_function( __FUNCTION__, '7.0.0', 'block_core_shared_navigation_render_submenu_icon()' );
	return block_core_shared_navigation_render_submenu_icon();
}
