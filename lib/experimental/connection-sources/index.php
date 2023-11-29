<?php
/**
 * Connection sources that block attributes can be connected to.
 *
 * @package gutenberg
 */

return array(
	'meta_fields' => function ( $block_instance, $meta_field ) {
		$post_id = get_the_ID();

		// We should probably also check if the meta field exists but for now it's okay because
		// if it doesn't, `get_post_meta()` will just return an empty string.
		return get_post_meta( $post_id, $meta_field, true );
	},
);
