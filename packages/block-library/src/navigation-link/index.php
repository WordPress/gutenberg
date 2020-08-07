<?php
/**
 * Server-side rendering of the `core/navigation-link` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/navigation-link` block.
 *
 * @param array $attributes The block attributes.
 * @param array $content The saved content.
 * @param array $block The parsed block.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_core_navigation_link( $attributes, $content, $block ) {
	if ( empty( $attributes['label'] ) ) {
		return '';
	}

	$text_color              = $block->context['textColor'];
	$custom_text_color       = $block->context['customTextColor'];
	$background_color        = $block->context['backgroundColor'];
	$custom_background_color = $block->context['customBackgroundColor'];
	$font_size               = $block->context['fontSize'];
	$custom_font_size        = $block->context['customFontSize'];

	$class = wp_classnames(
		array(
			'wp-block-navigation-link',
			'has-text-color'                           => $text_color || $custom_text_color,
			"has-{$block->context['textColor']}-color" => $text_color,
			'has-background'                           => $background_color || $custom_background_color,
			"has-$background_color-background-color"   => $background_color,
			"has-$font_size-font-size"                 => $font_size,
			'has-child'                                => count( $block->inner_blocks ),
		)
	);

	$style = '';
	if ( ! $text_color && $custom_text_color ) {
		$style .= "color: $custom_text_color;";
	}
	if ( ! $background_color && $custom_background_color ) {
		$style .= "background-color: $custom_background_color;";
	}
	if ( ! $font_size && $custom_font_size ) {
		$style .= "font-size: {$custom_font_size}px;";
	}

	$inner_blocks_html = '';
	foreach ( $block->inner_blocks as $inner_block ) {
		$inner_blocks_html .= $inner_block->render();
	}

	return wp_el(
		'li',
		array(
			'class' => $class,
			'style' => $style,
		),
		array(
			wp_el(
				'a',
				array(
					'class'  => 'wp-block-navigation-link__content',
					'href'   => $attributes['url'],
					'target' => $attributes['opensInNewTab'] ? '_blank' : null,
					'rel'    => $attributes['rel'] || ( $attributes['nofollow'] ? 'nofollow' : null ),
				),
				wp_el(
					'span',
					array(
						'class' => 'wp-block-navigation-link__label',
					),
					$attributes['label']
				)
			),
			$attributes['showSubmenuIcon'] && (
				wp_el(
					'span',
					array(
						'class' => 'wp-block-navigation-link__submenu-icon',
					),
					wp_dangerous_html( '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" transform="rotate(90)"><path d="M8 5v14l11-7z"/><path d="M0 0h24v24H0z" fill="none"/></svg>' )
				)
			),
			wp_el(
				'ul',
				array(
					'class' => 'wp-block-navigation__container',
				),
				wp_dangerous_html( $inner_blocks_html )
			),
		)
	);
}

/**
 * Register the navigation link block.
 *
 * @uses render_block_core_navigation()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_core_navigation_link() {
	register_block_type_from_metadata(
		__DIR__ . '/navigation-link',
		array(
			'render_callback' => 'render_block_core_navigation_link',
		)
	);
}
add_action( 'init', 'register_block_core_navigation_link' );
