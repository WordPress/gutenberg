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

/**
 * Registers additional fields for search result rest api.
 *
 * @access private
 * @internal
 *
 * @param  array $result_object      Search result object.
 * @param  string $field_name        Current additional field's name (unused).
 * @param  \WP_REST_Request $request Rest request object.
 * @return string                    Human-readable label for the search result's post type.
 */
function _gutenberg_get_search_result_label_field( $result_object, $field_name, $request ) {
	$type      = $request->get_param( 'type' );
	$object_id = $result_object['id'];
	if ( empty( $type ) || empty( $object_id ) ) {
		return '';
	}

	switch ( $type ) {
		case 'post':
			$ptype = get_post_type( $object_id );
			$label = $ptype ? get_post_type_object( $ptype )->labels->singular_name : '';
			break;
		case 'media':
			$label = get_post_type_object( 'attachment' )->labels->singular_name;
			break;
		case 'term':
			$term  = get_term_by( 'term_taxonomy_id', $object_id );
			$label = $term && ! is_wp_error( $term ) ? get_taxonomy( $term->taxonomy )->labels->singular_name : '';
			break;
		default:
			$label = '';
	}

	return $label;
}

/**
 * Registers additional fields for search result rest api.
 *
 * @access private
 * @internal
 */
function _gutenberg_register_search_result_additional_fields() {
	global $wp_rest_additional_fields;

	if ( isset( $wp_rest_additional_fields['search-result']['label'] ) ) {
		return;
	}

	register_rest_field(
		'search-result',
		'label',
		array(
			'get_callback'    => '_gutenberg_get_search_result_label_field',
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
	if ( class_exists( 'WP_REST_Media_Search_Handler_Gutenberg' ) ) {
		$handlers[] = new WP_REST_Media_Search_Handler_Gutenberg();
	}

	return $handlers;
}

add_action( 'wp_rest_search_handlers', '_gutenberg_register_media_search_handler' );
