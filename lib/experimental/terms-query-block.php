<?php
/**
 * Terms Query block helpers.
 *
 * @since 6.9.0
 * @package gutenberg
 * @subpackage Blocks
 */

if ( ! function_exists( 'build_query_vars_from_terms_query_block' ) ) {
	/**
	 * Helper function that constructs a WP_Term_Query args array from a Terms Query
	 * block's attributes.
	 *
	 * @param WP_Block $block Block instance.
	 * @param int      $page Current query's page.
	 *
	 * @return array Returns the constructed WP_Term_Query arguments.
	 */
	function build_query_vars_from_terms_query_block( $block, $page = 1 ) {
		$query = array(
			'taxonomy'     => 'category',
			'number'       => 10,
			'order'        => 'asc',
			'orderby'      => 'name',
			'hide_empty'   => true,
			'parent'       => 0,
			'hierarchical' => false,
		);

		if ( isset( $block->context['termQuery'] ) ) {
			if ( ! empty( $block->context['termQuery']['taxonomy'] ) ) {
				$taxonomy_param = $block->context['termQuery']['taxonomy'];
				if ( is_taxonomy_viewable( $taxonomy_param ) ) {
					$query['taxonomy'] = $taxonomy_param;
				}
			}
			if ( isset( $block->context['termQuery']['exclude'] ) ) {
				$excluded_term_ids = array_map( 'intval', $block->context['termQuery']['exclude'] );
				$excluded_term_ids = array_filter( $excluded_term_ids );
				$query['exclude']  = $excluded_term_ids;
			}
			if (
				isset( $block->context['termQuery']['perPage'] )
				&& is_numeric( $block->context['termQuery']['perPage'] )
			) {
				$per_page = absint( $block->context['termQuery']['perPage'] );
				$offset   = 0;

				if (
					isset( $block->context['termQuery']['offset'] )
					&& is_numeric( $block->context['termQuery']['offset'] )
				) {
					$offset = absint( $block->context['termQuery']['offset'] );
				}

				$query['offset'] = ( $per_page * ( $page - 1 ) ) + $offset;
				$query['number'] = $per_page;
			}
			if (
				isset( $block->context['termQuery']['order'] )
				&& in_array(
					strtoupper( $block->context['termQuery']['order'] ),
					array( 'ASC', 'DESC' ),
					true
				)
			) {
				$query['order'] = strtoupper( $block->context['termQuery']['order'] );
			}
			if ( isset( $block->context['termQuery']['orderby'] ) ) {
				$query['orderby'] = $block->context['termQuery']['orderby'];
			}
			if (
				isset( $block->context['termQuery']['hideEmpty'] )
				&& ! $block->context['termQuery']['hideEmpty']
			) {
				$query['hide_empty'] = false;
			}
			if (
				is_taxonomy_hierarchical( $query['taxonomy'] )
				&& isset( $block->context['termQuery']['parent'] )
			) {
				$query['parent'] = $block->context['termQuery']['parent'] || 0;
			}
		}

		/**
		 * Filters the arguments which will be passed to `WP_Term_Query` for the Terms Query Block.
		 *
		 * Anything to this filter should be compatible with the `WP_Term_Query` API to form
		 * the query context which will be passed down to the Terms Query Block's children.
		 * This can help, for example, to include additional settings or meta queries not
		 * directly supported by the core Terms Query Block, and extend its capabilities.
		 *
		 * Please note that this will only influence the query that will be rendered on the
		 * front-end. The editor preview is not affected by this filter. Also, worth noting
		 * that the editor preview uses the REST API, so, ideally, one should aim to provide
		 * attributes which are also compatible with the REST API, in order to be able to
		 * implement identical queries on both sides.
		 *
		 * @since 6.9.0
		 *
		 * @param array    $query Array containing parameters for `WP_Term_Query` as parsed by the block context.
		 * @param WP_Block $block Block instance.
		 * @param int      $page  Current query's page.
		 */
		return apply_filters( 'terms_query_block_query_vars', $query, $block, $page );
	}
}
