<?php

/**
 * Class WP_REST_Widgets_Controller
 */
class WP_REST_Widgets_Controller extends WP_REST_Controller {

	/**
	 * Widgets controller constructor.
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'widgets';
	}

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
				'allow_batch' => true,
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
							'description' => __( 'Whether to force removal of the widget, or move it to the inactive sidebar.' ),
							'type'        => 'boolean',
						),
					),
				),
				'allow_batch' => true,
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	public function get_items_permissions_check( $request ) {
		return $this->permissions_check();
	}

	public function get_items( $request ) {
		$prepared = array();

		foreach ( wp_get_sidebars_widgets() as $sidebar_id => $widget_ids ) {
			foreach ( $widget_ids as $widget_id ) {
				$response = $this->prepare_item_for_response( compact( 'sidebar_id', 'widget_id' ), $request );

				if ( ! is_wp_error( $response ) ) {
					$prepared[] = $this->prepare_response_for_collection( $response );
				}
			}
		}

		return new WP_REST_Response( $prepared );
	}

	public function get_item_permissions_check( $request ) {
		return $this->permissions_check();
	}

	public function get_item( $request ) {
		$widget_id  = $request['id'];
		$sidebar_id = $this->find_widgets_sidebar( $widget_id );

		if ( is_wp_error( $sidebar_id ) ) {
			return $sidebar_id;
		}

		return $this->prepare_item_for_response( compact( 'sidebar_id', 'widget_id' ), $request );
	}

	public function create_item_permissions_check( $request ) {
		return $this->permissions_check();
	}

	public function create_item( $request ) {
		$backup_post = $_POST;
		$sidebar_id  = $request['sidebar'];
		$widget_id   = $this->save_widget( $request );
		$_POST       = $backup_post;
		$this->assign_to_sidebar( $widget_id, $sidebar_id );

		$response = $this->prepare_item_for_response( compact( 'sidebar_id', 'widget_id' ), $request );
		$response->set_status( 201 );

		return $response;
	}

	public function update_item_permissions_check( $request ) {
		return $this->permissions_check();
	}

	public function update_item( $request ) {
		$widget_id  = $request['id'];
		$sidebar_id = $this->find_widgets_sidebar( $widget_id );

		if ( is_wp_error( $sidebar_id ) ) {
			return $sidebar_id;
		}

		$backup_post = $_POST;
		$this->save_widget( $request );
		$_POST = $backup_post;

		if ( isset( $request['sidebar'] ) && $request['sidebar'] !== $sidebar_id ) {
			$this->assign_to_sidebar( $widget_id, $sidebar_id );
			$sidebar_id = $request['sidebar'];
		}

		return $this->prepare_item_for_response( compact( 'sidebar_id', 'widget_id' ), $request );
	}

	public function delete_item_permissions_check( $request ) {
		return $this->permissions_check();
	}

	public function delete_item( $request ) {
		$widget_id  = $request['id'];
		$sidebar_id = $this->find_widgets_sidebar( $widget_id );

		if ( is_wp_error( $sidebar_id ) ) {
			return $sidebar_id;
		}

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
			$this->assign_to_sidebar( $widget_id, 'wp_inactive_sidebar' );
			$prepared = $this->prepare_item_for_response( compact( 'sidebar_id', 'widget_id' ), $request );
		}

		return $prepared;
	}

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

		$sidebars[ $sidebar_id ][] = $widget_id;

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
	 * @param WP_REST_Request $request
	 *
	 * @return string
	 */
	protected function save_widget( $request ) {
		global $wp_registered_widget_updates, $wp_registered_widgets;

		// Initialize $numbers.
		$numbers = array();
		foreach ( $wp_registered_widget_updates as $id_base => $control ) {
			if ( is_array( $control['callback'] ) ) {
				$numbers[ $id_base ] = $control['callback'][0]->number + 1;
			}
		}

		$input_widget = $request->get_params();

		ob_start();
		if ( isset( $input_widget['id_base'] ) && isset( $wp_registered_widget_updates[ $input_widget['id_base'] ] ) ) {
			// Class-based widget.
			$update_control = $wp_registered_widget_updates[ $input_widget['id_base'] ];
			if ( ! isset( $input_widget['id'] ) ) {
				$number = $numbers[ $input_widget['id_base'] ] ++;
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
			if ( ! isset( $wp_registered_widgets[ $input_widget['id'] ] ) ) {
				$first_widget_id = substr( $input_widget['id'], 0, strrpos( $input_widget['id'], '-' ) ) . '-1';

				if ( isset( $wp_registered_widgets[ $first_widget_id ] ) ) {
					$wp_registered_widgets[ $input_widget['id'] ] = $wp_registered_widgets[ $first_widget_id ];

					$widget_class = get_class( $update_control['callback'][0] );
					$new_object   = new $widget_class(
						$input_widget['id_base'],
						$input_widget['name'],
						$input_widget['settings']
					);
					$new_object->_register();
					$wp_registered_widgets[ $input_widget['id'] ]['callback'][0] = $new_object;
				}
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

	public function prepare_item_for_response( $item, $request ) {
		global $wp_registered_widgets, $wp_registered_sidebars, $wp_registered_widget_controls;

		$widget_id  = $item['widget_id'];
		$sidebar_id = $item['sidebar_id'];

		if ( ! isset( $wp_registered_widgets[ $widget_id ] ) ) {
			return new WP_Error( 'rest_invalid_widget', __( 'The requested widget is invalid.' ), array( 'status' => 500 ) );
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
			'description'   => $widget['description'],
			'number'        => 0,
			'rendered'      => '',
			'rendered_form' => '',
			'settings'      => array(),
		);

		// Get the widget output.
		if ( is_callable( $widget['callback'] ) && rest_is_field_included( 'rendered', $fields ) ) {
			// @note: everything up to ob_start is taken from the dynamic_sidebar function.
			$widget_parameters = array_merge(
				array(
					array_merge(
						$registered_sidebar,
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
			if ( ! empty( $widget['number'] ) ) {
				$arguments[0] = array( 'number' => $widget['number'] );
			}
			ob_start();
			call_user_func_array( $control['callback'], $arguments );
			$prepared['rendered_form'] = trim( ob_get_clean() );
		}

		$prepared = $this->filter_response_by_context( $prepared, $request['context'] );

		return new WP_REST_Response( $prepared );
	}

	/**
	 * Retrieves a widget instance.
	 *
	 * @param array  $sidebar sidebar data available at $wp_registered_sidebars.
	 * @param string $id      Identifier of the widget instance.
	 *
	 * @return array Array containing the widget instance.
	 * @since 5.7.0
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
			$sidebar,
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

	public function get_collection_params() {
		$params = array(
			'context' => $this->get_context_param( array( 'default' => 'view' ) ),
			'sidebar' => array(
				'description' => __( 'The sidebar to return widgets for.' ),
				'type'        => 'string',
			),
		);

		return $params;
	}

	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->schema;
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
					'context'     => array( 'view', 'embed' ),
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

		return $this->schema;
	}
}
