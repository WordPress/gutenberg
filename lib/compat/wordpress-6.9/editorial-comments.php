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
	error_log('Adding editorial comments submenu');
	add_submenu_page(
		'edit-comments.php',
		__( 'Editorial Comments', 'gutenberg' ),
		__( 'Editorial Comments', 'gutenberg' ),
		'edit_posts',
		admin_url( 'edit-comments.php?comment_type=block_comment' ),
		'',
	);
}
add_action( 'admin_menu', 'gutenberg_add_editorial_comments_submenu' );