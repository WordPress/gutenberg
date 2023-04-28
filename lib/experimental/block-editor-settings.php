<?php
/**
 * Adds settings to the block editor.
 *
 * @package gutenberg
 */

/**
 * Finds the first occurrence of a specific block in an array of blocks.
 *
 * @param string $block_name Name of the block to find.
 * @param array  $blocks     Array of blocks.
 * @return array Found block, or empty array if none found.
 */
function gutenberg_find_first_block( $block_name, $blocks ) {
	foreach ( $blocks as $block ) {
		if ( $block_name === $block['blockName'] ) {
			return $block;
		}
		if ( ! empty( $block['innerBlocks'] ) ) {
			$found_block = gutenberg_find_first_block( $block_name, $block['innerBlocks'] );

			if ( ! empty( $found_block ) ) {
				return $found_block;
			}
		}
	}

	return array();
}

/**
 * Adds styles and __experimentalFeatures to the block editor settings.
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_get_block_editor_settings_experimental( $settings ) {
	$is_block_theme = wp_is_block_theme();

	global $post_ID;

	if ( ! $is_block_theme || ! $post_ID ) {
		return $settings;
	}

	$template_slug = get_page_template_slug( $post_ID );

	if ( ! $template_slug ) {
		$post_slug      = 'singular';
		$page_slug      = 'singular';
		$template_types = get_block_templates();

		foreach ( $template_types as $template_type ) {
			if ( 'page' === $template_type->slug ) {
				$page_slug = 'page';
			}
			if ( 'single' === $template_type->slug ) {
				$post_slug = 'single';
			}
		}

		$what_post_type = get_post_type( $post_ID );
		switch ( $what_post_type ) {
			case 'page':
				$template_slug = $page_slug;
				break;
			default:
				$template_slug = $post_slug;
				break;
		}
	}

	$current_template = get_block_templates( array( 'slug__in' => array( $template_slug ) ) );

	if ( ! empty( $current_template ) ) {
		$template_blocks    = parse_blocks( $current_template[0]->content );
		$post_content_block = gutenberg_find_first_block( 'core/post-content', $template_blocks );

		if ( ! empty( $post_content_block['attrs'] ) ) {
			$settings['postContentAttributes'] = $post_content_block['attrs'];
		}
	}

	return $settings;
}

add_filter( 'block_editor_settings_all', 'gutenberg_get_block_editor_settings_experimental', PHP_INT_MAX );
