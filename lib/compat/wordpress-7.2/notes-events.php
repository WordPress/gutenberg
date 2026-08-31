<?php
/**
 * Thread event notifications for notes (block comments).
 *
 * Resolving or reopening a note thread posts a child note carrying a
 * `_wp_note_status` meta value of `resolved` or `reopen` (see the `onEdit`
 * handler in packages/editor/src/components/collab-sidebar/hooks.js). Those
 * system notes record what happened to the thread rather than adding to the
 * conversation, and the resolve one has no content at all.
 *
 * Left alone they produce the wrong mail: followers hear that someone "added a
 * note" with an empty body, and core tells the post author a new note arrived.
 * This file notifies the same people about what actually happened, and silences
 * the two generic emails for the note that carries the event.
 *
 * @package gutenberg
 * @since   7.2.0
 */

/**
 * Keeps core's generic post-author email away from a thread event note.
 *
 * Core notifies the post author about every new note from
 * `wp_new_comment_via_rest_notify_postauthor()` at priority 10 on
 * `rest_insert_comment`. For a resolve or a reopen that email says a note was
 * added, which is both wrong and, for a resolve, empty. This runs earlier on
 * the same hook and switches core's email off for that one note through
 * `notify_post_author`, the filter core itself consults; the post author hears
 * about the event from gutenberg_notify_note_event() instead.
 *
 * The event has to be read from the request: the comments controller saves
 * meta after `rest_insert_comment` fires, so waiting for the meta row would
 * mean waiting until after core has already sent its email.
 *
 * @since 7.2.0
 *
 * @param WP_Comment|null $comment  The note that was just inserted.
 * @param mixed           $request  The REST request that created it.
 * @param bool            $creating Whether this is a create (true) or update (false).
 */
function gutenberg_suppress_core_note_event_notification( ?WP_Comment $comment, $request = null, bool $creating = true ): void {
	if ( ! $creating || ! $comment || 'note' !== $comment->comment_type ) {
		return;
	}

	if ( null === gutenberg_get_note_status_event( $comment, $request ) ) {
		return;
	}

	// Scoped to this note: the filter stays installed for the rest of the
	// request but only answers for the comment it was added for.
	$target_id = (int) $comment->comment_ID;
	add_filter(
		'notify_post_author',
		static function ( $maybe_notify, $comment_id ) use ( $target_id ) {
			return (int) $comment_id === $target_id ? false : $maybe_notify;
		},
		10,
		2
	);
}
add_action( 'rest_insert_comment', 'gutenberg_suppress_core_note_event_notification', 8, 3 );

/**
 * Notifies a thread's audience that it was resolved or reopened.
 *
 * The audience is the thread's followers plus the post author, minus whoever
 * performed the action and minus anyone the note mentions, who was just sent
 * the higher-signal mention email about the same insert.
 *
 * Hooked on `rest_after_insert_comment` rather than `rest_insert_comment`
 * because the comments controller saves comment meta between the two: by the
 * later hook `_wp_note_status` is in the database, so the event is recognized
 * no matter which client wrote the note.
 *
 * @since 7.2.0
 *
 * @param WP_Comment|null $comment  The note that was just inserted.
 * @param mixed           $request  The REST request that created it.
 * @param bool            $creating Whether this is a create (true) or update (false).
 */
