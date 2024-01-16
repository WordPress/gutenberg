<?php
/**
 * Block support to enable per-section styling of block types via
 * block style variations.
 *
 * @package gutenberg
 */

/**
 * Get the class name for this application of this blocks variation styles.
 *
 * @param array  $block     Block object.
 * @param string $variation Slug for the variation..
 *
 * @return string The unique class name.
 */
function gutenberg_get_variation_class_name( $block, $variation ) {
	return 'is-style-' . $variation . '-' . md5( serialize( $block ) );
}

/**
 * Update the block content with the variation's class name.
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 *
 * @return string Filtered block content.
 */
function gutenberg_render_variation_support( $block_content, $block ) {
	if ( ! $block_content || empty( $block['attrs'] ) ) {
		return $block_content;
	}

	// Apply the variation's classname. Like the layout hook, this assumes the
	// hook only applies to blocks with a single wrapper.
	$tags = new WP_HTML_Tag_Processor( $block_content );

	if ( $tags->next_tag() ) {
		preg_match( '/\bis-style-(\S+)\b/', $tags->get_attribute( 'class' ), $matches );
		$variation = $matches[1] ?? null;

		if ( $variation ) {
			$tree       = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
			$theme_json = $tree->get_raw_data();

			if ( ! empty( $theme_json['styles']['blocks'][ $block['blockName'] ]['variations'][ $variation ] ) ) {
				$tags->add_class( gutenberg_get_variation_class_name( $block, $variation ) );
			}
		}
	}

	return $tags->get_updated_html();
}

/**
 * Render the block style variation's styles.
 *
 * In the case of nested blocks with variations applies, we want the parent
 * variation's styles to be rendered before their descendants. This solves the
 * issue of a block type being styled in both the parent and descendant: we want
 * the descendant style to take priority, and this is done by loading it after,
 * in the DOM order. This is why the variation stylesheet generation is in a
 * different filter.
 *
 * @param string|null $pre_render The pre-rendered content. Default null.
 * @param array       $block      The block being rendered.
 *
 * @return null
 */
function gutenberg_render_variation_support_styles( $pre_render, $block ) {
	$variation = $block['attrs']['style']['variation'] ?? null;

	if ( ! $variation ) {
		return null;
	}

	$tree           = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
	$theme_json     = $tree->get_raw_data();
	$variation_data = $theme_json['styles']['blocks'][ $block['blockName'] ]['variations'][ $variation ] ?? array();

	if ( empty( $variation_data['elements'] ) && empty( $variation_data['blocks'] ) ) {
		return null;
	}

	$config = array(
		'version' => 2,
		'styles'  => $variation_data,
	);

	$class_name = gutenberg_get_variation_class_name( $block, $variation );
	$class_name = ".$class_name";

	$variation_theme_json = new WP_Theme_JSON_Gutenberg( $config, 'blocks' );
	$variation_styles     = $variation_theme_json->get_stylesheet(
		array( 'styles' ),
		array( 'custom' ),
		array(
			'root_selector'           => $class_name,
			'skip_root_layout_styles' => true,
			'scope'                   => $class_name,
		)
	);

	if ( empty( $variation_styles ) ) {
		return null;
	}

	wp_register_style( 'variation-styles', false );
	wp_add_inline_style( 'variation-styles', $variation_styles );
	wp_enqueue_style( 'variation-styles' );
}


// Register the block support.
WP_Block_Supports::get_instance()->register( 'variation', array() );

add_filter( 'pre_render_block', 'gutenberg_render_variation_support_styles', 10, 2 );
add_filter( 'render_block', 'gutenberg_render_variation_support', 10, 2 );
