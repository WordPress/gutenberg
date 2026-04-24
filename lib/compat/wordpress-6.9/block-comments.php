<?php

/**
 * Adds support for block comments to the built-in post types.
 *
 * @return void
 */
function gutenberg_block_comment_add_post_type_support() {
	$post_types = array( 'post', 'page' );

	foreach ( $post_types as $post_type ) {
		if ( ! post_type_supports( $post_type, 'editor' ) ) {
			continue;
		}

		$supports        = get_all_post_type_supports( $post_type );
		$editor_supports = array( 'notes' => true );

		// `add_post_type_support()` doesn't merge support sub-properties, so we explicitly merge it here.
		if ( is_array( $supports['editor'] ) && isset( $supports['editor'][0] ) && is_array( $supports['editor'][0] ) ) {
			$editor_supports = array_merge( $editor_supports, $supports['editor'][0] );
		}

		add_post_type_support( $post_type, 'editor', $editor_supports );
	}
}
add_action( 'init', 'gutenberg_block_comment_add_post_type_support' );

/**
 * Register comment metadata for block comment status.
 */
function gutenberg_register_block_comment_metadata() {
	register_meta(
		'comment',
		'_wp_note_status',
		array(
			'type'          => 'string',
			'description'   => __( 'Note resolution status', 'gutenberg' ),
			'single'        => true,
			'show_in_rest'  => array(
				'schema' => array(
					'type' => 'string',
					'enum' => array( 'resolved', 'reopen' ),
				),
			),
			'auth_callback' => function ( $allowed, $meta_key, $object_id ) {
				return current_user_can( 'edit_comment', $object_id );
			},
		)
	);
}
add_action( 'init', 'gutenberg_register_block_comment_metadata' );

/**
 * Updates the comment type for avatars in the WordPress REST API.
 *
 * This function adds the 'note' type to the list of comment types
 * for which avatars should be retrieved in the WordPress REST API.
 *
 * @param array $comment_type The array of comment types.
 * @return array The updated array of comment types.
 */
if ( ! function_exists( 'update_get_avatar_comment_type' ) ) {
	function update_get_avatar_comment_type( $comment_type ) {
		$comment_type[] = 'note';
		return $comment_type;
	}
	add_filter( 'get_avatar_comment_types', 'update_get_avatar_comment_type' );
}

/**
 * Excludes block comments from the admin comments query.
 *
 * This function modifies the comments query to exclude comments of type 'note'
 * when the query is for comments in the WordPress admin.
 *
 * @global wpdb $wpdb WordPress database abstraction object.
 *
 * @param string[] $clauses The current SQL clauses for the comments query.
 * @param WP_Comment_Query $query The current comments query.
 *
 * @return string[] The modified SQL clauses for the comments query.
 */
if ( ! function_exists( 'exclude_block_comments_from_admin' ) ) {
	function exclude_block_comments_from_admin( $clauses, $query ) {
		// Only modify the query if it's for comments
		if ( isset( $query->query_vars['type'] ) && '' === $query->query_vars['type'] ) {
			$query->set( 'type', '' );

			global $wpdb;
			$clauses['where'] .= " AND {$wpdb->comments}.comment_type != 'note'";
		}

		return $clauses;
	}
	add_action( 'comments_clauses', 'exclude_block_comments_from_admin', 10, 2 );
}

/**
 * Filter the comment count query to exclude block_comment type comments.
 *
 * Note: we need to make sure this doesn't interfere with the "Editorial Comments" view
 * once https://github.com/WordPress/gutenberg/issues/71621 is implemented.
 *
 * @param string $query The SQL query string.
 * @return string The modified SQL query string.
 */
function gutenberg_filter_comment_count_query_exclude_block_comments( $query ) {
	// Adjust the query if it is a comment count query.
	if ( str_starts_with( $query, 'SELECT comment_post_ID, COUNT(comment_ID) as num_comments FROM' ) && str_contains( $query, 'comment_approved' ) ) {
		if ( ! str_contains( $query, "comment_type != 'note'" ) ) {
			$query = str_replace( 'comment_approved', "comment_type != 'note' AND comment_approved", $query );
		}
	}
	return $query;
}
add_filter( 'query', 'gutenberg_filter_comment_count_query_exclude_block_comments' );

