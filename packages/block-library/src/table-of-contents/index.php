<?php
/**
 * Server-side rendering of the `core/table-of-contents` block.
 *
 * @package WordPress
 */

require_once __DIR__ . '/table-of-contents/class-wp-document-outline-parser.php';

/**
 * Adds an aria-label to the table of contents block content.
 *
 * @param array  $attributes Attributes of the block being rendered.
 * @param string $content    Content of the block being rendered.
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
 * Builds the table of contents list items.
 *
 * @param array  $outline  Nested heading data.
 * @param string $list_tag List tag name.
 *
 * @return string List item markup.
 */
function block_core_table_of_contents_build_list_items( $outline, $list_tag ) {
	$list = '';

	foreach ( $outline as $node ) {
		$heading = $node['heading'];

		if ( '' !== $heading['link'] ) {
			$entry = sprintf(
				'<a class="wp-block-table-of-contents__entry" href="%1$s">%2$s</a>',
				esc_url( $heading['link'] ),
				esc_html( $heading['content'] )
			);
		} else {
			$entry = sprintf(
				'<span class="wp-block-table-of-contents__entry">%s</span>',
				esc_html( $heading['content'] )
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
 * @param array         $attributes Attributes of the block being rendered.
 * @param string        $content Content of the block being rendered.
 * @param WP_Block|null $block Block instance.
 *
 * @return string The content of the block being rendered.
 */
function block_core_table_of_contents_render( $attributes, $content, $block = null ) {
	global $wp_current_filter;

	// Preserve legacy saved markup for old posts that have not been edited and migrated yet.
	$legacy_content = $content;
	if ( '' === trim( $legacy_content ) && ! empty( $block->parsed_block['innerHTML'] ) ) {
		$legacy_content = $block->parsed_block['innerHTML'];
	}

	// Once a post is edited and saved, the block migrates to dynamic rendering.
	if ( '' !== trim( $legacy_content ) ) {
		return block_core_table_of_contents_add_aria_label( $attributes, $legacy_content );
	}

	// Outside post content rendering, there is no reliable current post to scan.
	if ( ! is_array( $wp_current_filter ) || ! in_array( 'the_content', $wp_current_filter, true ) ) {
		return block_core_table_of_contents_add_aria_label( $attributes, $content );
	}

	$post = get_post();
	if ( ! $post ) {
		return '';
	}

	$outline = WP_Document_Outline_Parser::get_outline_from_post(
		$post,
		array(
			'max_level'                 => isset( $attributes['maxLevel'] ) ? (int) $attributes['maxLevel'] : 0,
			'only_include_current_page' => ! empty( $attributes['onlyIncludeCurrentPage'] ),
		)
	);

	if ( empty( $outline ) ) {
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
			$outline,
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
