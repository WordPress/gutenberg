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
 * Callback for the `label` field in `WP_REST_Search_Controller`.
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
		case 'post-format':
			$label = get_post_format_string( $object_id );
			break;
		default:
			$label = '';
	}

	return $label;
}

/**
 * Register new field `label` for the `WP_REST_Search_Controller`.
 *
 * @access private
 * @internal
 */
function _gutenberg_register_search_result_additional_fields() {
	$search_controller = new WP_REST_Search_Controller( array() );
	if ( ! isset( $search_controller->get_item_schema()['property']['label'] ) ) {
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
	$should_load_media_search_handler = true;
	foreach ( $handlers as $handler ) {
		if ( $handler instanceof WP_REST_Media_Search_Handler ) {
			$should_load_media_search_handler = false;
			break;
		}
	}

	if ( $should_load_media_search_handler ) {
		$handlers[] = new WP_REST_Media_Search_Handler();
	}

	return $handlers;
}

add_action( 'wp_rest_search_handlers', '_gutenberg_register_media_search_handler' );

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
