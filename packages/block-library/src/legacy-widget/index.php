<?php
/**
 * Server-side rendering of the `core/legacy-widget` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/legacy-widget` block on server.
 *
 * @see WP_Widget
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_legacy_widget( $attributes ) {
	if ( ! isset( $attributes['identifier'] ) ) {
		return '';
	}
	$identifier = $attributes['identifier'];
	if (
		isset( $attributes['isCallbackWidget'] ) &&
		$attributes['isCallbackWidget']
	) {
		global $wp_registered_widgets;
		if ( ! isset( $wp_registered_widgets[ $identifier ] ) ) {
			return '';
		}
		$widget = $wp_registered_widgets[ $identifier ];
		$params = array_merge(
			array(
				'widget_id'   => $identifier,
				'widget_name' => $widget['name'],
			),
			(array) $wp_registered_widgets[ $identifier ]['params']
		);
		$params = apply_filters( 'dynamic_sidebar_params', $params );

		$callback = $widget['callback'];

		if ( is_callable( $callback ) ) {
			ob_start();
			call_user_func_array( $callback, $params );
			return ob_get_clean();
		}
		return '';
	}
	ob_start();
	the_widget( $identifier, $attributes['instance'] );
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
				'identifier'       => array(
					'type' => 'string',
				),
				'instance'         => array(
					'type' => 'object',
				),
				'isCallbackWidget' => array(
					'type' => 'boolean',
				),
			),
			'render_callback' => 'render_block_legacy_widget',
		)
	);
}

add_action( 'init', 'register_block_core_legacy_widget' );
