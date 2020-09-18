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
 *
 */
function render_block_core_legacy_widget( $attributes ) {
	if ( isset( $attributes['widgetId'] ) ) {
		return 'Rendering legacy widget block using a widget ID is unsupported';
	}
	if ( ! isset( $attributes['widgetClass'] ) ) {
		return '';
	}

	$instance = null;
	if ( isset( $attributes['instance'] ) ) {
		$instance = $attributes['instance'];
	}

	global $wp_widget_factory;
	$widget_id = '0';
	$widget_obj = $wp_widget_factory->widgets[ $attributes['widgetClass'] ];
	return render_single_widget(
		'sidebar-1',
		$widget_id,
		array_merge(
			array(
				'classname' => '',
			),
			$widget_obj->widget_options,
			array(
				'instance' => $instance,
			)
		),
		function ( $params ) use ( $widget_obj, $instance ) {
			$widget_obj->_set( - 1 );
			$widget_obj->widget( $params, $instance );
		},
		array(
			'widget_id'   => $widget_id,
			'widget_name' => $widget_obj->name,
		)
	);
}

add_action( 'init', 'register_block_core_legacy_widget' );


function render_single_widget( $sidebar_id, $widget_id, $widget_params, $callback, $sidebar_params ) {
	global $wp_registered_sidebars;

	$index = $sidebar_id;

	/** This filter is documented in wp-includes/widgets/widgets.php */
	do_action( 'dynamic_sidebar_before', $index, true );
	$sidebar = $wp_registered_sidebars[ $index ];

	$params = array_merge(
		array(
			array_merge(
				$sidebar,
				$sidebar_params
			),
		),
		$widget_params
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

	if ( is_callable( $callback ) ) {
		ob_start();
		call_user_func_array( $callback, $params );
		return ob_get_clean();
	}
}
