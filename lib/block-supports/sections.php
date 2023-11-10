<?php
/**
 * Section support to enable per-section styling via theme.json partials.
 *
 * @package gutenberg
 */

/**
 * Get the section class name.
 *
 * If the block's section index isn't available, a fallback will be determined
 * and the generated class name will reflect that.
 *
 * @param array $block Block object.
 * @return string The section's class name.
 */
function gutenberg_get_section_class_name( $block ) {
	if ( ! isset( $block['attrs']['section'] ) ) {
		return null;
	}

	// Confirm that a section at the specified index exists.

	// TODO: Improve the logic here to handle when sections are deleted and new
	// sections created after the fact.

	$tree = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
	$theme_json = $tree->get_raw_data();
	$section_count = count( $theme_json['styles']['sections'] ?? [] );

	if ( ! $section_count ) {
		return null;
	}

	$section_index = min( $block['attrs']['section'], $section_count - 1 );

	return 'wp-section-' . $section_index;
}

/**
 * Registers the section attribute, if needed.
 *
 * @param WP_Block_Type $block_type Block type.
 */
function gutenberg_register_section_support( $block_type ) {
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	$has_section_support = block_has_support( $block_type, array( 'section' ), false );

	if ( $has_section_support && ! array_key_exists( 'section', $block_type->attributes ) ) {
		$block_type->attributes['section'] = array( 'type' => 'number' );
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
	if ( ! $block_content || ! isset( $block['attrs']['section'] ) ) {
		return $block_content;
	}

	// While section styling is being explored, the blocks allowed to support
	// it will be restricted.
	$allow_list = array( 'core/group' );

	if ( ! in_array( $block['blockName'], $allow_list, true ) ) {
		return $block_content;
	}

	// Apply the section's classname. Like the layout hook, this assumes the
	// hook only applies to blocks with a single wrapper.
	$tags          = new WP_HTML_Tag_Processor( $block_content );
	$section_class = gutenberg_get_section_class_name( $block );

	if ( $tags->next_tag() ) {
		$tags->add_class( $section_class );
	}

	return $tags->get_updated_html();
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'section',
	array( 'register_attribute' => 'gutenberg_register_section_support' )
);

add_filter( 'render_block', 'gutenberg_render_section_support', 10, 2 );

