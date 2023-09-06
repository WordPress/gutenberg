<?php
/**
 * Server-side rendering of the `core/table-of-contents` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/table-of-contents` block on the server.
 *
 * @since 6.4.0
 */
function register_block_core_table_of_contents() {
	// @todo: Register meta for all post types that use Block Editor.
	foreach ( array( 'post', 'page' ) as $post_type ) {
		register_post_meta(
			$post_type,
			'table_of_contents',
			array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'string',
			)
		);
	}

	register_block_type_from_metadata(
		__DIR__ . '/table-of-contents',
		array(
			'render_callback' => 'render_block_core_table_of_contents',
		)
	);
}
add_action( 'init', 'register_block_core_table_of_contents' );

/**
 * Takes a flat list of heading parameters and nests them based on each header's
 * immediate parent's level.
 *
 * @since 6.4.0
 *
 * @param array $headings A flat list of headings to nest.
 * @return array $tree An array of nested headings.
 */
function block_core_table_of_contents_build_headings_tree( $headings ) {
	if ( empty( $headings ) ) {
		return $headings;
	}

	$tree         = array();
	$firstHeading = $headings[0];
	$total        = count( $headings );

	foreach ( $headings as $key => $heading ) {
		if ( empty( $heading['content'] ) ) {
			continue;
		}

		// Make sure we are only working with the same level as the first iteration in our set.
		if ( $heading['level'] !== $firstHeading['level'] ) {
			continue;
		}

		/**
		 * Check that the next iteration will return a value.
		 * If it does and the next level is greater than the current level,
		 * the next iteration becomes a child of the current iteration.
		 */
		$offset = $key + 1;
		if ( isset( $headings[ $offset ]['level'] ) && (int) $headings[ $offset ]['level'] > (int) $heading['level'] ) {
			/**
			 * Calculate the last index before the next iteration with the same level (siblings).
			 * Then, use this index to slice the array for use in recursion.
			 * This prevents duplicate nodes.
			 */
			$end = $total;
			for ( $i = $offset; $i < $total; $i++ ) {
				if ( $headings[ $i ]['level'] === $heading['level'] ) {
					$end = $i;
					break;
				}
			}

			$tree[] = array(
				'heading'  => $heading,
				'children' => block_core_table_of_contents_build_headings_tree( array_slice( $headings, $offset, $end - 1 ) ),
			);

		} else {
			// No child heading levels.
			$tree[] = array(
				'heading' => $heading,
			);
		}
	}

	return $tree;
}

/**
 * Build a list of Table of Content items.
 *
 * @since 6.4.0
 *
 * @param array $headings An array of nested headings.
 * @return string $list A list of Table of Content items.
 */
function block_core_table_of_contents_build_list( $tree ) {
	$list = '';

	foreach ( $tree as $item ) {
		$heading  = $item['heading'];
		$children = isset( $item['children'] ) ? '<ol>' . block_core_table_of_contents_build_list( $item['children'] ) . '</ol>' : '';

		if ( ! empty( $heading['link'] )) {
			$content = '<a class="wp-block-table-of-contents__entry" href="' . esc_url( $heading['link'] ) . '">' . esc_html( $heading['content'] ) . '</a>';
		} else {
			$content = '<span class=wp-block-table-of-contents__entry>' . esc_html( $heading['content'] ) . '</span>';
		}

		$list .= '<li>' . $content . $children . '</li>';
	}

	return $list;
}

/**
 * Renders the `core/table-of-contents` block on the server.
 *
 * @since 6.4.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the HTML representing the table of contents.
 */
function render_block_core_table_of_contents( $attributes, $content, $block ) {
	// Fallback to static content when it exists. The post hasn't been updated to use headings via post-meta.
	if ( trim( $content ) !== '' ) {
		return $content;
	}

	// Bail out early if the post ID is not set for some reason.
	if ( empty( $block->context['postId'] ) ) {
		return '';
	}

	if ( post_password_required( $block->context['postId'] ) ) {
		return '';
	}

	$headings = get_post_meta( $block->context['postId'], 'table_of_contents', true );

	if ( ! $headings ) {
		return '';
	}

	$headings = json_decode( $headings, true );

	if ( ! is_array( $headings ) || count( $headings ) === 0 ) {
		return '';
	}

	$tree = block_core_table_of_contents_build_headings_tree( $headings );

	return sprintf(
		'<nav %1$s><ol>%2$s</ol></nav>',
		get_block_wrapper_attributes(),
		block_core_table_of_contents_build_list( $tree )
	);
}
