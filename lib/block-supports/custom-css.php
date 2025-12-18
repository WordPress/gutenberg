<?php
/**
 * Custom CSS block support.
 *
 * @package gutenberg
 */

/**
 * Stores the custom CSS for block instances to be output in the footer.
 *
 * @var string
 */
global $gutenberg_block_custom_css;
$gutenberg_block_custom_css = '';

/**
 * Get the custom CSS class name for a block.
 *
 * @since 7.0.0
 *
 * @param array $block Block object.
 * @return string The custom CSS class name.
 */
function gutenberg_get_custom_css_class_name( $block ) {
	return wp_unique_id_from_values( $block, 'wp-custom-css-' );
}

/**
 * Render the custom CSS stylesheet and add class name to block as required.
 *
 * @since 7.0.0
 *
 * @param array $parsed_block The parsed block.
 * @return array The same parsed block with custom CSS class name added if appropriate.
 */
function gutenberg_render_custom_css_support_styles( $parsed_block ) {
	global $gutenberg_block_custom_css;

	$custom_css = $parsed_block['attrs']['style']['css'] ?? null;

	if ( empty( $custom_css ) ) {
		return $parsed_block;
	}

	// Generate a unique class name for this block instance.
	$class_name         = gutenberg_get_custom_css_class_name( $parsed_block );
	$updated_class_name = isset( $parsed_block['attrs']['className'] )
		? $parsed_block['attrs']['className'] . " $class_name"
		: $class_name;

	_wp_array_set( $parsed_block, array( 'attrs', 'className' ), $updated_class_name );

	// Process the custom CSS using the same method as global styles.
	$selector      = '.' . $class_name;
	$processed_css = WP_Theme_JSON_Gutenberg::process_blocks_custom_css( $custom_css, $selector );

	if ( ! empty( $processed_css ) ) {
		// Store the CSS to be output later.
		$gutenberg_block_custom_css .= $processed_css;
	}

	return $parsed_block;
}

/**
 * Outputs the collected block custom CSS in the footer.
 *
 * The CSS is output in the footer because it's collected during block rendering
 * (via render_block_data filter), which happens after wp_head.
 *
 * @since 7.0.0
 */
function gutenberg_output_block_custom_css() {
	global $gutenberg_block_custom_css;

	if ( empty( $gutenberg_block_custom_css ) ) {
		return;
	}

	echo '<style id="wp-block-custom-css">' . $gutenberg_block_custom_css . '</style>';
}

/**
 * Applies the custom CSS class name to the block's rendered HTML.
 *
 * The class name is generated in `gutenberg_render_custom_css_support_styles`
 * and stored in block attributes. This filter adds it to the actual markup.
 *
 * @since 7.0.0
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 * @return string               Filtered block content.
 */
function gutenberg_render_custom_css_class_name( $block_content, $block ) {
	$class_string = $block['attrs']['className'] ?? '';
	preg_match( '/\bwp-custom-css-\S+\b/', $class_string, $matches );

	if ( empty( $matches ) ) {
		return $block_content;
	}

	$tags = new WP_HTML_Tag_Processor( $block_content );

	if ( $tags->next_tag() ) {
		$tags->add_class( $matches[0] );
	}

	return $tags->get_updated_html();
}

add_filter( 'render_block', 'gutenberg_render_custom_css_class_name', 10, 2 );
add_filter( 'render_block_data', 'gutenberg_render_custom_css_support_styles', 10, 1 );
add_action( 'wp_footer', 'gutenberg_output_block_custom_css' );
