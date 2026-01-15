<?php
/**
 * Class Gutenberg_REST_Attachments_Controller.
 *
 * @package MediaExperiments
 */

/**
 * Class Gutenberg_REST_Attachments_Controller.
 */
class Gutenberg_REST_Attachments_Controller extends WP_REST_Attachments_Controller {

	/**
	 * Debug logging helper.
	 *
	 * Enable debug logging by defining UPLOAD_MEDIA_DEBUG as true:
	 * define( 'UPLOAD_MEDIA_DEBUG', true );
	 *
	 * Logs will be written to the WordPress debug log if WP_DEBUG_LOG is enabled,
	 * or you can use a custom log file by defining UPLOAD_MEDIA_DEBUG_LOG.
	 *
	 * @param string $message The message to log.
	 * @param array  $context Additional context data.
	 */
	private function debug_log( string $message, array $context = array() ): void {
		if ( ! defined( 'UPLOAD_MEDIA_DEBUG' ) || ! UPLOAD_MEDIA_DEBUG ) {
			return;
		}

		$log_message = '[upload-media-php] ' . $message;

		if ( ! empty( $context ) ) {
			$log_message .= ' | Context: ' . wp_json_encode( $context, JSON_UNESCAPED_SLASHES );
		}

		if ( defined( 'UPLOAD_MEDIA_DEBUG_LOG' ) && UPLOAD_MEDIA_DEBUG_LOG ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( $log_message . PHP_EOL, 3, UPLOAD_MEDIA_DEBUG_LOG );
		} elseif ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( $log_message );
		}
	}
	/**
	 * Registers the routes for attachments.
	 *
	 * @see register_rest_route()
	 */
	public function register_routes(): void {
		parent::register_routes();

		$valid_image_sizes = array_keys( wp_get_registered_image_subsizes() );

		// Special case to set 'original_image' in attachment metadata.
		$valid_image_sizes[] = 'original';
		// Used for PDF thumbnails.
		$valid_image_sizes[] = 'full';

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/sideload',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'sideload_item' ),
					'permission_callback' => array( $this, 'sideload_item_permissions_check' ),
					'args'                => array(
						'id'         => array(
							'description' => __( 'Unique identifier for the attachment.', 'gutenberg' ),
							'type'        => 'integer',
						),
						'image_size' => array(
							'description' => __( 'Image size.', 'gutenberg' ),
							'type'        => 'string',
							'enum'        => $valid_image_sizes,
							'required'    => true,
						),
					),
				),
				'allow_batch' => $this->allow_batch,
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Retrieves an array of endpoint arguments from the item schema for the controller.
	 *
	 * @param string $method Optional. HTTP method of the request. The arguments for `CREATABLE` requests are
	 *                       checked for required values and may fall-back to a given default, this is not done
	 *                       on `EDITABLE` requests. Default WP_REST_Server::CREATABLE.
	 * @return array Endpoint arguments.
	 */
	public function get_endpoint_args_for_item_schema( $method = WP_REST_Server::CREATABLE ) {
		$args = rest_get_endpoint_args_for_schema( $this->get_item_schema(), $method );

		if ( WP_REST_Server::CREATABLE === $method ) {
			$args['generate_sub_sizes'] = array(
				'type'        => 'boolean',
				'default'     => true,
				'description' => __( 'Whether to generate image sub sizes.', 'gutenberg' ),
			);
			$args['convert_format']     = array(
				'type'        => 'boolean',
				'default'     => true,
				'description' => __( 'Whether to convert image formats.', 'gutenberg' ),
			);
		}

		return $args;
	}

	/**
	 * Prepares a single attachment output for response.
	 *
	 * Ensures 'missing_image_sizes' is set for PDFs and not just images.
	 *
	 * @param WP_Post         $item    Attachment object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ): WP_REST_Response {
		$response = parent::prepare_item_for_response( $item, $request );

		$data = $response->get_data();

		$this->debug_log(
			'prepare_item_for_response: Preparing response',
			array(
				'attachment_id'       => $item->ID,
				'mime_type'           => get_post_mime_type( $item ),
				'missing_image_sizes' => $data['missing_image_sizes'] ?? array(),
			)
		);

		// Handle missing image sizes for PDFs.

		$fields = $this->get_fields_for_response( $request );

		if (
			rest_is_field_included( 'missing_image_sizes', $fields ) &&
			empty( $data['missing_image_sizes'] )
		) {
			$mime_type = get_post_mime_type( $item );

			if ( 'application/pdf' === $mime_type ) {
				$metadata = wp_get_attachment_metadata( $item->ID, true );

				if ( ! is_array( $metadata ) ) {
					$metadata = array();
				}

				$metadata['sizes'] = $metadata['sizes'] ?? array();

				$fallback_sizes = array(
					'thumbnail',
					'medium',
					'large',
				);

				// The filter might have been added by ::create_item().
				remove_filter( 'fallback_intermediate_image_sizes', '__return_empty_array', 100 );

				/** This filter is documented in wp-admin/includes/image.php */
				$fallback_sizes = apply_filters( 'fallback_intermediate_image_sizes', $fallback_sizes, $metadata ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound

				$registered_sizes = wp_get_registered_image_subsizes();
				$merged_sizes     = array_keys( array_intersect_key( $registered_sizes, array_flip( $fallback_sizes ) ) );

				$missing_image_sizes         = array_diff( $merged_sizes, array_keys( $metadata['sizes'] ) );
				$data['missing_image_sizes'] = $missing_image_sizes;
				$this->debug_log(
					'prepare_item_for_response: Computed missing_image_sizes for PDF',
					array(
						'attachment_id'       => $item->ID,
						'fallback_sizes'      => $fallback_sizes,
						'existing_sizes'      => array_keys( $metadata['sizes'] ),
						'missing_image_sizes' => array_values( $missing_image_sizes ),
						'registered_sizes'    => $registered_sizes,
					)
				);
			}
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		$links = $response->get_links();

		$response = rest_ensure_response( $data );

		foreach ( $links as $rel => $rel_links ) {
			foreach ( $rel_links as $link ) {
				$response->add_link( $rel, $link['href'], $link['attributes'] );
			}
		}

		return $response;
	}

	/**
	 * Creates a single attachment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function create_item( $request ) {
		$this->debug_log(
			'create_item: Starting upload',
			array(
				'generate_sub_sizes' => $request['generate_sub_sizes'] ?? true,
				'convert_format'     => $request['convert_format'] ?? true,
			)
		);

		if ( ! $request['generate_sub_sizes'] ) {
			$this->debug_log( 'create_item: Disabling server-side sub-size generation' );
			add_filter( 'intermediate_image_sizes_advanced', '__return_empty_array', 100 );
			add_filter( 'fallback_intermediate_image_sizes', '__return_empty_array', 100 );

		}

		if ( ! $request['convert_format'] ) {
			$this->debug_log( 'create_item: Disabling format conversion' );
			add_filter( 'image_editor_output_format', '__return_empty_array', 100 );
		}

		$response = parent::create_item( $request );

		remove_filter( 'intermediate_image_sizes_advanced', '__return_empty_array', 100 );
		remove_filter( 'fallback_intermediate_image_sizes', '__return_empty_array', 100 );
		remove_filter( 'image_editor_output_format', '__return_empty_array', 100 );

		if ( is_wp_error( $response ) ) {
			$this->debug_log(
				'create_item: Upload failed',
				array(
					'error' => $response->get_error_message(),
				)
			);
		} else {
			$data = $response->get_data();
			$this->debug_log(
				'create_item: Upload successful',
				array(
					'attachment_id'       => $data['id'] ?? 'N/A',
					'mime_type'           => $data['mime_type'] ?? 'N/A',
					'missing_image_sizes' => $data['missing_image_sizes'] ?? array(),
				)
			);
		}

		return $response;
	}


	/**
	 * Checks if a given request has access to sideload a file.
	 *
	 * Sideloading a file for an existing attachment
	 * requires both update and create permissions.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to update the item, WP_Error object otherwise.
	 */
	public function sideload_item_permissions_check( $request ) {
		return $this->edit_media_item_permissions_check( $request );
	}

	/**
	 * Filters {@see 'wp_unique_filename'} during sideloads.
	 *
	 * {@see wp_unique_filename()} will always add numeric suffix if the name looks like a sub-size to avoid conflicts.
	 *
	 * Adding this closure to the filter helps work around this safeguard.
	 *
	 * Example: when uploading myphoto.jpeg, WordPress normally creates myphoto-150x150.jpeg,
	 * and when uploading myphoto-150x150.jpeg, it will be renamed to myphoto-150x150-1.jpeg
	 * However, here it is desired not to add the suffix in order to maintain the same
	 * naming convention as if the file was uploaded regularly.
	 *
	 * @link https://github.com/WordPress/wordpress-develop/blob/30954f7ac0840cfdad464928021d7f380940c347/src/wp-includes/functions.php#L2576-L2582
	 *
	 * @param string        $filename                 Unique file name.
	 * @param string        $ext                      File extension. Example: ".png".
	 * @param string        $dir                      Directory path.
	 * @param callable|null $unique_filename_callback Callback function that generates the unique file name.
	 * @param string[]      $alt_filenames            Array of alternate file names that were checked for collisions.
	 * @param int|string    $number                   The highest number that was used to make the file name unique
	 *                                                or an empty string if unused.
	 * @return string Filtered file name.
	 */
	private function filter_wp_unique_filename( $filename, $ext, $dir, $unique_filename_callback, $alt_filenames, $number, $attachment_filename ) {
		if ( empty( $number ) || ! $attachment_filename ) {
			return $filename;
		}

		$ext       = pathinfo( $filename, PATHINFO_EXTENSION );
		$name      = pathinfo( $filename, PATHINFO_FILENAME );
		$orig_name = pathinfo( $attachment_filename, PATHINFO_FILENAME );

		if ( ! $ext || ! $name ) {
			return $filename;
		}

		$matches = array();
		if ( preg_match( '/(.*)(-\d+x\d+)-' . $number . '$/', $name, $matches ) ) {
			$filename_without_suffix = $matches[1] . $matches[2] . ".$ext";
			if ( $matches[1] === $orig_name && ! file_exists( "$dir/$filename_without_suffix" ) ) {
				return $filename_without_suffix;
			}
		}

		return $filename;
	}

	/**
	 * Side-loads a media file without creating an attachment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function sideload_item( WP_REST_Request $request ) {
		$attachment_id = $request['id'];
		$image_size    = $request['image_size'];

		$this->debug_log(
			'sideload_item: Starting sideload request',
			array(
				'attachment_id' => $attachment_id,
				'image_size'    => $image_size,
			)
		);

		$post = $this->get_post( $attachment_id );

		if ( is_wp_error( $post ) ) {
			$this->debug_log(
				'sideload_item: Failed to get post',
				array(
					'attachment_id' => $attachment_id,
					'error'         => $post->get_error_message(),
				)
			);
			return $post;
		}

		$this->debug_log(
			'sideload_item: Post retrieved',
			array(
				'attachment_id' => $attachment_id,
				'post_title'    => $post->post_title,
				'mime_type'     => get_post_mime_type( $post ),
			)
		);

		if (
			! wp_attachment_is_image( $post ) &&
			! wp_attachment_is( 'pdf', $post )
		) {
			$this->debug_log(
				'sideload_item: Invalid attachment type',
				array(
					'attachment_id' => $attachment_id,
					'mime_type'     => get_post_mime_type( $post ),
				)
			);
			return new WP_Error(
				'rest_post_invalid_id',
				__( 'Invalid post ID, only images and PDFs can be sideloaded.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		if ( ! $request['convert_format'] ) {
			// Prevent image conversion as that is done client-side.
			add_filter( 'image_editor_output_format', '__return_empty_array', 100 );
		}

		// Get the file via $_FILES or raw data.
		$files   = $request->get_file_params();
		$headers = $request->get_headers();

		$this->debug_log(
			'sideload_item: File params received',
			array(
				'has_files'      => ! empty( $files ),
				'file_name'      => ! empty( $files['file']['name'] ) ? $files['file']['name'] : 'N/A',
				'file_size'      => ! empty( $files['file']['size'] ) ? $files['file']['size'] : 'N/A',
				'content_type'   => $headers['content_type'][0] ?? 'N/A',
				'content_length' => $headers['content_length'][0] ?? 'N/A',
			)
		);

		/*
		 * wp_unique_filename() will always add numeric suffix if the name looks like a sub-size to avoid conflicts.
		 * See https://github.com/WordPress/wordpress-develop/blob/30954f7ac0840cfdad464928021d7f380940c347/src/wp-includes/functions.php#L2576-L2582
		 * With the following filter we can work around this safeguard.
		 */

		$attachment_filename = get_attached_file( $attachment_id, true );
		$attachment_filename = $attachment_filename ? wp_basename( $attachment_filename ) : null;

		/**
		 * @param string        $filename                 Unique file name.
		 * @param string        $ext                      File extension. Example: ".png".
		 * @param string        $dir                      Directory path.
		 * @param callable|null $unique_filename_callback Callback function that generates the unique file name.
		 * @param string[]      $alt_filenames            Array of alternate file names that were checked for collisions.
		 * @param int|string    $number                   The highest number that was used to make the file name unique
		 *                                                or an empty string if unused.
		 * @return string Filtered file name.
		 */
		$filter_filename = function ( $filename, $ext, $dir, $unique_filename_callback, $alt_filenames, $number ) use ( $attachment_filename ) {
			return $this->filter_wp_unique_filename( $filename, $ext, $dir, $unique_filename_callback, $alt_filenames, $number, $attachment_filename );
		};

		add_filter( 'wp_unique_filename', $filter_filename, 10, 6 );

		$parent_post = get_post_parent( $attachment_id );

		$time = null;

		// Matches logic in media_handle_upload().
		// The post date doesn't usually matter for pages, so don't backdate this upload.
		if ( $parent_post && 'page' !== $parent_post->post_type && substr( $parent_post->post_date, 0, 4 ) > 0 ) {
			$time = $parent_post->post_date;
		}

		if ( ! empty( $files ) ) {
			$this->debug_log( 'sideload_item: Uploading from file params' );
			$file = $this->upload_from_file( $files, $headers, $time );
		} else {
			$this->debug_log( 'sideload_item: Uploading from raw data' );
			$file = $this->upload_from_data( $request->get_body(), $headers, $time );
		}

		remove_filter( 'wp_unique_filename', $filter_filename );
		remove_filter( 'image_editor_output_format', '__return_empty_array', 100 );

		if ( is_wp_error( $file ) ) {
			$this->debug_log(
				'sideload_item: Upload failed',
				array(
					'attachment_id' => $attachment_id,
					'image_size'    => $image_size,
					'error'         => $file->get_error_message(),
				)
			);
			return $file;
		}

		$type = $file['type'];
		$path = $file['file'];

		$this->debug_log(
			'sideload_item: File uploaded successfully',
			array(
				'path'      => $path,
				'type'      => $type,
				'file_size' => file_exists( $path ) ? filesize( $path ) : 'N/A',
			)
		);

		$image_size = $request['image_size'];

		$metadata = wp_get_attachment_metadata( $attachment_id, true );

		$this->debug_log(
			'sideload_item: Current attachment metadata',
			array(
				'attachment_id'  => $attachment_id,
				'has_metadata'   => ! empty( $metadata ),
				'existing_sizes' => ! empty( $metadata['sizes'] ) ? array_keys( $metadata['sizes'] ) : array(),
			)
		);

		if ( ! $metadata ) {
			$metadata = array();
		}

		if ( 'original' === $image_size ) {
			$metadata['original_image'] = wp_basename( $path );
			$this->debug_log(
				'sideload_item: Set original_image in metadata',
				array(
					'original_image' => $metadata['original_image'],
				)
			);
		} else {
			$metadata['sizes'] = $metadata['sizes'] ?? array();

			$size = wp_getimagesize( $path );

			$metadata['sizes'][ $image_size ] = array(
				'width'     => $size ? $size[0] : 0,
				'height'    => $size ? $size[1] : 0,
				'file'      => wp_basename( $path ),
				'mime-type' => $type,
				'filesize'  => wp_filesize( $path ),
			);

			$this->debug_log(
				'sideload_item: Added image size to metadata',
				array(
					'image_size'  => $image_size,
					'dimensions'  => array(
						'width'  => $size ? $size[0] : 0,
						'height' => $size ? $size[1] : 0,
					),
					'file'        => wp_basename( $path ),
					'mime_type'   => $type,
					'file_size'   => wp_filesize( $path ),
					'all_sizes'   => array_keys( $metadata['sizes'] ),
				)
			);
		}

		wp_update_attachment_metadata( $attachment_id, $metadata );

		$this->debug_log(
			'sideload_item: Metadata updated successfully',
			array(
				'attachment_id' => $attachment_id,
				'image_size'    => $image_size,
				'total_sizes'   => count( $metadata['sizes'] ?? array() ),
			)
		);

		$response_request = new WP_REST_Request(
			WP_REST_Server::READABLE,
			rest_get_route_for_post( $attachment_id )
		);

		$response_request['context'] = 'edit';

		if ( isset( $request['_fields'] ) ) {
			$response_request['_fields'] = $request['_fields'];
		}

		$response = $this->prepare_item_for_response( get_post( $attachment_id ), $response_request );

		$response->header( 'Location', rest_url( rest_get_route_for_post( $attachment_id ) ) );

		return $response;
	}
}
