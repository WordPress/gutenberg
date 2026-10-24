<?php
/**
 * Adds media-related functionality for client-side media processing.
 *
 * This file is structured in two tiers:
 *
 * 1. HEIC infrastructure — loaded whenever the feature filter is enabled.
 *    Browsers like Safari can decode HEIC via createImageBitmap() even
 *    without VIPS/SharedArrayBuffer, so HEIC MIME types, the custom REST
 *    controller, and REST field/index registrations are always needed.
 *
 * 2. Full VIPS/WASM processing — loaded only when the feature filter is
 *    enabled AND requires cross-origin isolation (DIP) at runtime.
 *
 * @package gutenberg
 */

if ( ! gutenberg_is_client_side_media_processing_enabled() ) {
	return;
}

// Animated GIF → video: clean up the sideloaded companion video and
// poster when their GIF attachment is deleted. The GIF→video swap itself
// happens in the editor (the converted block is a real core/video), so no
// render-time filtering is needed.
require_once __DIR__ . '/animated-gif-to-video.php';

// ── Tier 1: HEIC infrastructure (always loaded) ─────────────────────

/**
 * Registers HEIC/HEIF as allowed upload MIME types.
 *
 * HEIC images can be decoded in the browser (via canvas/VideoDecoder).
 * Registering these MIME types ensures the file picker's accept attribute
 * includes them, preventing macOS from silently converting HEIC to JPEG
 * on selection.
 *
 * @param array $mimes Allowed MIME types (extension => type).
 * @return array Modified MIME types.
 */
function gutenberg_add_heic_upload_mimes( array $mimes ): array {
	$mimes['heic'] = 'image/heic';
	$mimes['heif'] = 'image/heif';
	return $mimes;
}

add_filter( 'upload_mimes', 'gutenberg_add_heic_upload_mimes' );

/**
 * Registers JPEG XL (JXL) as an allowed upload MIME type.
 *
 * JXL uploads are kept in their own format, with their sub-sizes generated
 * client-side via VIPS/WASM, since the server cannot read JXL. WordPress core
 * does not include image/jxl in its default MIME list, so without this filter
 * the editor's allowed-types check rejects the .jxl upload.
 *
 * Runs before core's check_upload_mimes() (priority 10), so on multisite the
 * network's "Upload file types" setting still decides whether JXL is allowed.
 *
 * @param array $mimes Allowed MIME types (extension => type).
 * @return array Modified MIME types.
 */
function gutenberg_add_jxl_upload_mimes( array $mimes ): array {
	$mimes['jxl'] = 'image/jxl';
	return $mimes;
}

add_filter( 'upload_mimes', 'gutenberg_add_jxl_upload_mimes', 5 );

/**
 * Determines whether a file is a JPEG XL image by inspecting its magic bytes.
 *
 * JXL files come in two flavors: a naked codestream (starts with 0xFF 0x0A)
 * and an ISOBMFF container (starts with the 12-byte JXL box signature), which
 * must hold a codestream.
 *
 * @param string $file Full path to the file.
 * @return bool Whether the file is a JPEG XL image.
 */
