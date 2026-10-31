<?php
/**
 * REST API: WP_REST_Font_Providers_Controller class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_REST_Font_Providers_Controller' ) ) {

	/**
	 * Lists registered font providers and the font families they supply.
	 *
	 * The response is read-only: provider fonts are managed by the extension that
	 * registers them, not through the Font Library.
	 */
	class WP_REST_Font_Providers_Controller extends WP_REST_Controller {
		/**
		 * Constructs the controller.
		 */
		public function __construct() {
			$this->namespace = 'wp/v2';
			$this->rest_base = 'font-providers';
		}

		/**
		 * Registers the routes for the objects of the controller.
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
				'/' . $this->rest_base . '/(?P<slug>[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?)',
				array(
					'args'   => array(
						'slug' => array(
							'description' => __( 'Font provider slug.', 'gutenberg' ),
							'type'        => 'string',
						),
					),
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => array( $this, 'get_item' ),
						'permission_callback' => array( $this, 'get_items_permissions_check' ),
						'args'                => array(
							'context' => $this->get_context_param( array( 'default' => 'view' ) ),
						),
					),
					'schema' => array( $this, 'get_public_item_schema' ),
				)
			);
		}

		/**
		 * Checks whether the request may read font providers.
		 *
		 * Matches the Font Library, which requires `edit_theme_options`.
		 *
		 * @param WP_REST_Request $request Full details about the request.
		 * @return true|WP_Error True if the request has read access, WP_Error otherwise.
		 */
		public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			if ( current_user_can( 'edit_theme_options' ) ) {
				return true;
			}

			return new WP_Error(
				'rest_cannot_read',
				__( 'Sorry, you are not allowed to access font providers.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		/**
		 * Retrieves all font providers.
		 *
		 * @param WP_REST_Request $request Full details about the request.
		 * @return WP_REST_Response Response object.
		 */
		public function get_items( $request ) {
			$response = array();
			foreach ( WP_Font_Provider_Registry::get_instance()->get_all_registered() as $provider ) {
				$item       = $this->prepare_item_for_response( $provider, $request );
				$response[] = $this->prepare_response_for_collection( $item );
			}
			return rest_ensure_response( $response );
		}

		/**
		 * Retrieves one font provider.
		 *
		 * @param WP_REST_Request $request Full details about the request.
		 * @return WP_REST_Response|WP_Error Response object, or WP_Error if not found.
		 */
		public function get_item( $request ) {
			$provider = WP_Font_Provider_Registry::get_instance()->get_registered( $request['slug'] );

			if ( null === $provider ) {
				return new WP_Error(
					'rest_font_provider_not_found',
					__( 'Font provider not found.', 'gutenberg' ),
					array( 'status' => 404 )
				);
			}

			return $this->prepare_item_for_response( $provider, $request );
		}

		/**
		 * Prepares a font provider for the response.
		 *
		 * @param array           $item    Registered font provider.
		 * @param WP_REST_Request $request Request object.
		 * @return WP_REST_Response Response object.
		 */
		public function prepare_item_for_response( $item, $request ) {
			$fields = $this->get_fields_for_response( $request );
			$keys   = array(
				'slug'         => 'slug',
				'label'        => 'label',
				'description'  => 'description',
				'fontFamilies' => 'font_families',
			);
			$data   = array();
			foreach ( $keys as $item_key => $rest_key ) {
				if ( rest_is_field_included( $rest_key, $fields ) ) {
					$data[ $rest_key ] = $item[ $item_key ];
				}
			}

			$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
			$data    = $this->add_additional_fields_to_object( $data, $request );
			$data    = $this->filter_response_by_context( $data, $context );
			return rest_ensure_response( $data );
		}

		/**
		 * Retrieves the font provider schema.
		 *
		 * @return array Item schema data.
		 */
		public function get_item_schema() {
			if ( $this->schema ) {
				return $this->add_additional_fields_schema( $this->schema );
			}

			$this->schema = array(
				'$schema'    => 'http://json-schema.org/draft-04/schema#',
				'title'      => 'font-provider',
				'type'       => 'object',
				'properties' => array(
					'slug'          => array(
						'description' => __( 'The font provider slug.', 'gutenberg' ),
						'type'        => 'string',
						'readonly'    => true,
						'context'     => array( 'view', 'edit', 'embed' ),
					),
					'label'         => array(
						'description' => __( 'The font provider label.', 'gutenberg' ),
						'type'        => 'string',
						'readonly'    => true,
						'context'     => array( 'view', 'edit', 'embed' ),
					),
					'description'   => array(
						'description' => __( 'The font provider description.', 'gutenberg' ),
						'type'        => 'string',
						'readonly'    => true,
						'context'     => array( 'view', 'edit', 'embed' ),
					),
					'font_families' => array(
						'description' => __( 'Font families supplied by the provider, in the theme.json fontFamilies format.', 'gutenberg' ),
						'type'        => 'array',
						'items'       => array( 'type' => 'object' ),
						'readonly'    => true,
						'context'     => array( 'view', 'edit', 'embed' ),
					),
				),
			);

			return $this->add_additional_fields_schema( $this->schema );
		}

		/**
		 * Retrieves the query params for the collection.
		 *
		 * @return array Collection parameters.
		 */
		public function get_collection_params() {
			$query_params                       = parent::get_collection_params();
			$query_params['context']['default'] = 'view';
			return array( 'context' => $query_params['context'] );
		}
	}
}

/**
 * Registers the font providers REST route.
 */
function gutenberg_register_font_providers_controller() {
	$controller = new WP_REST_Font_Providers_Controller();
	$controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_font_providers_controller' );
