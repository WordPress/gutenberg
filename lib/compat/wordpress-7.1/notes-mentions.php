<?php
/**
 * Mention notifications for notes (block comments).
 *
 * Note content can carry `@` mentions, stored as chips of the form
 * `<span class="wp-note-mention user-N">@Name</span>` where `N` is the
 * mentioned user's ID (the markup contract lives in
 * packages/editor/src/components/collab-sidebar/note-mention-completer.tsx,
 * and the kses allowance for the classes in
 * lib/compat/wordpress-7.1/block-comments.php). When a note is created through
 * the REST API this file parses those mentions out of the saved content and
 * emails the mentioned users.
 *
 * WordPress core already notifies the post author of every note via
 * `wp_new_comment_via_rest_notify_postauthor()` on `rest_insert_comment`. This
 * file adds the mentioned-user audience on the same hook and deliberately
 * leaves the post author to core to avoid sending them a duplicate email.
 *
 * @package gutenberg
 * @since   7.1.0
 */

/**
 * Extracts the mentioned user IDs from note content.
 *
 * Mentions are stored as chips carrying the `wp-note-mention` class plus a
 * `user-N` class token holding the mentioned user's ID. Only elements that
 * carry both are treated as mentions.
 *
 * @since 7.1.0
 *
 * @param string $content Note (comment) content, as stored.
 * @return list<int> Unique, positive mentioned user IDs.
 * @phpstan-return list<positive-int>
 */
function gutenberg_get_note_mentioned_user_ids( string $content ): array {
	if ( ! str_contains( $content, 'wp-note-mention' ) ) {
		return array();
	}

	$user_ids  = array();
	$processor = new WP_HTML_Tag_Processor( $content );
	while (
		$processor->next_tag(
			array(
				'tag_name'   => 'SPAN',
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
 * @since 7.1.0
 *
 * @param WP_Comment|null $comment  The note that was just inserted. Null only if it was deleted in the meantime.
 * @param mixed           $request  The REST request. Unused.
 * @param bool            $creating Whether this is a create (true) or update (false).
 */
function gutenberg_notify_note_mentions( ?WP_Comment $comment, $request = null, bool $creating = true ): void {
	if ( ! $creating || ! $comment ) {
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

	$author_id = (int) $comment->user_id;

	// get_post() falls back to the global post when passed 0, which would compose the email about the wrong post.
	$comment_post_id = (int) $comment->comment_post_ID;
	$post            = $comment_post_id ? get_post( $comment_post_id ) : null;
	$post_author_id  = $post ? (int) $post->post_author : 0;

	/*
	 * The recipient set is bounded and small (one note's mentions), so
	 * emails are sent synchronously here. If notification volume ever
	 * warrants it, the right fix is to offload delivery to a background
	 * queue (wp_schedule_single_event() / Action Scheduler) rather than
	 * throttle within the request.
	 */
	foreach ( $mentioned as $user_id ) {
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
/*
 * Once the Core backport lands, WordPress registers its own
 * wp_notify_note_mentions() on this same hook from default-filters.php. With
 * both callbacks attached every mentioned user would be emailed twice, so the
 * plugin's copy - the newer of the two - replaces Core's while Gutenberg is
 * active. Core's post-author notification is deliberately left alone: this
 * file never notifies the post author, so the two do not overlap.
 */
$gutenberg_note_mentions_priority = has_action( 'rest_insert_comment', 'wp_notify_note_mentions' );
if ( false !== $gutenberg_note_mentions_priority ) {
	remove_action( 'rest_insert_comment', 'wp_notify_note_mentions', $gutenberg_note_mentions_priority );
}
unset( $gutenberg_note_mentions_priority );

add_action( 'rest_insert_comment', 'gutenberg_notify_note_mentions', 10, 3 );

/**
 * Sends a single note mention notification email.
 *
 * The email is composed in the recipient's locale, matching how core composes
 * other user-directed notifications, and links to the post editor the same way
 * core's own note notification does.
 *
 * @since 7.1.0
 *
 * @param WP_User      $user    The recipient.
 * @param WP_Comment   $comment The note that triggered the notification.
 * @param WP_Post|null $post    The post the note belongs to.
 * @return bool Whether the email was accepted for delivery by wp_mail().
 */
function gutenberg_send_note_notification( WP_User $user, WP_Comment $comment, ?WP_Post $post ): bool {
	$switched_locale = switch_to_user_locale( $user->ID );

	/*
	 * The site title and the post title are escaped on the way into the database,
	 * and note content is stored as HTML. Both are reversed once here for the
	 * plain text arena of emails. Decoding a second time would go too far and
	 * resolve entities the author meant to be read literally. Tags are stripped
	 * before decoding, so escaped text such as "&lt;code&gt;" survives as text
	 * rather than being read as a tag and dropped.
	 */
	$blogname    = wp_specialchars_decode( get_option( 'blogname' ), ENT_QUOTES );
	$post_title  = $post ? wp_specialchars_decode( get_the_title( $post ), ENT_QUOTES ) : '';
	$author_name = $comment->comment_author ? $comment->comment_author : __( 'Someone', 'gutenberg' );
	$content     = wp_specialchars_decode( wp_strip_all_tags( $comment->comment_content ) );

	/*
	 * The rest of the message is composed for the recipient, and so is the editor
	 * link: get_edit_post_link() answers for whoever is current, which here is the
	 * note's author over REST and nobody at all under WP-Cron.
	 */
	$edit_link = '';
	if ( $post ) {
		$previous_user_id = get_current_user_id();
		wp_set_current_user( $user->ID );
		$edit_link = (string) get_edit_post_link( $post->ID, 'url' );
		wp_set_current_user( $previous_user_id );
	}

	/* translators: %1$s: commenter name, %2$s: post title. */
	$message = sprintf( __( '%1$s mentioned you in a note on "%2$s".', 'gutenberg' ), $author_name, $post_title );
	/* translators: %1$s: site name, %2$s: post title. */
	$subject = sprintf( __( '[%1$s] You were mentioned in a note on "%2$s"', 'gutenberg' ), $blogname, $post_title );

	$lines = array( $message, '' );
	if ( '' !== $content ) {
		$lines[] = $content;
	}
	if ( $edit_link ) {
		$lines[] = '';
		$lines[] = __( 'Edit This', 'gutenberg' ) . ': ' . $edit_link;
	}

	// Declared explicitly so a filtered default cannot turn the message into HTML.
	$headers = 'Content-Type: text/plain; charset="' . get_option( 'blog_charset' ) . '"';

	$sent = wp_mail( $user->user_email, $subject, implode( "\n", $lines ), $headers );

	if ( $switched_locale ) {
		restore_previous_locale();
	}

	return $sent;
}
