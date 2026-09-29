<?php
/**
 * REST API: Gutenberg_REST_Link_Suggestions_Controller class
 *
 * @package gutenberg
 */

/**
 * Searches posts, terms, post formats and media for link suggestions in a single query.
 *
 * `/wp/v2/search` and `/wp/v2/media` search one kind of object per request, so the editor used
 * to make four requests, merge them and rank the merged list itself. A page of that list could
 * not be asked for. This endpoint does the matching, ranking and paging in one SQL query, so
 * each page is a slice of one ordered list and the total is known.
 *
 * Search terms are parsed as `WP_Query` parses them, and every term has to be found somewhere: in
 * the title, or for posts and media in the content or excerpt. Media is not matched by its file
 * name, which would mean joining post meta for every attachment: its title is the file name
 * when uploaded unless the image names itself or someone renames it. Results are ranked, most important first, by:
 *
 * 1. How many of the words typed the title holds. A match found only in the content comes last.
 * 2. Whether the title holds what was typed as one string.
 * 3. Whether the title begins with what was typed. Media still shares pages with other titles
 *    beginning with it, but is not listed above titles holding it further in unless preferred.
 * 4. The type: pages, then other content, then taxonomy terms, then post formats, then media.
 * 5. How much of the word it was found in each word typed accounts for.
 *
 * The first three say how well a result matches. Results that match equally well share each page
 * evenly between the post types and taxonomies they come from, so a page is not all posts when
 * pages, terms and media match just as well. When more of them match than a page holds, the share
 * carries on to the next page, so none is left out. A result never comes before one that matches
 * better to fill a share.
 *
 * Results that rank the same keep the order each type is listed in without a search: newest
 * first for posts and media, by name for terms.
 */
class Gutenberg_REST_Link_Suggestions_Controller extends WP_REST_Controller {

	/**
	 * The most words of a search that are matched separately, as in `WP_Query`.
	 */
	const MAX_SEARCH_WORDS = 9;

	/**
	 * How highly each type ranks, most wanted highest.
	 */
	const TYPE_RANKS = array(
		'post'        => 4,
		'term'        => 3,
		'post-format' => 2,
		'attachment'  => 1,
	);

	/**
	 * The kind of row each search type produces.
	 */
	const KINDS = array(
		'post'        => 'post-type',
		'term'        => 'taxonomy',
		'post-format' => 'post-format',
		'attachment'  => 'media',
	);

	/**
	 * Orders results that rank the same: the order their type is listed in, then a unique key so
	 * the same result never lands on two pages.
	 */
	const TIE_BREAK = array( 'sort_date DESC', 'sort_name ASC', 'kind ASC', 'subtype ASC', 'object_id ASC' );

	/**
	 * Curly quotes and the straight ones typed in their place. `get_the_title()` runs
	 * `wptexturize`, so titles are shown with curly quotes, but only straight ones are on a keyboard.
	 */
	const CURLY_QUOTES = array(
		"\u{2018}" => "'",
		"\u{2019}" => "'",
		"\u{201C}" => '"',
		"\u{201D}" => '"',
	);

	/**
	 * Characters that separate words, matching what `tokenize()` in core-data splits on for the
	 * punctuation found in titles.
	 */
	const WORD_SEPARATORS = array(
		"\t",
		"\n",
		"\r",
		'.',
		',',
		':',
		';',
		'!',
		'?',
		"'",
		'"',
		'(',
		')',
		'[',
		']',
		'{',
		'}',
		'-',
		'_',
		'/',
		'\\',
		'&',
		'+',
		'*',
		'#',
		'@',
		'%',
		'$',
		'=',
		'<',
		'>',
		'|',
		'~',
		'`',
		'^',
		"\u{2018}",
		"\u{2019}",
		"\u{201C}",
		"\u{201D}",
		"\u{2013}",
		"\u{2014}",
		"\u{2026}",
		"\u{00AB}",
		"\u{00BB}",
		"\u{00BF}",
		"\u{00A1}",
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wp-block-editor/v1';
		$this->rest_base = 'link-suggestions';
	}

