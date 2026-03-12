<?php
/**
 * Block states support for frontend CSS generation.
 *
 * Generates scoped CSS for per-instance pseudo-state styles (e.g., :hover, :focus)
 * declared in block attributes under `style[':hover']`, `style[':focus']`, etc.
 *
 * @package WordPress
 */

/**
 * Renders per-instance state styles on the frontend for blocks that declare
 * `__experimentalStates` support.
 *
 * @param string $block_content The block's rendered HTML.
 * @param array  $block         The block data including blockName and attrs.
 * @return string Modified block content with injected state styles.
 */
function gutenberg_render_block_states_support( $block_content, $block ) {
	if ( empty( $block['blockName'] ) || empty( $block_content ) ) {
		return $block_content;
	}

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	if ( ! $block_type ) {
		return $block_content;
	}

	$supported_states = $block_type->supports['__experimentalStates'] ?? null;
	if ( empty( $supported_states ) || ! is_array( $supported_states ) ) {
		return $block_content;
	}

	$style = $block['attrs']['style'] ?? array();
	$css_rules = array();

	foreach ( $supported_states as $state ) {
		if ( empty( $style[ $state ] ) || ! is_array( $style[ $state ] ) ) {
			continue;
		}

		$compiled = wp_style_engine_get_styles( $style[ $state ] );
		if ( ! empty( $compiled['css'] ) ) {
			$css_rules[] = array(
				'state' => $state,
				'css'   => $compiled['css'],
			);
		}
	}

	if ( empty( $css_rules ) ) {
		return $block_content;
	}

	$unique_class = 'wp-states-' . substr( md5( wp_json_encode( $css_rules ) ), 0, 8 );
	$css          = '';

	foreach ( $css_rules as $rule ) {
		// Use !important to override utility classes like
		// .has-accent-3-background-color which are generated with !important.
		$declarations = str_replace( ';', ' !important;', $rule['css'] );
		$css         .= ".$unique_class$rule[state] { $declarations }\n";
	}

	// Add the unique class to the interactive element so that state selectors
	// like `.$unique_class:hover` match directly without needing a descendant.
	// If the block declares selectors.root with a descendant (e.g. the button
	// block's ".wp-block-button .wp-block-button__link"), we extract the last
	// class and walk to that element. Otherwise we fall back to the wrapper.
	$root_selector = $block_type->selectors['root'] ?? null;
	$target_class  = null;
	if ( $root_selector && preg_match( '/\.([a-zA-Z0-9_-]+)\s*$/', $root_selector, $matches ) ) {
		$target_class = $matches[1];
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );
	$found     = false;
	if ( $target_class ) {
		while ( $processor->next_tag() ) {
			if ( $processor->has_class( $target_class ) ) {
				$processor->add_class( $unique_class );
				$found = true;
				break;
			}
		}
	}
	if ( ! $found ) {
		// No target class found or no selectors.root — add to the wrapper.
		$processor = new WP_HTML_Tag_Processor( $block_content );
		if ( $processor->next_tag() ) {
			$processor->add_class( $unique_class );
		}
	}
	$block_content = $processor->get_updated_html();

	return '<style>' . $css . '</style>' . $block_content;
}
add_filter( 'render_block', 'gutenberg_render_block_states_support', 10, 2 );
