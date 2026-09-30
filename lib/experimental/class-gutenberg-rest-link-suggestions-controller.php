<?php
/**
 * REST API: Gutenberg_REST_Link_Suggestions_Controller class
 *
 * @package gutenberg
 */

/**
 * Searches posts, terms, post formats and media for links, ranked and paged in one SQL query.
 *
 * Matching: search terms are parsed as `WP_Query` parses them. Each must be in the title, or for
 * posts and media in the content or excerpt.
 *
 * Ranking, most important first:
 *
 * 1. How many of the words typed are in the title.
 * 2. Whether the title holds the whole search.
 * 3. Whether the title begins with the search.
 * 4. Type: pages, other content, terms, post formats, media.
 * 5. How much of the title word each word typed covers ("cat" covers more of "cats" than "catalog").
 *
 * 1–3 are match quality. Results of equal quality share each page evenly between post types and
 * taxonomies, so a page is not all posts when terms and media match as well.
 */
class Gutenberg_REST_Link_Suggestions_Controller extends WP_REST_Controller {

	/**
	 * Past this many words, `WP_Query` searches for the whole phrase instead.
	 */
	const MAX_SEARCH_WORDS = 9;

	/**
	 * Default rank of each search type, highest first.
	 */
	const TYPE_RANKS = array(
		'post'        => 4,
		'term'        => 3,
		'post-format' => 2,
		'attachment'  => 1,
	);

	/**
	 * The `kind` column each search type's rows have.
	 */
	const KINDS = array(
		'post'        => 'post-type',
		'term'        => 'taxonomy',
		'post-format' => 'post-format',
		'attachment'  => 'media',
	);

	/**
	 * Orders results that rank the same. Ends on a unique key, so no result lands on two pages.
	 */
	const TIE_BREAK = array( 'sort_date DESC', 'sort_name ASC', 'kind ASC', 'subtype ASC', 'object_id ASC' );

	/**
	 * Curly quotes and the straight ones people type for them.
	 */
	const CURLY_QUOTES = array(
		"\u{2018}" => "'",
		"\u{2019}" => "'",
		"\u{201C}" => '"',
		"\u{201D}" => '"',
	);

	/**
	 * Word separators, for databases without `REGEXP_REPLACE`.
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
	 * Checks the user can edit posts.
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
		 * Filters the suggestions before searching, so a search plugin can supply them, as with
		 * `posts_pre_query`.
		 *
		 * @param array|null      $suggestions Null to search as usual, or `items` (one page, in this
		 *                                     endpoint's fields) and `total` (across all pages).
		 * @param WP_REST_Request $request     Full details about the request.
		 */
		$suggestions = apply_filters( 'link_suggestions_pre_query', null, $request );

		if ( null !== $suggestions ) {
			return $this->get_response( $suggestions['items'], (int) $suggestions['total'], $per_page );
		}
		$terms  = $this->get_search_terms( $search );
		$search = $terms['ranking'];
		$words  = $this->get_words( $search );

		// Nothing searchable was typed, such as only punctuation.
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

		// The SQL includes everything the results depend on, including what this user can see.
		// `prepare()` swaps `%` for a placeholder that changes per request, so remove it first.
		$cache_key = 'link-suggestions:' . md5( $wpdb->remove_placeholder_escape( $count_sql . $page_sql ) ) . ':' . wp_cache_get_last_changed( 'posts' ) . ':' . wp_cache_get_last_changed( 'terms' );
		$cached    = wp_cache_get( $cache_key, 'post-queries' );

		if ( false !== $cached ) {
			list( $total, $rows ) = $cached;
		} else {
			// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Built from pieces made with `$wpdb->prepare()`, and cached.
			$rows = $wpdb->get_results( $page_sql );

			if ( $rows && isset( $rows[0]->total_count ) ) {
				$total = (int) $rows[0]->total_count;
			} elseif ( ! $rows && 1 === $page && $this->supports_window_functions() ) {
				$total = 0;
			} else {
				// Past the last page, or no window functions: no row to read the total from.
				$total = (int) $wpdb->get_var( $count_sql );
			}
			// phpcs:enable

			wp_cache_set( $cache_key, array( $total, $rows ), 'post-queries' );
		}