	/**
	 * Registers the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
					'args'                => $this->get_collection_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Only people who can write links can ask for suggestions.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Required by WP_REST_Controller.
		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to search for links.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Returns a page of suggestions.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		global $wpdb;

		$search   = (string) $request['search'];
		$page     = (int) $request['page'];
		$per_page = (int) $request['per_page'];

		/**
		 * Filters the suggestions before they are searched for, so a search plugin can supply them.
		 *
		 * Returning anything but null skips the search. Like `posts_pre_query`, it lets a search
		 * service answer instead of the database.
		 *
		 * @param array|null      $suggestions Null to search as usual, or an array with the page of
		 *                                     suggestions (`items`, each with the fields this
		 *                                     endpoint returns) and how many there are across every
		 *                                     page (`total`).
		 * @param WP_REST_Request $request     Full details about the request.
		 */
		$suggestions = apply_filters( 'link_suggestions_pre_query', null, $request );

		if ( null !== $suggestions ) {
			return $this->get_response( $suggestions['items'], (int) $suggestions['total'], $per_page );
		}
		$terms  = $this->get_search_terms( $search );
		$search = $terms['ranking'];
		$words  = $this->get_words( $search );

		// Something was typed, but nothing a title could be matched on.
		if ( '' !== trim( $request['search'] ) && ! $words ) {
			return $this->get_response( array(), 0, $per_page );
		}

		$candidates = $this->get_candidates_sql( $request, $terms );

		if ( ! $candidates ) {
			return $this->get_response( array(), 0, $per_page );
		}

		$ranked = $this->get_ranked_sql( $candidates, $search, $words, $this->get_preferred_types( $request ) );

		$count_sql = "SELECT COUNT(*) FROM ( $ranked ) AS ranked";
		$page_sql  = $this->get_page_sql( $ranked, $words, $page, $per_page );

		// The SQL holds everything the results depend on, down to what the current user can see,
		// so it keys the cache. Adding or changing a post or term changes the last changed times.
		$cache_key = 'link-suggestions:' . md5( $count_sql . $page_sql ) . ':' . wp_cache_get_last_changed( 'posts' ) . ':' . wp_cache_get_last_changed( 'terms' );
		$cached    = wp_cache_get( $cache_key, 'post-queries' );

		if ( false !== $cached ) {
			list( $total, $rows ) = $cached;
		} else {
			// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Every value is escaped where the SQL is built, and the results are cached.
			$rows = $wpdb->get_results( $page_sql );

			if ( $rows && isset( $rows[0]->total_count ) ) {
				$total = (int) $rows[0]->total_count;
			} elseif ( ! $rows && 1 === $page && $this->supports_window_functions() ) {
				$total = 0;
			} else {
				// Without window functions, or past the last page, nothing carries the total.
				$total = (int) $wpdb->get_var( $count_sql );
			}
			// phpcs:enable WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching

			wp_cache_set( $cache_key, array( $total, $rows ), 'post-queries' );
		}

		$items = array();
		foreach ( $rows as $row ) {
			$items[] = $this->prepare_response_for_collection( $this->prepare_item_for_response( $row, $request ) );
		}