function gutenberg_notify_note_event( ?WP_Comment $comment, $request = null, bool $creating = true ): void {
	if ( ! $creating || ! $comment || 'note' !== $comment->comment_type ) {
		return;
	}

	// Share the single user-facing notes notification preference with core.
	if ( ! get_option( 'wp_notes_notify', 1 ) ) {
		return;
	}

	$event = gutenberg_get_note_status_event( $comment, $request );
	if ( null === $event ) {
		return;
	}

	$root_id   = gutenberg_get_note_thread_root_id( $comment );
	$followers = gutenberg_get_note_followers( $root_id );

	// get_post() falls back to the global post when passed 0, which would compose the email about the wrong post.
	$comment_post_id = (int) $comment->comment_post_ID;
	$post            = $comment_post_id ? get_post( $comment_post_id ) : null;
	$post_author_id  = $post ? (int) $post->post_author : 0;

	$recipients = $followers;
	if ( $post_author_id > 0 ) {
		$recipients[] = $post_author_id;
	}
	$recipients = array_values( array_unique( $recipients, SORT_NUMERIC ) );

	/**
	 * Filters the user IDs notified that a note thread was resolved or reopened.
	 *
	 * @since 7.2.0
	 *
	 * @param int[]      $recipients Candidate user IDs: the thread's followers plus the post author.
	 * @param WP_Comment $comment    The system note recording the event.
	 * @param string     $event      The event: 'resolved' or 'reopen'.
	 * @param int        $root_id    The thread's top-level note ID.
	 */
	$recipients = apply_filters( 'wp_note_event_notification_recipients', $recipients, $comment, $event, $root_id );

	$actor_id = (int) $comment->user_id;

	/*
	 * A reopen message can mention people, and the mention path has already
	 * emailed them about this same note. One insert, one email.
	 */
	$mentioned = gutenberg_get_note_mentioned_user_ids( $comment->comment_content );
	$excluded  = array_merge( array( $actor_id ), $mentioned );

	$candidates = array();
	foreach ( $recipients as $user_id ) {
		$user_id = (int) $user_id;
		if ( $user_id > 0 && ! in_array( $user_id, $excluded, true ) ) {
			$candidates[] = $user_id;
		}
	}

	if ( array() === $candidates ) {
		return;
	}

	// One user query for the whole audience rather than one per recipient.
	cache_users( $candidates );

	/*
	 * The recipient set is bounded and small (one thread's followers), so
	 * emails are sent synchronously here. If notification volume ever warrants
	 * it, the right fix is to offload delivery to a background queue
	 * (wp_schedule_single_event() / Action Scheduler) rather than throttle
	 * within the request.
	 */
	foreach ( $candidates as $user_id ) {
		$user = get_userdata( $user_id );
		if ( ! $user || empty( $user->user_email ) ) {
			continue;
		}

		/*
		 * Same visibility bar as the mention and follower paths: notes are
		 * internal, so only users who can read the note are told about it.
		 */
		if ( ! user_can( $user_id, 'edit_comment', $comment->comment_ID ) ) {
			continue;
		}

		gutenberg_send_note_event_notification(
			$user,
			$comment,
			$post,
			$root_id,
			$event,
			in_array( $user_id, $followers, true )
		);
	}
}
add_action( 'rest_after_insert_comment', 'gutenberg_notify_note_event', 10, 3 );

/**
 * Sends a single thread event notification email.
 *
 * @since 7.2.0
 *
 * @param WP_User      $user         The recipient.
 * @param WP_Comment   $comment      The system note recording the event.
 * @param WP_Post|null $post         The post the thread belongs to.
 * @param int          $root_id      The thread's top-level note ID.
 * @param string       $event        The event: 'resolved' or 'reopen'.
 * @param bool         $is_follower  Whether the recipient follows the thread.
 * @return bool Whether the email was accepted for delivery by wp_mail().
 */