		$items = array();
		foreach ( $rows as $row ) {
			$items[] = $this->prepare_response_for_collection( $this->prepare_item_for_response( $row, $request ) );
		}

		return $this->get_response( $items, $total, $per_page );
	}

	/**
	 * Builds the response, with `X-WP-Total` and `X-WP-TotalPages` headers.
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
	 * Splits a search into lowercase words, as `tokenize()` in core-data did.
	 *
	 * @param string $search What was typed.
	 * @return string[] Lowercase words of letters and numbers.
	 */
	private function get_words( $search ) {
		preg_match_all( '/[\p{L}\p{N}]+/u', mb_strtolower( $search ), $matches );
		return array_slice( $matches[0], 0, self::MAX_SEARCH_WORDS );
	}

	/**
	 * Parses a search as `WP_Query` does: quoted phrases stay whole, stopwords are dropped, and a
	 * leading minus excludes a term.
	 *
	 * @param string $search What was typed.
	 * @return array `include` and `exclude` terms, and `ranking`: the search without excluded terms.
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
	 * Every included term must be in one of the columns, and no excluded term in any.
	 *
	 * @param string[] $columns Columns to look in.
	 * @param array    $terms   Terms to find (`include`) and to leave out (`exclude`).
	 * @return string SQL condition.
	 */
	private function get_terms_found_sql( $columns, $terms ) {
		global $wpdb;

		// `$column` is always a column name from this class, never input.
		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$conditions = array();
		foreach ( $terms['include'] as $term ) {
			$like  = '%' . $wpdb->esc_like( $term ) . '%';
			$found = array();
			foreach ( $columns as $column ) {
				$found[] = $wpdb->prepare( "$column LIKE %s", $like );
			}
			$conditions[] = '( ' . implode( ' OR ', $found ) . ' )';
		}

		foreach ( $terms['exclude'] as $term ) {
			$like = '%' . $wpdb->esc_like( $term ) . '%';
			foreach ( $columns as $column ) {
				$conditions[] = $wpdb->prepare( "COALESCE( $column, '' ) NOT LIKE %s", $like );
			}
		}
		// phpcs:enable

		return $conditions ? implode( ' AND ', $conditions ) : '1=1';
	}

	/**
	 * Builds a union of matching rows from each type, all with the same columns.
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

		if ( ! $parts ) {
			return null;
		}

		// Normalizing titles inside the union, which the database materializes, does it once per
		// row. One layer up, it would be redone for every score that reads it.
		$titled = array();
		foreach ( $parts as $part ) {
			$titled[] = "SELECT b.*, {$this->get_plain_title_sql( 'b.title' )} AS plain, {$this->get_title_words_sql( 'b.title' )} AS title_words FROM ( $part ) AS b";
		}

		return implode( ' UNION ALL ', $titled );
	}

	/**
	 * Whether a subtype is searched. Post formats and media count as "post-format" and "attachment".
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
	 * Keeps the post types or taxonomies that are searched.
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
	 * Published posts of public post types, except attachments.
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

		$post_types = array_values( $post_types );
		$found      = $this->get_terms_found_sql( array( 'p.post_title', 'p.post_excerpt', 'p.post_content' ), $terms );

		// Links are more often to pages, so pages outrank other content that matches as well.
		$sql = $wpdb->prepare(
			"SELECT 'post-type' AS kind, CASE WHEN p.post_type = 'page' THEN %d + 0.5 ELSE %d END AS base_rank,
				p.post_type AS subtype, p.ID AS object_id, p.post_title AS title, p.post_date AS sort_date, '' AS sort_name
			FROM {$wpdb->posts} AS p
			WHERE p.post_status = 'publish' AND p.post_type IN ( " . implode( ', ', array_fill( 0, count( $post_types ), '%s' ) ) . ' )',
			array_merge( array( self::TYPE_RANKS['post'], self::TYPE_RANKS['post'] ), $post_types )
		);

		return "$sql AND $found";
	}

	/**
	 * Terms of public taxonomies.
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

		$taxonomies = array_values( $taxonomies );
		$found      = $this->get_terms_found_sql( array( 't.name', 't.slug' ), $terms );

		$sql = $wpdb->prepare(
			"SELECT 'taxonomy' AS kind, %d AS base_rank, tt.taxonomy AS subtype, t.term_id AS object_id,
				t.name AS title, NULL AS sort_date, t.name AS sort_name
			FROM {$wpdb->terms} AS t
			INNER JOIN {$wpdb->term_taxonomy} AS tt ON tt.term_id = t.term_id
			WHERE tt.taxonomy IN ( " . implode( ', ', array_fill( 0, count( $taxonomies ), '%s' ) ) . ' )',
			array_merge( array( self::TYPE_RANKS['term'] ), $taxonomies )
		);

		return "$sql AND $found";
	}

	/**
	 * Post formats with an archive. There is no table for them, so each is a row of literals.
	 *
	 * @param array $terms Search terms, from `get_search_terms()`.
	 * @return string|null SQL.
	 */
	private function get_post_formats_sql( $terms ) {
		global $wpdb;

		$rows  = array();
		$index = 0;
		$rank  = self::TYPE_RANKS['post-format'];

		foreach ( get_post_format_strings() as $slug => $label ) {
			++$index;

			if ( ! get_post_format_link( $slug ) ) {
				continue;
			}

			$rows[] = $wpdb->prepare(
				"SELECT 'post-format' AS kind, %d AS base_rank, 'post-format' AS subtype, %s AS object_id, %s AS title, NULL AS sort_date, %s AS sort_name",
				$rank,
				$slug,
				$label,
				sprintf( '%02d', $index )
			);
		}

		if ( ! $rows ) {
			return null;
		}

		$found = $this->get_terms_found_sql( array( 'f.title', 'f.object_id' ), $terms );

		return 'SELECT * FROM ( ' . implode( ' UNION ALL ', $rows ) . " ) AS f WHERE $found";
	}

	/**
	 * Media the user can see. Visibility follows the parent post, checked in SQL so pages and
	 * totals stay right.
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

		$sql = $wpdb->prepare(
			"SELECT 'media' AS kind, %d AS base_rank, 'attachment' AS subtype, a.ID AS object_id,
				a.post_title AS title, a.post_date AS sort_date, '' AS sort_name
			FROM {$wpdb->posts} AS a
			LEFT JOIN {$wpdb->posts} AS parent ON parent.ID = a.post_parent
			WHERE a.post_type = 'attachment' AND a.post_status = 'inherit'",
			self::TYPE_RANKS['attachment']
		);

		return "$sql AND ( {$this->get_readable_parent_sql()} ) AND $found";
	}

	/**
	 * Whether the user can read an attachment's parent, as `check_read_permission()` decides:
	 * published, their own, private with `read_private_posts`, or other statuses with
	 * `edit_others_posts`.
	 *
	 * @return string SQL condition.
	 */
	private function get_readable_parent_sql() {
		global $wpdb;

		$public_statuses = array_values( get_post_stati( array( 'public' => true ) ) );
		$private_types   = array();
		$others_types    = array();

		foreach ( get_post_types( array(), 'objects' ) as $post_type ) {
			if ( current_user_can( $post_type->cap->read_private_posts ) ) {
				$private_types[] = $post_type->name;
			}
			if ( current_user_can( $post_type->cap->edit_others_posts ) ) {
				$others_types[] = $post_type->name;
			}
		}

		$conditions = array(
			'a.post_parent = 0',
			'parent.ID IS NULL',
			$wpdb->prepare( 'parent.post_status IN ( ' . implode( ', ', array_fill( 0, count( $public_statuses ), '%s' ) ) . ' )', $public_statuses ),
			$wpdb->prepare( 'parent.post_author = %d', get_current_user_id() ),
		);

		if ( $private_types ) {
			$conditions[] = $wpdb->prepare( "( parent.post_status = 'private' AND parent.post_type IN ( " . implode( ', ', array_fill( 0, count( $private_types ), '%s' ) ) . ' ) )', $private_types );
		}

		if ( $others_types ) {
			$conditions[] = $wpdb->prepare( "( parent.post_status <> 'private' AND parent.post_type IN ( " . implode( ', ', array_fill( 0, count( $others_types ), '%s' ) ) . ' ) )', $others_types );
		}

		return implode( ' OR ', $conditions );
	}

	/**
	 * The `prefer_types` entries that name a known type.
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
	 * SQL condition for rows of a preferred type.
	 *
	 * @param array $entry A preferred type.
	 * @return string SQL condition.
	 */
	private function get_preferred_type_sql( $entry ) {
		global $wpdb;

		$sql = $wpdb->prepare( 'kind = %s', self::KINDS[ $entry['type'] ] );

		if ( $entry['subtype'] ) {
			$sql .= $wpdb->prepare( ' AND subtype = %s', $entry['subtype'] );
		}

		return "( $sql )";
	}

	/**
	 * A row's type rank. Preferred types rank above all others, in the order given.
	 *
	 * @param array[] $preferred Types to rank first, most wanted first.
	 * @return string SQL expression.
	 */
	private function get_type_rank_sql( $preferred ) {
		if ( ! $preferred ) {
			return 'c.base_rank';
		}

		global $wpdb;

		$cases = array();
		foreach ( $preferred as $index => $entry ) {
			$rank    = count( self::TYPE_RANKS ) + count( $preferred ) - $index;
			$cases[] = "WHEN {$this->get_preferred_type_sql( $entry )} THEN " . $wpdb->prepare( '%d', $rank );
		}

		return 'CASE ' . implode( ' ', $cases ) . ' ELSE c.base_rank END';
	}

	/**
	 * Whether beginning with the search lifts a row within its page. Not for media unless
	 * preferred, since file-name titles often begin with the search. Media still shares pages
	 * by it.
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
	 * A title lowercased with straight quotes, to compare with the search.
	 *
	 * @param string $column Column holding the title.
	 * @return string SQL expression.
	 */
	private function get_plain_title_sql( $column ) {
		global $wpdb;

		$sql = "LOWER( TRIM( $column ) )";
		foreach ( self::CURLY_QUOTES as $curly => $straight ) {
			$sql = "REPLACE( $sql, " . $wpdb->prepare( '%s, %s', $curly, $straight ) . ' )';
		}
		return $sql;
	}

	/**
	 * A title lowercased, split into words by spaces, with a space at each end.
	 *
	 * @param string $column Column holding the title.
	 * @return string SQL expression.
	 */
	private function get_title_words_sql( $column ) {
		if ( $this->supports_window_functions() ) {
			// Splits at anything but letters and numbers, as `tokenize()` in core-data did.
			$sql = "REGEXP_REPLACE( LOWER( $column ), '[^\\\\p{L}\\\\p{N}]+', ' ' )";
		} else {
			global $wpdb;

			$sql = "LOWER( $column )";
			foreach ( self::WORD_SEPARATORS as $separator ) {
				$sql = "REPLACE( $sql, " . $wpdb->prepare( '%s', $separator ) . ", ' ' )";
			}
		}

		return "CONCAT( ' ', $sql, ' ' )";
	}

	/**
	 * Adds the ranking scores to each candidate.
	 *
	 * @param string   $candidates SQL listing the candidates.
	 * @param string   $search     What was typed.
	 * @param string[] $words      Words typed.
	 * @param array[]  $preferred  Types to rank first, most wanted first.
	 * @return string SQL.
	 */
	private function get_ranked_sql( $candidates, $search, $words, $preferred ) {
		global $wpdb;

		$titled = "SELECT c.*, {$this->get_type_rank_sql( $preferred )} AS type_rank FROM ( $candidates ) AS c";

		if ( ! $words ) {
			return "SELECT * FROM ( $titled ) AS scored";
		}

		$needle = strtr( mb_strtolower( trim( $search ) ), self::CURLY_QUOTES );
		$begins = $wpdb->prepare( 'LEFT( plain, CHAR_LENGTH( %s ) ) = %s', $needle, $needle );

		$found    = array();
		$coverage = array();
		foreach ( $words as $word ) {
			$found[]    = $wpdb->prepare( '( LOCATE( %s, title_words ) > 0 )', $word );
			$coverage[] = $this->get_word_coverage_sql( $word );
		}

		$scores = implode(
			', ',
			array(
				'( ' . implode( ' + ', $found ) . ' ) AS found',
				$wpdb->prepare( '( LOCATE( %s, plain ) > 0 ) AS contains_search', $needle ),
				"( $begins ) AS begins",
				"( $begins AND {$this->get_can_begin_sql( $preferred )} ) AS lifted",
				'( ( ' . implode( ' + ', $coverage ) . ' ) / ' . count( $words ) . ' * 10 ) AS coverage',
			)
		);

		return "SELECT t.*, $scores FROM ( $titled ) AS t";
	}

	/**
	 * How much of the title word a word typed covers: 1 for a whole word, otherwise its share of
	 * the first title word holding it.
	 *
	 * @param string $word A word typed.
	 * @return string SQL expression between 0 and 1.
	 */
	private function get_word_coverage_sql( $word ) {
		global $wpdb;

		$length   = mb_strlen( $word );
		$whole    = $wpdb->prepare( 'LOCATE( %s, title_words )', ' ' . $word . ' ' );
		$position = $wpdb->prepare( 'LOCATE( %s, title_words )', $word );
		$before   = "CHAR_LENGTH( SUBSTRING_INDEX( LEFT( title_words, $position - 1 ), ' ', -1 ) )";
		$after    = "CHAR_LENGTH( SUBSTRING_INDEX( SUBSTRING( title_words, $position + $length ), ' ', 1 ) )";

		return "( CASE
			WHEN $whole > 0 THEN 1
			WHEN $position > 0 THEN $length / ( $before + $length + $after )
			ELSE 0 END )";
	}

	/**
	 * Builds the query for one page.
	 *
	 * With window functions, results of equal quality are numbered within each subtype, and pages
	 * take the first of each subtype, then the second, and so on. The order is fixed, so paging
	 * never repeats or skips a result. Each page is then sorted by rank.
	 *
	 * @param string   $ranked   SQL scoring each candidate.
	 * @param string[] $words    Words typed.
	 * @param int      $page     Page asked for.
	 * @param int      $per_page Suggestions per page.
	 * @return string SQL.
	 */
	private function get_page_sql( $ranked, $words, $page, $per_page ) {
		global $wpdb;

		$limit     = $wpdb->prepare( 'LIMIT %d OFFSET %d', $per_page, ( $page - 1 ) * $per_page );
		$rank      = $this->get_order_by( $words );
		$tie_break = implode( ', ', self::TIE_BREAK );

		if ( ! $this->supports_window_functions() ) {
			return "SELECT * FROM ( $ranked ) AS ranked ORDER BY $rank $limit";
		}

		// Each row carries the total, so there is no separate count query.
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
	 * Whether the database has window functions and `REGEXP_REPLACE` (MySQL 8.0+, MariaDB 10.2+).
	 * Without them, pages are not shared between subtypes, and titles split at common punctuation.
	 *
	 * @return bool
	 */
	protected function supports_window_functions() {
		global $wpdb;

		$is_mariadb = false !== stripos( (string) $wpdb->db_server_info(), 'mariadb' );

		return version_compare( $wpdb->db_version(), $is_mariadb ? '10.2' : '8.0', '>=' );
	}

	/**
	 * The rank order.
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
	 * Formats a row with the fields and `self` link `/wp/v2/search` returns.
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
				'description' => __( 'Text to search for.', 'gutenberg' ),
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
				'description' => __( 'Types to rank first, in order: a type, or a type and subtype.', 'gutenberg' ),
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
