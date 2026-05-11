<?php
/**
 * “On This Day” dashboard data: WP_Query date_query, excerpt extraction, REST, cache.
 *
 * Mirrors the approach from WordPress Core’s On This Day widget (WP_Query with
 * `date_query`, HTML API excerpt extraction, draft/private/publish visibility).
 *
 * @package gutenberg
 */

/**
 * Cache group for On This Day REST payloads.
 */
const GUTENBERG_ON_THIS_DAY_CACHE_GROUP = 'gutenberg_on_this_day';

/**
 * Minimum / maximum inclusive window size (days), matching Core.
 */
const GUTENBERG_ON_THIS_DAY_MIN_WINDOW = 1;
const GUTENBERG_ON_THIS_DAY_MAX_WINDOW = 7;

/**
 * Max posts returned for the widget (same order of magnitude as Core).
 */
const GUTENBERG_ON_THIS_DAY_POSTS_PER_PAGE = 100;

/**
 * Plain-text excerpt length (characters), aligned with Core’s widget.
 */
const GUTENBERG_ON_THIS_DAY_EXCERPT_CHARS = 240;

/**
 * Cache TTL for the computed REST payload (seconds).
 */
const GUTENBERG_ON_THIS_DAY_CACHE_TTL = 10 * MINUTE_IN_SECONDS;

/**
 * Registers the REST route and cache invalidation hooks.
 */
