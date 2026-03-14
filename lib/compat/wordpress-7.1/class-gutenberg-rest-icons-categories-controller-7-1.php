<?php

/**
 * WordPress 7.1 icon categories REST controller compatibility.
 *
 * @package gutenberg
 */

/**
 * REST controller for registered icon categories.
 */
class Gutenberg_REST_Icons_Categories_Controller_7_1 extends WP_REST_Controller {
	/**
	 * Constructs the controller.
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'icons/categories';
	}

	/**
	 * Registers routes for icon categories.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			),
			true
		);
	}

	/**
	 * Checks if the request has access to read icon categories.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True on success, WP_Error otherwise.
	 */
	public function get_items_permissions_check(
		// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$request
	) {
		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}

		foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
			if ( current_user_can( $post_type->cap->edit_posts ) ) {
				return true;
			}
		}

		return new WP_Error(
			'rest_cannot_view',
			__( 'Sorry, you are not allowed to view the registered icon categories.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Retrieves all registered icon categories.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function get_items( $request ) {
		$registry   = Gutenberg_Icon_Categories_Registry_7_1::get_instance();
		$categories = $registry->get_all_registered();
		$response   = array();

		foreach ( $categories as $category ) {
			$prepared_item = $this->prepare_item_for_response( $category, $request );
			$response[]    = $this->prepare_response_for_collection( $prepared_item );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Prepares a registered icon category for a REST API response.
	 *
	 * @param array           $item    Category object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$fields = $this->get_fields_for_response( $request );
		$data   = array();
		$keys   = array(
			'name'        => 'name',
			'label'       => 'label',
			'description' => 'description',
		);

		foreach ( $keys as $item_key => $rest_key ) {
			if ( isset( $item[ $item_key ] ) && rest_is_field_included( $rest_key, $fields ) ) {
				$data[ $rest_key ] = $item[ $item_key ];
			}
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );
		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves the icon category schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'icon-category',
			'type'       => 'object',
			'properties' => array(
				'name'        => array(
					'description' => __( 'The icon category name.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'label'       => array(
					'description' => __( 'The icon category label.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'description' => array(
					'description' => __( 'The icon category description.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the collection params for the icon categories endpoint.
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		$query_params                       = parent::get_collection_params();
		$query_params['context']['default'] = 'view';
		return $query_params;
	}
}
