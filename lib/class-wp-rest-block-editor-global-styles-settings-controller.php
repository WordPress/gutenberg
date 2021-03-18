<?php
/**
 * REST API: WP_REST_Block_Editor_Global_Styles_Settings_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Core class used to retrieve the block editor global styles settings via the REST API.
 *
 * @see WP_REST_Controller
 */
class WP_REST_Block_Editor_Global_Styles_Settings_Controller extends WP_REST_Controller {
	/**
	 * Constructs the controller.
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'block-editor-global-styles-settings';
	}

	/**
	 * Registers the necessary REST API routes.
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
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to read block editor settings
	 *
	 * @since 5.8.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|bool True if the request has permission, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! current_user_can( 'edit_posts' ) ) {
			$error = __( 'Sorry, you are not allowed to read the block editor settings.', 'gutenberg' );
			return new WP_Error( 'rest_cannot_read_settings', $error, array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

	/**
	 * Returns the block editor's global styles settings
	 *
	 * @since 5.8.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$settings = apply_filters( 'block_editor_global_styles_rest_settings', array() );

		return rest_ensure_response( $settings );
	}

	/**
	 * Retrieves the block editor's global styles schema, conforming to JSON Schema.
	 *
	 * @since 5.8.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'block-editor-global-styles-settings-item',
			'type'       => 'object',
			'properties' => array(
				'colors'                   => array(
					'description' => __( 'Active theme colors.', 'gutenberg' ),
					'type'        => 'array',
					'context'     => array( 'view' ),
				),

				'gradients'                => array(
					'description' => __( 'Active theme gradients.', 'gutenberg' ),
					'type'        => 'array',
					'context'     => array( 'view' ),
				),

				'globalStyles'             => array(
					'description' => __( 'Theme support for global styles.', 'gutenberg' ),
					'type'        => 'boolean',
					'context'     => array( 'view' ),
				),

				'globalStylesUserEntityId' => array(
					'description' => __( 'User entity id for Global styles settings.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view' ),
				),

				'globalStylesBaseStyles'   => array(
					'description' => __( 'Global styles settings.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view' ),
				),
			),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}
}
