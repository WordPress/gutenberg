<?php
/**
 * Unseen notes indicator on the posts list screen.
 *
 * Marks the posts whose notes carry activity the current user has not seen yet,
 * right after the post title and its post states on `edit.php`. The indicator
 * links to the editor with the "All notes" sidebar open.
 *
 * "Seen" is the per-user, per-post timestamp the editor stores in the
 * `notesLastSeen` preference whenever the user looks at a post's notes, so
 * opening the notes in the editor clears the indicator with no bookkeeping of
 * its own. What counts as unseen matches the editor's "All notes" badge:
 *
 * - Only unresolved threads count, through the thread itself or any reply.
 * - Activity authored by the current user never counts.
 * - A post the user has never looked at treats all activity as unseen.
 *
 * @see https://github.com/WordPress/gutenberg/issues/81948
 *
 * @package gutenberg
 */

/**
 * Returns when a user last looked at the notes of each post.
 *
 * The editor records these in the `notesLastSeen` preference, persisted with
 * every other editor preference in the `persisted_preferences` user meta. The
 * values are untrusted, so anything that is not a post ID mapped to a REST
 * `date_gmt` string is dropped.
 *
 * @param int $user_id User ID.
 * @return array<int, string> `date_gmt` values in the `Y-m-d\TH:i:s` format, keyed by post ID.
 */
function gutenberg_get_notes_last_seen( $user_id ) {
	global $wpdb;

	$preferences = get_user_meta( $user_id, $wpdb->get_blog_prefix() . 'persisted_preferences', true );
	$last_seen   = $preferences['core']['notesLastSeen'] ?? null;
	if ( ! is_array( $last_seen ) ) {
		return array();
	}

	$sanitized = array();
	foreach ( $last_seen as $post_id => $date_gmt ) {
		if (
			is_numeric( $post_id ) &&
			(int) $post_id > 0 &&
			is_string( $date_gmt ) &&
			preg_match( '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/', $date_gmt )
		) {
			$sanitized[ (int) $post_id ] = $date_gmt;
		}
	}

	return $sanitized;
}

/**
 * Lists the posts whose notes carry activity a user has not seen yet.
 *
 * All the notes of the given posts come from a single query, however many posts
 * are passed. A post has unseen activity when a note by someone else on one of
 * its unresolved threads postdates the user's `notesLastSeen` timestamp for it.
 * Posts the user cannot edit, and therefore cannot read the notes of, are left
 * out.
 *
 * @param int[] $post_ids Post IDs to check.
 * @param int   $user_id  User the activity is unseen by.
 * @return int[] IDs of the posts with unseen note activity.
 */
function gutenberg_get_posts_with_unseen_notes( $post_ids, $user_id ) {
	$post_ids = array_values( array_unique( array_filter( array_map( 'intval', (array) $post_ids ) ) ) );
	$user_id  = (int) $user_id;
	if ( ! $post_ids || ! $user_id ) {
		return array();
	}

	// The default 'all' status leaves out notes in the trash or marked as spam,
	// as the editor does.
	$notes = get_comments(
		array(
			'post__in'                  => $post_ids,
			'type'                      => 'note',
			'no_found_rows'             => true,
			'update_comment_meta_cache' => false,
			'update_comment_post_cache' => false,
		)
	);
	if ( ! $notes ) {
		return array();
	}

	// Notes are one level deep: a thread is a top-level note, and its replies
	// point at it through `comment_parent`. '0' is the "hold" status of an
	// unresolved thread.
	$open_threads = array();
	foreach ( $notes as $note ) {
		if ( 0 === (int) $note->comment_parent && '0' === $note->comment_approved ) {
			$open_threads[ (int) $note->comment_ID ] = true;
		}
	}

	$last_seen = gutenberg_get_notes_last_seen( $user_id );
	$unseen    = array();
	foreach ( $notes as $note ) {
		$post_id   = (int) $note->comment_post_ID;
		$thread_id = (int) $note->comment_parent ? (int) $note->comment_parent : (int) $note->comment_ID;
		if (
			isset( $unseen[ $post_id ] ) ||
			! isset( $open_threads[ $thread_id ] ) ||
			(int) $note->user_id === $user_id
		) {
			continue;
		}
		// Stored timestamps are REST `date_gmt` strings. Both are fixed width
		// and zero padded, so comparing them as strings is chronological.
		$date_gmt = str_replace( ' ', 'T', $note->comment_date_gmt );
		if ( isset( $last_seen[ $post_id ] ) && $date_gmt <= $last_seen[ $post_id ] ) {
			continue;
		}
		$unseen[ $post_id ] = true;
	}

	return array_values(
		array_filter(
			array_keys( $unseen ),
			static function ( $post_id ) use ( $user_id ) {
				return user_can( $user_id, 'edit_post', $post_id );
			}
		)
	);
}

