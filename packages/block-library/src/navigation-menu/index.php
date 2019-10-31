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
function build_css_colors( $attributes ) {
	// CSS classes.
	$colors = array(
		'bg_css_classes'     => '',
		'bg_inline_styles'   => '',
		'text_css_classes'   => '',
		'text_inline_styles' => '',
	);

	// Background color.
	// Background color - has text color.
	if ( array_key_exists( 'backgroundColor', $attributes ) ) {
		$colors['bg_css_classes'] .= ' has-background-color';
	}

	// Background color - add custom CSS class.
	if ( array_key_exists( 'backgroundColorCSSClass', $attributes ) ) {
		$colors['bg_css_classes'] .= " {$attributes['backgroundColorCSSClass']}";

	} elseif ( array_key_exists( 'customBackgroundColor', $attributes ) ) {
		// Background color - or add inline `background-color` style.
		$colors['bg_inline_styles'] = ' style="background-color: ' . esc_attr( $attributes['customBackgroundColor'] ) . ';"';
	}

	// Text color.
	// Text color - has text color.
	if ( array_key_exists( 'textColor', $attributes ) ) {
		$colors['text_css_classes'] .= ' has-text-color';
	}
	// Text color - add custom CSS class.
	if ( array_key_exists( 'textColorCSSClass', $attributes ) ) {
		$colors['text_css_classes'] .= " {$attributes['textColorCSSClass']}";

	} elseif ( array_key_exists( 'customTextColor', $attributes ) ) {
		// Text color - or add inline `color` style.
		$colors['text_inline_styles'] = ' style="color: ' . esc_attr( $attributes['customTextColor'] ) . ';"';
	}

	$colors['bg_css_classes']   = esc_attr( trim( $colors['bg_css_classes'] ) );
	$colors['text_css_classes'] = esc_attr( trim( $colors['text_css_classes'] ) );

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
	// Inline computed colors.
	$comp_inline_styles = '';
	if ( array_key_exists( 'backgroundColorValue', $attributes ) ) {
		$comp_inline_styles .= ' background-color: ' . esc_attr( $attributes['backgroundColorValue'] ) . ';';
	}

	if ( array_key_exists( 'textColorValue', $attributes ) ) {
		$comp_inline_styles .= ' color: ' . esc_attr( $attributes['textColorValue'] ) . ';';
	}
	$comp_inline_styles = ! empty( $comp_inline_styles )
		? ' style="' . esc_attr( trim( $comp_inline_styles ) ) . '"'
		: '';

	$colors = build_css_colors( $attributes );

	return "<nav class='wp-block-navigation-menu' {$comp_inline_styles}>" .
		build_navigation_menu_html( $block, $colors ) .
	'</nav>';
}

/**
 * Walks the inner block structure and returns an HTML list for it.
 *
 * @param array $block  The block.
 * @param array $colors Contains inline styles and CSS classes to apply to menu item.
 *
 * @return string Returns  an HTML list from innerBlocks.
 */
function build_navigation_menu_html( $block, $colors ) {
	$html = '';
	foreach ( (array) $block['innerBlocks'] as $key => $menu_item ) {

		$opens_in_new_tab = isset( $menu_item['attrs']['opensInNewTab'] ) ?? false;

		$html .= '<li class="wp-block-navigation-menu-item ' . $colors['bg_css_classes'] . '"' . $colors['bg_inline_styles'] . '>' .
			'<a
				class="wp-block-navigation-menu-item__link ' . $colors['text_css_classes'] . '"
				' . $colors['text_inline_styles'];

		// Start appending HTML attributes to anchor tag
		if ( isset( $menu_item['attrs']['url'] ) ) {
			$html .= ' href="' . $menu_item['attrs']['url'] . '"';
		}
		if ( isset( $menu_item['attrs']['title'] ) ) {
			$html .= ' title="' . $menu_item['attrs']['title'] . '"';
		}

		if ( isset( $menu_item['attrs']['opensInNewTab'] ) && true == $menu_item['attrs']['opensInNewTab'] ) {
			$html .= ' target="_blank"  ';
		}
		// End appending HTML attributes to anchor tag

		// Start anchor tag content
		$html .= '>';
		if ( isset( $menu_item['attrs']['label'] ) ) {
			$html .= $menu_item['attrs']['label'];
		}
		$html .= '</a>';
		// End anchor tag content

		if ( count( (array) $menu_item['innerBlocks'] ) > 0 ) {
			$html .= build_navigation_menu_html( $menu_item, $colors );
		}

		$html .= '</li>';
	}
	return '<ul>' . $html . '</ul>';
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
