<?php
/**
 * Mention and follower notifications for notes (block comments).
 *
 * Note content can carry `@` mentions, stored as
 * `<a class="wp-note-mention" data-user-id="…">@Name</a>` (see
 * notes-rich-text.php). When a note is created through the REST API this file
 * parses those mentions out of the saved content and emails the mentioned
 * users, in addition to maintaining a per-thread "followers" list so that
 * people who start, reply to, or are mentioned in a thread are notified of
 * later activity on it.
 *
 * WordPress core already notifies the post author of every note via
 * `wp_new_comment_via_rest_notify_postauthor()` on `rest_insert_comment`. This
 * file adds the mention/follower audience on the same hook and deliberately
 * leaves the post author to core to avoid sending them a duplicate email.
 *
 * @package gutenberg
 * @since   7.1.0
 */

if ( ! function_exists( 'gutenberg_get_note_mentioned_user_ids' ) ) {
	/**
	 * Extracts the mentioned user IDs from note content.
	 *
	 * Mentions are stored as links carrying a `data-user-id` attribute and the
	 * `wp-note-mention` class. Only anchors that carry both are treated as
	 * mentions so that ordinary links cannot be used to address notifications.
	 *
	 * @param string $content Note (comment) content, as stored.
	 * @return int[] Unique, positive mentioned user IDs, in first-seen order.
	 */
	function gutenberg_get_note_mentioned_user_ids( $content ) {
		if ( ! is_string( $content ) || '' === $content ) {
			return array();
		}

		$user_ids  = array();
		$processor = new WP_HTML_Tag_Processor( $content );
		while ( $processor->next_tag( 'A' ) ) {
			$class = $processor->get_attribute( 'class' );
			if ( ! is_string( $class ) || ! in_array( 'wp-note-mention', preg_split( '/\s+/', trim( $class ) ), true ) ) {
				continue;
			}

			$user_id = (int) $processor->get_attribute( 'data-user-id' );
			if ( $user_id > 0 && ! in_array( $user_id, $user_ids, true ) ) {
				$user_ids[] = $user_id;
			}
		}

		return $user_ids;
	}
}

if ( ! function_exists( 'gutenberg_get_note_thread_root_id' ) ) {
	/**
	 * Returns the ID of the top-level note that anchors a thread.
	 *
	 * Notes are a single level deep: a top-level note (`comment_parent` of 0)
	 * with replies hanging directly off it. Followers are tracked on the
	 * top-level note so a single list covers the whole thread.
	 *
	 * @param WP_Comment $comment A note comment.
	 * @return int The top-level note ID for the thread.
	 */
	function gutenberg_get_note_thread_root_id( $comment ) {
		$parent = (int) $comment->comment_parent;
		return $parent > 0 ? $parent : (int) $comment->comment_ID;
	}
}

if ( ! function_exists( 'gutenberg_get_note_followers' ) ) {
	/**
	 * Returns the user IDs following a note thread.
	 *
	 * @param int $root_id Top-level note ID.
	 * @return int[] Follower user IDs.
	 */
	function gutenberg_get_note_followers( $root_id ) {
		$followers = get_comment_meta( $root_id, '_wp_note_followers', true );
		if ( ! is_array( $followers ) ) {
			return array();
		}

		return array_values( array_unique( array_map( 'intval', $followers ) ) );
	}
}

if ( ! function_exists( 'gutenberg_add_note_followers' ) ) {
	/**
	 * Adds user IDs to a note thread's follower list.
	 *
	 * @param int   $root_id  Top-level note ID.
	 * @param int[] $user_ids User IDs to subscribe to the thread.
	 * @return int[] The updated follower list.
	 */
	function gutenberg_add_note_followers( $root_id, $user_ids ) {
		$followers = gutenberg_get_note_followers( $root_id );
		$updated   = $followers;

		foreach ( $user_ids as $user_id ) {
			$user_id = (int) $user_id;
			if ( $user_id > 0 && ! in_array( $user_id, $updated, true ) ) {
				$updated[] = $user_id;
			}
		}

		if ( $updated !== $followers ) {
			update_comment_meta( $root_id, '_wp_note_followers', $updated );
		}

		return $updated;
	}
}

