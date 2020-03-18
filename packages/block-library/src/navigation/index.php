<?php
/**
 * Server-side rendering of the `core/navigation` block.
 *
 * @package gutenberg
 */

/**
 * Build an array with CSS classes and inline styles defining the colors
 * which will be applied to the navigation markup in the front-end.
 *
 * @param  array $attributes Navigation block attributes.
 * @return array Colors CSS classes and inline styles.
 */
function block_core_navigation_build_css_colors( $attributes ) {
	$colors = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	// Text color.
	$has_named_text_color  = array_key_exists( 'textColor', $attributes );
	$has_custom_text_color = array_key_exists( 'customTextColor', $attributes );

	// If has text color.
	if ( $has_custom_text_color || $has_named_text_color ) {
		// Add has-text-color class.
		$colors['css_classes'][] = 'has-text-color';
	}

	if ( $has_named_text_color ) {
		// Add the color class.
		$colors['css_classes'][] = sprintf( 'has-%s-color', $attributes['textColor'] );
	} elseif ( $has_custom_text_color ) {
		// Add the custom color inline style.
		$colors['inline_styles'] .= sprintf( 'color: %s;', $attributes['customTextColor'] );
	}

	// Background color.
	$has_named_background_color  = array_key_exists( 'backgroundColor', $attributes );
	$has_custom_background_color = array_key_exists( 'customBackgroundColor', $attributes );

	// If has background color.
	if ( $has_custom_background_color || $has_named_background_color ) {
		// Add has-background class.
		$colors['css_classes'][] = 'has-background';
	}

	if ( $has_named_background_color ) {
		// Add the background-color class.
		$colors['css_classes'][] = sprintf( 'has-%s-background-color', $attributes['backgroundColor'] );
	} elseif ( $has_custom_background_color ) {
		// Add the custom background-color inline style.
		$colors['inline_styles'] .= sprintf( 'background-color: %s;', $attributes['customBackgroundColor'] );
	}

	return $colors;
}

/**
 * Build an array with CSS classes and inline styles defining the font sizes
 * which will be applied to the navigation markup in the front-end.
 *
 * @param  array $attributes Navigation block attributes.
 * @return array Font size CSS classes and inline styles.
 */
function block_core_navigation_build_css_font_sizes( $attributes ) {
	// CSS classes.
	$font_sizes = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	$has_named_font_size  = array_key_exists( 'fontSize', $attributes );
	$has_custom_font_size = array_key_exists( 'customFontSize', $attributes );

	if ( $has_named_font_size ) {
		// Add the font size class.
		$font_sizes['css_classes'][] = sprintf( 'has-%s-font-size', $attributes['fontSize'] );
	} elseif ( $has_custom_font_size ) {
		// Add the custom font size inline style.
		$font_sizes['inline_styles'] = sprintf( 'font-size: %spx;', $attributes['customFontSize'] );
	}

	return $font_sizes;
}

/**
 * Recursively filters out links with no labels to build a clean navigation block structure.
 *
 * @param array $blocks Navigation link inner blocks from the Navigation block.
 * @return array Blocks that had valid labels
 */
function block_core_navigation_empty_navigation_links_recursive( $blocks ) {
	$blocks = array_filter(
		$blocks,
		function( $block ) {
			return ! empty( $block['attrs']['label'] );
		}
	);

	if ( ! empty( $blocks ) ) {
		foreach ( $blocks as $key => $block ) {
			if ( ! empty( $block['innerBlocks'] ) ) {
				$blocks[ $key ]['innerBlocks'] = block_core_navigation_empty_navigation_links_recursive( $block['innerBlocks'] );
			}
		}
	}

	return $blocks;
}

/**
 * Returns the top-level submenu SVG chevron icon.
 *
 * @return string
 */
function block_core_navigation_render_submenu_icon() {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" transform="rotate(90)"><path d="M8 5v14l11-7z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
}

/**
 * Renders the `core/navigation` block on server.
 *
 * @param array $content The saved content.
 * @param array $block The parsed block.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_core_navigation( $content, $block ) {

	if ( 'core/navigation' !== $block['blockName'] ) {
		return $content;
	}

	$block['innerBlocks'] = block_core_navigation_empty_navigation_links_recursive( $block['innerBlocks'] );
	$attributes           = $block['attrs'];

	/**
	 * Deprecated:
	 * The rgbTextColor and rgbBackgroundColor attributes
	 * have been deprecated in favor of
	 * customTextColor and customBackgroundColor ones.
	 * Move the values from old attrs to the new ones.
	 */
	if ( isset( $attributes['rgbTextColor'] ) && empty( $attributes['textColor'] ) ) {
		$attributes['customTextColor'] = $attributes['rgbTextColor'];
	}

	if ( isset( $attributes['rgbBackgroundColor'] ) && empty( $attributes['backgroundColor'] ) ) {
		$attributes['customBackgroundColor'] = $attributes['rgbBackgroundColor'];
	}

	unset( $attributes['rgbTextColor'], $attributes['rgbBackgroundColor'] );

	if ( empty( $block['innerBlocks'] ) ) {
		return '';
	}

	$colors          = block_core_navigation_build_css_colors( $attributes );
	$font_sizes      = block_core_navigation_build_css_font_sizes( $attributes );
	$classes         = array_merge(
		$colors['css_classes'],
		$font_sizes['css_classes'],
		array( 'wp-block-navigation' ),
		isset( $attributes['className'] ) ? array( $attributes['className'] ) : array(),
		isset( $attributes['itemsJustification'] ) ? array( 'items-justified-' . $attributes['itemsJustification'] ) : array(),
		isset( $attributes['align'] ) ? array( 'align' . $attributes['align'] ) : array()
	);
	$class_attribute = sprintf( ' class="%s"', esc_attr( implode( ' ', $classes ) ) );
	$style_attribute = ( $colors['inline_styles'] || $font_sizes['inline_styles'] )
		? sprintf( ' style="%s"', esc_attr( $colors['inline_styles'] ) . esc_attr( $font_sizes['inline_styles'] ) )
		: '';

	return sprintf(
		'<nav %1$s %2$s>%3$s</nav>',
		$class_attribute,
		$style_attribute,
		block_core_navigation_build_html( $attributes, $block, $colors, $font_sizes, true )
	);
}

