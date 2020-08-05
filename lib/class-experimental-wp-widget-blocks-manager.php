<?php
/**
 * Start: Include for phase 2
 *
 * @package gutenberg
 * @since 5.7.0
 */

/**
 * Class that provides a set of static abstractions to deal with widgets.
 * Intended to be used by WP_REST_Widget_Areas_Controller.
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
	 * Given a widget id returns the name of the class the represents the widget.
	 *
	 * @since 5.7.0
	 *
	 * @param string $widget_id Identifier of the widget.
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
	 * @param string $id Identifier of the widget instance.
	 * @return array Array containing the widget instance.
	 */
	public static function get_sidebar_widget_instance( $sidebar, $id ) {
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
	 * @param string $widget_id Identifier of the widget.
	 * @return array Array containing the the widget object, the number, and the name.
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

}
