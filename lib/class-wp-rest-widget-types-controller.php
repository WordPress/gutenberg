<?php
/**
 * REST API: WP_REST_Widget_Types_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since x.x.0
 */

/**
 * Core class used to access widget types via the REST API.
 *
 * @since x.x.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Widget_Types_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
	 * @since x.x.0
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'widget-types';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @since x.x.0
	 *
	 * @see register_rest_route()
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
			'/' . $this->rest_base . '/(?P<name>[a-zA-Z0-9_-]+)/form-renderer',
			array(
				'args' => array(
					'name'     => array(
						'description' => __( 'Name of the widget.', 'gutenberg' ),
						'type'        => 'string',
						'required'    => true,
					),
					'instance' => array(
						'description' => __( 'Current widget instance', 'gutenberg' ),
						'type'        => 'object',
						'default'     => array(),
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'callback'            => array( $this, 'get_widget_form' ),
					'args'                => array(
						'context' => $this->get_context_param( array( 'default' => 'edit' ) ),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<name>[a-zA-Z0-9_-]+)',
			array(
				'args'   => array(
					'name' => array(
						'description' => __( 'Widget name.', 'gutenberg' ),
						'type'        => 'string',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to read post widget types.
	 *
	 * @since x.x.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|bool True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->check_read_permission();
	}

	/**
	 * Retrieves all post widget types, depending on user context.
	 *
	 * @since x.x.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$data = array();
		foreach ( $this->get_widgets() as $widget ) {
			$widget_type = $this->prepare_item_for_response( $widget, $request );
			$data[]      = $this->prepare_response_for_collection( $widget_type );
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Checks if a given request has access to read a widget type.
	 *
	 * @since x.x.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|bool True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		$check = $this->check_read_permission();
		if ( is_wp_error( $check ) ) {
			return $check;
		}
		$widget_name = $request['name'];
		$widget_type = $this->get_widget( $widget_name );
		if ( is_wp_error( $widget_type ) ) {
			return $widget_type;
		}

		return true;
	}

	/**
	 * Checks whether a given widget type should be visible.
	 *
	 * @since x.x.0
	 *
	 * @return WP_Error|bool True if the widget type is visible, WP_Error otherwise.
	 */
	protected function check_read_permission() {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'widgets_cannot_access',
				__( 'Sorry, you are not allowed to access widgets on this site.', 'gutenberg' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}

		return true;
	}

	/**
	 * Get the widget, if the name is valid.
	 *
	 * @since x.x.0
	 *
	 * @param string $name Widget name.
	 * @return WP_Widget|WP_Error Widget type object if name is valid, WP_Error otherwise.
	 */
	public function get_widget( $name ) {
		foreach ( $this->get_widgets() as $widget ) {
			if ( $name === $widget['id'] ) {
				return $widget;
			}
		}

		return new WP_Error( 'rest_widget_type_invalid', __( 'Invalid widget type.', 'gutenberg' ), array( 'status' => 404 ) );
	}

	/**
	 * Normalize array of widgets.
	 *
	 * @return array Array of widgets.
	 */
	protected function get_widgets() {
		global $wp_registered_widgets;

		$widgets = array();
		foreach ( $wp_registered_widgets as $widget ) {
			$widget_callback = $widget['callback'];
			unset( $widget['callback'] );

			if ( is_array( $widget_callback ) && $widget_callback[0] instanceof WP_Widget ) {
				$widget_class           = $widget_callback[0];
				$widget_array           = (array) $widget_class;
				$widget                 = array_merge( $widget, $widget_array );
				$widget['id']           = $widget['id_base'];
				$widget['widget_class'] = get_class( $widget_class );
			} else {
				unset( $widget['classname'] );
			}
			$widgets[] = $widget;
		}

		return $widgets;
	}

	/**
	 * Retrieves a specific widget type.
	 *
	 * @since x.x.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$widget_name = $request['name'];
		$widget_type = $this->get_widget( $widget_name );
		if ( is_wp_error( $widget_type ) ) {
			return $widget_type;
		}
		$data = $this->prepare_item_for_response( $widget_type, $request );

		return rest_ensure_response( $data );
	}

	/**
	 * Prepares a widget type object for serialization.
	 *
	 * @since x.x.0
	 *
	 * @param array           $widget_type Widget type data.
	 * @param WP_REST_Request $request    Full details about the request.
	 * @return WP_REST_Response Widget type data.
	 */
	public function prepare_item_for_response( $widget_type, $request ) {

		$fields = $this->get_fields_for_response( $request );
		$data   = array();

		$schema       = $this->get_item_schema();
		$extra_fields = array(
			'name',
			'id',
			'description',
			'classname',
			'widget_class',
			'option_name',
			'customize_selective_refresh',
		);

		foreach ( $extra_fields as $extra_field ) {
			if ( rest_is_field_included( $extra_field, $fields ) ) {
				if ( isset( $widget_type[ $extra_field ] ) ) {
					$field = $widget_type[ $extra_field ];
				} elseif ( array_key_exists( 'default', $schema['properties'][ $extra_field ] ) ) {
					$field = $schema['properties'][ $extra_field ]['default'];
				} else {
					$field = '';
				}

				$data[ $extra_field ] = rest_sanitize_value_from_schema( $field, $schema['properties'][ $extra_field ] );
			}
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		$response = rest_ensure_response( $data );

		$response->add_links( $this->prepare_links( $widget_type ) );

		/**
		 * Filters a widget type returned from the REST API.
		 *
		 * Allows modification of the widget type data right before it is returned.
		 *
		 * @since x.x.0
		 *
		 * @param WP_REST_Response $response   The response object.
		 * @param WP_Widget    $widget_type The original widget type object.
		 * @param WP_REST_Request  $request    Request used to generate the response.
		 */
		return apply_filters( 'rest_prepare_widget_type', $response, $widget_type, $request );
	}

	/**
	 * Prepares links for the request.
	 *
	 * @since x.x.0
	 *
	 * @param WP_Widget $widget_type Widget type data.
	 * @return array Links for the given widget type.
	 */
	protected function prepare_links( $widget_type ) {
		$links = array(
			'collection' => array(
				'href' => rest_url( sprintf( '%s/%s', $this->namespace, $this->rest_base ) ),
			),
			'self'       => array(
				'href' => rest_url( sprintf( '%s/%s/%s', $this->namespace, $this->rest_base, $widget_type['id'] ) ),
			),
		);

		return $links;
	}

	/**
	 * Retrieves the widget type' schema, conforming to JSON Schema.
	 *
	 * @since x.x.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'widget-type',
			'type'       => 'object',
			'properties' => array(
				'name'                        => array(
					'description' => __( 'Unique name identifying the widget type.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'id'                          => array(
					'description' => __( 'Unique name identifying the widget type.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'description'                 => array(
					'description' => __( 'Description of the widget.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'classname'                   => array(
					'description' => __( 'Class name', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'option_name'                 => array(
					'description' => __( 'Option name.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'widget_class'                => array(
					'description' => __( 'Widget class name.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'customize_selective_refresh' => array(
					'description' => __( 'Customize selective refresh.', 'gutenberg' ),
					'type'        => 'boolean',
					'default'     => false,
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Returns the new widget instance and the form that represents it.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 * @since 5.7.0
	 * @access public
	 */
	public function get_widget_form( $request ) {
		$instance = $request->get_param( 'instance' );

		$widget_name = $request['name'];
		$widget      = $this->get_widget( $widget_name );
		$widget_obj  = new $widget['widget_class'];
		$widget_obj->_set( -1 );
		ob_start();

		$instance = apply_filters( 'widget_form_callback', $instance, $widget_obj );

		$return = null;
		if ( false !== $instance ) {
			$return = $widget_obj->form( $instance );

			/**
			 * Fires at the end of the widget control form.
			 *
			 * Use this hook to add extra fields to the widget form. The hook
			 * is only fired if the value passed to the 'widget_form_callback'
			 * hook is not false.
			 *
			 * Note: If the widget has no form, the text echoed from the default
			 * form method can be hidden using CSS.
			 *
			 * @param WP_Widget $widget_obj The widget instance (passed by reference).
			 * @param null $return Return null if new fields are added.
			 * @param array $instance An array of the widget's settings.
			 *
			 * @since 5.2.0
			 */
			do_action_ref_array( 'in_widget_form', array( &$widget_obj, &$return, $instance ) );
		}
		$form = ob_get_clean();

		return rest_ensure_response(
			array(
				'instance' => $instance,
				'form'     => $form,
			)
		);
	}

	/**
	 * Retrieves the query params for collections.
	 *
	 * @since 5.5.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		return array(
			'context' => $this->get_context_param( array( 'default' => 'view' ) ),
		);
	}

}
