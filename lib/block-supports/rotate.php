<?php
/**
 * Rotate block support flag.
 *
 * Blocks support rotation unless they opt out with `supports.rotate: false`.
 * The rotation is a number of degrees stored in `style.rotate`, with viewport
 * overrides in `style['@tablet'].rotate` and `style['@mobile'].rotate`.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support rotation.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_rotate_support( $block_type ) {
	if ( ! block_has_support( $block_type, 'rotate', true ) ) {
		return;
	}

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	// Check for existing style attribute definition e.g. from block.json.
	if ( ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Reads a stored rotation, which is a number of degrees.
 *
 * Block attributes are untrusted, so anything that is not numeric is ignored.
 * The angle is rounded to two decimals and wrapped into the (-180, 180] range.
 *
 * @param mixed $value Stored rotation.
 * @return float|null The rotation in degrees, or null when the value is not a rotation.
 */
function gutenberg_get_rotate_value( $value ) {
	// PHP 7 rejects numeric strings with trailing whitespace, PHP 8 accepts them.
	if ( is_string( $value ) ) {
		$value = trim( $value );
	}
	if ( ! is_numeric( $value ) ) {
		return null;
	}

	$angle = (float) $value;
	if ( ! is_finite( $angle ) ) {
		return null;
	}

	$angle = fmod( round( $angle, 2 ), 360 );
	if ( $angle <= -180 ) {
		$angle += 360;
	} elseif ( $angle > 180 ) {
		$angle -= 360;
	}

	// Avoid returning -0.
	return 0.0 === $angle ? 0.0 : $angle;
}

/**
 * Builds the CSS rules that rotate a block, without their selector.
 *
 * The `rotate` property is used rather than `transform` so that it combines with any
 * transforms a theme or block applies. In a viewport override, 0 undoes the default
 * rotation, so it is output as `none`.
 *
 * @param array $style                    Block style attribute.
 * @param array $responsive_media_queries Media queries keyed by viewport state, e.g. `@mobile`.
 * @return array[] CSS rules with `declarations` and, for viewport overrides, `rules_group`.
 */
function gutenberg_get_rotate_style_rules( $style, $responsive_media_queries ) {
	$rules  = array();
	$rotate = gutenberg_get_rotate_value( $style['rotate'] ?? null );

	if ( $rotate ) {
		$rules[] = array(
			'declarations' => array( 'rotate' => $rotate . 'deg' ),
		);
	}

	foreach ( $responsive_media_queries as $breakpoint => $media_query ) {
		if ( ! isset( $style[ $breakpoint ] ) || ! is_array( $style[ $breakpoint ] ) ) {
			continue;
		}

		$viewport_rotate = gutenberg_get_rotate_value( $style[ $breakpoint ]['rotate'] ?? null );
		if ( null === $viewport_rotate ) {
			continue;
		}

		$rules[] = array(
			'rules_group'  => $media_query,
			'declarations' => array( 'rotate' => $viewport_rotate ? $viewport_rotate . 'deg' : 'none' ),
		);
	}

	return $rules;
}

/**
 * Rotates a block on the front end.
 *
 * The rules are added to the block supports stylesheet under a class generated from
 * them, the default rotation first, so that viewport overrides win.
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 * @return string Filtered block content.
 */
function gutenberg_render_rotate_support( $block_content, $block ) {
	$style = $block['attrs']['style'] ?? null;
	if ( empty( $block_content ) || empty( $block['blockName'] ) || ! is_array( $style ) ) {
		return $block_content;
	}

	$has_viewport_rotate = false;
	foreach ( $style as $key => $value ) {
		if ( is_string( $key ) && str_starts_with( $key, '@' ) && is_array( $value ) && array_key_exists( 'rotate', $value ) ) {
			$has_viewport_rotate = true;
			break;
		}
	}

	if ( ! array_key_exists( 'rotate', $style ) && ! $has_viewport_rotate ) {
		return $block_content;
	}

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	if ( ! $block_type || ! block_has_support( $block_type, 'rotate', true ) ) {
		return $block_content;
	}

	// A block's own `style` attribute that is not an object doesn't hold a rotation.
	$style_attribute_type = $block_type->attributes['style']['type'] ?? 'object';
	if ( 'object' !== $style_attribute_type ) {
		return $block_content;
	}

	// Only resolve the global settings when there is a viewport override to place.
	$responsive_media_queries = $has_viewport_rotate
		? WP_Theme_JSON_Gutenberg::get_viewport_media_queries( gutenberg_get_global_settings( array( 'viewport' ) ) )
		: array();
	$rules                    = gutenberg_get_rotate_style_rules( $style, $responsive_media_queries );
	if ( empty( $rules ) ) {
		return $block_content;
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( ! $processor->next_tag() ) {
		return $block_content;
	}

	$class_name = wp_unique_id_from_values( $rules, 'wp-rotate-' );
	foreach ( $rules as $index => $rule ) {
		$rules[ $index ]['selector'] = ".$class_name";
	}

	gutenberg_style_engine_get_stylesheet_from_css_rules(
		$rules,
		array(
			'context'  => 'block-supports',
			'prettify' => false,
		)
	);

	$processor->add_class( $class_name );

	return $processor->get_updated_html();
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'rotate',
	array(
		'register_attribute' => 'gutenberg_register_rotate_support',
	)
);

add_filter( 'render_block', 'gutenberg_render_rotate_support', 10, 2 );
