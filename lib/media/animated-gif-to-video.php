<?php
/**
 * Animated GIF → video: link companion attachments and swap at render time.
 *
 * When client-side media processing is enabled, an uploaded animated GIF is
 * uploaded normally as an image attachment *and* a companion video attachment
 * (MP4/WebM) is generated from it (see `@wordpress/upload-media`). Both
 * uploads carry a shared `animated_gif_pair_token` so the two attachments can
 * be linked server-side:
 *
 * - `_animated_video_id`      on the GIF image  → companion video attachment ID
 * - `_animated_gif_image_id`  on the video      → originating GIF attachment ID
 *
 * The editor keeps showing the GIF as a normal `core/image` block. On the
 * front end, every `<img>` that resolves to a GIF with a linked video is
 * swapped for a GIF-behaving `<video>` (muted, looping, autoplaying, inline,
 * no controls) via the `wp_content_img_tag` filter — which runs inside
 * `wp_filter_content_tags()` and therefore covers post content, block widgets
 * and excerpts (Image, Gallery, Media & Text, Cover, etc.).
 *
 * @package gutenberg
 */

/**
 * Links an animated GIF image attachment to its companion video attachment.
 *
 * Runs after a REST attachment insert. The two halves of a pair can arrive in
 * either order (the video is transcoded client-side and usually finishes
 * later), so linking happens whenever the *second* half appears.
 *
 * @param WP_Post         $attachment The inserted attachment post.
 * @param WP_REST_Request $request    The request used to insert the attachment.
 */
function gutenberg_link_animated_gif_video( $attachment, $request ): void {
	$token = $request['animated_gif_pair_token'];

	if ( ! is_string( $token ) || '' === $token ) {
		return;
	}

	$new_id = (int) $attachment->ID;

	update_post_meta( $new_id, '_animated_gif_pair_token', $token );

	$partners = get_posts(
		array(
			'post_type'        => 'attachment',
			'post_status'      => 'inherit',
			'posts_per_page'   => 1,
			'fields'           => 'ids',
			'post__not_in'     => array( $new_id ),
			'meta_key'         => '_animated_gif_pair_token', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value'       => $token, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			'no_found_rows'    => true,
			'suppress_filters' => false,
		)
	);

	if ( empty( $partners ) ) {
		return;
	}

	$partner_id = (int) $partners[0];

	if ( wp_attachment_is( 'video', $new_id ) ) {
		$video_id = $new_id;
		$image_id = $partner_id;
	} else {
		$image_id = $new_id;
		$video_id = $partner_id;
	}

	update_post_meta( $image_id, '_animated_video_id', $video_id );
	update_post_meta( $video_id, '_animated_gif_image_id', $image_id );
}

add_action( 'rest_after_insert_attachment', 'gutenberg_link_animated_gif_video', 10, 2 );

/**
 * Swaps a GIF `<img>` for a GIF-behaving `<video>` when a companion video
 * attachment is linked.
 *
 * @param string $filtered_image The `<img>` tag HTML.
 * @param string $context        Context (e.g. 'the_content').
 * @param int    $attachment_id  The image attachment ID, or 0 if unknown.
 * @return string The `<video>` tag HTML, or the unchanged `<img>`.
 */
