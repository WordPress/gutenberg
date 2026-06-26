<?php
/**
 * Experiment that swaps the admin bar and admin menu dashicons for @wordpress/icons SVGs read from the library files.
 *
 * @package gutenberg
 */

/**
 * Whether the experiment is enabled.
 */
function gutenberg_admin_wp_icons_enabled() {
	return gutenberg_is_experiment_enabled( 'gutenberg-admin-wp-icons' );
}

/**
 * Returns inline SVG markup for a library icon.
 *
 * Implementation adapted from `wp_get_icon()`, but reads the SVG from its library file instead of the
 * icon registry so we can render icons that are not publicly registered.
 */
function gutenberg_admin_wp_icons_svg( $icon_name, $size = 22 ) {
	$slug = str_starts_with( $icon_name, 'core/' ) ? substr( $icon_name, 5 ) : $icon_name;
	if ( ! preg_match( '/^[a-z0-9-]+$/', $slug ) ) {
		return '';
	}

	$path = gutenberg_dir_path() . 'packages/icons/src/library/' . $slug . '.svg';
	if ( ! is_readable( $path ) ) {
		return '';
	}

	$processor = new WP_HTML_Tag_Processor( file_get_contents( $path ) );
	if ( ! $processor->next_tag( 'svg' ) ) {
		return '';
	}

	$processor->set_attribute( 'width', (string) $size );
	$processor->set_attribute( 'height', (string) $size );
	$processor->set_attribute( 'aria-hidden', 'true' );
	$processor->set_attribute( 'focusable', 'false' );

	return $processor->get_updated_html();
}
