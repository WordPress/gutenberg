<?php
/**
 * Animated GIF → video: clean up the companion files of a converted GIF.
 *
 * When client-side media processing is enabled, an opaque animated GIF is
 * stored as a normal image attachment (it stays a single media library item).
 * The GIF is also transcoded to a video (MP4/WebM) and a static first-frame
 * poster, both sideloaded as *companion files* of that same attachment — like
 * the HEIC original — and recorded in the attachment metadata under the
 * `animated_video` and `animated_video_poster` keys. They are never separate
 * attachments. Transparent GIFs are not converted (a `<video>` cannot
 * reproduce GIF transparency), so they have no companion.
 *
 * The swap to a video is handled in the editor: an uploaded GIF whose companion
 * video is available is switched to the Video block's "GIF" variation, which
 * serializes a normal `<video autoplay loop muted playsinline>` and so renders
 * natively on the front end with no render-time filtering. The author can
 * restore the original GIF from the block toolbar. The only thing left for PHP
 * is removing the sideloaded companions when their attachment is deleted, which
 * core's wp_delete_attachment_files() does not know about.
 *
 * @package gutenberg
 */

/**
 * Returns the absolute path to one of an attachment's animated-GIF companion
 * files (the converted video or its poster), if recorded.
 *
 * The path is rebuilt from the attachment's own (trusted) directory plus the
 * recorded basename, so the stored metadata cannot point anywhere else.
 *
 * @param int    $attachment_id Attachment ID.
 * @param string $meta_key      Metadata key holding the companion basename
 *                              ('animated_video' or 'animated_video_poster').
 * @return string|null Absolute file path, or null when there is no companion.
 */
function gutenberg_get_animated_gif_companion_path( int $attachment_id, string $meta_key ): ?string {
	$metadata = wp_get_attachment_metadata( $attachment_id, true );

	if ( empty( $metadata[ $meta_key ] ) || ! is_string( $metadata[ $meta_key ] ) ) {
		return null;
	}

	// Only ever trust the basename of the recorded value; strip any path
	// components so the metadata can't reference another directory.
	$name = wp_basename( $metadata[ $meta_key ] );

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
 * Deletes a sideloaded animated-GIF companion file from disk.
 *
 * Deletion is delegated to wp_delete_file_from_directory(), which confirms the
 * path resolves strictly inside the uploads directory before unlinking, so this
 * can only ever remove a sideloaded companion. Mirrors the HEIC companion
 * cleanup in lib/media/load.php.
 *
 * @param string|null $path Absolute path to the companion file, or null.
 */
function gutenberg_delete_animated_gif_companion_file( ?string $path ): void {
	if ( ! $path || ! file_exists( $path ) ) {
		return;
	}

	$uploads = wp_get_upload_dir();

	if ( empty( $uploads['basedir'] ) ) {
		return;
	}

	wp_delete_file_from_directory( $path, $uploads['basedir'] );
}

/**
 * Deletes the companion video and poster when their GIF attachment is deleted.
 *
 * The companions are sideloaded next to the GIF and recorded in
 * $metadata['animated_video'] and $metadata['animated_video_poster']. WordPress
 * core's wp_delete_attachment_files() does not know about them, so without this
 * hook they would linger on disk after the attachment is deleted.
 *
 * @param int $post_id Attachment ID being deleted.
 */
function gutenberg_delete_animated_gif_video( int $post_id ): void {
	gutenberg_delete_animated_gif_companion_file(
		gutenberg_get_animated_gif_companion_path( $post_id, 'animated_video' )
	);
	gutenberg_delete_animated_gif_companion_file(
		gutenberg_get_animated_gif_companion_path( $post_id, 'animated_video_poster' )
	);
}

add_action( 'delete_attachment', 'gutenberg_delete_animated_gif_video' );
