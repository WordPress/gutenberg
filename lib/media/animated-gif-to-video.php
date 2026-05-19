<?php
/**
 * Animated GIF → video: swap the GIF for its companion video at render time.
 *
 * When client-side media processing is enabled, an uploaded animated GIF is
 * stored as a normal image attachment (it stays a single media library item).
 * The GIF is also transcoded to a video (MP4/WebM) which is sideloaded as a
 * *companion file* of that same attachment — like the HEIC original — and
 * recorded in the attachment metadata under the `animated_video` key. It is
 * never a separate attachment.
 *
 * The editor keeps showing the GIF as a normal `core/image` block. On the
 * front end, every `<img>` that resolves to a GIF with a companion video is
 * swapped for a GIF-behaving `<video>` (muted, looping, autoplaying, inline,
 * no controls) via the `wp_content_img_tag` filter — which runs inside
 * `wp_filter_content_tags()` and therefore covers post content, block widgets
 * and excerpts (Image, Gallery, Media & Text, Cover, etc.).
 *
 * @package gutenberg
 */

/**
 * Returns the absolute path to an attachment's companion video, if any.
 *
 * The path is rebuilt from the attachment's own (trusted) directory plus the
 * recorded basename, so the stored metadata cannot point anywhere else.
 *
 * @param int $attachment_id Attachment ID.
 * @return string|null Absolute file path, or null when there is no companion.
 */
function gutenberg_get_animated_gif_video_path( int $attachment_id ): ?string {
	$metadata = wp_get_attachment_metadata( $attachment_id, true );

	if ( empty( $metadata['animated_video'] ) || ! is_string( $metadata['animated_video'] ) ) {
		return null;
	}

	// Only ever trust the basename of the recorded value; strip any path
	// components so the metadata can't reference another directory.
	$name = wp_basename( $metadata['animated_video'] );

	if ( '' === $name ) {
		return null;
	}

	$attached_file = get_attached_file( $attachment_id, true );

	if ( ! $attached_file ) {
		return null;
	}

	return path_join( dirname( $attached_file ), $name );
}

/**
 * Swaps a GIF `<img>` for a GIF-behaving `<video>` when a companion video
 * has been generated for the attachment.
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

	$video_path = gutenberg_get_animated_gif_video_path( $attachment_id );

	if ( ! $video_path || ! file_exists( $video_path ) ) {
		return $filtered_image;
	}

	$attachment_url = wp_get_attachment_url( $attachment_id );

	if ( ! $attachment_url ) {
		return $filtered_image;
	}

	$video_name = wp_basename( $video_path );
	$video_url  = trailingslashit( dirname( $attachment_url ) ) . $video_name;
	$video_mime = wp_check_filetype( $video_name )['type'];

	if ( ! $video_mime ) {
		return $filtered_image;
	}

	/**
	 * Filters whether a GIF should be swapped for its companion video at
	 * render time.
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
	 * @param string $video_url     URL of the companion video.
	 * @param string $context       Context the image is rendered in (e.g. 'the_content').
	 */
	$swap = apply_filters(
		'gutenberg_swap_animated_gif_for_video',
		true,
		$attachment_id,
		$video_url,
		$context
	);

	if ( ! $swap ) {
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
		esc_attr( $video_mime )
	);
}

add_filter( 'wp_content_img_tag', 'gutenberg_swap_animated_gif_for_video', 10, 3 );

/**
 * Deletes the companion video file when its GIF attachment is deleted.
 *
 * The video is sideloaded next to the GIF and recorded in
 * $metadata['animated_video']. WordPress core's wp_delete_attachment_files()
 * does not know about it, so without this hook the video would linger on
 * disk after the attachment is deleted.
 *
 * The path is rebuilt from the attachment's own directory plus the recorded
 * basename, then confirmed to resolve inside the uploads directory and to be
 * a regular file, so this can only ever delete the sideloaded companion.
 *
 * @param int $post_id Attachment ID being deleted.
 */
function gutenberg_delete_animated_gif_video( int $post_id ): void {
	$video_path = gutenberg_get_animated_gif_video_path( $post_id );

	if ( ! $video_path || ! file_exists( $video_path ) ) {
		return;
	}

	$real_path = realpath( $video_path );

	if ( ! $real_path || ! is_file( $real_path ) ) {
		return;
	}

	$uploads  = wp_get_upload_dir();
	$base_dir = empty( $uploads['error'] ) ? realpath( $uploads['basedir'] ) : false;

	if ( ! $base_dir ) {
		return;
	}

	// Must resolve to a regular file strictly inside the uploads directory.
	if ( ! str_starts_with( $real_path, $base_dir . DIRECTORY_SEPARATOR ) ) {
		return;
	}

	wp_delete_file( $real_path );
}

add_action( 'delete_attachment', 'gutenberg_delete_animated_gif_video' );
