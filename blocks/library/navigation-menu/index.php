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

	$menu_id = (int) $attributes['selected'];

	if ( ! $menu_id ) {
		return '';
	}

	$menu = wp_get_nav_menu_object( $menu_id );

	if ( ! $menu ) {
		return '';
	}

	$class = "wp-block-navigation-menu align{$attributes['align']}";
	if ( isset( $attributes['layout'] ) && 'horizontal' === $attributes['layout'] ) {
		$class .= ' is-horizontal';
	}

	return wp_nav_menu( array(
		'menu' => $menu,
		'menu_class' => $class,
		'fallback_cb' => false,
		'echo' => false,
	) );
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
