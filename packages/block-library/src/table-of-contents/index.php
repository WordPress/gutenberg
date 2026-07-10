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
 * @param array $context   Heading resolution context.
 *
 * @return array|null Heading data, or null when the heading should be skipped.
 */
function block_core_table_of_contents_get_heading_from_block( $block, $max_level, $context = array() ) {
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
		'link'    => block_core_table_of_contents_get_heading_link( $id, $context ),
	);
}

/**
 * Gets the link for a heading.
 *
 * @param string $id      Heading id.
 * @param array  $context Heading resolution context.
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

	if ( 1 < $page ) {
		$permalink = add_query_arg( 'page', $page, $permalink );
	}

	return $permalink . '#' . $id;
}

/**
 * Gets the post content for a synced pattern block.
 *
 * @param array $attributes Synced pattern block attributes.
 *
 * @return string The synced pattern content.
 */
function block_core_table_of_contents_get_synced_pattern_content( $attributes ) {
	if ( empty( $attributes['ref'] ) ) {
		return '';
	}

	$ref     = (int) $attributes['ref'];
	$pattern = get_post( $ref );
	if (
		! $pattern ||
		'wp_block' !== $pattern->post_type ||
		'publish' !== $pattern->post_status ||
		! empty( $pattern->post_password )
	) {
		return '';
	}

	return $pattern->post_content;
}

/**
 * Gets the content for a template part block.
 *
 * @param array $attributes Template part block attributes.
 *
 * @return string Template part id.
 */
function block_core_table_of_contents_get_template_part_id( $attributes ) {
	if ( empty( $attributes['slug'] ) ) {
		return '';
	}

	$theme = empty( $attributes['theme'] )
		? get_stylesheet()
		: $attributes['theme'];

	return $theme . '//' . $attributes['slug'];
}

/**
 * Gets the content for a template part block.
 *
 * @param array $attributes Template part block attributes.
 *
 * @return string The template part content.
 */
function block_core_table_of_contents_get_template_part_content( $attributes ) {
	if ( empty( $attributes['slug'] ) ) {
		return '';
	}

	$theme = empty( $attributes['theme'] )
		? get_stylesheet()
		: $attributes['theme'];

	// Match `core/template-part` front-end rendering: template parts from
	// another theme are unavailable on the current front end.
	if ( get_stylesheet() !== $theme ) {
		return '';
	}

	// Match `render_block_core_template_part()`: a published database
	// template part is the customized source of truth and takes precedence
	// over the theme file.
	$template_part_query = new WP_Query(
		array(
			'post_type'           => 'wp_template_part',
			'post_status'         => 'publish',
			'post_name__in'       => array( $attributes['slug'] ),
			'tax_query'           => array(
				array(
					'taxonomy' => 'wp_theme',
					'field'    => 'name',
					'terms'    => $theme,
				),
			),
			'posts_per_page'      => 1,
			'no_found_rows'       => true,
			'lazy_load_term_meta' => false,
		)
	);
	$template_part_post  = $template_part_query->have_posts() ? $template_part_query->next_post() : null;
	if ( $template_part_post ) {
		return $template_part_post->post_content;
	}

	if (
		! function_exists( 'get_block_file_template' ) ||
		0 !== validate_file( $attributes['slug'] )
	) {
		return '';
	}

	// If there is no customized database template part, fall back to the
	// active theme's file-based template part, as `core/template-part` does.
	$template_part = get_block_file_template(
		block_core_table_of_contents_get_template_part_id( $attributes ),
		'wp_template_part'
	);
	if ( isset( $template_part->content ) ) {
		return $template_part->content;
	}

	return '';
}

/**
 * Normalizes raw page break comments so the block processor can see them.
 *
 * @param string $content Serialized block content.
 *
 * @return string Content with page breaks wrapped as nextpage blocks.
 */
