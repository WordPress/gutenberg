<?php
/**
 * REST API: WP_REST_Block_Pattern_Categories_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 * @since      6.0.0
 */

/**
 * Core class used to access block pattern categories via the REST API.
 *
 * @since 6.0.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Block_Pattern_Categories_Controller extends WP_REST_Block_Pattern_Categories_Controller {
	/**
	 * Retrieves all block pattern categories.
	 *
	 * @since 6.0.0
	 * @since 6.5 Added user added categories from wp_pattern_category taxonomy
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$response          = array();
		$unique_categories = array();
		$categories        = WP_Block_Pattern_Categories_Registry::get_instance()->get_all_registered();
		$user_categories   = get_terms(
			array(
				'taxonomy'   => 'wp_pattern_category',
				'hide_empty' => false,
			)
		);

		foreach ( $user_categories as $user_category ) {
			$prepared_category   = $this->prepare_item_for_response(
				array(
					'name'        => $user_category->slug,
					'label'       => $user_category->name,
					'description' => $user_category->description,
					'id'          => $user_category->term_id,
				),
				$request
			);
			$response[]          = $this->prepare_response_for_collection( $prepared_category );
			$unique_categories[] = $user_category->name;
		}
		foreach ( $categories as $category ) {
			if ( in_array( $category['label'], $unique_categories ) || 'query' === $category['name'] ) {
				continue;
			}
			$prepared_category = $this->prepare_item_for_response( $category, $request );
			$response[]        = $this->prepare_response_for_collection( $prepared_category );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Prepare a raw block pattern category before it gets output in a REST API response.
	 *
	 * @since 6.0.0
	 * @since 6.5 Added `id` field for identifying user categories
	 *
	 * @param array           $item    Raw category as registered, before any changes.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$fields = $this->get_fields_for_response( $request );
		$keys   = array( 'name', 'label', 'description', 'id' );
		$data   = array();
		foreach ( $keys as $key ) {
			if ( isset( $item[ $key ] ) && rest_is_field_included( $key, $fields ) ) {
				$data[ $key ] = $item[ $key ];
			}
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves the block pattern category schema, conforming to JSON Schema.
	 *
	 * @since 6.0.0
	 * @since 6.5 Added `id` field for identifying user categories
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'block-pattern-category',
			'type'       => 'object',
			'properties' => array(
				'name'        => array(
					'description' => __( 'The category name.' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'label'       => array(
					'description' => __( 'The category label, in human readable format.' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'description' => array(
					'description' => __( 'The category description, in human readable format.' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'id'          => array(
					'id'       => __( 'An optional category id, currently used to provide id for user wp_pattern_category terms' ),
					'type'     => 'number',
					'readonly' => true,
					'context'  => array( 'view', 'edit', 'embed' ),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}
