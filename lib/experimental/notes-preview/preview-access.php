<?php
/**
 * Preview access for reviewers.
 *
 * Viewing a draft, pending or scheduled post on the front end normally
 * requires `edit_post`: WP_Query::get_posts() empties the result set for
 * anyone who fails that check, which is why a preview link only works for
 * people who could edit the post anyway.
 *
 * A reviewer holding `read_post_notes` on the post is let through that gate.
 * The capability is the whole grant - there is no token or nonce involved.
 * The `preview_id` / `preview_nonce` parameters on a preview URL only select
 * autosave content and are bound to the session that generated them, so a
 * reviewer sees the last saved revision of the draft, which is the artifact
 * they are being asked to review.
 *
 * Logged-out visitors are turned away by core before this file gets a say
 * (WP_Query::get_posts() empties the results for them first) and nothing here
 * reinstates them.
 *
 * @package gutenberg
 */

/**
 * Post statuses a reviewer may preview.
 *
 * Deliberately excludes `private`, which follows core's `read_post` rules, and
 * `trash`.
 *
 * @var string[]
 */
const GUTENBERG_NOTES_PREVIEW_STATUSES = array( 'draft', 'pending', 'future' );

/**
 * Whether the current user may review the given post without being able to edit it.
 *
 * @param WP_Post|null $post Post object.
 * @return bool True when the current user may preview the post as a reviewer.
 */
function gutenberg_notes_preview_user_can_review( $post ) {
	if ( ! $post instanceof WP_Post || ! is_user_logged_in() ) {
		return false;
	}

	if ( ! in_array( $post->post_status, GUTENBERG_NOTES_PREVIEW_STATUSES, true ) ) {
		return false;
	}

	if ( ! gutenberg_notes_preview_post_type_supports_notes( $post->post_type ) ) {
		return false;
	}

	// Never a way around the post password.
	if ( post_password_required( $post ) ) {
		return false;
	}

	return current_user_can( 'read_post_notes', $post->ID );
}

/**
 * Whether a post type opts in to notes.
 *
 * @param string $post_type Post type name.
 * @return bool True if the post type supports notes, false otherwise.
 */
function gutenberg_notes_preview_post_type_supports_notes( $post_type ) {
	$supports = get_all_post_type_supports( $post_type );

	if ( ! isset( $supports['editor'] ) || ! is_array( $supports['editor'] ) ) {
		return false;
	}

	foreach ( $supports['editor'] as $item ) {
		if ( ! empty( $item['notes'] ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Remembers the real status of a post whose status is temporarily swapped.
 *
 * @param int         $post_id Post ID.
 * @param string|null $status  Status to store, or null to read the stored one.
 * @return string|null The stored status, or null when none is stored.
 */
function gutenberg_notes_preview_original_status( $post_id, $status = null ) {
	static $statuses = array();

	$post_id = (int) $post_id;

	if ( null !== $status ) {
		$statuses[ $post_id ] = $status;
	}

	return isset( $statuses[ $post_id ] ) ? $statuses[ $post_id ] : null;
}

/**
 * Lets a reviewer's preview request past the protected-status gate.
 *
 * `posts_results` runs before the status check in WP_Query::get_posts(), so
 * presenting the post as published for the length of that check is enough. The
 * real status is put back on `the_posts`, before the results reach the post
 * cache, so nothing downstream sees a draft claiming to be published.
 *
 * @param WP_Post[] $posts Array of post objects.
 * @param WP_Query  $query The query instance.
 * @return WP_Post[] Array of post objects.
 */
function gutenberg_notes_preview_posts_results( $posts, $query ) {
	if ( ! $query instanceof WP_Query || ! $query->is_main_query() || ! $query->is_preview() ) {
		return $posts;
	}

	if ( ! is_array( $posts ) || 1 !== count( $posts ) ) {
		return $posts;
	}

	$post = reset( $posts );

	if ( ! $post instanceof WP_Post ) {
		return $posts;
	}

	// Core already admits anyone who can edit the post.
	if ( current_user_can( 'edit_post', $post->ID ) ) {
		return $posts;
	}

	if ( ! gutenberg_notes_preview_user_can_review( $post ) ) {
		return $posts;
	}

	gutenberg_notes_preview_original_status( $post->ID, $post->post_status );
	$post->post_status = 'publish';

	// A review URL is not something to cache or index.
	nocache_headers();
	add_filter( 'wp_robots', 'wp_robots_no_robots' );

	return $posts;
}

add_filter( 'posts_results', 'gutenberg_notes_preview_posts_results', 10, 2 );

/**
 * Restores the real status of any post swapped by the filter above.
 *
 * @param WP_Post[] $posts Array of post objects.
 * @return WP_Post[] Array of post objects.
 */
function gutenberg_notes_preview_restore_status( $posts ) {
	if ( ! is_array( $posts ) ) {
		return $posts;
	}

	foreach ( $posts as $post ) {
		if ( ! $post instanceof WP_Post ) {
			continue;
		}

		$status = gutenberg_notes_preview_original_status( $post->ID );

		if ( null !== $status ) {
			$post->post_status = $status;
		}
	}

	return $posts;
}

add_filter( 'the_posts', 'gutenberg_notes_preview_restore_status', 10 );
