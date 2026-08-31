<?php
/**
 * Locking for notes (block comments).
 *
 * A lock freezes note mutation while leaving notes readable. It is expressed
 * per action - `create`, `reply`, `edit`, `resolve` and `delete` - so a site can
 * either freeze notes entirely or preserve them selectively, for example by
 * disallowing deletion while review continues.
 *
 * Two layers feed one predicate, `gutenberg_note_action_is_locked()`:
 *
 * 1. The `_wp_notes_locked` post meta locks every note action on that post.
 * 2. The `note_action_is_locked` filter refines the computed value, receiving
 *    the action name so sites can lock a single action, scope by post status,
 *    or carve out roles.
 *
 * Reading notes is never gated here; existing read permissions still apply.
 *
 * Enforcement hangs off `rest_request_before_callbacks` because the comments
 * controller has no short-circuit filter for updates or deletes. That single
 * choke point covers create, update and delete, runs before every permission
 * callback, and can only ever deny - it never grants access.
 *
 * @package gutenberg
 * @since   7.2.0
 */

/**
 * Returns the note actions a lock can apply to.
 *
 * Reopening a note is classified as `resolve`: it is the same state machine
 * running in the opposite direction.
 *
 * @since 7.2.0
 *
 * @return string[] The action names.
 */
function gutenberg_get_note_lock_actions() {
	return array( 'create', 'reply', 'edit', 'resolve', 'delete' );
}

/**
 * Determines whether a post type supports notes.
 *
 * Mirrors the private `check_post_type_supports_notes()` method on
 * `WP_REST_Comments_Controller`, which reads the `notes` flag out of the
 * `editor` support arguments.
 *
 * @since 7.2.0
 *
 * @param string $post_type Post type name.
 * @return bool Whether the post type supports notes.
 */
