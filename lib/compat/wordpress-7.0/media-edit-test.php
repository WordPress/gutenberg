<?php
/**
 * Test fields for MediaEdit component development.
 *
 * @package gutenberg
 */

/**
 * Register test media REST fields for MediaEdit component development.
 *
 * Creates 2 test fields:
 * - test_media_gallery: array type for multiple+expanded testing
 * - test_media_gallery_2: array type for multiple+compact testing
 */
function gutenberg_register_media_edit_test_rest_fields() {
	// Define test fields: name => is_array.
	$fields = array(
		'test_media_gallery'   => true,  // array - multiple+expanded.
		'test_media_gallery_2' => true,  // array - multiple+compact.
	);

	foreach ( $fields as $field_name => $is_array ) {
		register_rest_field(
			'page',
			$field_name,
			array(
				'schema'          => array(
					'type'    => 'array',
					'items'   => array( 'type' => 'integer' ),
					'context' => array( 'view', 'edit' ),
					'default' => array(),
				),
				'get_callback'    => function ( $post ) use ( $field_name ) {
					if ( ! isset( $post['id'] ) ) {
						return array();
					}
					$meta = get_post_meta( $post['id'], $field_name, true );
					return ( empty( $meta ) || ! is_array( $meta ) ) ? array() : array_map( 'intval', $meta );
				},
				'update_callback' => function ( $value, $post ) use ( $field_name ) {
					$value = is_array( $value ) ? array_map( 'intval', $value ) : ( $value ? array( intval( $value ) ) : array() );
					update_post_meta( $post->ID, $field_name, $value );
					return true;
				},
			)
		);
	}
}
add_action( 'rest_api_init', 'gutenberg_register_media_edit_test_rest_fields' );
