<?php
/**
 * Per-thread follower subscriptions and notifications for notes.
 *
 * Builds on the mention notifications in notes-mentions.php: people who
 * participate in a note thread (starting it, replying to it, or being
 * mentioned in it) are subscribed as "followers" of the thread and emailed
 * about later replies, even when those replies don't mention them.
 *
 * Subscription bookkeeping is deliberately separate from notification
 * sending: follower records are maintained even while the `wp_notes_notify`
 * option is off, so enabling notifications later works for existing threads.
 * Every notification email carries a tokenized unfollow link, handled via
 * admin-post.php, so recipients can opt out of a thread without a UI.
 *
 * @package gutenberg
 * @since   7.1.0
 */

if ( ! function_exists( 'gutenberg_get_note_followers' ) ) {
	/**
	 * Returns the user IDs following a note thread.
	 *
	 * Followers are stored as one meta row per user so that concurrent
	 * replies can subscribe users independently, without the lost updates a
	 * read-modify-write of a single array value would allow.
	 *
	 * @param int $root_id Top-level note ID.
	 * @return list<int> Follower user IDs.
	 * @phpstan-param int|numeric-string $root_id
	 * @phpstan-return list<positive-int>
	 */
	function gutenberg_get_note_followers( $root_id ): array {
		$root_id   = (int) $root_id;
		$followers = get_comment_meta( $root_id, '_wp_note_followers' );
		if ( ! is_array( $followers ) ) {
			return array();
		}

		$followers = array_filter(
			array_map(
				fn ( $user_id ) => (int) $user_id,
				$followers
			),
			fn ( $user_id ) => $user_id > 0,
		);

		return array_values( array_unique( $followers, SORT_NUMERIC ) );
	}
}

if ( ! function_exists( 'gutenberg_add_note_followers' ) ) {
	/**
	 * Adds user IDs to a note thread's follower list.
	 *
	 * @param int   $root_id  Top-level note ID.
	 * @param int[] $user_ids User IDs to subscribe to the thread.
	 * @return list<int> The updated follower list.
	 * @phpstan-param int|numeric-string $root_id
	 * @phpstan-param array<int|numeric-string> $user_ids
	 * @phpstan-return list<positive-int>
	 */
	function gutenberg_add_note_followers( $root_id, array $user_ids ): array {
		$root_id   = (int) $root_id;
		$followers = gutenberg_get_note_followers( $root_id );

		foreach ( $user_ids as $user_id ) {
			$user_id = (int) $user_id;
			if ( $user_id > 0 && ! in_array( $user_id, $followers, true ) ) {
				add_comment_meta( $root_id, '_wp_note_followers', $user_id );
				$followers[] = $user_id;
			}
		}

		return $followers;
	}
}

if ( ! function_exists( 'gutenberg_remove_note_followers' ) ) {
	/**
	 * Removes user IDs from a note thread's follower list.
	 *
	 * Lets a user unfollow a thread. The follower meta is removed with the
	 * rest of the thread's comment meta when the thread is permanently
	 * deleted, so this only needs to handle explicit unsubscribes.
	 *
	 * @param int|numeric-string        $root_id  Top-level note ID.
	 * @param array<int|numeric-string> $user_ids User IDs to unsubscribe from the thread.
	 * @return list<int> The updated follower list.
	 * @phpstan-return list<positive-int>
	 */
	function gutenberg_remove_note_followers( $root_id, array $user_ids ): array {
		$root_id = (int) $root_id;
		foreach ( $user_ids as $user_id ) {
			$user_id = (int) $user_id;
			if ( $user_id > 0 ) {
				delete_comment_meta( $root_id, '_wp_note_followers', $user_id );
			}
		}

		return gutenberg_get_note_followers( $root_id );
	}
}

