<?php
/**
 * Server-side rendering of the `core/navigation` block.
 *
 * @package gutenberg
 */

/**
 * Returns the top-level submenu SVG chevron icon.
 *
 * @return string
 */
function block_core_navigation_render_submenu_icon() {
	return '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" transform="rotate(90)"><path d="M8 5v14l11-7z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
}

/**
 * Renders the `core/navigation` block on server.
 *
 * @param array $attributes The block attributes.
 * @param array $content The saved content.
 * @param array $block The parsed block.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_core_navigation( $attributes, $content, $block ) {
	/**
	 * Deprecated:
	 * The rgbTextColor and rgbBackgroundColor attributes
	 * have been deprecated in favor of
	 * customTextColor and customBackgroundColor ones.
	 * Move the values from old attrs to the new ones.
	 */
	if ( isset( $attributes['rgbTextColor'] ) && empty( $attributes['textColor'] ) ) {
		$attributes['customTextColor'] = $attributes['rgbTextColor'];
	}

	if ( isset( $attributes['rgbBackgroundColor'] ) && empty( $attributes['backgroundColor'] ) ) {
		$attributes['customBackgroundColor'] = $attributes['rgbBackgroundColor'];
	}

	unset( $attributes['rgbTextColor'], $attributes['rgbBackgroundColor'] );

	if ( empty( $block->inner_blocks ) ) {
		return '';
	}

	$classes = array_merge(
		( isset( $attributes['orientation'] ) && 'vertical' === $attributes['orientation'] ) ? array( 'is-vertical' ) : array(),
		isset( $attributes['itemsJustification'] ) ? array( 'items-justified-' . $attributes['itemsJustification'] ) : array()
	);

	$inner_blocks_html = '';
	foreach ( $block->inner_blocks as $inner_block ) {
		$inner_blocks_html .= $inner_block->render();
	}

	$block_styles = isset( $attributes['styles'] ) ? $attributes['styles'] : '';

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => implode( ' ', $classes ),
			'style' => $block_styles,
		)
	);

	return sprintf(
		'<nav %1$s><ul class="wp-block-navigation__container">%2$s</ul></nav>',
		$wrapper_attributes,
		$inner_blocks_html
	);
}

/**
 * Register the navigation block.
 *
 * @uses render_block_core_navigation()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_core_navigation() {
	register_block_type_from_metadata(
		__DIR__ . '/navigation',
		array(
			'render_callback' => 'render_block_core_navigation',
		)
	);
}

add_action( 'init', 'register_block_core_navigation' );
