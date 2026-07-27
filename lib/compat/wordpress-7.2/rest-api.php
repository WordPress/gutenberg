<?php
/**
 * WordPress 7.2 compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Reports a `null` `modified` date for templates that have never been saved.
 *
 * `WP_REST_Templates_Controller::prepare_item_for_response()` passes the template's
 * `modified` property straight to `mysql_to_rfc3339()`, which returns `false` for
 * file-backed templates because they have no modification date. That value matches
 * neither the documented `string` type nor anything a client can format, so it is
 * replaced with `null` and the schema widened to allow it.
 *
 * @since 7.2.0 Allowed 'modified' to be null.
 */
function gutenberg_allow_null_modified_wp_template_field() {
	register_rest_field(
		array( 'wp_template', 'wp_template_part' ),
		'modified',
		array(
			'schema'       => array(
				'description' => __( "The date the template was last modified, in the site's timezone.", 'gutenberg' ),
				'type'        => array( 'string', 'null' ),
				'format'      => 'date-time',
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
			),
			// The controller has already converted the date by the time this runs, so
			// the prepared value is reused and only the `false` case is replaced.
			'get_callback' => function ( $item ) {
				return isset( $item['modified'] ) && false !== $item['modified'] ? $item['modified'] : null;
			},
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_allow_null_modified_wp_template_field' );
