<?php
/**
 * Server-side rendering of the `core/query-pagination-numbers` block.
 *
 * @package WordPress
 */

/**
 * Returns the query string key holding the selected letter of a Query Loop block.
 *
 * Mirrors the `query-{queryId}-page` convention of the pagination blocks so that
 * several Query Loop blocks on one page stay independent of each other.
 *
 * @since 7.2.0
 *
 * @param WP_Block $block Block instance.
 *
 * @return string Returns the query string key.
 */
function block_core_query_pagination_numbers_get_letter_key( $block ) {
	return isset( $block->context['queryId'] )
		? 'query-' . $block->context['queryId'] . '-letter'
		: 'query-letter';
}

/**
 * Returns the letter currently selected for a Query Loop block, if any.
 *
 * @since 7.2.0
 *
 * @param WP_Block $block Block instance.
 *
 * @return string Returns the selected letter, or an empty string.
 */
function block_core_query_pagination_numbers_get_selected_letter( $block ) {
	$letter_key = block_core_query_pagination_numbers_get_letter_key( $block );

	if ( empty( $_GET[ $letter_key ] ) || ! is_string( $_GET[ $letter_key ] ) ) {
		return '';
	}

	return sanitize_text_field( wp_unslash( $_GET[ $letter_key ] ) );
}

/**
 * Returns the first letters that the posts matching a query actually start with.
 *
 * The alphabet is derived from the post titles rather than hardcoded, so a site
 * in any locale gets a usable set of letters without configuration. Titles that
 * do not start with a letter, such as "3M", are collected under a single "#".
 *
 * Both this and `block_core_query_pagination_numbers_filter_posts_where()` run
 * under the collation of the posts table, so the letters offered and the posts
 * matched always agree.
 *
 * @since 7.2.0
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param array $args Query vars as built by `build_query_vars_from_query_block()`.
 *
 * @return array Returns a list of buckets, each with a `label` string and the
 *               `chars` it matches.
 */
function block_core_query_pagination_numbers_get_initials( $args ) {
	global $wpdb;

	// The letters describe the unfiltered result set.
	unset( $args['query_loop_title_initials'] );

	/*
	 * Look at every matching post, not just the current page. `nopaging` makes
	 * WP_Query drop the LIMIT clause, which also makes it ignore `offset`.
	 */
	$args['posts_per_page']         = -1;
	$args['nopaging']               = true;
	$args['paged']                  = 1;
	$args['offset']                 = 0;
	$args['no_found_rows']          = true;
	$args['ignore_sticky_posts']    = true;
	$args['update_post_meta_cache'] = false;
	$args['update_post_term_cache'] = false;
	$args['fields']                 = 'ids';

	$cache_key = 'title_initials_' . md5( wp_json_encode( $args ) ) . ':' . wp_cache_get_last_changed( 'posts' );
	$cached    = wp_cache_get( $cache_key, 'query-block' );
	if ( false !== $cached ) {
		return $cached;
	}

	$rows = array();

	/*
	 * Rewrite the query into a single `SELECT DISTINCT` of first characters.
	 * Going through WP_Query keeps every other part of it - post type, status,
	 * taxonomies, author, search - identical to what the loop itself renders,
	 * without loading a single post.
	 */
	$select_initial  = static function () use ( $wpdb ) {
		return "UPPER( LEFT( {$wpdb->posts}.post_title, 1 ) )";
	};
	$select_distinct = static function () {
		return 'DISTINCT';
	};
	$select_nothing  = static function () {
		return '';
	};
	$capture_rows    = static function ( $posts, $query ) use ( &$rows, $wpdb ) {
		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- Assembled by WP_Query itself.
		$rows = $wpdb->get_col( $query->request );
		// Returning an array short-circuits WP_Query's own execution.
		return array();
	};

	add_filter( 'posts_fields', $select_initial, 99 );
	add_filter( 'posts_distinct', $select_distinct, 99 );
	add_filter( 'posts_groupby', $select_nothing, 99 );
	add_filter( 'posts_orderby', $select_nothing, 99 );
	add_filter( 'posts_pre_query', $capture_rows, 99, 2 );

	new WP_Query( $args );

	remove_filter( 'posts_fields', $select_initial, 99 );
	remove_filter( 'posts_distinct', $select_distinct, 99 );
	remove_filter( 'posts_groupby', $select_nothing, 99 );
	remove_filter( 'posts_orderby', $select_nothing, 99 );
	remove_filter( 'posts_pre_query', $capture_rows, 99 );

	$letters     = array();
	$non_letters = array();
	foreach ( $rows as $initial ) {
		if ( ! is_string( $initial ) || '' === $initial ) {
			continue;
		}
		if ( preg_match( '/^\p{L}/u', $initial ) ) {
			// Keyed to drop duplicates that the collation considers distinct.
			$letters[ $initial ] = $initial;
		} else {
			$non_letters[ $initial ] = $initial;
		}
	}

	$letters = array_values( $letters );
	block_core_query_pagination_numbers_sort_initials( $letters );

	$buckets = array();
	if ( ! empty( $non_letters ) ) {
		$buckets[] = array(
			'label' => '#',
			'chars' => array_values( $non_letters ),
		);
	}
	foreach ( $letters as $letter ) {
		$buckets[] = array(
			'label' => $letter,
			'chars' => array( $letter ),
		);
	}

	wp_cache_set( $cache_key, $buckets, 'query-block' );

	return $buckets;
}

