<?php
/**
 * Server-side rendering of the `core/table-of-contents` block.
 *
 * @package WordPress
 */

/**
 * The Heading block's default level when no `level` attribute is saved.
 */
const BLOCK_CORE_TABLE_OF_CONTENTS_DEFAULT_HEADING_LEVEL = 2;

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
 * Gets the link for a heading.
 *
 * Headings without an id cannot be linked. Non-paginated posts can use a local
 * fragment link. Paginated posts need a full permalink so headings on later
 * pages link to the correct page before applying the fragment.
 *
 * @param string $id      Heading id.
 * @param array  $context Heading resolution context used while scanning the
 *                        post content.
 *
 * @return string Heading link.
 */
function block_core_table_of_contents_get_heading_link( $id, $context = array() ) {
	if ( '' === $id ) {
		return '';
	}

	if ( empty( $context['is_paginated'] ) || empty( $context['permalink'] ) ) {
		return '#' . $id;
	}

	$page      = isset( $context['current_page'] ) ? max( 1, (int) $context['current_page'] ) : 1;
	$permalink = remove_query_arg( 'page', $context['permalink'] );

	// Page 1 uses the canonical permalink, e.g. `/post/#intro`. Later pages use
	// the page query arg before the fragment, e.g. `/post/?page=2#details`.
	if ( 1 < $page ) {
		$permalink = add_query_arg( 'page', $page, $permalink );
	}

	return $permalink . '#' . $id;
}

/**
 * Normalizes raw page break comments so the block processor can see them.
 *
 * Classic content can store page breaks as bare `<!--nextpage-->` markers, and
 * the Page Break block also saves that marker as its inner content. Because
 * `WP_Block_Processor` only advances through block comments, wrapping those
 * markers as `core/nextpage` blocks lets the ToC count paginated post pages in
 * the same pass that it scans headings.
 *
 * @param string $content Serialized block content.
 *
 * @return string Content with page breaks wrapped as nextpage blocks.
 */
function block_core_table_of_contents_normalize_nextpage_blocks( $content ) {
	// Collapse already-wrapped nextpage blocks first so the replacement below
	// never nests a page break inside another nextpage wrapper.
	$content = preg_replace(
		'/<!--\s+wp:(?:core\/)?nextpage\s+-->\s*<!--nextpage-->\s*<!--\s+\/wp:(?:core\/)?nextpage\s+-->/',
		'<!--nextpage-->',
		$content
	);

	return str_replace(
		'<!--nextpage-->',
		'<!-- wp:nextpage --><!--nextpage--><!-- /wp:nextpage -->',
		$content
	);
}

/**
 * Gets the heading data from a heading block.
 *
 * @param array $block     Parsed heading block.
 * @param int   $max_level Maximum heading level to include.
 * @param array $context   Heading resolution context.
 *
 * @return array|null Heading data, or null when the heading should be skipped.
 */
function block_core_table_of_contents_get_heading_from_block( $block, $max_level, $context = array() ) {
	if ( ! is_array( $block ) ) {
		return null;
	}

	$level = isset( $block['attrs']['level'] )
		? (int) $block['attrs']['level']
		: BLOCK_CORE_TABLE_OF_CONTENTS_DEFAULT_HEADING_LEVEL;

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

	if ( ! is_string( $id ) ) {
		$id = '';
	}

	$content = preg_replace( '/<br\s*\/?>/i', ' ', $rendered_heading );
	// Decode entities from rendered heading HTML before the ToC escapes them
	// once. Use html_entity_decode() because wp_specialchars_decode() only
	// handles special HTML characters, while headings can contain other named
	// entities.
	$content = html_entity_decode(
		trim( wp_strip_all_tags( $content ) ),
		ENT_QUOTES,
		get_option( 'blog_charset' )
	);

	if ( '' === $content ) {
		return null;
	}

	return array(
		'content' => $content,
		'level'   => $level,
		'link'    => block_core_table_of_contents_get_heading_link( $id, $context ),
	);
}

