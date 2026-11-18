<?php
/**
 * Notes changes for WordPress 7.2.
 *
 * `wp_trash_comment()` also trashes the child notes of a top-level note, but
 * `wp_untrash_comment()` has no counterpart. Following `wp_trash_post_comments()`
 * and `wp_untrash_post_comments()`, the IDs of the child notes trashed along
 * with the parent note are stored in the parent's meta, and only those still in
 * the trash are restored with it, so a child note the user trashed on its own
 * beforehand stays in the trash.
 *
 * @see https://github.com/WordPress/gutenberg/issues/84099
 */

/**
 * Records the child notes about to be trashed along with a top-level note.
 *
 * Core fires `trashed_comment` before it trashes the children, so every child
 * not yet in the trash at this point is one trashed along with the parent.
 *
 * @param string $comment_id The comment ID as a numeric string.
 */
function gutenberg_record_note_children_trashed_with_parent( $comment_id ) {
	$comment = get_comment( $comment_id );
	if ( ! $comment instanceof WP_Comment || 'note' !== $comment->comment_type || 0 !== (int) $comment->comment_parent ) {
		return;
	}

	// Clear any list left over from an earlier trash of this note.
	delete_comment_meta( $comment->comment_ID, '_wp_trash_meta_children' );

	$children = $comment->get_children(
		array(
			'fields' => 'ids',
			'status' => 'all',
			'type'   => 'note',
		)
	);

	$children = array_values(
		array_filter(
			array_map( 'intval', $children ),
			static function ( $child_id ) {
				return 'trash' !== wp_get_comment_status( $child_id );
			}
		)
	);

	if ( $children ) {
		add_comment_meta( $comment->comment_ID, '_wp_trash_meta_children', $children );
	}
}
add_action( 'trashed_comment', 'gutenberg_record_note_children_trashed_with_parent' );

/**
 * Restores the child notes trashed along with a top-level note.
 *
 * A recorded child no longer in the trash, such as one restored on its own in
 * the meantime, is skipped so that its current status is kept.
 *
 * @param string $comment_id The comment ID as a numeric string.
 */
function gutenberg_untrash_note_children_trashed_with_parent( $comment_id ) {
	$comment = get_comment( $comment_id );
	if ( ! $comment instanceof WP_Comment || 'note' !== $comment->comment_type || 0 !== (int) $comment->comment_parent ) {
		return;
	}

	$children = get_comment_meta( $comment->comment_ID, '_wp_trash_meta_children', true );
	// The list is only needed for this restore.
	delete_comment_meta( $comment->comment_ID, '_wp_trash_meta_children' );

	if ( ! is_array( $children ) ) {
		return;
	}

	foreach ( $children as $child_id ) {
		$child = get_comment( (int) $child_id );
		if (
			! $child instanceof WP_Comment ||
			'note' !== $child->comment_type ||
			(int) $child->comment_parent !== (int) $comment->comment_ID ||
			'trash' !== wp_get_comment_status( $child )
		) {
			continue;
		}

		wp_untrash_comment( $child->comment_ID );
	}
}
add_action( 'untrashed_comment', 'gutenberg_untrash_note_children_trashed_with_parent' );
