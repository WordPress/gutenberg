<?php
/**
 * REST API: Style Variations Controller.
 *
 * Provides REST API endpoints for registered style variations.
 *
 * @package gutenberg
 * @subpackage REST_API
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * REST API controller for registered style variations.
 *
 */
class WP_REST_Style_Variations_Controller_Gutenberg extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
		 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'style-variations';
	}

	/**
	 * Registers the routes for the controller.
	 *
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
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9_\-\/]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'id' => array(
							'description'       => __( 'The style variation ID.', 'gutenberg' ),
							'type'              => 'string',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to read style variations.
	 *
		 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access, WP_Error otherwise.
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( current_user_can( 'edit_theme_options' ) ) {
			return true;
		}

		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_cannot_read_style_variations',
			__( 'Sorry, you are not allowed to access style variations.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Checks if a given request has access to read a style variation.
	 *
		 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access, WP_Error otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		return $this->get_items_permissions_check( $request );
	}

	/**
	 * Retrieves all registered style variations.
	 *
		 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function get_items( $request ) {
		$registry   = WP_Style_Variations_Registry_Gutenberg::get_instance();
		$variations = $registry->get_all_registered();

		$response = array();

		foreach ( $variations as $id => $variation ) {
			// Add the ID to the variation data for prepare_item_for_response.
			$variation['id'] = $id;
			$item            = $this->prepare_item_for_response( $variation, $request );
			$response[]      = $this->prepare_response_for_collection( $item );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Retrieves a single registered style variation.
	 *
		 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object or WP_Error.
	 */
	public function get_item( $request ) {
		$id       = $request['id'];
		$registry = WP_Style_Variations_Registry_Gutenberg::get_instance();

		// URL decode the ID.
		$id = urldecode( $id );

		$variation = $registry->get_registered( $id );

		if ( ! $variation ) {
			return new WP_Error(
				'rest_style_variation_not_found',
				__( 'Style variation not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		// Add the ID to the variation data for prepare_item_for_response.
		$variation['id'] = $id;

		return $this->prepare_item_for_response( $variation, $request );
	}

	/**
	 * Prepares a style variation for response.
	 *
		 *
	 * @param array           $item    The variation data including 'id'.
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$fields = $this->get_fields_for_response( $request );
		$id     = $item['id'];

		$data = array();

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = $id;
		}

		if ( rest_is_field_included( 'title', $fields ) ) {
			$data['title'] = $item['title'];
		}

		if ( rest_is_field_included( 'settings', $fields ) ) {
			$data['settings'] = isset( $item['data']['settings'] ) ? $item['data']['settings'] : new stdClass();
		}

		if ( rest_is_field_included( 'styles', $fields ) ) {
			$data['styles'] = isset( $item['data']['styles'] ) ? $item['data']['styles'] : new stdClass();
		}

		if ( rest_is_field_included( 'base_theme', $fields ) ) {
			$data['base_theme'] = $item['base_theme'];
		}

		if ( rest_is_field_included( 'source', $fields ) ) {
			$data['source'] = $item['source'];
		}

		// Include the post_id if a wp_global_styles post exists for this variation.
		if ( rest_is_field_included( 'post_id', $fields ) ) {
			$post_id         = gutenberg_get_variation_post_id( $id );
			$data['post_id'] = $post_id ? $post_id : null;
		}

		$context  = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data     = $this->add_additional_fields_to_object( $data, $request );
		$data     = $this->filter_response_by_context( $data, $context );
		$response = rest_ensure_response( $data );

		$links = array(
			'self' => array(
				'href' => rest_url( sprintf( '%s/%s/%s', $this->namespace, $this->rest_base, urlencode( $id ) ) ),
			),
		);

		$response->add_links( $links );

		return $response;
	}

	/**
	 * Retrieves the query params for collections.
	 *
		 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		return array(
			'context' => $this->get_context_param( array( 'default' => 'view' ) ),
		);
	}

	/**
	 * Retrieves the style variation schema.
	 *
		 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'style-variation',
			'type'       => 'object',
			'properties' => array(
				'id'         => array(
					'description' => __( 'Unique identifier for the style variation.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'title'      => array(
					'description' => __( 'The title of the style variation.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'settings'   => array(
					'description' => __( 'Global settings for the style variation.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'styles'     => array(
					'description' => __( 'Global styles for the style variation.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'base_theme' => array(
					'description' => __( 'The ID of the base theme to use with this variation.', 'gutenberg' ),
					'type'        => array( 'string', 'null' ),
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'source'     => array(
					'description' => __( 'The source of the style variation.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'theme', 'plugin', 'custom' ),
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'post_id'    => array(
					'description' => __( 'The wp_global_styles post ID if user customizations exist for this variation.', 'gutenberg' ),
					'type'        => array( 'integer', 'null' ),
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}
