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
 * Registers additional fields for search result rest api.
 *
 * @access private* @internal
 *
 * @param  array $result_object      Search result object.
 * @param  string $field_name        Current additional field's name (unused).
 * @param  \WP_REST_Request $request Rest request object.
 * @return string                    Thumbnail for the result object.
 */
function _gutenberg_get_search_result_thumbnail_field( $result_object, $field_name, $request ) {

	$object_id = $result_object['id'];
	if ( empty( $object_id ) ) {
		return '';
	}

	$thumbnail = wp_get_attachment_image_src( $object_id, 'thumbnail' );

	return $thumbnail[0] ? $thumbnail[0] : '';
}

/**
 * Registers additional fields for search result rest api.
 *
 * @access private* @internal
 *
 * @param  array $result_object      Search result object.
 * @param  string $field_name        Current additional field's name (unused).
 * @param  \WP_REST_Request $request Rest request object.
 * @return string                    Alt text for the result object.
 */
function _gutenberg_get_search_result_alt_text_field( $result_object, $field_name, $request ) {

	$object_id = $result_object['id'];
	if ( empty( $object_id ) ) {
		return '';
	}

	$alt_text = get_post_meta($object_id, '_wp_attachment_image_alt', true);

	return $alt_text;
}

/**
 * Registers additional fields for search result rest api.
 *
 * @access private
 * @internal
 */
function _gutenberg_register_search_result_additional_fields() {
	global $wp_rest_additional_fields;

	if ( isset( $wp_rest_additional_fields['search-result']['thumbnail'] ) ) {
		return;
	}

	register_rest_field(
		'search-result',
		'thumbnail',
		array(
			'get_callback'    => '_gutenberg_get_search_result_thumbnail_field',
			'update_callback' => null,
			'schema'          => array(
				'description' => __( 'Object human readable subtype.', 'gutenberg' ),
				'type'        => 'string',
				'readonly'    => true,
				'context'     => array( 'view', 'embed' ),
			),
		)
	);

	register_rest_field(
		'search-result',
		'alt_text',
		array(
			'get_callback'    => '_gutenberg_get_search_result_alt_text_field',
			'update_callback' => null,
			'schema'          => array(
				'description' => __( 'Object human readable subtype.', 'gutenberg' ),
				'type'        => 'string',
				'readonly'    => true,
				'context'     => array( 'view', 'embed' ),
			),
		)
	);
}

add_action( 'rest_api_init', '_gutenberg_register_search_result_additional_fields' );

/**
 * Register custom rest media search handler.
 *
 * @param array $handlers
 *
 * @return array
 */
function _gutenberg_register_media_search_handler( $handlers ) {
	if ( class_exists( 'WP_REST_Media_Search_Handler_Gutenberg_6_6' ) ) {
		$handlers[] = new WP_REST_Media_Search_Handler_Gutenberg_6_6();
	}

	return $handlers;
}

add_action( 'wp_rest_search_handlers', '_gutenberg_register_media_search_handler' );
