<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 5.8.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Block_Editor_Context' ) ) {
	require_once __DIR__ . '/class-wp-block-editor-context.php';
}

require_once __DIR__ . '/block-editor.php';

if ( ! function_exists( 'build_query_vars_from_query_block' ) ) {
	/**
	 * Helper function that constructs a WP_Query args array from
	 * a `Query` block properties.
	 *
	 * It's used in QueryLoop, QueryPaginationNumbers and QueryPaginationNext blocks.
	 *
	 * @param WP_Block $block Block instance.
	 * @param int      $page  Current query's page.
	 *
	 * @return array Returns the constructed WP_Query arguments.
	 */
	function build_query_vars_from_query_block( $block, $page ) {
		$query = array(
			'post_type'    => 'post',
			'order'        => 'DESC',
			'orderby'      => 'date',
			'post__not_in' => array(),
		);

		if ( isset( $block->context['query'] ) ) {
			if ( isset( $block->context['query']['postType'] ) ) {
				$query['post_type'] = $block->context['query']['postType'];
			}
			if ( isset( $block->context['query']['sticky'] ) && ! empty( $block->context['query']['sticky'] ) ) {
				$sticky = get_option( 'sticky_posts' );
				if ( 'only' === $block->context['query']['sticky'] ) {
					$query['post__in'] = $sticky;
				} else {
					$query['post__not_in'] = array_merge( $query['post__not_in'], $sticky );
				}
			}
			if ( isset( $block->context['query']['exclude'] ) ) {
				$query['post__not_in'] = array_merge( $query['post__not_in'], $block->context['query']['exclude'] );
			}
			if ( isset( $block->context['query']['perPage'] ) ) {
				$query['offset']         = ( $block->context['query']['perPage'] * ( $page - 1 ) ) + $block->context['query']['offset'];
				$query['posts_per_page'] = $block->context['query']['perPage'];
			}
			if ( isset( $block->context['query']['categoryIds'] ) ) {
				$query['category__in'] = $block->context['query']['categoryIds'];
			}
			if ( isset( $block->context['query']['tagIds'] ) ) {
				$query['tag__in'] = $block->context['query']['tagIds'];
			}
			if ( isset( $block->context['query']['order'] ) ) {
				$query['order'] = strtoupper( $block->context['query']['order'] );
			}
			if ( isset( $block->context['query']['orderBy'] ) ) {
				$query['orderby'] = $block->context['query']['orderBy'];
			}
			if ( isset( $block->context['query']['author'] ) ) {
				$query['author'] = $block->context['query']['author'];
			}
			if ( isset( $block->context['query']['search'] ) ) {
				$query['s'] = $block->context['query']['search'];
			}
		}
		return $query;
	}
}
