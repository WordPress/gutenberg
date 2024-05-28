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

/**
 * Adds the post classes to the REST API response.
 *
 * @param  array  $post  The response object data.
 *
 * @return array
 */
function gutenberg_add_class_list_to_api_response( $post ) {

	if ( ! isset( $post['id'] ) ) {
		return array();
	}

	return get_post_class( array(), $post['id'] );
}

/**
 * Adds the post classes to public post types in the REST API.
 */
function gutenberg_add_class_list_to_public_post_types() {
	$post_types = get_post_types(
		array(
			'public'       => true,
			'show_in_rest' => true,
		),
		'names'
	);

	if ( ! empty( $post_types ) ) {
		register_rest_field(
			$post_types,
			'class_list',
			array(
				'get_callback' => 'gutenberg_add_class_list_to_api_response',
				'schema'       => array(
					'description' => __( 'An array of the class names for the post container element.', 'gutenberg' ),
					'type'        => 'array',
					'items'       => array(
						'type' => 'string',
					),
				),
			)
		);
	}
}
add_action( 'rest_api_init', 'gutenberg_add_class_list_to_public_post_types' );


/**
 * Registers the Global Styles Revisions REST API routes.
 */
function gutenberg_register_global_styles_revisions_endpoints() {
	$global_styles_revisions_controller = new Gutenberg_REST_Global_Styles_Revisions_Controller_6_6();
	$global_styles_revisions_controller->register_routes();
}

add_action( 'rest_api_init', 'gutenberg_register_global_styles_revisions_endpoints' );

/**
 * Registers a new post_type field for the Templates REST API route.
 */
function gutenberg_register_template_post_type_field() {
	register_rest_field(
		'wp_template',
		'post_types',
		array(
			'get_callback' => 'gutenberg_rest_template_post_type_callback',
			'schema'       => array(
				'description' => __( 'The post types the template is intended for.', 'gutenberg' ),
				'type'        => 'array',
				'readonly'    => true,
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_template_post_type_field' );

/**
 * Callback for the post_type field in the Templates REST API route.
 *
 * @param array $template The template object.
 *
 * @return array The post type the template is intended for.
 */
function gutenberg_rest_template_post_type_callback( $item ) {

	$template_metadata = _get_block_template_file( 'wp_template', $item['slug'] );
	if ( null === $template_metadata ) {
		return array();
	}

	if ( isset( $template_metadata['postTypes'] ) ) {
		return $template_metadata['postTypes'];
	}

	return array();
}
