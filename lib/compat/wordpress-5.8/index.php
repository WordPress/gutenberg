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
require_once __DIR__ . '/blocks.php';

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
			if ( ! empty( $block->context['query']['postType'] ) ) {
				$post_type_param = $block->context['query']['postType'];
				if ( is_post_type_viewable( $post_type_param ) ) {
					$query['post_type'] = $post_type_param;
				}
			}
			if ( isset( $block->context['query']['sticky'] ) && ! empty( $block->context['query']['sticky'] ) ) {
				$sticky = get_option( 'sticky_posts' );
				if ( 'only' === $block->context['query']['sticky'] ) {
					$query['post__in'] = $sticky;
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
			if ( ! empty( $block->context['query']['categoryIds'] ) ) {
				$term_ids              = array_map( 'intval', $block->context['query']['categoryIds'] );
				$term_ids              = array_filter( $term_ids );
				$query['category__in'] = $term_ids;
			}
			if ( ! empty( $block->context['query']['tagIds'] ) ) {
				$term_ids         = array_map( 'intval', $block->context['query']['tagIds'] );
				$term_ids         = array_filter( $term_ids );
				$query['tag__in'] = $term_ids;
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
		}
		return $query;
	}
}

/**
 * Ensures that a core legacy widget has a key when on a version of WordPress earlier than 5.8.
 *
 * This can be removed once the plugin's minimum version of WordPress is increased to 5.8.
 *
 * @param string $widget_key The widget key.
 * @param string $id_base    The widget ID base.
 * @return string The widget key.
 */
function gutenberg_filter_core_legacy_widget_key( $widget_key, $id_base ) {
	global $wp_widget_factory;

	if ( method_exists( $wp_widget_factory, 'get_widget_key' ) ) {
		return $widget_key;
	}

	return gutenberg_get_widget_key( $id_base );
}
add_filter( 'render_block_core_legacy_widget_key', 'gutenberg_filter_core_legacy_widget_key', 10, 2 );

/**
 * Ensures that a core legacy widget object is found when on a version of WordPress earlier than 5.8.
 *
 * This can be removed once the plugin's minimum version of WordPress is increased to 5.8.
 *
 * @param string $widget_object The widget object.
 * @param string $id_base       The widget ID base.
 * @return WP_Widget|null The widget object.
 */
function gutenberg_filter_core_legacy_widget_object( $widget_object, $id_base ) {
	global $wp_widget_factory;

	if ( method_exists( $wp_widget_factory, 'get_widget_object' ) ) {
		return $widget_object;
	}

	return gutenberg_get_widget_object( $id_base );
}
add_filter( 'render_block_core_legacy_widget_object', 'gutenberg_filter_core_legacy_widget_object', 10, 2 );
