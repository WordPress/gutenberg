<?php
/**
 * Post Data source for the block bindings.
 *
 * @since 7.0.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

/**
 * Gets value for Post Data source.
 *
 * @since 7.0.0
 * @access private
 *
 * @param mixed    $value          The computed value for the source.
 * @param string   $name           The name of the source.
 * @param array    $source_args    Array containing source arguments used to look up the override value.
 *                                 Example: array( "field" => "foo" ).
 * @param WP_Block $block_instance The block instance.
 * @return mixed The value computed for the source.
 */
function gutenberg_block_bindings_post_data_get_value_for_featured_image( $value, string $name, array $source_args, WP_Block $block_instance ) {
	if ( 'core/post-data' !== $name ) {
		return $value;
	}
	// Return early if we already have a value.
	if ( $value ) {
		return $value;
	}
	// Return early if no field is specified.
	if ( empty( $source_args['field'] ) ) {
		return $value;
	}

	$post_id = $block_instance->context['postId'] ?? null;

	if ( 'featured_media.id' === $source_args['field'] ) {
		return get_post_thumbnail_id( $post_id );
	}

	if ( 'featured_media.url' === $source_args['field'] ) {
		if ( 'core/cover' === $block_instance->name ) {
			$size_slug = $block_instance->attributes['sizeSlug'];
			return get_the_post_thumbnail_url( $post_id, $size_slug );
		}

		return get_the_post_thumbnail_url( $post_id );
	}
}
add_action( 'block_bindings_source_value', 'gutenberg_block_bindings_post_data_get_value_for_featured_image', 10, 4 );
