<?php
/**
 * Overrides Core's wp-includes/rest-api.php and registers the new endpoint for WP 6.3.
 *
 * @package gutenberg
 */

/**
 * Registers the block pattern directory.
 */
function gutenberg_register_rest_pattern_directory() {
	$pattern_directory_controller = new Gutenberg_REST_Pattern_Directory_Controller_6_3();
	$pattern_directory_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_pattern_directory' );

/**
 * Updates `wp_template` and `wp_template_part` post types to use
 * Gutenberg's REST controllers
 *
 * Adds `_edit_link` to the `wp_global_styles`, `wp_template`,
 * and `wp_template_part` post type schemata. See https://github.com/WordPress/gutenberg/issues/48065
 *
 * @param array  $args Array of arguments for registering a post type.
 * @param string $post_type Post type key.
 */
function gutenberg_update_templates_template_parts_rest_controller( $args, $post_type ) {
	if ( in_array( $post_type, array( 'wp_template', 'wp_template_part' ), true ) ) {
		$template_edit_link            = 'site-editor.php?' . build_query(
			array(
				'postType' => $post_type,
				'postId'   => '%s',
				'canvas'   => 'edit',
			)
		);
		$args['_edit_link']            = $template_edit_link;
		$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller_6_3';
	}

	if ( in_array( $post_type, array( 'wp_global_styles' ), true ) ) {
		$args['_edit_link'] = '/site-editor.php?canvas=edit';
	}
	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_update_templates_template_parts_rest_controller', 10, 2 );

/**
 * Registers the Global Styles Revisions REST API routes.
 */
function gutenberg_register_global_styles_revisions_endpoints() {
	$global_styles_revisions_controller = new Gutenberg_REST_Global_Styles_Revisions_Controller();
	$global_styles_revisions_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_global_styles_revisions_endpoints' );

/**
 * Registers the Global Styles REST API routes.
 */
function gutenberg_register_global_styles_endpoints() {
	$global_styles_controller = new Gutenberg_REST_Global_Styles_Controller_6_3();
	$global_styles_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_global_styles_endpoints' );

/**
 * Update `wp_global_styles` post type to use Gutenberg's REST controller.
 *
 * @param array  $args Array of arguments for registering a post type.
 * @param string $post_type Post type key.
 */
function gutenberg_update_global_styles_rest_controller( $args, $post_type ) {
	if ( in_array( $post_type, array( 'wp_global_styles' ), true ) ) {
		$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller_6_3';
		$args['rest_base']             = 'global-styles';
	}
	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_update_global_styles_rest_controller', 10, 2 );
