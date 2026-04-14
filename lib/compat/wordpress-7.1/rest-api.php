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
 * Registers note preview comment metadata for REST exposure.
 *
 * @return void
 */
function gutenberg_register_note_preview_comment_metadata_7_1() {
	register_meta(
		'comment',
		'_wp_noted_content',
		array(
			'type'          => 'string',
			'description'   => __( 'Snapshot of noted block content for inline note rendering.', 'gutenberg' ),
			'single'        => true,
			'show_in_rest'  => array(
				'schema' => array(
					'type' => 'string',
				),
			),
			'auth_callback' => function ( $allowed, $meta_key, $object_id ) {
				$comment = get_comment( $object_id );

				if ( ! $comment ) {
					return false;
				}

				return current_user_can( 'edit_comment', $object_id ) || current_user_can( 'edit_post', (int) $comment->comment_post_ID );
			},
		)
	);
}
add_action( 'init', 'gutenberg_register_note_preview_comment_metadata_7_1' );

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
