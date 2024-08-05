<?php
/**
 * Adds media-related settings to the block editor.
 *
 * @package gutenberg
 */

/**
 * Returns a list of all available image sizes.
 *
 * @since X.X.X
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
 * Adds media-related settings to the block editor.
 *
 * @since X.X.X
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_block_editor_settings_media_processing( $settings ) {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-media-processing' ) ) {
		return $settings;
	}

	/** This filter is documented in wp-admin/includes/images.php */
	$image_size_threshold = (int) apply_filters( 'big_image_size_threshold', 2560, array( 0, 0 ), '', 0 ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

	$settings['__experimentalAvailableImageSizes']   = gutenberg_get_all_image_sizes();
	$settings['__experimentalBigImageSizeThreshold'] = $image_size_threshold;

	return $settings;
}

add_filter( 'block_editor_settings_all', 'gutenberg_block_editor_settings_media_processing' );

/**
* Filters the arguments for registering a post type.
 *
 * @since X.X.X
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
 * Register additional REST fields for attachments.
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

function gutenberg_media_processing_cross_origin_isolation() {
	global $is_safari;

	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-media-processing' ) ) {
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

	$coep = $is_safari ? 'require-corp' : 'credentialless';

	header( 'Cross-Origin-Opener-Policy: same-origin' );
	header( "Cross-Origin-Embedder-Policy: $coep" );

	//  ob_start( 'gutenberg_media_processing_output_buffer' );
}

add_action( 'load-post.php', 'gutenberg_media_processing_cross_origin_isolation' );
add_action( 'load-post-new.php', 'gutenberg_media_processing_cross_origin_isolation' );
add_action( 'load-site-editor.php', 'gutenberg_media_processing_cross_origin_isolation' );
add_action( 'load-widgets.php', 'gutenberg_media_processing_cross_origin_isolation' );
