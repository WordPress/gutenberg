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

/**
 * Registers the Global Styles REST API routes.
 */
function gutenberg_register_global_styles_endpoints() {
	$global_styles_controller = new WP_REST_Global_Styles_Controller_Gutenberg();
	$global_styles_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_global_styles_endpoints' );

if ( ! function_exists( 'gutenberg_register_edit_site_export_controller_endpoints' ) ) {
	/**
	 * Registers the Edit Site Export REST API routes.
	 */
	function gutenberg_register_edit_site_export_controller_endpoints() {
		$edit_site_export_controller = new WP_REST_Edit_Site_Export_Controller_Gutenberg();
		$edit_site_export_controller->register_routes();
	}
}

add_action( 'rest_api_init', 'gutenberg_register_edit_site_export_controller_endpoints' );

if ( ! function_exists( 'gutenberg_register_wp_rest_post_types_controller_fields' ) ) {
	/**
	 * Adds `template` and `template_lock` fields to WP_REST_Post_Types_Controller class.
	 */
	function gutenberg_register_wp_rest_post_types_controller_fields() {
		register_rest_field(
			'type',
			'template',
			array(
				'get_callback' => function ( $item ) {
					$post_type = get_post_type_object( $item['slug'] );
					if ( ! empty( $post_type ) ) {
						return $post_type->template ?? array();
					}
				},
				'schema'       => array(
					'type'        => 'array',
					'description' => __( 'The block template associated with the post type.', 'gutenberg' ),
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
			)
		);
		register_rest_field(
			'type',
			'template_lock',
			array(
				'get_callback' => function ( $item ) {
					$post_type = get_post_type_object( $item['slug'] );
					if ( ! empty( $post_type ) ) {
						return ! empty( $post_type->template_lock ) ? $post_type->template_lock : false;
					}
				},
				'schema'       => array(
					'type'        => array( 'string', 'boolean' ),
					'enum'        => array( 'all', 'insert', 'contentOnly', false ),
					'description' => __( 'The template_lock associated with the post type, or false if none.', 'gutenberg' ),
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
			)
		);
	}
}
add_action( 'rest_api_init', 'gutenberg_register_wp_rest_post_types_controller_fields' );
