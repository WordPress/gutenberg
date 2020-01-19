<?php
/**
 * Server-side registration of the `core/post` block.
 *
 * @package WordPress
 */

/**
 * Registers the `core/post` block on the server.
 */
function register_block_core_post() {
	register_block_type(
		'core/post',
		array(
			'attributes' => array(
				'postType' => array(
					'type'    => 'string',
					'context' => true,
				),
				'postId'   => array(
					'type'    => 'string',
					'context' => true,
				),
			),
		)
	);
}
add_action( 'init', 'register_block_core_post' );
