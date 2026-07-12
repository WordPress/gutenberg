<?php
/**
 * Mention and follower notifications for notes (block comments).
 *
 * Note content can carry `@` mentions, stored as
 * `<a class="wp-note-mention" data-user-id="…">@Name</a>` (the markup contract
 * lives in the `core/note-mention` format, see
 * packages/editor/src/components/collab-sidebar/mention-format.js). When a
 * note is created through the REST API this file parses those mentions out of
 * the saved content and emails the mentioned users, in addition to maintaining
 * a per-thread "followers" list so that people who start, reply to, or are
 * mentioned in a thread are notified of later activity on it.
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
			$user_id = (int) $processor->get_attribute( 'data-user-id' );
			if ( $user_id > 0 ) {
				$user_ids[] = $user_id;
			}
		}

		return array_values( array_unique( $user_ids, SORT_NUMERIC ) );
	}
}

if ( ! function_exists( 'gutenberg_note_mention_allowed_html' ) ) {
	/**
	 * Adds the mention attributes to the comment kses allowlist.
	 *
	 * For users without `unfiltered_html`, comment content passes through
	 * `wp_filter_kses()` with the default comment allowlist, which only permits
	 * `href` and `title` on `<a>`. That strips the `class` and `data-user-id`
	 * attributes mentions are stored with, silently breaking mention parsing
	 * for authors and contributors (and everyone but super admins on
	 * multisite). This filter is only installed while a REST request is saving
	 * a note, so ordinary comments keep the default allowlist.
	 *
	 * @param array[] $tags    Allowed HTML tags and attributes.
	 * @param string  $context Kses context name.
	 * @return array[] Filtered tags.
	 *
	 * @phpstan-param array<non-empty-string, array<non-empty-string, bool>> $tags
	 * @return array<non-empty-string, array<non-empty-string, bool>>
	 */
	function gutenberg_note_mention_allowed_html( $tags, string $context ): array {
		if ( ! is_array( $tags ) ) {
			$tags = array();
		}
		if ( 'pre_comment_content' === $context && isset( $tags['a'] ) && is_array( $tags['a'] ) ) {
			$tags['a']['class']        = true;
			$tags['a']['data-user-id'] = true;
		}
		return $tags;
	}
}

if ( ! function_exists( 'gutenberg_rest_request_saves_note' ) ) {
	/**
	 * Determines whether a REST request creates or updates a note.
	 *
	 * @param WP_REST_Request $request The matched REST request.
	 * @return bool Whether the request writes a note comment.
	 */
	function gutenberg_rest_request_saves_note( WP_REST_Request $request ): bool {
		if ( ! in_array( $request->get_method(), array( 'POST', 'PUT', 'PATCH' ), true ) ) {
			return false;
		}

		if ( ! str_starts_with( $request->get_route(), '/wp/v2/comments' ) ) {
			return false;
		}

		if ( 'note' === $request->get_param( 'type' ) ) {
			return true;
		}

		// Updates usually omit `type`; look at the targeted comment instead.
		$comment_id = (int) $request->get_param( 'id' );
		if ( $comment_id > 0 ) {
			$existing = get_comment( $comment_id );
			return $existing && 'note' === $existing->comment_type;
		}

		return false;
	}
}

if ( ! function_exists( 'gutenberg_note_mentions_before_rest_callbacks' ) ) {
	/**
	 * Installs the mention kses allowance while a REST request saves a note.
	 *
	 * `rest_request_before_callbacks` runs after routing, so on updates the
	 * targeted comment is known, and before the endpoint filters comment
	 * content through kses. The paired `rest_request_after_callbacks` handler
	 * removes the allowance again so other comment writes in the same request
	 * lifecycle (e.g. batch requests) keep the default allowlist.
	 *
	 * @param mixed            $response Result to send; untouched here.
	 * @param mixed[]|callable $handler  Route handler (unused).
	 * @param WP_REST_Request  $request  The matched request.
	 * @return mixed Untouched $response.
	 *
	 * @template T
	 * @phpstan-param T $response
	 * @phpstan-return T
	 */
	function gutenberg_note_mentions_before_rest_callbacks( $response, $handler, WP_REST_Request $request ) {
		unset( $handler );

		if ( gutenberg_rest_request_saves_note( $request ) ) {
			add_filter( 'wp_kses_allowed_html', 'gutenberg_note_mention_allowed_html', 10, 2 );
		}

		return $response;
	}
	add_filter( 'rest_request_before_callbacks', 'gutenberg_note_mentions_before_rest_callbacks', 10, 3 );
}

