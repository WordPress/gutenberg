<?php
/**
 * Widget Modules REST API: WP_REST_Widget_Modules_Controller class.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_REST_Widget_Modules_Controller' ) ) {

	/**
	 * Internal REST controller exposing the widget type registry.
	 *
	 * Reads from `WP_Widget_Type_Registry`. Read-only collection and item
	 * endpoints. Render and encode endpoints are intentionally absent:
	 * consumers import the render module on the client and render in JS,
	 * so there is no server-rendered HTML to expose.
	 *
	 * The endpoint lives at `/wp/v2/widget-modules` because the entity
	 * `(kind: 'root', name: 'widgetType')` and the path
	 * `/wp/v2/widget-types` are already taken by the legacy widgets API.
	 */
	class WP_REST_Widget_Modules_Controller extends WP_REST_Controller {

		/**
		 * Constructor.
		 */
		public function __construct() {
			$this->namespace = 'wp/v2';
			$this->rest_base = 'widget-modules';
		}

		/**
		 * Registers the widget module routes.
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
				'/' . $this->rest_base . '/(?P<id>[a-z0-9-]+\/[a-z0-9-]+)',
				array(
					'args'   => array(
						'id' => array(
							'description' => __( 'Widget module name including namespace.', 'gutenberg' ),
							'type'        => 'string',
						),
					),
					array(
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => array( $this, 'get_item' ),
						'permission_callback' => array( $this, 'get_item_permissions_check' ),
						'args'                => array(),
					),
					'schema' => array( $this, 'get_public_item_schema' ),
				)
			);
		}

		/**
		 * Checks whether a given request has permission to read widget
		 * modules.
		 *
		 * @param WP_REST_Request $request Full details about the request.
		 * @return true|WP_Error True if the request has read access, WP_Error
		 *                       otherwise.
		 */
		public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return $this->check_read_permission();
		}

		/**
		 * Checks whether a given request has permission to read a single
		 * widget module.
		 *
		 * @param WP_REST_Request $request Full details about the request.
		 * @return true|WP_Error True if the request has read access, WP_Error
		 *                       otherwise.
		 */
		public function get_item_permissions_check( $request ) {
			$check = $this->check_read_permission();
			if ( is_wp_error( $check ) ) {
				return $check;
			}

			$widget_type = WP_Widget_Type_Registry::get_instance()->get_registered( $request['id'] );
			if ( null === $widget_type ) {
				return new WP_Error(
					'rest_widget_module_invalid',
					__( 'Invalid widget module name.', 'gutenberg' ),
					array( 'status' => 404 )
				);
			}

			return true;
		}

		/**
		 * Verifies the user has the basic read capability.
		 *
		 * Widget modules are not sensitive data; they describe what is
		 * available to render. Gating at the same level as the dashboard
		 * page menu (which requires `read`) keeps access consistent.
		 *
		 * @return true|WP_Error True if the request is allowed, WP_Error
		 *                       otherwise.
		 */
		protected function check_read_permission() {
			if ( ! current_user_can( 'read' ) ) {
				return new WP_Error(
					'rest_cannot_view_widget_modules',
					__( 'Sorry, you are not allowed to view widget modules.', 'gutenberg' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}

			return true;
		}

		/**
		 * Retrieves the list of all registered widget modules.
		 *
		 * @param WP_REST_Request $request Full details about the request.
		 * @return WP_REST_Response Response object on success.
		 */
		public function get_items( $request ) {
			$registered = WP_Widget_Type_Registry::get_instance()->get_all_registered();
			$data       = array();

			foreach ( $registered as $widget_type ) {
				$item   = $this->prepare_item_for_response( $widget_type, $request );
				$data[] = $this->prepare_response_for_collection( $item );
			}

			return rest_ensure_response( $data );
		}

		/**
		 * Retrieves a single widget module from the collection.
		 *
		 * @param WP_REST_Request $request Full details about the request.
		 * @return WP_REST_Response|WP_Error Response object on success, or
		 *                                   WP_Error on failure.
		 */
		public function get_item( $request ) {
			$widget_type = WP_Widget_Type_Registry::get_instance()->get_registered( $request['id'] );
			if ( null === $widget_type ) {
				return new WP_Error(
					'rest_widget_module_invalid',
					__( 'Invalid widget module name.', 'gutenberg' ),
					array( 'status' => 404 )
				);
			}

			return rest_ensure_response( $this->prepare_item_for_response( $widget_type, $request ) );
		}

		/**
		 * Prepares a widget type object for serialization.
		 *
		 * @param WP_Widget_Type  $item    Widget type instance.
		 * @param WP_REST_Request $request Full details about the request.
		 * @return WP_REST_Response Response object containing the serialized
		 *                          widget module data.
		 */
		public function prepare_item_for_response( $item, $request ) {
			$widget_type = $item;
			$fields      = $this->get_fields_for_response( $request );
			$data        = array();

			if ( rest_is_field_included( 'name', $fields ) ) {
				$data['name'] = $widget_type->name;
			}

			if ( rest_is_field_included( 'render_module', $fields ) ) {
				$data['render_module'] = $widget_type->render_module;
			}

			if ( rest_is_field_included( 'widget_module', $fields ) ) {
				$data['widget_module'] = $widget_type->widget_module;
			}

			if ( rest_is_field_included( 'presentation', $fields ) ) {
				$data['presentation'] = $widget_type->presentation;
			}

			$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
			$data    = $this->add_additional_fields_to_object( $data, $request );
			$data    = $this->filter_response_by_context( $data, $context );

			return rest_ensure_response( $data );
		}

		/**
		 * Retrieves the widget module schema, conforming to JSON Schema.
		 *
		 * @return array Item schema data.
		 */
		public function get_item_schema() {
			if ( $this->schema ) {
				return $this->add_additional_fields_schema( $this->schema );
			}

			$schema = array(
				'$schema'    => 'http://json-schema.org/draft-04/schema#',
				'title'      => 'widget-module',
				'type'       => 'object',
				'properties' => array(
					'name'          => array(
						'description' => __( 'Widget module name including namespace.', 'gutenberg' ),
						'type'        => 'string',
						'context'     => array( 'view', 'edit', 'embed' ),
						'readonly'    => true,
					),

					'render_module' => array(
						'description' => __( 'Script-module handle for the widget render entry point.', 'gutenberg' ),
						'type'        => array( 'string', 'null' ),
						'context'     => array( 'view', 'edit', 'embed' ),
						'readonly'    => true,
					),

					'widget_module' => array(
						'description' => __( 'Script-module handle for the widget metadata entry point.', 'gutenberg' ),
						'type'        => array( 'string', 'null' ),
						'context'     => array( 'view', 'edit', 'embed' ),
						'readonly'    => true,
					),

					'presentation'  => array(
						'description' => __( 'Authoring intent about how the widget wants to render.', 'gutenberg' ),
						'type'        => array( 'string', 'null' ),
						'enum'        => array_merge( WP_Widget_Type::PRESENTATION_VALUES, array( null ) ),
						'context'     => array( 'view', 'edit', 'embed' ),
						'readonly'    => true,
					),
				),
			);

			$this->schema = $schema;

			return $this->add_additional_fields_schema( $this->schema );
		}
	}
}
