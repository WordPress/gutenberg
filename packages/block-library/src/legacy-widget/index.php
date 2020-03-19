<?php
/**
 * Server-side rendering of the `core/legacy-widget` block.
 *
 * @package WordPress
 */

/**
 * Returns the result of rendering a widget having its instance id.
 *
 * @param string $id Widget id.
 *
 * @return string Returns the rendered widget as a string.
 */
function block_core_legacy_widget_render_widget_by_id( $id ) {
	// Code extracted from src/wp-includes/widgets.php dynamic_sidebar function.
	// Todo: When merging to core extract this part of dynamic_sidebar into its own function.
	global $wp_registered_widgets;

	if ( ! isset( $wp_registered_widgets[ $id ] ) ) {
		return false;
	}
	$params = array_merge(
		array(
			array_merge(
				array(
					'before_widget' => '<div class="widget %s">',
					'after_widget'  => '</div>',
					'before_title'  => '<h2 class="widgettitle">',
					'after_title'   => '</h2>',
				),
				array(
					'widget_id'   => $id,
					'widget_name' => $wp_registered_widgets[ $id ]['name'],
				)
			),
		),
		(array) $wp_registered_widgets[ $id ]['params']
	);

	// Substitute HTML id and class attributes into before_widget.
	$classname_ = '';
	foreach ( (array) $wp_registered_widgets[ $id ]['classname'] as $cn ) {
		if ( is_string( $cn ) ) {
			$classname_ .= '_' . $cn;
		} elseif ( is_object( $cn ) ) {
			$classname_ .= '_' . get_class( $cn );
		}
	}
	$classname_                 = ltrim( $classname_, '_' );
	$params[0]['before_widget'] = sprintf( $params[0]['before_widget'], $id, $classname_ );

	$params   = apply_filters( 'dynamic_sidebar_params', $params );
	$callback = $wp_registered_widgets[ $id ]['callback'];
	do_action( 'dynamic_sidebar', $wp_registered_widgets[ $id ] );

	if ( is_callable( $callback ) ) {
		ob_start();
		call_user_func_array( $callback, $params );
		return ob_get_clean();
	}
	return false;
}

/**
 * Renders the `core/legacy-widget` block on server.
 *
 * @see WP_Widget
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_core_legacy_widget( $attributes ) {
	$id           = null;
	$widget_class = null;
	if ( isset( $attributes['id'] ) ) {
		$id = $attributes['id'];
	}
	if ( isset( $attributes['widgetClass'] ) ) {
		$widget_class = $attributes['widgetClass'];
	}

	if ( $id ) {
		return block_core_legacy_widget_render_widget_by_id( $id );
	}
	if ( ! $widget_class ) {
		return '';
	}

	ob_start();
	$instance = null;
	if ( isset( $attributes['instance'] ) ) {
		$instance = $attributes['instance'];
	}
	the_widget( $widget_class, $instance );
	return ob_get_clean();
}

/**
 * Register legacy widget block.
 */
function register_block_core_legacy_widget() {
	register_block_type(
		'core/legacy-widget',
		array(
			'attributes'      => array(
				'widgetClass' => array(
					'type' => 'string',
				),
				'id'          => array(
					'type' => 'string',
				),
				'idBase'      => array(
					'type' => 'string',
				),
				'number'      => array(
					'type' => 'number',
				),
				'instance'    => array(
					'type' => 'object',
				),
			),
			'render_callback' => 'render_block_core_legacy_widget',
		)
	);
}

add_action( 'init', 'register_block_core_legacy_widget' );