/**
 * Walks the inner block structure and returns an HTML list for it.
 *
 * @param array $attributes    The Navigation block attributes.
 * @param array $block         The NavigationItem block.
 * @param array $colors        Contains inline styles and CSS classes to apply to navigation item.
 * @param array $font_sizes    Contains inline styles and CSS classes to apply to navigation item.
 *
 * @return string Returns  an HTML list from innerBlocks.
 */
function block_core_navigation_build_html( $attributes, $block, $colors, $font_sizes ) {
	$html            = '';
	$classes         = array_merge(
		$colors['css_classes'],
		$font_sizes['css_classes']
	);
	$classes[]       = 'wp-block-navigation-link';
	$css_classes     = trim( implode( ' ', $classes ) );
	$style_attribute = ( $colors['inline_styles'] || $font_sizes['inline_styles'] )
		? sprintf( ' style="%s"', esc_attr( $colors['inline_styles'] ) . esc_attr( $font_sizes['inline_styles'] ) )
		: '';

	foreach ( (array) $block['innerBlocks'] as $key => $block ) {
		$has_submenu = count( (array) $block['innerBlocks'] ) > 0;

		$html .= '<li class="' . esc_attr( $css_classes . ( $has_submenu ? ' has-child' : '' ) ) . '"' . $style_attribute . '>' .
			'<a class="wp-block-navigation-link__content"';

		// Start appending HTML attributes to anchor tag.
		if ( isset( $block['attrs']['url'] ) ) {
			$html .= ' href="' . esc_url( $block['attrs']['url'] ) . '"';
		}

		if ( isset( $block['attrs']['opensInNewTab'] ) && true === $block['attrs']['opensInNewTab'] ) {
			$html .= ' target="_blank"  ';
		}
		// End appending HTML attributes to anchor tag.

		// Start anchor tag content.
		$html .= '>' .
			// Wrap title with span to isolate it from submenu icon.
			'<span class="wp-block-navigation-link__label">';

		if ( isset( $block['attrs']['label'] ) ) {
			$html .= wp_kses(
				$block['attrs']['label'],
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
		}

		$html .= '</span>';

		// Append submenu icon to top-level item.
		// it shows the icon as default, when 'showSubmenuIcon' is not set,
		// or when it's set and also not False.
		if (
			(
				isset( $attributes['showSubmenuIcon'] ) && false !== $attributes['showSubmenuIcon'] ||
				! isset( $attributes['showSubmenuIcon'] )
			) &&
			$has_submenu
		) {
			$html .= '<span class="wp-block-navigation-link__submenu-icon">' . block_core_navigation_render_submenu_icon() . '</span>';
		}

		$html .= '</a>';
		// End anchor tag content.

		if ( $has_submenu ) {
			$html .= block_core_navigation_build_html( $attributes, $block, $colors, $font_sizes, false );
		}

		$html .= '</li>';
	}
	return '<ul class="wp-block-navigation__container">' . $html . '</ul>';
}

/**
 * Register the navigation block.
 *
 * @uses render_block_core_navigation()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_core_navigation() {

	register_block_type(
		'core/navigation',
		array(
			'attributes' => array(
				'className'             => array(
					'type' => 'string',
				),
				'textColor'             => array(
					'type' => 'string',
				),
				'customTextColor'       => array(
					'type' => 'string',
				),
				// deprecated.
				'rgbTextColor'          => array(
					'type' => 'string',
				),
				'backgroundColor'       => array(
					'type' => 'string',
				),
				'customBackgroundColor' => array(
					'type' => 'string',
				),
				// deprecated.
				'rgbBackgroundColor'    => array(
					'type' => 'string',
				),
				'fontSize'              => array(
					'type' => 'string',
				),
				'customFontSize'        => array(
					'type' => 'number',
				),
				'itemsJustification'    => array(
					'type' => 'string',
				),
				'showSubmenuIcon'       => array(
					'type'    => 'boolean',
					'default' => true,
				),
			),
		)
	);
}
add_action( 'init', 'register_block_core_navigation' );
add_filter( 'render_block', 'render_block_core_navigation', 10, 2 );
