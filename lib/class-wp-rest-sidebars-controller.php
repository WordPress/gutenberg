<?php
/**
 * An extension for the WP REST API that exposes endpoints for sidebars and widgets.
 *
 * PHP version 5.4.0
 *
 * Copyright (C) 2015  Martin Pettersson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author    Martin Pettersson <martin_pettersson@outlook.com>
 * @copyright 2015 Martin Pettersson
 * @license   GPLv2
 * @link      https://github.com/martin-pettersson/wp-rest-api-sidebars
 * @package   gutenberg
 */

/**
 * Class Sidebars_Controller
 *
 * @package WP_API_Sidebars\Controllers
 */
class WP_REST_Sidebars_Controller extends WP_REST_Controller {

	/**
	 * Plugins controller constructor.
	 *
	 * @since 5.5.0
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'sidebars';
	}

	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		// Lists all sidebars.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'  => WP_REST_Server::READABLE,
					'callback' => array( $this, 'get_items' ),
				),
			)
		);

		// Lists/updates a single sidebar based on the given id.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\w-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'id' => array(
							'description'       => __( 'The id of a registered sidebar', 'gutenberg' ),
							'type'              => 'string',
							'validate_callback' => function ( $id ) {
								return ! is_null( self::get_sidebar( $id ) );
							},
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'id'      => array(
							'description'       => __( 'The id of a registered sidebar', 'gutenberg' ),
							'type'              => 'string',
							'validate_callback' => function ( $id ) {
								return ! is_null( self::get_sidebar( $id ) );
							},
						),
						'widgets' => array(
							'description' => __( 'The list of widgets to save', 'gutenberg' ),
							'type'        => 'array',
						),
					),
				),
			)
		);
	}

	/**
	 * Checks if the user has permissions to make the request.
	 *
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 * @since 5.6.0
	 * @access public
	 */
	public function permissions_check() {
		// Verify if the current user has edit_theme_options capability.
		// This capability is required to access the widgets screen.
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
	 * Updates the sidebar.
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response
	 * @global array $wp_registered_widget_updates
	 */
	public function update_item( $request ) {
		global $wp_registered_widget_updates;
		$sidebar_id    = $request['id'];
		$input_widgets = $request['widgets'];

		$numbers = array();
		foreach ( $wp_registered_widget_updates as $id_base => $control ) {
			$numbers[ $id_base ] = $control['callback'][0]->number + 1;
		}

		$created_widgets = array();

		// Create and update widgets.
		$sidebar_widgets_ids = array();
		foreach ( $input_widgets as $input_widget ) {
			if ( ! isset( $wp_registered_widget_updates[ $input_widget['id_base'] ] ) ) {
				continue;
			}
			$update_control = $wp_registered_widget_updates[ $input_widget['id_base'] ];
			if ( ! isset( $input_widget['id'] ) ) {
				$number = $numbers[ $input_widget['id_base'] ] ++;
				$id     = $input_widget['id_base'] . '-' . $number;

				$input_widget['id']     = $id;
				$input_widget['number'] = $number;
				$created_widgets[]      = array(
					'id'      => $id,
					'number'  => $number,
					'id_base' => $input_widget['id_base'],
				);
			}

			$field  = 'widget-' . $input_widget['id_base'];
			$number = $input_widget['number'];
			$_POST  = $input_widget;

			$_POST[ $field ][ $number ] = wp_slash( $input_widget['settings'] );
			call_user_func_array( $update_control['callback'], array() );
			$update_control['callback'][0]->updated = false;

			$sidebar_widgets_ids[] = $input_widget['id'];
		}

		// Update sidebar to only have the widgets we just processed.
		$sidebars                = wp_get_sidebars_widgets();
		$sidebars[ $sidebar_id ] = $sidebar_widgets_ids;
		wp_set_sidebars_widgets( $sidebars );

		$request = new WP_REST_Request( 'GET' );
		$request->set_param( 'id', $sidebar_id );

		return $this->get_item( $request );
	}

	/**
	 * Returns a list of sidebars (active or inactive)
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response
	 * @global array $wp_registered_sidebars
	 */
	public function get_items( $request ) {
		global $wp_registered_sidebars;
		$fields = $this->get_fields_for_response( $request );

		$data = array();
		foreach ( (array) wp_get_sidebars_widgets() as $id => $widgets ) {
			$sidebar = compact( 'id', 'widgets' );

			if ( isset( $wp_registered_sidebars[ $id ] ) ) {
				$registered_sidebar = $wp_registered_sidebars[ $id ];

				$sidebar['status']      = 'active';
				$sidebar['name']        = $registered_sidebar['name'];
				$sidebar['description'] = $registered_sidebar['description'];
			} else {
				$sidebar['status'] = 'inactive';
			}

			if ( rest_is_field_included( 'widgets', $fields ) ) {
				$sidebar['widgets'] = self::get_widgets( $sidebar['id'] );
			}

			$data[] = $this->prepare_item_for_response( $sidebar, $request )->get_data();
		}

		return rest_ensure_response( $data );
	}

	/**
	 * Returns the given sidebar
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response
	 */
	public function get_item( $request ) {
		$fields  = $this->get_fields_for_response( $request );
		$sidebar = self::get_sidebar( $request['id'] );

		if ( rest_is_field_included( 'widgets', $fields ) ) {
			$sidebar['widgets'] = self::get_widgets( $sidebar['id'] );
		}

		return $this->prepare_item_for_response( $sidebar, $request );
	}

	/**
	 * Returns a sidebar for the given id or null if not found
	 *
	 * Note: The id can be either an index, the id or the name of a sidebar
	 *
	 * @param string|int $id ID of the sidebar.
	 *
	 * @return array|null
	 * @global array $wp_registered_sidebars
	 */
	public static function get_sidebar( $id ) {
		global $wp_registered_sidebars;

		if ( is_int( $id ) ) {
			$id = 'sidebar-' . $id;
		} else {
			$id = sanitize_title( $id );

			foreach ( (array) $wp_registered_sidebars as $key => $sidebar ) {
				if ( sanitize_title( $sidebar['name'] ) === $id ) {
					return $sidebar;
				}
			}
		}

		foreach ( (array) $wp_registered_sidebars as $key => $sidebar ) {
			if ( $key === $id ) {
				return $sidebar;
			}
		}

		return null;
	}

	/**
	 * Returns a list of widgets for the given sidebar id
	 *
	 * @param string $sidebar_id ID of the sidebar.
	 *
	 * @return array
	 * @global array $wp_registered_widgets
	 * @global array $wp_registered_sidebars
	 */
	public static function get_widgets( $sidebar_id ) {
		global $wp_registered_widgets, $wp_registered_sidebars;

		$widgets          = array();
		$sidebars_widgets = (array) wp_get_sidebars_widgets();

		if ( isset( $wp_registered_sidebars[ $sidebar_id ] ) && isset( $sidebars_widgets[ $sidebar_id ] ) ) {
			foreach ( $sidebars_widgets[ $sidebar_id ] as $widget_id ) {
				// Just to be sure.
				if ( isset( $wp_registered_widgets[ $widget_id ] ) ) {
					$widget = $wp_registered_widgets[ $widget_id ];

					// Get the widget output.
					if ( is_callable( $widget['callback'] ) ) {
						// @note: everything up to ob_start is taken from the dynamic_sidebar function.
						$widget_parameters = array_merge(
							array(
								array_merge(
									$wp_registered_sidebars[ $sidebar_id ],
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
						$classname                             = ltrim( $classname, '_' );
						$widget_parameters[0]['before_widget'] = sprintf( $widget_parameters[0]['before_widget'], $widget_id, $classname );

						ob_start();

						call_user_func_array( $widget['callback'], $widget_parameters );

						$widget['rendered'] = ob_get_clean();
					}

					if ( isset( $widget['callback'][0] ) ) {
						$instance               = $widget['callback'][0];
						$widget['widget_class'] = get_class( $instance );
						$widget['settings']     = static::get_sidebar_widget_instance(
							$wp_registered_sidebars[ $sidebar_id ],
							$widget_id
						);
						$widget['number']       = (int) $widget['params'][0]['number'];
						$widget['id_base']      = $instance->id_base;
					}

					unset( $widget['params'] );
					unset( $widget['callback'] );

					$widgets[] = $widget;
				}
			}
		}

		return $widgets;
	}

	/**
	 * Prepare a single sidebar output for response
	 *
	 * @param array           $sidebar Sidebar instance.
	 * @param WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response $data
	 */
	public function prepare_item_for_response( $sidebar, $request ) {
		$schema = $this->get_item_schema();
		$data   = array();
		foreach ( $schema['properties'] as $property_id => $property ) {
			if ( isset( $sidebar[ $property_id ] ) && gettype( $sidebar[ $property_id ] ) === $property['type'] ) {
				$data[ $property_id ] = $sidebar[ $property_id ];
			} elseif ( isset( $property['default'] ) ) {
				$data[ $property_id ] = $property['default'];
			}
		}

		foreach ( $sidebar['widgets'] as $widget_id => $widget ) {
			$widget_data = array();
			foreach ( $schema['properties']['widgets']['items'] as $property_id => $property ) {
				if ( isset( $widget[ $property_id ] ) && gettype( $widget[ $property_id ] ) === $property['type'] ) {
					$widget_data[ $property_id ] = $widget[ $property_id ];
				} elseif ( 'settings' === $property_id && 'array' === gettype( $widget[ $property_id ] ) ) {
					$widget_data[ $property_id ] = $widget['settings'];
				} elseif ( isset( $property['default'] ) ) {
					$widget_data[ $property_id ] = $property['default'];
				}
			}
			$data['widgets'][ $widget_id ] = $widget_data;
		}

		$response = rest_ensure_response( $data );

		/**
		 * Filters a sidebar location returned from the REST API.
		 *
		 * Allows modification of the menu location data right before it is
		 * returned.
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param object           $sidebar The original status object.
		 * @param WP_REST_Request  $request  Request used to generate the response.
		 */
		return apply_filters( 'rest_prepare_menu_location', $response, $sidebar, $request );
	}

	/**
	 * Retrieves the block type' schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'sidebar',
			'type'       => 'object',
			'properties' => array(
				'id'          => array(
					'description' => __( 'ID of sidebar.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'name'        => array(
					'description' => __( 'Unique name identifying the sidebar.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'description' => array(
					'description' => __( 'Description of sidebar.', 'gutenberg' ),
					'type'        => 'string',
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'status'      => array(
					'description' => __( 'Status of sidebar.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array( 'active', 'inactive' ),
					'default'     => '',
					'context'     => array( 'embed', 'view', 'edit' ),
					'readonly'    => true,
				),
				'widgets'     => array(
					'description' => __( 'Nested widgets.', 'gutenberg' ),
					'type'        => 'array',
					'items'       => array(
						'id'           => array(
							'description' => __( 'Unique identifier for the widget.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'id_base'      => array(
							'description' => __( 'Type of widget for the object.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'widget_class' => array(
							'description' => __( 'Class name of the widget implementation.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'name'         => array(
							'description' => __( 'Name of the widget.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'description'  => array(
							'description' => __( 'Description of the widget.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'number'       => array(
							'description' => __( 'Number of the widget.', 'gutenberg' ),
							'type'        => 'integer',
							'context'     => array( 'view', 'edit', 'embed' ),
						),
						'rendered'     => array(
							'description' => __( 'HTML representation of the widget.', 'gutenberg' ),
							'type'        => 'string',
							'context'     => array( 'view', 'edit', 'embed' ),
							'readonly'    => true,
						),
						'settings'     => array(
							'description' => __( 'Settings of the widget.', 'gutenberg' ),
							'type'        => 'object',
							'context'     => array( 'view', 'edit', 'embed' ),
							'default'     => array(),
						),
					),
					'default'     => array(),
					'context'     => array( 'embed', 'view', 'edit' ),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves a widget instance.
	 *
	 * @since 5.7.0
	 *
	 * @param array  $sidebar sidebar data available at $wp_registered_sidebars.
	 * @param string $id Identifier of the widget instance.
	 * @return array Array containing the widget instance.
	 */
	public static function get_sidebar_widget_instance( $sidebar, $id ) {
		list( $object, $number, $name ) = static::get_widget_info( $id );
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

		/**
		 * Filters the settings for a particular widget instance.
		 *
		 * Returning false will effectively short-circuit display of the widget.
		 *
		 * @since 2.8.0
		 *
		 * @param array     $instance The current widget instance's settings.
		 * @param WP_Widget $this     The current widget instance.
		 * @param array     $args     An array of default widget arguments.
		 */
		$instance = apply_filters( 'widget_display_callback', $instance, $object, $args );

		if ( false === $instance ) {
			return array();
		}

		return $instance;
	}

	/**
	 * Given a widget id returns an array containing information about the widget.
	 *
	 * @since 5.7.0
	 *
	 * @param string $widget_id Identifier of the widget.
	 * @return array Array containing the the widget object, the number, and the name.
	 */
	private static function get_widget_info( $widget_id ) {
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

}
