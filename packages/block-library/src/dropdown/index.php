<?php
/**
 * Server-side rendering of the `core/dropdown` block.
 *
 * @package gutenberg
 */

/**
 * Build an array with CSS classes and inline styles defining the colors
 * which will be applied to the navigation markup in the front-end.
 *
 * @param  array $context    Navigation block context.
 * @param  array $attributes Block attributes.
 * @return array Colors CSS classes and inline styles.
 */
function block_core_dropdown_build_css_colors( $context, $attributes ) {
	$colors = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	$is_sub_menu = isset( $attributes['isTopLevelLink'] ) ? ( ! $attributes['isTopLevelLink'] ) : false;

	// Text color.
	$named_text_color  = null;
	$custom_text_color = null;

	if ( $is_sub_menu && array_key_exists( 'customOverlayTextColor', $context ) ) {
		$custom_text_color = $context['customOverlayTextColor'];
	} elseif ( $is_sub_menu && array_key_exists( 'overlayTextColor', $context ) ) {
		$named_text_color = $context['overlayTextColor'];
	} elseif ( array_key_exists( 'customTextColor', $context ) ) {
		$custom_text_color = $context['customTextColor'];
	} elseif ( array_key_exists( 'textColor', $context ) ) {
		$named_text_color = $context['textColor'];
	} elseif ( isset( $context['style']['color']['text'] ) ) {
		$custom_text_color = $context['style']['color']['text'];
	}

	// If has text color.
	if ( ! is_null( $named_text_color ) ) {
		// Add the color class.
		array_push( $colors['css_classes'], 'has-text-color', sprintf( 'has-%s-color', $named_text_color ) );
	} elseif ( ! is_null( $custom_text_color ) ) {
		// Add the custom color inline style.
		$colors['css_classes'][]  = 'has-text-color';
		$colors['inline_styles'] .= sprintf( 'color: %s;', $custom_text_color );
	}

	// Background color.
	$named_background_color  = null;
	$custom_background_color = null;

	if ( $is_sub_menu && array_key_exists( 'customOverlayBackgroundColor', $context ) ) {
		$custom_background_color = $context['customOverlayBackgroundColor'];
	} elseif ( $is_sub_menu && array_key_exists( 'overlayBackgroundColor', $context ) ) {
		$named_background_color = $context['overlayBackgroundColor'];
	} elseif ( array_key_exists( 'customBackgroundColor', $context ) ) {
		$custom_background_color = $context['customBackgroundColor'];
	} elseif ( array_key_exists( 'backgroundColor', $context ) ) {
		$named_background_color = $context['backgroundColor'];
	} elseif ( isset( $context['style']['color']['background'] ) ) {
		$custom_background_color = $context['style']['color']['background'];
	}

	// If has background color.
	if ( ! is_null( $named_background_color ) ) {
		// Add the background-color class.
		array_push( $colors['css_classes'], 'has-background', sprintf( 'has-%s-background-color', $named_background_color ) );
	} elseif ( ! is_null( $custom_background_color ) ) {
		// Add the custom background-color inline style.
		$colors['css_classes'][]  = 'has-background';
		$colors['inline_styles'] .= sprintf( 'background-color: %s;', $custom_background_color );
	}

	return $colors;
}

/**
 * Build an array with CSS classes and inline styles defining the font sizes
 * which will be applied to the navigation markup in the front-end.
 *
 * @param  array $context Navigation block context.
 * @return array Font size CSS classes and inline styles.
 */
function block_core_dropdown_build_css_font_sizes( $context ) {
	// CSS classes.
	$font_sizes = array(
		'css_classes'   => array(),
		'inline_styles' => '',
	);

	$has_named_font_size  = array_key_exists( 'fontSize', $context );
	$has_custom_font_size = isset( $context['style']['typography']['fontSize'] );

	if ( $has_named_font_size ) {
		// Add the font size class.
		$font_sizes['css_classes'][] = sprintf( 'has-%s-font-size', $context['fontSize'] );
	} elseif ( $has_custom_font_size ) {
		// Add the custom font size inline style.
		$font_sizes['inline_styles'] = sprintf( 'font-size: %spx;', $context['style']['typography']['fontSize'] );
	}

	return $font_sizes;
}

/**
 * Returns the top-level submenu SVG chevron icon.
 *
 * @return string
 */
function block_core_dropdown_render_submenu_icon() {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" role="img" aria-hidden="true" focusable="false"><path d="M1.50002 4L6.00002 8L10.5 4" stroke-width="1.5"></path></svg>';
}

