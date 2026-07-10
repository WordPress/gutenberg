<?php
/**
 * Server-side rendering of the `core/table-of-contents` block.
 *
 * @package WordPress
 */

/**
 * Adds an aria-label to the table of contents block content.
 *
 * @param array  $attributes Attributes of the block being rendered.
 * @param string $content Content of the block being rendered.
 *
 * @return string The content of the block being rendered.
 */
function block_core_table_of_contents_add_aria_label( $attributes, $content ) {
	if ( ! $content ) {
		return $content;
	}

	// Get the aria-label from block attributes, or fallback to localized default.
	$aria_label = empty( $attributes['ariaLabel'] ) ? __( 'Table of Contents' ) : wp_strip_all_tags( $attributes['ariaLabel'] );

	$p = new WP_HTML_Tag_Processor( $content );

	if ( $p->next_tag( 'nav' ) ) {
		$p->set_attribute( 'aria-label', $aria_label );
	}

	return $p->get_updated_html();
}

/**
 * Gets the heading data from a heading block.
 *
 * @param array $block     Parsed heading block.
 * @param int   $max_level Maximum heading level to include.
 *
 * @return array|null Heading data, or null when the heading should be skipped.
 */
function block_core_table_of_contents_get_heading_from_block( $block, $max_level ) {
	if ( ! is_array( $block ) ) {
		return null;
	}

	$level = isset( $block['attrs']['level'] ) ? (int) $block['attrs']['level'] : 2;

	if ( $max_level && $level > $max_level ) {
		return null;
	}

	$rendered_heading = render_block( $block );
	$processor        = new WP_HTML_Tag_Processor( $rendered_heading );
	$heading_tags     = array( 'H1', 'H2', 'H3', 'H4', 'H5', 'H6' );
	$id               = '';

	while ( $processor->next_tag() ) {
		if ( in_array( $processor->get_tag(), $heading_tags, true ) ) {
			$id = $processor->get_attribute( 'id' );
			break;
		}
	}

	if ( ! isset( $id ) ) {
		$id = '';
	}

	$content = preg_replace( '/<br\s*\/?>/i', ' ', $rendered_heading );
	$content = trim( wp_strip_all_tags( $content ) );

	if ( '' === $content ) {
		return null;
	}

	return array(
		'content' => $content,
		'level'   => $level,
		'link'    => '' !== $id ? '#' . $id : '',
	);
}

/**
 * Gets the post content for a synced pattern block.
 *
 * @param array $attributes Synced pattern block attributes.
 * @param array $seen       Already visited block references.
 *
 * @return string The synced pattern content.
 */
function block_core_table_of_contents_get_synced_pattern_content( $attributes, &$seen ) {
	if ( empty( $attributes['ref'] ) ) {
		return '';
	}

	$ref = (int) $attributes['ref'];
	if ( isset( $seen['core/block'][ $ref ] ) ) {
		return '';
	}

	$pattern = get_post( $ref );
	if ( ! $pattern || 'wp_block' !== $pattern->post_type ) {
		return '';
	}

	$seen['core/block'][ $ref ] = true;

	return $pattern->post_content;
}

/**
 * Gets the content for a template part block.
 *
 * @param array $attributes Template part block attributes.
 * @param array $seen       Already visited template part references.
 *
 * @return string The template part content.
 */
function block_core_table_of_contents_get_template_part_content( $attributes, &$seen ) {
	if ( empty( $attributes['slug'] ) ) {
		return '';
	}

	$theme       = empty( $attributes['theme'] )
		? get_stylesheet()
		: $attributes['theme'];
	$template_id = $theme . '//' . $attributes['slug'];

	if ( isset( $seen['core/template-part'][ $template_id ] ) ) {
		return '';
	}

	$template_part = get_block_template( $template_id, 'wp_template_part' );
	if ( ! $template_part || empty( $template_part->content ) ) {
		return '';
	}

	$seen['core/template-part'][ $template_id ] = true;

	return $template_part->content;
}

/**
 * Collects heading data from block content.
 *
 * @param string $content   Block content to scan.
 * @param int    $max_level Maximum heading level to include.
 * @param array  $seen      Already visited references.
 *
 * @return array Heading data.
 */
function block_core_table_of_contents_get_headings_from_content( $content, $max_level = 0, $seen = array() ) {
	if ( ! class_exists( 'WP_Block_Processor' ) || '' === trim( $content ) ) {
		return array();
	}

	if ( ! isset( $seen['core/block'] ) ) {
		$seen['core/block'] = array();
	}
	if ( ! isset( $seen['core/template-part'] ) ) {
		$seen['core/template-part'] = array();
	}

	$headings  = array();
	$processor = new WP_Block_Processor( $content );

	while ( $processor->next_block() ) {
		$block_type = $processor->get_block_type();

		if ( 'core/heading' === $block_type ) {
			$block   = $processor->extract_full_block_and_advance();
			$heading = block_core_table_of_contents_get_heading_from_block( $block, $max_level );

			if ( $heading ) {
				$headings[] = $heading;
			}

			continue;
		}

		if ( 'core/block' === $block_type ) {
			$attributes = $processor->allocate_and_return_parsed_attributes() ?? array();
			$headings   = array_merge(
				$headings,
				block_core_table_of_contents_get_headings_from_content(
					block_core_table_of_contents_get_synced_pattern_content( $attributes, $seen ),
					$max_level,
					$seen
				)
			);
			continue;
		}

		if ( 'core/template-part' === $block_type ) {
			$attributes = $processor->allocate_and_return_parsed_attributes() ?? array();
			$headings   = array_merge(
				$headings,
				block_core_table_of_contents_get_headings_from_content(
					block_core_table_of_contents_get_template_part_content( $attributes, $seen ),
					$max_level,
					$seen
				)
			);
		}
	}

	return $headings;
}