/**
 * Sorts a list of letters in the order of the current locale.
 *
 * @since 7.2.0
 *
 * @param array $initials List of single characters, sorted in place.
 */
function block_core_query_pagination_numbers_sort_initials( &$initials ) {
	if ( class_exists( 'Collator' ) ) {
		try {
			$collator = new Collator( get_locale() );
			$collator->sort( $initials );
			return;
		} catch ( Exception $e ) {
			// Fall through to the code point order below.
			unset( $e );
		}
	}

	// Code point order, which is correct within a single script.
	sort( $initials, SORT_STRING );
}

/**
 * Filters the Query Loop block query vars by the letter selected in the URL.
 *
 * Applying this at the query var level means the post list, the result count and
 * the page count all agree, because each of those blocks builds its query with
 * `build_query_vars_from_query_block()`.
 *
 * The selected letter is validated against the letters actually present, so a
 * hand-crafted URL cannot select anything a rendered link could not have.
 *
 * @since 7.2.0
 *
 * @param array    $query The current query vars.
 * @param WP_Block $block The block instance.
 *
 * @return array Returns the modified query vars.
 */
function block_core_query_pagination_numbers_filter_query_vars( $query, $block ) {
	if ( empty( $block->context['useAlphabeticalPagination'] ) ) {
		return $query;
	}

	$selected = block_core_query_pagination_numbers_get_selected_letter( $block );
	if ( '' === $selected ) {
		return $query;
	}

	foreach ( block_core_query_pagination_numbers_get_initials( $query ) as $bucket ) {
		if ( $bucket['label'] === $selected ) {
			$query['query_loop_title_initials'] = $bucket['chars'];
			break;
		}
	}

	return $query;
}

add_filter( 'query_loop_block_query_vars', 'block_core_query_pagination_numbers_filter_query_vars', 10, 2 );

/**
 * Restricts a query to posts whose title starts with one of the given characters.
 *
 * WP_Query has no "title starts with" argument, so the characters travel as a
 * custom query var that this turns into SQL. Queries without the var are left
 * untouched.
 *
 * @since 7.2.0
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param string   $where The WHERE clause of the query.
 * @param WP_Query $query The WP_Query instance.
 *
 * @return string Returns the modified WHERE clause.
 */
