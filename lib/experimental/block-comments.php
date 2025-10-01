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
 * Post List filters
 */


/**
 * Filters for the comments page.
 */



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

global $gutenberg_post_screen_labels;
$gutenberg_post_screen_labels = array();

/**
 * Add an "Open Discussion" label next to the title of posts that have unresolved comments.
 *
 * Filter on `the_title` to add the label. Check that the current post type supports block
 * comments and that there are unresolved comments before adding the label.
 *
 * @param string $title The post title.
 * @param int    $post_id The post ID.
 * @return string The modified post title.
 */
function gutenberg_add_open_discussion_label_to_post_title( $title, $post_id ) {
	global $gutenberg_post_screen_labels;

	if ( ! $post_id || ! function_exists( 'get_current_screen' ) ) {
		return $title;
	}

	$screen = get_current_screen();
	if ( 'edit-post' === $screen->id ) {
		$post = get_post( $post_id );

		if ( $post && gutenberg_check_post_type_supports_block_comments( $post->post_type ) ) {
			$unresolved_comments = get_comments(
				array(
					'post_id' => $post_id,
					'type'    => 'block_comment',
					'status'  => 'hold',
					'count'   => true,
				)
			);
			error_log( "Unresolved comments for post $post_id: $unresolved_comments" );
			if ( $unresolved_comments > 0 ) {
				// Note, we can't use a <span> here because of how WordPress sanitizes titles.
				// Instead, we will insert a JavaScript snippet to add the label after the title.
				// We will insert that script in the admin footer.
				// Add to the array if not already present.
				if ( ! in_array( $post_id, $gutenberg_post_screen_labels, true ) ) {
					array_push( $gutenberg_post_screen_labels, $post_id );
					error_log( "Added post $post_id to the list for open discussion labels." );
				}

			}
		}
	}
	return $title;

}
add_filter( 'the_title', 'gutenberg_add_open_discussion_label_to_post_title', 10, 2 );

function gutenberg_insert_open_discussion_label_scripts()  {
	global $post_id;
	global $gutenberg_post_screen_labels;

	error_log( 'Inserting open discussion label scripts.' );
	error_log( 'Posts to label: ' . implode( ',', $gutenberg_post_screen_labels ) );

	if ( count( $gutenberg_post_screen_labels ) === 0 ) {
		return;
	}
	$script = '';

	/* translators: Label for posts with unresolved comments. */
	$label = __( 'Open Discussion', 'gutenberg' );

	foreach ( $gutenberg_post_screen_labels as $post_id ) {
		$script = '<script>
			document.addEventListener("DOMContentLoaded", function() {
				const titleElement = document.querySelector("a.row-title[href=\'' . get_edit_post_link( $post_id, '' ) . '\']").parentElement;
				if (titleElement) {
					const label = document.createElement("span");
					label.textContent =  ' . wp_json_encode( $label ) . ';
					titleElement.appendChild(label);
					// Add any additional styling or classes to the label if needed.
					label.classList.add("open-discussion-label");
			}
			} );
		</script>';
		echo $script;
	}
	remove_action( 'admin_footer', 'gutenberg_insert_open_discussion_label_scripts' );

}
add_action( 'admin_footer', 'gutenberg_insert_open_discussion_label_scripts' );

/**
 * Add some label styles on the post list table.
 */
function gutenberg_add_open_discussion_label_styles() {
	$screen = get_current_screen();
	if ( 'edit-post' === $screen->id ) {
?>
	<style>
		.open-discussion-label {
			display: inline-block;
			padding: 3px 8px;
			font-size: 12px;
			font-weight: 500;
			line-height: 1;
			border-radius: 12px;
			background-color: #d54e21;
			color: #ffffff;
			margin-left: 8px;
			vertical-align: middle;
		}
		.open-discussion-label:hover {
			background-color: #a6361a;
			cursor: default;
		}
	</style>
<?php

	}
}
add_action( 'admin_footer', 'gutenberg_add_open_discussion_label_styles');
