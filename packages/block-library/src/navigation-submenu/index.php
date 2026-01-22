<?php
/**
 * Server-side rendering of the `core/navigation-submenu` block.
 *
 * @package WordPress
 */

// Path differs between source and build: '../navigation-link/shared/helpers.php' in source, './navigation-link/shared/helpers.php' in build.
if ( file_exists( __DIR__ . '/../navigation-link/shared/helpers.php' ) ) {
	require_once __DIR__ . '/../navigation-link/shared/helpers.php';
} else {
	require_once __DIR__ . '/navigation-link/shared/helpers.php';
}

/**
 * Renders the `core/navigation-submenu` block.
 *
 * @since 5.9.0
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The saved content.
 * @param WP_Block $block      The parsed block.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_core_navigation_submenu( $attributes, $content, $block ) {
	// Check if this navigation item should render based on post status.
	if ( defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN ) {
		if ( ! gutenberg_block_core_shared_navigation_item_should_render( $attributes, $block ) ) {
			return '';
		}
	}

	// Don't render the block's subtree if it has no label.
	if ( empty( $attributes['label'] ) ) {
		return '';
	}

	$font_sizes      = block_core_shared_navigation_build_css_font_sizes( $block->context );
	$style_attribute = $font_sizes['inline_styles'];

	// Render inner blocks first to check if any menu items will actually display.
	$inner_blocks_html = '';
	foreach ( $block->inner_blocks as $inner_block ) {
		$inner_blocks_html .= $inner_block->render();
	}
	$has_submenu = ! empty( trim( $inner_blocks_html ) );

	$is_active = block_core_shared_navigation_determine_active_state( $attributes );

	$show_submenu_indicators = isset( $block->context['showSubmenuIcon'] ) && $block->context['showSubmenuIcon'];
	$open_on_click           = isset( $block->context['openSubmenusOnClick'] ) && $block->context['openSubmenusOnClick'];
	$open_on_hover_and_click = isset( $block->context['openSubmenusOnClick'] ) && ! $block->context['openSubmenusOnClick'] &&
		$show_submenu_indicators;

	$classes = array(
		'wp-block-navigation-item',
	);
	$classes = array_merge(
		$classes,
		$font_sizes['css_classes']
	);
	if ( $has_submenu ) {
		$classes[] = 'has-child';
	}
	if ( $open_on_click ) {
		$classes[] = 'open-on-click';
	}
	if ( $open_on_hover_and_click ) {
		$classes[] = 'open-on-hover-click';
	}
	if ( $is_active ) {
		$classes[] = 'current-menu-item';
	}

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => implode( ' ', $classes ),
			'style' => $style_attribute,
		)
	);

	$label = '';

	if ( isset( $attributes['label'] ) ) {
		$label .= wp_kses_post( $attributes['label'] );
	}

	$aria_label = sprintf(
		/* translators: Accessibility text. %s: Parent page title. */
		__( '%s submenu' ),
		wp_strip_all_tags( $label )
	);

	$html = '<li ' . $wrapper_attributes . '>';

	// If Submenus open on hover, we render an anchor tag with attributes.
	// If submenu icons are set to show, we also render a submenu button, so the submenu can be opened on click.
	if ( ! $open_on_click ) {
		$item_url = $attributes['url'] ?? '';
		// Start appending HTML attributes to anchor tag.
		$html .= '<a class="wp-block-navigation-item__content"';

		// The href attribute on a and area elements is not required;
		// when those elements do not have href attributes they do not create hyperlinks.
		// But also The href attribute must have a value that is a valid URL potentially
		// surrounded by spaces.
		// see: https://html.spec.whatwg.org/multipage/links.html#links-created-by-a-and-area-elements.
		if ( ! empty( $item_url ) ) {
			$html .= ' href="' . esc_url( $item_url ) . '"';
		}

		if ( $is_active ) {
			$html .= ' aria-current="page"';
		}

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

		$html .= '<span class="wp-block-navigation-item__label">';
		$html .= $label;
		$html .= '</span>';

		// Add description if available.
		if ( ! empty( $attributes['description'] ) ) {
			$html .= '<span class="wp-block-navigation-item__description">';
			$html .= wp_kses_post( $attributes['description'] );
			$html .= '</span>';
		}

		$html .= '</a>';
		// End anchor tag content.

		if ( $show_submenu_indicators && $has_submenu ) {
			// The submenu icon is rendered in a button here
			// so that there's a clickable element to open the submenu.
			$html .= '<button aria-label="' . esc_attr( $aria_label ) . '" class="wp-block-navigation__submenu-icon wp-block-navigation-submenu__toggle" aria-expanded="false">' . block_core_shared_navigation_render_submenu_icon() . '</button>';
		}
	} else {
		// If menus open on click, we render the parent as a button.
		$html .= '<button aria-label="' . esc_attr( $aria_label ) . '" class="wp-block-navigation-item__content wp-block-navigation-submenu__toggle" aria-expanded="false">';

		// Wrap title with span to isolate it from submenu icon.
		$html .= '<span class="wp-block-navigation-item__label">';

		$html .= $label;

		$html .= '</span>';

		// Add description if available.
		if ( ! empty( $attributes['description'] ) ) {
			$html .= '<span class="wp-block-navigation-item__description">';
			$html .= wp_kses_post( $attributes['description'] );
			$html .= '</span>';
		}

		$html .= '</button>';

		if ( $has_submenu ) {
			$html .= '<span class="wp-block-navigation__submenu-icon">' . block_core_shared_navigation_render_submenu_icon() . '</span>';
		}
	}

	if ( $has_submenu ) {
		// Copy some attributes from the parent block to this one.
		// Ideally this would happen in the client when the block is created.
		if ( array_key_exists( 'overlayTextColor', $block->context ) ) {
			$attributes['textColor'] = $block->context['overlayTextColor'];
		}
		if ( array_key_exists( 'overlayBackgroundColor', $block->context ) ) {
			$attributes['backgroundColor'] = $block->context['overlayBackgroundColor'];
		}
		if ( array_key_exists( 'customOverlayTextColor', $block->context ) ) {
			$attributes['style']['color']['text'] = $block->context['customOverlayTextColor'];
		}
		if ( array_key_exists( 'customOverlayBackgroundColor', $block->context ) ) {
			$attributes['style']['color']['background'] = $block->context['customOverlayBackgroundColor'];
		}

		// This allows us to be able to get a response from wp_apply_colors_support.
		$block->block_type->supports['color'] = true;
		$colors_supports                      = wp_apply_colors_support( $block->block_type, $attributes );
		$css_classes                          = 'wp-block-navigation__submenu-container';
		if ( array_key_exists( 'class', $colors_supports ) ) {
			$css_classes .= ' ' . $colors_supports['class'];
		}

		$style_attribute = '';
		if ( array_key_exists( 'style', $colors_supports ) ) {
			$style_attribute = $colors_supports['style'];
		}

		if ( strpos( $inner_blocks_html, 'current-menu-item' ) ) {
			$tag_processor = new WP_HTML_Tag_Processor( $html );
			while ( $tag_processor->next_tag( array( 'class_name' => 'wp-block-navigation-item' ) ) ) {
				$tag_processor->add_class( 'current-menu-ancestor' );
			}
			$html = $tag_processor->get_updated_html();
		}

		$wrapper_attributes = get_block_wrapper_attributes(
			array(
				'class' => $css_classes,
				'style' => $style_attribute,
			)
		);

		$html .= sprintf(
			'<ul %s>%s</ul>',
			$wrapper_attributes,
			$inner_blocks_html
		);

	}

	$html .= '</li>';

	return $html;
}

/**
 * Register the navigation submenu block.
 *
 * @since 5.9.0
 *
 * @uses render_block_core_navigation_submenu()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_core_navigation_submenu() {
	register_block_type_from_metadata(
		__DIR__ . '/navigation-submenu',
		array(
			'render_callback' => 'render_block_core_navigation_submenu',
		)
	);
}
add_action( 'init', 'register_block_core_navigation_submenu' );
