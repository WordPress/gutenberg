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

if ( ! function_exists( 'gutenberg_register_wp_rest_themes_stylesheet_directory_uri_field' ) ) {
	/**
	 * Adds `stylesheet_uri` fields to WP_REST_Themes_Controller class.
	 * Core ticket: https://core.trac.wordpress.org/ticket/61021
	 */
	function gutenberg_register_wp_rest_themes_stylesheet_directory_uri_field() {
		register_rest_field(
			'theme',
			'stylesheet_uri',
			array(
				'get_callback' => function ( $item ) {
					if ( ! empty( $item['stylesheet'] ) ) {
						$theme         = wp_get_theme( $item['stylesheet'] );
						$current_theme = wp_get_theme();
						if ( $theme->get_stylesheet() === $current_theme->get_stylesheet() ) {
							return get_stylesheet_directory_uri();
						} else {
							return $theme->get_stylesheet_directory_uri();
						}
					}

					return null;
				},
				'schema'       => array(
					'type'        => 'string',
					'description' => __( 'The uri for the theme\'s stylesheet directory.', 'gutenberg' ),
					'format'      => 'uri',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
			)
		);
	}
}
add_action( 'rest_api_init', 'gutenberg_register_wp_rest_themes_stylesheet_directory_uri_field' );

if ( ! function_exists( 'gutenberg_register_wp_rest_themes_template_directory_uri_field' ) ) {
	/**
	 * Adds `template_uri` fields to WP_REST_Themes_Controller class.
	 * Core ticket: https://core.trac.wordpress.org/ticket/61021
	 */
	function gutenberg_register_wp_rest_themes_template_directory_uri_field() {
		register_rest_field(
			'theme',
			'template_uri',
			array(
				'get_callback' => function ( $item ) {
					if ( ! empty( $item['stylesheet'] ) ) {
						$theme         = wp_get_theme( $item['stylesheet'] );
						$current_theme = wp_get_theme();
						if ( $theme->get_stylesheet() === $current_theme->get_stylesheet() ) {
							return get_template_directory_uri();
						} else {
							return $theme->get_template_directory_uri();
						}
					}

					return null;
				},
				'schema'       => array(
					'type'        => 'string',
					'description' => __( 'The uri for the theme\'s template directory. If this is a child theme, this refers to the parent theme, otherwise this is the same as the theme\'s stylesheet directory.', 'gutenberg' ),
					'format'      => 'uri',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
			)
		);
	}
}
add_action( 'rest_api_init', 'gutenberg_register_wp_rest_themes_template_directory_uri_field' );
