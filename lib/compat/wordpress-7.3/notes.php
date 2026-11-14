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
			'type'              => 'array',
			'description'       => __( 'The blocks the note was added to, as they stood at the time.', 'gutenberg' ),
			'single'            => true,
			'show_in_rest'      => array(
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
			'sanitize_callback' => 'gutenberg_sanitize_note_anchor',
			'auth_callback'     => function ( $allowed, $meta_key, $object_id ) {
				return current_user_can( 'edit_comment', $object_id );
			},
		)
	);
}
add_action( 'init', 'gutenberg_register_note_anchor_meta' );

/**
 * Sanitizes the `_wp_note_anchor` meta value.
 *
 * The snapshot is block markup, so it gets the same KSES filtering as post
 * content for users who can't post unfiltered HTML.
 *
 * @param mixed $value Meta value.
 * @return list<array{path: list<int>, content: string}> Sanitized snapshot.
 */
function gutenberg_sanitize_note_anchor( $value ): array {
	if ( ! is_array( $value ) ) {
		return array();
	}

	$anchors = array();
	foreach ( $value as $anchor ) {
		if ( ! is_array( $anchor ) || ! is_string( $anchor['content'] ?? null ) || ! is_array( $anchor['path'] ?? null ) ) {
			continue;
		}

		$path = array();
		foreach ( $anchor['path'] as $index ) {
			if ( is_numeric( $index ) ) {
				$path[] = absint( $index );
			}
		}

		$content = $anchor['content'];
		if ( ! current_user_can( 'unfiltered_html' ) ) {
			$content = wp_kses_post( $content );
		}

		$anchors[] = array(
			'path'    => $path,
			'content' => $content,
		);
	}
	return $anchors;
}

/**
 * Deletes the snapshots of the notes a saved post links to, which the post
 * now persists itself. Notes the saved content doesn't link to keep theirs,
 * since another user may have saved content from before they were added.
 *
 * @param int     $post_id Post ID.
 * @param WP_Post $post    Post object.
 */
function gutenberg_delete_persisted_note_anchors( $post_id, $post ): void {
	$blocks   = parse_blocks( $post->post_content );
	$note_ids = array();
	foreach ( _flatten_blocks( $blocks ) as $block ) {
		$ids = is_array( $block ) ? _wp_array_get( $block, array( 'attrs', 'metadata', 'noteId' ), array() ) : array();
		foreach ( (array) $ids as $id ) {
			if ( is_numeric( $id ) ) {
				$note_ids[] = (int) $id;
			}
		}
	}
	if ( ! $note_ids ) {
		return;
	}

	$snapshot_ids = get_comments(
		array(
			'post_id'     => $post_id,
			'type'        => 'note',
			'comment__in' => $note_ids,
			'meta_key'    => '_wp_note_anchor',
			'fields'      => 'ids',
		)
	);
	foreach ( array_filter( $snapshot_ids ) as $note_id ) {
		delete_comment_meta( $note_id, '_wp_note_anchor' );
	}
}
add_action( 'wp_after_insert_post', 'gutenberg_delete_persisted_note_anchors', 10, 2 );
