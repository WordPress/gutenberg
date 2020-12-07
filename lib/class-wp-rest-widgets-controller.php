<?php
/**
 * REST API: WP_REST_Widgets_Controller class
 *
 * @package Gutenberg
 */

/**
 * Core class representing a controller for widgets.
 */
class WP_REST_Widgets_Controller extends WP_REST_Controller {

	/**
	 * Widgets controller constructor.
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'widgets';
	}

	/**
	 * Registers the widget routes for the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema(),
				),
				'allow_batch' => array( 'v1' => true ),
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/(?P<id>[\w\-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'context' => $this->get_context_param( array( 'default' => 'view' ) ),
					),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
					'args'                => array(
						'force' => array(
							'description' => __( 'Whether to force removal of the widget, or move it to the inactive sidebar.', 'gutenberg' ),
							'type'        => 'boolean',
						),
					),
				),
				'allow_batch' => array( 'v1' => true ),
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to get widgets.
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->permissions_check();
	}

	/**
	 * Retrieves a collection of widgets.
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$prepared = array();

		foreach ( wp_get_sidebars_widgets() as $sidebar_id => $widget_ids ) {
			if ( isset( $request['sidebar'] ) && $sidebar_id !== $request['sidebar'] ) {
				continue;
			}

			foreach ( $widget_ids as $widget_id ) {
				$response = $this->prepare_item_for_response( compact( 'sidebar_id', 'widget_id' ), $request );

				if ( ! is_wp_error( $response ) ) {
					$prepared[] = $this->prepare_response_for_collection( $response );
				}
			}
		}

		return new WP_REST_Response( $prepared );
	}

	/**
	 * Checks if a given request has access to get a widget.
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->permissions_check();
	}

	/**
	 * Gets an individual widget.
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$widget_id  = $request['id'];
		$sidebar_id = $this->find_widgets_sidebar( $widget_id );

		if ( is_wp_error( $sidebar_id ) ) {
			return $sidebar_id;
		}

		return $this->prepare_item_for_response( compact( 'sidebar_id', 'widget_id' ), $request );
	}

	/**
	 * Checks if a given request has access to create widgets.
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->permissions_check();
	}

	/**
	 * Creates a widget.
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$sidebar_id = $request['sidebar'];

		$backup_post = $_POST;
		$widget_id   = $this->save_widget( $request );
		$_POST       = $backup_post;

		$this->assign_to_sidebar( $widget_id, $sidebar_id );

		$request['context'] = 'edit';

		$response = $this->prepare_item_for_response( compact( 'sidebar_id', 'widget_id' ), $request );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response->set_status( 201 );

		return $response;
	}

	/**
	 * Checks if a given request has access to update widgets.
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function update_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->permissions_check();
	}

	/**
	 * Updates an existing widget.
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		$widget_id  = $request['id'];
		$sidebar_id = $this->find_widgets_sidebar( $widget_id );

		if ( is_wp_error( $sidebar_id ) ) {
			// Allow for an update request to a reference widget if the widget hasn't been assigned to a sidebar yet.
			if ( $request['sidebar'] && $this->is_reference_widget( $widget_id ) ) {
				$sidebar_id = $request['sidebar'];
				$this->assign_to_sidebar( $widget_id, $sidebar_id );
			} else {
				return $sidebar_id;
			}
		}

		$backup_post = $_POST;

		if ( isset( $request['settings'] ) ) {
			$this->save_widget( $request );
		}

		$_POST = $backup_post;

		if ( isset( $request['sidebar'] ) && $request['sidebar'] !== $sidebar_id ) {
			$sidebar_id = $request['sidebar'];
			$this->assign_to_sidebar( $widget_id, $sidebar_id );
		}

		$request['context'] = 'edit';

		return $this->prepare_item_for_response( compact( 'sidebar_id', 'widget_id' ), $request );
	}

	/**
	 * Checks if a given request has access to delete widgets.
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function delete_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->permissions_check();
	}

	/**
	 * Deletes a widget.
	 *
	 * @since 5.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function delete_item( $request ) {
		$widget_id  = $request['id'];
		$sidebar_id = $this->find_widgets_sidebar( $widget_id );

		if ( is_wp_error( $sidebar_id ) ) {
			return $sidebar_id;
		}

		$request['context'] = 'edit';

		if ( $request['force'] ) {
			$prepared = $this->prepare_item_for_response( compact( 'sidebar_id', 'widget_id' ), $request );
			$this->assign_to_sidebar( $widget_id, null );
			$prepared->set_data(
				array(
					'deleted'  => true,
					'previous' => $prepared->get_data(),
				)
			);
		} else {
			$this->assign_to_sidebar( $widget_id, 'wp_inactive_widgets' );
			$prepared = $this->prepare_item_for_response(
				array(
					'sidebar_id' => 'wp_inactive_widgets',
					'widget_id'  => $widget_id,
				),
				$request
			);
		}

		return $prepared;
	}

	/**
	 * Assigns a widget to the given sidebar.
	 *
	 * @param string $widget_id  The widget id to assign.
	 * @param string $sidebar_id The sidebar id to assign to.
	 */
	protected function assign_to_sidebar( $widget_id, $sidebar_id ) {
		$sidebars = wp_get_sidebars_widgets();

		foreach ( $sidebars as $maybe_sidebar_id => $widgets ) {
			foreach ( $widgets as $i => $maybe_widget_id ) {
				if ( $widget_id === $maybe_widget_id && $sidebar_id !== $maybe_sidebar_id ) {
					unset( $sidebars[ $maybe_sidebar_id ][ $i ] );
					// We could technically break 2 here, but continue looping in case the id is duplicated.
					continue 2;
				}
			}
		}

		if ( $sidebar_id ) {
			$sidebars[ $sidebar_id ][] = $widget_id;
		}

		wp_set_sidebars_widgets( $sidebars );
	}

