<?php
/**
 * Video transcoding: clean up the web-safe companion of a transcoded video and
 * expose the developer opt-out filter.
 *
 * When client-side media processing is enabled, an uploaded video that is not
 * already web-safe (non-MP4/WebM container, non-web-safe codec, oversized, or
 * over a bitrate budget) is transcoded in the browser to a web-safe format.
 * The original upload is kept as the attachment - so it can be linked to or
 * used to regenerate a new version later, the same principle behind the
 * `-scaled` image original and the HEIC original. The transcoded, web-safe
 * version is sideloaded as a *companion file* of that same attachment and
 * recorded in the attachment metadata under the `optimized_video` key. It is
 * never a separate attachment.
 *
 * The swap to the optimized companion is handled in the editor: the
 * `core/video` block points its playback `src` at the companion while the
 * attachment keeps pointing at the original. The author can restore the
 * original from the block toolbar. The only thing left for PHP is removing the
 * sideloaded companion when its attachment is deleted, which core's
 * wp_delete_attachment_files() does not know about.
 *
 * Developers can opt out of keeping the original via the
 * `gutenberg_video_transcoding_keep_original` filter (default true); when it
 * returns false the editor transcodes before upload so only the optimized file
 * is stored.
 *
 * @package gutenberg
 */

/**
 * Returns the absolute path to an attachment's transcoded video companion
 * file, if recorded.
 *
 * The path is rebuilt from the attachment's own (trusted) directory plus the
 * recorded basename, so the stored metadata cannot point anywhere else.
 *
 * @param int $attachment_id Attachment ID.
 * @return string|null Absolute file path, or null when there is no companion.
 */
function gutenberg_get_optimized_video_companion_path( int $attachment_id ): ?string {
	$metadata = wp_get_attachment_metadata( $attachment_id, true );

	if ( empty( $metadata['optimized_video'] ) || ! is_string( $metadata['optimized_video'] ) ) {
		return null;
	}

	// Only ever trust the basename of the recorded value; strip any path
	// components so the metadata can't reference another directory.
	$name = wp_basename( $metadata['optimized_video'] );

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
 * Deletes the transcoded video companion when its attachment is deleted.
 *
 * The companion is sideloaded next to the original video and recorded in
 * $metadata['optimized_video']. WordPress core's wp_delete_attachment_files()
 * does not know about it, so without this hook it would linger on disk after
 * the attachment is deleted.
 *
 * The path is confirmed to resolve to a regular file strictly inside the
 * uploads directory before deletion, so this can only ever remove a
 * sideloaded companion.
 *
 * @param int $post_id Attachment ID being deleted.
 */
function gutenberg_delete_optimized_video( int $post_id ): void {
	$path = gutenberg_get_optimized_video_companion_path( $post_id );

	if ( ! $path || ! file_exists( $path ) ) {
		return;
	}

	$real_path = realpath( $path );

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

add_action( 'delete_attachment', 'gutenberg_delete_optimized_video' );

/**
 * Exposes the "keep original video" preference to the editor.
 *
 * By default the original video upload is kept and the transcoded, web-safe
 * version is served as a companion. Developers can return false from the
 * `gutenberg_video_transcoding_keep_original` filter to transcode before
 * upload instead, so only the optimized file is stored.
 *
 * The resolved value is exposed as `window.__videoTranscodingKeepOriginal`,
 * read by the block editor's media upload settings.
 */
function gutenberg_set_video_transcoding_keep_original_flag(): void {
	if ( ! gutenberg_is_client_side_media_processing_enabled() ) {
		return;
	}

	/**
	 * Filters whether to keep the original video upload when transcoding.
	 *
	 * When true (default), the original video is stored as the attachment and
	 * the transcoded web-safe version is served as a companion file. When
	 * false, the video is transcoded before upload so only the optimized file
	 * is stored.
	 *
	 * @since 21.9.0
	 *
	 * @param bool $keep_original Whether to keep the original video upload.
	 */
	$keep_original = (bool) apply_filters( 'gutenberg_video_transcoding_keep_original', true );

	wp_add_inline_script(
		'wp-block-editor',
		'window.__videoTranscodingKeepOriginal = ' . ( $keep_original ? 'true' : 'false' ) . ';',
		'before'
	);
}

add_action( 'admin_init', 'gutenberg_set_video_transcoding_keep_original_flag' );