/**
 * Returns the markup of the unseen notes indicator for a post.
 *
 * @param WP_Post $post Post with unseen note activity.
 * @return string Indicator markup.
 */
function gutenberg_get_unseen_notes_indicator_html( $post ) {
	$edit_link = get_edit_post_link( $post->ID, 'url' );
	if ( ! $edit_link ) {
		return '';
	}

	return sprintf(
		'<a class="wp-note-unseen-indicator" href="%1$s"><span class="screen-reader-text">%2$s</span></a>',
		esc_url( add_query_arg( 'notes', 'open', $edit_link ) ),
		sprintf(
			/* translators: %s: Post title. */
			esc_html__( 'New note activity on “%s”', 'gutenberg' ),
			// Already escaped.
			_draft_or_post_title( $post )
		)
	);
}

/**
 * Appends the unseen notes indicator after a post's title and post states.
 *
 * Filtering the post states HTML, rather than the title or the list table
 * columns, leaves both untouched for other plugins, and places the indicator
 * after every post state whether there are any or not.
 *
 * The unseen posts of the whole screen are looked up on the first row, so the
 * list costs one query rather than one per row.
 *
 * @param string  $post_states_html HTML of the post states.
 * @param array   $post_states      Post state labels, keyed by slug.
 * @param WP_Post $post             Post the states belong to.
 * @return string HTML of the post states, followed by the indicator when the post has unseen notes.
 */
function gutenberg_add_unseen_notes_indicator_to_post_states( $post_states_html, $post_states, $post ) {
	global $wp_query;
	static $cache_key = null;
	static $unseen    = array();

	if ( ! $post instanceof WP_Post || 'trash' === $post->post_status ) {
		return $post_states_html;
	}

	// Hierarchical post types list every post ID with its parent rather than
	// full posts, so read the IDs either way.
	$post_ids = $wp_query instanceof WP_Query && $wp_query->posts ? array_map( 'intval', wp_list_pluck( $wp_query->posts, 'ID' ) ) : array();
	if ( ! in_array( $post->ID, $post_ids, true ) ) {
		$post_ids[] = $post->ID;
	}
	$user_id = get_current_user_id();
	$key     = $user_id . ':' . implode( ',', $post_ids );
	if ( $key !== $cache_key ) {
		$cache_key = $key;
		$unseen    = array_flip( gutenberg_get_posts_with_unseen_notes( $post_ids, $user_id ) );
	}

	if ( ! isset( $unseen[ $post->ID ] ) || ! use_block_editor_for_post( $post ) ) {
		return $post_states_html;
	}

	return $post_states_html . gutenberg_get_unseen_notes_indicator_html( $post );
}

/**
 * Adds the styles of the unseen notes indicator to the list table styles.
 */
function gutenberg_add_unseen_notes_indicator_styles() {
	wp_add_inline_style(
		'list-tables',
		// The dot sits in a 24px box so the link keeps a usable target size.
		'.wp-note-unseen-indicator {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 24px;
			height: 24px;
			vertical-align: middle;
		}
		.wp-note-unseen-indicator::before {
			content: "";
			width: 8px;
			height: 8px;
			border-radius: 50%;
			background: var(--wp-admin-theme-color, #3858e9);
		}
		@media (forced-colors: active) {
			.wp-note-unseen-indicator::before {
				forced-color-adjust: none;
				background: LinkText;
			}
		}'
	);
}

/**
 * Sets up the unseen notes indicator on the posts list screen of a post type
 * that supports notes.
 *
 * Notes support is an `editor` post type support argument, which
 * `post_type_supports()` cannot see. This mirrors
 * `WP_REST_Comments_Controller::check_post_type_supports_notes()`.
 */
function gutenberg_setup_unseen_notes_indicator() {
	$screen   = get_current_screen();
	$supports = $screen && $screen->post_type ? get_all_post_type_supports( $screen->post_type ) : array();
	if ( ! isset( $supports['editor'] ) || ! is_array( $supports['editor'] ) ) {
		return;
	}

	foreach ( $supports['editor'] as $args ) {
		if ( is_array( $args ) && ! empty( $args['notes'] ) ) {
			add_filter( 'post_states_html', 'gutenberg_add_unseen_notes_indicator_to_post_states', 10, 3 );
			add_action( 'admin_enqueue_scripts', 'gutenberg_add_unseen_notes_indicator_styles' );
			return;
		}
	}
}
add_action( 'load-edit.php', 'gutenberg_setup_unseen_notes_indicator' );
