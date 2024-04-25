<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

if ( ! function_exists( 'wp_api_template_access_controller' ) ) {
	/**
	 * Hook in to the template and template part post types and modify the
	 * access control for the rest endpoint to allow lower user roles to access
	 * the templates and template parts.
	 *
	 * @param array  $args Current registered post type args.
	 * @param string $post_type Name of post type.
	 *
	 * @return array
	 */
	function wp_api_template_access_controller( $args, $post_type ) {
		if ( 'wp_template' === $post_type || 'wp_template_part' === $post_type ) {
			$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller_6_6';
		}
		return $args;
	}
}
add_filter( 'register_post_type_args', 'wp_api_template_access_controller', 10, 2 );

function gutenberg_block_editor_preload_paths_6_6( $paths ) {
	$paths[] = array( '/wp/v2/settings', 'OPTIONS' );
	$paths[] = '/wp/v2/settings';
	$paths[] = array( '/wp/v2/templates', 'OPTIONS' );
	$paths[] = '/wp/v2/types?context=edit';
	$paths[] = '/?_fields=' . urlencode( implode( ',', [
		'description',
		'gmt_offset',
		'home',
		'name',
		'site_icon',
		'site_icon_url',
		'site_logo',
		'timezone_string',
		'url',
	] ) );
	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', 'gutenberg_block_editor_preload_paths_6_6', 10 );
