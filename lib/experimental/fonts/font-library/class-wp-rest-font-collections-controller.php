<?php
/**
 * Rest Font Collection Controller.
 *
 * This file contains the class for the REST API Font Collection Controller.
 *
 * @package    WordPress
 * @subpackage Font Collection
 * @since      6.4.0
 */

/**
 * Font Collection Controller class.
 *
 * @since 6.4.0
 */
class WP_REST_Font_Collections_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
	 * @since 6.4.0
	 */
	public function __construct() {
		$this->rest_base = 'font-collections';
		$this->namespace = 'wp/v2';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @since 6.4.0
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
				),
				'schema' => array( $this, 'get_items_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\/\w-]+)',
			array(
				'args'   => array(
					'id' => array(
						'description' => __( 'Unique identifier for the post.' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);
	}

	/**
	 * Gets a font collection.
	 *
	 * @since 6.4.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$id         = $request['id'];
		$collection = WP_Font_Library::get_font_collection( $id );
		// If the collection doesn't exist returns a 404.
		if ( is_wp_error( $collection ) ) {
			$collection->add_data( array( 'status' => 404 ) );
			return $collection;
		}
		$collection_with_data = $collection->get_data();
		// If there was an error getting the collection data, return the error.
		if ( is_wp_error( $collection_with_data ) ) {
			$collection_with_data->add_data( array( 'status' => 500 ) );
			return $collection_with_data;
		}

		return rest_ensure_response( $collection_with_data );
	}

	/**
	 * Gets the font collections available.
	 *
	 * @since 6.4.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Response object.
	 */
	public function get_items( $request ) {
		$collections = array();
		foreach ( WP_Font_Library::get_font_collections() as $collection ) {
			$collections[] = $collection->get_config();
		}
		return rest_ensure_response( $collections );
	}

	/**
	 * Checks whether the user has permissions to update the Font Library.
	 *
	 * @since 6.4.0
	 *
	 * @return true|WP_Error True if the request has write access for the item, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_cannot_get_font_library',
				__( 'Sorry, you are not allowed to get the Font Library on this site.' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}
		return true;
	}

	/**
	 * Retrieves the schema for the font collections item, conforming to JSON Schema.
	 *
	 * @since 6.4.0
	 *
	 * @return array Item schema data.
	 */
	public function get_items_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema' => 'http://json-schema.org/draft-04/schema#',
			'title'   => 'font-collections',
			'type'    => 'array',
			'items'   => array(
				'type'       => 'object',
				'properties' => array(
					'id'          => array(
						'description' => __( 'Unique identifier for the font collection.' ),
						'type'        => 'string',
						'context'     => array( 'view', 'edit', 'embed' ),
						'readonly'    => true,
					),
					'name'        => array(
						'description' => __( 'Name of the font collection.' ),
						'type'        => 'string',
						'context'     => array( 'view', 'edit', 'embed' ),
					),
					'description' => array(
						'description' => __( 'Description of the font collection.' ),
						'type'        => 'string',
						'context'     => array( 'view', 'edit', 'embed' ),
					),
					'src'         => array(
						'description' => __( 'Source to the list of font families.' ),
						'type'        => 'string',
						'context'     => array( 'view', 'edit', 'embed' ),
					),
				),
			),
		);

		$this->schema = $schema;
		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the item's schema, conforming to JSON Schema.
	 *
	 * @since 6.4.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'font-collection',
			'type'       => 'object',
			'properties' => array(
				'id'          => array(
					'description' => __( 'Unique identifier for the font collection.' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'name'        => array(
					'description' => __( 'Name of the font collection.' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'description' => array(
					'description' => __( 'Description of the font collection.' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'data'        => array(
					'description' => __( 'Data of the font collection.' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit', 'embed' ),
					'properties'  => array(
						'font_families' => array(
							'description' => __( 'List of font families.' ),
							'type'        => 'array',
							'items'       => array(
								'type'       => 'object',
								'properties' => array(
									'name'        => array(
										'description' => __( 'Name of the font family.' ),
										'type'        => 'string',
									),
									'font_family' => array(
										'description' => __( 'Font family string.' ),
										'type'        => 'string',
									),
									'slug'        => array(
										'description' => __( 'Slug of the font family.' ),
										'type'        => 'string',
									),
									'category'    => array(
										'description' => __( 'Category of the font family.' ),
										'type'        => 'string',
									),
									'font_face'   => array(
										'description' => __( 'Font face details.' ),
										'type'        => 'array',
										'items'       => array(
											'type'       => 'object',
											'properties' => array(
												'download_from_url' => array(
													'description' => __( 'URL to download the font.' ),
													'type' => 'string',
												),
												'font_weight' => array(
													'description' => __( 'Font weight.' ),
													'type' => 'string',
												),
												'fonts_style' => array(
													'description' => __( 'Font style.' ),
													'type' => 'string',
												),
												'font_family' => array(
													'description' => __( 'Font family string.' ),
													'type' => 'string',
												),
												'preview' => array(
													'description' => __( 'URL for font preview.' ),
													'type' => 'string',
												),
											),
										),
									),
									'preview'     => array(
										'description' => __( 'URL for font family preview.' ),
										'type'        => 'string',
									),
								),
							),
						),
					),
				),
			),
		);

		$this->schema = $schema;
		return $this->add_additional_fields_schema( $this->schema );
	}
}
