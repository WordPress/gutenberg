<?php

/**
 * Renders the `core/home-link` block.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with the home url added.
 */
function render_block_core_home( $attributes ) {
	if ( empty( $attributes['label'] ) ) {
		return '';
	}

	$classnames = array();
	if ( ! empty( $attributes['className'] ) ) {
		$classnames[] = $attributes['className'];
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classnames ) ) );

	$label = wp_kses(
		$attributes['label'],
		array(
			'code'   => array(),
			'em'     => array(),
			'img'    => array(
				'scale' => array(),
				'class' => array(),
				'style' => array(),
				'src'   => array(),
				'alt'   => array(),
			),
			's'      => array(),
			'span'   => array(
				'style' => array(),
			),
			'strong' => array(),
		)
	);

	$html = sprintf( '<li %s><a classname="wp-block-home__content" href="%s">%s</a></li>', $wrapper_attributes, home_url(), $label );

	return $html;
}

/**
 * Register the home block
 *
 * @uses render_block_core_home()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_core_home() {
	register_block_type_from_metadata(
		__DIR__ . '/home-link',
		array(
			'render_callback' => 'render_block_core_home',
		)
	);
}
add_action( 'init', 'register_block_core_home' );
