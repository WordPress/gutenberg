<?php
/**
 * Descendent blocks styles block support.
 *
 * @package gutenberg
 */

/**
 * Get the class names used on descend block styles
 *
 * @param array $block Block object.
 * @return string      The unique class name.
 */
function gutenberg_get_block_styles_class_name( $block ) {
	return 'wp-descendent-blocks-styles-' . md5( serialize( $block ) );
}

/**
 * Update the block content with descend block styles class names.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_descendent_block_styles_support( $block_content, $block ) {
	if ( ! $block_content ) {
		return $block_content;
	}

	// return early if the block has not support for descendent block styles.
	$block_type           = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	if ( ! block_has_support( $block_type, array( '__experimentalDescendentStyles' ), false ) ) {
		return $block_content;
	}

	// return early if no descendent blocks are found on the block attributes.
	$block_styles = _wp_array_get( $block, array( 'attrs', 'style', 'blocks' ), null );
	if ( empty( $block_styles ) ) {
		return $block_content;
	}

	$class_name = gutenberg_get_block_styles_class_name( $block );

	// Like the layout hook this assumes the hook only applies to blocks with a single wrapper.
	// Retrieve the opening tag of the first HTML element.
	$html_element_matches = array();
	preg_match( '/<[^>]+>/', $block_content, $html_element_matches, PREG_OFFSET_CAPTURE );
	$first_element = $html_element_matches[0][0];
	// If the first HTML element has a class attribute just add the new class
	// as we do on layout and duotone.
	if ( strpos( $first_element, 'class="' ) !== false ) {
		$content = preg_replace(
			'/' . preg_quote( 'class="', '/' ) . '/',
			'class="' . $class_name . ' ',
			$block_content,
			1
		);
	} else {
		// If the first HTML element has no class attribute we should inject the attribute before the attribute at the end.
		$first_element_offset = $html_element_matches[0][1];
		$content              = substr_replace( $block_content, ' class="' . $class_name . '"', $first_element_offset + strlen( $first_element ) - 1, 0 );
	}

	return $content;
}

/**
 * Render the descendent block styles stylesheet.
 *
 * @param string|null $pre_render   The pre-rendered content. Default null.
 * @param array       $block The block being rendered.
 *
 * @return null
 */
function gutenberg_render_descendent_block_styles_support_styles( $pre_render, $block ) {
	// Return early if the block has not support for descendent block styles.
	$block_type           = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	if ( ! block_has_support( $block_type, array( '__experimentalDescendentStyles' ), false ) ) {
		return null;
	}

	// Return early if no descendent blocks are found on the block attributes.
	$block_styles = _wp_array_get( $block, array( 'attrs', 'style', 'blocks' ), null );
	if ( empty( $block_styles ) ) {
		return null;
	}

	$class_name = gutenberg_get_block_styles_class_name( $block );

	// Remove any potentially unsafe styles.
	$theme_json_shape = WP_Theme_JSON_Gutenberg::remove_insecure_properties( array(
		'version' =>  WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
		'styles' => array(
			'blocks' => $block_styles,
		),
	) );

	$styles = '';

	$theme_json_object = new WP_Theme_JSON_Gutenberg( $theme_json_shape );
	$block_nodes       = $theme_json_object->get_styles_block_nodes();
	foreach ( $block_nodes as $block_node ) {
		$block_node['selector'] = WP_Theme_JSON_Gutenberg::scope_selector( '.' . $class_name, $block_node['selector'] );
		$styles .= $theme_json_object->get_styles_for_block( $block_node );
	}

	if ( ! empty( $styles ) ) {
		gutenberg_enqueue_block_support_styles( $styles );
	}

	return null;
}

add_filter( 'render_block', 'gutenberg_render_descendent_block_styles_support', 10, 2 );
add_filter( 'pre_render_block', 'gutenberg_render_descendent_block_styles_support_styles', 10, 2 );