if ( ! function_exists( 'gutenberg_note_mentions_after_rest_callbacks' ) ) {
	/**
	 * Removes the mention kses allowance after a REST request completes.
	 *
	 * @param mixed $response Result to send; untouched here.
	 * @return mixed Untouched $response.
	 *
	 * @template T
	 * @phpstan-param T $response
	 * @phpstan-return T
	 */
	function gutenberg_note_mentions_after_rest_callbacks( $response ) {
		remove_filter( 'wp_kses_allowed_html', 'gutenberg_note_mention_allowed_html', 10 );
		return $response;
	}
	add_filter( 'rest_request_after_callbacks', 'gutenberg_note_mentions_after_rest_callbacks' );
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
	function gutenberg_get_note_thread_root_id( WP_Comment $comment ): int {
		$parent = (int) $comment->comment_parent;
		return $parent > 0 ? $parent : (int) $comment->comment_ID;
	}
}

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
	 * @phpstan-return list<positive-int>
	 */
	function gutenberg_get_note_followers( int $root_id ): array {
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
	 * @phpstan-return list<positive-int>
	 */
	function gutenberg_add_note_followers( int $root_id, array $user_ids ): array {
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
	 * Lets a user unfollow a thread. The thread's own followers meta is deleted
	 * automatically with the note when the note is trashed or deleted (comment
	 * meta is removed alongside the comment, and deleting a top-level note also
	 * removes its replies), so this only needs to handle explicit unsubscribes.
	 *
	 * @param int   $root_id  Top-level note ID.
	 * @param int[] $user_ids User IDs to unsubscribe from the thread.
	 * @return list<int> The updated follower list.
	 * @phpstan-return list<positive-int>
	 */
	function gutenberg_remove_note_followers( int $root_id, array $user_ids ): array {
		$user_ids = array_map( fn ( $user_id ) => (int) $user_id, $user_ids );
		foreach ( $user_ids as $user_id ) {
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
	 * Mirrors core's `_wp_note_status` registration. The list is readable by
	 * users who can moderate comments and editable by users who can edit the
	 * note, so a follower management UI can read and update it.
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
					'schema' => array( 'type' => 'integer' ),
				),
				'auth_callback' => function ( $allowed, $meta_key, $object_id ) {
					return current_user_can( 'edit_comment', $object_id );
				},
			)
		);
	}
	add_action( 'init', 'gutenberg_register_note_followers_meta' );
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
	 */
	function gutenberg_notify_note_mentions( WP_Comment $comment, $request = null, bool $creating = true ): void {
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
		$recipient_ids = apply_filters( 'wp_note_notification_recipients', $recipient_ids, $comment, $root_id );

		/*
		 * The recipient set is bounded and small (one note's mentions plus that
		 * thread's followers), so emails are sent synchronously here. Pausing
		 * inline (e.g. sleep()) would only hold the REST request open without
		 * easing mail-server load; if notification volume ever warrants it, the
		 * right fix is to offload delivery to a background queue
		 * (wp_schedule_single_event() / Action Scheduler) rather than throttle
		 * within the request.
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

			$was_mentioned = in_array( $user_id, $mentioned, true );
			gutenberg_send_note_notification( $user, $comment, $post, $was_mentioned );
		}

		/*
		 * Subscribe the note author and everyone mentioned to the thread. To opt
		 * out later, a user removes their ID from the thread root's
		 * `_wp_note_followers` meta: either via gutenberg_remove_note_followers()
		 * or by editing that meta through the REST API (it is registered as
		 * editable by users who can edit the note). Removing an `@` mention on a
		 * later edit intentionally does not unfollow, once pulled into a thread a
		 * user stays subscribed until they explicitly opt out. A follower is also
		 * dropped automatically when the thread is trashed or deleted, since
		 * comment meta is removed alongside the comment.
		 */
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
	 * @return bool Whether the email was accepted for delivery by wp_mail().
	 */
	function gutenberg_send_note_notification( WP_User $user, WP_Comment $comment, ?WP_Post $post, bool $was_mentioned ): bool {
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
		$subject = apply_filters( 'wp_note_notification_subject', $subject, $user, $comment, $was_mentioned );

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
		$body = apply_filters( 'wp_note_notification_text', $body, $user, $comment, $was_mentioned );

		return wp_mail( $user->user_email, wp_specialchars_decode( $subject ), $body );
	}
}
