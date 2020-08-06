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

		// Lists a single sidebar based on the given id.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\w-]+)',
			array(
				array(
					'methods'  => WP_REST_Server::READABLE,
					'callback' => array( $this, 'get_item' ),
					'args'     => array(
						'id' => array(
							'description'       => __( 'The id of a registered sidebar', 'gutenberg' ),
							'type'              => 'string',
							'validate_callback' => function ( $id ) {
								return ! is_null( self::get_sidebar( $id ) );
							},
						),
					),
				),
			)
		);

		// Update a single sidebar based on the given id.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\w-]+)',
			array(
				array(
					'methods'  => WP_REST_Server::EDITABLE,
					'callback' => array( $this, 'update_item' ),
					'args'     => array(
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
	 * Upodates af sidebars.
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response
	 * @global array $wp_registered_widget_updates
	 */
	public function update_item( $request ) {
		global $wp_registered_widget_updates;
		$sidebar_id    = $request->get_param( 'id' );
		$input_widgets = $request->get_param( 'widgets' );

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

			$_POST = $input_widget;

			$_POST[ 'widget-' . $input_widget['id_base'] ][ $input_widget['number'] ] = $input_widget['settings'];
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

		$sidebars = array();

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

			if ( 1 || $request->has_param( 'with-widgets' ) ) {
				$sidebar['widgets'] = self::get_widgets( $sidebar['id'] );
			}

			$sidebars[] = $sidebar;
		}

		return new WP_REST_Response( $sidebars, 200 );
	}

	/**
	 * Returns the given sidebar
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response
	 */
	public function get_item( $request ) {
		$sidebar = self::get_sidebar( $request->get_param( 'id' ) );

		$sidebar['widgets'] = self::get_widgets( $sidebar['id'] );

		ob_start();
		dynamic_sidebar( $request->get_param( 'id' ) );
		$sidebar['rendered'] = ob_get_clean();

		return new WP_REST_Response( $sidebar, 200 );
	}

	/**
	 * Returns a sidebar for the given id or null if not found
	 *
	 * Note: The id can be either an index, the id or the name of a sidebar
	 *
	 * @param string $id ID of the sidebar.
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
						$widget['settings']     = \Experimental_WP_Widget_Blocks_Manager::get_sidebar_widget_instance(
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

}