function gutenberg_is_jxl_file( string $file ): bool {
	$handle = @fopen( $file, 'rb' ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	if ( ! $handle ) {
		return false;
	}

	$is_jxl = false !== gutenberg_read_jxl_codestream_header( $handle );
	fclose( $handle );

	return $is_jxl;
}

/**
 * Restores the JPEG XL MIME type during upload validation.
 *
 * fileinfo reports JXL as image/x-jxl (and getimagesize() cannot identify it
 * at all), so WordPress core's wp_check_filetype_and_ext() rejects the upload
 * because the detected MIME type does not match the registered image/jxl type.
 * When the file is genuinely a JPEG XL (verified via its magic bytes), restore
 * the expected extension and MIME type so the upload is allowed.
 *
 * Core also empties the type when JXL is not an allowed MIME type, for example
 * when a network's upload file types leave it out, so only restore it when
 * image/jxl is allowed.
 *
 * @param array      $data     Values for the extension, MIME type, and corrected filename.
 * @param string     $file     Full path to the file.
 * @param string     $filename The name of the file.
 * @param array|null $mimes    Allowed MIME types keyed by their file extension regex, or null for the defaults.
 * @return array Filtered values for the extension, MIME type, and corrected filename.
 */
function gutenberg_filter_jxl_filetype_and_ext( $data, $file, $filename, $mimes = null ) {
	// Leave already-recognized files, and arguments core does not type, untouched.
	if ( ! is_array( $data ) || ! empty( $data['type'] ) || ! is_string( $file ) || ! is_string( $filename ) ) {
		return $data;
	}

	if ( empty( $mimes ) ) {
		$mimes = get_allowed_mime_types();
	}

	if ( ! in_array( 'image/jxl', $mimes, true ) ) {
		return $data;
	}

	$ext = strtolower( pathinfo( $filename, PATHINFO_EXTENSION ) );

	if ( 'jxl' === $ext && gutenberg_is_jxl_file( $file ) ) {
		$data['ext']  = 'jxl';
		$data['type'] = 'image/jxl';
	}

	return $data;
}

add_filter( 'wp_check_filetype_and_ext', 'gutenberg_filter_jxl_filetype_and_ext', 10, 4 );

/**
 * Reads the dimensions of a JPEG XL image from its codestream header.
 *
 * getimagesize() cannot identify JPEG XL, so this decodes the SizeHeader
 * (ISO/IEC 18181-1, section A.3) itself. Handles both a naked codestream and
 * one wrapped in an ISOBMFF container, in a `jxlc` or the first `jxlp` box.
 * The dimensions are swapped for orientations that transpose the image, since
 * decoders apply the orientation and report the upright size.
 *
 * @param string $filename Full path to the file.
 * @return array{width: int, height: int}|false The image dimensions, or false if they could not be read.
 */
function gutenberg_get_jxl_info( string $filename ) {
	$handle = @fopen( $filename, 'rb' ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
	if ( ! $handle ) {
		return false;
	}

	$header = gutenberg_read_jxl_codestream_header( $handle );
	fclose( $handle );

	if ( false === $header ) {
		return false;
	}

	$bit_position = 16;
	$read_bits    = static function ( int $count ) use ( $header, &$bit_position ): int {
		$value = 0;
		for ( $i = 0; $i < $count; $i++, $bit_position++ ) {
			$byte   = ord( $header[ $bit_position >> 3 ] ?? "\0" );
			$value |= ( ( $byte >> ( $bit_position & 7 ) ) & 1 ) << $i;
		}
		return $value;
	};
	$read_size    = static function () use ( $read_bits ): int {
		$distribution = array( 9, 13, 18, 30 );
		return 1 + $read_bits( $distribution[ $read_bits( 2 ) ] );
	};

	$is_div8 = (bool) $read_bits( 1 );
	$height  = $is_div8 ? 8 * ( 1 + $read_bits( 5 ) ) : $read_size();
	$ratio   = $read_bits( 3 );

	if ( 0 === $ratio ) {
		$width = $is_div8 ? 8 * ( 1 + $read_bits( 5 ) ) : $read_size();
	} else {
		$ratios = array(
			1 => array( 1, 1 ),
			array( 12, 10 ),
			array( 4, 3 ),
			array( 3, 2 ),
			array( 16, 9 ),
			array( 5, 4 ),
			array( 2, 1 ),
		);
		$width  = intdiv( $height * $ratios[ $ratio ][0], $ratios[ $ratio ][1] );
	}

	// ImageMetadata: all_default, then extra_fields, which carries the orientation.
	$orientation = 1;
	if ( ! $read_bits( 1 ) && $read_bits( 1 ) ) {
		$orientation = 1 + $read_bits( 3 );
	}

	if ( $orientation > 4 ) {
		list( $width, $height ) = array( $height, $width );
	}

	return array(
		'width'  => $width,
		'height' => $height,
	);
}

/**
 * Reads the start of a JPEG XL codestream, unwrapping an ISOBMFF container.
 *
 * @param resource $handle File handle positioned at the start of the file.
 * @return string|false The first bytes of the codestream, starting with its signature, or false if none was found.
 */
function gutenberg_read_jxl_codestream_header( $handle ) {
	// Enough for the signature, the largest SizeHeader and the orientation.
	$header_length = 16;

	$start = fread( $handle, 12 );
	if ( ! is_string( $start ) || strlen( $start ) < 2 ) {
		return false;
	}

	if ( "\xFF\x0A" === substr( $start, 0, 2 ) ) {
		return $start . fread( $handle, $header_length - strlen( $start ) );
	}

	if ( "\x00\x00\x00\x0C\x4A\x58\x4C\x20\x0D\x0A\x87\x0A" !== $start ) {
		return false;
	}

	$offset = 12;
	while ( fseek( $handle, $offset ) === 0 ) {
		$box = fread( $handle, 8 );
		if ( ! is_string( $box ) || strlen( $box ) < 8 ) {
			return false;
		}

		$size        = unpack( 'N', $box )[1];
		$type        = substr( $box, 4, 4 );
		$header_size = 8;

		if ( 1 === $size ) {
			$large_size = fread( $handle, 8 );
			if ( ! is_string( $large_size ) || strlen( $large_size ) < 8 ) {
				return false;
			}
			$size        = unpack( 'J', $large_size )[1];
			$header_size = 16;
		}

		if ( 'jxlc' === $type || 'jxlp' === $type ) {
			if ( 'jxlp' === $type ) {
				// Skip the partial codestream box's sequence number.
				fread( $handle, 4 );
			}
			$codestream = fread( $handle, $header_length );
			return is_string( $codestream ) && "\xFF\x0A" === substr( $codestream, 0, 2 ) ? $codestream : false;
		}

		// A size of 0 means the box runs to the end of the file.
		if ( 0 === $size || $size < $header_size ) {
			return false;
		}

		$offset += $size;
	}

	return false;
}

/**
 * Records the dimensions of an uploaded JPEG XL image in its metadata.
 *
 * Core only builds image metadata for formats getimagesize() can read, so a
 * JXL upload would otherwise have no width or height. Without them, core
 * reports no missing sub-sizes and the client never generates any.
 *
 * @param array $metadata      Attachment metadata.
 * @param int   $attachment_id Attachment ID.
 * @return array Filtered attachment metadata.
 */
function gutenberg_add_jxl_attachment_metadata( $metadata, $attachment_id ) {
	if ( ! is_array( $metadata ) || ! empty( $metadata['width'] ) || 'image/jxl' !== get_post_mime_type( $attachment_id ) ) {
		return $metadata;
	}

	$file = get_attached_file( $attachment_id );
	$size = $file ? gutenberg_get_jxl_info( $file ) : false;

	if ( ! $size ) {
		return $metadata;
	}

	return array_merge(
		$metadata,
		array(
			'width'  => $size['width'],
			'height' => $size['height'],
			'file'   => _wp_relative_upload_path( $file ),
			'sizes'  => array(),
		)
	);
}

add_filter( 'wp_generate_attachment_metadata', 'gutenberg_add_jxl_attachment_metadata', 10, 2 );

/**
 * Overrides the REST controller for the attachment post type.
 *
 * @param array  $args      Array of arguments for registering a post type.
 *                          See the register_post_type() function for accepted arguments.
 * @param string $post_type Post type key.
 */
function gutenberg_filter_attachment_post_type_args( array $args, string $post_type ): array {
	if ( 'attachment' === $post_type ) {
		require_once __DIR__ . '/class-gutenberg-rest-attachments-controller.php';

		$args['rest_controller_class'] = Gutenberg_REST_Attachments_Controller::class;
	}

	return $args;
}

add_filter( 'register_post_type_args', 'gutenberg_filter_attachment_post_type_args', 10, 2 );

/**
 * Registers additional REST fields for attachments.
 */
function gutenberg_media_processing_register_rest_fields(): void {
	register_rest_field(
		'attachment',
		'filename',
		array(
			'schema'       => array(
				'description' => __( 'Original attachment file name', 'gutenberg' ),
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
			),
			'get_callback' => 'gutenberg_rest_get_attachment_filename',
		)
	);

	register_rest_field(
		'attachment',
		'filesize',
		array(
			'schema'       => array(
				'description' => __( 'Attachment file size', 'gutenberg' ),
				'type'        => 'number',
				'context'     => array( 'view', 'edit' ),
			),
			'get_callback' => 'gutenberg_rest_get_attachment_filesize',
		)
	);
}

add_action( 'rest_api_init', 'gutenberg_media_processing_register_rest_fields' );

/**
 * Returns the attachment's original file name.
 *
 * @param array $post Post data.
 * @return string|null Attachment file name.
 */
function gutenberg_rest_get_attachment_filename( array $post ): ?string {
	$path = wp_get_original_image_path( $post['id'] );

	if ( $path ) {
		return basename( $path );
	}

	$path = get_attached_file( $post['id'] );

	if ( $path ) {
		return basename( $path );
	}

	return null;
}

/**
 * Returns the attachment's file size in bytes.
 *
 * @param array $post Post data.
 * @return int|null Attachment file size.
 */
function gutenberg_rest_get_attachment_filesize( array $post ): ?int {
	$attachment_id = $post['id'];

	$meta = wp_get_attachment_metadata( $attachment_id );

	if ( isset( $meta['filesize'] ) ) {
		return $meta['filesize'];
	}

	$original_path = wp_get_original_image_path( $attachment_id );
	$attached_file = $original_path ? $original_path : get_attached_file( $attachment_id );

	if ( is_string( $attached_file ) && file_exists( $attached_file ) ) {
		return wp_filesize( $attached_file );
	}

	return null;
}

/**
 * Returns a list of all available image sizes.
 *
 * @return array Existing image sizes.
 */
function gutenberg_get_all_image_sizes(): array {
	$sizes = wp_get_registered_image_subsizes();

	foreach ( $sizes as $name => &$size ) {
		$size['height'] = (int) $size['height'];
		$size['width']  = (int) $size['width'];
		$size['name']   = $name;
	}
	unset( $size );

	return $sizes;
}

/**
 * Filters the REST API root index data to add custom settings.
 *
 * @param WP_REST_Response $response Response data.
 */
function gutenberg_media_processing_filter_rest_index( WP_REST_Response $response ) {
	/** This filter is documented in wp-admin/includes/image.php */
	$image_size_threshold = (int) apply_filters( 'big_image_size_threshold', 2560, array( 0, 0 ), '', 0 ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

	/** This filter is documented in wp-includes/class-wp-image-editor-imagick.php */
	$image_strip_meta = (bool) apply_filters( 'image_strip_meta', true ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

	/*
	 * On the server, this filter receives the decoded image's actual bit depth.
	 * The client path never decodes the image on the server, so the filter is
	 * applied with 16 (the maximum depth vips can produce) as both the value
	 * and the current depth. The client caps its output bit depth at the
	 * filtered value, so a plugin lowering it (e.g. to 8) takes effect on
	 * client-generated images too.
	 */
	/** This filter is documented in wp-includes/class-wp-image-editor-imagick.php */
	$image_max_bit_depth = (int) apply_filters( 'image_max_bit_depth', 16, 16 ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

	/**
	 * Filters whether sub-sizes of animated images should keep their animation.
	 *
	 * By default, every sub-size of an animated GIF or WebP image keeps its
	 * animation, including cropped sizes such as `thumbnail`, which cut every
	 * frame with the same crop. Return false to generate static sub-sizes
	 * from the first frame only, matching WordPress core's server-side
	 * behavior, for example when encoding every frame per sub-size takes too
	 * long on the devices that upload to the site.
	 *
	 * Uploads that take the server-side path (e.g. some Media Library
	 * uploads) still produce static sub-sizes, as core has no animated resize
	 * support.
	 *
	 * @since 24.3.0
	 *
	 * @param bool $generate_animated_image_subsizes Whether to generate animated
	 *                                                sub-sizes for animated images.
	 *                                                Default true.
	 */
	$generate_animated_image_subsizes = (bool) apply_filters( 'wp_generate_animated_image_subsizes', true ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

	if ( current_user_can( 'upload_files' ) ) {
		$response->data['image_sizes']                      = gutenberg_get_all_image_sizes();
		$response->data['image_size_threshold']             = $image_size_threshold;
		$response->data['image_strip_meta']                 = $image_strip_meta;
		$response->data['image_max_bit_depth']              = $image_max_bit_depth;
		$response->data['generate_animated_image_subsizes'] = $generate_animated_image_subsizes;
	}

	return $response;
}

add_filter( 'rest_index', 'gutenberg_media_processing_filter_rest_index' );

/**
 * Sets a global JS variable to indicate that client-side media processing is enabled.
 *
 * The flag gates both processing modes: the full VIPS/WASM pipeline (browsers
 * that pass feature detection) and the HEIC canvas fallback used by browsers
 * such as Safari that can decode HEIC via createImageBitmap() but lack
 * SharedArrayBuffer support. The browser-capability check happens client-side.
 */
function gutenberg_set_client_side_media_processing_flag() {
	// Re-check the filter at action time, since other plugins (loaded after Gutenberg)
	// may have added a filter to disable client-side media processing.
	if ( ! gutenberg_is_client_side_media_processing_enabled() ) {
		return;
	}
	wp_add_inline_script( 'wp-block-editor', 'window.__clientSideMediaProcessing = true', 'before' );
}
add_action( 'admin_init', 'gutenberg_set_client_side_media_processing_flag' );

/**
 * Deletes the source-format companion file when its attachment is deleted.
 *
 * When the client-side media flow sideloads a source-format original (such as
 * a HEIC file) alongside a web-viewable derivative, the original's filename is
 * recorded in the 'source_image' metadata key. WordPress only tracks
 * 'original_image' in wp_delete_attachment_files(), so without this hook the
 * companion file would linger on disk after the attachment is deleted.
 *
 * @param int $post_id Attachment ID being deleted.
 * @return bool Whether a companion file was deleted.
 */
function gutenberg_delete_heic_companion_file( int $post_id ): bool {
	$metadata = wp_get_attachment_metadata( $post_id, true );

	$source_image = $metadata['source_image'] ?? null;
	if ( ! is_string( $source_image ) || '' === $source_image ) {
		return false;
	}

	$attached_file = get_attached_file( $post_id, true );

	if ( ! $attached_file ) {
		return false;
	}

	$uploads = wp_get_upload_dir();

	if ( empty( $uploads['basedir'] ) ) {
		return false;
	}

	$companion_path = path_join( dirname( $attached_file ), wp_basename( $source_image ) );

	if ( ! file_exists( $companion_path ) ) {
		return false;
	}

	return wp_delete_file_from_directory( $companion_path, $uploads['basedir'] );
}

add_action( 'delete_attachment', 'gutenberg_delete_heic_companion_file' );

// ── Tier 2: Full client-side processing (VIPS/WASM) ─────────────────
// Everything below requires cross-origin isolation (Document-Isolation-Policy)
// and SharedArrayBuffer support, which is only available in Chromium 137+.

/**
 * Filters the list of rewrite rules formatted for output to an .htaccess file.
 *
 * Adds support for serving wasm-vips locally.
 *
 * @param string $rules mod_rewrite Rewrite rules formatted for .htaccess.
 * @return string Filtered rewrite rules.
 */
function gutenberg_filter_mod_rewrite_rules( string $rules ): string {
	$rules .= "\n# BEGIN Gutenberg client-side media processing\n" .
				"AddType application/wasm wasm\n" .
				"# END Gutenberg client-side media processing\n";

	return $rules;
}

add_filter( 'mod_rewrite_rules', 'gutenberg_filter_mod_rewrite_rules' );

/**
 * Returns the major Chromium version from the current request's User-Agent.
 *
 * Matches all Chromium-based browsers (Chrome, Edge, Opera, Brave).
 *
 * @return int|null The major Chromium version, or null if not a Chromium browser.
 */
function gutenberg_get_chromium_major_version(): ?int {
	if ( empty( $_SERVER['HTTP_USER_AGENT'] ) ) {
		return null;
	}
	if ( preg_match( '/Chrome\/(\d+)/', $_SERVER['HTTP_USER_AGENT'], $matches ) ) {
		return (int) $matches[1];
	}
	return null;
}

/**
 * Enables cross-origin isolation in the block editor.
 *
 * Required for enabling SharedArrayBuffer for WebAssembly-based
 * media processing in the editor. Uses Document-Isolation-Policy
 * on supported browsers (Chromium 137+).
 */
function gutenberg_set_up_cross_origin_isolation() {
	// Re-check the filter at action time, since other plugins (loaded after Gutenberg)
	// may have added a filter to disable client-side media processing.
	if ( ! gutenberg_is_client_side_media_processing_enabled() ) {
		return;
	}

	$screen = get_current_screen();

	if ( ! $screen ) {
		return;
	}

	if ( ! $screen->is_block_editor() && 'site-editor' !== $screen->id && ! ( 'widgets' === $screen->id && wp_use_widgets_block_editor() ) ) {
		return;
	}

	// Skip when rendering the classic-theme home route, which shows the site
	// preview in an iframe and must reach its `contentDocument` to neutralize
	// interactive elements — DIP would block that.
	if ( 'site-editor' === $screen->id && ! wp_is_block_theme() && ( ! isset( $_GET['p'] ) || '/' === $_GET['p'] ) ) {
		return;
	}

	// Skip when a third-party page builder overrides the block editor.
	// DIP isolates the document into its own agent cluster,
	// which blocks same-origin iframe access that these editors rely on.
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( isset( $_GET['action'] ) && 'edit' !== $_GET['action'] ) {
		return;
	}

	$user_id = get_current_user_id();
	if ( ! $user_id ) {
		return;
	}

	// Cross-origin isolation is not needed if users can't upload files anyway.
	if ( ! user_can( $user_id, 'upload_files' ) ) {
		return;
	}

	gutenberg_send_document_isolation_policy_header();
}

add_action( 'load-post.php', 'gutenberg_set_up_cross_origin_isolation' );
add_action( 'load-post-new.php', 'gutenberg_set_up_cross_origin_isolation' );
add_action( 'load-site-editor.php', 'gutenberg_set_up_cross_origin_isolation' );
add_action( 'load-widgets.php', 'gutenberg_set_up_cross_origin_isolation' );

// Remove core's COEP/COOP-based cross-origin isolation in favor of
// Gutenberg's DIP-based approach, which also skips third-party editors.
remove_action( 'load-post.php', 'wp_set_up_cross_origin_isolation' );
remove_action( 'load-post-new.php', 'wp_set_up_cross_origin_isolation' );
remove_action( 'load-site-editor.php', 'wp_set_up_cross_origin_isolation' );
remove_action( 'load-widgets.php', 'wp_set_up_cross_origin_isolation' );

/**
 * Sends the Document-Isolation-Policy header for cross-origin isolation.
 *
 * `isolate-and-credentialless` loads cross-origin subresources without
 * credentials instead of blocking them, so no `crossorigin` attribute is
 * needed on scripts, styles, images, audio, or video for the page to work.
 * Forcing `crossorigin="anonymous"` would turn those into CORS requests
 * and break any resource served without `Access-Control-Allow-Origin`,
 * such as media offloaded to a CDN.
 *
 * @return bool Whether the header was sent.
 */
function gutenberg_send_document_isolation_policy_header(): bool {
	$chromium_version = gutenberg_get_chromium_major_version();

	/**
	 * Filters whether to use Document-Isolation-Policy for cross-origin isolation.
	 *
	 * Document-Isolation-Policy provides per-document cross-origin isolation
	 * without affecting other iframes on the page, avoiding breakage of plugins
	 * whose iframes lose credentials/DOM access.
	 *
	 * @since 21.8.0
	 *
	 * @param bool $use_dip Whether DIP is supported and should be used.
	 */
	$use_dip = apply_filters(
		'gutenberg_use_document_isolation_policy',
		null !== $chromium_version && $chromium_version >= 137
	);

	if ( ! $use_dip ) {
		return false;
	}

	header( 'Document-Isolation-Policy: isolate-and-credentialless' );

	return true;
}

/**
 * Removes `crossorigin` attributes from the printed media templates.
 *
 * WordPress 7.1 forces `crossorigin="anonymous"` onto the AUDIO and VIDEO
 * tags inside the Backbone `<script type="text/html">` templates whenever
 * client-side media processing is enabled. Under
 * `Document-Isolation-Policy: isolate-and-credentialless` the attribute is
 * not needed to play cross-origin media, and it turns the load into a CORS
 * request that fails for media served without CORS headers, such as media
 * offloaded to a CDN. See https://core.trac.wordpress.org/ticket/65930.
 *
 * @param string $html The printed media templates.
 *
 * @return string Modified media templates.
 */
function gutenberg_remove_media_template_crossorigin_attributes( string $html ): string {
	/*
	 * The media templates are inside <script type="text/html"> tags,
	 * whose content is treated as raw text by the HTML Tag Processor.
	 * Extract each script block's content, process it separately,
	 * then reassemble the full output.
	 */
	$script_processor = new WP_HTML_Tag_Processor( $html );
	while ( $script_processor->next_tag( 'SCRIPT' ) ) {
		if ( 'text/html' !== $script_processor->get_attribute( 'type' ) ) {
			continue;
		}
		$template_processor = new WP_HTML_Tag_Processor( $script_processor->get_modifiable_text() );
		while ( $template_processor->next_tag() ) {
			if (
				in_array( $template_processor->get_tag(), array( 'AUDIO', 'IMG', 'VIDEO' ), true )
				&& 'anonymous' === $template_processor->get_attribute( 'crossorigin' )
			) {
				$template_processor->remove_attribute( 'crossorigin' );
			}
		}
		$script_processor->set_modifiable_text( $template_processor->get_updated_html() );
	}

	return $script_processor->get_updated_html();
}

/**
 * Overrides templates from wp_print_media_templates with custom ones.
 *
 * Only needed on WordPress 7.1, the one release whose
 * `wp_print_media_templates()` injects `crossorigin="anonymous"` itself.
 */
function gutenberg_override_media_templates(): void {
	if ( ! function_exists( 'wp_add_crossorigin_attributes' ) || function_exists( 'wp_send_document_isolation_policy_header' ) ) {
		return;
	}

	remove_action( 'admin_footer', 'wp_print_media_templates' );
	add_action(
		'admin_footer',
		static function (): void {
			ob_start();
			wp_print_media_templates();
			$html = (string) ob_get_clean();

			echo gutenberg_remove_media_template_crossorigin_attributes( $html ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
	);
}

add_action( 'wp_enqueue_media', 'gutenberg_override_media_templates' );
