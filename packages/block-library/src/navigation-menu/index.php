<?php
/**
 * Server-side rendering of the `core/navigation-menu` block.
 *
 * @package gutenberg
 */

/**
 * Build an array with CSS classes and inline styles defining the colors
 * which will be applied to the navigation menu markup in the front-end.
 *
 * @param  array $attributes NavigationMenu block attributes.
 * @return array Colors CSS classes and inline styles.
 */
function block_navigation_colors( $attributes ) {
	// CSS classes.
	$colors = array(
		'classes' => array(),
		'style'   => '',
	);

	// Background color.
	// Background color - has background color.
	if ( array_key_exists( 'backgroundColor', $attributes ) ) {
		$colors['classes'][] = 'has-background-color';
	}

	// Background color - add custom CSS class.
	if ( array_key_exists( 'backgroundColorCSSClass', $attributes ) ) {
		$colors['classes'][] = trim( $attributes['backgroundColorCSSClass'] );
	}
	if ( array_key_exists( 'customBackgroundColor', $attributes ) ) {
		// Background color - or add inline `background-color` style.
		$colors['style'] .= "background-color:{$attributes['customBackgroundColor']};";
	}

	// Text color.
	// Text color - has text color.
	if ( array_key_exists( 'textColor', $attributes ) ) {
		$colors['classes'][] = 'has-text-color';
	}
	// Text color - add custom CSS class.
	if ( array_key_exists( 'textColorCSSClass', $attributes ) ) {
		$colors['classes'][] = trim( $attributes['textColorCSSClass'] );
	}
	if ( array_key_exists( 'textColorValue', $attributes ) ){
		// Text color - or add inline `color` style.
		$colors['style'] .= "color:{$attributes['textColorValue']};";
	}

	$colors['classes'] = array_unique( array_filter( $colors['classes'] ) );

	return $colors;
}

/**
 * Renders the `core/navigation-menu` block on server.
 *
 * @param array $attributes The block attributes.
 * @param array $content The saved content.
 * @param array $block The parsed block.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_navigation_menu( $attributes, $content, $block ) {
	$colors = block_navigation_colors( $attributes );
	$items  = setup_block_nav_items( $block, $colors );
	$args   = (object) array(
		'before'          => '',
		'after'           => '',
		'link_before'     => '',
		'link_after'      => '',
		'theme_location'  => 'block',
	);

	add_filter( 'nav_menu_link_attributes', 'block_navigation_link_attributes', 10, 2 );

	return sprintf(
		'<nav class="wp-block-navigation-menu" style="%1$s"><ul class="menu">%2$s</ul></nav>',
		esc_attr( $colors['style'] ),
		walk_nav_menu_tree( $items, 0, $args )
	);
}

/**
 * Adds inline styles to menu item link attributes.
 *
 * @param array  $attributes Link attributes.
 * @param object $item       Menu item.
 * @return array
 */
function block_navigation_link_attributes( $attributes, $item ) {
	if ( ! empty( $item->style ) ) {
		$attributes['style'] = $item->style;
	}

	return $attributes;
}

/**
 * Prepares menu items to be used in Walker_Nav_Menu.
 *
 * @param array $block  The parsed block.
 * @param array $colors Custom colors classes and styles.
 * @return array Menu items
 */
function setup_block_nav_items( $block, $colors ) {
	static $menu_item_id = 1;
	$nav_menu_items = array();
	$nav_menu_item  = array(
		'classes'       => $colors['classes'],
		'current'       => false,
		'menu_order'    => 0,
		'post_content'  => '',
		'post_excerpt'  => '',
		'post_type'     => 'nav_menu_item',
		'style'         => $colors['style'],
	);

	foreach ( $block['innerBlocks'] as $inner_block ) {
		$sub_menu_items = setup_block_nav_items( $inner_block, $colors );
		foreach ( $sub_menu_items as $sub_menu_item ) {
			$sub_menu_item->menu_item_parent = $menu_item_id;
			$nav_menu_items[]                = $sub_menu_item;
		}

		if ( empty( $inner_block['attrs']['label'] ) ) {
			continue;
		}

		$nav_menu_item['ID']         = $menu_item_id;
		$nav_menu_item['post_title'] = $inner_block['attrs']['label'];
		$nav_menu_item['url']        = $inner_block['attrs']['url'] ?? '#';

		++$menu_item_id;
		$nav_menu_items[] = (object) $nav_menu_item;
	}

	return array_map( 'wp_setup_nav_menu_item', $nav_menu_items );
}

/**
 * Register the navigation menu block.
 *
 * @uses render_block_navigation_menu()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_core_navigation_menu() {
	register_block_type(
		'core/navigation-menu',
		array(
			'category'        => 'layout',
			'attributes'      => array(
				'className'               => array(
					'type' => 'string',
				),

				'automaticallyAdd'        => array(
					'type'    => 'boolean',
					'default' => false,
				),

				'backgroundColor'         => array(
					'type' => 'string',
				),

				'textColor'               => array(
					'type' => 'string',
				),

				'backgroundColorValue'    => array(
					'type' => 'string',
				),

				'textColorValue'          => array(
					'type' => 'string',
				),

				'customBackgroundColor'   => array(
					'type' => 'string',
				),

				'customTextColor'         => array(
					'type' => 'string',
				),

				'backgroundColorCSSClass' => array(
					'type' => 'string',
				),

				'textColorCSSClass'       => array(
					'type' => 'string',
				),
			),

			'render_callback' => 'render_block_navigation_menu',
		)
	);
}
add_action( 'init', 'register_block_core_navigation_menu' );
