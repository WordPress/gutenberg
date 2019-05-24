<?php
/**
 * Start: Include for phase 2
 *
 * @package gutenberg
 * @since 5.7.0
 */

/**
 * Class that provides a set of static abstractions to deal with widgets.
 * Itended to be used by WP_REST_Widget_Areas_Controller.
 *
 * @since 5.7.0
 */
class Experimental_WP_Widget_Blocks_Manager {

	/**
	 * Array of sidebar_widgets as it was before the filter swap_out_sidebars_blocks_for_block_widgets was ever executed.
	 *
	 * @var array
	 */
	private static $unfiltered_sidebar_widgets = null;

	/**
	 * Returns the $wp_registered_widgets global.
	 *
	 * @since 5.7.0
	 *
	 * @return array $wp_registered_widgets global.
	 */
	private static function get_wp_registered_widgets() {
		global $wp_registered_widgets;
		return $wp_registered_widgets;
	}

	/**
	 * Returns the $wp_registered_sidebars global.
	 *
	 * @since 5.7.0
	 *
	 * @return array $wp_registered_sidebars global.
	 */
	private static function get_wp_registered_sidebars() {
		global $wp_registered_sidebars;
		return $wp_registered_sidebars;
	}

	/**
	 * Given a sidebar_id returns the sidebar object in $wp_registered_sidebars for tha sidebar_id.
	 *
	 * @since 5.7.0
	 *
	 * @param string $sidebar_id Identifier of the sidebar.
	 * @return array Sidebar structure.
	 */
	public static function get_wp_registered_sidebars_sidebar( $sidebar_id ) {
		$wp_registered_sidebars = self::get_wp_registered_sidebars();
		return $wp_registered_sidebars[ $sidebar_id ];
	}

	/**
	 * Returns the result of wp_get_sidebars_widgets without swap_out_sidebars_blocks_for_block_widgets filter being applied.
	 *
	 * @since 5.7.0
	 */
	private static function get_raw_sidebar_widgets() {
		return self::$unfiltered_sidebar_widgets;
	}

	/**
	 * Returns a post id being referenced in a sidebar area.
	 *
	 * @since 5.7.0
	 *
	 * @param string $sidebar_id Indentifier of the sidebar.
	 * @return integer Post id.
	 */
	public static function get_post_id_referenced_in_sidebar( $sidebar_id ) {
		$sidebars = self::get_raw_sidebar_widgets();
		$sidebar  = $sidebars[ $sidebar_id ];
		return is_numeric( $sidebar ) ? $sidebar : 0;
	}

	/**
	 * Updates a sidebar structure to reference a $post_id, and makes the widgets being referenced inactive.
	 *
	 * @since 5.7.0
	 *
	 * @param string  $sidebar_id Indentifier of the sidebar.
	 * @param integer $post_id    Post id.
	 */
	public static function reference_post_id_in_sidebar( $sidebar_id, $post_id ) {
		$sidebars = self::get_raw_sidebar_widgets();
		$sidebar  = $sidebars[ $sidebar_id ];
		wp_set_sidebars_widgets(
			array_merge(
				$sidebars,
				array(
					$sidebar_id           => $post_id,
					'wp_inactive_widgets' => array_merge(
						$sidebars['wp_inactive_widgets'],
						$sidebar
					),
				)
			)
		);
	}

	/**
	 * Returns a sidebar as an array of legacy widget blocks.
	 *
	 * @since 5.7.0
	 *
	 * @param string $sidebar_id Indentifier of the sidebar.
	 * @return array $post_id    Post id.
	 */
	public static function get_sidebar_as_blocks( $sidebar_id ) {
		$blocks = array();

		$sidebars_items         = self::get_raw_sidebar_widgets();
		$wp_registered_sidebars = self::get_wp_registered_sidebars();

		foreach ( $sidebars_items[ $sidebar_id ] as $item ) {
			$widget_class = self::get_widget_class( $item );
			$blocks[]     = array(
				'blockName' => 'core/legacy-widget',
				'attrs'     => array(
					'class'      => $widget_class,
					'identifier' => $item,
					'instance'   => self::get_sidebar_widget_instance( $wp_registered_sidebars[ $sidebar_id ], $item ),
				),
				'innerHTML' => '',
			);
		}
		return $blocks;
	}

	/**
	 * Verifies if a sidabar id is valid or not.
	 *
	 * @since 5.7.0
	 *
	 * @param string $sidebar_id Indentifier of the sidebar.
	 * @return boolean True if the $sidebar_id value is valid and false otherwise.
	 */
	public static function is_valid_sidabar_id( $sidebar_id ) {
		$wp_registered_sidebars = self::get_wp_registered_sidebars();
		return isset( $wp_registered_sidebars[ $sidebar_id ] );
	}


	/**
	 * Given a widget id returns the name of the class the represents the widget.
	 *
	 * @since 5.7.0
	 *
	 * @param string $widget_id Indentifier of the widget.
	 * @return string|null Name of the class that represents the widget or null if the widget is not represented by a class.
	 */
	private static function get_widget_class( $widget_id ) {
		$wp_registered_widgets = self::get_wp_registered_widgets();
		if (
			isset( $wp_registered_widgets[ $widget_id ]['callback'][0] ) &&
			$wp_registered_widgets[ $widget_id ]['callback'][0] instanceof WP_Widget
		) {
			return get_class( $wp_registered_widgets[ $widget_id ]['callback'][0] );
		}
		return null;
	}

