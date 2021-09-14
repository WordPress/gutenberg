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

if ( ! function_exists( 'gutenberg_render_legacy_query_loop_block' ) ) {
	/**
	 * Renders the legacy `core/query-loop` block on the server.
	 * It triggers a developer warning and then calls the renamed
	 * block's `render_callback` function output.
	 *
	 * @param array    $attributes Block attributes.
	 * @param string   $content    Block default content.
	 * @param WP_Block $block      Block instance.
	 *
	 * @return string Returns the output of the query, structured using the layout defined by the block's inner blocks.
	 */
	function gutenberg_render_legacy_query_loop_block( $attributes, $content, $block ) {
		trigger_error(
		/* translators: %1$s: Block type */
			sprintf( __( 'Block %1$s has been renamed to Post Template. %1$s will be supported until WordPress version 5.9.', 'gutenberg' ), $block->name ),
			headers_sent() || WP_DEBUG ? E_USER_WARNING : E_USER_NOTICE
		);
		return gutenberg_render_block_core_post_template( $attributes, $content, $block );
	}
}

if ( ! function_exists( 'gutenberg_register_legacy_query_loop_block' ) ) {
	/**
	 * Complements the renaming of `Query Loop` to `Post Template`.
	 * This ensures backwards compatibility for any users running the Gutenberg
	 * plugin who have used Query Loop prior to its renaming.
	 *
	 * @see    https://github.com/WordPress/gutenberg/pull/32514
	 */
	function gutenberg_register_legacy_query_loop_block() {
		$registry = WP_Block_Type_Registry::get_instance();
		if ( $registry->is_registered( 'core/query-loop' ) ) {
			unregister_block_type( 'core/query-loop' );
		}
		register_block_type(
			'core/query-loop',
			array(
				'category'          => 'design',
				'uses_context'      => array(
					'queryId',
					'query',
					'queryContext',
					'displayLayout',
					'templateSlug',
				),
				'supports'          => array(
					'reusable' => false,
					'html'     => false,
					'align'    => true,
				),
				'style'             => 'wp-block-post-template',
				'render_callback'   => 'gutenberg_render_legacy_query_loop_block',
				'skip_inner_blocks' => true,
			)
		);
	}

	add_action( 'init', 'gutenberg_register_legacy_query_loop_block' );
}

if ( ! function_exists( 'get_query_pagination_arrow' ) ) {
	/**
	 * Helper function that returns the proper pagination arrow html for
	 * `QueryPaginationNext` and `QueryPaginationPrevious` blocks based
	 * on the provided `paginationArrow` from `QueryPagination` context.
	 *
	 * It's used in QueryPaginationNext and QueryPaginationPrevious blocks.
	 *
	 * @param WP_Block $block   Block instance.
	 * @param boolean  $is_next Flag for hanlding `next/previous` blocks.
	 *
	 * @return string|null Returns the constructed WP_Query arguments.
	 */
	function get_query_pagination_arrow( $block, $is_next ) {
		$arrow_map = array(
			'none'    => '',
			'arrow'   => array(
				'next'     => '→',
				'previous' => '←',
			),
			'chevron' => array(
				'next'     => '»',
				'previous' => '«',
			),
		);
		if ( ! empty( $block->context['paginationArrow'] ) && array_key_exists( $block->context['paginationArrow'], $arrow_map ) && ! empty( $arrow_map[ $block->context['paginationArrow'] ] ) ) {
			$pagination_type = $is_next ? 'next' : 'previous';
			$arrow_attribute = $block->context['paginationArrow'];
			$arrow           = $arrow_map[ $block->context['paginationArrow'] ][ $pagination_type ];
			$arrow_classes   = "wp-block-query-pagination-$pagination_type-arrow is-arrow-$arrow_attribute";
			return "<span class='$arrow_classes'>$arrow</span>";
		}
		return null;
	}
}
