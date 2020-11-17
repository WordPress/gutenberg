<?php
/**
 * Server-side rendering of the `core/legacy-widget` block.
 *
 * @package WordPress
 */

/**
 * Register legacy widget block.
 */
function register_block_core_legacy_widget() {
	register_block_type_from_metadata(
		__DIR__ . '/legacy-widget',
		array(
			'render_callback' => 'render_block_core_legacy_widget',
		)
	);
}

/**
 * Renders the `core/legacy-widget` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with the legacy widget added.
 * @see WP_Widget
 */
function render_block_core_legacy_widget( $attributes ) {
	global $wp_widget_factory, $wp_registered_sidebars;

	if ( isset( $attributes['widgetId'] ) ) {
		return __( 'Rendering legacy widget block using widgetId is unsupported.', 'gutenberg' );
	}
	$widget_id = - 1;

	if ( ! isset( $attributes['sidebarId'] ) || ! isset( $wp_registered_sidebars[ $attributes['sidebarId'] ] ) ) {
		return '';
	}
	$sidebar_id = $attributes['sidebarId'];

	if ( ! isset( $attributes['widgetClass'] ) || ! isset( $wp_widget_factory->widgets[ $attributes['widgetClass'] ] ) ) {
		return '';
	}
	$widget_class = $attributes['widgetClass'];
	$widget_obj   = $wp_widget_factory->widgets[ $widget_class ];

	$instance = isset( $attributes['instance'] ) ? $attributes['instance'] : null;

	$widget_params = array_merge(
		array(
			'classname' => array(),
		),
		$widget_obj->widget_options
	);

	/** This filter is documented in wp-includes/widgets/widgets.php */
	do_action( 'dynamic_sidebar_before', $sidebar_id, true );
	$sidebar = $wp_registered_sidebars[ $sidebar_id ];

	$params = array_merge(
		array(
			array_merge(
				$sidebar,
				array(
					'widget_id'   => $widget_id,
					'widget_name' => $widget_obj->name,
				)
			),
		),
		array(
			$instance,
		)
	);

	// Substitute HTML `id` and `class` attributes into `before_widget`.
	$classname_ = '';
	foreach ( (array) $widget_params['classname'] as $cn ) {
		if ( is_string( $cn ) ) {
			$classname_ .= '_' . $cn;
		} elseif ( is_object( $cn ) ) {
			$classname_ .= '_' . get_class( $cn );
		}
	}
	$classname_                 = ltrim( $classname_, '_' );
	$params[0]['before_widget'] = sprintf( $params[0]['before_widget'], $widget_id, $classname_ );

	/** This filter is documented in wp-includes/widgets/widgets.php */
	$params = apply_filters( 'dynamic_sidebar_params', $params );

	/** This filter is documented in wp-includes/widgets/widgets.php */
	do_action( 'dynamic_sidebar', $widget_params );

	ob_start();
	$widget_obj->_set( - 1 );
	call_user_func_array( array( $widget_obj, 'widget' ), $params );

	return ob_get_clean();
}

add_action( 'init', 'register_block_core_legacy_widget' );
