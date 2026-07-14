<?php
/**
 * Mention notifications for notes (block comments).
 *
 * Note content can carry `@` mentions, stored as author-page links of the form
 * `<a class="wp-note-mention user-N" href="…">@Name</a>` where `N` is the
 * mentioned user's ID (the markup contract lives in
 * packages/editor/src/components/collab-sidebar/note-mention-completer.tsx,
 * and kses allowance for the classes in
 * lib/compat/wordpress-7.1/block-comments.php). When a note is created through
 * the REST API this file parses those mentions out of the saved content and
 * emails the mentioned users.
 *
 * WordPress core already notifies the post author of every note via
 * `wp_new_comment_via_rest_notify_postauthor()` on `rest_insert_comment`. This
 * file adds the mentioned-user audience on the same hook and deliberately
 * leaves the post author to core to avoid sending them a duplicate email.
 *
 * A per-thread "followers" model (subscribing note authors and mentioned users
 * to later activity on a thread) is planned as a follow-up on top of this.
 *
 * @package gutenberg
 * @since   7.1.0
 */

if ( ! function_exists( 'gutenberg_get_note_mentioned_user_ids' ) ) {
	/**
	 * Extracts the mentioned user IDs from note content.
	 *
	 * Mentions are stored as links carrying the `wp-note-mention` class plus a
	 * `user-N` class token holding the mentioned user's ID. Only anchors that
	 * carry both are treated as mentions so that ordinary links cannot be used
	 * to address notifications.
	 *
	 * @param string $content Note (comment) content, as stored.
	 * @return list<int> Unique, positive mentioned user IDs.
	 * @phpstan-return list<positive-int>
	 */
	function gutenberg_get_note_mentioned_user_ids( string $content ): array {
		if ( ! str_contains( $content, '<a' ) ) {
			return array();
		}

		$user_ids  = array();
		$processor = new WP_HTML_Tag_Processor( $content );
		while (
			$processor->next_tag(
				array(
					'tag_name'   => 'A',
					'class_name' => 'wp-note-mention',
				)
			)
		) {
			foreach ( $processor->class_list() as $class_name ) {
				if ( 1 === preg_match( '/^user-([1-9][0-9]*)$/', $class_name, $matches ) ) {
					$user_ids[] = (int) $matches[1];
					break;
				}
			}
		}

		return array_values( array_unique( $user_ids, SORT_NUMERIC ) );
	}
}

if ( ! function_exists( 'gutenberg_get_note_thread_root_id' ) ) {
	/**
	 * Returns the ID of the top-level note that anchors a thread.
	 *
	 * Notes are a single level deep: a top-level note (`comment_parent` of 0)
	 * with replies hanging directly off it. The editor keys threads by their
	 * top-level note, so deep links into a thread use the root ID.
	 *
	 * @param WP_Comment $comment A note comment.
	 * @return int The top-level note ID for the thread.
	 */
	function gutenberg_get_note_thread_root_id( WP_Comment $comment ): int {
		$parent = (int) $comment->comment_parent;
		return $parent > 0 ? $parent : (int) $comment->comment_ID;
	}
}

if ( ! function_exists( 'gutenberg_notify_note_mentions' ) ) {
	/**
	 * Notifies mentioned users about a new note.
	 *
	 * Runs on `rest_insert_comment` alongside core's post-author notification.
	 * The recipient set is the users mentioned in this note, minus the note's
	 * own author (you are not notified about your own note) and the post
	 * author (core already notifies them about every note).
	 *
	 * Only fires when a note is created, not when an existing one is edited,
	 * so correcting a note does not re-notify everyone who already received it.
	 *
	 * @param WP_Comment $comment  The note that was just inserted.
	 * @param mixed      $request  The REST request (unused).
	 * @param bool       $creating Whether this is a create (true) or update (false).
	 */
	function gutenberg_notify_note_mentions( WP_Comment $comment, $request = null, bool $creating = true ): void {
		unset( $request );

		if ( ! $creating ) {
			return;
		}

		if ( 'note' !== $comment->comment_type ) {
			return;
		}

		// Share the single user-facing notes notification preference with core.
		if ( ! get_option( 'wp_notes_notify', 1 ) ) {
			return;
		}

		$mentioned = gutenberg_get_note_mentioned_user_ids( $comment->comment_content );

		$author_id      = (int) $comment->user_id;
		$post           = get_post( (int) $comment->comment_post_ID );
		$post_author_id = $post ? (int) $post->post_author : 0;

		/**
		 * Filters the user IDs notified about a new note.
		 *
		 * Receives the users mentioned in the note. Developers can add or
		 * remove recipients, for example to integrate a different audience or
		 * notification channel.
		 *
		 * @since 7.1.0
		 *
		 * @param int[]      $recipient_ids Candidate recipient user IDs.
		 * @param WP_Comment $comment       The note that was inserted.
		 */
		$recipient_ids = apply_filters( 'wp_note_notification_recipients', $mentioned, $comment );

		/*
		 * The recipient set is bounded and small (one note's mentions), so
		 * emails are sent synchronously here. If notification volume ever
		 * warrants it, the right fix is to offload delivery to a background
		 * queue (wp_schedule_single_event() / Action Scheduler) rather than
		 * throttle within the request.
		 */
		foreach ( $recipient_ids as $user_id ) {
			$user_id = (int) $user_id;

			// Never notify the author about their own note.
			if ( $user_id === $author_id ) {
				continue;
			}

			// Core already notifies the post author of every note.
			if ( $user_id === $post_author_id ) {
				continue;
			}

			$user = get_userdata( $user_id );
			if ( ! $user || empty( $user->user_email ) ) {
				continue;
			}

			/*
			 * Only notify users who can actually read the note. Notes are
			 * internal: core's WP_REST_Comments_Controller::check_read_permission()
			 * only exposes a note to its author or to users who can edit it, so
			 * the email audience is held to the same bar. A plain read_post
			 * check would leak note content to e.g. subscribers on a public
			 * post, who cannot see the note in the editor.
			 */
			if ( ! user_can( $user_id, 'edit_comment', $comment->comment_ID ) ) {
				continue;
			}

			gutenberg_send_note_notification( $user, $comment, $post );
		}
	}
	add_action( 'rest_insert_comment', 'gutenberg_notify_note_mentions', 10, 3 );
}

