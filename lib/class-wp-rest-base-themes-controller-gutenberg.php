<?php
/**
 * REST API: Base Themes Controller.
 *
 * Provides REST API endpoints for registered base themes.
 *
 * @package gutenberg
 * @subpackage REST_API
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * REST API controller for registered base themes.
 *
 */
class WP_REST_Base_Themes_Controller_Gutenberg extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
		 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'base-themes';
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
							'description'       => __( 'The base theme ID.', 'gutenberg' ),
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
	 * Checks if a given request has access to read base themes.
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
			'rest_cannot_read_base_themes',
			__( 'Sorry, you are not allowed to access base themes.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Checks if a given request has access to read a base theme.
	 *
		 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access, WP_Error otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		return $this->get_items_permissions_check( $request );
	}

	/**
	 * Retrieves all registered base themes.
	 *
		 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function get_items( $request ) {
		$registry    = WP_Base_Themes_Registry_Gutenberg::get_instance();
		$base_themes = $registry->get_all_registered();

		$response = array();

		foreach ( $base_themes as $id => $base_theme ) {
			// Add the ID to the base theme data for prepare_item_for_response.
			$base_theme['id'] = $id;
			$item             = $this->prepare_item_for_response( $base_theme, $request );
			$response[]       = $this->prepare_response_for_collection( $item );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Retrieves a single registered base theme.
	 *
		 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object or WP_Error.
	 */
	public function get_item( $request ) {
		$id       = $request['id'];
		$registry = WP_Base_Themes_Registry_Gutenberg::get_instance();

		// URL decode the ID.
		$id = urldecode( $id );

		$base_theme = $registry->get_registered( $id );

		if ( ! $base_theme ) {
			return new WP_Error(
				'rest_base_theme_not_found',
				__( 'Base theme not found.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		// Add the ID to the base theme data for prepare_item_for_response.
		$base_theme['id'] = $id;

		return $this->prepare_item_for_response( $base_theme, $request );
	}

	/**
	 * Prepares a base theme for response.
	 *
		 *
	 * @param array           $item    The base theme data including 'id'.
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
	 * Retrieves the base theme schema.
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
			'title'      => 'base-theme',
			'type'       => 'object',
			'properties' => array(
				'id'       => array(
					'description' => __( 'Unique identifier for the base theme.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'title'    => array(
					'description' => __( 'The title of the base theme.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'settings' => array(
					'description' => __( 'Global settings for the base theme.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
				'styles'   => array(
					'description' => __( 'Global styles for the base theme.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit' ),
					'readonly'    => true,
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}
