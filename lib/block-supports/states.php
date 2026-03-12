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
		$css .= ".$unique_class$rule[state] { $rule[css] }\n";
	}

	// Inject the unique class into the first element of the block content.
	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( $processor->next_tag() ) {
		$processor->add_class( $unique_class );
		$block_content = $processor->get_updated_html();
	}

	return '<style>' . $css . '</style>' . $block_content;
}
add_filter( 'render_block', 'gutenberg_render_block_states_support', 10, 2 );
