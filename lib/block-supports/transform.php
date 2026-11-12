<?php
/**
 * Transform block support flag.
 *
 * Each transform feature outputs its own individual CSS property, such as
 * `rotate`, `translate` or `scale`, never the `transform` shorthand, so features
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
 * Fills the missing axis of a `translate` value from fallback values.
 *
 * CSS `translate` holds both axes, so a value that sets one axis replaces the
 * other. Each missing axis takes the first valid value for it among the
 * fallbacks, in order, so the axis renders as it did before.
 *
 * @since 7.3.0
 *
 * @param mixed $translate    The `translate` value, with `x` and `y` axes.
 * @param array ...$fallbacks The `translate` values to fill from, in order.
 * @return mixed The value with its missing axes filled, or the value as it was
 *               if it is not a value with one axis.
 */
function gutenberg_fill_translate_axes( $translate, ...$fallbacks ) {
	if ( ! is_array( $translate ) || ( isset( $translate['x'] ) === isset( $translate['y'] ) ) ) {
		return $translate;
	}

	foreach ( array( 'x', 'y' ) as $axis ) {
		if ( isset( $translate[ $axis ] ) ) {
			continue;
		}
		foreach ( $fallbacks as $fallback ) {
			$value = is_array( $fallback ) ? ( $fallback[ $axis ] ?? null ) : null;
			if ( is_string( $value ) && preg_match( WP_Style_Engine_Gutenberg::VALID_LENGTH_PERCENTAGE_PATTERN, $value ) ) {
				$translate[ $axis ] = $value;
				break;
			}
		}
	}

	return $translate;
}

/**
 * Returns the Global Styles `translate` value for a block, merged per axis
 * from the block type and its applied block style variations.
 *
 * Mirror of the inherited value the block inspector shows.
 *
 * @since 7.3.0
 *
 * @param string $block_name Block name.
 * @param mixed  $class_name The block's `className` attribute.
 * @return array The `translate` value, empty if Global Styles sets none.
 */
function gutenberg_get_global_styles_translate( $block_name, $class_name ) {
	$block_styles = _wp_array_get( gutenberg_get_global_styles(), array( 'blocks', $block_name ), null );
	if ( ! is_array( $block_styles ) ) {
		return array();
	}

	$layers = array( $block_styles['transform']['translate'] ?? null );
	foreach ( gutenberg_get_block_style_variation_name_from_class( $class_name ) ?? array() as $variation ) {
		$layers[] = $block_styles['variations'][ $variation ]['transform']['translate'] ?? null;
	}

	$translate = array();
	foreach ( $layers as $layer ) {
		foreach ( array( 'x', 'y' ) as $axis ) {
			if ( isset( $layer[ $axis ] ) ) {
				$translate[ $axis ] = $layer[ $axis ];
			}
		}
	}

	return $translate;
}

/**
 * Fills the missing `translate` axis of a block's styles, in every state.
 *
 * Each value fills from the block values it layers over, then from Global
 * Styles: the default value from Global Styles alone, `@mobile` and `:hover`
 * from the default value, and `@mobile` `:hover` from `:hover`, then
 * `@mobile`, then the default value. The values are filled when the block is
 * output, so later Global Styles changes still apply.
 *
 * @since 7.3.0
 *
 * @param array  $style      The block's `style` attribute.
 * @param string $block_name Block name.
 * @param mixed  $class_name The block's `className` attribute.
 * @return array The styles with the missing axes filled.
 */
function gutenberg_get_block_style_with_filled_translate( $style, $block_name, $class_name ) {
	if ( ! is_array( $style ) ) {
		return $style;
	}

	$global_translate = null;
	$fill             = static function ( $state_style, ...$fallbacks ) use ( &$global_translate, $block_name, $class_name ) {
		$translate = $state_style['transform']['translate'] ?? null;
		if ( ! is_array( $translate ) || isset( $translate['x'] ) === isset( $translate['y'] ) ) {
			return $state_style;
		}
		if ( null === $global_translate ) {
			$global_translate = gutenberg_get_global_styles_translate( $block_name, $class_name );
		}
		$fallbacks[]                           = $global_translate;
		$state_style['transform']['translate'] = gutenberg_fill_translate_axes( $translate, ...$fallbacks );
		return $state_style;
	};

	$style             = $fill( $style );
	$default_translate = $style['transform']['translate'] ?? null;

	$states = array();
	foreach ( $style as $state => $state_style ) {
		if ( is_string( $state ) && in_array( $state[0] ?? '', array( '@', ':' ), true ) && is_array( $state_style ) ) {
			$states[]        = $state;
			$style[ $state ] = $fill( $state_style, $default_translate );
		}
	}

	foreach ( $states as $viewport ) {
		if ( '@' !== $viewport[0] ) {
			continue;
		}
		foreach ( $style[ $viewport ] as $pseudo_state => $pseudo_style ) {
			if ( ! is_string( $pseudo_state ) || ':' !== ( $pseudo_state[0] ?? '' ) || ! is_array( $pseudo_style ) ) {
				continue;
			}
			$style[ $viewport ][ $pseudo_state ] = $fill(
				$pseudo_style,
				$style[ $pseudo_state ]['transform']['translate'] ?? null,
				$style[ $viewport ]['transform']['translate'] ?? null,
				$default_translate
			);
		}
	}

	return $style;
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

	if ( isset( $transform['translate'] ) ) {
		$transform['translate'] = gutenberg_get_block_style_with_filled_translate(
			array( 'transform' => $transform ),
			$block['blockName'],
			$block['attrs']['className'] ?? null
		)['transform']['translate'];
	}

	// A numeric zero would be dropped by the style engine as an empty value.
	if ( isset( $transform['scale'] ) ) {
		$transform['scale'] = WP_Style_Engine_Gutenberg::get_scale_css_value( $transform['scale'] );
	}

	$inline_styles   = array();
	$selector_styles = array();

	foreach ( array( 'rotate', 'translate', 'scale' ) as $feature ) {
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
