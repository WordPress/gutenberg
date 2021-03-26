<?php
/**
 * REST API: WP_REST_Widget_Types_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 5.6.0
 */

/**
 * Core class to access widget types via the REST API.
 *
 * @since 5.6.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Widget_Types_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
	 * @since 5.6.0
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'widget-types';
	}

	/**
	 * Registers the widget type routes.
	 *
	 * @since 5.6.0
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
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9_-]+)',
			array(
				'args'   => array(
					'id' => array(
						'description' => __( 'The widget type id.', 'gutenberg' ),
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

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9_-]+)/encode',
			array(
				'args' => array(
					'id'        => array(
						'description' => __( 'The widget type id.', 'gutenberg' ),
						'type'        => 'string',
						'required'    => true,
					),
					'instance'  => array(
						'description' => __( 'Current instance settings of the widget.', 'gutenberg' ),
						'type'        => 'object',
					),
					'form_data' => array(
						'description'       => __( 'Serialized widget form data to encode into instance settings.', 'gutenberg' ),
						'type'              => 'string',
						'sanitize_callback' => function( $string ) {
							$array = array();
							wp_parse_str( $string, $array );
							return $array;
						},
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'callback'            => array( $this, 'encode_form_data' ),
				),
			)
		);

		// Backwards compatibility. TODO: Remove.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9_-]+)/form-renderer',
			array(
				'args' => array(
					'id'       => array(
						'description' => __( 'The widget type id.', 'gutenberg' ),
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
	}

	/**
	 * Checks whether a given request has permission to read widget types.
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|bool True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->check_read_permission();
	}

	/**
	 * Retrieves the list of all widget types.
	 *
	 * @since 5.6.0
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
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|bool True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) {
		$check = $this->check_read_permission();
		if ( is_wp_error( $check ) ) {
			return $check;
		}
		$widget_id   = $request['id'];
		$widget_type = $this->get_widget( $widget_id );
		if ( is_wp_error( $widget_type ) ) {
			return $widget_type;
		}

		return true;
	}

	/**
	 * Checks whether the user can read widget types.
	 *
	 * @since 5.6.0
	 *
	 * @return WP_Error|bool True if the widget type is visible, WP_Error otherwise.
	 */
	protected function check_read_permission() {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_cannot_manage_widgets',
				__( 'Sorry, you are not allowed to manage widgets on this site.', 'gutenberg' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}

		return true;
	}

	/**
	 * Gets the details about the requested widget.
	 *
	 * @since 5.6.0
	 *
	 * @param string $id The widget type id.
	 * @return array|WP_Error The array of widget data if the name is valid, WP_Error otherwise.
	 */
	public function get_widget( $id ) {
		foreach ( $this->get_widgets() as $widget ) {
			if ( $id === $widget['id'] ) {
				return $widget;
			}
		}

		return new WP_Error( 'rest_widget_type_invalid', __( 'Invalid widget type.', 'gutenberg' ), array( 'status' => 404 ) );
	}

	/**
	 * Normalize array of widgets.
	 *
	 * @since 5.6.0
	 *
	 * @global array $wp_registered_widgets The list of registered widgets.
	 *
	 * @return array Array of widgets.
	 */
	protected function get_widgets() {
		global $wp_registered_widgets;

		$widgets = array();

		foreach ( $wp_registered_widgets as $widget ) {
			$parsed_id    = gutenberg_parse_widget_id( $widget['id'] );
			$widget['id'] = $parsed_id['id_base'];

			unset( $widget['callback'] );

			$classname = '';
			foreach ( (array) $widget['classname'] as $cn ) {
				if ( is_string( $cn ) ) {
					$classname .= '_' . $cn;
				} elseif ( is_object( $cn ) ) {
					$classname .= '_' . get_class( $cn );
				}
			}
			$widget['classname'] = ltrim( $classname, '_' );

			// Backwards compatibility. TODO: Remove.
			$widget_object = gutenberg_get_widget_object( $parsed_id['id_base'] );
			if ( $widget_object ) {
				$widget['option_name']  = $widget_object->option_name;
				$widget['widget_class'] = get_class( $widget_object );
			}

			$widgets[] = $widget;
		}

		return $widgets;
	}

	/**
	 * Retrieves a single widget type from the collection.
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$widget_id   = $request['id'];
		$widget_type = $this->get_widget( $widget_id );
		if ( is_wp_error( $widget_type ) ) {
			return $widget_type;
		}
		$data = $this->prepare_item_for_response( $widget_type, $request );

		return rest_ensure_response( $data );
	}

	/**
	 * Prepares a widget type object for serialization.
	 *
	 * @since 5.6.0
	 *
	 * @param array           $widget_type Widget type data.
	 * @param WP_REST_Request $request    Full details about the request.
	 * @return WP_REST_Response Widget type data.
	 */
	public function prepare_item_for_response( $widget_type, $request ) {
		$fields = $this->get_fields_for_response( $request );
		$data   = array(
			'id' => $widget_type['id'],
		);

		$schema       = $this->get_item_schema();
		$extra_fields = array(
			'name',
			'description',
			'classname',
			'widget_class',
			'option_name',
			'customize_selective_refresh',
		);

		foreach ( $extra_fields as $extra_field ) {
			if ( ! rest_is_field_included( $extra_field, $fields ) ) {
				continue;
			}

			if ( isset( $widget_type[ $extra_field ] ) ) {
				$field = $widget_type[ $extra_field ];
			} elseif ( array_key_exists( 'default', $schema['properties'][ $extra_field ] ) ) {
				$field = $schema['properties'][ $extra_field ]['default'];
			} else {
				$field = '';
			}

			$data[ $extra_field ] = rest_sanitize_value_from_schema( $field, $schema['properties'][ $extra_field ] );
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		$response = rest_ensure_response( $data );

		$response->add_links( $this->prepare_links( $widget_type ) );

		/**
		 * Filters the REST API response for a widget type.
		 *
		 * @since 5.6.0
		 *
		 * @param WP_REST_Response $response    The response object.
		 * @param array            $widget_type The array of widget data.
		 * @param WP_REST_Request  $request     The request object.
		 */
		return apply_filters( 'rest_prepare_widget_type', $response, $widget_type, $request );
	}

	/**
	 * Prepares links for the widget type.
	 *
	 * @since 5.6.0
	 *
	 * @param array $widget_type Widget type data.
	 * @return array Links for the given widget type.
	 */
	protected function prepare_links( $widget_type ) {
		return array(
			'collection' => array(
				'href' => rest_url( sprintf( '%s/%s', $this->namespace, $this->rest_base ) ),
			),
			'self'       => array(
				'href' => rest_url( sprintf( '%s/%s/%s', $this->namespace, $this->rest_base, $widget_type['id'] ) ),
			),
		);
	}

	/**
	 * Retrieves the widget type's schema, conforming to JSON Schema.
	 *
	 * @since 5.6.0
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
				'id'                          => array(
					'description' => __( 'Unique slug identifying the widget type.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'name'                        => array(
					'description' => __( 'Human-readable name identifying the widget type.', 'gutenberg' ),
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
					'description' => __( 'DEPRECATED. Option name.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'widget_class'                => array(
					'description' => __( 'DEPRECATED. Widget class name.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'customize_selective_refresh' => array(
					'description' => __( 'DEPRECATED. Customize selective refresh.', 'gutenberg' ),
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
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_widget_form( $request ) {
		_deprecated_function( __METHOD__, '10.2.0' );

		$instance = $request->get_param( 'instance' );

		$widget_name = $request['id'];
		$widget      = $this->get_widget( $widget_name );
		$widget_obj  = new $widget['widget_class'];
		$widget_obj->_set( -1 );
		ob_start();

		/** This filter is documented in wp-includes/class-wp-widget.php */
		$instance = apply_filters( 'widget_form_callback', $instance, $widget_obj );

		$return = null;
		if ( false !== $instance ) {
			$return = $widget_obj->form( $instance );

			/** This filter is documented in wp-includes/class-wp-widget.php */
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
	 * An RPC-style endpoint which can be used by clients to turn user input in
	 * a widget admin form into an encoded instance object.
	 *
	 * Accepts:
	 *
	 * - id:        A widget type ID.
	 * - instance:  A widget's encoded instance object. Optional.
	 * - form_data: Form data from submitting a widget's admin form. Optional.
	 *
	 * Returns:
	 * - instance: The encoded instance object after updating the widget with
	 *             the given form data.
	 * - form:     The widget's admin form after updating the widget with the
	 *             given form data.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function encode_form_data( $request ) {
		$id            = $request['id'];
		$widget_object = gutenberg_get_widget_object( $id );

		if ( ! $widget_object ) {
			return new WP_Error(
				'rest_invalid_widget',
				__( 'Cannot preview a widget that does not extend WP_Widget.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// Set the widget's number to 1 so that the `id` attributes in the HTML
		// that we return are predictable.
		$widget_object->_set( 1 );

		if ( isset( $request['instance']['encoded'], $request['instance']['hash'] ) ) {
			$serialized_instance = base64_decode( $request['instance']['encoded'] );
			if ( ! hash_equals( wp_hash( $serialized_instance ), $request['instance']['hash'] ) ) {
				return new WP_Error(
					'rest_invalid_widget',
					__( 'The provided instance is malformed.', 'gutenberg' ),
					array( 'status' => 400 )
				);
			}
			$instance = unserialize( $serialized_instance );
		} else {
			$instance = array();
		}

		if (
			isset( $request['form_data'][ "widget-$id" ] ) &&
			is_array( $request['form_data'][ "widget-$id" ] )
		) {
			$new_instance = array_values( $request['form_data'][ "widget-$id" ] )[0];
			$old_instance = $instance;

			$instance = $widget_object->update( $new_instance, $old_instance );

			/** This filter is documented in wp-includes/class-wp-widget.php */
			$instance = apply_filters(
				'widget_update_callback',
				$instance,
				$new_instance,
				$old_instance,
				$widget_object
			);
		}

		ob_start();

		/** This filter is documented in wp-includes/class-wp-widget.php */
		$instance = apply_filters(
			'widget_form_callback',
			$instance,
			$widget_object
		);

		if ( false !== $instance ) {
			$return = $widget_object->form( $instance );

			/** This filter is documented in wp-includes/class-wp-widget.php */
			do_action_ref_array(
				'in_widget_form',
				array( &$widget_object, &$return, $instance )
			);
		}

		$form = ob_get_clean();

		$serialized_instance = serialize( $instance );

		$response = array(
			'form'     => trim( $form ),
			'instance' => array(
				'encoded' => base64_encode( $serialized_instance ),
				'hash'    => wp_hash( $serialized_instance ),
			),
		);

		if ( ! empty( $widget_object->show_instance_in_rest ) ) {
			if ( empty( $instance ) ) {
				// Use new stdClass() instead of array() so that endpoint
				// returns {} and not [].
				$response['instance']['raw'] = new stdClass;
			} else {
				$response['instance']['raw'] = $instance;
			}
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Retrieves the query params for collections.
	 *
	 * @since 5.6.0
	 *
	 * @return array Collection parameters.
	 */
	public function get_collection_params() {
		return array(
			'context' => $this->get_context_param( array( 'default' => 'view' ) ),
		);
	}
}