	/**
	 * Performs a permissions check for managing widgets.
	 *
	 * @return true|WP_Error
	 */
	protected function permissions_check() {
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
	 * Finds the sidebar a widget belongs to.
	 *
	 * @param string $widget_id The widget id to search for.
	 * @return string|WP_Error The found sidebar id, or a WP_Error instance if it does not exist.
	 */
	protected function find_widgets_sidebar( $widget_id ) {
		foreach ( wp_get_sidebars_widgets() as $sidebar_id => $widget_ids ) {
			foreach ( $widget_ids as $maybe_widget_id ) {
				if ( $maybe_widget_id === $widget_id ) {
					return (string) $sidebar_id;
				}
			}
		}

		return new WP_Error( 'rest_widget_not_found', __( 'No widget was found with that id.', 'gutenberg' ), array( 'status' => 404 ) );
	}

	/**
	 * Saves the widget in the request object.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return string
	 */
	protected function save_widget( $request ) {
		global $wp_registered_widget_updates, $wp_registered_widgets;

		$input_widget = $request->get_params();

		if ( isset( $input_widget['id'] ) && ! $this->is_reference_widget( $input_widget['id'] ) ) {
			$widget = $wp_registered_widgets[ $input_widget['id'] ];

			$input_widget['number']  = (int) $widget['params'][0]['number'];
			$input_widget['id_base'] = _get_widget_id_base( $input_widget['id'] );
		}

		ob_start();
		if ( isset( $input_widget['id_base'] ) && isset( $wp_registered_widget_updates[ $input_widget['id_base'] ] ) ) {
			// Class-based widget.
			$update_control = $wp_registered_widget_updates[ $input_widget['id_base'] ];
			if ( ! isset( $input_widget['id'] ) ) {
				$number = $this->get_last_number_for_widget( $input_widget['id_base'] ) + 1;
				$id     = $input_widget['id_base'] . '-' . $number;

				$input_widget['id']     = $id;
				$input_widget['number'] = $number;
			}
			$field                      = 'widget-' . $input_widget['id_base'];
			$number                     = $input_widget['number'];
			$_POST                      = $input_widget;
			$_POST[ $field ][ $number ] = wp_slash( $input_widget['settings'] );
			call_user_func( $update_control['callback'] );
			$update_control['callback'][0]->updated = false;

			// Just because we saved new widget doesn't mean it was added to $wp_registered_widgets.
			// Let's make sure it's there so that it's included in the response.
			if ( ! isset( $wp_registered_widgets[ $input_widget['id'] ] ) || 1 === $number ) {
				$widget_class = get_class( $update_control['callback'][0] );
				$new_object   = new $widget_class(
					$input_widget['id_base'],
					$input_widget['name'],
					$input_widget['settings']
				);
				$new_object->_set( $number );
				$new_object->_register();
			}
		} else {
			$registered_widget_id = null;
			if ( isset( $wp_registered_widget_updates[ $input_widget['id'] ] ) ) {
				$registered_widget_id = $input_widget['id'];
			} else {
				$numberless_id = substr( $input_widget['id'], 0, strrpos( $input_widget['id'], '-' ) );
				if ( isset( $wp_registered_widget_updates[ $numberless_id ] ) ) {
					$registered_widget_id = $numberless_id;
				}
			}

			if ( $registered_widget_id ) {
				// Old-style widget.
				$update_control = $wp_registered_widget_updates[ $registered_widget_id ];
				$_POST          = wp_slash( $input_widget['settings'] );
				call_user_func( $update_control['callback'] );
			}
		}
		ob_end_clean();

		return $input_widget['id'];
	}

	/**
	 * Gets the last number used by the given widget.
	 *
	 * @param string $id_base The widget id base.
	 * @return int The last number, or zero if the widget has not been used.
	 */
	protected function get_last_number_for_widget( $id_base ) {
		global $wp_registered_widget_updates;

		if ( ! is_array( $wp_registered_widget_updates[ $id_base ]['callback'] ) ) {
			return 0;
		}

		if ( ! $wp_registered_widget_updates[ $id_base ]['callback'][0] instanceof WP_Widget ) {
			return 0;
		}

		$widget    = $wp_registered_widget_updates[ $id_base ]['callback'][0];
		$instances = array_filter( $widget->get_settings(), 'is_numeric', ARRAY_FILTER_USE_KEY );

		if ( ! $instances ) {
			return 0;
		}

		return $widget->number;
	}

	/**
	 * Prepares the widget for the REST response.
	 *
	 * @since 5.6.0
	 *
	 * @param array           $item    An array containing a widget_id and sidebar_id.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function prepare_item_for_response( $item, $request ) {
		global $wp_registered_widgets, $wp_registered_sidebars, $wp_registered_widget_controls;

		$widget_id  = $item['widget_id'];
		$sidebar_id = $item['sidebar_id'];

		if ( ! isset( $wp_registered_widgets[ $widget_id ] ) ) {
			return new WP_Error( 'rest_invalid_widget', __( 'The requested widget is invalid.', 'gutenberg' ), array( 'status' => 500 ) );
		}

		$fields = $this->get_fields_for_response( $request );

		if ( isset( $wp_registered_sidebars[ $sidebar_id ] ) ) {
			$registered_sidebar = $wp_registered_sidebars[ $sidebar_id ];
		} elseif ( 'wp_inactive_widgets' === $sidebar_id ) {
			$registered_sidebar = array();
		} else {
			$registered_sidebar = null;
		}

		$widget   = $wp_registered_widgets[ $widget_id ];
		$prepared = array(
			'id'            => $widget_id,
			'id_base'       => '',
			'sidebar'       => $sidebar_id,
			'widget_class'  => '',
			'name'          => $widget['name'],
			'description'   => ! empty( $widget['description'] ) ? $widget['description'] : '',
			'number'        => 0,
			'rendered'      => '',
			'rendered_form' => '',
			'settings'      => array(),
		);

		// Get the widget output.
		if ( is_callable( $widget['callback'] ) && rest_is_field_included( 'rendered', $fields ) && 'wp_inactive_widgets' !== $sidebar_id ) {
			// @note: everything up to ob_start is taken from the dynamic_sidebar function.
			$widget_parameters = array_merge(
				array(
					array_merge(
						(array) $registered_sidebar,
						array(
							'widget_id'   => $widget_id,
							'widget_name' => $widget['name'],
						)
					),
				),
				(array) $widget['params']
			);

			$classname = '';
			foreach ( (array) $widget['classname'] as $cn ) {
				if ( is_string( $cn ) ) {
					$classname .= '_' . $cn;
				} elseif ( is_object( $cn ) ) {
					$classname .= '_' . get_class( $cn );
				}
			}
			$classname = ltrim( $classname, '_' );
			if ( isset( $widget_parameters[0]['before_widget'] ) ) {
				$widget_parameters[0]['before_widget'] = sprintf(
					$widget_parameters[0]['before_widget'],
					$widget_id,
					$classname
				);
			}

			ob_start();
			call_user_func_array( $widget['callback'], $widget_parameters );
			$prepared['rendered'] = trim( ob_get_clean() );
		}

		if ( is_array( $widget['callback'] ) && isset( $widget['callback'][0] ) ) {
			$instance                 = $widget['callback'][0];
			$prepared['widget_class'] = get_class( $instance );
			$prepared['settings']     = $this->get_sidebar_widget_instance(
				$registered_sidebar,
				$widget_id
			);
			$prepared['number']       = (int) $widget['params'][0]['number'];
			$prepared['id_base']      = $instance->id_base;
		}

		if (
			rest_is_field_included( 'rendered_form', $fields ) &&
			isset( $wp_registered_widget_controls[ $widget_id ]['callback'] )
		) {
			$control   = $wp_registered_widget_controls[ $widget_id ];
			$arguments = array();
			if ( ! empty( $prepared['number'] ) ) {
				$arguments[0] = array( 'number' => $prepared['number'] );
			}
			ob_start();
			call_user_func_array( $control['callback'], $arguments );
			$prepared['rendered_form'] = trim( ob_get_clean() );
		}

		$context  = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$prepared = $this->add_additional_fields_to_object( $prepared, $request );
		$prepared = $this->filter_response_by_context( $prepared, $context );

		$response = rest_ensure_response( $prepared );

		$response->add_links( $this->prepare_links( $prepared ) );

		/**
		 * Filter widget REST API response.
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param array            $prepared Widget data.
		 * @param WP_REST_Request  $request  Request used to generate the response.
		 */
		return apply_filters( 'rest_prepare_widget', $response, $prepared, $request );
	}

