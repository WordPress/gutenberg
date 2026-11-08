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