/**
 * Adjusts the comments list table query so `comment_type=note` never displays.
 *
 * @param array $args An array of get_comments() arguments.
 * @return array Possibly modified arguments for get_comments().
 */
function gutenberg_hide_note_from_comment_list_table( $args ) {
	if ( ! empty( $_REQUEST['comment_type'] ) && 'note' === $_REQUEST['comment_type'] ) {
		unset( $args['type'] );
	}
	return $args;
}
add_filter( 'comments_list_table_query_args', 'gutenberg_hide_note_from_comment_list_table' );

/**
 * Override comment_count to exclude notes from the comment count.
 *
 * @param int|null $new     The new comment count. Default null.
 * @param int      $old     The old comment count.
 * @param int      $post_id Post ID.
 * @return int|null The modified comment count.
 */
function gutenberg_exclude_notes_from_comment_count( $new_count, $old_count, $post_id ) {
	global $wpdb;
	// If another filter already set a count, respect it.
	if ( null !== $new_count ) {
		return $new_count;
	}
	$new_count = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM $wpdb->comments WHERE comment_post_ID = %d AND comment_approved = '1' AND comment_type != 'note'", $post_id ) );
	return $new_count;
}
add_filter( 'pre_wp_update_comment_count_now', 'gutenberg_exclude_notes_from_comment_count', 10, 3 );

/**
 * Registers the `wp_notes_notify` option and renders its UI on the Discussion screen.
 *
 * @return void
 */
function gutenberg_register_wp_notes_notify_setting() {
	if ( is_wp_version_compatible( '6.9' ) ) {
		return;
	}

	register_setting(
		'discussion',
		'wp_notes_notify',
		array(
			'type'              => 'boolean',
			'description'       => __( 'Email me whenever anyone posts a note', 'gutenberg' ),
			'sanitize_callback' => 'rest_sanitize_boolean',
			'default'           => 1,
		)
	);

	add_settings_field(
		'wp_notes_notify',
		__( 'Notes', 'gutenberg' ),
		function () {
			?>
			<label for="wp_notes_notify">
				<input name="wp_notes_notify" type="checkbox" id="wp_notes_notify" value="1" <?php checked( '1', get_option( 'wp_notes_notify', 1 ) ); ?>/>
				<?php _e( 'Email me whenever anyone posts a note', 'gutenberg' ); ?>
			</label>
			<?php
		},
		'discussion'
	);
}
add_action( 'admin_init', 'gutenberg_register_wp_notes_notify_setting' );

/**
 * Compatibility implementation of wp_new_comment_notify_postauthor() with notes support.
 *
 * @param int $comment_id The comment ID.
 * @return bool True on success, false on failure.
 */
function gutenberg_new_comment_notify_postauthor( $comment_id ) {
	$comment = get_comment( $comment_id );
	$is_note = ( $comment && 'note' === $comment->comment_type );

	$maybe_notify = $is_note ? get_option( 'wp_notes_notify', 1 ) : get_option( 'comments_notify' );

	/**
	 * Filters whether to send the post author new comment notification emails,
	 * overriding the site setting.
	 *
	 * @since 4.4.0
	 *
	 * @param bool $maybe_notify Whether to notify the post author about the new comment.
	 * @param int  $comment_id   The ID of the comment for the notification.
	 */
	$maybe_notify = apply_filters( 'notify_post_author', $maybe_notify, $comment_id );

	/*
	 * wp_notify_postauthor() checks if notifying the author of their own comment.
	 * By default, it won't, but filters can override this.
	 */
	if ( ! $maybe_notify ) {
		return false;
	}

	// Send notifications for approved comments and all notes.
	if (
		! isset( $comment->comment_approved ) ||
		( '1' !== $comment->comment_approved && ! $is_note ) ) {
			return false;
	}

	return wp_notify_postauthor( $comment_id );
}