/**
 * Normalizes heading resolution context.
 *
 * The context is the shared state used while walking the current post content.
 * It tracks whether the post is paginated, which page is being scanned, which
 * page the rendered ToC should include, and which permalink should be used for
 * page-aware heading links. Callers can pass partial context, so this helper
 * fills defaults and normalizes booleans and page numbers before scanning.
 *
 * @param string $content Serialized block content.
 * @param array  $context Heading resolution context.
 *
 * @return array Normalized heading resolution context.
 */
function block_core_table_of_contents_normalize_heading_context( $content, $context = array() ) {
	$context = wp_parse_args(
		$context,
		array(
			'current_page'              => 1,
			'is_paginated'              => str_contains( $content, '<!--nextpage-->' ),
			'only_include_current_page' => false,
			'permalink'                 => '',
			'target_page'               => 1,
		)
	);

	return array(
		'current_page'              => max( 1, (int) $context['current_page'] ),
		'is_paginated'              => ! empty( $context['is_paginated'] ),
		'only_include_current_page' => ! empty( $context['only_include_current_page'] ),
		'permalink'                 => $context['permalink'],
		'target_page'               => max( 1, (int) $context['target_page'] ),
	);
}

/**
 * Collects heading data from block content.
 *
 * @param string $content   Block content to scan.
 * @param int    $max_level Maximum heading level to include.
 * @param array  $context   Heading resolution context.
 *
 * @return array Heading data.
 */
function block_core_table_of_contents_get_headings_from_content( $content, $max_level = 0, $context = array() ) {
	if ( ! class_exists( 'WP_Block_Processor' ) || '' === trim( $content ) ) {
		return array();
	}

	$content   = block_core_table_of_contents_normalize_nextpage_blocks( $content );
	$context   = block_core_table_of_contents_normalize_heading_context( $content, $context );
	$headings  = array();
	$processor = new WP_Block_Processor( $content );

	while ( $processor->next_block() ) {
		$block_type = $processor->get_block_type();

		if ( 'core/nextpage' === $block_type ) {
			++$context['current_page'];
			continue;
		}

		// `only_include_current_page` is the normalized form of the block's
		// `onlyIncludeCurrentPage` attribute. When false, headings from every
		// paginated page are included.
		$include_current_page = (
			empty( $context['only_include_current_page'] ) ||
			$context['current_page'] === $context['target_page']
		);

		if ( 'core/heading' !== $block_type || ! $include_current_page ) {
			continue;
		}

		$block   = $processor->extract_full_block_and_advance();
		$heading = block_core_table_of_contents_get_heading_from_block( $block, $max_level, $context );

		if ( $heading ) {
			$headings[] = $heading;
		}
	}

	return $headings;
}

/**
 * Gets the current page number for paginated post content.
 *
 * @global int $page Current page number of the content.
 *
 * @return int Current page number.
 */
function block_core_table_of_contents_get_current_page_number() {
	global $page;

	$current_page = (int) get_query_var( 'page' );
	if ( ! $current_page && isset( $page ) ) {
		$current_page = (int) $page;
	}

	return max( 1, $current_page );
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

	$max_level = isset( $attributes['maxLevel'] ) ? (int) $attributes['maxLevel'] : 0;
	// Heading context records the current pagination state so collection can
	// skip headings outside the rendered page and build page-aware links.
	$context  = block_core_table_of_contents_normalize_heading_context(
		$post->post_content,
		array(
			'only_include_current_page' => ! empty( $attributes['onlyIncludeCurrentPage'] ),
			'permalink'                 => get_permalink( $post ),
			'target_page'               => block_core_table_of_contents_get_current_page_number(),
		)
	);
	$headings = block_core_table_of_contents_get_headings_from_content( $post->post_content, $max_level, $context );

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