function gutenberg_swap_animated_gif_for_video( string $filtered_image, string $context, int $attachment_id ): string {
	if ( ! $attachment_id ) {
		return $filtered_image;
	}

	$video_id = (int) get_post_meta( $attachment_id, '_animated_video_id', true );

	if ( ! $video_id || ! wp_attachment_is( 'video', $video_id ) ) {
		return $filtered_image;
	}

	/**
	 * Filters whether a linked animated GIF should be swapped for its
	 * companion video at render time.
	 *
	 * Returning false leaves the original `<img>` untouched, allowing
	 * developers to keep specific GIFs as GIFs on a per-image basis
	 * (e.g. based on the attachment, the rendering context, or where the
	 * image appears on the site).
	 *
	 * @since 23.3.0
	 *
	 * @param bool   $swap          Whether to perform the swap. Default true.
	 * @param int    $attachment_id The GIF image attachment ID.
	 * @param int    $video_id      The linked companion video attachment ID.
	 * @param string $context       Context the image is rendered in (e.g. 'the_content').
	 */
	$swap = apply_filters(
		'gutenberg_swap_animated_gif_for_video',
		true,
		$attachment_id,
		$video_id,
		$context
	);

	if ( ! $swap ) {
		return $filtered_image;
	}

	$video_url = wp_get_attachment_url( $video_id );

	if ( ! $video_url ) {
		return $filtered_image;
	}

	// Carry over presentational attributes from the original <img> so the
	// video keeps the block's sizing, alignment classes and accessible name.
	$processor = new WP_HTML_Tag_Processor( $filtered_image );

	if ( ! $processor->next_tag( 'IMG' ) ) {
		return $filtered_image;
	}

	$class  = $processor->get_attribute( 'class' );
	$style  = $processor->get_attribute( 'style' );
	$width  = $processor->get_attribute( 'width' );
	$height = $processor->get_attribute( 'height' );
	$alt    = $processor->get_attribute( 'alt' );
	$src    = $processor->get_attribute( 'src' );

	$attributes = 'autoplay loop muted playsinline';

	if ( is_string( $class ) && '' !== $class ) {
		$attributes .= sprintf( ' class="%s"', esc_attr( $class ) );
	}
	if ( is_string( $style ) && '' !== $style ) {
		$attributes .= sprintf( ' style="%s"', esc_attr( $style ) );
	}
	if ( is_string( $width ) && '' !== $width ) {
		$attributes .= sprintf( ' width="%s"', esc_attr( $width ) );
	}
	if ( is_string( $height ) && '' !== $height ) {
		$attributes .= sprintf( ' height="%s"', esc_attr( $height ) );
	}
	if ( is_string( $alt ) && '' !== $alt ) {
		$attributes .= sprintf( ' aria-label="%s"', esc_attr( $alt ) );
	}
	// Show the still GIF until the video is ready to avoid a blank frame.
	if ( is_string( $src ) && '' !== $src ) {
		$attributes .= sprintf( ' poster="%s"', esc_url( $src ) );
	}

	return sprintf(
		'<video %1$s><source src="%2$s" type="%3$s" /></video>',
		$attributes,
		esc_url( $video_url ),
		esc_attr( get_post_mime_type( $video_id ) )
	);
}

add_filter( 'wp_content_img_tag', 'gutenberg_swap_animated_gif_for_video', 10, 3 );

/**
 * Keeps the GIF ↔ video link consistent when either attachment is deleted.
 *
 * - Deleting the GIF image also deletes its auto-generated companion video
 *   (the video is not independently managed by the user).
 * - Deleting the video clears the dangling `_animated_video_id` on the GIF so
 *   it falls back to rendering as a normal image.
 *
 * @param int $post_id Attachment ID being deleted.
 */
function gutenberg_cleanup_animated_gif_video( int $post_id ): void {
	static $deleting = array();

	if ( isset( $deleting[ $post_id ] ) ) {
		return;
	}

	$video_id = (int) get_post_meta( $post_id, '_animated_video_id', true );

	if ( $video_id ) {
		$deleting[ $post_id ] = true;
		delete_post_meta( $post_id, '_animated_video_id' );

		if ( ! isset( $deleting[ $video_id ] ) && get_post( $video_id ) ) {
			$deleting[ $video_id ] = true;
			wp_delete_attachment( $video_id, true );
		}

		return;
	}

	$image_id = (int) get_post_meta( $post_id, '_animated_gif_image_id', true );

	if ( $image_id && ! isset( $deleting[ $image_id ] ) ) {
		delete_post_meta( $image_id, '_animated_video_id' );
	}
}

add_action( 'delete_attachment', 'gutenberg_cleanup_animated_gif_video' );
