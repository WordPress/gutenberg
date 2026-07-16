<?php
/**
 * Server-side rendering of the `core/table-of-contents` block.
 *
 * @package WordPress
 */

require_once __DIR__ . '/table-of-contents/class-wp-table-of-contents.php';

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
			// The following headings are children until another heading at
			// the current level appears. Slice that child run for recursion
			// so nested nodes are not duplicated as top-level siblings.
			$end_of_slice = count( $headings );
			for ( $i = $index + 1; $i < count( $headings ); $i++ ) {
				if ( $headings[ $i ]['level'] === $heading['level'] ) {
					$end_of_slice = $i;
					break;
				}
			}

			// The child slice starts after the current heading, so each
			// recursive call receives fewer headings than its caller.
			$child_headings    = array_slice(
				$headings,
				$index + 1,
				$end_of_slice - $index - 1
			);
			$nested_headings[] = array(
				'heading'  => $heading,
				'children' => block_core_table_of_contents_linear_to_nested_heading_list( $child_headings ),
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

	if ( ! is_array( $wp_current_filter ) || ! in_array( 'the_content', $wp_current_filter, true ) ) {
		return block_core_table_of_contents_add_aria_label( $attributes, $content );
	}

	$post = get_post();
	if ( ! $post ) {
		return '';
	}

	$headings = WP_Table_Of_Contents::get_headings( $post, $attributes );

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