if ( ! function_exists( 'gutenberg_register_note_followers_meta' ) ) {
	/**
	 * Registers the note followers meta so it is available through the REST API.
	 *
	 * The list is readable wherever the note itself is readable (core's
	 * comments controller exposes a note to its author and to users who can
	 * edit it) and editable by users who can edit the note.
	 *
	 * Note that writing the registered meta through the REST API replaces the
	 * whole list, which reintroduces the read-modify-write race the per-row
	 * storage exists to avoid. Interfaces managing a single user's
	 * subscription should use gutenberg_add_note_followers() /
	 * gutenberg_remove_note_followers() (or the tokenized unfollow endpoint)
	 * rather than writing the full list.
	 */
	function gutenberg_register_note_followers_meta(): void {
		register_meta(
			'comment',
			'_wp_note_followers',
			array(
				'type'          => 'integer',
				'description'   => __( 'User IDs following the note thread.', 'gutenberg' ),
				'single'        => false,
				'show_in_rest'  => array(
					'schema' => array(
						'type'    => 'integer',
						'minimum' => 1,
					),
				),
				'auth_callback' => static fn ( $allowed, $meta_key, $object_id ) => current_user_can( 'edit_comment', $object_id ),
			)
		);
	}
	add_action( 'init', 'gutenberg_register_note_followers_meta' );
}

if ( ! function_exists( 'gutenberg_get_note_unfollow_token' ) ) {
	/**
	 * Builds the token authorizing an email unfollow link.
	 *
	 * The token is an HMAC of the thread and user (keyed with the site's auth
	 * salts via wp_hash()), so it cannot be guessed but does not expire the
	 * way a nonce would; unsubscribe links in old emails keep working.
	 *
	 * @param int $root_id Top-level note ID.
	 * @param int $user_id Follower user ID.
	 * @return string The unfollow token.
	 */
	function gutenberg_get_note_unfollow_token( int $root_id, int $user_id ): string {
		return wp_hash( "wp_note_unfollow|{$root_id}|{$user_id}", 'auth' );
	}
}

if ( ! function_exists( 'gutenberg_get_note_unfollow_url' ) ) {
	/**
	 * Builds the unfollow URL included in note notification emails.
	 *
	 * @param int $root_id Top-level note ID.
	 * @param int $user_id Follower user ID.
	 * @return string The unfollow URL.
	 */
	function gutenberg_get_note_unfollow_url( int $root_id, int $user_id ): string {
		return add_query_arg(
			array(
				'action'  => 'wp_note_unfollow',
				'comment' => $root_id,
				'uid'     => $user_id,
				'token'   => gutenberg_get_note_unfollow_token( $root_id, $user_id ),
			),
			admin_url( 'admin-post.php' )
		);
	}
}

