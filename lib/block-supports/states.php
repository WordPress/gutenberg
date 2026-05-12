<?php
/**
 * Block pseudo-state support for frontend CSS generation.
 *
 * Generates scoped CSS for per-instance pseudo-state styles (e.g., :hover, :focus)
 * declared in block attributes under `style[':hover']`, `style[':focus']`, etc.
 *
 * @package WordPress
 */

/**
 * Adds a fallback solid border style when border color or width is present.
 *
 * CSS does not render border color or width unless a border style is also set.
 * State styles are emitted as stylesheet rules rather than inline styles, so
 * they cannot rely on the block-library inline-style attribute fallback rules.
 *
 * @param array $border Border style object, optionally containing split side objects.
 * @return array Border style object with a fallback style applied where needed.
 */
function gutenberg_get_state_border_with_fallback_style( $border ) {
	if ( ! is_array( $border ) ) {
		return $border;
	}

	$sides      = array( 'top', 'right', 'bottom', 'left' );
	$has_sides  = false;
	$normalized = $border;

	foreach ( $sides as $side ) {
		if ( array_key_exists( $side, $border ) ) {
			$has_sides = true;
			break;
		}
	}

	if ( $has_sides ) {
		foreach ( $sides as $side ) {
			$normalized[ $side ] = gutenberg_get_state_border_with_fallback_style(
				$border[ $side ] ?? null
			);
		}
		return $normalized;
	}

	$has_color_or_width = ( isset( $border['color'] ) && '' !== $border['color'] ) ||
		( isset( $border['width'] ) && '' !== $border['width'] && 0 !== $border['width'] );
	if ( $has_color_or_width && empty( $border['style'] ) ) {
		$normalized['style'] = 'solid';
	}

	return $normalized;
}

/**
 * Adds fallback border styles to a state style object.
 *
 * @param array $style State style object that may contain a border object.
 * @return array State style object with fallback border styles applied where needed.
 */
function gutenberg_get_state_style_with_fallback_border_styles( $style ) {
	if ( ! is_array( $style ) || empty( $style['border'] ) || ! is_array( $style['border'] ) ) {
		return $style;
	}

	$style['border'] = gutenberg_get_state_border_with_fallback_style( $style['border'] );
	return $style;
}

/**
 * Converts internal preset references to CSS custom property references.
 *
 * State styles are emitted as CSS rules and cannot rely on preset classnames.
 * Converting `var:preset|color|contrast` to
 * `var(--wp--preset--color--contrast)` ensures preset values are emitted as
 * declarations by the style engine.
 *
 * @param mixed $value Style value to normalize.
 * @return mixed Normalized style value.
 */
function gutenberg_normalize_state_preset_vars( $value ) {
	if ( is_array( $value ) ) {
		foreach ( $value as $key => $nested_value ) {
			$value[ $key ] = gutenberg_normalize_state_preset_vars( $nested_value );
		}
		return $value;
	}

	if ( ! is_string( $value ) || ! str_starts_with( $value, 'var:preset|' ) ) {
		return $value;
	}

	$unwrapped_name = str_replace( '|', '--', substr( $value, strlen( 'var:' ) ) );
	return "var(--wp--$unwrapped_name)";
}

/**
 * Normalizes a state style object before generating CSS declarations.
 *
 * @param array $style State style object.
 * @return array Normalized state style object.
 */
function gutenberg_normalize_state_style_for_css_output( $style ) {
	$style = gutenberg_get_state_style_with_fallback_border_styles( $style );
	return gutenberg_normalize_state_preset_vars( $style );
}

/**
 * Renders per-instance pseudo-state styles on the frontend for blocks with
 * configured pseudo-state support.
 *
 * @param string $block_content The block's rendered HTML.
 * @param array  $block         The block data including blockName and attrs.
 * @return string Modified block content with injected pseudo-state styles.
 */
function gutenberg_render_block_states_support( $block_content, $block ) {
	if ( empty( $block['blockName'] ) || empty( $block_content ) ) {
		return $block_content;
	}

	$block_name = $block['blockName'];
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
	if ( ! $block_type ) {
		return $block_content;
	}

	$supported_states = WP_Theme_JSON_Gutenberg::VALID_BLOCK_PSEUDO_SELECTORS[ $block_name ] ?? null;
	if ( empty( $supported_states ) || ! is_array( $supported_states ) ) {
		return $block_content;
	}

	$style     = $block['attrs']['style'] ?? array();
	$css_rules = array();

	foreach ( $supported_states as $state ) {
		if ( empty( $style[ $state ] ) || ! is_array( $style[ $state ] ) ) {
			continue;
		}

		$compiled = wp_style_engine_get_styles(
			gutenberg_normalize_state_style_for_css_output( $style[ $state ] )
		);
		if ( ! empty( $compiled['declarations'] ) ) {
			$css_rules[] = array(
				'state'        => $state,
				'declarations' => $compiled['declarations'],
			);
		}
	}

	if ( empty( $css_rules ) ) {
		return $block_content;
	}

	$unique_class = 'wp-states-' . substr( md5( wp_json_encode( $css_rules ) ), 0, 8 );

	/*
	 * Register each pseudo-state's CSS rules with the block-supports style engine store.
	 * The store deduplicates rules by selector — two block instances with identical
	 * pseudo-state styles share the same hash class and therefore the same selector,
	 * so only one CSS rule is emitted. The store is flushed to the page by
	 * gutenberg_enqueue_stored_styles() rather than injected inline here.
	 *
	 * Preset utility classes (e.g. .has-accent-3-background-color) are generated
	 * with !important, so pseudo-state styles targeting the same properties must also
	 * use !important to win. Properties without preset utility classes don't need it.
	 */
	$preset_class_properties = array(
		'color',
		'background-color',
		'border-color',
		'border-width',
		'border-top-width',
		'border-right-width',
		'border-bottom-width',
		'border-left-width',
		'background',
		'font-size',
		'font-family',
	);

	$style_rules = array();
	foreach ( $css_rules as $rule ) {
		$declarations = array();
		foreach ( $rule['declarations'] as $property => $value ) {
			$declarations[ $property ] = in_array( $property, $preset_class_properties, true )
				? $value . ' !important'
				: $value;
		}
		$style_rules[] = array(
			'selector'     => ".$unique_class{$rule['state']}",
			'declarations' => $declarations,
		);
	}

	gutenberg_style_engine_get_stylesheet_from_css_rules(
		$style_rules,
		array(
			'context'  => 'block-supports',
			'prettify' => false,
		)
	);

	// Add the unique class to the interactive element so that pseudo-state
	// selectors like `.$unique_class:hover` match directly without needing a descendant.
	// If the block declares selectors.root with a descendant (e.g. the button
	// block's ".wp-block-button .wp-block-button__link"), we extract the last
	// class and walk to that element. Otherwise we fall back to the wrapper.
	$root_selector = $block_type->selectors['root'] ?? null;
	$target_class  = null;
	if ( $root_selector && preg_match( '/\.([a-zA-Z0-9_-]+)\s*$/', $root_selector, $matches ) ) {
		$target_class = $matches[1];
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( $target_class ) {
		while ( $processor->next_tag() ) {
			if ( $processor->has_class( $target_class ) ) {
				$processor->add_class( $unique_class );
				break;
			}
		}
	} elseif ( $processor->next_tag() ) {
		$processor->add_class( $unique_class );
	}
	return $processor->get_updated_html();
}
add_filter( 'render_block', 'gutenberg_render_block_states_support', 10, 2 );