/**
 * Checks whether the current block template contains a Post Content block.
 *
 * @return bool Whether the current block template contains a Post Content block.
 */
function block_core_table_of_contents_current_template_has_post_content() {
	global $_wp_current_template_content;

	if (
		! class_exists( 'WP_Block_Processor' ) ||
		empty( $_wp_current_template_content )
	) {
		return false;
	}

	$processor = new WP_Block_Processor( $_wp_current_template_content );

	return $processor->next_block( 'core/post-content' );
}

/**
 * Converts a flat list of headings to a nested list.
 *
 * @param array $headings Flat heading data.
 *
 * @return array Nested heading data.
 */
function block_core_table_of_contents_linear_to_nested_heading_list( $headings ) {
	$nested_headings = array();

	foreach ( $headings as $index => $heading ) {
		if (
			'' === $heading['content'] ||
			$heading['level'] !== $headings[0]['level']
		) {
			continue;
		}

		if (
			isset( $headings[ $index + 1 ] ) &&
			$headings[ $index + 1 ]['level'] > $heading['level']
		) {
			$end_of_slice = count( $headings );
			for ( $i = $index + 1; $i < count( $headings ); $i++ ) {
				if ( $headings[ $i ]['level'] === $heading['level'] ) {
					$end_of_slice = $i;
					break;
				}
			}

			$nested_headings[] = array(
				'heading'  => $heading,
				'children' => block_core_table_of_contents_linear_to_nested_heading_list(
					array_slice(
						$headings,
						$index + 1,
						$end_of_slice - $index - 1
					)
				),
			);
		} else {
			$nested_headings[] = array(
				'heading'  => $heading,
				'children' => null,
			);
		}
	}

	return $nested_headings;
}

/**
 * Builds the table of contents list items.
 *
 * @param array  $nested_headings Nested heading data.
 * @param string $list_tag        List tag name.
 *
 * @return string List item markup.
 */
function block_core_table_of_contents_build_list_items( $nested_headings, $list_tag ) {
	$list = '';

	foreach ( $nested_headings as $node ) {
		$heading = $node['heading'];
		$content = esc_html( $heading['content'] );

		if ( '' !== $heading['link'] ) {
			$entry = sprintf(
				'<a class="wp-block-table-of-contents__entry" href="%1$s">%2$s</a>',
				esc_url( $heading['link'] ),
				$content
			);
		} else {
			$entry = sprintf(
				'<span class="wp-block-table-of-contents__entry">%s</span>',
				$content
			);
		}

		$list .= '<li>' . $entry;

		if ( ! empty( $node['children'] ) ) {
			$list .= sprintf(
				'<%1$s>%2$s</%1$s>',
				$list_tag,
				block_core_table_of_contents_build_list_items( $node['children'], $list_tag )
			);
		}

		$list .= '</li>';
	}

	return $list;
}

/**
 * Renders the table of contents block from current post headings.
 *
 * @param array  $attributes Attributes of the block being rendered.
 * @param string $content Content of the block being rendered.
 *
 * @return string The content of the block being rendered.
 */
function block_core_table_of_contents_render( $attributes, $content ) {
	global $wp_current_filter;

	$is_rendering_post_content = in_array( 'the_content', $wp_current_filter, true );

	if ( ! $is_rendering_post_content ) {
		if (
			! is_singular() ||
			! block_core_table_of_contents_current_template_has_post_content()
		) {
			return '';
		}
	}

	$post = get_post();
	if ( ! $post ) {
		return '';
	}

	$max_level = isset( $attributes['maxLevel'] ) ? (int) $attributes['maxLevel'] : 0;
	$headings  = block_core_table_of_contents_get_headings_from_content( $post->post_content, $max_level );

	if ( empty( $headings ) ) {
		return '';
	}

	$ordered            = array_key_exists( 'ordered', $attributes )
		? (bool) $attributes['ordered']
		: true;
	$list_tag           = $ordered ? 'ol' : 'ul';
	$wrapper_attributes = get_block_wrapper_attributes();
	$content            = sprintf(
		'<nav %1$s><%2$s>%3$s</%2$s></nav>',
		$wrapper_attributes,
		$list_tag,
		block_core_table_of_contents_build_list_items(
			block_core_table_of_contents_linear_to_nested_heading_list( $headings ),
			$list_tag
		)
	);

	return block_core_table_of_contents_add_aria_label( $attributes, $content );
}

/**
 * Registers the `core/table-of-contents` block on the server.
 */
function register_block_core_table_of_contents() {
	register_block_type_from_metadata(
		__DIR__ . '/table-of-contents',
		array(
			'render_callback' => 'block_core_table_of_contents_render',
		)
	);
}
add_action( 'init', 'register_block_core_table_of_contents' );
