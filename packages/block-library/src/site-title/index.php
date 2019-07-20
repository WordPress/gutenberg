<?php
/**
 * Server-side rendering of the `core/site-title` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/site-title` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns a rendering of the the site title.
 */
function render_block_core_site_title( $attributes ) {
	$classes = '';
	$style_fragment = '';
	if ( array_key_exists( 'textColor', $attributes ) ) {
		$classes = sprintf( 'has-text-color has-%s-color', $attributes[ 'textColor' ] );
	} elseif ( array_key_exists( 'customTextColor', $attributes ) ) {
		$classes = 'has-text-color';
		$style_fragment = sprintf(
			' style="color:%s;"',
			$attributes[ 'customTextColor' ]
		);
	}
	return sprintf( '<h1 class="%s"%s>%s</h1>', $classes, $style_fragment, get_bloginfo( 'name' ) );
}

/**
 * Registers the `core/site-title` block on server.
 */
function register_block_core_site_title() {
	register_block_type(
		'core/site-title',
		array(
			'attributes'      => array(
				'textColor'   => array(
					'type'    => 'string',
				),
				'customTextColor' => array(
					'type'    => 'string',
				),
			),
			'render_callback' => 'render_block_core_site_title',
		)
	);
}
add_action( 'init', 'register_block_core_site_title' );