	/**
	 * Prepares links for the request.
	 *
	 * @param array $prepared Widget.
	 * @return array Links for the given widget.
	 */
	protected function prepare_links( $prepared ) {
		$id_base = ( ! empty( $prepared['id_base'] ) ) ? $prepared['id_base'] : $prepared['id'];

		return array(
			'collection'                => array(
				'href' => rest_url( sprintf( '%s/%s', $this->namespace, $this->rest_base ) ),
			),
			'self'                      => array(
				'href' => rest_url( sprintf( '%s/%s/%s', $this->namespace, $this->rest_base, $prepared['id'] ) ),
			),
			'about'                     => array(
				'href'       => rest_url( sprintf( 'wp/v2/widget-types/%s', $id_base ) ),
				'embeddable' => true,
			),
			'https://api.w.org/sidebar' => array(
				'href' => rest_url( sprintf( 'wp/v2/sidebars/%s/', $prepared['sidebar'] ) ),
			),
		);
	}

	/**
	 * Retrieves a widget instance.
	 *
	 * @param array  $sidebar sidebar data available at $wp_registered_sidebars.
	 * @param string $id      Identifier of the widget instance.
	 *
	 * @return array Array containing the widget instance.
	 */
	protected function get_sidebar_widget_instance( $sidebar, $id ) {
		list( $object, $number, $name ) = $this->get_widget_info( $id );
		if ( ! $object ) {
			return array();
		}

		$object->_set( $number );

		$instances = $object->get_settings();
		$instance  = $instances[ $number ];

		$args = array_merge(
			is_array( $sidebar ) ? $sidebar : array(),
			array(
				'widget_id'   => $id,
				'widget_name' => $name,
			)
		);

		/** This filter is documented in wp-includes/class-wp-widget.php */
		$instance = apply_filters( 'widget_display_callback', $instance, $object, $args );

		if ( false === $instance ) {
			return array();
		}

		return $instance;
	}

