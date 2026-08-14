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
 *
 * @phpstan-type Image_Sub_Size array{
 *     image_size: non-empty-string|non-empty-list<non-empty-string>,
 *     width?: positive-int,
 *     height?: positive-int,
 *     file?: non-empty-string,
 *     mime_type?: non-empty-string,
 *     filesize?: positive-int,
 *     original_image?: non-empty-string,
 * }
 */
class Gutenberg_REST_Attachments_Controller extends WP_REST_Attachments_Controller {

	/**
	 * Image size token for the source-format original preserved alongside a
	 * client-generated derivative (e.g. the HEIC file kept next to its JPEG).
	 *
	 * Used both in the `/sideload` route schema and when dispatching the
	 * sideloaded file to its metadata key, so the two never drift apart.
	 *
	 * @var string
	 */
	const IMAGE_SIZE_SOURCE_ORIGINAL = 'source_original';

	/**
	 * Metadata key holding the basename of the source-format original.
	 *
	 * Deliberately specific so it never collides with the generic `original`
	 * or `original_image` keys other flows write to.
	 *
	 * @var string
	 */
	const META_KEY_SOURCE_IMAGE = 'source_image';

	/**
	 * Image size token for the video transcoded from an animated GIF, sideloaded
	 * as a companion of the GIF attachment.
	 *
	 * Paired with META_KEY_ANIMATED_VIDEO: used both in the `/sideload` route
	 * and when writing the sideloaded file to its metadata key. Both use the
	 * underscore convention so the size token and meta key stay consistent.
	 *
	 * @var string
	 */
	const IMAGE_SIZE_ANIMATED_VIDEO = 'animated_video';

	/**
	 * Image size token for the static first-frame poster of a converted GIF.
	 *
	 * @var string
	 */
	const IMAGE_SIZE_ANIMATED_VIDEO_POSTER = 'animated_video_poster';

	/**
	 * Metadata key holding the basename of the converted animated-GIF video.
	 *
	 * @var string
	 */
	const META_KEY_ANIMATED_VIDEO = 'animated_video';

	/**
	 * Metadata key holding the basename of the converted GIF's poster image.
	 *
	 * @var string
	 */
	const META_KEY_ANIMATED_VIDEO_POSTER = 'animated_video_poster';

