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
		$valid_query_args = array(
			'source' => true,
		);

		$query_args        = array_intersect_key( $request->get_params(), $valid_query_args );
		$response          = array();
		$unique_categories = array();
		$categories        = WP_Block_Pattern_Categories_Registry::get_instance()->get_all_registered();
		$user_categories   = get_terms(
			array(
				'taxonomy'   => 'wp_pattern_category',
				'hide_empty' => false,
			)
		);

		if ( is_array( $query_args['source'] ) && in_array( 'user', $query_args['source'], true ) ) {
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
		}

		if ( ! isset( $query_args['source'] ) || in_array( 'core', $query_args['source'], true ) ) {
			foreach ( $categories as $category ) {
				if ( in_array( $category['label'], $unique_categories, true ) || 'query' === $category['name'] ) {
					continue;
				}
				$prepared_category = $this->prepare_item_for_response( $category, $request );
				$response[]        = $this->prepare_response_for_collection( $prepared_category );
			}
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
		$keys   = array( 'name', 'label', 'description' );
		$data   = array();
		foreach ( $keys as $key ) {
			if ( isset( $item[ $key ] ) && rest_is_field_included( $key, $fields ) ) {
				$data[ $key ] = $item[ $key ];
			}
		}

		// For backwards compatibility we only want to include the id if the field is explicitly requested.
		if ( rest_is_field_included( 'id', $fields ) && isset( $item['id'] ) ) {
			$data['id'] = $item['id'];
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
					'description' => __( 'An optional category id, currently used to provide id for user wp_pattern_category terms' ),
					'type'        => 'number',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the search parameters for the block pattern categories.
	 *
	 * @since 6.5.0 Added  to request.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params = parent::get_collection_params();

		$query_params['source'] = array(
			'description' => __( 'Limit result set to comments assigned to specific sources, `core` or `user`' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'string',
			),
		);

		/**
		 * Filter collection parameters for the block pattern categories controller.
		 *
		 * @since 5.8.0
		 *
		 * @param array $query_params JSON Schema-formatted collection parameters.
		 */
		return apply_filters( 'rest_pattern_directory_collection_params', $query_params );
	}
}
