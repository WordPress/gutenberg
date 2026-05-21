<?php
/**
 * Featured media data model for non-image types.
 *
 * @package gutenberg
 * @since 7.1.0
 */

/**
 * Registers post meta for non-image featured media.
 *
 * A post has either an image (in `_thumbnail_id`) or a single non-image
 * attachment in `_featured_media_id` with its slug in `_featured_media_type`.
 * The picker clears whichever slot is not being chosen, so the schema
 * enforces the "one featured media" invariant.
 *
 * Scoped to post types that declare `'thumbnail'` support. Writes are gated
 * on the per-post `edit_post` capability, mirroring
 * `_wp_check_thumbnail_meta_cap`.
 *
 * @since 7.1.0
 */
function gutenberg_register_featured_media_post_meta() {
	$auth_callback = static function ( $allowed, $meta_key, $object_id ) {
		return current_user_can( 'edit_post', $object_id );
	};

	$post_types = get_post_types( array( 'show_in_rest' => true ) );
	foreach ( $post_types as $post_type ) {
		if ( ! post_type_supports( $post_type, 'thumbnail' ) ) {
			continue;
		}

		register_post_meta(
			$post_type,
			'_featured_media_id',
			array(
				'type'          => 'integer',
				'single'        => true,
				'show_in_rest'  => true,
				'default'       => 0,
				'auth_callback' => $auth_callback,
			)
		);

		register_post_meta(
			$post_type,
			'_featured_media_type',
			array(
				'type'          => 'string',
				'single'        => true,
				'show_in_rest'  => array(
					'schema' => array(
						'type' => 'string',
						'enum' => array( '', 'video', 'audio' ),
					),
				),
				'default'       => '',
				'auth_callback' => $auth_callback,
			)
		);
	}
}
add_action( 'init', 'gutenberg_register_featured_media_post_meta', 20 );

if ( ! function_exists( 'get_post_featured_media' ) ) {
	/**
	 * Retrieves the featured media (image, video, or audio) for a post.
	 *
	 * @since 7.1.0
	 *
	 * @param int|WP_Post|null $post Optional. Post ID or post object. Default global $post.
	 * @return array|null {
	 *     Featured media data, or null when no featured media is set.
	 *
	 *     @type int    $id   The attachment ID.
	 *     @type string $type The media type: 'image', 'video', or 'audio'.
	 * }
	 */
	function get_post_featured_media( $post = null ) {
		$post = get_post( $post );
		if ( ! $post ) {
			return null;
		}

		$thumbnail_id = (int) get_post_thumbnail_id( $post );
		if ( $thumbnail_id ) {
			return array(
				'id'   => $thumbnail_id,
				'type' => 'image',
			);
		}

		$media_id = (int) get_post_meta( $post->ID, '_featured_media_id', true );
		if ( ! $media_id ) {
			return null;
		}

		$type = (string) get_post_meta( $post->ID, '_featured_media_type', true );
		return array(
			'id'   => $media_id,
			'type' => '' === $type ? 'image' : $type,
		);
	}
}
