<?php
/**
 * Registers comment metadata for emoji reactions.
 *
 * @since 7.0.0
 */
function gutenberg_register_block_comment_reaction_metadata() {
	register_meta(
		'comment',
		'_wp_note_reactions',
		array(
			'type'          => 'object',
			'description'   => __( 'Emoji reactions', 'gutenberg' ),
			'single'        => true,
			'default'       => array(),
			'show_in_rest'  => array(
				'schema' => array(
					'type'                 => 'object',
					'additionalProperties' => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'userId' => array(
									'type' => 'integer',
								),
								'date'   => array(
									'type'   => array( 'string', 'null' ),
									'format' => 'date-time',
								),
							),
						),
					),
				),
			),
			'auth_callback' => function ( $allowed, $meta_key, $object_id ) {
				return current_user_can( 'edit_comment', $object_id );
			},
		)
	);
}
add_action( 'init', 'gutenberg_register_block_comment_reaction_metadata' );