	/**
	 * Given a widget id returns an array containing information about the widget.
	 *
	 * @param string $widget_id Identifier of the widget.
	 *
	 * @return array Array containing the the widget object, the number, and the name.
	 */
	protected function get_widget_info( $widget_id ) {
		global $wp_registered_widgets;

		if (
			! is_array( $wp_registered_widgets[ $widget_id ]['callback'] ) ||
			! isset( $wp_registered_widgets[ $widget_id ]['callback'][0] ) ||
			! isset( $wp_registered_widgets[ $widget_id ]['params'][0]['number'] ) ||
			! isset( $wp_registered_widgets[ $widget_id ]['name'] ) ||
			! ( $wp_registered_widgets[ $widget_id ]['callback'][0] instanceof WP_Widget )
		) {
			return array( null, null, null );
		}

		$object = $wp_registered_widgets[ $widget_id ]['callback'][0];
		$number = $wp_registered_widgets[ $widget_id ]['params'][0]['number'];
		$name   = $wp_registered_widgets[ $widget_id ]['name'];

		return array( $object, $number, $name );
	}

	/**
	 * Checks if the given widget id is a reference widget, ie one that does not use WP_Widget.
	 *
	 * @since 5.6.0
	 *
	 * @param string $widget_id The widget id to check.
	 * @return bool Whether this is a reference widget or not.
	 */
	protected function is_reference_widget( $widget_id ) {
		list ( $object ) = $this->get_widget_info( $widget_id );

		return ! $object instanceof WP_Widget;
	}

