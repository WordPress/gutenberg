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
	 * @param string $sidebar_id Indentifier of the sidebar.
	 * @return array Sidebar structure.
	 */
	public static function get_wp_registered_sidebars_sidebar( $sidebar_id ) {
		$wp_registered_sidebars = self::get_wp_registered_sidebars();
		return $wp_registered_sidebars[ $sidebar_id ];
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
		$sidebars = wp_get_sidebars_widgets();
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
		$sidebars = wp_get_sidebars_widgets();
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

		$sidebars_items = wp_get_sidebars_widgets();

		foreach ( $sidebars_items[ $sidebar_id ] as $item ) {
			$widget_class = self::get_widget_class( $item );
			$blocks[]     = array(
				'blockName' => 'core/legacy-widget',
				'attrs'     => array(
					'class'      => $widget_class,
					'identifier' => $item,
					'instance'   => self::get_sidebar_widget_instance( $sidebar, $item ),
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
}
