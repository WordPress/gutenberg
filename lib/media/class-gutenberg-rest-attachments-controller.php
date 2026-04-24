<?php
/**
 * Class Gutenberg_REST_Attachments_Controller.
 *
 * @package gutenberg
 */

/**
 * REST API controller for media attachments.
 *
 * Extends the core attachments controller to add client-side media processing
 * functionality including sideload support and sub-size generation control.
 */
class Gutenberg_REST_Attachments_Controller extends WP_REST_Attachments_Controller {
	/**
	 * Registers the routes for attachments.
	 *
	 * @see register_rest_route()
	 */
	public function register_routes(): void {
		parent::register_routes();

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/sideload',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'sideload_item' ),
					'permission_callback' => array( $this, 'sideload_item_permissions_check' ),
					'args'                => array(
						'id'                 => array(
							'description' => __( 'Unique identifier for the attachment.', 'gutenberg' ),
							'type'        => 'integer',
						),
						'image_size'         => array(
							'description'       => __( 'Image size. Can be a single size name or an array of size names to register the same file under multiple sizes.', 'gutenberg' ),
							'type'              => array( 'string', 'array' ),
							'items'             => array(
								'type' => 'string',
							),
							'required'          => true,
							// A custom callback is used instead of the default `rest_validate_request_arg`
							// because WordPress's `rest_is_array()` treats scalar strings as single-element
							// lists (via wp_parse_list), so a oneOf with both a string and array schema
							// matches a plain string twice and validation fails with "matches more than one
							// of the expected formats". The callback validates the enum per-item using the
							// current list of registered sizes, which reflects any sizes added after the
							// route was registered (e.g. via add_image_size() in tests).
							'validate_callback' => static function ( $value, $request, $param ) {
								$valid_sizes   = array_keys( wp_get_registered_image_subsizes() );
								$valid_sizes[] = 'original';
								$valid_sizes[] = 'original-heic';
								$valid_sizes[] = 'scaled';
								$valid_sizes[] = 'full';

								$items = is_string( $value ) ? array( $value ) : ( is_array( $value ) ? $value : null );
								if ( null === $items ) {
									return new WP_Error(
										'rest_invalid_type',
										/* translators: %s: Parameter name. */
										sprintf( __( '%s must be a string or an array of strings.', 'gutenberg' ), $param )
									);
								}

								foreach ( $items as $item ) {
									if ( ! is_string( $item ) || ! in_array( $item, $valid_sizes, true ) ) {
										return new WP_Error(
											'rest_not_in_enum',
											/* translators: %s: Parameter name. */
											sprintf( __( '%s contains an invalid image size.', 'gutenberg' ), $param )
										);
									}
								}

								return true;
							},
						),
						'generate_sub_sizes' => array(
							'description' => __( 'Whether to generate image sub sizes from the sideloaded file.', 'gutenberg' ),
							'type'        => 'boolean',
							'default'     => false,
						),
						'convert_format'     => array(
							'description' => __( 'Whether to convert image formats.', 'gutenberg' ),
							'type'        => 'boolean',
							'default'     => true,
						),
					),
				),
				'allow_batch' => $this->allow_batch,
				'schema'      => array( $this, 'get_public_item_schema' ),
			),
			true // Override core's route so 'scaled' is included in the enum.
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)/finalize',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'finalize_item' ),
					'permission_callback' => array( $this, 'edit_media_item_permissions_check' ),
					'args'                => array(
						'id'        => array(
							'description' => __( 'Unique identifier for the attachment.', 'gutenberg' ),
							'type'        => 'integer',
						),
						'sub_sizes' => array(
							'description' => __( 'Array of sub-size metadata collected from sideload responses.', 'gutenberg' ),
							'type'        => 'array',
							'default'     => array(),
							'items'       => array(
								'type'       => 'object',
								'properties' => array(
									'image_size'     => array(
										// Uses a multi-type schema instead of `oneOf` because WordPress's
										// `rest_is_array()` treats scalar strings as single-element lists,
										// so both a `{type: string}` and `{type: array}` oneOf schema would
										// match a plain string and trigger a "matches more than one"
										// validation error.
										'description' => __( 'Size name, or an array of size names when a single file is registered under multiple sizes with matching dimensions.', 'gutenberg' ),
										'type'        => array( 'string', 'array' ),
										'items'       => array(
											'type' => 'string',
										),
										'required'    => true,
									),
									'width'          => array(
										'type'    => 'integer',
										'minimum' => 1,
									),
									'height'         => array(
										'type'    => 'integer',
										'minimum' => 1,
									),
									'file'           => array(
										'type' => 'string',
									),
									'mime_type'      => array(
										'type'    => 'string',
										'pattern' => '^image/.*',
									),
									'filesize'       => array(
										'type'    => 'integer',
										'minimum' => 1,
									),
									'original_image' => array(
										'type' => 'string',
									),
								),
							),
						),
					),
				),
				'allow_batch' => $this->allow_batch,
				'schema'      => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to create an attachment.
	 *
	 * Skips the server-side image type support check when the client
	 * will handle image processing (generate_sub_sizes is false).
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		$bypass_mime_check = false === $request['generate_sub_sizes'];

		if ( $bypass_mime_check ) {
			add_filter( 'wp_prevent_unsupported_mime_type_uploads', '__return_false' );
		}

		$result = parent::create_item_permissions_check( $request );

		if ( $bypass_mime_check ) {
			remove_filter( 'wp_prevent_unsupported_mime_type_uploads', '__return_false' );
		}

		return $result;
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
	 * Retrieves the attachment's schema, conforming to JSON Schema.
	 *
	 * Adds exif_orientation field to the schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['exif_orientation'] = array(
			'description' => __( 'EXIF orientation value from the original image. Values 1-8 follow the EXIF specification. A value other than 1 indicates the image needs rotation.', 'gutenberg' ),
			'type'        => 'integer',
			'context'     => array( 'edit' ),
			'readonly'    => true,
		);

		$schema['properties']['image_output_format'] = array(
			'description' => __( 'The output MIME type this image should be converted to, based on the image_editor_output_format filter. Null if no conversion is needed.', 'gutenberg' ),
			'type'        => array( 'string', 'null' ),
			'context'     => array( 'edit' ),
			'readonly'    => true,
		);

		$schema['properties']['image_save_progressive'] = array(
			'description' => __( 'Whether to use progressive/interlaced encoding when saving this image.', 'gutenberg' ),
			'type'        => 'boolean',
			'context'     => array( 'edit' ),
			'readonly'    => true,
		);

		return $schema;
	}

	/**
	 * Prepares a single attachment output for response.
	 *
	 * Ensures 'missing_image_sizes' is set for PDFs and not just images.
	 * Adds 'exif_orientation' for images that need client-side rotation.
	 *
	 * @param WP_Post         $item    Attachment object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ): WP_REST_Response {
		$response = parent::prepare_item_for_response( $item, $request );

		$data = $response->get_data();

		$fields = $this->get_fields_for_response( $request );

		// Add EXIF orientation for images.
		if ( rest_is_field_included( 'exif_orientation', $fields ) ) {
			if ( wp_attachment_is_image( $item ) ) {
				$metadata = wp_get_attachment_metadata( $item->ID, true );

				// Get the EXIF orientation from the image metadata.
				// This is stored by wp_read_image_metadata() during upload.
				// Values:
				//   0 = undefined (no EXIF data), treat as no rotation needed
				//   1 = normal (no rotation needed)
				//   2-8 = various rotations/flips needed
				$orientation = 1; // Default: no rotation needed.
				if (
					is_array( $metadata ) &&
					isset( $metadata['image_meta']['orientation'] ) &&
					(int) $metadata['image_meta']['orientation'] > 0
				) {
					$orientation = (int) $metadata['image_meta']['orientation'];
				}

				$data['exif_orientation'] = $orientation;
			}
		}

		// Add per-file output format for images.
		if ( rest_is_field_included( 'image_output_format', $fields ) ) {
			if ( wp_attachment_is_image( $item ) ) {
				$mime_type = get_post_mime_type( $item );
				$filename  = get_attached_file( $item->ID );

				/** This filter is documented in wp-includes/class-wp-image-editor.php */
				$output_formats = apply_filters(
					'image_editor_output_format', // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
					array( $mime_type => $mime_type ),
					$filename ? $filename : '',
					$mime_type
				);

				$output_mime                 = $output_formats[ $mime_type ] ?? $mime_type;
				$data['image_output_format'] = ( $output_mime !== $mime_type ) ? $output_mime : null;
			}
		}

		// Add progressive/interlaced encoding setting for images.
		if ( rest_is_field_included( 'image_save_progressive', $fields ) ) {
			if ( wp_attachment_is_image( $item ) ) {
				$mime_type = get_post_mime_type( $item );

				/** This filter is documented in wp-includes/class-wp-image-editor-imagick.php */
				$data['image_save_progressive'] = (bool) apply_filters(
					'image_save_progressive', // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
					false,
					$mime_type
				);
			}
		}

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
		if ( ! $request['generate_sub_sizes'] ) {
			add_filter( 'intermediate_image_sizes_advanced', '__return_empty_array', 100 );
			add_filter( 'fallback_intermediate_image_sizes', '__return_empty_array', 100 );
			// Disable server-side EXIF rotation so the client can handle it.
			// This preserves the original orientation value in the metadata.
			add_filter( 'wp_image_maybe_exif_rotate', '__return_false', 100 );
			// Disable server-side big image scaling since the client handles it.
			add_filter( 'big_image_size_threshold', '__return_zero', 100 );
		}

		if ( ! $request['convert_format'] ) {
			add_filter( 'image_editor_output_format', '__return_empty_array', 100 );
		}

		$response = parent::create_item( $request );

		remove_filter( 'intermediate_image_sizes_advanced', '__return_empty_array', 100 );
		remove_filter( 'fallback_intermediate_image_sizes', '__return_empty_array', 100 );
		remove_filter( 'wp_image_maybe_exif_rotate', '__return_false', 100 );
		remove_filter( 'big_image_size_threshold', '__return_zero', 100 );
		remove_filter( 'image_editor_output_format', '__return_empty_array', 100 );

		// Recompute image_output_format now that __return_empty_array is removed.
		if ( ! is_wp_error( $response ) ) {
			$data = $response->get_data();
			if ( ! empty( $data['id'] ) && wp_attachment_is_image( $data['id'] ) ) {
				$mime_type = get_post_mime_type( $data['id'] );
				$filename  = get_attached_file( $data['id'] );

				/** This filter is documented in wp-includes/class-wp-image-editor.php */
				$output_formats = apply_filters(
					'image_editor_output_format', // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
					array( $mime_type => $mime_type ),
					$filename ? $filename : '',
					$mime_type
				);

				$output_mime                 = $output_formats[ $mime_type ] ?? $mime_type;
				$data['image_output_format'] = ( $output_mime !== $mime_type ) ? $output_mime : null;

				/** This filter is documented in wp-includes/class-wp-image-editor-imagick.php */
				$data['image_save_progressive'] = (bool) apply_filters(
					'image_save_progressive', // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
					false,
					$mime_type
				);

				$response->set_data( $data );
			}
		}

		return $response;
	}

	/**
	 * Finalizes an attachment after client-side media processing.
	 *
	 * Triggers the {@see 'wp_generate_attachment_metadata'} filter so that
	 * server-side plugins can process the attachment after all client-side
	 * operations (upload, thumbnail generation, sideloads) are complete.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function finalize_item( WP_REST_Request $request ) {
		$attachment_id = $request['id'];

		$post = $this->get_post( $attachment_id );

		if ( is_wp_error( $post ) ) {
			return $post;
		}

		$metadata = wp_get_attachment_metadata( $attachment_id );

		if ( ! is_array( $metadata ) ) {
			$metadata = array();
		}

		// Apply all sub-size metadata collected from sideload responses.
		$sub_sizes = $request['sub_sizes'] ?? array();

		foreach ( $sub_sizes as $sub_size ) {
			$image_size = $sub_size['image_size'];

			// When multiple size names share identical dimensions the client
			// sends a single sub-size entry with an array of names. Register the
			// same file under each name. Arrays only contain regular sizes.
			if ( is_array( $image_size ) ) {
				$metadata['sizes'] = $metadata['sizes'] ?? array();

				foreach ( $image_size as $name ) {
					$metadata['sizes'][ $name ] = array(
						'width'     => $sub_size['width'] ?? 0,
						'height'    => $sub_size['height'] ?? 0,
						'file'      => $sub_size['file'] ?? '',
						'mime-type' => $sub_size['mime_type'] ?? '',
						'filesize'  => $sub_size['filesize'] ?? 0,
					);
				}
				continue;
			}

			if ( 'original' === $image_size ) {
				$metadata['original_image'] = $sub_size['file'];
			} elseif ( 'original-heic' === $image_size ) {
				// HEIC companion original: stored under its own meta key so
				// the scaled-sideload flow (which writes 'original_image')
				// cannot clobber it. 'original_image' keeps pointing at the
				// web-viewable JPEG derivative. Cleanup on attachment delete
				// is handled by a delete_attachment hook that reads this key.
				$metadata['original'] = $sub_size['file'];
			} elseif ( 'scaled' === $image_size ) {
				if ( ! empty( $sub_size['original_image'] ) ) {
					$metadata['original_image'] = $sub_size['original_image'];
				}
				$metadata['width']    = $sub_size['width'] ?? 0;
				$metadata['height']   = $sub_size['height'] ?? 0;
				$metadata['filesize'] = $sub_size['filesize'] ?? 0;
				$metadata['file']     = $sub_size['file'] ?? '';
			} else {
				$metadata['sizes'] = $metadata['sizes'] ?? array();

				$metadata['sizes'][ $image_size ] = array(
					'width'     => $sub_size['width'] ?? 0,
					'height'    => $sub_size['height'] ?? 0,
					'file'      => $sub_size['file'] ?? '',
					'mime-type' => $sub_size['mime_type'] ?? '',
					'filesize'  => $sub_size['filesize'] ?? 0,
				);
			}
		}

		/**
		 * Filters the attachment metadata after client-side processing.
		 *
		 * This re-applies the wp_generate_attachment_metadata filter so that
		 * server-side plugins (e.g. those adding custom image sizes or
		 * processing metadata) can run after client-side uploads are complete.
		 *
		 * @param array  $metadata      Attachment metadata.
		 * @param int    $attachment_id Attachment ID.
		 * @param string $context       Context: 'create' or 'update'.
		 */
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
		$metadata = apply_filters( 'wp_generate_attachment_metadata', $metadata, $attachment_id, 'update' );

		wp_update_attachment_metadata( $attachment_id, $metadata );

		$response_request = new WP_REST_Request(
			WP_REST_Server::READABLE,
			rest_get_route_for_post( $attachment_id )
		);

		$response_request['context'] = 'edit';

		if ( isset( $request['_fields'] ) ) {
			$response_request['_fields'] = $request['_fields'];
		}

		return $this->prepare_item_for_response( get_post( $attachment_id ), $response_request );
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
	 * @param string     $filename            Unique file name.
	 * @param string     $dir                 Directory path.
	 * @param int|string $number              The highest number that was used to make the file name unique
	 *                                        or an empty string if unused.
	 * @param string     $attachment_filename Original attachment file name.
	 * @return string Filtered file name.
	 */
	private static function filter_wp_unique_filename( $filename, $dir, $number, $attachment_filename ) {
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
		if ( preg_match( '/(.*)(-\d+x\d+|-scaled)-' . $number . '$/', $name, $matches ) ) {
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

		$post = $this->get_post( $attachment_id );

		if ( is_wp_error( $post ) ) {
			return $post;
		}

		if (
			! wp_attachment_is_image( $post ) &&
			! wp_attachment_is( 'pdf', $post )
		) {
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
		$filter_filename = static function ( $filename, $ext, $dir, $unique_filename_callback, $alt_filenames, $number ) use ( $attachment_filename ) {
			return self::filter_wp_unique_filename( $filename, $dir, $number, $attachment_filename );
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
			$file = $this->upload_from_file( $files, $headers, $time );
		} else {
			$file = $this->upload_from_data( $request->get_body(), $headers, $time );
		}

		remove_filter( 'wp_unique_filename', $filter_filename );
		remove_filter( 'image_editor_output_format', '__return_empty_array', 100 );

		if ( is_wp_error( $file ) ) {
			return $file;
		}

		$type = $file['type'];
		$path = $file['file'];

		$image_size = $request['image_size'];

		// Build sub-size data to return to the client.
		// The client accumulates these and sends them all to the finalize endpoint.
		// `image_size` may be a single string or an array of names that share the
		// same dimensions and therefore reuse a single sideloaded file. Arrays
		// only carry regular sub-sizes; the special keys below ('original',
		// 'scaled', 'original-heic') are always scalar strings.
		$sub_size_data = array(
			'image_size' => $image_size,
		);

		if ( is_array( $image_size ) ) {
			$size = wp_getimagesize( $path );

			$sub_size_data['width']     = $size ? $size[0] : 0;
			$sub_size_data['height']    = $size ? $size[1] : 0;
			$sub_size_data['file']      = wp_basename( $path );
			$sub_size_data['mime_type'] = $type;
			$sub_size_data['filesize']  = wp_filesize( $path );
		} elseif ( 'original' === $image_size ) {
			$sub_size_data['file'] = wp_basename( $path );
		} elseif ( 'original-heic' === $image_size ) {
			// HEIC companion original. finalize_item() writes the filename to
			// $metadata['original'] (separate from 'original_image', which the
			// scaled-sideload flow owns). Cleanup on attachment delete is
			// handled by a delete_attachment hook that reads this key.
			$sub_size_data['file'] = wp_basename( $path );
		} elseif ( 'scaled' === $image_size ) {
			// Record the current attached file as the original.
			$current_file                    = get_attached_file( $attachment_id, true );
			$sub_size_data['original_image'] = wp_basename( $current_file );

			// Update the attached file to point to the scaled version.
			// This writes to _wp_attached_file meta, not _wp_attachment_metadata.
			update_attached_file( $attachment_id, $path );

			$size = wp_getimagesize( $path );

			$sub_size_data['width']    = $size ? $size[0] : 0;
			$sub_size_data['height']   = $size ? $size[1] : 0;
			$sub_size_data['filesize'] = wp_filesize( $path );
			$sub_size_data['file']     = _wp_relative_upload_path( $path );
		} else {
			$size = wp_getimagesize( $path );

			$sub_size_data['width']     = $size ? $size[0] : 0;
			$sub_size_data['height']    = $size ? $size[1] : 0;
			$sub_size_data['file']      = wp_basename( $path );
			$sub_size_data['mime_type'] = $type;
			$sub_size_data['filesize']  = wp_filesize( $path );
		}

		return rest_ensure_response( $sub_size_data );
	}
}