function block_core_query_pagination_numbers_filter_posts_where( $where, $query ) {
	global $wpdb;

	$initials = $query->get( 'query_loop_title_initials' );
	if ( empty( $initials ) || ! is_array( $initials ) ) {
		return $where;
	}

	$clauses = array();
	foreach ( $initials as $initial ) {
		if ( ! is_string( $initial ) || '' === $initial ) {
			continue;
		}
		$clauses[] = $wpdb->prepare(
			"{$wpdb->posts}.post_title LIKE %s",
			$wpdb->esc_like( $initial ) . '%'
		);
	}

	if ( empty( $clauses ) ) {
		return $where;
	}

	return $where . ' AND ( ' . implode( ' OR ', $clauses ) . ' )';
}

add_filter( 'posts_where', 'block_core_query_pagination_numbers_filter_posts_where', 10, 2 );

/**
 * Renders the letters of an alphabetically paginated Query Loop block.
 *
 * Picking a letter resets the query to its first page. The Previous and Next
 * blocks then page within the selected letter, because they build their links
 * from the current URL and so carry the letter over.
 *
 * @since 7.2.0
 *
 * @param WP_Block $block    Block instance.
 * @param string   $page_key Query string key holding the current page.
 *
 * @return string Returns the pagination letters for the Query, or an empty string.
 */
function block_core_query_pagination_numbers_render_letters( $block, $page_key ) {
	$letter_key = block_core_query_pagination_numbers_get_letter_key( $block );
	$selected   = block_core_query_pagination_numbers_get_selected_letter( $block );

	$buckets = block_core_query_pagination_numbers_get_initials( build_query_vars_from_query_block( $block, 1 ) );
	if ( empty( $buckets ) ) {
		return '';
	}

	// Dropping the page key sends every letter back to the first page.
	$base_url = remove_query_arg( array( $letter_key, $page_key ) );

	$items = array();
	if ( '' === $selected ) {
		$items[] = sprintf(
			'<span class="page-numbers current" aria-current="page">%s</span>',
			esc_html__( 'All' )
		);
	} else {
		$items[] = sprintf(
			'<a class="page-numbers" href="%1$s">%2$s</a>',
			esc_url( $base_url ),
			esc_html__( 'All' )
		);
	}

	foreach ( $buckets as $bucket ) {
		$label = $bucket['label'];

		if ( $label === $selected ) {
			$items[] = sprintf(
				'<span class="page-numbers current" aria-current="page">%s</span>',
				esc_html( $label )
			);
			continue;
		}

		if ( '#' === $label ) {
			$aria_label = __( 'Titles starting with a number or symbol' );
		} else {
			$aria_label = sprintf(
				/* translators: %s: The first letter of a post title. */
				__( 'Titles starting with %s' ),
				$label
			);
		}

		$items[] = sprintf(
			'<a class="page-numbers" href="%1$s" aria-label="%2$s">%3$s</a>',
			esc_url( add_query_arg( $letter_key, rawurlencode( $label ), $base_url ) ),
			esc_attr( $aria_label ),
			esc_html( $label )
		);
	}

	return implode( "\n", $items );
}

/**
 * Renders the `core/query-pagination-numbers` block on the server.
 *
 * @since 5.8.0
 *
 * @global WP_Query $wp_query WordPress Query object.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the pagination numbers for the Query.
 */
