<?php
/**
 * Server-side rendering of the `core/table-of-contents` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/table-of-contents` block on the server.
 *
 * @param array    $attributes Block attributes.
 *
 * @return string Returns the block content.
 */
function render_block_core_table_of_contents( $attributes ) {
	// Extract headings from the block tree.
	$headings = array();

	global $wp_current_filter;
	if ( in_array( 'the_content', $wp_current_filter, true ) ) {
		// Post content context.
		$post = get_post();
		if ( $post ) {
			$blocks   = parse_blocks( $post->post_content );
			$headings = block_core_table_of_contents_traverse_blocks( $blocks, $attributes['maxLevel'] ?? null );
		}
	} else {
		// Template context.
		global $_wp_current_template_content;
		if ( ! empty( $_wp_current_template_content ) ) {
			$blocks   = parse_blocks( $_wp_current_template_content );
			$headings = block_core_table_of_contents_traverse_blocks( $blocks, $attributes['maxLevel'] ?? null );
		}
	}

	if ( empty( $headings ) ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

	// Get the aria-label from block attributes, or fallback to localized default.
	$aria_label = empty( $attributes['ariaLabel'] ) ? __( 'Table of Contents' ) : wp_strip_all_tags( $attributes['ariaLabel'] );

	$ordered  = isset( $attributes['ordered'] ) ? $attributes['ordered'] : true;
	$list_tag = $ordered ? 'ol' : 'ul';

	$toc_html  = '<nav ' . $wrapper_attributes . ' aria-label="' . esc_attr( $aria_label ) . '">';
	$toc_html .= '<' . $list_tag . '>';
	$toc_html .= block_core_table_of_contents_build_list( $headings, $ordered );
	$toc_html .= '</' . $list_tag . '>';
	$toc_html .= '</nav>';

	return block_core_table_of_contents_add_full_urls( $toc_html );
}

/**
 * Convert relative anchor links (#heading-id) to full URLs using HTML API.
 *
 * @param string $html The HTML content to process.
 *
 * @return string HTML with full URLs.
 */
function block_core_table_of_contents_add_full_urls( $html ) {
	global $wp;
	$current_url = get_permalink();

	if ( empty( $current_url ) ) {
		return $html;
	}

	$processor = new WP_HTML_Tag_Processor( $html );
	while ( $processor->next_tag( 'a' ) ) {
		$href = $processor->get_attribute( 'href' );

		// Only modify relative anchor links (starting with #).
		if ( $href && '#' === substr( $href, 0, 1 ) ) {
			$processor->set_attribute( 'href', $current_url . $href );
		}
	}

	return $processor->get_updated_html();
}

/**
 * Recursively traverse blocks to find all heading blocks.
 *
 * @param array $blocks    Array of blocks to traverse.
 * @param int   $max_level Maximum heading level to include.
 *
 * @return array Array of heading data.
 */
function block_core_table_of_contents_traverse_blocks( $blocks, $max_level = null ) {
	$headings = array();

	foreach ( $blocks as $block ) {
		if ( 'core/template-part' === $block['blockName'] ) {
			$slug  = $block['attrs']['slug'] ?? '';
			$theme = $block['attrs']['theme'] ?? '';

			if ( $slug ) {
				$template_part = null;

				if ( function_exists( 'get_block_template' ) ) {
					$template_id   = $theme ? $theme . '//' . $slug : get_stylesheet() . '//' . $slug;
					$template_part = get_block_template( $template_id, 'wp_template_part' );
				}

				if ( $template_part && ! empty( $template_part->content ) ) {
					$template_blocks   = parse_blocks( $template_part->content );
					$template_headings = block_core_table_of_contents_traverse_blocks( $template_blocks, $max_level );
					$headings          = array_merge( $headings, $template_headings );
				}
			}
			continue;
		}

		// Extract headings from heading blocks.
		if ( 'core/heading' === $block['blockName'] ) {
			// Default to level 2 if not specified.
			$level = isset( $block['attrs']['level'] ) ? $block['attrs']['level'] : 2;

			// Skip if level exceeds max level.
			if ( $max_level && $level > $max_level ) {
				continue;
			}

			$content = '';
			if ( isset( $block['innerHTML'] ) ) {
				$content = wp_strip_all_tags( $block['innerHTML'] );
			} elseif ( isset( $block['innerContent'][0] ) ) {
				$content = wp_strip_all_tags( $block['innerContent'][0] );
			}

			if ( empty( trim( $content ) ) ) {
				continue;
			}

			// Get anchor from block attributes, or generate one from content.
			$anchor = isset( $block['attrs']['anchor'] ) ? $block['attrs']['anchor'] : '';
			if ( empty( $anchor ) && function_exists( 'sanitize_title' ) ) {
				$anchor = sanitize_title( $content );
			}

			$headings[] = array(
				'content' => $content,
				'level'   => $level,
				'link'    => ! empty( $anchor ) ? '#' . $anchor : '',
			);
		}

		if ( ! empty( $block['innerBlocks'] ) ) {
			$inner_headings = block_core_table_of_contents_traverse_blocks( $block['innerBlocks'], $max_level );
			$headings       = array_merge( $headings, $inner_headings );
		}
	}

	return $headings;
}

/**
 * Build the HTML for the table of contents list.
 *
 * @param array $headings Array of heading data.
 * @param bool  $ordered  Whether to use ordered list.
 *
 * @return string HTML for the list.
 */
function block_core_table_of_contents_build_list( $headings, $ordered ) {
	if ( empty( $headings ) ) {
		return '';
	}

	$html          = '';
	$list_tag      = $ordered ? 'ol' : 'ul';
	$prev_level    = null;
	$nesting_depth = 0;

	foreach ( $headings as $index => $heading ) {
		$level = $heading['level'];

		if ( null === $prev_level ) {
			$prev_level = $level;
		}

		$depth_change = $level - $prev_level;

		if ( 0 > $depth_change ) {
			for ( $i = 0; $i < abs( $depth_change ); $i++ ) {
				$html .= '</li></' . $list_tag . '>';
				--$nesting_depth;
			}
			$html .= '</li>';
		} elseif ( $depth_change > 0 ) {
			for ( $i = 0; $i < $depth_change; $i++ ) {
				$html .= '<' . $list_tag . '>';
				++$nesting_depth;
			}
		} elseif ( $index > 0 ) {
			$html .= '</li>';
		}

		if ( ! empty( $heading['link'] ) ) {
			$html .= '<li><a href="' . esc_url( $heading['link'] ) . '">' . esc_html( $heading['content'] ) . '</a>';
		} else {
			$html .= '<li>' . esc_html( $heading['content'] );
		}

		$prev_level = $level;
	}

	$html .= '</li>';
	for ( $i = 0; $i < $nesting_depth; $i++ ) {
		$html .= '</' . $list_tag . '></li>';
	}

	return $html;
}

/**
 * Registers the `core/table-of-contents` block on the server.
 */
function register_block_core_table_of_contents() {
	register_block_type_from_metadata(
		__DIR__ . '/table-of-contents',
		array(
			'render_callback' => 'render_block_core_table_of_contents',
		)
	);
}
add_action( 'init', 'register_block_core_table_of_contents' );