	/**
	 * Gets the list of collection params.
	 *
	 * @since 5.6.0
	 *
	 * @return array[]
	 */
	public function get_collection_params() {
		return array(
			'context' => $this->get_context_param( array( 'default' => 'view' ) ),
			'sidebar' => array(
				'description' => __( 'The sidebar to return widgets for.', 'gutenberg' ),
				'type'        => 'string',
			),
		);
	}

	/**
	 * Retrieves the widget's schema, conforming to JSON Schema.
	 *
	 * @since 5.6.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'widget',
			'type'       => 'object',
			'properties' => array(
				'id'            => array(
					'description' => __( 'Unique identifier for the widget.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'id_base'       => array(
					'description' => __( 'Type of widget for the object.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'sidebar'       => array(
					'description' => __( 'The sidebar the widget belongs to.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => 'wp_inactive_widgets',
					'required'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'widget_class'  => array(
					'description' => __( 'Class name of the widget implementation.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'name'          => array(
					'description' => __( 'Name of the widget.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'description'   => array(
					'description' => __( 'Description of the widget.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'number'        => array(
					'description' => __( 'Number of the widget.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'rendered'      => array(
					'description' => __( 'HTML representation of the widget.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
				'rendered_form' => array(
					'description' => __( 'HTML representation of the widget admin form.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
				'settings'      => array(
					'description' => __( 'Settings of the widget.', 'gutenberg' ),
					'type'        => 'object',
					'context'     => array( 'view', 'edit', 'embed' ),
					'default'     => array(),
				),
			),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}
}
