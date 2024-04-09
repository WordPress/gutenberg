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
 * Registers additional fields for WP_REST_Themes_Controller class.
 * https://github.com/WordPress/wordpress-develop/blob/trunk/src/wp-includes/rest-api/endpoints/class-wp-rest-themes-controller.php
 */
function gutenberg_register_wp_theme_directory_uri_field() {
	register_rest_field(
		'theme',
		'theme_directory_uri',
		array(
			'get_callback' => function ( $item ) {
				/*
				 * In the rest controller, we can use the WP_Theme object methods to get the theme directory URI.
				 * See: https://developer.wordpress.org/reference/classes/wp_theme/
				 */
				if ( ! empty( $item['stylesheet'] ) ) {
					$theme = wp_get_theme( $item['stylesheet'] );
					return $theme->get_stylesheet_directory_uri();
				}
				return null;
			},
			'schema'          => array(
				'type'        => 'string',
				'description' => __( 'URL to the directory of the theme root.', 'gutenberg' ),
				'readonly'    => true,
				'context'     => array( 'view', 'edit', 'embed' ),
			),
		)
	);
}

add_action( 'rest_api_init', 'gutenberg_register_wp_theme_directory_uri_field' );
