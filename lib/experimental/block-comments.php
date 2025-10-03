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
		$editor_supports = array( 'block-comments' => true );

		// `add_post_type_support()` doesn't merge support sub-properties, so we explicitly merge it here.
		if ( is_array( $supports['editor'] ) && isset( $supports['editor'][0] ) && is_array( $supports['editor'][0] ) ) {
			$editor_supports = array_merge( $editor_supports, $supports['editor'][0] );
		}

		add_post_type_support( $post_type, 'editor', $editor_supports );
	}
}
add_action( 'init', 'gutenberg_block_comment_add_post_type_support' );

/**
 * Updates the comment type in the REST API.
 *
 * This function is used as a filter callback for the 'rest_pre_insert_comment' hook.
 * It checks if the 'comment_type' parameter is set to 'block_comment' in the REST API request,
 * and if so, updates the 'comment_type' and 'comment_approved' properties of the prepared comment.
 *
 * @param array $prepared_comment The prepared comment data.
 * @param WP_REST_Request $request The REST API request object.
 * @return array The updated prepared comment data.
 */
if ( ! function_exists( 'update_comment_type_in_rest_api_6_8' ) ) {
	function update_comment_type_in_rest_api_6_8( $prepared_comment, $request ) {
		if ( ! empty( $request['comment_type'] ) && 'block_comment' === $request['comment_type'] ) {
			$prepared_comment['comment_type']     = $request['comment_type'];
			$prepared_comment['comment_approved'] = $request['comment_approved'];
		}

		return $prepared_comment;
	}
	add_filter( 'rest_pre_insert_comment', 'update_comment_type_in_rest_api_6_8', 10, 2 );
}

/**
 * Updates the comment type for avatars in the WordPress REST API.
 *
 * This function adds the 'block_comment' type to the list of comment types
 * for which avatars should be retrieved in the WordPress REST API.
 *
 * @param array $comment_type The array of comment types.
 * @return array The updated array of comment types.
 */
if ( ! function_exists( 'update_get_avatar_comment_type' ) ) {
	function update_get_avatar_comment_type( $comment_type ) {
		$comment_type[] = 'block_comment';
		return $comment_type;
	}
	add_filter( 'get_avatar_comment_types', 'update_get_avatar_comment_type' );
}

/**
 * Excludes block comments from the admin comments query.
 *
 * This function modifies the comments query to exclude comments of type 'block_comment'
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
			$clauses['where'] .= " AND {$wpdb->comments}.comment_type != 'block_comment'";
		}

		return $clauses;
	}
	add_action( 'comments_clauses', 'exclude_block_comments_from_admin', 10, 2 );
}

/**
 * Filter the comment count query to exclude block_comment type comments.
 *
 * @param string $query The SQL query string.
 * @return string The modified SQL query string.
 */
function gutenberg_filter_comment_count_query_exclude_block_comments( $query ) {
	// Adjust the query if it is a comment count query.
	if ( str_starts_with( $query, 'SELECT comment_post_ID, COUNT(comment_ID) as num_comments FROM' ) && str_contains( $query, 'comment_approved' ) ) {
		if ( ! str_contains( $query, "comment_type != 'block_comment'" ) ) {
			$query = str_replace( 'comment_approved', "comment_type != 'block_comment' AND comment_approved", $query );
		}
	}
	return $query;
}
add_filter( 'query', 'gutenberg_filter_comment_count_query_exclude_block_comments' );

