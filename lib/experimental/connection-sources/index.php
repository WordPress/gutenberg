<?php
/**
 * Connection sources that block attributes can be connected to.
 *
 * @package gutenberg
 */

return array(
	'name'        => 'meta',
	'meta_fields' => function ( $block_instance, $meta_field ) {
		global $post;

		// We should probably also check if the meta field exists but for now it's okay because
		// if it doesn't, `get_post_meta()` will just return an empty string.
		return get_post_meta( $post->ID, $meta_field, true );
	},
);