if ( ! function_exists( 'gutenberg_handle_note_unfollow' ) ) {
	/**
	 * Handles the tokenized unfollow link from notification emails.
	 *
	 * Registered for both `admin_post_wp_note_unfollow` and its `nopriv`
	 * variant: like a standard email unsubscribe, following the link works
	 * without logging in because the token itself proves the request came
	 * from the notification email.
	 */
	function gutenberg_handle_note_unfollow(): void {
		$root_id = isset( $_GET['comment'] ) ? (int) $_GET['comment'] : 0;
		$user_id = isset( $_GET['uid'] ) ? (int) $_GET['uid'] : 0;
		$token   = isset( $_GET['token'] ) ? (string) wp_unslash( $_GET['token'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Compared with hash_equals() only.

		if (
			$root_id <= 0 ||
			$user_id <= 0 ||
			'' === $token ||
			! hash_equals( gutenberg_get_note_unfollow_token( $root_id, $user_id ), $token )
		) {
			wp_die(
				esc_html__( 'This unfollow link is not valid.', 'gutenberg' ),
				esc_html__( 'Unfollow note thread', 'gutenberg' ),
				array( 'response' => 403 )
			);
		}

		gutenberg_remove_note_followers( $root_id, array( $user_id ) );

		wp_die(
			esc_html__( 'You will no longer be notified about new activity on this note thread.', 'gutenberg' ),
			esc_html__( 'Unfollow note thread', 'gutenberg' ),
			array( 'response' => 200 )
		);
	}
	add_action( 'admin_post_wp_note_unfollow', 'gutenberg_handle_note_unfollow' );
	add_action( 'admin_post_nopriv_wp_note_unfollow', 'gutenberg_handle_note_unfollow' );
}

if ( ! function_exists( 'gutenberg_add_note_unfollow_link_to_email' ) ) {
	/**
	 * Appends the unfollow link to mention notification emails.
	 *
	 * Mentioned users are auto-subscribed to the thread (see
	 * gutenberg_maintain_note_followers()), so their mention email must carry
	 * the opt-out for the subscription it implies. Hooked on the
	 * `wp_note_notification_text` filter from notes-mentions.php.
	 *
	 * @param string     $body    Email body.
	 * @param WP_User    $user    Recipient.
	 * @param WP_Comment $comment The note.
	 * @return string Email body with the unfollow footer.
	 */
	function gutenberg_add_note_unfollow_link_to_email( string $body, WP_User $user, WP_Comment $comment ): string {
		$root_id = gutenberg_get_note_thread_root_id( $comment );

		$body .= "\n\n";
		$body .= __( 'You are subscribed to this note thread. To stop receiving notifications about it, follow this link:', 'gutenberg' );
		$body .= "\n" . gutenberg_get_note_unfollow_url( $root_id, (int) $user->ID );

		return $body;
	}
	add_filter( 'wp_note_notification_text', 'gutenberg_add_note_unfollow_link_to_email', 10, 3 );
}

if ( ! function_exists( 'gutenberg_route_post_author_mention_notification' ) ) {
	/**
	 * Sends the post author a mention email instead of core's generic one.
	 *
	 * Core notifies the post author about every new note with a generic "new
	 * note" email (`wp_new_comment_via_rest_notify_postauthor()`), which is
	 * why the mention path skips them. But when the post author is the one
	 * being mentioned, the generic email would swallow the higher-signal
	 * mention: this handler, hooked before core's, sends them the mention
	 * email and suppresses core's generic one for this comment via the same
	 * `notify_post_author` filter core consults.
	 *
	 * @param WP_Comment $comment  The note that was just inserted.
	 * @param mixed      $request  The REST request (unused).
	 * @param bool       $creating Whether this is a create (true) or update (false).
	 */
	function gutenberg_route_post_author_mention_notification( WP_Comment $comment, $request = null, bool $creating = true ): void {
		unset( $request );

		if ( ! $creating || 'note' !== $comment->comment_type ) {
			return;
		}

		if ( ! get_option( 'wp_notes_notify', 1 ) ) {
			return;
		}

		$post = get_post( (int) $comment->comment_post_ID );
		if ( ! $post ) {
			return;
		}

		$post_author_id = (int) $post->post_author;
		if (
			$post_author_id <= 0 ||
			$post_author_id === (int) $comment->user_id ||
			! in_array( $post_author_id, gutenberg_get_note_mentioned_user_ids( $comment->comment_content ), true )
		) {
			return;
		}

		$user = get_userdata( $post_author_id );
		if ( ! $user || empty( $user->user_email ) ) {
			return;
		}

		if ( ! user_can( $post_author_id, 'edit_comment', $comment->comment_ID ) ) {
			return;
		}

		gutenberg_send_note_notification( $user, $comment, $post );

		// Suppress core's generic post-author email for this note only; the
		// filter stays installed but is scoped to this comment ID.
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
	add_action( 'rest_insert_comment', 'gutenberg_route_post_author_mention_notification', 9, 3 );
}

if ( ! function_exists( 'gutenberg_notify_note_followers' ) ) {
	/**
	 * Notifies a thread's existing followers about a new note in it.
	 *
	 * Runs after the mention notifications: followers minus the users this
	 * note mentions (they just received the mention email), minus the note's
	 * own author, minus the post author when core is already emailing them
	 * about this note.
	 *
	 * @param WP_Comment $comment  The note that was just inserted.
	 * @param mixed      $request  The REST request (unused).
	 * @param bool       $creating Whether this is a create (true) or update (false).
	 */
	function gutenberg_notify_note_followers( WP_Comment $comment, $request = null, bool $creating = true ): void {
		unset( $request );

		if ( ! $creating || 'note' !== $comment->comment_type ) {
			return;
		}

		if ( ! get_option( 'wp_notes_notify', 1 ) ) {
			return;
		}

		$root_id   = gutenberg_get_note_thread_root_id( $comment );
		$followers = gutenberg_get_note_followers( $root_id );
		$mentioned = gutenberg_get_note_mentioned_user_ids( $comment->comment_content );

		$author_id      = (int) $comment->user_id;
		$post           = get_post( (int) $comment->comment_post_ID );
		$post_author_id = $post ? (int) $post->post_author : 0;

		/*
		 * Whether core is sending the post author its own email about this
		 * note; mirrors the option + filter checks in
		 * wp_new_comment_notify_postauthor() so suppressing one path cannot
		 * silently strand the other.
		 */
		/** This filter is documented in wp-includes/comment.php */
		$core_notifies_post_author = (bool) apply_filters(
			'notify_post_author',
			(bool) get_option( 'wp_notes_notify', 1 ),
			$comment->comment_ID
		);

		/**
		 * Filters the user IDs notified about a new note in a thread they follow.
		 *
		 * @since 7.1.0
		 *
		 * @param int[]      $follower_ids Candidate follower user IDs.
		 * @param WP_Comment $comment      The note that was inserted.
		 * @param int        $root_id      The thread's top-level note ID.
		 */
		$follower_ids = apply_filters( 'wp_note_follower_notification_recipients', $followers, $comment, $root_id );

		foreach ( $follower_ids as $user_id ) {
			$user_id = (int) $user_id;

			if ( $user_id === $author_id ) {
				continue;
			}

			// The mention email already covered them.
			if ( in_array( $user_id, $mentioned, true ) ) {
				continue;
			}

			if ( $user_id === $post_author_id && $core_notifies_post_author ) {
				continue;
			}

			$user = get_userdata( $user_id );
			if ( ! $user || empty( $user->user_email ) ) {
				continue;
			}

			// Same visibility bar as the mention path: never email note
			// content to a user who cannot read the note.
			if ( ! user_can( $user_id, 'edit_comment', $comment->comment_ID ) ) {
				continue;
			}

			gutenberg_send_note_follower_notification( $user, $comment, $post, $root_id );
		}
	}
	add_action( 'rest_insert_comment', 'gutenberg_notify_note_followers', 11, 3 );
}

if ( ! function_exists( 'gutenberg_notify_new_mentions_on_note_update' ) ) {
	/**
	 * Notifies users newly mentioned by an edit to an existing note.
	 *
	 * The create path deliberately never re-notifies on edits, but a mention
	 * *added* by an edit would otherwise be silently swallowed: the mentioner
	 * reasonably believes they pinged someone. Followers state makes "new"
	 * cheap to detect: anyone mentioned in the edited content who is not yet
	 * a follower has never been notified about this thread.
	 *
	 * @param WP_Comment $comment  The note that was just updated.
	 * @param mixed      $request  The REST request (unused).
	 * @param bool       $creating Whether this is a create (true) or update (false).
	 */
	function gutenberg_notify_new_mentions_on_note_update( WP_Comment $comment, $request = null, bool $creating = true ): void {
		unset( $request );

		if ( $creating || 'note' !== $comment->comment_type ) {
			return;
		}

		if ( ! get_option( 'wp_notes_notify', 1 ) ) {
			return;
		}

		$root_id       = gutenberg_get_note_thread_root_id( $comment );
		$followers     = gutenberg_get_note_followers( $root_id );
		$mentioned     = gutenberg_get_note_mentioned_user_ids( $comment->comment_content );
		$new_mentioned = array_values( array_diff( $mentioned, $followers ) );

		if ( array() === $new_mentioned ) {
			return;
		}

		$author_id = (int) $comment->user_id;
		$post      = get_post( (int) $comment->comment_post_ID );

		foreach ( $new_mentioned as $user_id ) {
			$user_id = (int) $user_id;

			if ( $user_id === $author_id ) {
				continue;
			}

			$user = get_userdata( $user_id );
			if ( ! $user || empty( $user->user_email ) ) {
				continue;
			}

			if ( ! user_can( $user_id, 'edit_comment', $comment->comment_ID ) ) {
				continue;
			}

			gutenberg_send_note_notification( $user, $comment, $post );
		}
	}
	add_action( 'rest_insert_comment', 'gutenberg_notify_new_mentions_on_note_update', 11, 3 );
}

if ( ! function_exists( 'gutenberg_maintain_note_followers' ) ) {
	/**
	 * Keeps a thread's follower list in sync as notes are created and edited.
	 *
	 * The note author and everyone mentioned are subscribed to the thread; an
	 * edit that adds a mention subscribes the newly mentioned user. Removing
	 * a mention on a later edit intentionally does not unfollow: once pulled
	 * into a thread a user stays subscribed until they explicitly opt out
	 * (via the emailed unfollow link, gutenberg_remove_note_followers(), or
	 * the registered meta).
	 *
	 * Bookkeeping is intentionally NOT gated on the `wp_notes_notify` option:
	 * that option controls whether emails are sent, not who participates in a
	 * thread, and follower lists must stay correct so enabling notifications
	 * later works for existing threads.
	 *
	 * Runs at priority 12, after the notification handlers, so "existing
	 * followers" still means "before this note" while they run.
	 *
	 * @param WP_Comment $comment  The note that was just inserted or updated.
	 * @param mixed      $request  The REST request (unused).
	 * @param bool       $creating Whether this is a create (true) or update (false).
	 */
	function gutenberg_maintain_note_followers( WP_Comment $comment, $request = null, bool $creating = true ): void {
		unset( $request );

		if ( 'note' !== $comment->comment_type ) {
			return;
		}

		$root_id       = gutenberg_get_note_thread_root_id( $comment );
		$new_followers = gutenberg_get_note_mentioned_user_ids( $comment->comment_content );

		if ( $creating ) {
			$author_id = (int) $comment->user_id;
			if ( $author_id > 0 ) {
				$new_followers[] = $author_id;
			}
		}

		if ( array() !== $new_followers ) {
			gutenberg_add_note_followers( $root_id, $new_followers );
		}
	}
	add_action( 'rest_insert_comment', 'gutenberg_maintain_note_followers', 12, 3 );
}

if ( ! function_exists( 'gutenberg_send_note_follower_notification' ) ) {
	/**
	 * Sends a single follower notification email.
	 *
	 * @param WP_User      $user    The recipient.
	 * @param WP_Comment   $comment The note that triggered the notification.
	 * @param WP_Post|null $post    The post the note belongs to.
	 * @param int          $root_id The thread's top-level note ID.
	 * @return bool Whether the email was accepted for delivery by wp_mail().
	 */
	function gutenberg_send_note_follower_notification( WP_User $user, WP_Comment $comment, ?WP_Post $post, int $root_id ): bool {
		$switched_locale = switch_to_user_locale( $user->ID );

		$blogname    = wp_specialchars_decode( get_option( 'blogname' ), ENT_QUOTES );
		$post_title  = $post ? wp_specialchars_decode( get_the_title( $post ), ENT_QUOTES ) : '';
		$author_name = $comment->comment_author ? $comment->comment_author : __( 'Someone', 'gutenberg' );
		$content     = wp_strip_all_tags( wp_specialchars_decode( $comment->comment_content ) );
		$edit_link   = $post ? gutenberg_get_note_notification_link( $post, $comment ) : '';

		/* translators: %1$s: commenter name, %2$s: post title. */
		$message = sprintf( __( '%1$s added a note to a thread you follow on "%2$s".', 'gutenberg' ), $author_name, $post_title );
		/* translators: %1$s: site name, %2$s: post title. */
		$subject = sprintf( __( '[%1$s] New activity on a note you follow on "%2$s"', 'gutenberg' ), $blogname, $post_title );

		$lines = array( $message, '' );
		if ( '' !== $content ) {
			$lines[] = $content;
			$lines[] = '';
		}
		if ( $edit_link ) {
			$lines[] = $edit_link;
		}

		$body  = implode( "\n", $lines );
		$body .= "\n\n";
		$body .= __( 'You are subscribed to this note thread. To stop receiving notifications about it, follow this link:', 'gutenberg' );
		$body .= "\n" . gutenberg_get_note_unfollow_url( $root_id, (int) $user->ID );

		/**
		 * Filters the follower notification email subject.
		 *
		 * @since 7.1.0
		 *
		 * @param string     $subject Email subject.
		 * @param WP_User    $user    Recipient.
		 * @param WP_Comment $comment The note.
		 */
		$subject = apply_filters( 'wp_note_follower_notification_subject', $subject, $user, $comment );

		/**
		 * Filters the follower notification email body.
		 *
		 * @since 7.1.0
		 *
		 * @param string     $body    Email body.
		 * @param WP_User    $user    Recipient.
		 * @param WP_Comment $comment The note.
		 */
		$body = apply_filters( 'wp_note_follower_notification_text', $body, $user, $comment );

		$sent = wp_mail( $user->user_email, wp_specialchars_decode( $subject ), $body );

		if ( $switched_locale ) {
			restore_previous_locale();
		}

		return $sent;
	}
}
