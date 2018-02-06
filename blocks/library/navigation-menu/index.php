<?php
/**
 * Server-side rendering of the `core/navigation-menu` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/navigation-menu` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the post content with navigtion menu added.
 */
function gutenberg_render_block_core_navigation_menu( $attributes ) {
	// get menu.
	$class = "wp-block-navigation-menu align{$attributes['align']}";
	if ( isset( $attributes['layout'] ) && 'horizontal' === $attributes['layout'] ) {
		$class .= ' is-horizontal';
	}

	$block_content = sprintf(
		'<ul class="%1$s">%2$s</ul>',
		esc_attr( $class ),
		''
	);

	return $block_content;
}

register_block_type( 'core/navigation-menu', array(
	'attributes'      => array(
		'selected'        => array(
			'type' => 'string',
		),
		'layout'          => array(
			'type'    => 'string',
			'default' => 'vertical',
		),
		'align'           => array(
			'type'    => 'string',
			'default' => 'center',
		),
	),
	'render_callback' => 'gutenberg_render_block_core_navigation_menu',
) );
