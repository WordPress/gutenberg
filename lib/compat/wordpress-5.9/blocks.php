<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 5.9.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'get_query_pagination_arrow' ) ) {
	/**
	 * Helper function that returns the proper pagination arrow html for
	 * `QueryPaginationNext` and `QueryPaginationPrevious` blocks based
	 * on the provided `paginationArrow` from `QueryPagination` context.
	 *
	 * It's used in QueryPaginationNext and QueryPaginationPrevious blocks.
	 *
	 * @param WP_Block $block   Block instance.
	 * @param boolean  $is_next Flag for handling `next/previous` blocks.
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
