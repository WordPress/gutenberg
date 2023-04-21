<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Update allowed inline style attributes list.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.2.
 *
 * @param string[] $attrs Array of allowed CSS attributes.
 * @return string[] CSS attributes.
 */
function gutenberg_safe_style_attrs_6_2( $attrs ) {
	$attrs[] = 'position';
	$attrs[] = 'top';
	$attrs[] = 'right';
	$attrs[] = 'bottom';
	$attrs[] = 'left';
	$attrs[] = 'z-index';
	$attrs[] = 'box-shadow';
	$attrs[] = 'aspect-ratio';

	return $attrs;
}
add_filter( 'safe_style_css', 'gutenberg_safe_style_attrs_6_2' );

/**
 * Helper function that constructs a WP_Query args array from
 * a `Query` block properties.
 *
 * It's used in QueryLoop, QueryPaginationNumbers and QueryPaginationNext blocks.
 *
 * `build_query_vars_from_query_block` was introduced in 5.8, for 6.1 we just need
 * to update that function and not create a new one.
 *
 * @param WP_Block $block Block instance.
 * @param int      $page  Current query's page.
 *
 * @return array Returns the constructed WP_Query arguments.
 */
function gutenberg_build_query_vars_from_query_block( $block, $page ) {
	$query = array(
		'post_type'    => 'post',
		'order'        => 'DESC',
		'orderby'      => 'date',
		'post__not_in' => array(),
	);

	if ( isset( $block->context['query'] ) ) {
		if ( ! empty( $block->context['query']['postType'] ) ) {
			$post_type_param = $block->context['query']['postType'];
			if ( is_post_type_viewable( $post_type_param ) ) {
				$query['post_type'] = $post_type_param;
			}
		}
		if ( isset( $block->context['query']['sticky'] ) && ! empty( $block->context['query']['sticky'] ) ) {
			$sticky = get_option( 'sticky_posts' );
			if ( 'only' === $block->context['query']['sticky'] ) {
				/**
				 * Passing an empty array to post__in will return have_posts() as true (and all posts will be returned).
				 * Logic should be used before hand to determine if WP_Query should be used in the event that the array
				 * being passed to post__in is empty.
				 *
				 * @see https://core.trac.wordpress.org/ticket/28099
				 */
				$query['post__in']            = ! empty( $sticky ) ? $sticky : array( 0 );
				$query['ignore_sticky_posts'] = 1;
			} else {
				$query['post__not_in'] = array_merge( $query['post__not_in'], $sticky );
			}
		}
		if ( ! empty( $block->context['query']['exclude'] ) ) {
			$excluded_post_ids     = array_map( 'intval', $block->context['query']['exclude'] );
			$excluded_post_ids     = array_filter( $excluded_post_ids );
			$query['post__not_in'] = array_merge( $query['post__not_in'], $excluded_post_ids );
		}
		if (
			isset( $block->context['query']['perPage'] ) &&
			is_numeric( $block->context['query']['perPage'] )
		) {
			$per_page = absint( $block->context['query']['perPage'] );
			$offset   = 0;

			if (
				isset( $block->context['query']['offset'] ) &&
				is_numeric( $block->context['query']['offset'] )
			) {
				$offset = absint( $block->context['query']['offset'] );
			}

			$query['offset']         = ( $per_page * ( $page - 1 ) ) + $offset;
			$query['posts_per_page'] = $per_page;
		}

		// Migrate `categoryIds` and `tagIds` to `tax_query` for backwards compatibility.
		if ( ! empty( $block->context['query']['categoryIds'] ) || ! empty( $block->context['query']['tagIds'] ) ) {
			$tax_query = array();
			if ( ! empty( $block->context['query']['categoryIds'] ) ) {
				$tax_query[] = array(
					'taxonomy'         => 'category',
					'terms'            => array_filter( array_map( 'intval', $block->context['query']['categoryIds'] ) ),
					'include_children' => false,
				);
			}
			if ( ! empty( $block->context['query']['tagIds'] ) ) {
				$tax_query[] = array(
					'taxonomy'         => 'post_tag',
					'terms'            => array_filter( array_map( 'intval', $block->context['query']['tagIds'] ) ),
					'include_children' => false,
				);
			}
			$query['tax_query'] = $tax_query;
		}
		if ( ! empty( $block->context['query']['taxQuery'] ) ) {
			$query['tax_query'] = array();
			foreach ( $block->context['query']['taxQuery'] as $taxonomy => $terms ) {
				if ( is_taxonomy_viewable( $taxonomy ) && ! empty( $terms ) ) {
					$query['tax_query'][] = array(
						'taxonomy'         => $taxonomy,
						'terms'            => array_filter( array_map( 'intval', $terms ) ),
						'include_children' => false,
					);
				}
			}
		}
		if (
			isset( $block->context['query']['order'] ) &&
				in_array( strtoupper( $block->context['query']['order'] ), array( 'ASC', 'DESC' ), true )
		) {
			$query['order'] = strtoupper( $block->context['query']['order'] );
		}
		if ( isset( $block->context['query']['orderBy'] ) ) {
			$query['orderby'] = $block->context['query']['orderBy'];
		}
		if (
			isset( $block->context['query']['author'] ) &&
			(int) $block->context['query']['author'] > 0
		) {
			$query['author'] = (int) $block->context['query']['author'];
		}
		if ( ! empty( $block->context['query']['search'] ) ) {
			$query['s'] = $block->context['query']['search'];
		}
		if ( ! empty( $block->context['query']['parents'] ) && is_post_type_hierarchical( $query['post_type'] ) ) {
			$query['post_parent__in'] = array_filter( array_map( 'intval', $block->context['query']['parents'] ) );
		}
	}

	/**
	 * Filters the arguments which will be passed to `WP_Query` for the Query Loop Block.
	 *
	 * Anything to this filter should be compatible with the `WP_Query` API to form
	 * the query context which will be passed down to the Query Loop Block's children.
	 * This can help, for example, to include additional settings or meta queries not
	 * directly supported by the core Query Loop Block, and extend its capabilities.
	 *
	 * Please note that this will only influence the query that will be rendered on the
	 * front-end. The editor preview is not affected by this filter. Also, worth noting
	 * that the editor preview uses the REST API, so, ideally, one should aim to provide
	 * attributes which are also compatible with the REST API, in order to be able to
	 * implement identical queries on both sides.
	 *
	 * @since 6.1.0
	 *
	 * @param array    $query Array containing parameters for `WP_Query` as parsed by the block context.
	 * @param WP_Block $block Block instance.
	 * @param int      $page  Current query's page.
	 */
	return apply_filters( 'query_loop_block_query_vars', $query, $block, $page );
}