	/**
	 * Post meta key recording the file names produced by the sideload endpoint.
	 *
	 * Each successful sideload appends the file name(s) it created for an
	 * attachment under this key. The finalize endpoint reads them back to
	 * confirm every stored sub-size was actually produced here, rather than
	 * trusting a client-supplied name that could point at another attachment's
	 * files. Stored as one row per value (via {@see add_post_meta()}) so concurrent
	 * sideloads never read-modify-write a shared value.
	 *
	 * Matches the key used by WordPress core's implementation so the records
	 * stay interchangeable when core also ships these endpoints.
	 *
	 * @var string
	 */
	const META_KEY_SIDELOAD_FILE_NAME = '_wp_sideloaded_file';

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
						'id'             => array(
							'description' => __( 'Unique identifier for the attachment.', 'gutenberg' ),
							'type'        => 'integer',
						),
						'image_size'     => array(
							'description'       => __( 'Image size. Can be a single size name or an array of size names to register the same file under multiple sizes.', 'gutenberg' ),
							'type'              => array( 'string', 'array' ),
							'items'             => array(
								'type'      => 'string',
								'minLength' => 1,
							),
							'minItems'          => 1,
							'minLength'         => 1,
							'required'          => true,
							// A custom callback is used instead of the default `rest_validate_request_arg`
							// because WordPress's `rest_is_array()` treats scalar strings as single-element
							// lists (via wp_parse_list), so a oneOf with both a string and array schema
							// matches a plain string twice and validation fails with "matches more than one
							// of the expected formats". The callback validates the enum per-item using the
							// current list of registered sizes, which reflects any sizes added after the
							// route was registered (e.g. via add_image_size() in tests).
							'validate_callback' => static function ( $value, WP_REST_Request $request, string $param ) {
								/*
								 * Providing a custom callback replaces the default schema
								 * validation, so apply the declared schema (type, minLength,
								 * minItems) before the enum check below.
								 */
								$schema_validity = rest_validate_request_arg( $value, $request, $param );
								if ( is_wp_error( $schema_validity ) ) {
									return $schema_validity;
								}

								return self::validate_image_size_names( $value, $param );
							},
						),
						'convert_format' => array(
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
							'description'       => __( 'Array of sub-size metadata collected from sideload responses.', 'gutenberg' ),
							'type'              => 'array',
							'default'           => array(),
							/*
							 * A finalize request sends one entry per sideloaded sub-size, so
							 * the ceiling only needs to clear the number of sizes a site can
							 * register. Bounding it keeps a request from repeating a name
							 * across an arbitrary number of entries.
							 */
							'maxItems'          => 100,
							/*
							 * As on the sideload endpoint, the size names are checked in a
							 * callback rather than an enum, so the set reflects the sizes
							 * registered when the request runs. The callback sits on
							 * sub_sizes because a nested property cannot carry one.
							 */
							'validate_callback' => static function ( $value, WP_REST_Request $request, string $param ) {
								/*
								 * Providing a custom callback replaces the default schema
								 * validation, so apply the declared schema first. That is what
								 * guarantees each entry is an object carrying an image_size of
								 * the declared type.
								 */
								$schema_validity = rest_validate_request_arg( $value, $request, $param );
								if ( is_wp_error( $schema_validity ) ) {
									return $schema_validity;
								}

								foreach ( (array) $value as $index => $sub_size ) {
									$sub_size = (array) $sub_size;

									$validity = self::validate_image_size_names(
										$sub_size['image_size'] ?? null,
										sprintf( '%s[%s][image_size]', $param, $index )
									);

									if ( is_wp_error( $validity ) ) {
										return $validity;
									}
								}

								return true;
							},
							'items'             => array(
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
											'type'      => 'string',
											'minLength' => 1,
										),
										'minItems'    => 1,
										'minLength'   => 1,
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
										'type'      => 'string',
										'minLength' => 1,
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
										'type'      => 'string',
										'minLength' => 1,
									),
								),
							),
						),
					),
				),
				'allow_batch' => $this->allow_batch,
				'schema'      => array( $this, 'get_public_item_schema' ),
			),
			// Override core's route so this schema wins on WordPress versions
			// that register their own finalize route: without the override the
			// earlier core registration is dispatched and this hardened schema
			// (minLength/minItems) never applies.
			true
		);
	}

	/**
	 * Retrieves an array of endpoint arguments from the item schema for the controller.
	 *
	 * @param string $method Optional. HTTP method of the request. The arguments for `CREATABLE` requests are
	 *                       checked for required values and may fall-back to a given default, this is not done
	 *                       on `EDITABLE` requests. Default WP_REST_Server::CREATABLE.
	 * @return array<string, array<string, mixed>> Endpoint arguments keyed by argument name.
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
			$args['url']                = array(
				'type'              => 'string',
				'format'            => 'uri',
				'description'       => __( 'URL of an external image to sideload into the media library, instead of uploading a file.', 'gutenberg' ),
				'sanitize_callback' => 'sanitize_url',
				'validate_callback' => static function ( $url, $request, $param ) {
					/*
					 * A custom validate_callback replaces the default
					 * rest_validate_request_arg(), so re-apply it first to keep
					 * the schema checks (string type, uri format) enforced.
					 */
					$valid = rest_validate_request_arg( $url, $request, $param );
					if ( is_wp_error( $valid ) ) {
						return $valid;
					}
					/** @var non-empty-string $url */

					/*
					 * Reject URLs that are not safe to request server-side. wp_http_validate_url()
					 * enforces an HTTP(S) scheme and blocks private, local, and otherwise
					 * disallowed hosts, guarding the sideload against SSRF.
					 */
					if ( false === wp_http_validate_url( $url ) ) {
						return new WP_Error(
							'rest_invalid_url',
							__( 'Invalid URL. Provide a valid, publicly reachable HTTP or HTTPS image URL.', 'gutenberg' ),
							array( 'status' => 400 )
						);
					}

					return true;
				},
			);
		}

		return $args;
	}

	/**
	 * Checks if a given request has access to create an attachment.
	 *
	 * Skips the server-side image type support check when the client
	 * will handle image processing (generate_sub_sizes is false). Still
	 * HEIC/HEIF uploads always skip the check, since the browser's canvas
	 * fallback can decode them even when the server cannot.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has access to create items, WP_Error object otherwise.
	 */
	public function create_item_permissions_check( $request ) {
		$bypass_mime_check = false === $request['generate_sub_sizes'];

		/*
		 * Always allow still HEIC/HEIF uploads through even if the server's
		 * image editor doesn't support them. The client-side canvas fallback
		 * handles processing using the browser's native HEVC decoder.
		 *
		 * The '-sequence' variants (multi-frame Live Photos) are deliberately
		 * excluded: neither the server nor the browser fallback can process
		 * them yet, so they should fall through to the standard unsupported
		 * mime-type error rather than be stored unprocessable.
		 */
		if ( ! $bypass_mime_check ) {
			$still_heic_mime_types = array( 'image/heic', 'image/heif' );
			$files                 = $request->get_file_params();

			if (
				! empty( $files['file']['type'] ) &&
				in_array( $files['file']['type'], $still_heic_mime_types, true )
			) {
				$bypass_mime_check = true;
			}
		}

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
			// Disable server-side "big image" downscaling; the client supplies its
			// own scaled version via the sideload endpoint. Scaling here would
			// create a conflicting "-scaled" file and orphan the full-size upload.
			add_filter( 'big_image_size_threshold', '__return_false', 100 );
		}

		if ( false === $request['convert_format'] ) {
			add_filter( 'image_editor_output_format', '__return_empty_array', 100 );
		}

		/*
		 * When a URL is supplied instead of an uploaded file, sideload the
		 * remote image on the server. This avoids a cross-origin browser fetch,
		 * which fails under cross-origin isolation. The sub-size and scaling
		 * filters applied above still govern whether derivatives are generated.
		 */
		if ( ! empty( $request['url'] ) ) {
			$response = $this->create_item_from_url( $request );
		} else {
			$response = parent::create_item( $request );
		}

		remove_filter( 'intermediate_image_sizes_advanced', '__return_empty_array', 100 );
		remove_filter( 'fallback_intermediate_image_sizes', '__return_empty_array', 100 );
		remove_filter( 'wp_image_maybe_exif_rotate', '__return_false', 100 );
		remove_filter( 'big_image_size_threshold', '__return_false', 100 );
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
	 * Sideloads an external image from a URL into the media library.
	 *
	 * Downloads the remote file on the server, avoiding a cross-origin browser
	 * fetch that fails under cross-origin isolation. Whether sub-sizes are
	 * generated is governed by the filters applied in create_item().
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	protected function create_item_from_url( $request ) {
		// Sideloading downloads and stores a file, so require the upload capability.
		if ( ! current_user_can( 'upload_files' ) ) {
			return new WP_Error(
				'rest_cannot_create',
				__( 'Sorry, you are not allowed to upload media on this site.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$url     = $request['url'];
		$post_id = ! empty( $request['post'] ) ? (int) $request['post'] : 0;

		// Derive the filename from the URL path before downloading anything.
		$url_path = wp_parse_url( $url, PHP_URL_PATH );
		$filename = $url_path ? wp_basename( $url_path ) : '';
		if ( '' === $filename ) {
			return new WP_Error(
				'rest_invalid_url',
				__( 'Could not determine a filename from the provided URL.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		/*
		 * Only download URLs whose extension maps to an allowed image MIME type.
		 * The sideload handler would reject other types anyway (via
		 * wp_check_filetype_and_ext()), but checking first avoids downloading
		 * files that can never be accepted, such as PHP scripts.
		 */
		$filetype = wp_check_filetype( $filename );
		if ( ! $filetype['type'] || ! str_starts_with( $filetype['type'], 'image/' ) ) {
			return new WP_Error(
				'rest_invalid_url',
				__( 'The provided URL does not point to a supported image file.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		/*
		 * Download the remote file with WordPress's HTTP API, which validates
		 * the host and blocks requests to private or local addresses. This is
		 * the same primitive core's media_sideload_image() relies on.
		 */
		$tmp_file = download_url( $url );
		if ( is_wp_error( $tmp_file ) ) {
			return $tmp_file;
		}

		$file_array = array(
			'name'     => $filename,
			'tmp_name' => $tmp_file,
		);

		$size_check = self::check_upload_size( $file_array );
		if ( is_wp_error( $size_check ) ) {
			if ( file_exists( $tmp_file ) ) {
				wp_delete_file( $tmp_file );
			}
			return $size_check;
		}

		$attachment_id = media_handle_sideload( $file_array, $post_id );

		if ( is_wp_error( $attachment_id ) ) {
			/*
			 * media_handle_sideload() deletes the temp file on success; remove
			 * it explicitly when the sideload fails.
			 */
			if ( file_exists( $tmp_file ) ) {
				wp_delete_file( $tmp_file );
			}
			return $attachment_id;
		}

		$attachment = get_post( $attachment_id );

		$request->set_param( 'context', 'edit' );

		/*
		 * media_handle_sideload() fires the standard insert hooks (including
		 * wp_after_insert_post), but not the REST-specific action, so fire it
		 * here for parity with the uploaded-file path in create_item().
		 */
		/** This action is documented in wp-includes/rest-api/endpoints/class-wp-rest-attachments-controller.php */
		do_action( 'rest_after_insert_attachment', $attachment, $request, true );

		$response = $this->prepare_item_for_response( $attachment, $request );
		$response->set_status( 201 );
		$response->header( 'Location', rest_url( rest_get_route_for_post( $attachment_id ) ) );

		return $response;
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

		// Add per-file, size-aware encode quality for images.
		if ( rest_is_field_included( 'image_quality', $fields ) ) {
			if ( wp_attachment_is_image( $item ) ) {
				$mime_type = (string) get_post_mime_type( $item );
				$filename  = get_attached_file( $item->ID );

				// Resolve the output MIME type the same way core's
				// WP_Image_Editor::set_quality() does: quality is filtered
				// against the format the file will actually be saved as.
				/** This filter is documented in wp-includes/class-wp-image-editor.php */
				$output_formats = apply_filters(
					'image_editor_output_format', // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
					array( $mime_type => $mime_type ),
					$filename ? $filename : '',
					$mime_type
				);
				$output_mime    = $output_formats[ $mime_type ] ?? $mime_type;

				$metadata    = wp_get_attachment_metadata( $item->ID, true );
				$full_width  = max( 0, ( is_array( $metadata ) && isset( $metadata['width'] ) ) ? (int) $metadata['width'] : 0 );
				$full_height = max( 0, ( is_array( $metadata ) && isset( $metadata['height'] ) ) ? (int) $metadata['height'] : 0 );

				$full_quality = $this->get_image_encode_quality(
					$output_mime,
					array(
						'width'  => $full_width,
						'height' => $full_height,
					)
				);

				$size_quality = array();
				foreach ( wp_get_registered_image_subsizes() as $size_name => $size_data ) {
					$quality = $this->get_image_encode_quality(
						$output_mime,
						array(
							'width'  => (int) $size_data['width'],
							'height' => (int) $size_data['height'],
						)
					);

					// Only report sizes that diverge from the full-size value
					// to keep the response payload small.
					if ( $quality !== $full_quality ) {
						$size_quality[ $size_name ] = $quality;
					}
				}

				$data['image_quality'] = array(
					'default' => $full_quality,
					'sizes'   => $size_quality,
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

		// Enumerate the registered sub-sizes so the schema documents exactly which
		// keys may appear under "sizes".
		$size_quality_properties = array();
		foreach ( array_keys( wp_get_registered_image_subsizes() ) as $size_name ) {
			$size_quality_properties[ $size_name ] = array(
				'type'    => 'integer',
				'minimum' => 1,
				'maximum' => 100,
			);
		}

		$schema['properties']['image_quality'] = array(
			'description' => __( 'Encode quality (1-100) from the wp_editor_set_quality filter, resolved against the output MIME type. "default" applies to the full-size image; "sizes" lists per-registered-size overrides where the filtered value differs from "default".', 'gutenberg' ),
			'type'        => 'object',
			'context'     => array( 'edit' ),
			'readonly'    => true,
			'properties'  => array(
				'default' => array(
					'type'    => 'integer',
					'minimum' => 1,
					'maximum' => 100,
				),
				'sizes'   => array(
					'type'       => 'object',
					'properties' => $size_quality_properties,
				),
			),
		);

		return $schema;
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
	 * Validates an image size name, or an array of names sharing a single file.
	 *
	 * Shared by the sideload endpoint, which names the size a file is produced
	 * for, and the finalize endpoint, which names the size each submitted entry
	 * is stored under. Both need the same set, and finalize accepts a payload of
	 * its own rather than one this class produced, so leaving it unconstrained
	 * there would let a submission write an arbitrary key into the metadata
	 * 'sizes' array or route a file into a branch it was never produced for.
	 *
	 * @param mixed  $value The image size name, or an array of names.
	 * @param string $param Parameter name, used in the error messages.
	 * @return true|WP_Error True when every name is valid, WP_Error otherwise.
	 */
	private static function validate_image_size_names( $value, string $param ) {
		$special_sizes = self::get_special_image_sizes();
		$regular_sizes = array_values(
			array_diff(
				array_merge(
					array_keys( wp_get_registered_image_subsizes() ),
					// Not a registered sub-size, but stored as an ordinary
					// entry in the metadata 'sizes' array (PDF thumbnails).
					array( 'full' )
				),
				$special_sizes
			)
		);

		if ( is_string( $value ) ) {
			$items       = array( $value );
			$valid_sizes = array_merge( $regular_sizes, $special_sizes );
		} elseif ( is_array( $value ) ) {
			/**
			 * An array registers one sideloaded file under several size names,
			 * which only makes sense for regular sub-sizes: each special size
			 * names a single file with its own handling in
			 * {@see self::sideload_item()} and its own metadata key in
			 * {@see self::finalize_item()}. Rejecting them here is what lets the
			 * array branches in both methods treat an array as regular sizes.
			 */
			$items       = $value;
			$valid_sizes = $regular_sizes;
		} else {
			return new WP_Error(
				'rest_invalid_type',
				/* translators: %s: Parameter name. */
				sprintf( __( '%s must be a string or an array of strings.', 'gutenberg' ), $param )
			);
		}

		foreach ( $items as $item ) {
			if ( ! in_array( $item, $valid_sizes, true ) ) {
				return new WP_Error(
					'rest_not_in_enum',
					/* translators: %s: Parameter name. */
					sprintf( __( '%s contains an invalid image size.', 'gutenberg' ), $param )
				);
			}
		}

		return true;
	}

	/**
	 * Returns the image size names which name a single file rather than a sub-size.
	 *
	 * Each of these is handled on its own in {@see self::sideload_item()} and stored
	 * under its own key by {@see self::finalize_item()}, so unlike a regular
	 * sub-size none of them may appear in an array of names sharing one file.
	 *
	 * @return string[] Special image size names.
	 *
	 * @phpstan-return non-empty-list<non-empty-string>
	 */
	private static function get_special_image_sizes(): array {
		return array(
			'original',
			'scaled',
			// Source-format original (e.g. the HEIC kept alongside its JPEG derivative).
			self::IMAGE_SIZE_SOURCE_ORIGINAL,
			// Converted-video companions for an animated GIF (the MP4/WebM and its poster).
			self::IMAGE_SIZE_ANIMATED_VIDEO,
			self::IMAGE_SIZE_ANIMATED_VIDEO_POSTER,
		);
	}

	/**
	 * Validates that uploaded image dimensions are appropriate for the specified image size.
	 *
	 * @param int          $width         Uploaded image width.
	 * @param int          $height        Uploaded image height.
	 * @param string|array $image_size    The target image size name, or an array
	 *                                    of names that share the same dimensions.
	 * @param int          $attachment_id The attachment ID.
	 * @return true|WP_Error True if valid, WP_Error if invalid.
	 */
	private function validate_image_dimensions( int $width, int $height, $image_size, int $attachment_id ) {
		// 'animated_video' companion file: video, not an image. Skip *all*
		// dimension checks (the caller passes (0, 0) for this case so the
		// positive-dimension assertion below would otherwise fire).
		if ( self::IMAGE_SIZE_ANIMATED_VIDEO === $image_size ) {
			return true;
		}

		// Source-format original companion file: no dimension constraint, and
		// the caller passes (0, 0) because the source format (e.g. HEIC) may
		// not be readable by wp_getimagesize() at all.
		if ( self::IMAGE_SIZE_SOURCE_ORIGINAL === $image_size ) {
			return true;
		}

		// Dimensions must be positive for all sizes.
		if ( $width <= 0 || $height <= 0 ) {
			return new WP_Error(
				'rest_upload_invalid_dimensions',
				__( 'Uploaded image must have positive dimensions.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		// Arrays only contain regular sub-size names that share dimensions, which
		// the image_size validation enforces (ref. get_special_image_sizes()).
		// Validate each one against its registered constraints.
		if ( is_array( $image_size ) ) {
			foreach ( $image_size as $name ) {
				$result = $this->validate_image_dimensions( $width, $height, $name, $attachment_id );
				if ( is_wp_error( $result ) ) {
					return $result;
				}
			}
			return true;
		}

		// 'animated_video_poster' companion: a static poster image for the
		// converted video. It is a real image (so it has positive dimensions)
		// but is not a registered sub-size, so it has no dimension constraint.
		if ( self::IMAGE_SIZE_ANIMATED_VIDEO_POSTER === $image_size ) {
			return true;
		}

		// 'original' size: the full-size image that replaces the main file (see
		// sideload_item()/finalize_item()). The endpoint expects any EXIF
		// orientation to be applied to the image already, which can swap width
		// and height, so the dimensions must match the stored dimensions or be
		// their transpose.
		if ( 'original' === $image_size ) {
			$metadata = wp_get_attachment_metadata( $attachment_id, true );
			if ( is_array( $metadata ) && isset( $metadata['width'], $metadata['height'] ) ) {
				$expected_width  = (int) $metadata['width'];
				$expected_height = (int) $metadata['height'];

				$matches_dimensions    = $width === $expected_width && $height === $expected_height;
				$transposes_dimensions = $width === $expected_height && $height === $expected_width;

				if ( ! $matches_dimensions && ! $transposes_dimensions ) {
					return new WP_Error(
						'rest_upload_dimension_mismatch',
						sprintf(
							/* translators: 1: actual width, 2: actual height, 3: expected width, 4: expected height */
							__( 'Uploaded image dimensions (%1$dx%2$d) do not match original image dimensions (%3$dx%4$d).', 'gutenberg' ),
							$width,
							$height,
							$expected_width,
							$expected_height
						),
						array( 'status' => 400 )
					);
				}
			}
			return true;
		}

		// 'full' size (PDF thumbnails) and 'scaled': no further constraints.
		if ( 'full' === $image_size || 'scaled' === $image_size ) {
			return true;
		}

		// Regular image sizes: validate against registered size constraints.
		$registered_sizes = wp_get_registered_image_subsizes();

		if ( ! isset( $registered_sizes[ $image_size ] ) ) {
			return new WP_Error(
				'rest_upload_unknown_size',
				__( 'Unknown image size.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		$size_data  = $registered_sizes[ $image_size ];
		$max_width  = (int) $size_data['width'];
		$max_height = (int) $size_data['height'];

		// Validate dimensions don't exceed the registered size maximums.
		// Allow 1px tolerance for rounding differences.
		$tolerance = 1;

		if ( $max_width > 0 && $width > $max_width + $tolerance ) {
			return new WP_Error(
				'rest_upload_dimension_mismatch',
				sprintf(
					/* translators: 1: image size name, 2: max width, 3: actual width */
					__( 'Uploaded image width (%3$d) exceeds maximum for "%1$s" size (%2$d).', 'gutenberg' ),
					$image_size,
					$max_width,
					$width
				),
				array( 'status' => 400 )
			);
		}

		if ( $max_height > 0 && $height > $max_height + $tolerance ) {
			return new WP_Error(
				'rest_upload_dimension_mismatch',
				sprintf(
					/* translators: 1: image size name, 2: max height, 3: actual height */
					__( 'Uploaded image height (%3$d) exceeds maximum for "%1$s" size (%2$d).', 'gutenberg' ),
					$image_size,
					$max_height,
					$height
				),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Side-loads a media file without creating a new attachment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function sideload_item( WP_REST_Request $request ) {
		$attachment_id = (int) $request['id'];

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
				__( 'Invalid post ID. Only images and PDFs can be sideloaded.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		/*
		 * Sideloaded files are placed in the same directory as the attachment
		 * they extend, because the file names produced here are later resolved
		 * against that directory. An attachment stored outside the uploads
		 * directory has no such directory to use, so there is nowhere the names
		 * this would produce could resolve.
		 */
		$attached_file = get_attached_file( $attachment_id, true );
		$subdir        = is_string( $attached_file ) && '' !== $attached_file
			? $this->get_attachment_upload_subdir( $attached_file )
			: null;

		if ( ! is_string( $attached_file ) || '' === $attached_file || null === $subdir ) {
			return new WP_Error(
				'rest_sideload_attachment_not_in_uploads',
				__( 'The attachment is not stored in the uploads directory, so a file cannot be sideloaded for it.', 'gutenberg' ),
				array( 'status' => 403 )
			);
		}

		if ( false === $request['convert_format'] ) {
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

		$attachment_filename = wp_basename( $attached_file );

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

		// Pin the upload to the attachment's own directory, rather than deriving
		// it from the parent post's date as media_handle_upload() does for a
		// brand new upload. See the note above where $subdir is resolved.
		$filter_upload_dir = static function ( $uploads ) use ( $subdir ) {
			if (
				is_array( $uploads ) &&
				isset( $uploads['basedir'], $uploads['baseurl'] ) &&
				is_string( $uploads['basedir'] ) &&
				is_string( $uploads['baseurl'] )
			) {
				$uploads['subdir'] = $subdir;
				$uploads['path']   = $uploads['basedir'] . $subdir;
				$uploads['url']    = $uploads['baseurl'] . $subdir;
			}
			return $uploads;
		};

		add_filter( 'upload_dir', $filter_upload_dir, 100 );

		if ( ! empty( $files ) ) {
			$file = $this->upload_from_file( $files, $headers );
		} else {
			$file = $this->upload_from_data( $request->get_body(), $headers );
		}

		remove_filter( 'wp_unique_filename', $filter_filename );
		remove_filter( 'image_editor_output_format', '__return_empty_array', 100 );
		remove_filter( 'upload_dir', $filter_upload_dir, 100 );

		if ( is_wp_error( $file ) ) {
			return $file;
		}

		$type = $file['type'];
		$path = $file['file'];

		$image_size = $request['image_size'];

		// Read dimensions once up-front. Needed both for early-error handling
		// (corrupted/unsupported files) and for populating the sub-size payload
		// below. 'original' and 'scaled' both replace the main file, so their
		// dimensions are written to metadata; 'original' is additionally
		// validated against the stored attachment size (it must match it or be
		// its transpose).
		//
		// 'animated_video' companions are video files (MP4/WebM); the image
		// helpers can't read their dimensions and would falsely report the
		// upload as "corrupted or unsupported". Source-format originals
		// ('source_original', e.g. the HEIC kept next to its JPEG derivative)
		// are exempt for the same reason: their dimensions are neither
		// validated nor recorded, and wp_getimagesize() may not be able to
		// read the source format at all on servers without HEIC/HEIF support.
		// Skip the read for both cases; validate_image_dimensions() also
		// short-circuits them below.
		$skip_dimension_read =
			self::IMAGE_SIZE_ANIMATED_VIDEO === $image_size ||
			self::IMAGE_SIZE_SOURCE_ORIGINAL === $image_size;

		$size = $skip_dimension_read ? array( 0, 0 ) : wp_getimagesize( $path );

		if ( ! $size ) {
			// Could not determine dimensions (corrupted file, unsupported format).
			wp_delete_file( $path );
			return new WP_Error(
				'rest_upload_invalid_image',
				__( 'Could not read image dimensions. The file may be corrupted or an unsupported format.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}

		$validation = $this->validate_image_dimensions( $size[0], $size[1], $image_size, $attachment_id );
		if ( is_wp_error( $validation ) ) {
			// Clean up the uploaded file.
			wp_delete_file( $path );
			return $validation;
		}

		// Build sub-size data to return to the client.
		// The client accumulates these and sends them all to the finalize endpoint.
		// `image_size` may be a single string or an array of names that share the
		// same dimensions and therefore reuse a single sideloaded file. Arrays
		// only carry regular sub-sizes; the special keys below ('original',
		// 'scaled', and the source-format original) are always scalar strings,
		// which the image_size validation enforces (ref. get_special_image_sizes()).
		$sub_size_data = array(
			'image_size' => $image_size,
		);

		if ( is_array( $image_size ) ) {
			$sub_size_data['width']     = $size[0];
			$sub_size_data['height']    = $size[1];
			$sub_size_data['file']      = wp_basename( $path );
			$sub_size_data['mime_type'] = $type;
			$sub_size_data['filesize']  = wp_filesize( $path );
		} elseif ( self::IMAGE_SIZE_SOURCE_ORIGINAL === $image_size ) {
			// Source-format original. finalize_item() writes the filename to
			// $metadata[ self::META_KEY_SOURCE_IMAGE ] (separate from
			// 'original_image', which the scaled-sideload flow owns). Cleanup on
			// attachment delete is handled by a delete_attachment hook that reads
			// this key.
			$sub_size_data['file'] = wp_basename( $path );
		} elseif ( self::IMAGE_SIZE_ANIMATED_VIDEO === $image_size ) {
			// Converted animated-GIF video companion. finalize_item()
			// writes the filename to $metadata['animated_video']; the editor
			// reads it to switch the block to a video, and a delete_attachment
			// hook removes it. See lib/media/animated-gif-to-video.php.
			$sub_size_data['file'] = wp_basename( $path );
		} elseif ( self::IMAGE_SIZE_ANIMATED_VIDEO_POSTER === $image_size ) {
			// Static poster for the converted video. finalize_item() writes
			// the filename to $metadata['animated_video_poster']; used as the
			// video block's poster and deleted with the video.
			$sub_size_data['file'] = wp_basename( $path );
		} elseif ( 'scaled' === $image_size || 'original' === $image_size ) {
			// 'scaled' and 'original' both replace the attachment's main file
			// with the supplied image and keep the file being replaced as
			// `original_image`, which is the untouched upload. A 'scaled' image is
			// downsized and an 'original' image has any EXIF orientation already
			// applied. This is the same swap WordPress makes when it scales or
			// rotates an image on upload. See core's _wp_image_meta_replace_original().
			$sub_size_data['original_image'] = $attachment_filename;

			// Update the attached file to point to the supplied image.
			// This writes to _wp_attached_file meta, not _wp_attachment_metadata.
			// Guard against a failed update so a stale original is not recorded.
			if (
				$attached_file !== $path &&
				! update_attached_file( $attachment_id, $path )
			) {
				// Clean up the uploaded file, which nothing references yet.
				wp_delete_file( $path );
				return new WP_Error(
					'rest_sideload_update_attached_file_failed',
					__( 'Unable to update the attached file for this attachment.', 'gutenberg' ),
					array( 'status' => 500 )
				);
			}

			$sub_size_data['width']    = $size[0];
			$sub_size_data['height']   = $size[1];
			$sub_size_data['filesize'] = wp_filesize( $path );
			$sub_size_data['file']     = _wp_relative_upload_path( $path );
		} else {
			$sub_size_data['width']     = $size[0];
			$sub_size_data['height']    = $size[1];
			$sub_size_data['file']      = wp_basename( $path );
			$sub_size_data['mime_type'] = $type;
			$sub_size_data['filesize']  = wp_filesize( $path );
		}

		/*
		 * Record the file names produced for this attachment so finalize can
		 * confirm every stored sub-size was actually sideloaded here. The
		 * values recorded are exactly the ones handed back to the client, so
		 * finalize accepts a submission only when it echoes what was produced.
		 * add_post_meta() appends one row per value, which avoids the
		 * read-modify-write race that a single serialized value would create
		 * for concurrent sideloads (the same reason metadata is deferred to
		 * finalize).
		 */
		foreach ( array( 'file', 'original_image' ) as $provenance_key ) {
			if (
				isset( $sub_size_data[ $provenance_key ] ) &&
				is_string( $sub_size_data[ $provenance_key ] ) &&
				'' !== $sub_size_data[ $provenance_key ]
			) {
				add_post_meta( $attachment_id, self::META_KEY_SIDELOAD_FILE_NAME, wp_slash( $sub_size_data[ $provenance_key ] ) );
			}
		}

		return rest_ensure_response( $sub_size_data );
	}

	/**
	 * Filters wp_unique_filename during sideloads.
	 *
	 * wp_unique_filename() will always add numeric suffix if the name looks like a sub-size to avoid conflicts.
	 * Adding this closure to the filter helps work around this safeguard.
	 *
	 * Example: when uploading myphoto.jpeg, WordPress normally creates myphoto-150x150.jpeg,
	 * and when uploading myphoto-150x150.jpeg, it will be renamed to myphoto-150x150-1.jpeg
	 * However, here it is desired not to add the suffix in order to maintain the same
	 * naming convention as if the file was uploaded regularly.
	 *
	 * The suffix is only dropped when no file of that name already exists in $dir,
	 * so this never returns a name that would overwrite one. The unsuffixed name
	 * must also derive from the attachment's own file name, and
	 * {@see self::sideload_item()} pins the upload to the attachment's own
	 * directory, so any name returned here belongs to the attachment being
	 * extended.
	 *
	 * @link https://github.com/WordPress/wordpress-develop/blob/30954f7ac0840cfdad464928021d7f380940c347/src/wp-includes/functions.php#L2576-L2582
	 *
	 * @param string      $filename            Unique file name.
	 * @param string      $dir                 Directory path.
	 * @param int|string  $number              The highest number that was used to make the file name unique
	 *                                         or an empty string if unused.
	 * @param string|null $attachment_filename Original attachment file name.
	 * @return string Filtered file name.
	 */
	private static function filter_wp_unique_filename( $filename, $dir, $number, $attachment_filename ) {
		if ( ! is_int( $number ) || ! $attachment_filename ) {
			return $filename;
		}

		$ext       = pathinfo( $filename, PATHINFO_EXTENSION );
		$name      = pathinfo( $filename, PATHINFO_FILENAME );
		$orig_name = pathinfo( $attachment_filename, PATHINFO_FILENAME );

		if ( ! $ext || ! $name ) {
			return $filename;
		}

		$matches = array();
		if ( preg_match( '/(.*)-(\d+x\d+|scaled)-' . $number . '$/', $name, $matches ) ) {
			$filename_without_suffix = $matches[1] . '-' . $matches[2] . ".$ext";
			if ( $matches[1] === $orig_name && ! file_exists( "$dir/$filename_without_suffix" ) ) {
				return $filename_without_suffix;
			}
		}

		return $filename;
	}

	/**
	 * Validates the `sub_sizes` file names against what this attachment produced.
	 *
	 * The {@see self::finalize_item()} method stores the client-supplied `file`
	 * and `original_image` values in the attachment metadata, where they are
	 * later resolved within the attachment's upload directory and read or deleted
	 * (for example by {@see wp_get_original_image_path()}, {@see wp_getimagesize()},
	 * and {@see wp_delete_attachment_files()}).
	 *
	 * Every file the sideload endpoint creates is recorded under
	 * {@see self::META_KEY_SIDELOAD_FILE_NAME} as it is produced, using
	 * server-generated names. finalize accepts a `file` or `original_image`
	 * value only when it matches one of those recorded names (or the
	 * attachment's own attached file, which it definitionally owns).
	 *
	 * @param int   $attachment_id The attachment being finalized.
	 * @param array $sub_sizes     Sub-size metadata collected from sideloads.
	 * @return true|WP_Error True if every file name was produced here, WP_Error otherwise.
	 *
	 * @phpstan-param list<Image_Sub_Size> $sub_sizes
	 */
	protected function validate_sub_size_provenance( int $attachment_id, array $sub_sizes ) {
		$allowed = $this->get_sideloaded_file_names( $attachment_id );

		foreach ( $sub_sizes as $sub_size ) {
			foreach ( array( 'file', 'original_image' ) as $key ) {
				/*
				 * Every value that was sent is checked, no matter how unlikely
				 * a name it looks. A loose emptiness test would wave through
				 * '0', which is a valid one-character name as far as the schema
				 * is concerned and is stored like any other. A value the schema
				 * types as a string but which arrives as something else is
				 * rejected rather than skipped, so a subclass which widens the
				 * schema cannot pass an unchecked value on to the metadata.
				 */
				if ( ! isset( $sub_size[ $key ] ) ) {
					continue;
				}

				if ( ! is_string( $sub_size[ $key ] ) || ! in_array( $sub_size[ $key ], $allowed, true ) ) {
					return new WP_Error(
						'rest_invalid_sub_size_file',
						__( 'Invalid sub-size file name. File names must have been produced by a prior sideload for this attachment.', 'gutenberg' ),
						array( 'status' => 400 )
					);
				}
			}
		}

		return true;
	}

	/**
	 * Returns the file names which a finalize request may store for an attachment.
	 *
	 * The set is the file names the sideload endpoint recorded as it produced
	 * them (ref. {@see self::META_KEY_SIDELOAD_FILE_NAME}), plus the attachment's own
	 * attached file - accepted in both its uploads-relative and basename form so
	 * a scaled main-file pointer validates regardless of which the client
	 * echoes - plus the names already stored in the attachment's own metadata.
	 *
	 * @param int  $attachment_id      The attachment being finalized.
	 * @param bool $include_provenance Whether to include the sideload provenance rows.
	 *                                 Pass false to get only the names recoverable from
	 *                                 the attached file and stored metadata, e.g. to decide
	 *                                 whether a provenance row is still needed. Default true.
	 * @return string[] File names that may appear in the finalize submission.
	 *
	 * @phpstan-return list<string>
	 */
	protected function get_sideloaded_file_names( int $attachment_id, bool $include_provenance = true ): array {
		$allowed = array();

		if ( $include_provenance ) {
			foreach ( (array) get_post_meta( $attachment_id, self::META_KEY_SIDELOAD_FILE_NAME ) as $name ) {
				if ( is_string( $name ) && '' !== $name ) {
					$allowed[] = $name;
				}
			}
		}

		$attached_file = get_post_meta( $attachment_id, '_wp_attached_file', true );
		if ( is_string( $attached_file ) && strlen( $attached_file ) > 0 ) {
			$allowed[] = $attached_file;
			$allowed[] = wp_basename( $attached_file );
		}

		/*
		 * Names already stored in this attachment's metadata passed this same
		 * check when they were written, so accepting them again introduces
		 * nothing new.
		 */
		$metadata = wp_get_attachment_metadata( $attachment_id, true );
		if ( is_array( $metadata ) ) {
			$stored = array(
				$metadata['file'] ?? null,
				$metadata['original_image'] ?? null,
				$metadata[ self::META_KEY_SOURCE_IMAGE ] ?? null,
				$metadata['animated_video'] ?? null,
				$metadata['animated_video_poster'] ?? null,
			);

			if ( ! empty( $metadata['sizes'] ) && is_array( $metadata['sizes'] ) ) {
				foreach ( $metadata['sizes'] as $size ) {
					$stored[] = is_array( $size ) ? ( $size['file'] ?? null ) : null;
				}
			}

			foreach ( $stored as $name ) {
				if ( is_string( $name ) && '' !== $name ) {
					$allowed[] = $name;
					$allowed[] = wp_basename( $name );
				}
			}
		}

		return array_values( array_unique( $allowed ) );
	}

	/**
	 * Returns the uploads subdirectory an attachment is stored in.
	 *
	 * Used to place a sideloaded file alongside the attachment it extends. The
	 * result is concatenated into a filesystem path by the caller, so it is
	 * returned only when the attachment resolves inside the uploads directory
	 * and the stored path is well formed.
	 *
	 * @param string $attached_file Absolute path to the attached file.
	 * @return string|null Subdirectory beginning with a slash, an empty string when the
	 *                     attachment sits in the base directory, or null when the
	 *                     attachment is not inside the uploads directory.
	 *
	 * @phpstan-param non-empty-string $attached_file
	 */
	protected function get_attachment_upload_subdir( string $attached_file ): ?string {
		$uploads = wp_get_upload_dir();
		if ( empty( $uploads['basedir'] ) ) {
			return null;
		}

		$basedir  = untrailingslashit( wp_normalize_path( $uploads['basedir'] ) );
		$file_dir = wp_normalize_path( dirname( $attached_file ) );

		/*
		 * The attachment's directory must be the uploads base directory itself
		 * or a directory inside it. The trailing slash in the prefix comparison
		 * keeps a sibling directory that merely shares the prefix (for example
		 * 'uploads-elsewhere' next to 'uploads') from matching.
		 */
		if ( $file_dir !== $basedir && ! str_starts_with( $file_dir, trailingslashit( $basedir ) ) ) {
			return null;
		}

		$subdir = (string) substr( $file_dir, strlen( $basedir ) );

		// A prefix match alone does not rule out a path that climbs back out.
		if ( in_array( '..', explode( '/', $subdir ), true ) ) {
			return null;
		}

		return $subdir;
	}

	/**
	 * Finalizes an attachment after client-side media processing.
	 *
	 * Applies the sub-size metadata collected from sideload responses in a
	 * single metadata update, then triggers the 'wp_generate_attachment_metadata'
	 * filter so that server-side plugins can process the attachment after all
	 * client-side operations (upload, thumbnail generation, sideloads) are
	 * complete.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function finalize_item( WP_REST_Request $request ) {
		$attachment_id = (int) $request['id'];

		$post = $this->get_post( $attachment_id );
		if ( is_wp_error( $post ) ) {
			return $post;
		}

		/**
		 * Sub-size metadata collected from sideload responses. Confirm every
		 * file name was produced by a prior sideload for this attachment before
		 * storing it, so a client cannot make finalize record (and later read or
		 * delete) another attachment's files.
		 *
		 * @var list<Image_Sub_Size> $sub_sizes
		 */
		$sub_sizes  = $request['sub_sizes'] ?? array();
		$provenance = $this->validate_sub_size_provenance( $attachment_id, $sub_sizes );
		if ( is_wp_error( $provenance ) ) {
			return $provenance;
		}

		$metadata = wp_get_attachment_metadata( $attachment_id );
		if ( ! is_array( $metadata ) ) {
			$metadata = array();
		}

		// Apply all sub-size metadata collected from sideload responses.
		foreach ( $sub_sizes as $sub_size ) {
			$image_size = $sub_size['image_size'];

			// When multiple size names share identical dimensions the client
			// sends a single sub-size entry with an array of names. Register the
			// same file under each name.
			if ( is_array( $image_size ) ) {
				/*
				 * Arrays carry regular sizes only, as the sideload endpoint
				 * enforces. Each special size names a single file handled by one
				 * of the branches below, so grouping one under a shared file
				 * would write it to the wrong place; reject rather than guess.
				 */
				if ( array_intersect( $image_size, self::get_special_image_sizes() ) ) {
					return new WP_Error(
						'rest_invalid_sub_size_name',
						__( 'A grouped sub-size entry may only name regular image sizes.', 'gutenberg' ),
						array( 'status' => 400 )
					);
				}

				// As below: `file` is not required by the schema, and a size
				// entry that names no file is not worth recording.
				if ( empty( $sub_size['file'] ) ) {
					continue;
				}

				$metadata['sizes'] = $metadata['sizes'] ?? array();

				foreach ( $image_size as $name ) {
					$metadata['sizes'][ $name ] = array(
						'width'     => $sub_size['width'] ?? 0,
						'height'    => $sub_size['height'] ?? 0,
						'file'      => $sub_size['file'],
						'mime-type' => $sub_size['mime_type'] ?? '',
						'filesize'  => $sub_size['filesize'] ?? 0,
					);
				}
				continue;
			}

			if ( 'original' === $image_size || 'scaled' === $image_size ) {
				// Skip malformed entries so a bad payload cannot blank out the
				// main file metadata.
				if ( empty( $sub_size['file'] ) ) {
					continue;
				}

				/*
				 * Record the supplied full-size image (from sideload_item()) as
				 * the main file, keeping the current attached file as
				 * `original_image`. A 'scaled' image is downsized and an
				 * 'original' image is rotated; both have any EXIF orientation
				 * already applied by the client.
				 */
				if ( ! empty( $sub_size['original_image'] ) ) {
					$metadata['original_image'] = $sub_size['original_image'];
				}
				$metadata['width']    = $sub_size['width'] ?? 0;
				$metadata['height']   = $sub_size['height'] ?? 0;
				$metadata['filesize'] = $sub_size['filesize'] ?? 0;
				$metadata['file']     = $sub_size['file'];

				/*
				 * The supplied image has its orientation applied already, so
				 * reset the stored value (from the upload) to 1, as
				 * wp_create_image_subsizes() does for both its scale and rotate
				 * paths. Otherwise exif_orientation would still report the
				 * pre-rotation value and the client would rotate the image
				 * again on a re-fetch.
				 */
				if ( ! empty( $metadata['image_meta']['orientation'] ) ) {
					$metadata['image_meta']['orientation'] = 1;
				}
			} elseif ( self::IMAGE_SIZE_SOURCE_ORIGINAL === $image_size ) {
				// As above: `file` is not required by the schema, and each of
				// these sizes is nothing but the file it names.
				if ( empty( $sub_size['file'] ) ) {
					continue;
				}

				/*
				 * Source-format original: stored under its own meta key so the
				 * scaled-sideload flow (which writes 'original_image') cannot
				 * clobber it. 'original_image' keeps pointing at the
				 * web-viewable JPEG derivative. Cleanup on attachment delete
				 * is handled by a delete_attachment hook that reads this key.
				 */
				$metadata[ self::META_KEY_SOURCE_IMAGE ] = $sub_size['file'];
			} elseif ( self::IMAGE_SIZE_ANIMATED_VIDEO === $image_size ) {
				if ( empty( $sub_size['file'] ) ) {
					continue;
				}

				/*
				 * Converted-video companion of an animated GIF. Stored under its
				 * own meta key; 'original_image' keeps pointing at the GIF. The
				 * editor reads this key to switch the block to a video; companion
				 * cleanup lives in lib/media/animated-gif-to-video.php.
				 */
				$metadata[ self::META_KEY_ANIMATED_VIDEO ] = $sub_size['file'];
			} elseif ( self::IMAGE_SIZE_ANIMATED_VIDEO_POSTER === $image_size ) {
				if ( empty( $sub_size['file'] ) ) {
					continue;
				}

				/*
				 * Static first-frame poster for the converted video. Used as the
				 * video block's poster and deleted alongside the video. See
				 * lib/media/animated-gif-to-video.php.
				 */
				$metadata[ self::META_KEY_ANIMATED_VIDEO_POSTER ] = $sub_size['file'];
			} else {
				if ( empty( $sub_size['file'] ) ) {
					continue;
				}

				$metadata['sizes'] = $metadata['sizes'] ?? array();

				$metadata['sizes'][ $image_size ] = array(
					'width'     => $sub_size['width'] ?? 0,
					'height'    => $sub_size['height'] ?? 0,
					'file'      => $sub_size['file'],
					'mime-type' => $sub_size['mime_type'] ?? '',
					'filesize'  => $sub_size['filesize'] ?? 0,
				);
			}
		}

		/** This filter is documented in wp-admin/includes/image.php */
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
		$metadata = apply_filters( 'wp_generate_attachment_metadata', $metadata, $attachment_id, 'update' );

		wp_update_attachment_metadata( $attachment_id, $metadata );

		/*
		 * Drop only the provenance rows this request consumed, now that the
		 * names are recorded in the metadata itself. A row is dropped only once
		 * its name is recoverable from the stored metadata, so a name the
		 * 'wp_generate_attachment_metadata' filter removed - or that a failed
		 * update never persisted - keeps its row and the retried request the
		 * endpoint documents as idempotent still validates. Rows for sideloads
		 * that have not been finalized yet survive for a later call, and passing
		 * the value makes the delete a no-op when the row is already gone, so a
		 * retried request cleans up without error. Any rows left behind by an
		 * abandoned upload are removed with the attachment itself.
		 *
		 * Retrying is idempotent for the request as it was sent. A name is only
		 * unavailable to a retry once a later finalize has overwritten the same
		 * size with a newly sideloaded file, which drops the earlier name from
		 * the metadata the retry recovers it from.
		 *
		 * The names are collected before deleting so a request which repeats
		 * the same name across many sub-sizes still issues one query per
		 * distinct name.
		 */
		$recoverable = $this->get_sideloaded_file_names( $attachment_id, false );
		$consumed    = array();
		foreach ( $sub_sizes as $sub_size ) {
			foreach ( array( 'file', 'original_image' ) as $key ) {
				// Matches the set validate_sub_size_provenance() checked, so
				// every name a request was allowed to store is also cleaned up.
				if (
					isset( $sub_size[ $key ] ) &&
					is_string( $sub_size[ $key ] ) &&
					in_array( $sub_size[ $key ], $recoverable, true )
				) {
					$consumed[] = $sub_size[ $key ];
				}
			}
		}

		foreach ( array_unique( $consumed ) as $file_name ) {
			delete_post_meta( $attachment_id, self::META_KEY_SIDELOAD_FILE_NAME, wp_slash( $file_name ) );
		}

		$response_request = new WP_REST_Request(
			WP_REST_Server::READABLE,
			rest_get_route_for_post( $attachment_id )
		);

		$response_request['context'] = 'edit';

		if ( isset( $request['_fields'] ) ) {
			$response_request['_fields'] = $request['_fields'];
		}

		return $this->prepare_item_for_response( $post, $response_request );
	}

	/**
	 * Resolves the encode quality WordPress would use for an image.
	 *
	 * Prefers the core wp_get_image_encode_quality() helper when available, and
	 * otherwise mirrors WP_Image_Editor::set_quality() inline for WordPress
	 * versions that predate it: per-format default, the wp_editor_set_quality
	 * filter, the jpeg_quality filter for JPEG output, then resets non-numeric
	 * or out-of-range values to the default and squashes 0 to 1.
	 *
	 * wp_get_image_encode_quality() is proposed for WordPress core in
	 * https://github.com/WordPress/wordpress-develop/pull/11856; until it lands
	 * the function_exists() guard falls back to the inline implementation below.
	 *
	 * @param non-empty-string $mime_type The output image MIME type, e.g. 'image/jpeg'.
	 * @param array{ width?: non-negative-int, height?: non-negative-int } $size Dimensions ('width', 'height') for the wp_editor_set_quality filter.
	 * @return int<1, 100> Encode quality between 1 and 100.
	 */
	private function get_image_encode_quality( string $mime_type, array $size = array() ): int {
		if ( function_exists( 'wp_get_image_encode_quality' ) ) {
			return wp_get_image_encode_quality( $mime_type, $size );
		}

		// Mirror WP_Image_Editor::get_default_quality(): WebP defaults to 86,
		// everything else to 82.
		$default_quality = ( 'image/webp' === $mime_type ) ? 86 : 82;

		/** This filter is documented in wp-includes/class-wp-image-editor.php */
		$quality = apply_filters(
			'wp_editor_set_quality', // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
			$default_quality,
			$mime_type,
			$size
		);

		if ( 'image/jpeg' === $mime_type ) {
			/** This filter is documented in wp-includes/class-wp-image-editor.php */
			$quality = apply_filters( 'jpeg_quality', $quality, 'image_resize' ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
		}

		if ( ! is_numeric( $quality ) ) {
			$quality = $default_quality;
		} else {
			$quality = (int) $quality;
		}

		// Reset out-of-range values to the default, matching WP_Image_Editor::set_quality().
		if ( $quality < 0 || $quality > 100 ) {
			$quality = $default_quality;
		}

		// Allow 0, but squash to 1, matching WP_Image_Editor::set_quality().
		if ( 0 === $quality ) {
			$quality = 1;
		}

		return $quality;
	}
}
