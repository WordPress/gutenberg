<?php
/**
 * Connection sources that block attributes can be connected to.
 *
 * @package gutenberg
 */

return array(
	'name'               => 'meta',
	'meta_fields'        => function ( $block_instance, $meta_field ) {
		// We should probably also check if the meta field exists but for now it's okay because
		// if it doesn't, `get_post_meta()` will just return an empty string.
		return get_post_meta( $block_instance->context['postId'], $meta_field, true );
	},
	'pattern_attributes' => function ( $block_instance ) {
		$block_id = $block_instance->attributes['metadata']['id'];
		return _wp_array_get( $block_instance->context, array( 'pattern/overrides', $block_id ), false );
	},
);
