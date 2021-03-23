<?php
/**
 * Functions for working with widgets in WordPress. These should ultimately live
 * in wp-includes/widgets.php, wp-admin/includes/widgets.php, etc. when merged
 * to Core.
 *
 * @package gutenberg
 */

/**
 * Assigns a widget to the given sidebar.
 *
 * Belongs in wp-includes/widgets.php when merged to Core.
 *
 * @since 10.2.0
 *
 * @param string $widget_id  The widget id to assign.
 * @param string $sidebar_id The sidebar id to assign to. If empty, the widget won't be added to any sidebar.
 */
function gutenberg_assign_widget_to_sidebar( $widget_id, $sidebar_id ) {
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
 * Converts a widget ID into its id_base and number components.
 *
 * Belongs in wp-includes/widgets.php when merged to Core.
 * WP_Customize_Widgets::parse_widget_id should then be deprecated.
 *
 * @since 10.2.0
 *
 * @param string $id Widget ID.
 * @return array Array containing a widget's id_base and number components.
 */
function gutenberg_parse_widget_id( $id ) {
	$parsed = array();

	if ( preg_match( '/^(.+)-(\d+)$/', $id, $matches ) ) {
		$parsed['id_base'] = $matches[1];
		$parsed['number']  = (int) $matches[2];
	} else {
		// Likely an old single widget.
		$parsed['id_base'] = $id;
	}

	return $parsed;
}

/**
 * Calls the render callback of a widget and returns the output.
 *
 * Belongs in wp-includes/widgets.php when merged to Core. Some of the code in
 * dynamic_sidebar() and WP_Customize_Widgets should then be DRYed up.
 *
 * @since 10.2.0
 *
 * @param string $widget_id Widget ID.
 * @param string $sidebar_id Sidebar ID.
 * @return string
 */
function gutenberg_render_widget( $widget_id, $sidebar_id ) {
	global $wp_registered_widgets, $wp_registered_sidebars;

	if ( ! isset( $wp_registered_widgets[ $widget_id ] ) ) {
		return '';
	}

	if ( isset( $wp_registered_sidebars[ $sidebar_id ] ) ) {
		$sidebar = $wp_registered_sidebars[ $sidebar_id ];
	} elseif ( 'wp_inactive_widgets' === $sidebar_id ) {
		$sidebar = array();
	} else {
		return '';
	}

	$params = array_merge(
		array(
			array_merge(
				$sidebar,
				array(
					'widget_id'   => $widget_id,
					'widget_name' => $wp_registered_widgets[ $widget_id ]['name'],
				)
			),
		),
		(array) $wp_registered_widgets[ $widget_id ]['params']
	);

	// Substitute HTML `id` and `class` attributes into `before_widget`.
	$classname_ = '';
	foreach ( (array) $wp_registered_widgets[ $widget_id ]['classname'] as $cn ) {
		if ( is_string( $cn ) ) {
			$classname_ .= '_' . $cn;
		} elseif ( is_object( $cn ) ) {
			$classname_ .= '_' . get_class( $cn );
		}
	}
	$classname_                 = ltrim( $classname_, '_' );
	$params[0]['before_widget'] = sprintf( $params[0]['before_widget'], $widget_id, $classname_ );

	/** This filter is documented in wp-includes/widgets.php */
	$params = apply_filters( 'dynamic_sidebar_params', $params );

	$callback = $wp_registered_widgets[ $widget_id ]['callback'];

	ob_start();

	/** This filter is documented in wp-includes/widgets.php */
	do_action( 'dynamic_sidebar', $wp_registered_widgets[ $widget_id ] );

	if ( is_callable( $callback ) ) {
		call_user_func_array( $callback, $params );
	}

	return ob_get_clean();
}

/**
 * Calls the control callback of a widget and returns the output.
 *
 * Belongs in wp-admin/includes/widgets.php when merged to Core. Some of the
 * code in wp_widget_control() should then be DRYed up.
 *
 * @since 10.2.0
 *
 * @param string $id Widget ID.
 * @return string|null
 */
function gutenberg_render_widget_control( $id ) {
	global $wp_registered_widget_controls;

	if ( ! isset( $wp_registered_widget_controls[ $id ]['callback'] ) ) {
		return null;
	}

	$callback = $wp_registered_widget_controls[ $id ]['callback'];
	$params   = $wp_registered_widget_controls[ $id ]['params'];

	ob_start();

	if ( is_callable( $callback ) ) {
		call_user_func_array( $callback, $params );
	}

	return ob_get_clean();
}

/**
 * Returns the instance settings of the given widget. Must be a widget that
 * is registered using WP_Widget.
 *
 * Belongs in WP_Widget when merged to Core.
 *
 * @since 10.2.0
 *
 * @param string $id Widget ID.
 * @return array|null
 */
function gutenberg_get_widget_instance( $id ) {
	$parsed_id     = gutenberg_parse_widget_id( $id );
	$widget_object = gutenberg_get_widget_object( $parsed_id['id_base'] );

	if ( ! isset( $parsed_id['number'] ) || ! $widget_object ) {
		return null;
	}

	$all_instances = $widget_object->get_settings();
	return $all_instances[ $parsed_id['number'] ];
}

/**
 * Returns the registered WP_Widget object for the given widget type.
 *
 * Belongs in WP_Widget_Factory when merged to Core.
 *
 * @since 10.2.0
 *
 * @param string $id_base Widget type ID.
 * @return WP_Widget|null
 */
function gutenberg_get_widget_object( $id_base ) {
	global $wp_widget_factory;

	foreach ( $wp_widget_factory->widgets as $widget_object ) {
		if ( $widget_object->id_base === $id_base ) {
			return $widget_object;
		}
	}

	return null;
}