		return $this->get_response( $items, $total, $per_page );
	}

	/**
	 * Builds the response, with the totals `/wp/v2` collections send.
	 *
	 * @param array $items    Suggestions.
	 * @param int   $total    How many suggestions there are across every page.
	 * @param int   $per_page Suggestions per page.
	 * @return WP_REST_Response
	 */
	private function get_response( $items, $total, $per_page ) {
		$response = rest_ensure_response( $items );
		$response->header( 'X-WP-Total', $total );
		$response->header( 'X-WP-TotalPages', (int) ceil( $total / $per_page ) );
		return $response;
	}

	/**
	 * Splits a search into words the way `tokenize()` in core-data does.
	 *
	 * @param string $search What was typed.
	 * @return string[] Lowercase words of letters and numbers.
	 */
	private function get_words( $search ) {
		preg_match_all( '/[\p{L}\p{N}]+/u', mb_strtolower( $search ), $matches );
		return array_slice( $matches[0], 0, self::MAX_SEARCH_WORDS );
	}

	/**
	 * Splits a search into the terms that have to be found, and those that must not be, as
	 * `WP_Query` does: a quoted phrase is one term, stopwords such as "the" are dropped, and a
	 * term typed with a minus leaves out results holding it.
	 *
	 * @param string $search What was typed.
	 * @return array Terms to find (`include`), terms to leave out (`exclude`), and what was typed
	 *               without the terms left out (`ranking`), to rank titles by.
	 */
	private function get_search_terms( $search ) {
		$terms = array(
			'include' => array(),
			'exclude' => array(),
			'ranking' => '',
		);

		if ( '' === trim( $search ) ) {
			return $terms;
		}

		/** This filter is documented in wp-includes/class-wp-query.php */
		$exclusion_prefix = apply_filters( 'wp_query_search_exclusion_prefix', '-' );

		preg_match_all( '/".*?("|$)|((?<=[\t ",+])|^)[^\t ",+]+/', $search, $matches );

		$parser = new class() extends WP_Query {
			/**
			 * Makes `WP_Query::parse_search_terms()` callable.
			 *
			 * @param string[] $terms Terms.
			 * @return string[]
			 */
			public function get_search_terms( $terms ) {
				return $this->parse_search_terms( $terms );
			}
		};

		$parsed = $parser->get_search_terms( $matches[0] );
		if ( ! $parsed || count( $parsed ) > self::MAX_SEARCH_WORDS ) {
			$parsed = array( $search );
		}

		foreach ( $parsed as $term ) {
			if ( $exclusion_prefix && str_starts_with( $term, $exclusion_prefix ) ) {
				$terms['exclude'][] = substr( $term, strlen( $exclusion_prefix ) );
			} else {
				$terms['include'][] = $term;
			}
		}

		$ranking = array();
		foreach ( $matches[0] as $match ) {
			if ( ! $exclusion_prefix || ! str_starts_with( $match, $exclusion_prefix ) ) {
				$ranking[] = $match;
			}
		}
		$terms['ranking'] = implode( ' ', $ranking );

		return $terms;
	}

	/**
	 * Quotes a value as an SQL string.
	 *
	 * @param string $value Value.
	 * @return string
	 */
	private function quote( $value ) {
		return "'" . esc_sql( $value ) . "'";
	}

	/**
	 * Requires every term to be found in one of the columns, and no term left out to be found in
	 * any, as `WP_Query` searches do.
	 *
	 * @param string[] $columns Columns to look in.
	 * @param array    $terms   Terms to find (`include`) and to leave out (`exclude`).
	 * @return string SQL condition.
	 */
	private function get_terms_found_sql( $columns, $terms ) {
		global $wpdb;

		$conditions = array();
		foreach ( $terms['include'] as $term ) {
			$like  = $this->quote( '%' . $wpdb->esc_like( $term ) . '%' );
			$found = array();
			foreach ( $columns as $column ) {
				$found[] = "$column LIKE $like";
			}
			$conditions[] = '(' . implode( ' OR ', $found ) . ')';
		}

		foreach ( $terms['exclude'] as $term ) {
			$like = $this->quote( '%' . $wpdb->esc_like( $term ) . '%' );
			foreach ( $columns as $column ) {
				$conditions[] = "COALESCE( $column, '' ) NOT LIKE $like";
			}
		}

		return $conditions ? implode( ' AND ', $conditions ) : '1=1';
	}

	/**
	 * Builds the query listing everything a search could suggest, one row per object.
	 *
	 * Each row has the same columns whatever its type, so the rows can be ranked together.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @param array           $terms   Search terms, from `get_search_terms()`.
	 * @return string|null SQL, or null when no type is being searched.
	 */
	private function get_candidates_sql( $request, $terms ) {
		$types = array_diff(
			$request['type'] ? $request['type'] : array_keys( self::TYPE_RANKS ),
			(array) $request['type_exclude']
		);

		$subtypes = array(
			'include' => (array) $request['subtype'],
			'exclude' => (array) $request['subtype_exclude'],
		);

		$parts = array();

		if ( in_array( 'post', $types, true ) ) {
			$parts[] = $this->get_posts_sql( $subtypes, $terms );
		}

		if ( in_array( 'term', $types, true ) ) {
			$parts[] = $this->get_terms_sql( $subtypes, $terms );
		}

		if ( in_array( 'post-format', $types, true ) && $this->is_subtype_searched( 'post-format', $subtypes ) ) {
			$parts[] = $this->get_post_formats_sql( $terms );
		}

		if ( in_array( 'attachment', $types, true ) && $this->is_subtype_searched( 'attachment', $subtypes ) ) {
			$parts[] = $this->get_media_sql( $terms );
		}

		$parts = array_filter( $parts );

		return $parts ? implode( ' UNION ALL ', $parts ) : null;
	}

	/**
	 * Whether a post type or taxonomy is searched, given the ones asked for and left out.
	 *
	 * Post formats and media count as the subtypes "post-format" and "attachment".
	 *
	 * @param string $subtype  Post type or taxonomy.
	 * @param array  $subtypes Subtypes asked for (`include`) and left out (`exclude`).
	 * @return bool
	 */
	private function is_subtype_searched( $subtype, $subtypes ) {
		return ( ! $subtypes['include'] || in_array( $subtype, $subtypes['include'], true ) )
			&& ! in_array( $subtype, $subtypes['exclude'], true );
	}

	/**
	 * Narrows a list of post types or taxonomies to those searched.
	 *
	 * @param string[] $names    Public post types or taxonomies.
	 * @param array    $subtypes Subtypes asked for (`include`) and left out (`exclude`).
	 * @return string[]
	 */
	private function filter_subtypes( $names, $subtypes ) {
		return array_filter(
			$names,
			function ( $name ) use ( $subtypes ) {
				return $this->is_subtype_searched( $name, $subtypes );
			}
		);
	}

	/**
	 * Published posts of every public post type but attachments, as `/wp/v2/search` lists them.
	 *
	 * @param array    $subtypes Subtypes asked for (`include`) and left out (`exclude`).
	 * @param array    $terms    Search terms, from `get_search_terms()`.
	 * @return string|null SQL.
	 */
	private function get_posts_sql( $subtypes, $terms ) {
		global $wpdb;

		$post_types = array_diff(
			get_post_types(
				array(
					'public'       => true,
					'show_in_rest' => true,
				)
			),
			array( 'attachment' )
		);

		$post_types = $this->filter_subtypes( $post_types, $subtypes );

		if ( ! $post_types ) {
			return null;
		}

		$post_types = implode( ', ', array_map( array( $this, 'quote' ), $post_types ) );
		$found      = $this->get_terms_found_sql( array( 'p.post_title', 'p.post_excerpt', 'p.post_content' ), $terms );
		$rank       = self::TYPE_RANKS['post'];

		// Pages rank above other content that matches as well: a link is more often to a page.
		return "SELECT 'post-type' AS kind, CASE WHEN p.post_type = 'page' THEN $rank + 0.5 ELSE $rank END AS base_rank, p.post_type AS subtype, p.ID AS object_id,
				p.post_title AS title, p.post_date AS sort_date, '' AS sort_name
			FROM {$wpdb->posts} AS p
			WHERE p.post_type IN ( $post_types ) AND p.post_status = 'publish' AND $found";
	}

	/**
	 * Terms of every public taxonomy, as `/wp/v2/search` lists them.
	 *
	 * @param array    $subtypes Subtypes asked for (`include`) and left out (`exclude`).
	 * @param array    $terms    Search terms, from `get_search_terms()`.
	 * @return string|null SQL.
	 */
	private function get_terms_sql( $subtypes, $terms ) {
		global $wpdb;

		$taxonomies = get_taxonomies(
			array(
				'public'       => true,
				'show_in_rest' => true,
			)
		);

		$taxonomies = $this->filter_subtypes( $taxonomies, $subtypes );

		if ( ! $taxonomies ) {
			return null;
		}

		$taxonomies = implode( ', ', array_map( array( $this, 'quote' ), $taxonomies ) );
		$found      = $this->get_terms_found_sql( array( 't.name', 't.slug' ), $terms );
		$rank       = self::TYPE_RANKS['term'];

		return "SELECT 'taxonomy' AS kind, $rank AS base_rank, tt.taxonomy AS subtype, t.term_id AS object_id,
				t.name AS title, NULL AS sort_date, t.name AS sort_name
			FROM {$wpdb->terms} AS t
			INNER JOIN {$wpdb->term_taxonomy} AS tt ON tt.term_id = t.term_id
			WHERE tt.taxonomy IN ( $taxonomies ) AND $found";
	}

	/**
	 * Post formats that have an archive, as `/wp/v2/search` lists them.
	 *
	 * There is no table of post formats to search, so each one is written into the query.
	 *
	 * @param array $terms Search terms, from `get_search_terms()`.
	 * @return string|null SQL.
	 */
	private function get_post_formats_sql( $terms ) {
		$rows  = array();
		$index = 0;
		$rank  = self::TYPE_RANKS['post-format'];

		foreach ( get_post_format_strings() as $slug => $label ) {
			++$index;

			if ( ! get_post_format_link( $slug ) ) {
				continue;
			}

			$rows[] = sprintf(
				"SELECT 'post-format' AS kind, %d AS base_rank, 'post-format' AS subtype, %s AS object_id, %s AS title, NULL AS sort_date, %s AS sort_name",
				$rank,
				$this->quote( $slug ),
				$this->quote( $label ),
				$this->quote( sprintf( '%02d', $index ) )
			);
		}

		if ( ! $rows ) {
			return null;
		}

		$found = $this->get_terms_found_sql( array( 'f.title', 'f.object_id' ), $terms );

		return 'SELECT * FROM ( ' . implode( ' UNION ALL ', $rows ) . " ) AS f WHERE $found";
	}

	/**
	 * Media the current user can see, as `/wp/v2/media` lists it.
	 *
	 * Media shares the visibility of the post it is attached to, so the parent is checked in the
	 * query. Checking each result afterwards would leave pages short and the total wrong.
	 *
	 * @param array $terms Search terms, from `get_search_terms()`.
	 * @return string SQL.
	 */
	private function get_media_sql( $terms ) {
		global $wpdb;

		$found = $this->get_terms_found_sql(
			array( 'a.post_title', 'a.post_excerpt', 'a.post_content' ),
			$terms
		);
		$rank  = self::TYPE_RANKS['attachment'];

		return "SELECT 'media' AS kind, $rank AS base_rank, 'attachment' AS subtype, a.ID AS object_id,
				a.post_title AS title, a.post_date AS sort_date, '' AS sort_name
			FROM {$wpdb->posts} AS a
			LEFT JOIN {$wpdb->posts} AS parent ON parent.ID = a.post_parent
			WHERE a.post_type = 'attachment' AND a.post_status = 'inherit'
				AND ( {$this->get_readable_parent_sql()} ) AND $found";
	}

	/**
	 * Whether the current user can read the post an attachment belongs to.
	 *
	 * Mirrors `WP_REST_Posts_Controller::check_read_permission()` and the `read_post` capability:
	 * anyone can read a published post, the author can read their own, and others need to be able
	 * to read private posts, or edit others' posts for any other status.
	 *
	 * @return string SQL condition.
	 */
	private function get_readable_parent_sql() {
		$public_statuses = array_map( array( $this, 'quote' ), get_post_stati( array( 'public' => true ) ) );
		$private_types   = array();
		$others_types    = array();

		foreach ( get_post_types( array(), 'objects' ) as $post_type ) {
			if ( current_user_can( $post_type->cap->read_private_posts ) ) {
				$private_types[] = $this->quote( $post_type->name );
			}
			if ( current_user_can( $post_type->cap->edit_others_posts ) ) {
				$others_types[] = $this->quote( $post_type->name );
			}
		}

		$conditions = array(
			'a.post_parent = 0',
			'parent.ID IS NULL',
			'parent.post_status IN ( ' . implode( ', ', $public_statuses ) . ' )',
			'parent.post_author = ' . get_current_user_id(),
		);

		if ( $private_types ) {
			$conditions[] = "( parent.post_status = 'private' AND parent.post_type IN ( " . implode( ', ', $private_types ) . ' ) )';
		}

		if ( $others_types ) {
			$conditions[] = "( parent.post_status <> 'private' AND parent.post_type IN ( " . implode( ', ', $others_types ) . ' ) )';
		}

		return implode( ' OR ', $conditions );
	}

	/**
	 * The types a request asks to rank first, most wanted first.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return array[] Each with a search `type`, and a `subtype` when it names one.
	 */
	private function get_preferred_types( $request ) {
		$preferred = array();

		foreach ( (array) $request['prefer_types'] as $entry ) {
			$entry = is_array( $entry ) ? $entry : array( 'type' => $entry );

			if ( ! isset( $entry['type'] ) || ! isset( self::TYPE_RANKS[ $entry['type'] ] ) ) {
				continue;
			}

			$preferred[] = array(
				'type'    => $entry['type'],
				'subtype' => isset( $entry['subtype'] ) ? (string) $entry['subtype'] : null,
			);
		}

		return $preferred;
	}

	/**
	 * Matches a row against a preferred type.
	 *
	 * @param array $entry A preferred type.
	 * @return string SQL condition.
	 */
	private function get_preferred_type_sql( $entry ) {
		$sql = 'kind = ' . $this->quote( self::KINDS[ $entry['type'] ] );

		if ( $entry['subtype'] ) {
			$sql .= ' AND subtype = ' . $this->quote( $entry['subtype'] );
		}

		return "( $sql )";
	}

	/**
	 * How highly a row's type ranks. Preferred types rank above every other, in the order given,
	 * as `preferTypes` does in core-data.
	 *
	 * @param array[] $preferred Types to rank first, most wanted first.
	 * @return string SQL expression.
	 */
	private function get_type_rank_sql( $preferred ) {
		if ( ! $preferred ) {
			return 'c.base_rank';
		}

		$cases = array();
		foreach ( $preferred as $index => $entry ) {
			$rank    = count( self::TYPE_RANKS ) + count( $preferred ) - $index;
			$cases[] = "WHEN {$this->get_preferred_type_sql( $entry )} THEN $rank";
		}

		return 'CASE ' . implode( ' ', $cases ) . ' ELSE c.base_rank END';
	}

	/**
	 * Whether beginning with what was typed can lift a row above others on its page. Media titles
	 * are often file names, which begin with the word they are about, so media is only lifted when
	 * it is preferred. It still shares pages with other results beginning with what was typed.
	 *
	 * @param array[] $preferred Types to rank first.
	 * @return string SQL condition.
	 */
	private function get_can_begin_sql( $preferred ) {
		foreach ( $preferred as $entry ) {
			if ( 'attachment' === $entry['type'] ) {
				return '1=1';
			}
		}

		return "kind <> 'media'";
	}

	/**
	 * A title lowercased with its curly quotes made straight, to compare with what was typed.
	 *
	 * @param string $column Column holding the title.
	 * @return string SQL expression.
	 */
	private function get_plain_title_sql( $column ) {
		$sql = "LOWER( TRIM( $column ) )";
		foreach ( self::CURLY_QUOTES as $curly => $straight ) {
			$sql = "REPLACE( $sql, {$this->quote( $curly )}, {$this->quote( $straight )} )";
		}
		return $sql;
	}

	/**
	 * A title lowercased with its punctuation made spaces and a space either side, so every word
	 * in it sits between two spaces.
	 *
	 * @param string $column Column holding the title.
	 * @return string SQL expression.
	 */
	private function get_title_words_sql( $column ) {
		$sql = "LOWER( $column )";
		foreach ( self::WORD_SEPARATORS as $separator ) {
			$sql = "REPLACE( $sql, {$this->quote( $separator )}, ' ' )";
		}
		return "CONCAT( ' ', $sql, ' ' )";
	}

	/**
	 * Builds the query that scores how well each candidate matches.
	 *
	 * @param string   $candidates SQL listing the candidates.
	 * @param string   $search     What was typed.
	 * @param string[] $words      Words typed.
	 * @param array[]  $preferred  Types to rank first, most wanted first.
	 * @return string SQL.
	 */
	private function get_ranked_sql( $candidates, $search, $words, $preferred ) {
		$columns = "c.*, {$this->get_type_rank_sql( $preferred )} AS type_rank, {$this->get_plain_title_sql( 'c.title' )} AS plain, {$this->get_title_words_sql( 'c.title' )} AS title_words";
		$titled  = "SELECT $columns FROM ( $candidates ) AS c";

		if ( ! $words ) {
			return "SELECT * FROM ( $titled ) AS scored";
		}

		$needle = mb_strtolower( trim( $search ) );
		$needle = $this->quote( strtr( $needle, self::CURLY_QUOTES ) );

		$found    = array();
		$coverage = array();
		foreach ( $words as $word ) {
			$found[]    = "( LOCATE( {$this->quote( $word )}, title_words ) > 0 )";
			$coverage[] = $this->get_word_coverage_sql( $word );
		}

		$scores = implode(
			', ',
			array(
				'( ' . implode( ' + ', $found ) . ' ) AS found',
				"( LOCATE( $needle, plain ) > 0 ) AS contains_search",
				"( LEFT( plain, CHAR_LENGTH( $needle ) ) = $needle ) AS begins",
				"( LEFT( plain, CHAR_LENGTH( $needle ) ) = $needle AND {$this->get_can_begin_sql( $preferred )} ) AS lifted",
				'( ( ' . implode( ' + ', $coverage ) . ' ) / ' . count( $words ) . ' * 10 ) AS coverage',
			)
		);

		return "SELECT t.*, $scores FROM ( $titled ) AS t";
	}

	/**
	 * How much of the word it was found in a word typed accounts for: all of it when it is the
	 * whole word, and otherwise its share of the letters of the first word holding it.
	 *
	 * @param string $word A word typed.
	 * @return string SQL expression between 0 and 1.
	 */
	private function get_word_coverage_sql( $word ) {
		$quoted   = $this->quote( $word );
		$whole    = $this->quote( ' ' . $word . ' ' );
		$length   = mb_strlen( $word );
		$position = "LOCATE( $quoted, title_words )";
		$before   = "CHAR_LENGTH( SUBSTRING_INDEX( LEFT( title_words, $position - 1 ), ' ', -1 ) )";
		$after    = "CHAR_LENGTH( SUBSTRING_INDEX( SUBSTRING( title_words, $position + $length ), ' ', 1 ) )";

		return "( CASE
			WHEN LOCATE( $whole, title_words ) > 0 THEN 1
			WHEN $position > 0 THEN $length / ( $before + $length + $after )
			ELSE 0 END )";
	}

	/**
	 * Builds the query for one page of suggestions.
	 *
	 * Where the database has window functions, the results of each post type and taxonomy are
	 * numbered within each group of equally good matches, and the list takes the first of every
	 * one, then the second, and so on. That order is the same for every page, so paging through it never repeats or
	 * skips a result. Each page is then shown in rank order.
	 *
	 * @param string   $ranked   SQL scoring each candidate.
	 * @param string[] $words    Words typed.
	 * @param int      $page     Page asked for.
	 * @param int      $per_page Suggestions per page.
	 * @return string SQL.
	 */
	private function get_page_sql( $ranked, $words, $page, $per_page ) {
		$limit     = "LIMIT $per_page OFFSET " . ( ( $page - 1 ) * $per_page );
		$rank      = $this->get_order_by( $words );
		$tie_break = implode( ', ', self::TIE_BREAK );

		if ( ! $this->supports_window_functions() ) {
			return "SELECT * FROM ( $ranked ) AS ranked ORDER BY $rank $limit";
		}

		// Every row carries how many there are across every page, so no second query counts them.
		if ( ! $words ) {
			return "SELECT ranked.*, COUNT(*) OVER () AS total_count FROM ( $ranked ) AS ranked ORDER BY $rank $limit";
		}

		$shared = "SELECT ranked.*, COUNT(*) OVER () AS total_count, ROW_NUMBER() OVER (
				PARTITION BY found, contains_search, begins, type_rank, subtype
				ORDER BY coverage DESC, $tie_break
			) AS share
			FROM ( $ranked ) AS ranked";

		return "SELECT * FROM (
				SELECT * FROM ( $shared ) AS shared
				ORDER BY found DESC, contains_search DESC, begins DESC, share ASC, type_rank DESC, coverage DESC, $tie_break
				$limit
			) AS page
			ORDER BY $rank";
	}

	/**
	 * Whether the database can number rows within groups, which MySQL 8.0 and MariaDB 10.2
	 * added. Older databases rank results by how well they match alone.
	 *
	 * @return bool
	 */
	protected function supports_window_functions() {
		global $wpdb;

		$is_mariadb = false !== stripos( (string) $wpdb->db_server_info(), 'mariadb' );

		return version_compare( $wpdb->db_version(), $is_mariadb ? '10.2' : '8.0', '>=' );
	}

	/**
	 * The order suggestions rank in.
	 *
	 * @param string[] $words Words typed.
	 * @return string SQL.
	 */
	private function get_order_by( $words ) {
		$order = $words
			? array( 'found DESC', 'contains_search DESC', 'lifted DESC', 'type_rank DESC', 'coverage DESC' )
			: array( 'type_rank DESC' );

		return implode( ', ', array_merge( $order, self::TIE_BREAK ) );
	}

	/**
	 * Formats a row as a suggestion, with the fields and `self` link `/wp/v2/search` gives.
	 *
	 * @param object          $item    Row from the query.
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response
	 */
	public function prepare_item_for_response( $item, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Required by WP_REST_Controller.
		$type  = array_search( $item->kind, self::KINDS, true );
		$route = '';

		switch ( $type ) {
			case 'post':
				$id    = (int) $item->object_id;
				$title = get_the_title( $id );
				$url   = get_permalink( $id );
				$route = rest_get_route_for_post( $id );
				break;

			case 'term':
				$id    = (int) $item->object_id;
				$title = $item->title;
				$url   = get_term_link( $id, $item->subtype );
				$url   = is_wp_error( $url ) ? '' : $url;
				$route = rest_get_route_for_term( $id );
				break;

			case 'post-format':
				$id    = $item->object_id;
				$title = $item->title;
				$url   = get_post_format_link( $id );
				break;

			default:
				$id    = (int) $item->object_id;
				$title = get_the_title( $id );
				$url   = wp_get_attachment_url( $id );
				$route = rest_get_route_for_post( $id );
		}

		$response = rest_ensure_response(
			array(
				'id'      => $id,
				'title'   => $title,
				'url'     => $url,
				'type'    => $type,
				'subtype' => $item->subtype,
			)
		);

		if ( $route ) {
			$response->add_link( 'self', rest_url( $route ), array( 'embeddable' => true ) );
		}

		return $response;
	}

	/**
	 * Retrieves the query parameters for the collection.
	 *
	 * @return array
	 */
	public function get_collection_params() {
		return array(
			'search'          => array(
				'description' => __( 'Text to find in titles.', 'gutenberg' ),
				'type'        => 'string',
				'default'     => '',
			),
			'page'            => array(
				'description' => __( 'Current page of the collection.', 'gutenberg' ),
				'type'        => 'integer',
				'default'     => 1,
				'minimum'     => 1,
			),
			'per_page'        => array(
				'description' => __( 'Maximum number of items to be returned in result set.', 'gutenberg' ),
				'type'        => 'integer',
				'default'     => 20,
				'minimum'     => 1,
				'maximum'     => 100,
			),
			'type'            => array(
				'description' => __( 'Limit results to these types of object.', 'gutenberg' ),
				'type'        => 'array',
				'items'       => array(
					'type' => 'string',
					'enum' => array_keys( self::TYPE_RANKS ),
				),
			),
			'type_exclude'    => array(
				'description' => __( 'Leave out these types of object.', 'gutenberg' ),
				'type'        => 'array',
				'items'       => array(
					'type' => 'string',
					'enum' => array_keys( self::TYPE_RANKS ),
				),
			),
			'subtype'         => array(
				'description' => __( 'Limit results to these post types and taxonomies.', 'gutenberg' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
			'subtype_exclude' => array(
				'description' => __( 'Leave out these post types and taxonomies.', 'gutenberg' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'string' ),
			),
			'prefer_types'    => array(
				'description' => __( 'Types to rank first, most wanted first: a type, or a type and a post type or taxonomy.', 'gutenberg' ),
				'type'        => 'array',
				'items'       => array(
					'type'       => array( 'string', 'object' ),
					'properties' => array(
						'type'    => array(
							'type' => 'string',
							'enum' => array_keys( self::TYPE_RANKS ),
						),
						'subtype' => array( 'type' => 'string' ),
					),
				),
			),
		);
	}

	/**
	 * Retrieves a suggestion's schema.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'link-suggestion',
			'type'       => 'object',
			'properties' => array(
				'id'      => array(
					'description' => __( 'ID of the post, term or media, or slug of the post format.', 'gutenberg' ),
					'type'        => array( 'integer', 'string' ),
					'readonly'    => true,
				),
				'title'   => array(
					'description' => __( 'Title of the object.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
				),
				'url'     => array(
					'description' => __( 'URL to link to.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'uri',
					'readonly'    => true,
				),
				'type'    => array(
					'description' => __( 'Type of object.', 'gutenberg' ),
					'type'        => 'string',
					'enum'        => array_keys( self::TYPE_RANKS ),
					'readonly'    => true,
				),
				'subtype' => array(
					'description' => __( 'Post type or taxonomy of the object, "post-format" or "attachment".', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
				),
			),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}
}