	/**
	 * Retrieves a widget instance.
	 *
	 * @since 5.7.0
	 *
	 * @param array  $sidebar sidebar data available at $wp_registered_sidebars.
	 * @param string $id Idenfitier of the widget instance.
	 * @return array Array containing the widget instance.
	 */
	private static function get_sidebar_widget_instance( $sidebar, $id ) {
		list( $object, $number, $name ) = self::get_widget_info( $id );
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
	 * @param string $widget_id Indentifier of the widget.
	 * @return array Array containing the the wiget object, the number, and the name.
	 */
	private static function get_widget_info( $widget_id ) {
		$wp_registered_widgets = self::get_wp_registered_widgets();

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

	/**
	 * Serializes an array of blocks.
	 *
	 * @since 5.7.0
	 *
	 * @param array $blocks Post Array of block objects.
	 * @return string String representing the blocks.
	 */
	public static function serialize_blocks( $blocks ) {
		return implode( array_map( 'self::serialize_block', $blocks ) );
	}

	/**
	 * Serializes a block.
	 *
	 * @since 5.7.0
	 *
	 * @param array $block Block object.
	 * @return string String representing the block.
	 */
	public static function serialize_block( $block ) {
		if ( ! isset( $block['blockName'] ) ) {
			return false;
		}
		$name = $block['blockName'];
		if ( 0 === strpos( $name, 'core/' ) ) {
			$name = substr( $name, strlen( 'core/' ) );
		}

		if ( empty( $block['attrs'] ) ) {
			$opening_tag_suffix = '';
		} else {
			$opening_tag_suffix = ' ' . json_encode( $block['attrs'] );
		}

		if ( empty( $block['innerHTML'] ) ) {
			return sprintf(
				'<!-- wp:%s%s /-->',
				$name,
				$opening_tag_suffix
			);
		} else {
			return sprintf(
				'<!-- wp:%1$s%2$s -->%3$s<!-- /wp:%1$s -->',
				$name,
				$opening_tag_suffix,
				$block['innerHTML']
			);
		}
	}

	/**
	 * Outputs a block widget on the website frontend.
	 *
	 * @param array $options   Widget options.
	 * @param array $arguments Arguments array.
	 */
	public static function output_blocks_widget( $options, $arguments ) {
		echo $options['before_widget'];
		foreach ( $arguments['blocks'] as $block ) {
			echo render_block( $block );
		}
		echo $options['after_widget'];
	}

	/**
	 * Registers of a widget that should represent a set of blocks and returns its id.
	 *
	 * @param array $blocks   Array of blocks.
	 */
	public static function convert_blocks_to_widget( $blocks ) {
		$widget_id = 'blocks-widget-' . md5( Experimental_WP_Widget_Blocks_Manager::serialize_block( $blocks ) );
		global $wp_registered_widgets;
		if ( isset( $wp_registered_widgets[ $widget_id ] ) ) {
			return $widget_id;
		}
		wp_register_sidebar_widget(
			$widget_id,
			__( 'Blocks Area ', 'gutenberg' ),
			'Experimental_WP_Widget_Blocks_Manager::output_blocks_widget',
			array(
				'classname'   => 'widget-area',
				'description' => __( 'Displays a set of blocks', 'gutenberg' ),
			),
			array(
				'blocks' => $blocks,
			)
		);
		return $widget_id;
	}

	/**
	 * Filters the $sidebars_widgets to exchange wp_area post id with a widget that renders that block area.
	 *
	 * @param array $sidebars_widgets_input An associative array of sidebars and their widgets.
	 */
	public static function swap_out_sidebars_blocks_for_block_widgets( $sidebars_widgets_input ) {
		global $sidebars_widgets;
		if ( null === self::$unfiltered_sidebar_widgets ) {
			self::$unfiltered_sidebar_widgets = $sidebars_widgets;
		}
		$filtered_sidebar_widgets = array();
		foreach ( $sidebars_widgets_input as $sidebar_id => $item ) {
			if ( ! is_numeric( $item ) ) {
				$filtered_sidebar_widgets[ $sidebar_id ] = $item;
				continue;
			}

			$filtered_widgets   = array();
			$last_set_of_blocks = array();
			$post               = get_post( $item );
			$blocks             = parse_blocks( $post->post_content );

			foreach ( $blocks as $block ) {
				if ( ! isset( $block['blockName'] ) ) {
					continue;
				}
				if (
					'core/legacy-widget' === $block['blockName'] &&
					isset( $block['attrs']['identifier'] )
				) {
					if ( ! empty( $last_set_of_blocks ) ) {
						$filtered_widgets[] = self::convert_blocks_to_widget( $last_set_of_blocks );
						$last_set_of_blocks = array();
					}
					$filtered_widgets[] = $block['attrs']['identifier'];
				} else {
					$last_set_of_blocks[] = $block;
				}
			}
			if ( ! empty( $last_set_of_blocks ) ) {
				$filtered_widgets[] = self::convert_blocks_to_widget( $last_set_of_blocks );
			}

			$filtered_sidebar_widgets[ $sidebar_id ] = $filtered_widgets;
		}
		$sidebars_widgets = $filtered_sidebar_widgets;
		return $filtered_sidebar_widgets;
	}
}