if ( ! class_exists( 'WP_List_Table' ) ) {
	require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

if ( ! class_exists( 'WP_Posts_List_Table' ) ) {
		require_once ABSPATH . 'wp-admin/includes/class-wp-posts-list-table.php';
}

class Custom_WP_Posts_List_Table extends WP_Posts_List_Table {
	public function column_title( $post ) {
		// This code is copied from WP_Posts_List_Table and modified to add the avatar images.
		global $mode;

		if ( $this->hierarchical_display ) {
			if ( 0 === $this->current_level && (int) $post->post_parent > 0 ) {
				// Sent level 0 by accident, by default, or because we don't know the actual level.
				$find_main_page = (int) $post->post_parent;

				while ( $find_main_page > 0 ) {
					$parent = get_post( $find_main_page );

					if ( is_null( $parent ) ) {
						break;
					}

					++$this->current_level;
					$find_main_page = (int) $parent->post_parent;

					if ( ! isset( $parent_name ) ) {
						/** This filter is documented in wp-includes/post-template.php */
						$parent_name = apply_filters( 'the_title', $parent->post_title, $parent->ID );
					}
				}
			}
		}

		$can_edit_post = current_user_can( 'edit_post', $post->ID );

		if ( $can_edit_post && 'trash' !== $post->post_status ) {
			$lock_holder = wp_check_post_lock( $post->ID );

			if ( $lock_holder ) {
				$lock_holder   = get_userdata( $lock_holder );
				$locked_avatar = get_avatar( $lock_holder->ID, 18 );
				/* translators: %s: User's display name. */
				$locked_text = esc_html( sprintf( __( '%s is currently editing' ), $lock_holder->display_name ) );
			} else {
				$locked_avatar = '';
				$locked_text   = '';
			}

			echo '<div class="locked-info"><span class="locked-avatar">' . $locked_avatar . '</span> <span class="locked-text">' . $locked_text . "</span></div>\n";
		}

		$pad = str_repeat( '&#8212; ', $this->current_level );
		echo '<strong>';

		$title = _draft_or_post_title();

		if ( $can_edit_post && 'trash' !== $post->post_status ) {
			printf(
				'<a class="row-title" href="%s" aria-label="%s">%s%s</a>',
				get_edit_post_link( $post->ID ),
				/* translators: %s: Post title. */
				esc_attr( sprintf( __( '&#8220;%s&#8221; (Edit)' ), $title ) ),
				$pad,
				$title
			);
		} else {
			printf(
				'<span>%s%s</span>',
				$pad,
				$title
			);
		}
		_post_states( $post );

		// This line is the only difference from the core code.
		gutenberg_comment_indicator_avatars( $post );

		if ( isset( $parent_name ) ) {
			$post_type_object = get_post_type_object( $post->post_type );
			echo ' | ' . $post_type_object->labels->parent_item_colon . ' ' . esc_html( $parent_name );
		}

		echo "</strong>\n";

		if ( 'excerpt' === $mode
			&& ! is_post_type_hierarchical( $this->screen->post_type )
			&& current_user_can( 'read_post', $post->ID )
		) {
			if ( post_password_required( $post ) ) {
				echo '<span class="protected-post-excerpt">' . esc_html( get_the_excerpt() ) . '</span>';
			} else {
				echo esc_html( get_the_excerpt() );
			}
		}

		/** This filter is documented in wp-admin/includes/class-wp-posts-list-table.php */
		$quick_edit_enabled = apply_filters( 'quick_edit_enabled_for_post_type', true, $post->post_type );

		if ( $quick_edit_enabled ) {
			get_inline_data( $post );
		}
	}
}

function use_custom_posts_list_table( $class_name ) {
	if ( 'WP_Posts_List_Table' === $class_name  ) {
		return 'Custom_WP_Posts_List_Table';
	}
	return $class_name;
}
add_filter( 'wp_list_table_class_name', 'use_custom_posts_list_table' );

/**
 * Function to output the avatar HTML for a post ID.
 *
 * @param int $post The post object.
 * @return void
 */
function gutenberg_comment_indicator_avatars( $post ) {
	$unresolved_comments = get_comments(
		array(
			'post_id'  => $post->ID,
			'type'     => 'block_comment',
			'status'   => 'hold',
			'per_page' => 100,
		)
	);

	// Show indicator for any post with unresolved comments.
	if ( count( $unresolved_comments ) > 0 ) {
		$maxAvatars = 3;
		$count = $maxAvatars;
		echo "<div class='comment-avatar-stack' title='" . esc_attr__( 'This post has open discussions', 'gutenberg' ) . "'>";
		foreach ( $unresolved_comments as $comment ) {
			if ( $count-- <= 0 ) {
				break;
			}
			$gravatar_params = array(
				'size' => 18,
				'',
			);
			$avatar_urls = get_avatar_url( $comment->user_id, $gravatar_params );
			echo "<img class='comment-avatar' src='" . esc_url( $avatar_urls ) . "' />";
		}

		// Add an overflow indicator if there are more avatars than the max.
		if ( count( $unresolved_comments ) > $maxAvatars ) {
			if ( count( $unresolved_comments ) >= 100 ) {
				$overflow = '100+';
			} else {
				$overflow = "+" . ( count( $unresolved_comments ) - $maxAvatars );
			}
			echo "<span class='comment-avatar-overflow'> " . esc_html( $overflow ) . ' </span>';
		}
		echo '</div>';
	}
}

/**
 * Add some label styles on the post list table.
 */
function gutenberg_add_open_discussion_label_styles() {
	$screen = get_current_screen();
	if ( 'edit-post' === $screen->id || 'edit-page' === $screen->id ) {
		?>
	<style>
		.comment-avatar-stack {
			display: inline-flex;
			align-items: center;
			vertical-align: middle;
			padding-left: 6px;
		}
		.comment-avatar{
			margin-left: -6px;
			border: 2px solid #fff;
			border-radius: 50%;
			flex-shrink: 0;
			height: 22px;
			width: 22px;
			padding: 1px;
			background: #fff;
		}
		.comment-avatar:first-child{
			border-color: rgb(159, 177, 255);
			margin-left: 0;
			z-index: 3;
		}
		.comment-avatar:nth-child(2){
			border-color: rgb(122, 0, 223);
			z-index: 2;
		}
		.comment-avatar:nth-child(3){
			border-color: rgb(255, 249, 114);
			z-index: 1;
		}
		.comment-avatar-overflow {
			align-items:center;
			display:flex;
			flex-shrink:0;
			height:22px;
			justify-content:center;
			margin-left: -4px;
			padding:0 4px;
			width:fit-content;
		}
	</style>
		<?php
	}
}
add_action( 'admin_footer', 'gutenberg_add_open_discussion_label_styles' );
