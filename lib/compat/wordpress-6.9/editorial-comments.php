<?php
/**
 * Use the 'admin_comment_types_dropdown' filter to add Editorial Comments to the comment type dropdown.
 */
function gutenberg_add_editorial_comments_to_comment_type_dropdown( $types ) {
	$types['block_comment'] = __( 'Editorial Comments', 'gutenberg' );
	return $types;
}
add_filter( 'admin_comment_types_dropdown', 'gutenberg_add_editorial_comments_to_comment_type_dropdown' );

/**
 * Add a submenu item under "Comments" for "Editorial Comments". This screen shows comments with the "block_comment" type.
 */
function gutenberg_add_editorial_comments_submenu() {
	error_log( 'Adding editorial comments submenu' );
	add_submenu_page(
		'edit-comments.php',
		__( 'Editorial Comments', 'gutenberg' ),
		__( 'Editorial Comments', 'gutenberg' ),
		'edit_posts',
		admin_url( 'edit-comments.php?comment_type=block_comment' ),
		''
	);
}
add_action( 'admin_menu', 'gutenberg_add_editorial_comments_submenu' );

/**
 * Use the `comment_status_links` filter to remove non-applicable options Spam and Trash.
 *
 * Also, rename "Pending" to "Open" and "Approved" to "Resolved" for editorial comments.
 *
 * @param array $status_links The existing status links.
 * @return array The modified status links.
 */
function gutenberg_filter_editorial_comments_status_links( $status_links ) {
	if ( isset( $_GET['comment_type'] ) && 'block_comment' === $_GET['comment_type'] ) {
		unset( $status_links['spam'] );
		unset( $status_links['trash'] );
	}
	if ( isset( $status_links['moderated'] ) ) {
		$status_links['moderated'] = str_replace( __( 'Pending' ), __( 'Open', 'gutenberg' ), $status_links['moderated'] );
	}
	if ( isset( $status_links['approved'] ) ) {
		$status_links['approved'] = str_replace( __( 'Approved' ), __( 'Resolved', 'gutenberg' ), $status_links['approved'] );
	}
	return $status_links;
}
add_filter( 'comment_status_links', 'gutenberg_filter_editorial_comments_status_links' );


/**
 * Adjust the bulk edit options on the comments screen when the comment type is block_comment.
 *
 * The options should be Resolve (approve), Reopen (unapprove), and Delete.
 * @param array $bulk_actions The existing bulk actions.
 * @return array The modified bulk actions.
 *
 */
function gutenberg_filter_editorial_comments_bulk_actions( $bulk_actions ) {
	if ( isset( $_GET['comment_type'] ) && 'block_comment' === $_GET['comment_type'] ) {
		$bulk_actions = array(
			'approve'   => __( 'Resolve', 'gutenberg' ),
			'unapprove' => __( 'Reopen', 'gutenberg' ),
			'delete'    => __( 'Delete', 'gutenberg' ),
		);
	}
	return $bulk_actions;
}
add_filter( 'bulk_actions-edit-comments', 'gutenberg_filter_editorial_comments_bulk_actions' );
