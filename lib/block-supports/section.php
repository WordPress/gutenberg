<?php
/**
 * Section support to enable per-section styling of block types.
 *
 * @package gutenberg
 */

/**
 * Get the section class name.
 *
 * @param array $block Block object.
 * @return string The unique class name.
 */
function gutenberg_get_section_class_name( $block ) {
	return 'wp-section-' . md5( serialize( $block ) );
}

/**
 * Registers the style attribute used by the section styling feature, if needed.
 *
 * @param WP_Block_Type $block_type Block type.
 */
function gutenberg_register_section_support( $block_type ) {
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array( 'type' => 'object' );
	}
}

/**
 * Update the block content with the section's class name.
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 *
 * @return string Filtered block content.
 */
function gutenberg_render_section_support( $block_content, $block ) {
	if ( ! $block_content || empty( $block['attrs'] ) ) {
		return $block_content;
	}

	// While section styling is being explored, the blocks allowed to support
	// it will be restricted.
	$allow_list = array( 'core/group' );

	if ( ! in_array( $block['blockName'], $allow_list, true ) ) {
		return $block_content;
	}

	// Skip if there are no block types within this block's styles attribute.
	$block_type_styles = _wp_array_get( $block, array( 'attrs', 'style', 'blocks' ), array() );

	if ( ! count( $block_type_styles ) ) {
		return $block_content;
	}

	// Apply the section's classname. Like the layout hook, this assumes the
	// hook only applies to blocks with a single wrapper.
	$tags = new WP_HTML_Tag_Processor( $block_content );

	if ( $tags->next_tag() ) {
		$tags->add_class( gutenberg_get_section_class_name( $block ) );
	}

	return $tags->get_updated_html();
}

/**
 * Render the section's styles.
 *
 * In the case of nested sections, we want the parent section's styles to be
 * rendered before their descendants. This solves the issue of a block type
 * being styled in both the parent and descendant: we want the descendant style
 * to take priority, and this is done by loaded it after, in the DOM order.
 *
 * @param string|null $pre_render The pre-rendered content. Default null.
 * @param array       $block      The block being rendered.
 *
 * @return null
 */
function gutenberg_render_section_support_styles( $pre_render, $block ) {
	$section_block_styles = _wp_array_get( $block, array( 'attrs', 'style', 'blocks' ), null );

	if ( ! $section_block_styles ) {
		return null;
	}

	$class_name = gutenberg_get_section_class_name( $block );
	$config     = array(
		'version' => 2,
		'styles'  => array( 'blocks' => $section_block_styles ),
	);

	$theme_json     = new WP_Theme_JSON_Gutenberg( $config, 'blocks' );
	$section_styles = $theme_json->get_stylesheet(
		array( 'styles' ),
		array( 'custom' ),
		array(
			'skip_root_layout_styles' => true,
			'scope'                   => ".$class_name",
		)
	);

	if ( empty( $section_styles ) ) {
		return null;
	}

	wp_register_style( 'section-styles', false );
	wp_add_inline_style( 'section-styles', $section_styles );
	wp_enqueue_style( 'section-styles' );
}


// Register the block support.
WP_Block_Supports::get_instance()->register(
	'section',
	array( 'register_attribute' => 'gutenberg_register_section_support' )
);

add_filter( 'pre_render_block', 'gutenberg_render_section_support_styles', 10, 2 );
add_filter( 'render_block', 'gutenberg_render_section_support', 10, 2 );