/**
 * Compatibility implementation of wp_new_comment_via_rest_notify_postauthor()
 * function introduced in WordPress 6.9.
 *
 * @param WP_Comment $comment The comment object.
 */
function gutenberg_new_comment_via_rest_notify_postauthor( $comment ) {
	if ( $comment instanceof WP_Comment && 'note' === $comment->comment_type ) {
		gutenberg_new_comment_notify_postauthor( (int) $comment->comment_ID );
	}
}

if ( has_action( 'rest_insert_comment', 'wp_new_comment_via_rest_notify_postauthor' ) ) {
	remove_action( 'rest_insert_comment', 'wp_new_comment_via_rest_notify_postauthor' );
	add_action( 'rest_insert_comment', 'gutenberg_new_comment_via_rest_notify_postauthor' );
}

/**
 * Filters the note notification text.
 *
 * @param string $notify_message The comment notification email text.
 * @param string $comment_id     Comment ID as a numeric string.
 *
 * @return string The filtered notification text.
 */
function gutenberg_filter_note_notification_text( $notify_message, $comment_id ) {
	$comment = get_comment( $comment_id );
	if ( ! $comment || 'note' !== $comment->comment_type ) {
		return $notify_message;
	}

	$post = get_post( $comment->comment_post_ID );
	if ( ! $post ) {
		return $notify_message;
	}

	$comment_author_domain = '';
	if ( WP_Http::is_ip_address( $comment->comment_author_IP ) ) {
		$comment_author_domain = gethostbyaddr( $comment->comment_author_IP );
	}

	$comment_content = wp_specialchars_decode( $comment->comment_content );

	/* translators: %s: Post title. */
	$notify_message = sprintf( __( 'New note on your post "%s"', 'gutenberg' ), $post->post_title ) . "\r\n";
	/* translators: 1: Note author's name, 2: Note author's IP address, 3: Note author's hostname. */
	$notify_message .= sprintf( __( 'Author: %1$s (IP address: %2$s, %3$s)', 'gutenberg' ), $comment->comment_author, $comment->comment_author_IP, $comment_author_domain ) . "\r\n";
	/* translators: %s: Note author email. */
	$notify_message .= sprintf( __( 'Email: %s', 'gutenberg' ), $comment->comment_author_email ) . "\r\n";
	/* translators: %s: Note text. */
	$notify_message .= sprintf( __( 'Note: %s', 'gutenberg' ), "\r\n" . ( empty( $comment_content ) ? __( 'resolved/reopened' ) : $comment_content ) ) . "\r\n\r\n";
	$notify_message .= __( 'You can see all notes on this post here:', 'gutenberg' ) . "\r\n";
	$notify_message .= get_edit_post_link( $comment->comment_post_ID, 'url' ) . "\r\n";

	return $notify_message;
}
add_filter( 'comment_notification_text', 'gutenberg_filter_note_notification_text', 10, 2 );

/**
 * Filters the note notification subject.
 *
 * @param string $subject    The comment notification email subject.
 * @param string $comment_id Comment ID as a numeric string.
 *
 * @return string The filtered notification subject.
 */
function gutenberg_filter_note_notification_subject( $subject, $comment_id ) {
	$comment = get_comment( $comment_id );
	if ( ! $comment || 'note' !== $comment->comment_type ) {
		return $subject;
	}

	$post = get_post( $comment->comment_post_ID );
	if ( ! $post ) {
		return $subject;
	}

	$blogname = wp_specialchars_decode( get_option( 'blogname' ), ENT_QUOTES );

	/* translators: Note notification email subject. 1: Site title, 2: Post title. */
	$subject = sprintf( __( '[%1$s] Note: "%2$s"', 'gutenberg' ), $blogname, $post->post_title );
	return $subject;
}
add_filter( 'comment_notification_subject', 'gutenberg_filter_note_notification_subject', 10, 2 );