function gutenberg_post_type_supports_notes( $post_type ) {
	$supports = get_all_post_type_supports( $post_type );

	if ( ! isset( $supports['editor'] ) || ! is_array( $supports['editor'] ) ) {
		return false;
	}

	foreach ( $supports['editor'] as $args ) {
		if ( is_array( $args ) && ! empty( $args['notes'] ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Determines whether a note action is locked for a post.
 *
 * @since 7.2.0
 *
 * @param string          $action  One of 'create', 'reply', 'edit', 'resolve', 'delete'.
 * @param int|WP_Post     $post    The post the note belongs to.
 * @param WP_Comment|null $comment The existing note, when mutating one. Null on create.
 * @return bool Whether the action is locked.
 */
function gutenberg_note_action_is_locked( $action, $post, $comment = null ) {
	$post = get_post( $post );

	if ( ! $post instanceof WP_Post ) {
		return false;
	}

	$locked = (bool) get_post_meta( $post->ID, '_wp_notes_locked', true );

	/**
	 * Filters whether a note action is locked.
	 *
	 * Locking freezes note mutation but never affects reading notes. Returning
	 * true blocks the action for every user, including administrators, unless
	 * the filter itself carves out an exception.
	 *
	 * @since 7.2.0
	 *
	 * @param bool            $locked  Whether the action is locked. Defaults to the post's `_wp_notes_locked` meta.
	 * @param string          $action  One of 'create', 'reply', 'edit', 'resolve', 'delete'.
	 * @param WP_Post         $post    The post the note belongs to.
	 * @param WP_Comment|null $comment The note being mutated, when there is one. Null on create.
	 */
	return (bool) apply_filters( 'note_action_is_locked', $locked, $action, $post, $comment );
}

/**
 * Registers the `_wp_notes_locked` post meta on every post type that supports notes.
 *
 * Runs late on `init` so post types registered at the default priority are
 * already in place.
 *
 * @since 7.2.0
 */
function gutenberg_register_notes_lock_meta() {
	foreach ( get_post_types_by_support( 'editor' ) as $post_type ) {
		if ( ! gutenberg_post_type_supports_notes( $post_type ) ) {
			continue;
		}

		register_post_meta(
			$post_type,
			'_wp_notes_locked',
			array(
				'type'              => 'boolean',
				'description'       => __( 'Whether notes are locked for this post.', 'gutenberg' ),
				'single'            => true,
				'default'           => false,
				'show_in_rest'      => true,
				'sanitize_callback' => 'rest_sanitize_boolean',
				/*
				 * Locking is an editorial decision, so it takes more than being
				 * the post's author: an author locking reviewers out of their own
				 * review thread would defeat the point.
				 */
				'auth_callback'     => static function ( $allowed, $meta_key, $post_id ) {
					return current_user_can( 'edit_others_posts' ) && current_user_can( 'edit_post', $post_id );
				},
			)
		);
	}
}

/**
 * Normalizes a comment approval value to the status the REST API exposes.
 *
 * @since 7.2.0
 *
 * @param string $status Raw `comment_approved` value or REST status.
 * @return string One of 'approved', 'hold', 'spam', 'trash'.
 */
function gutenberg_normalize_note_comment_status( $status ) {
	switch ( (string) $status ) {
		case 'trash':
		case 'spam':
			return (string) $status;
		case '1':
		case 'approve':
		case 'approved':
			return 'approved';
		default:
			return 'hold';
	}
}

/**
 * Works out which note actions a REST request performs.
 *
 * Returns an empty array when the request does not mutate a note, so callers
 * can bail without touching the lock predicate.
 *
 * @since 7.2.0
 *
 * @param WP_REST_Request $request The request.
 * @param WP_Comment|null $comment The targeted note, for item routes. Null on create.
 * @return string[] The actions the request performs.
 */
function gutenberg_get_note_request_actions( $request, $comment ) {
	if ( 'DELETE' === $request->get_method() ) {
		return array( 'delete' );
	}

	// Creating a note: a resolution marker, a reply, or a new thread.
	if ( ! $comment instanceof WP_Comment ) {
		$meta = $request['meta'];

		if ( is_array( $meta ) && isset( $meta['_wp_note_status'] ) ) {
			return array( 'resolve' );
		}

		return empty( $request['parent'] ) ? array( 'create' ) : array( 'reply' );
	}

	$actions = array();

	if ( null !== $request['content'] ) {
		$actions[] = 'edit';
	}

	/*
	 * A status change is the resolve/reopen toggle rather than an edit. Only a
	 * change counts: re-sending the status the note already has mutates nothing.
	 */
	if (
		null !== $request['status'] &&
		gutenberg_normalize_note_comment_status( $request['status'] ) !== gutenberg_normalize_note_comment_status( $comment->comment_approved )
	) {
		$actions[] = 'resolve';
	}

	// Any other field on the note (author, date, meta) counts as an edit.
	return empty( $actions ) ? array( 'edit' ) : $actions;
}

/**
 * Rejects note mutations that a lock forbids.
 *
 * Hooked to `rest_request_before_callbacks`, which runs for every route before
 * its permission callback. Unrelated routes exit on the `instanceof` and method
 * checks, before any query runs.
 *
 * @since 7.2.0
 *
 * @param WP_REST_Response|WP_HTTP_Response|WP_Error|mixed $response Result to send to the client.
 * @param array                                           $handler  Route handler used for the request.
 * @param WP_REST_Request                                 $request  Request used to generate the response.
 * @return WP_REST_Response|WP_HTTP_Response|WP_Error|mixed The response, or a `WP_Error` when the action is locked.
 */
function gutenberg_reject_locked_note_mutations( $response, $handler, $request ) {
	// Something upstream already resolved the request.
	if ( null !== $response ) {
		return $response;
	}

	if (
		! isset( $handler['callback'] ) ||
		! is_array( $handler['callback'] ) ||
		! ( $handler['callback'][0] instanceof WP_REST_Comments_Controller )
	) {
		return $response;
	}

	if ( ! in_array( $request->get_method(), array( 'POST', 'PUT', 'PATCH', 'DELETE' ), true ) ) {
		return $response;
	}

	$comment = null;

	if ( ! empty( $request['id'] ) ) {
		// Item route: the note itself names the post.
		$comment = get_comment( (int) $request['id'] );

		if ( ! $comment instanceof WP_Comment || 'note' !== $comment->comment_type ) {
			return $response;
		}

		$post_id = (int) $comment->comment_post_ID;
	} else {
		// Collection route: only note creation is in scope.
		if ( 'note' !== $request['type'] ) {
			return $response;
		}

		$post_id = (int) $request['post'];
	}

	$post = get_post( $post_id );

	if ( ! $post instanceof WP_Post ) {
		// Let the controller produce its own error for a missing post.
		return $response;
	}

	foreach ( gutenberg_get_note_request_actions( $request, $comment ) as $action ) {
		if ( gutenberg_note_action_is_locked( $action, $post, $comment ) ) {
			return new WP_Error(
				'rest_notes_locked',
				__( 'Notes are locked for this post.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}
	}

	return $response;
}

/**
 * Exposes the locked note actions for the edited post to the editor.
 *
 * The editor uses this to hide affordances it knows the server will reject.
 * It is a courtesy only: enforcement lives in the REST layer.
 *
 * @since 7.2.0
 *
 * @param array                   $settings       Default editor settings.
 * @param WP_Block_Editor_Context $editor_context The current block editor context.
 * @return array Filtered editor settings.
 */
function gutenberg_add_notes_lock_editor_settings( $settings, $editor_context ) {
	if ( empty( $editor_context->post ) ) {
		return $settings;
	}

	$locked = array();

	foreach ( gutenberg_get_note_lock_actions() as $action ) {
		if ( gutenberg_note_action_is_locked( $action, $editor_context->post ) ) {
			$locked[] = $action;
		}
	}

	$settings['lockedNoteActions'] = $locked;

	return $settings;
}

/*
 * When WordPress itself carries note locking, defer to it.
 */
if ( ! function_exists( 'wp_note_action_is_locked' ) ) {
	add_action( 'init', 'gutenberg_register_notes_lock_meta', 20 );
	add_filter( 'rest_request_before_callbacks', 'gutenberg_reject_locked_note_mutations', 10, 3 );
	add_filter( 'block_editor_settings_all', 'gutenberg_add_notes_lock_editor_settings', 10, 2 );
}