function gutenberg_send_note_event_notification( WP_User $user, WP_Comment $comment, ?WP_Post $post, int $root_id, string $event, bool $is_follower = true ): bool {
	$switched_locale = switch_to_user_locale( $user->ID );

	/*
	 * The site title and the post title are escaped on the way into the
	 * database, and note content is stored as HTML. Both are reversed once
	 * here for the plain text arena of emails, tags stripped before decoding
	 * so escaped text such as "&lt;code&gt;" survives as text.
	 */
	$blogname   = wp_specialchars_decode( get_option( 'blogname' ), ENT_QUOTES );
	$post_title = $post ? wp_specialchars_decode( get_the_title( $post ), ENT_QUOTES ) : '';
	$actor_name = $comment->comment_author ? $comment->comment_author : __( 'Someone', 'gutenberg' );

	// Resolving carries no message; reopening usually does.
	$content = wp_specialchars_decode( wp_strip_all_tags( $comment->comment_content ) );

	/*
	 * Composed for the recipient, like the rest of the message:
	 * get_edit_post_link() answers for whoever is current, which here is the
	 * user who resolved or reopened the thread.
	 */
	$edit_link = '';
	if ( $post ) {
		$previous_user_id = get_current_user_id();
		wp_set_current_user( $user->ID );
		$edit_link = (string) get_edit_post_link( $post->ID, 'url' );
		wp_set_current_user( $previous_user_id );
	}

	if ( 'resolved' === $event ) {
		/* translators: %1$s: name of the user who resolved the thread, %2$s: post title. */
		$message = sprintf( __( '%1$s resolved a note thread on "%2$s".', 'gutenberg' ), $actor_name, $post_title );
		/* translators: %1$s: site name, %2$s: post title. */
		$subject = sprintf( __( '[%1$s] A note thread on "%2$s" was resolved', 'gutenberg' ), $blogname, $post_title );
	} else {
		/* translators: %1$s: name of the user who reopened the thread, %2$s: post title. */
		$message = sprintf( __( '%1$s reopened a note thread on "%2$s".', 'gutenberg' ), $actor_name, $post_title );
		/* translators: %1$s: site name, %2$s: post title. */
		$subject = sprintf( __( '[%1$s] A note thread on "%2$s" was reopened', 'gutenberg' ), $blogname, $post_title );
	}

	$lines = array( $message, '' );
	if ( '' !== $content ) {
		$lines[] = $content;
		$lines[] = '';
	}
	if ( $edit_link ) {
		$lines[] = __( 'Edit This', 'gutenberg' ) . ': ' . $edit_link;
	}

	$body = implode( "\n", $lines );

	/*
	 * Only followers are offered the unfollow link. A post author who never
	 * joined the thread has no subscription to end, and core's own note
	 * emails to them answer to the site-wide setting instead.
	 */
	if ( $is_follower ) {
		$body .= "\n\n";
		$body .= __( 'You are subscribed to this note thread. To stop receiving notifications about it, follow this link:', 'gutenberg' );
		$body .= "\n" . gutenberg_get_note_unfollow_url( $root_id, (int) $user->ID );
	}

	/**
	 * Filters the thread event notification email subject.
	 *
	 * @since 7.2.0
	 *
	 * @param string     $subject Email subject.
	 * @param WP_User    $user    Recipient.
	 * @param WP_Comment $comment The system note recording the event.
	 * @param string     $event   The event: 'resolved' or 'reopen'.
	 */
	$subject = apply_filters( 'wp_note_event_notification_subject', $subject, $user, $comment, $event );

	/**
	 * Filters the thread event notification email body.
	 *
	 * @since 7.2.0
	 *
	 * @param string     $body    Email body.
	 * @param WP_User    $user    Recipient.
	 * @param WP_Comment $comment The system note recording the event.
	 * @param string     $event   The event: 'resolved' or 'reopen'.
	 */
	$body = apply_filters( 'wp_note_event_notification_text', $body, $user, $comment, $event );

	// Declared explicitly so a filtered default cannot turn the message into HTML.
	$headers = 'Content-Type: text/plain; charset="' . get_option( 'blog_charset' ) . '"';

	$sent = wp_mail( $user->user_email, $subject, $body, $headers );

	if ( $switched_locale ) {
		restore_previous_locale();
	}

	/** This action is documented in lib/compat/wordpress-7.1/notes-mentions.php */
	do_action( 'wp_note_notification_sent', (int) $user->ID, $comment, $event, $sent );

	return $sent;
}
