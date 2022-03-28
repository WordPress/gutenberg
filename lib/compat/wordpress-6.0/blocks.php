<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Helper function that constructs a WP_Query args array from
 * a `Query` block properties.
 *
 * It's used in QueryLoop, QueryPaginationNumbers and QueryPaginationNext blocks.
 *
 * `build_query_vars_from_query_block` was introduced in 5.8, for 6.0 we just need
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

		// We need to migrate `categoryIds` and `tagIds` to `tax_query` for backwards compatibility.
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
		if ( ! empty( $block->context['query']['author'] ) ) {
			$query['author'] = $block->context['query']['author'];
		}
		if ( ! empty( $block->context['query']['search'] ) ) {
			$query['s'] = $block->context['query']['search'];
		}
	}
	return $query;
}

/**
 * Registers view scripts for core blocks if handling is missing in WordPress core.
 *
 * This is a temporary solution until the Gutenberg plugin sets
 * the required WordPress version to 6.0.
 *
 * @param array $settings Array of determined settings for registering a block type.
 * @param array $metadata Metadata provided for registering a block type.
 *
 * @return array Array of settings for registering a block type.
 */
function gutenberg_block_type_metadata_view_script( $settings, $metadata ) {
	if (
		! isset( $metadata['viewScript'] ) ||
		! empty( $settings['view_script'] ) ||
		! isset( $metadata['file'] ) ||
		strpos( $metadata['file'], gutenberg_dir_path() ) !== 0
	) {
		return $settings;
	}

	$view_script_path = realpath( dirname( $metadata['file'] ) . '/' . remove_block_asset_path_prefix( $metadata['viewScript'] ) );

	if ( file_exists( $view_script_path ) ) {
		$view_script_id     = str_replace( array( '.min.js', '.js' ), '', basename( remove_block_asset_path_prefix( $metadata['viewScript'] ) ) );
		$view_script_handle = str_replace( 'core/', 'wp-block-', $metadata['name'] ) . '-' . $view_script_id;
		wp_deregister_script( $view_script_handle );

		// Replace suffix and extension with `.asset.php` to find the generated dependencies file.
		$view_asset_file          = substr( $view_script_path, 0, -( strlen( '.js' ) ) ) . '.asset.php';
		$view_asset               = file_exists( $view_asset_file ) ? require( $view_asset_file ) : null;
		$view_script_dependencies = isset( $view_asset['dependencies'] ) ? $view_asset['dependencies'] : array();
		$view_script_version      = isset( $view_asset['version'] ) ? $view_asset['version'] : false;
		$result                   = wp_register_script(
			$view_script_handle,
			gutenberg_url( str_replace( gutenberg_dir_path(), '', $view_script_path ) ),
			$view_script_dependencies,
			$view_script_version
		);
		if ( $result ) {
			$settings['view_script'] = $view_script_handle;
		}
	}
	return $settings;
}
add_filter( 'block_type_metadata_settings', 'gutenberg_block_type_metadata_view_script', 10, 2 );
