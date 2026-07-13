<?php

add_action( 'init', function () {
	register_meta(
		'user',
		'viewed_notes',
		array(
			'single'        => true,
			'type'          => 'object',
			'show_in_rest'  => array(
				'schema' => array(
					'type'                 => 'object',
					// Keys are post ids (as strings); values are arrays of
					// note/reply ids the user has seen for that post.
					'additionalProperties' => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
				),
			),
			'auth_callback' => function () {
				return true;
			},
		)
	);
} );