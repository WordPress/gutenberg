<?php
/**
 * Overrides Core's wp-includes/rest-api.php and registers the new endpoint for WP 6.0.
 *
 * @package gutenberg
 */

/**
 * Update `wp_template` and `wp_template-part` post types to use
 * Gutenberg's REST controller.
 *
 * @param array  $args Array of arguments for registering a post type.
 * @param string $post_type Post type key.
 */
function gutenberg_update_templates_template_parts_rest_controller( $args, $post_type ) {
	if ( in_array( $post_type, array( 'wp_template', 'wp_template-part' ), true ) ) {
		$args['rest_controller_class'] = 'Gutenberg_REST_Templates_Controller';
	}
	return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_update_templates_template_parts_rest_controller', 10, 2 );