if ( ! function_exists( 'gutenberg_get_note_notification_link' ) ) {
	/**
	 * Builds the editor deep link for a note notification email.
	 *
	 * Links to the block editor for the note's post with a `note` query arg
	 * carrying the thread's top-level note ID; the editor opens and focuses
	 * that thread on load. The URL is built directly from `admin_url()` rather
	 * than `get_edit_post_link()` because the latter depends on the *current*
	 * user's capabilities, which breaks once sending moves off the request
	 * (e.g. to cron) and is irrelevant to the recipient anyway.
	 *
	 * @param WP_Post    $post    The post the note belongs to.
	 * @param WP_Comment $comment The note.
	 * @return string The editor URL focused on the note's thread.
	 */
	function gutenberg_get_note_notification_link( WP_Post $post, WP_Comment $comment ): string {
		return add_query_arg(
			array(
				'post'   => $post->ID,
				'action' => 'edit',
				'note'   => gutenberg_get_note_thread_root_id( $comment ),
			),
			admin_url( 'post.php' )
		);
	}
}

if ( ! function_exists( 'gutenberg_send_note_notification' ) ) {
	/**
	 * Sends a single note mention notification email.
	 *
	 * The email is composed in the recipient's locale, matching how core
	 * composes other user-directed notifications.
	 *
	 * @param WP_User      $user    The recipient.
	 * @param WP_Comment   $comment The note that triggered the notification.
	 * @param WP_Post|null $post    The post the note belongs to.
	 * @return bool Whether the email was accepted for delivery by wp_mail().
	 */
	function gutenberg_send_note_notification( WP_User $user, WP_Comment $comment, ?WP_Post $post ): bool {
		$switched_locale = switch_to_user_locale( $user->ID );

		$blogname    = wp_specialchars_decode( get_option( 'blogname' ), ENT_QUOTES );
		$post_title  = $post ? wp_specialchars_decode( get_the_title( $post ), ENT_QUOTES ) : '';
		$author_name = $comment->comment_author ? $comment->comment_author : __( 'Someone', 'gutenberg' );
		$content     = wp_strip_all_tags( wp_specialchars_decode( $comment->comment_content ) );
		$edit_link   = $post ? gutenberg_get_note_notification_link( $post, $comment ) : '';

		/* translators: %1$s: commenter name, %2$s: post title. */
		$message = sprintf( __( '%1$s mentioned you in a note on "%2$s".', 'gutenberg' ), $author_name, $post_title );
		/* translators: %1$s: site name, %2$s: post title. */
		$subject = sprintf( __( '[%1$s] You were mentioned in a note on "%2$s"', 'gutenberg' ), $blogname, $post_title );

		$lines = array( $message, '' );
		if ( '' !== $content ) {
			$lines[] = $content;
			$lines[] = '';
		}
		if ( $edit_link ) {
			$lines[] = $edit_link;
		}

		$body = implode( "\n", $lines );

		/**
		 * Filters the note notification email subject.
		 *
		 * @since 7.1.0
		 *
		 * @param string     $subject Email subject.
		 * @param WP_User    $user    Recipient.
		 * @param WP_Comment $comment The note.
		 */
		$subject = apply_filters( 'wp_note_notification_subject', $subject, $user, $comment );

		/**
		 * Filters the note notification email body.
		 *
		 * @since 7.1.0
		 *
		 * @param string     $body    Email body.
		 * @param WP_User    $user    Recipient.
		 * @param WP_Comment $comment The note.
		 */
		$body = apply_filters( 'wp_note_notification_text', $body, $user, $comment );

		$sent = wp_mail( $user->user_email, wp_specialchars_decode( $subject ), $body );

		if ( $switched_locale ) {
			restore_previous_locale();
		}

		return $sent;
	}
}