/**
 * Renders the `core/dropdown` block.
 *
 * @param array $attributes The block attributes.
 * @param array $content The saved content.
 * @param array $block The parsed block.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_core_dropdown( $attributes, $content, $block ) {
	if ( ! wp_script_is( 'wp-block-dropdown-view' ) ) {
		wp_enqueue_script( 'wp-block-dropdown-view' );
	}

	$navigation_link_has_id = isset( $attributes['id'] ) && is_numeric( $attributes['id'] );
	$is_post_type           = isset( $attributes['kind'] ) && 'post-type' === $attributes['kind'];
	$is_post_type           = $is_post_type || isset( $attributes['type'] ) && ( 'post' === $attributes['type'] || 'page' === $attributes['type'] );

	// Don't render the block's subtree if it is a draft.
	if ( $is_post_type && $navigation_link_has_id ) {
		$post = get_post( $attributes['id'] );
		if ( 'publish' !== $post->post_status ) {
			return '';
		}
	}

	// Don't render the block's subtree if it has no label.
	if ( empty( $attributes['label'] ) ) {
		return '';
	}

	$colors          = block_core_dropdown_build_css_colors( $block->context, $attributes );
	$font_sizes      = block_core_dropdown_build_css_font_sizes( $block->context );
	$classes         = array_merge(
		$colors['css_classes'],
		$font_sizes['css_classes']
	);
	$style_attribute = ( $colors['inline_styles'] . $font_sizes['inline_styles'] );

	$css_classes = trim( implode( ' ', $classes ) );
	$has_submenu = count( $block->inner_blocks ) > 0;
	$is_active   = ! empty( $attributes['id'] ) && ( get_the_ID() === $attributes['id'] );

	$class_name = ! empty( $attributes['className'] ) ? implode( ' ', (array) $attributes['className'] ) : false;

	if ( false !== $class_name ) {
		$css_classes .= ' ' . $class_name;
	}

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => $css_classes . ( $has_submenu ? ' has-child' : '' ) .
				( $is_active ? ' current-menu-item' : '' ),
			'style' => $style_attribute,
		)
	);
	$html               = '<li ' . $wrapper_attributes . '>';
		
	// If the Parent element is a link, we render an anchor tag with attributes.
	// We also render a submenu button, so the submenu can be opened on click.
	if ( isset( $attributes['url'] ) && '' !== $attributes['url'] ) {
		// Start appending HTML attributes to anchor tag.
		$html .= '<a class="wp-block-dropdown__parent" href="' . esc_url( $attributes['url'] ) . '"';

		if ( isset( $attributes['opensInNewTab'] ) && true === $attributes['opensInNewTab'] ) {
			$html .= ' target="_blank"  ';
		}
	
		if ( isset( $attributes['rel'] ) ) {
			$html .= ' rel="' . esc_attr( $attributes['rel'] ) . '"';
		} elseif ( isset( $attributes['nofollow'] ) && $attributes['nofollow'] ) {
			$html .= ' rel="nofollow"';
		}
	
		if ( isset( $attributes['title'] ) ) {
			$html .= ' title="' . esc_attr( $attributes['title'] ) . '"';
		}

		$html .= '>';
		// End appending HTML attributes to anchor tag.

		if ( isset( $attributes['label'] ) ) {
			$html .= wp_kses(
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
		}

		$html .= '</a>';
		// End anchor tag content.

		// The submenu icon has to be rendered in a button here
		// so that there's a clickable elment to open the submenu.
		$html .= '<button class="wp-block-dropdown__submenu-icon wp-block-dropdown__toggle" aria-expanded="false">' . block_core_dropdown_render_submenu_icon() . '</button>';

	} else {
		// If the Parent element is not a link, we render the whole thing as a button.
		$html .= '<button class="wp-block-dropdown__parent wp-block-dropdown__toggle" aria-expanded="false">';

		// Wrap title with span to isolate it from submenu icon.
		$html .= '<span class="wp-block-navigation-link__label">';

		if ( isset( $attributes['label'] ) ) {
			$html .= wp_kses(
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
		}

		$html .= '</span>';

		if ( isset( $block->context['showSubmenuIcon'] ) && $block->context['showSubmenuIcon'] ) {
			// The submenu icon can be hidden by a CSS rule on the Navigation Block.
			$html .= '<span class="wp-block-navigation-link__submenu-icon">' . block_core_dropdown_render_submenu_icon() . '</span>';
		}

		$html .= '</button>';

	}

	if ( $has_submenu ) {
		$inner_blocks_html = '';
		foreach ( $block->inner_blocks as $inner_block ) {
			$inner_blocks_html .= $inner_block->render();
		}

		$html .= sprintf(
			'<ul class="wp-block-dropdown__container">%s</ul>',
			$inner_blocks_html
		);
	}

	$html .= '</li>';

	return $html;
}

/**
 * Register the dropdown block.
 *
 * @uses render_block_core_navigation()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_core_dropdown() {
	register_block_type_from_metadata(
		__DIR__ . '/dropdown',
		array(
			'render_callback' => 'render_block_core_dropdown',
		)
	);
}
add_action( 'init', 'register_block_core_dropdown' );
