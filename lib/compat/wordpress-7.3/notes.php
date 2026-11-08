<?php
/**
 * Notes changes for WordPress 7.3.
 *
 * @package gutenberg
 */

/**
 * Registers the note meta holding a snapshot of the blocks a note was added to.
 *
 * A note's link to its block, `metadata.noteId` and the inline `core/note`
 * marker, is part of the post content and only persists when the post is
 * saved. The editor stores the blocks as they stood when the note was sent,
 * so a note added to an unsaved post can be re-attached on a later load.
 *
 * @see https://github.com/WordPress/gutenberg/issues/72717
 */
function gutenberg_register_note_anchor_meta(): void {
	register_meta(
		'comment',
		'_wp_note_anchor',
		array(
			'type'          => 'array',
			'description'   => __( 'The blocks the note was added to, as they stood at the time.', 'gutenberg' ),
			'single'        => true,
			'show_in_rest'  => array(
				'schema' => array(
					'type'  => 'array',
					'items' => array(
						'type'                 => 'object',
						'properties'           => array(
							'path'    => array(
								'type'  => 'array',
								'items' => array( 'type' => 'integer' ),
							),
							'content' => array( 'type' => 'string' ),
						),
						'additionalProperties' => false,
					),
				),
			),
			'auth_callback' => function ( $allowed, $meta_key, $object_id ) {
				return current_user_can( 'edit_comment', $object_id );
			},
		)
	);
}
add_action( 'init', 'gutenberg_register_note_anchor_meta' );

/**
 * Collects the note ids the blocks link to, through `metadata.noteId`.
 *
 * @param mixed[] $blocks Parsed blocks.
 * @return int[] Note ids.
 */
function gutenberg_get_note_ids_from_blocks( array $blocks ): array {
	$note_ids = array();
	foreach ( $blocks as $block ) {
		if ( ! is_array( $block ) ) {
			continue;
		}
		$metadata = is_array( $block['attrs'] ?? null ) ? ( $block['attrs']['metadata'] ?? null ) : null;
		$ids      = is_array( $metadata ) ? ( $metadata['noteId'] ?? null ) : null;
		foreach ( (array) $ids as $id ) {
			if ( is_numeric( $id ) ) {
				$note_ids[] = (int) $id;
			}
		}
		if ( is_array( $block['innerBlocks'] ?? null ) ) {
			$note_ids = array_merge( $note_ids, gutenberg_get_note_ids_from_blocks( $block['innerBlocks'] ) );
		}
	}
	return $note_ids;
}

/**
 * Deletes the snapshots of the notes a saved post links to, which the post
 * now persists itself. Notes the saved content doesn't link to keep theirs,
 * since another user may have saved content from before they were added.
 *
 * @param int     $post_id Post ID.
 * @param WP_Post $post    Post object.
 * @param bool    $update  Whether this is an existing post being updated.
 */
function gutenberg_delete_persisted_note_anchors( $post_id, $post, $update ): void {
	if ( ! $update || 'revision' === $post->post_type ) {
		return;
	}
	$note_ids = get_comments(
		array(
			'post_id'  => $post_id,
			'type'     => 'note',
			'parent'   => 0,
			'meta_key' => '_wp_note_anchor',
			'fields'   => 'ids',
		)
	);
	if ( ! is_array( $note_ids ) || ! $note_ids ) {
		return;
	}
	$linked = gutenberg_get_note_ids_from_blocks( parse_blocks( $post->post_content ) );
	foreach ( $note_ids as $note_id ) {
		$note_id = (int) $note_id;
		if ( $note_id > 0 && in_array( $note_id, $linked, true ) ) {
			delete_comment_meta( $note_id, '_wp_note_anchor' );
		}
	}
}
add_action( 'wp_after_insert_post', 'gutenberg_delete_persisted_note_anchors', 10, 3 );
