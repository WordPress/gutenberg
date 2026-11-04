<?php
/**
 * Transform block support flag.
 *
 * Each transform feature outputs its own individual CSS property, such as
 * `rotate` or `translate`, never the `transform` shorthand, so features
 * combine with each other and with any transform a block already applies.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_transform_support( $block_type ) {
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	// Check for existing style attribute definition e.g. from block.json.
	if ( array_key_exists( 'style', $block_type->attributes ) ) {
		return;
	}

	if ( block_has_support( $block_type, 'transform', false ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Renders a block's transform styles.
 *
 * Features are output as inline styles on the block wrapper. When the block
 * has a transform feature selector, e.g. `.wp-block-image img`, they are
 * output instead to the block supports stylesheet under that selector, so the
 * wrapper and anything else in it, such as a caption, are left as they are.
 * A feature that skips serialization is left for the block to apply.
 *
 * State styles, such as `:hover` or `@mobile`, are rendered by the block
 * states support.
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 * @return string Filtered block content.
 */
function gutenberg_render_transform_support( $block_content, $block ) {
	if ( empty( $block_content ) || empty( $block['blockName'] ) ) {
		return $block_content;
	}

	$transform = $block['attrs']['style']['transform'] ?? null;
	if ( empty( $transform ) || ! is_array( $transform ) ) {
		return $block_content;
	}

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	if ( ! $block_type || ! block_has_support( $block_type, 'transform', false ) ) {
		return $block_content;
	}

	$inline_styles   = array();
	$selector_styles = array();

	foreach ( array( 'rotate', 'translate' ) as $feature ) {
		if (
			! isset( $transform[ $feature ] ) ||
			! block_has_support( $block_type, array( 'transform', $feature ), false ) ||
			wp_should_skip_block_supports_serialization( $block_type, 'transform', $feature )
		) {
			continue;
		}

		$selector = wp_get_block_css_selector( $block_type, array( 'transform', $feature ) ) ?? wp_get_block_css_selector( $block_type, 'transform' );
		if ( $selector ) {
			$selector_styles[ $selector ][ $feature ] = $transform[ $feature ];
		} else {
			$inline_styles[ $feature ] = $transform[ $feature ];
		}
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( ! $processor->next_tag() ) {
		return $block_content;
	}

	$inline_css = gutenberg_style_engine_get_styles( array( 'transform' => $inline_styles ) )['css'] ?? '';
	if ( ! empty( $inline_css ) ) {
		$existing_style = $processor->get_attribute( 'style' );
		$existing_style = is_string( $existing_style ) && '' !== trim( $existing_style ) ? rtrim( trim( $existing_style ), ';' ) . ';' : '';
		$processor->set_attribute( 'style', $existing_style . $inline_css );
	}

	$css_rules = array();
	foreach ( $selector_styles as $selector => $styles ) {
		$declarations = gutenberg_style_engine_get_styles( array( 'transform' => $styles ) )['declarations'] ?? array();
		if ( ! empty( $declarations ) ) {
			$css_rules[] = array(
				'selector'     => $selector,
				'declarations' => $declarations,
			);
		}
	}

	if ( ! empty( $css_rules ) ) {
		$class_name = wp_unique_id_from_values( $css_rules, 'wp-transform-' );
		foreach ( $css_rules as $index => $css_rule ) {
			$css_rules[ $index ]['selector'] = gutenberg_build_state_selector( ".$class_name", $css_rule['selector'], '', $block['blockName'] );
		}

		gutenberg_style_engine_get_stylesheet_from_css_rules(
			$css_rules,
			array(
				'context'  => 'block-supports',
				'prettify' => false,
			)
		);
		$processor->add_class( $class_name );
	}

	return $processor->get_updated_html();
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'transform',
	array(
		'register_attribute' => 'gutenberg_register_transform_support',
	)
);

if ( function_exists( 'wp_render_transform_support' ) ) {
	remove_filter( 'render_block', 'wp_render_transform_support' );
}
add_filter( 'render_block', 'gutenberg_render_transform_support', 10, 2 );
