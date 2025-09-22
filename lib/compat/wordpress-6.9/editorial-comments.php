<?php
/**
 * Add an "Editorial Comments" screen to wp-admin as a top-level menu item below Comments.
 *
 * This page is very similar to the existing comments page, except it shows Editorial
 * Comments -- that is comments with the type 'block_comment'.
 */
function gutenberg_add_editorial_comments_menu() {
	$hook_suffix = add_menu_page(
		__( 'Editorial Comments', 'gutenberg', 'gutenberg' ),
		__( 'Editorial Comments', 'gutenberg', 'gutenberg' ),
		'edit_posts',
		'edit-editorial-comments',
		'gutenberg_render_editorial_comments_page',
		'dashicons-admin-comments',
		26 // Just below "Comments".
	);
}
add_action( 'admin_menu', 'gutenberg_add_editorial_comments_menu' );

/**
 * Render the Editorial Comments admin page.
 */
function gutenberg_render_editorial_comments_page()  {
	// This code from Core's wp-admin/edit-comments.php.
	/**
	 * Edit Editorial Comments Administration Screen.
	 *
	 * @package WordPress
	 * @subpackage Administration
	 */
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_die(
			'<h1>' . __( 'You need a higher level of permission.', 'gutenberg' ) . '</h1>' .
			'<p>' . __( 'Sorry, you are not allowed to edit comments.', 'gutenberg' ) . '</p>',
			403
		);
	}

	// List table limited to 'block_comment' type.
	require_once ABSPATH . 'wp-admin/includes/class-wp-comments-list-table.php';
	$wp_list_table = new WP_Comments_List_Table( array( 'screen' => 'edit-comments-block_comment' ) );
	$wp_list_table->set_comment_type( 'block_comment' );

	$pagenum  = $wp_list_table->get_pagenum();
	$doaction = $wp_list_table->current_action();

	if ( $doaction ) {
		check_admin_referer( 'bulk-comments' );

		if ( 'delete_all' === $doaction && ! empty( $_REQUEST['pagegen_timestamp'] ) ) {
			/**
			 * @global wpdb $wpdb WordPress database abstraction object.
			 */
			global $wpdb;

			$comment_status = wp_unslash( $_REQUEST['comment_status'] );
			$delete_time    = wp_unslash( $_REQUEST['pagegen_timestamp'] );
			$comment_ids    = $wpdb->get_col(
				$wpdb->prepare(
					"SELECT comment_ID FROM $wpdb->comments
					WHERE comment_approved = %s AND %s > comment_date_gmt AND comment_type = 'block_comment'",
					$comment_status,
					$delete_time
				)
			);
			$doaction       = 'delete';
		} elseif ( isset( $_REQUEST['delete_comments'] ) ) {
			$comment_ids = $_REQUEST['delete_comments'];
			$doaction    = $_REQUEST['action'];
		} elseif ( isset( $_REQUEST['ids'] ) ) {
			$comment_ids = array_map( 'absint', explode( ',', $_REQUEST['ids'] ) );
		} elseif ( wp_get_referer() ) {
			wp_safe_redirect( wp_get_referer() );
			exit;
		}

		$resolved   = 0;
		$unresolved = 0;
		$trashed    = 0;
		$untrashed  = 0;
		$deleted    = 0;

		$redirect_to = remove_query_arg(
			array(
				'deleted',
				'resolved',
				'unresolved',
				'ids',
			),
			wp_get_referer()
		);
		$redirect_to = add_query_arg( 'paged', $pagenum, $redirect_to );

		wp_defer_comment_counting( true );

		foreach ( $comment_ids as $comment_id ) {
			// @TODO adjust capability check for editorial comments.
			if ( ! current_user_can( 'edit_comment', $comment_id ) ) {
				continue;
			}

			switch ( $doaction ) {
				case 'resolve':
					wp_set_comment_status( $comment_id, 'approve' );
					++$resolved;
					break;
				case 'unresolve':
					wp_set_comment_status( $comment_id, 'hold' );
					++$unresolved;
					break;
				case 'delete':
					wp_delete_comment( $comment_id );
					++$deleted;
					break;
			}
		}

		if ( ! in_array( $doaction, array( 'resolve', 'unresolve', 'delete' ), true ) ) {
			$screen = get_current_screen()->id;

			/** This action is documented in wp-admin/edit.php */
			$redirect_to = apply_filters( "handle_bulk_actions-{$screen}", $redirect_to, $doaction, $comment_ids ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
		}

		wp_defer_comment_counting( false );

		if ( $resolved ) {
			$redirect_to = add_query_arg( 'resolved', $resolved, $redirect_to );
		}
		if ( $unresolved ) {
			$redirect_to = add_query_arg( 'unresolved', $unresolved, $redirect_to );
		}
		if ( $deleted ) {
			$redirect_to = add_query_arg( 'deleted', $deleted, $redirect_to );
		}

		wp_safe_redirect( $redirect_to );
		exit;
	} elseif ( ! empty( $_GET['_wp_http_referer'] ) ) {
		wp_redirect( remove_query_arg( array( '_wp_http_referer', '_wpnonce' ), wp_unslash( $_SERVER['REQUEST_URI'] ) ) );
		exit;
	}

	$wp_list_table->prepare_items();

	wp_enqueue_script( 'admin-comments' );
	enqueue_comment_hotkeys_js();

	/**
	 * @global int $post_id
	 */
	global $post_id;

	if ( $post_id ) {
		$comments_count = $comments_count = get_comments(
			array(
				'post_id'         => $post_id,
				'count'           => true,
				'status'          => 'all',
				'type'            => 'block_comment',
			)
		);
		$resolved_comments = get_comments(
			array(
				'post_id'         => $post_id,
				'count'           => true,
				'status'          => 'approve',
				'type'            => 'block_comment',
			)
		);
		$draft_or_post_title = wp_html_excerpt( _draft_or_post_title( $post_id ), 50, '&hellip;' );

		if ( $resolved_comments > 0 ) {
			// Used in the HTML title tag.
			$title = sprintf(
				/* translators: 1: Editorial Comments count, 2: Post title. */
				__( 'Editorial Comments (%1$s) on &#8220;%2$s&#8221;', 'gutenberg' ),
				number_format_i18n( $resolved_comments ),
				$draft_or_post_title
			);
		} else {
			// Used in the HTML title tag.
			$title = sprintf(
				/* translators: %s: Post title. */
				__( 'Editorial Comments on &#8220;%s&#8221;', 'gutenberg' ),
				$draft_or_post_title
			);
		}
	} else {
		// Count all 'block_comment' comments.
		$comments_count = get_comments(
			array(
				'count'           => true,
				'status'          => 'all',
				'type'            => 'block_comment',
			)
		);

		// Count the resolved 'block_comment' comments.
		$resolved_comments = get_comments(
			array(
				'count'           => true,
				'status'          => 'approve',
				'type'            => 'block_comment',
			)
		);

		if ( $resolved_comments > 0 ) {
			// Used in the HTML title tag.
			$title = sprintf(
				/* translators: %s: Editorial Comments count. */
				__( 'Editorial Comments (%s)', 'gutenberg' ),
				number_format_i18n( $resolved_comments )
			);
		} else {
			// Used in the HTML title tag.
			$title = __( 'Editorial Comments', 'gutenberg' );
		}
	}
	?>

	<div class="wrap">
	<h1 class="wp-heading-inline">
	<?php
	if ( $post_id ) {
		printf(
			/* translators: %s: Link to post. */
			__( 'Editorial Comments on &#8220;%s&#8221;', 'gutenberg' ),
			sprintf(
				'<a href="%1$s">%2$s</a>',
				get_edit_post_link( $post_id ),
				wp_html_excerpt( _draft_or_post_title( $post_id ), 50, '&hellip;' )
			)
		);
	} else {
		_e( 'Editorial Comments' );
	}
	?>
	</h1>

	<?php
	if ( $post_id ) {
		$post_type_object = get_post_type_object( get_post_type( $post_id ) );

		if ( $post_type_object ) {
			printf(
				'<a href="%1$s" class="comments-view-item-link">%2$s</a>',
				get_permalink( $post_id ),
				$post_type_object->labels->view_item
			);
		}
	}

	if ( isset( $_REQUEST['s'] ) && strlen( $_REQUEST['s'] ) ) {
		echo '<span class="subtitle">';
		printf(
			/* translators: %s: Search query. */
			__( 'Search results for: %s', 'gutenberg' ),
			'<strong>' . esc_html( wp_unslash( $_REQUEST['s'] ) ) . '</strong>'
		);
		echo '</span>';
	}
	?>

	<hr class="wp-header-end">

	<?php
	if ( isset( $_REQUEST['error'] ) ) {
		$error     = (int) $_REQUEST['error'];
		$error_msg = '';
		switch ( $error ) {
			case 1:
				$error_msg = __( 'Invalid comment ID.', 'gutenberg' );
				break;
			case 2:
				$error_msg = __( 'Sorry, you are not allowed to edit comments on this post.', 'gutenberg' );
				break;
		}
		if ( $error_msg ) {
			wp_admin_notice(
				$error_msg,
				array(
					'id'                 => 'moderated',
					'additional_classes' => array( 'error' ),
				)
			);
		}
	}

	if ( isset( $_REQUEST['resolved'] )
		|| isset( $_REQUEST['deleted'] )
		|| isset( $_REQUEST['same'] )
	) {
		$resolved  = isset( $_REQUEST['resolved'] ) ? (int) $_REQUEST['resolved'] : 0;
		$deleted   = isset( $_REQUEST['deleted'] ) ? (int) $_REQUEST['deleted'] : 0;
		$same      = isset( $_REQUEST['same'] ) ? (int) $_REQUEST['same'] : 0;

		if ( $resolved > 0 || $deleted > 0 || $trashed > 0 || $untrashed > 0 || $spammed > 0 || $unspammed > 0 || $same > 0 ) {
			if ( $resolved > 0 ) {
				$messages[] = sprintf(
					/* translators: %s: Number of comments. */
					_n( '%s comment approved.', '%s comments approved.', $resolved ),
					$resolved
				);
			}

			if ( $deleted > 0 ) {
				$messages[] = sprintf(
					/* translators: %s: Number of comments. */
					_n( '%s comment permanently deleted.', '%s comments permanently deleted.', $deleted ),
					$deleted
				);
			}

			if ( $same > 0 ) {
				$comment = get_comment( $same );
				if ( $comment ) {
					switch ( $comment->comment_approved ) {
						case '1':
							$messages[] = __( 'This comment is already approved.', 'gutenberg' ) . sprintf(
								' <a href="%1$s">%2$s</a>',
								esc_url( admin_url( "comment.php?action=editcomment&c=$same" ) ),
								__( 'Edit comment', 'gutenberg' )
							);
							break;
					}
				}
			}

			wp_admin_notice(
				implode( "<br />\n", $messages ),
				array(
					'id'                 => 'moderated',
					'additional_classes' => array( 'updated' ),
					'dismissible'        => true,
				)
			);
		}
	}
	?>

	<?php
	$wp_list_table->views(); ?>

	<form id="comments-form" method="get">

	<?php $wp_list_table->search_box( __( 'Search Editorial Comments', 'gutenberg'  ), 'comment' );?>

	<?php if ( $post_id ) : ?>
	<input type="hidden" name="p" value="<?php echo esc_attr( (int) $post_id ); ?>" />
	<?php endif; ?>
	<input type="hidden" name="comment_status" value="<?php echo esc_attr( isset( $comment_status ) ? $comment_status : '' ); ?>" />
	<input type="hidden" name="pagegen_timestamp" value="<?php echo esc_attr( current_time( 'mysql', true ) ); ?>" />

	<input type="hidden" name="_total" value="<?php echo esc_attr( $wp_list_table->get_pagination_arg( 'total_items' ) ); ?>" />
	<input type="hidden" name="_per_page" value="<?php echo esc_attr( $wp_list_table->get_pagination_arg( 'per_page' ) ); ?>" />
	<input type="hidden" name="_page" value="<?php echo esc_attr( $wp_list_table->get_pagination_arg( 'page' ) ); ?>" />

	<?php if ( isset( $_REQUEST['paged'] ) ) { ?>
		<input type="hidden" name="paged" value="<?php echo esc_attr( absint( $_REQUEST['paged'] ) ); ?>" />
	<?php } ?>

	<?php $wp_list_table->display(); ?>
	</form>
	</div>

	<div id="ajax-response"></div>

	<?php
	wp_comment_reply( '-1', true, 'detail' );
	wp_comment_trashnotice();
}
