<?php
/**
 * Server-side rendering of the `core/icon` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/icon` block on server.
 *
 * @since 7.0.0
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the Icon.
 */
function render_block_core_icon( $attributes ) {
	if ( empty( $attributes['icon'] ) ) {
		return;
	}

	$svg = wp_get_icon(
		$attributes['icon'],
		array(
			// Width is applied via the dimensions block support on the wrapper.
			'size'  => null,
			'label' => $attributes['ariaLabel'] ?? '',
		)
	);

	if ( '' === $svg ) {
		return;
	}

	$processor = new WP_HTML_Tag_Processor( $svg );
	if ( $processor->next_tag( 'svg' ) ) {
		// Apply flip classes to the SVG.
		$flip_horizontal = $attributes['flipHorizontal'] ?? false;
		$flip_vertical   = $attributes['flipVertical'] ?? false;

		if ( $flip_horizontal ) {
			$processor->add_class( 'is-flip-horizontal' );
		}
		if ( $flip_vertical ) {
			$processor->add_class( 'is-flip-vertical' );
		}

		$rotation = isset( $attributes['rotation'] ) ? (int) $attributes['rotation'] : 0;

		if ( $rotation ) {
			$current_style = $processor->get_attribute( 'style' ) ?? '';
			$rotation_css  = 'rotate: ' . $rotation . 'deg;';
			if ( $current_style ) {
				$processor->set_attribute( 'style', $current_style . ' ' . $rotation_css );
			} else {
				$processor->set_attribute( 'style', $rotation_css );
			}
		}

		$svg = $processor->get_updated_html();
	}

	$wrapper_attributes = get_block_wrapper_attributes();
	return sprintf( '<div %s>%s</div>', $wrapper_attributes, $svg );
}


/**
 * Registers the `core/icon` block on server.
 *
 * @since 7.0.0
 */
function register_block_core_icon() {
	register_block_type_from_metadata(
		__DIR__ . '/icon',
		array(
			'render_callback' => 'render_block_core_icon',
		)
	);
}
add_action( 'init', 'register_block_core_icon' );
