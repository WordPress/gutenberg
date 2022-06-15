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


/**
 * Updates WP_REST_Post_Types_Controller schema by adding the
 * post type's `icon`(menu_icon).
 */
function gutenberg_update_post_types_rest_response() {
	$post_types = get_post_types( array( 'show_in_rest' => true ), 'objects' );
	register_rest_field(
		'type',
		'icon',
		array(
			'get_callback'    => function ( $post_type ) use ( $post_types ) {
				if ( isset( $post_types[ $post_type['slug'] ] ) ) {
					return $post_types[ $post_type['slug'] ]->menu_icon;
				}
			},
			'update_callback' => null,
			'schema'          => array(
				'description' => __( 'The url to the icon to be used for this menu or the name of the icon from the iconfont.', 'gutenberg' ),
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_update_post_types_rest_response' );
