<?php
/**
 * Animated GIF → video: swap the GIF for its companion video at render time.
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
 * The editor keeps showing the GIF as a normal `core/image` block. Only a
 * *top-level* Image block is swapped on the front end: a `render_block_core/image`
 * filter marks the eligible `<img>` (skipping images nested in other blocks such
 * as a Gallery, and images the author opted out of via the block's
 * "Display as original GIF" toggle), then `wp_content_img_tag` swaps the marked
 * `<img>` for a GIF-behaving `<video>` (muted, looping, autoplaying, inline, no
 * controls). Images nested in a Gallery, Media & Text / Cover media (which are
 * not `core/image` blocks), and opted-out images are left untouched.
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
 * Marks a top-level Image block's `<img>` as eligible for the GIF → video swap.
 *
 * The actual swap happens later in `wp_content_img_tag()`, which only sees a
 * single `<img>` (and so cannot tell whether it is nested). This filter runs at
 * block-render time, where the block's attributes and context are available, and
 * tags only the images that should be swapped: standalone Image blocks whose GIF
 * has a converted video and that the author has not opted out of. Images nested
 * in a Gallery (which carry the `galleryId` context) are skipped, as are Media &
 * Text / Cover, whose media is not a `core/image` block and never reaches here.
 *
 * @param string   $block_content The block's rendered HTML.
 * @param array    $block         The parsed block.
 * @param WP_Block $instance      The block instance.
 * @return string The block HTML, with the `<img>` marked when eligible.
 */
function gutenberg_mark_animated_gif_for_video_swap( string $block_content, array $block, WP_Block $instance ): string {
	if ( '' === $block_content ) {
		return $block_content;
	}

	$attachment_id = isset( $block['attrs']['id'] ) ? (int) $block['attrs']['id'] : 0;

	if ( ! $attachment_id ) {
		return $block_content;
	}

	// Per-image opt-out: the author chose to keep the original GIF.
	if ( ! empty( $block['attrs']['preserveAnimatedGif'] ) ) {
		return $block_content;
	}

	// Skip images nested in a Gallery — converting them to <video> breaks
	// gallery layout, lightbox and captions. Media & Text and Cover render
	// their media as the block's own <img> (not a core/image block), so they
	// never reach this filter and are left as-is.
	if ( ! empty( $instance->context['galleryId'] ) ) {
		return $block_content;
	}

	// Only mark when a converted video companion actually exists.
	$video_path = gutenberg_get_animated_gif_companion_path( $attachment_id, 'animated_video' );

	if ( ! $video_path || ! file_exists( $video_path ) ) {
		return $block_content;
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );

	if ( $processor->next_tag( 'IMG' ) ) {
		$processor->set_attribute( 'data-gutenberg-gif-swap', '1' );
	}

	return $processor->get_updated_html();
}

add_filter( 'render_block_core/image', 'gutenberg_mark_animated_gif_for_video_swap', 10, 3 );

/**
 * Swaps a marked GIF `<img>` for a GIF-behaving `<video>` when a companion video
 * has been generated for the attachment.
 *
 * Only images marked by gutenberg_mark_animated_gif_for_video_swap() are swapped
 * (the marker is removed either way), so nested and opted-out images are left
 * untouched.
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

	$processor = new WP_HTML_Tag_Processor( $filtered_image );

	if ( ! $processor->next_tag( 'IMG' ) ) {
		return $filtered_image;
	}

	// Only swap images that block rendering marked as eligible top-level
	// Image blocks. Read presentational attributes now, then strip the marker
	// so it never leaks into the output, whichever way we return.
	$is_marked = null !== $processor->get_attribute( 'data-gutenberg-gif-swap' );
	$class     = $processor->get_attribute( 'class' );
	$style     = $processor->get_attribute( 'style' );
	$width     = $processor->get_attribute( 'width' );
	$height    = $processor->get_attribute( 'height' );
	$alt       = $processor->get_attribute( 'alt' );
	$src       = $processor->get_attribute( 'src' );

	if ( ! $is_marked ) {
		return $filtered_image;
	}

	$processor->remove_attribute( 'data-gutenberg-gif-swap' );
	$filtered_image = $processor->get_updated_html();

	$video_path = gutenberg_get_animated_gif_companion_path( $attachment_id, 'animated_video' );

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

	// Prefer the lightweight static poster so the browser does not download
	// the full GIF just to paint the <video> poster; fall back to the GIF.
	$poster_url  = is_string( $src ) ? $src : '';
	$poster_path = gutenberg_get_animated_gif_companion_path( $attachment_id, 'animated_video_poster' );

	if ( $poster_path && file_exists( $poster_path ) ) {
		$poster_url = trailingslashit( dirname( $attachment_url ) ) . wp_basename( $poster_path );
	}

	// Carry over presentational attributes from the original <img> so the
	// video keeps the block's sizing, alignment classes and accessible name.
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
	// Show the still poster until the video is ready to avoid a blank frame.
	if ( '' !== $poster_url ) {
		$attributes .= sprintf( ' poster="%s"', esc_url( $poster_url ) );
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
 * Deletes a sideloaded animated-GIF companion file from disk.
 *
 * The path is confirmed to resolve to a regular file strictly inside the
 * uploads directory before deletion, so this can only ever remove a
 * sideloaded companion.
 *
 * @param string|null $path Absolute path to the companion file, or null.
 */
function gutenberg_delete_animated_gif_companion_file( ?string $path ): void {
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
