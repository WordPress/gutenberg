<?php
/**
 * Compatibility shims for KSES (content filtering) for WordPress 7.0.
 *
 * @package gutenberg
 */

/**
 * Add 'display' to the list of safe CSS properties.
 * This is needed for viewport visibility support.
 *
 * @param array $attr List of allowed CSS attributes.
 * @return array Modified list of allowed CSS attributes.
 */
function gutenberg_add_display_to_safe_style_css( $attr ) {
	if ( ! in_array( 'display', $attr, true ) ) {
		$attr[] = 'display';
	}

	return $attr;
}
add_filter( 'safe_style_css', 'gutenberg_add_display_to_safe_style_css' );

/**
 * Encodes the custom CSS attribute of a single block, recursing into innerBlocks.
 *
 * All CSS values are base64-encoded so they survive wp_kses processing
 * unchanged. Already-encoded values are left untouched.
 *
 * Migration note: once a proper CSS sanitizer API lands in WordPress core, remove this function
 * and `gutenberg_encode_custom_css_for_kses` together with the `encodeCSSAttribute`
 * call in the JS `onChange` handler. Both encode steps must be removed in the
 * same release to avoid a mixed storage state. Keep the decode shims
 * (`gutenberg_decode_custom_css_attribute_for_display` and JS
 * `decodeCSSAttribute`) as read-time shims for backward compatibility.
 *
 * @since 7.0.0
 *
 * @param array $block Parsed block (may contain innerBlocks).
 * @return array Block with custom CSS attribute encoded.
 */
function gutenberg_encode_block_custom_css( $block ) {
	if ( ! empty( $block['innerBlocks'] ) ) {
		$block['innerBlocks'] = array_map( 'gutenberg_encode_block_custom_css', $block['innerBlocks'] );
	}

	$css = $block['attrs']['style']['css'] ?? null;
	if ( $css && ! str_starts_with( $css, 'data:text/css;base64,' ) ) {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		$block['attrs']['style']['css'] = 'data:text/css;base64,' . base64_encode( $css );
	}

	return $block;
}

/**
 * Encodes custom CSS block attributes before wp_kses can corrupt them.
 *
 * Hooks into `pre_kses` at priority 9 (before `wp_pre_kses_block_attributes`
 * at priority 10). Parses the block tree, base64-encodes all custom CSS
 * attribute values, then re-serializes — the same parse → mutate → serialize
 * pattern that `wp_pre_kses_block_attributes` itself uses, so no block
 * validation issues arise.
 *
 * Covers all save paths (REST API, WP-CLI, programmatic `wp_insert_post`)
 * regardless of whether the JS editor encoded the value first.
 *
 * Migration note: see `gutenberg_encode_block_custom_css`.
 *
 * @since 7.0.0
 *
 * @param string $content Post content about to be processed by wp_kses.
 * @return string Content with custom CSS attributes encoded.
 */
function gutenberg_encode_custom_css_for_kses( $content ) {
	if ( ! has_blocks( $content ) ) {
		return $content;
	}
	$blocks = array_map( 'gutenberg_encode_block_custom_css', parse_blocks( $content ) );
	return serialize_blocks( $blocks );
}
add_filter( 'pre_kses', 'gutenberg_encode_custom_css_for_kses', 9 );