if ( ! function_exists( 'gutenberg_notify_note_mentions' ) ) {
	/**
	 * Notifies mentioned users and thread followers about a new note.
	 *
	 * Runs on `rest_insert_comment` alongside core's post-author notification.
	 * The recipient set is the union of users mentioned in this note and the
	 * existing followers of its thread, minus the note's own author (you are
	 * not notified about your own note) and the post author (core already
	 * notifies them). Mentioned users and the note author are then subscribed
	 * to the thread so they receive notifications about later replies.
	 *
	 * Only fires when a note is created, not when an existing one is edited,
	 * so correcting a note does not re-notify everyone who already received it.
	 *
	 * @param WP_Comment $comment  The note that was just inserted.
	 * @param mixed      $request  The REST request (unused).
	 * @param bool       $creating Whether this is a create (true) or update (false).
	 * @return void
	 */
	function gutenberg_notify_note_mentions( $comment, $request = null, $creating = true ) {
		unset( $request );

		if ( ! $creating ) {
			return;
		}

		if ( ! $comment instanceof WP_Comment || 'note' !== $comment->comment_type ) {
			return;
		}

		// Share the single user-facing notes notification preference with core.
		if ( ! get_option( 'wp_notes_notify', 1 ) ) {
			return;
		}

		$root_id   = gutenberg_get_note_thread_root_id( $comment );
		$mentioned = gutenberg_get_note_mentioned_user_ids( $comment->comment_content );
		$followers = gutenberg_get_note_followers( $root_id );

		$author_id      = (int) $comment->user_id;
		$post           = get_post( (int) $comment->comment_post_ID );
		$post_author_id = $post ? (int) $post->post_author : 0;

		// Build the recipient set: mentions + current followers.
		$recipient_ids = array_values( array_unique( array_merge( $mentioned, $followers ) ) );

		/**
		 * Filters the user IDs notified about a new note.
		 *
		 * Receives the union of users mentioned in the note and the thread's
		 * existing followers. Developers can add or remove recipients, for
		 * example to integrate a different audience or notification channel.
		 *
		 * @since 7.1.0
		 *
		 * @param int[]      $recipient_ids Candidate recipient user IDs.
		 * @param WP_Comment $comment       The note that was inserted.
		 * @param int        $root_id       The thread's top-level note ID.
		 */
		$recipient_ids = apply_filters( 'gutenberg_note_notification_recipients', $recipient_ids, $comment, $root_id );

		$mentioned_lookup = array_flip( $mentioned );

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

			// Only notify users who can actually read the note's post.
			if ( $post && ! user_can( $user_id, 'read_post', $post->ID ) ) {
				continue;
			}

			$was_mentioned = isset( $mentioned_lookup[ $user_id ] );
			gutenberg_send_note_notification( $user, $comment, $post, $was_mentioned );
		}

		// Subscribe the note author and everyone mentioned to the thread.
		$new_followers = $mentioned;
		if ( $author_id > 0 ) {
			$new_followers[] = $author_id;
		}
		gutenberg_add_note_followers( $root_id, $new_followers );
	}
	add_action( 'rest_insert_comment', 'gutenberg_notify_note_mentions', 10, 3 );
}

if ( ! function_exists( 'gutenberg_send_note_notification' ) ) {
	/**
	 * Sends a single note notification email.
	 *
	 * @param WP_User     $user          The recipient.
	 * @param WP_Comment  $comment       The note that triggered the notification.
	 * @param WP_Post|null $post         The post the note belongs to.
	 * @param bool        $was_mentioned Whether the recipient was mentioned in this note.
	 * @return void
	 */
	function gutenberg_send_note_notification( $user, $comment, $post, $was_mentioned ) {
		$blogname    = wp_specialchars_decode( get_option( 'blogname' ), ENT_QUOTES );
		$post_title  = $post ? wp_specialchars_decode( get_the_title( $post ), ENT_QUOTES ) : '';
		$author_name = $comment->comment_author ? $comment->comment_author : __( 'Someone', 'gutenberg' );
		$content     = wp_strip_all_tags( wp_specialchars_decode( $comment->comment_content ) );
		$edit_link   = $post ? get_edit_post_link( $post->ID, 'raw' ) : '';

		if ( $was_mentioned ) {
			/* translators: %1$s: commenter name, %2$s: post title. */
			$message = sprintf( __( '%1$s mentioned you in a note on "%2$s".', 'gutenberg' ), $author_name, $post_title );
			/* translators: %1$s: site name, %2$s: post title. */
			$subject = sprintf( __( '[%1$s] You were mentioned in a note on "%2$s"', 'gutenberg' ), $blogname, $post_title );
		} else {
			/* translators: %1$s: commenter name, %2$s: post title. */
			$message = sprintf( __( '%1$s added a note to a thread you follow on "%2$s".', 'gutenberg' ), $author_name, $post_title );
			/* translators: %1$s: site name, %2$s: post title. */
			$subject = sprintf( __( '[%1$s] New activity on a note you follow on "%2$s"', 'gutenberg' ), $blogname, $post_title );
		}

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
		 * @param string     $subject       Email subject.
		 * @param WP_User    $user          Recipient.
		 * @param WP_Comment $comment       The note.
		 * @param bool       $was_mentioned Whether the recipient was mentioned.
		 */
		$subject = apply_filters( 'gutenberg_note_notification_subject', $subject, $user, $comment, $was_mentioned );

		/**
		 * Filters the note notification email body.
		 *
		 * @since 7.1.0
		 *
		 * @param string     $body          Email body.
		 * @param WP_User    $user          Recipient.
		 * @param WP_Comment $comment       The note.
		 * @param bool       $was_mentioned Whether the recipient was mentioned.
		 */
		$body = apply_filters( 'gutenberg_note_notification_message', $body, $user, $comment, $was_mentioned );

		wp_mail( $user->user_email, wp_specialchars_decode( $subject ), $body );
	}
}
