<?php
/**
 * Server-side rendering of the `core/query` block.
 *
 * @package WordPress
 */

/**
 * Modifies the static `core/query` block on the server.
 *
 * @since 6.4.0
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      The block instance.
 *
 * @return string Returns the modified output of the query block.
 */
function render_block_core_query( $attributes, $content, $block ) {
	$is_interactive = isset( $attributes['enhancedPagination'] )
		&& true === $attributes['enhancedPagination']
		&& isset( $attributes['queryId'] );

	// Enqueue the script module and add the necessary directives if the block is
	// interactive.
	if ( $is_interactive ) {
		wp_enqueue_script_module( '@wordpress/block-library/query/view' );

		$p = new WP_HTML_Tag_Processor( $content );
		if ( $p->next_tag() ) {
			// Add the necessary directives.
			$p->set_attribute( 'data-wp-interactive', 'core/query' );
			$p->set_attribute( 'data-wp-router-region', 'query-' . $attributes['queryId'] );
			$p->set_attribute( 'data-wp-context', '{}' );
			$p->set_attribute( 'data-wp-key', $attributes['queryId'] );
			$content = $p->get_updated_html();
		}
	}

	// Add the styles to the block type if the block is interactive and remove
	// them if it's not.
	$style_asset = 'wp-block-query';
	if ( ! wp_style_is( $style_asset ) ) {
		$style_handles = $block->block_type->style_handles;
		// If the styles are not needed, and they are still in the `style_handles`, remove them.
		if ( ! $is_interactive && in_array( $style_asset, $style_handles, true ) ) {
			$block->block_type->style_handles = array_diff( $style_handles, array( $style_asset ) );
		}
		// If the styles are needed, but they were previously removed, add them again.
		if ( $is_interactive && ! in_array( $style_asset, $style_handles, true ) ) {
			$block->block_type->style_handles = array_merge( $style_handles, array( $style_asset ) );
		}
	}

	return $content;
}

/**
 * Registers the `core/query` block on the server.
 *
 * @since 5.8.0
 */
function register_block_core_query() {
	register_block_type_from_metadata(
		__DIR__ . '/query',
		array(
			'render_callback' => 'render_block_core_query',
		)
	);
}
add_action( 'init', 'register_block_core_query' );

/**
 * Traverse the tree of blocks looking for any plugin block (i.e., a block from
 * an installed plugin) inside a Query block with the enhanced pagination
 * enabled. If at least one is found, the enhanced pagination is effectively
 * disabled to prevent any potential incompatibilities.
 *
 * @since 6.4.0
 *
 * @param array $parsed_block The block being rendered.
 * @return array Returns the parsed block, unmodified.
 */
function block_core_query_disable_enhanced_pagination( $parsed_block ) {
	static $enhanced_query_stack   = array();
	static $dirty_enhanced_queries = array();
	static $render_query_callback  = null;

	$block_name              = $parsed_block['blockName'];
	$block_type              = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
	$has_enhanced_pagination = isset( $parsed_block['attrs']['enhancedPagination'] ) && true === $parsed_block['attrs']['enhancedPagination'] && isset( $parsed_block['attrs']['queryId'] );
	/*
	 * Client side navigation can be true in two states:
	 *  - supports.interactivity = true;
	 *  - supports.interactivity.clientNavigation = true;
	 */
	$supports_client_navigation = ( isset( $block_type->supports['interactivity']['clientNavigation'] ) && true === $block_type->supports['interactivity']['clientNavigation'] )
		|| ( isset( $block_type->supports['interactivity'] ) && true === $block_type->supports['interactivity'] );

	if ( 'core/query' === $block_name && $has_enhanced_pagination ) {
		$enhanced_query_stack[] = $parsed_block['attrs']['queryId'];

		if ( ! isset( $render_query_callback ) ) {
			/**
			 * Filter that disables the enhanced pagination feature during block
			 * rendering when a plugin block has been found inside. It does so
			 * by adding an attribute called `data-wp-navigation-disabled` which
			 * is later handled by the front-end logic.
			 *
			 * @param string   $content  The block content.
			 * @param array    $block    The full block, including name and attributes.
			 * @return string Returns the modified output of the query block.
			 */
			$render_query_callback = static function ( $content, $block ) use ( &$enhanced_query_stack, &$dirty_enhanced_queries, &$render_query_callback ) {
				$has_enhanced_pagination = isset( $block['attrs']['enhancedPagination'] ) && true === $block['attrs']['enhancedPagination'] && isset( $block['attrs']['queryId'] );

				if ( ! $has_enhanced_pagination ) {
					return $content;
				}

				if ( isset( $dirty_enhanced_queries[ $block['attrs']['queryId'] ] ) ) {
					// Disable navigation in the router store config.
					wp_interactivity_config( 'core/router', array( 'clientNavigationDisabled' => true ) );
					$dirty_enhanced_queries[ $block['attrs']['queryId'] ] = null;
				}

				array_pop( $enhanced_query_stack );

				if ( empty( $enhanced_query_stack ) ) {
					remove_filter( 'render_block_core/query', $render_query_callback );
					$render_query_callback = null;
				}

				return $content;
			};

			add_filter( 'render_block_core/query', $render_query_callback, 10, 2 );
		}
	} elseif (
		! empty( $enhanced_query_stack ) &&
		isset( $block_name ) &&
		( ! $supports_client_navigation )
	) {
		foreach ( $enhanced_query_stack as $query_id ) {
			$dirty_enhanced_queries[ $query_id ] = true;
		}
	}

	return $parsed_block;
}