function render_block_core_query_pagination_numbers( $attributes, $content, $block ) {
	$page_key            = isset( $block->context['queryId'] ) ? 'query-' . $block->context['queryId'] . '-page' : 'query-page';
	$enhanced_pagination = (bool) ( $block->context['enhancedPagination'] ?? false );
	$page                = empty( $_GET[ $page_key ] ) ? 1 : (int) $_GET[ $page_key ];
	$max_page            = (int) ( $block->context['query']['pages'] ?? 0 );
	$is_inherited        = isset( $block->context['query']['inherit'] ) && $block->context['query']['inherit'];

	$wrapper_attributes = get_block_wrapper_attributes();
	$content            = '';
	global $wp_query;
	$mid_size = isset( $block->attributes['midSize'] ) ? (int) $block->attributes['midSize'] : null;

	/*
	 * Alphabetical pagination needs to filter the query, which is only possible
	 * for custom queries: an inherited query is the global one, already run.
	 */
	$use_letters = ! $is_inherited && ! empty( $block->context['useAlphabeticalPagination'] );

	if ( $use_letters ) {
		$content = block_core_query_pagination_numbers_render_letters( $block, $page_key );
	} elseif ( $is_inherited ) {
		// Take into account if we have set a bigger `max page`
		// than what the query has.
		$total         = ! $max_page || $max_page > $wp_query->max_num_pages ? $wp_query->max_num_pages : $max_page;
		$paginate_args = array(
			'prev_next' => false,
			'total'     => $total,
		);
		if ( null !== $mid_size ) {
			$paginate_args['mid_size'] = $mid_size;
		}
		$content = paginate_links( $paginate_args );
	} else {
		$block_query = new WP_Query( build_query_vars_from_query_block( $block, $page ) );
		// `paginate_links` works with the global $wp_query, so we have to
		// temporarily switch it with our custom query.
		$prev_wp_query = $wp_query;
		$wp_query      = $block_query;
		$total         = ! $max_page || $max_page > $wp_query->max_num_pages ? $wp_query->max_num_pages : $max_page;
		$paginate_args = array(
			'base'      => '%_%',
			'format'    => "?$page_key=%#%",
			'current'   => max( 1, $page ),
			'total'     => $total,
			'prev_next' => false,
		);
		if ( null !== $mid_size ) {
			$paginate_args['mid_size'] = $mid_size;
		}
		if ( 1 !== $page ) {
			/**
			 * `paginate_links` doesn't use the provided `format` when the page is `1`.
			 * This is great for the main query as it removes the extra query params
			 * making the URL shorter, but in the case of multiple custom queries is
			 * problematic. It results in returning an empty link which ends up with
			 * a link to the current page.
			 *
			 * A way to address this is to add a `fake` query arg with no value that
			 * is the same for all custom queries. This way the link is not empty and
			 * preserves all the other existent query args.
			 *
			 * @see https://developer.wordpress.org/reference/functions/paginate_links/
			 *
			 * The proper fix of this should be in core. Track Ticket:
			 * @see https://core.trac.wordpress.org/ticket/53868
			 *
			 * TODO: After two WP versions (starting from the WP version the core patch landed),
			 * we should remove this and call `paginate_links` with the proper new arg.
			 */
			$paginate_args['add_args'] = array( 'cst' => '' );
		}
		// We still need to preserve `paged` query param if exists, as is used
		// for Queries that inherit from global context.
		$paged = empty( $_GET['paged'] ) ? null : (int) $_GET['paged'];
		if ( $paged ) {
			$paginate_args['add_args'] = array( 'paged' => $paged );
		}
		$content = paginate_links( $paginate_args );
		wp_reset_postdata(); // Restore original Post Data.
		$wp_query = $prev_wp_query;
	}

	if ( empty( $content ) ) {
		return '';
	}

	if ( $enhanced_pagination ) {
		$p         = new WP_HTML_Tag_Processor( $content );
		$tag_index = 0;
		while ( $p->next_tag(
			array( 'class_name' => 'page-numbers' )
		) ) {
			if ( null === $p->get_attribute( 'data-wp-key' ) ) {
				$p->set_attribute( 'data-wp-key', 'index-' . $tag_index++ );
			}
			if ( 'A' === $p->get_tag() ) {
				$p->set_attribute( 'data-wp-on--click', 'core/query::actions.navigate' );
			}
		}
		$content = $p->get_updated_html();
	}

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$content
	);
}

/**
 * Registers the `core/query-pagination-numbers` block on the server.
 *
 * @since 5.8.0
 */
function register_block_core_query_pagination_numbers() {
	register_block_type_from_metadata(
		__DIR__ . '/query-pagination-numbers',
		array(
			'render_callback' => 'render_block_core_query_pagination_numbers',
		)
	);
}
add_action( 'init', 'register_block_core_query_pagination_numbers' );