function gutenberg_on_this_day_bootstrap() {
	register_rest_route(
		'wp/v2',
		'/on-this-day',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'gutenberg_on_this_day_rest_callback',
			'permission_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
			'args'                => array(
				'window_days' => array(
					'description' => __( 'Number of calendar days starting from today (1–7).', 'gutenberg' ),
					'type'          => 'integer',
					'default'       => GUTENBERG_ON_THIS_DAY_MIN_WINDOW,
					'minimum'       => GUTENBERG_ON_THIS_DAY_MIN_WINDOW,
					'maximum'       => GUTENBERG_ON_THIS_DAY_MAX_WINDOW,
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_on_this_day_bootstrap' );

/**
 * Clears cached On This Day payloads for a post author when a post is saved.
 *
 * @param int     $post_id Post ID.
 * @param WP_Post $post    Post object.
 */
function gutenberg_on_this_day_bust_cache_on_save( $post_id, $post ) {
	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}
	if ( ! $post instanceof WP_Post || 'post' !== $post->post_type ) {
		return;
	}
	gutenberg_on_this_day_flush_user_cache( (int) $post->post_author );
}
add_action( 'save_post_post', 'gutenberg_on_this_day_bust_cache_on_save', 10, 2 );

/**
 * Clears cache when a post is deleted.
 *
 * @param int $post_id Post ID.
 */
function gutenberg_on_this_day_bust_cache_on_delete( $post_id ) {
	$post = get_post( $post_id );
	if ( ! $post instanceof WP_Post || 'post' !== $post->post_type ) {
		return;
	}
	gutenberg_on_this_day_flush_user_cache( (int) $post->post_author );
}
add_action( 'delete_post', 'gutenberg_on_this_day_bust_cache_on_delete' );

/**
 * Deletes cached REST payloads for every window size for the given user.
 *
 * @param int $user_id User ID.
 */
function gutenberg_on_this_day_flush_user_cache( $user_id ) {
	$user_id = (int) $user_id;
	if ( $user_id <= 0 ) {
		return;
	}
	for ( $w = GUTENBERG_ON_THIS_DAY_MIN_WINDOW; $w <= GUTENBERG_ON_THIS_DAY_MAX_WINDOW; $w++ ) {
		wp_cache_delete( gutenberg_on_this_day_cache_key( $user_id, $w ), GUTENBERG_ON_THIS_DAY_CACHE_GROUP );
	}
}

/**
 * Builds a stable cache key for a user + window pair.
 *
 * @param int $user_id     User ID.
 * @param int $window_days Window size.
 * @return string Cache key.
 */
function gutenberg_on_this_day_cache_key( $user_id, $window_days ) {
	return sprintf( 'payload_u%d_w%d', (int) $user_id, (int) $window_days );
}

/**
 * REST callback: returns grouped posts, labels, and media metadata.
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response|WP_Error
 */
function gutenberg_on_this_day_rest_callback( WP_REST_Request $request ) {
	$user_id = get_current_user_id();
	if ( ! $user_id ) {
		return new WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to view On This Day data.', 'gutenberg' ),
			array( 'status' => 401 )
		);
	}

	$window_days = (int) $request->get_param( 'window_days' );
	$window_days = gutenberg_on_this_day_clamp_window_days( $window_days );

	$cache_key = gutenberg_on_this_day_cache_key( $user_id, $window_days );
	$cached    = wp_cache_get( $cache_key, GUTENBERG_ON_THIS_DAY_CACHE_GROUP );
	if ( false !== $cached && is_array( $cached ) ) {
		return rest_ensure_response( $cached );
	}

	$payload = gutenberg_on_this_day_build_payload( $user_id, $window_days );
	wp_cache_set( $cache_key, $payload, GUTENBERG_ON_THIS_DAY_CACHE_GROUP, GUTENBERG_ON_THIS_DAY_CACHE_TTL );

	return rest_ensure_response( $payload );
}

/**
 * Clamps window size to the supported range.
 *
 * @param mixed $window_days Raw value.
 * @return int
 */
function gutenberg_on_this_day_clamp_window_days( $window_days ) {
	$n = (int) $window_days;
	return min(
		GUTENBERG_ON_THIS_DAY_MAX_WINDOW,
		max( GUTENBERG_ON_THIS_DAY_MIN_WINDOW, $n )
	);
}

/**
 * Builds date_query OR-clauses for each calendar day in the window (site timezone).
 *
 * @param int $window_days Number of days.
 * @return array<int, array<string, int>>
 */
function gutenberg_on_this_day_get_window_date_query_clauses( $window_days ) {
	$window_days = gutenberg_on_this_day_clamp_window_days( $window_days );
	$date        = current_datetime();
	$clauses     = array();

	for ( $offset = 0; $offset < $window_days; $offset++ ) {
		$day_date   = $date->modify( '+' . $offset . ' days' );
		$clauses[] = array(
			'month' => (int) $day_date->format( 'n' ),
			'day'   => (int) $day_date->format( 'j' ),
		);
	}

	return $clauses;
}

/**
 * Human-readable label for the active window (Core-style).
 *
 * @param int $window_days Window size.
 * @return string
 */
function gutenberg_on_this_day_get_window_label( $window_days ) {
	$window_days = gutenberg_on_this_day_clamp_window_days( $window_days );
	$start       = current_datetime();
	$start_label = wp_date( 'F j', $start->getTimestamp(), $start->getTimezone() );

	if ( 1 === $window_days ) {
		return $start_label;
	}

	$end       = $start->modify( '+' . ( $window_days - 1 ) . ' days' );
	$end_label = wp_date( 'F j', $end->getTimestamp(), $end->getTimezone() );

	return sprintf(
		/* translators: 1: Start date, 2: End date. */
		__( '%1$s - %2$s', 'gutenberg' ),
		$start_label,
		$end_label
	);
}

/**
 * Plain-text excerpt using the HTML Tag Processor (Core-style).
 *
 * @param string $source    HTML or post text.
 * @param int    $max_chars Max characters (Unicode).
 * @return string
 */
function gutenberg_on_this_day_extract_excerpt_text( $source, $max_chars ) {
	$source = strip_shortcodes( (string) $source );

	if ( '' === trim( $source ) ) {
		return '';
	}

	if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) {
		$plain = wp_strip_all_tags( $source );
		return function_exists( 'mb_substr' )
			? mb_substr( $plain, 0, $max_chars )
			: substr( $plain, 0, $max_chars );
	}

	$processor   = new WP_HTML_Tag_Processor( $source );
	$parts       = array();
	$length      = 0;
	$inline_tags = array(
		'A',
		'ABBR',
		'B',
		'BIG',
		'CODE',
		'DEL',
		'EM',
		'FONT',
		'I',
		'INS',
		'MARK',
		'Q',
		'S',
		'SAMP',
		'SMALL',
		'SPAN',
		'STRONG',
		'SUB',
		'SUP',
		'TIME',
		'VAR',
	);

	while ( $processor->next_token() ) {
		$token_type = $processor->get_token_type();

		if ( '#tag' === $token_type ) {
			$tag_name = $processor->get_tag();

			if ( ! in_array( $tag_name, $inline_tags, true ) ) {
				$parts[] = ' ';
			}
			continue;
		}

		if ( '#text' !== $token_type ) {
			continue;
		}

		$chunk = $processor->get_modifiable_text();
		$parts[] = $chunk;
		$length += function_exists( 'mb_strlen' ) ? mb_strlen( $chunk ) : strlen( $chunk );

		if ( $length >= $max_chars ) {
			break;
		}
	}

	$separator = function_exists( '_wp_can_use_pcre_u' ) && _wp_can_use_pcre_u()
		? '~[\s\p{Z}]+~u'
		: '~\s+~';

	return trim( preg_replace( $separator, ' ', implode( '', $parts ) ) );
}

/**
 * Runs WP_Query for the author’s posts in the anniversary window (previous years).
 *
 * @param int $user_id     Author.
 * @param int $window_days Window size.
 * @return WP_Post[]
 */
function gutenberg_on_this_day_query_posts( $user_id, $window_days ) {
	$window_days = gutenberg_on_this_day_clamp_window_days( $window_days );
	$year        = (int) current_time( 'Y' );

	$date_query = array(
		'relation' => 'AND',
		array(
			'before' => array( 'year' => $year ),
		),
		array_merge(
			array( 'relation' => 'OR' ),
			gutenberg_on_this_day_get_window_date_query_clauses( $window_days )
		),
	);

	$args = array(
		'author'              => (int) $user_id,
		'post_type'           => 'post',
		'post_status'         => array( 'publish', 'private', 'draft' ),
		'posts_per_page'      => GUTENBERG_ON_THIS_DAY_POSTS_PER_PAGE,
		'ignore_sticky_posts' => true,
		'orderby'             => 'date',
		'order'               => 'DESC',
		'no_found_rows'       => true,
		'date_query'          => $date_query,
	);

	/**
	 * Filters the arguments used to query posts for the On This Day dashboard widget.
	 *
	 * @param array $args        WP_Query arguments.
	 * @param int   $user_id     Author ID.
	 * @param int   $window_days Window size.
	 */
	$args = apply_filters( 'dashboard_on_this_day_query_args', $args, $user_id, $window_days );

	$query = new WP_Query( $args );

	return $query->posts;
}

/**
 * Shapes REST payload: years → posts with links, excerpt, categories, thumbnail.
 *
 * @param int $user_id     Current user (author scope).
 * @param int $window_days Window size.
 * @return array<string, mixed>
 */
function gutenberg_on_this_day_build_payload( $user_id, $window_days ) {
	$window_days = gutenberg_on_this_day_clamp_window_days( $window_days );
	$posts       = gutenberg_on_this_day_query_posts( $user_id, $window_days );

	$current_year = (int) current_time( 'Y' );
	$by_year      = array();

	foreach ( $posts as $post ) {
		if ( ! ( $post instanceof WP_Post ) ) {
			continue;
		}

		$post_year = (int) get_the_date( 'Y', $post );
		if ( $post_year >= $current_year ) {
			continue;
		}

		if ( ! isset( $by_year[ $post_year ] ) ) {
			$by_year[ $post_year ] = array();
		}

		$by_year[ $post_year ][] = gutenberg_on_this_day_shape_post( $post );
	}

	krsort( $by_year, SORT_NUMERIC );

	$years = array();
	foreach ( $by_year as $year => $year_posts ) {
		$years[] = array(
			'year'      => (int) $year,
			'years_ago' => $current_year - (int) $year,
			'posts'     => $year_posts,
		);
	}

	return array(
		'window_days'  => $window_days,
		'window_label' => gutenberg_on_this_day_get_window_label( $window_days ),
		'years'        => $years,
	);
}

/**
 * Maps a single post to the REST item shape.
 *
 * @param WP_Post $post Post.
 * @return array<string, mixed>
 */
function gutenberg_on_this_day_shape_post( WP_Post $post ) {
	$status = get_post_status( $post );

	$title = get_the_title( $post );
	if ( '' === trim( (string) $title ) ) {
		$title = __( '(no title)', 'gutenberg' );
	}

	$excerpt_source = has_excerpt( $post ) ? $post->post_excerpt : $post->post_content;
	$excerpt         = gutenberg_on_this_day_extract_excerpt_text(
		$excerpt_source,
		GUTENBERG_ON_THIS_DAY_EXCERPT_CHARS
	);

	$time_iso     = get_the_time( 'c', $post );
	$time_display = get_the_time( get_option( 'time_format' ), $post );

	$categories = array();
	foreach ( get_the_category( $post->ID ) as $term ) {
		if ( ! ( $term instanceof WP_Term ) ) {
			continue;
		}
		$link = get_term_link( $term );
		if ( is_wp_error( $link ) ) {
			$link = '';
		}
		$categories[] = array(
			'id'   => (int) $term->term_id,
			'name' => $term->name,
			'slug' => $term->slug,
			'link' => $link,
		);
	}

	$thumb_id = get_post_thumbnail_id( $post );
	$thumb    = null;
	if ( $thumb_id ) {
		$src = wp_get_attachment_image_src( $thumb_id, 'thumbnail' );
		if ( is_array( $src ) ) {
			$alt = get_post_meta( $thumb_id, '_wp_attachment_image_alt', true );
			$srcset = wp_get_attachment_image_srcset( $thumb_id, 'thumbnail' );
			$thumb  = array(
				'url'    => $src[0],
				'width'  => (int) $src[1],
				'height' => (int) $src[2],
				'srcset' => is_string( $srcset ) ? $srcset : '',
				'alt'    => is_string( $alt ) ? $alt : '',
			);
		}
	}

	$edit_url = 'post.php?post=' . (int) $post->ID . '&action=edit';

	$view_url = '';
	if ( 'publish' === $status ) {
		$view_url = get_permalink( $post );
	} elseif ( in_array( $status, array( 'private', 'draft' ), true ) ) {
		$preview = get_preview_post_link( $post );
		if ( is_string( $preview ) && '' !== $preview ) {
			$view_url = $preview;
		}
	}

	return array(
		'id'           => (int) $post->ID,
		'title'        => $title,
		'status'       => $status,
		'excerpt'      => $excerpt,
		'time_iso'     => $time_iso,
		'time_display' => $time_display,
		'edit_url'     => $edit_url,
		'view_url'     => $view_url ? $view_url : '',
		'categories'   => $categories,
		'thumbnail'    => $thumb,
	);
}
