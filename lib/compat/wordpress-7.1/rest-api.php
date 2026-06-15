<?php
/**
 * WordPress 7.1 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Registers the View Config REST API routes.
 */
function gutenberg_register_view_config_controller_endpoints() {
	$view_config_controller = new Gutenberg_REST_View_Config_Controller_7_1();
	$view_config_controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_view_config_controller_endpoints', PHP_INT_MAX );

/**
 * Add the `date` value to the `wp_template` schema.
 *
 * @since 7.1.0 Added 'date' property and response value.
 */
function gutenberg_add_date_wp_template_schema() {
		register_rest_field(
			array( 'wp_template', 'wp_template_part' ),
			'date',
			array(
				'schema'       => array(
					'description' => __( "The date the template was published, in the site's timezone.", 'gutenberg' ),
					'type'        => array( 'string', 'null' ),
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'get_callback' => function ( $item ) {
					if ( ! empty( $item['wp_id'] ) ) {
						$post = get_post( $item['wp_id'] );
						if ( $post && isset( $post->post_date ) ) {
							return mysql_to_rfc3339( $post->post_date );
						}
					}
					return null;
				},
			)
		);
}
add_filter( 'rest_api_init', 'gutenberg_add_date_wp_template_schema' );
