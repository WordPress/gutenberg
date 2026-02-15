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

/**
 * Returns the default emoji list for note reactions, filterable via the
 * 'note_reaction_emojis' hook.
 *
 * Each emoji definition requires:
 *   - 'emoji' (string) The emoji character.
 *   - 'label' (string) Human-readable label.
 *   - 'value' (string) Storage slug used as the database key.
 *
 * @since 7.0.0
 *
 * @return array[] Array of emoji definitions.
 */
function gutenberg_get_note_reaction_emojis() {
	$default_emojis = array(
		array(
			'emoji' => '❤️',
			'label' => __( 'Heart', 'gutenberg' ),
			'value' => 'heart',
		),
		array(
			'emoji' => '🎉',
			'label' => __( 'Celebration', 'gutenberg' ),
			'value' => 'celebration',
		),
		array(
			'emoji' => '😄',
			'label' => __( 'Smile', 'gutenberg' ),
			'value' => 'smile',
		),
		array(
			'emoji' => '👀',
			'label' => __( 'Eyes', 'gutenberg' ),
			'value' => 'eyes',
		),
		array(
			'emoji' => '🚀',
			'label' => __( 'Rocket', 'gutenberg' ),
			'value' => 'rocket',
		),
	);

	/**
	 * Filters the list of emoji available for note reactions.
	 *
	 * Each emoji requires an 'emoji' (character), 'label' (human-readable),
	 * and 'value' (storage slug).
	 *
	 * @since 7.0.0
	 *
	 * @param array[] $emojis Array of emoji definitions.
	 */
	return apply_filters( 'note_reaction_emojis', $default_emojis );
}
