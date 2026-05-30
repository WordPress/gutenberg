<?php
/**
 * Compatibility shims for block APIs for WordPress 7.1.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'build_terms_query_vars_from_block' ) ) {
	/**
	 * Builds query vars for terms from a block instance.
	 *
	 * @since 7.1.0
	 *
	 * @param WP_Block $block Block instance.
	 * @return array Query vars suitable for get_terms() or wp_count_terms().
	 */
	function build_terms_query_vars_from_block( $block ) {
		$query = $block->context['termQuery'];

		$query_vars = array(
			'number'     => $query['perPage'],
			'order'      => $query['order'],
			'orderby'    => $query['orderBy'],
			'hide_empty' => $query['hideEmpty'],
		);

		$inherit_query = isset( $query['inherit'] ) && $query['inherit'] && ( is_tax() || is_category() || is_tag() );

		if ( $inherit_query ) {
			// Get the current term and taxonomy from the queried object.
			$queried_object = get_queried_object();

			// For hierarchical taxonomies, show children of the current term.
			// For non-hierarchical taxonomies, show all terms (don't set parent).
			if ( is_taxonomy_hierarchical( $queried_object->taxonomy ) ) {
				// If showNested is true, use child_of to include nested terms.
				// Otherwise, use parent to show only direct children.
				if ( ! empty( $query['showNested'] ) ) {
					$query_vars['child_of'] = $queried_object->term_id;
				} else {
					$query_vars['parent'] = $queried_object->term_id;
				}
			}
			$query_vars['taxonomy'] = $queried_object->taxonomy;
		} else {
			// If not inheriting set `taxonomy` from the block attribute.
			$query_vars['taxonomy'] = $query['taxonomy'];

			// If we are including specific terms we ignore `showNested` argument.
			if ( ! empty( $query['include'] ) ) {
				$query_vars['include'] = array_unique( array_map( 'intval', $query['include'] ) );
				$query_vars['orderby'] = 'include';
				$query_vars['order']   = 'asc';
			} elseif ( is_taxonomy_hierarchical( $query['taxonomy'] ) && empty( $query['showNested'] ) ) {
				// We set parent only when inheriting from the taxonomy archive context or not
				// showing nested terms, otherwise nested terms are not displayed.
				$query_vars['parent'] = 0;
			}
		}

		return $query_vars;
	}
}

if ( ! function_exists( 'terms_query_register_query_vars' ) ) {
	/**
	 * Registers the 'termspage' query variable for terms pagination.
	 *
	 * @since 7.1.0
	 *
	 * @param array $vars The array of existing query variables.
	 * @return array Modified query variables including 'termspage'.
	 */
	function terms_query_register_query_vars( $vars ) {
		$vars[] = 'termspage';
		return $vars;
	}
}

add_filter( 'query_vars', 'terms_query_register_query_vars', 10, 1 );