function block_core_table_of_contents_normalize_nextpage_blocks( $content ) {
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
 * Collects heading data from block content.
 *
 * @param string $content   Block content to scan.
 * @param int    $max_level Maximum heading level to include.
 * @param array  $seen      Already visited references.
 * @param array  $context   Heading resolution context.
 *
 * @return array Heading data.
 */
function block_core_table_of_contents_get_headings_from_content( $content, $max_level = 0, $seen = array(), $context = array() ) {
	if ( ! class_exists( 'WP_Block_Processor' ) || '' === trim( $content ) ) {
		return array();
	}

	if ( ! isset( $seen['core/block'] ) ) {
		$seen['core/block'] = array();
	}
	if ( ! isset( $seen['core/template-part'] ) ) {
		$seen['core/template-part'] = array();
	}

	$context = wp_parse_args(
		$context,
		array(
			'current_page'              => 1,
			'is_paginated'              => false !== strpos( $content, '<!--nextpage-->' ),
			'only_include_current_page' => false,
			'permalink'                 => '',
			'target_page'               => 1,
		)
	);
	$context = array(
		'current_page'              => max( 1, (int) $context['current_page'] ),
		'is_paginated'              => ! empty( $context['is_paginated'] ),
		'only_include_current_page' => ! empty( $context['only_include_current_page'] ),
		'permalink'                 => $context['permalink'],
		'target_page'               => max( 1, (int) $context['target_page'] ),
	);

	return block_core_table_of_contents_collect_headings_from_content( $content, $max_level, $seen, $context );
}

/**
 * Collects heading data from block content.
 *
 * @param string $content   Block content to scan.
 * @param int    $max_level Maximum heading level to include.
 * @param array  $seen      Already visited references.
 * @param array  $context   Heading resolution context.
 *
 * @return array Heading data.
 */
function block_core_table_of_contents_collect_headings_from_content( $content, $max_level, &$seen, &$context ) {
	if ( '' === trim( $content ) ) {
		return array();
	}

	$content   = block_core_table_of_contents_normalize_nextpage_blocks( $content );
	$headings  = array();
	$processor = new WP_Block_Processor( $content );

	while ( $processor->next_block() ) {
		$block_type = $processor->get_block_type();

		if ( 'core/nextpage' === $block_type ) {
			++$context['current_page'];
			continue;
		}

		$include_current_page = (
			empty( $context['only_include_current_page'] ) ||
			$context['current_page'] === $context['target_page']
		);

		if ( 'core/heading' === $block_type ) {
			if ( ! $include_current_page ) {
				continue;
			}

			$block   = $processor->extract_full_block_and_advance();
			$heading = block_core_table_of_contents_get_heading_from_block( $block, $max_level, $context );

			if ( $heading ) {
				$headings[] = $heading;
			}

			continue;
		}

		if ( 'core/block' === $block_type ) {
			if ( ! $include_current_page ) {
				continue;
			}

			$attributes = $processor->allocate_and_return_parsed_attributes() ?? array();
			$ref        = empty( $attributes['ref'] ) ? 0 : (int) $attributes['ref'];
			if ( ! $ref || isset( $seen['core/block'][ $ref ] ) ) {
				continue;
			}

			$referenced_content = block_core_table_of_contents_get_synced_pattern_content( $attributes );
			if ( '' === $referenced_content ) {
				continue;
			}

			$seen['core/block'][ $ref ] = true;
			$referenced_context         = $context;

			$headings = array_merge(
				$headings,
				block_core_table_of_contents_collect_headings_from_content(
					$referenced_content,
					$max_level,
					$seen,
					$referenced_context
				)
			);
			unset( $seen['core/block'][ $ref ] );
			continue;
		}

		if ( 'core/template-part' === $block_type ) {
			if ( ! $include_current_page ) {
				continue;
			}

			$attributes  = $processor->allocate_and_return_parsed_attributes() ?? array();
			$template_id = block_core_table_of_contents_get_template_part_id( $attributes );
			if ( '' === $template_id || isset( $seen['core/template-part'][ $template_id ] ) ) {
				continue;
			}

			$referenced_content = block_core_table_of_contents_get_template_part_content( $attributes );
			if ( '' === $referenced_content ) {
				continue;
			}

			$seen['core/template-part'][ $template_id ] = true;
			$referenced_context                         = $context;

			$headings = array_merge(
				$headings,
				block_core_table_of_contents_collect_headings_from_content(
					$referenced_content,
					$max_level,
					$seen,
					$referenced_context
				)
			);
			unset( $seen['core/template-part'][ $template_id ] );
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

	$seen = array(
		'core/template-part' => array(),
	);

	return block_core_table_of_contents_template_content_has_post_content( $_wp_current_template_content, $seen );
}

/**
 * Checks whether template content contains a Post Content block.
 *
 * @param string $content Template content to scan.
 * @param array  $seen    Already visited template part references.
 *
 * @return bool Whether the content contains a Post Content block.
 */
function block_core_table_of_contents_template_content_has_post_content( $content, &$seen ) {
	if ( '' === trim( $content ) ) {
		return false;
	}

	$processor = new WP_Block_Processor( $content );

	while ( $processor->next_block() ) {
		$block_type = $processor->get_block_type();

		if ( 'core/post-content' === $block_type ) {
			return true;
		}

		if ( 'core/template-part' !== $block_type ) {
			continue;
		}

		$attributes  = $processor->allocate_and_return_parsed_attributes() ?? array();
		$template_id = block_core_table_of_contents_get_template_part_id( $attributes );

		if ( '' === $template_id || isset( $seen['core/template-part'][ $template_id ] ) ) {
			continue;
		}

		$template_part_content = block_core_table_of_contents_get_template_part_content( $attributes );
		if ( '' === $template_part_content ) {
			continue;
		}

		$seen['core/template-part'][ $template_id ] = true;
		$has_post_content                           = block_core_table_of_contents_template_content_has_post_content( $template_part_content, $seen );
		unset( $seen['core/template-part'][ $template_id ] );

		if ( $has_post_content ) {
			return true;
		}
	}

	return false;
}

/**
 * Gets the current page number for paginated post content.
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

	$max_level    = isset( $attributes['maxLevel'] ) ? (int) $attributes['maxLevel'] : 0;
	$current_page = block_core_table_of_contents_get_current_page_number();
	$seen         = array();
	$context      = array(
		'current_page'              => 1,
		'is_paginated'              => false !== strpos( $post->post_content, '<!--nextpage-->' ),
		'only_include_current_page' => ! empty( $attributes['onlyIncludeCurrentPage'] ),
		'permalink'                 => get_permalink( $post ),
		'target_page'               => $current_page,
	);
	$headings     = block_core_table_of_contents_get_headings_from_content( $post->post_content, $max_level, $seen, $context );

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