add_filter( 'render_block_data', 'block_core_query_disable_enhanced_pagination', 10, 1 );

/**
 * Applies meta key ordering and filtering to the Query Loop block's WP_Query arguments.
 *
 * Parses the `query` context attributes configured in the block's inspector controls
 * and translates them into native `WP_Query` and `WP_Meta_Query` parameters.
 * Supports meta value sorting, preset and custom date-range filtering, and generic
 * text/numeric filtering. Includes the `query_loop_meta_clause` filter to allow
 * third-party plugins to intercept and modify the generated meta clause.
 *
 * @since 23.4.0
 *
 * @param array    $query WP_Query arguments array being built.
 * @param WP_Block $block The Query Loop block instance.
 * @return array Returns the modified WP_Query arguments.
 */
function block_core_query_apply_meta_query_vars( $query, $block ) {
	$query_context = $block->context['query'] ?? array();

	$post_type  = isset( $query_context['postType'] ) ? sanitize_text_field( $query_context['postType'] ) : 'post';
	$meta_key   = isset( $query_context['metaKey'] ) ? sanitize_key( $query_context['metaKey'] ) : '';
	$meta_type  = isset( $query_context['metaType'] ) ? sanitize_text_field( $query_context['metaType'] ) : 'CHAR';
	$date_range = isset( $query_context['dateRange'] ) ? sanitize_text_field( $query_context['dateRange'] ) : '';
	$meta_value = isset( $query_context['metaValue'] ) ? sanitize_text_field( $query_context['metaValue'] ) : '';
	$start_date = isset( $query_context['metaDateStart'] ) ? sanitize_text_field( $query_context['metaDateStart'] ) : '';
	$end_date   = isset( $query_context['metaDateEnd'] ) ? sanitize_text_field( $query_context['metaDateEnd'] ) : '';

	$meta_compare_raw = isset( $query_context['metaCompare'] ) ? sanitize_text_field( $query_context['metaCompare'] ) : '=';
	$meta_compare     = html_entity_decode( $meta_compare_raw );
	if ( ! in_array( $meta_compare, array( '=', '!=', '>', '<', 'LIKE' ), true ) ) {
		$meta_compare = '=';
	}

	$order_by = $query['orderby'] ?? '';

	if ( empty( $meta_key ) || is_protected_meta( $meta_key, $post_type ) ) {
		return $query;
	}

	$meta_order_types = array( 'meta_value', 'meta_value_num' );
	if ( in_array( $order_by, $meta_order_types, true ) ) {
		/*
		* Using `meta_key` can result in slow queries on sites with large amounts of post meta.
		* However, it is a necessary evil for filtering by custom field values.
		*/
		$query['meta_key']  = $meta_key; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		$query['meta_type'] = $meta_type;

		if ( 'DATE' === $meta_type ) {
			$query['orderby'] = 'meta_value';
		}
	}

	$meta_clause = null;

	if ( ! empty( $date_range ) ) {
		$today = current_time( 'Y-m-d' );

		if ( 'custom' === $date_range ) {
			if ( $start_date && $end_date ) {
				$meta_clause = array(
					'key'     => $meta_key,
					'value'   => array( $start_date, $end_date ),
					'compare' => 'BETWEEN',
					'type'    => $meta_type,
				);
			} elseif ( $start_date ) {
				$meta_clause = array(
					'key'     => $meta_key,
					'value'   => $start_date,
					'compare' => '>=',
					'type'    => $meta_type,
				);
			} elseif ( $end_date ) {
				$meta_clause = array(
					'key'     => $meta_key,
					'value'   => $end_date,
					'compare' => '<=',
					'type'    => $meta_type,
				);
			}
		} else {
			$compare_map = array(
				'future' => '>=',
				'past'   => '<',
				'today'  => '=',
			);

			if ( isset( $compare_map[ $date_range ] ) ) {
				$meta_clause = array(
					'key'     => $meta_key,
					'value'   => $today,
					'compare' => $compare_map[ $date_range ],
					'type'    => $meta_type,
				);
			}
		}
	} elseif ( '' !== $meta_value ) {
		$meta_clause = array(
			'key'     => $meta_key,
			'value'   => $meta_value,
			'compare' => $meta_compare,
			'type'    => $meta_type,
		);
	}

	if ( $meta_clause ) {
		$meta_clause = apply_filters( 'query_loop_meta_clause', $meta_clause, $meta_key, $date_range, $meta_type, $start_date, $end_date );

		if ( $meta_clause && is_array( $meta_clause ) ) {
			if ( ! empty( $query['meta_query'] ) ) {
				/*
				* Using `meta_query` can result in slow queries on sites with large amounts of post meta.
				* However, it is a necessary evil for filtering by custom field values.
				*/
				$query['meta_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
					'relation' => 'AND',
					$query['meta_query'],
					$meta_clause,
				);
			} else {
				/*
				* Using `meta_query` can result in slow queries on sites with large amounts of post meta.
				* However, it is a necessary evil for filtering by custom field values.
				*/
				$query['meta_query'] = array( $meta_clause ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
			}
		}
	}

	return $query;
}
add_filter( 'query_loop_block_query_vars', 'block_core_query_apply_meta_query_vars', 10, 3 );
