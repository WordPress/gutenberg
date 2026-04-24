<?php
/**
 * Experimental: canonical `{ transform, crop }` editing for
 * `/wp/v2/media/{id}/edit`.
 *
 * Intercepts the existing `/edit` endpoint via `rest_dispatch_request` and
 * handles requests whose body includes a `transform` or `crop` key. The
 * existing `modifiers` (and legacy `rotation`/`x`/`y`/`width`/`height`)
 * paths are untouched — presence of `transform`/`crop` is the opt-in signal.
 *
 * Why this exists: the `modifiers` contract couples the transform sequence
 * to the wire format and can only express axis-aligned crops against the
 * post-rotate AABB after each modifier. The canonical shape separates the
 * *what the user sees* description into two independent parts:
 *
 *   1. `transform` — source-pixel operations: rotate then flip.
 *   2. `crop`      — axis-aligned rect in the **post-transform canvas**.
 *
 * Wire contract:
 *
 *     {
 *       "src": "...",
 *       "transform": {
 *         "rotation": 90,
 *         "flip": { "horizontal": false, "vertical": false }
 *       },
 *       "crop": { "x": 0, "y": 0, "width": 576, "height": 1024 },
 *       "output": { "width": 800, "height": 600 }   // optional
 *     }
 *
 * Crop frame: `crop` is in the post-transform canvas in canvas pixels.
 * The client expresses it against the **snap-rotation** bbox (nearest
 * 90°) because that's the frame the cropper's stencil is laid out in.
 * At snap angles this equals the full post-transform canvas and the
 * result is pixel-exact WYSIWYG. At non-snap angles the server rotates
 * to the full AABB and crops the same-dimension rect; the content is
 * visually close to the stencil but not pixel-identical. MVP scope.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Intercepts POST requests to `/wp/v2/media/{id}/edit` that carry a
 * `transform`/`crop` body and handles them end-to-end. Any other request
 * (including `modifiers`-based edits) passes through untouched.
 *
 * @param mixed           $dispatch_result Response to replace the route's callback output, or null.
 * @param WP_REST_Request $request         The current request.
 * @param string          $route           Matched route regex (unused).
 * @param array           $handler         Matched route handler (unused).
 * @return mixed Null to fall through to the registered callback, otherwise a response/error.
 */
function gutenberg_source_region_dispatch( $dispatch_result, $request, $route, $handler ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	if ( null !== $dispatch_result ) {
		return $dispatch_result;
	}

	if ( 'POST' !== $request->get_method() ) {
		return null;
	}

	// `$route` filter param is the registered regex, not the resolved
	// path. Match against the request's actual URL instead.
	$request_route = $request->get_route();
	if ( ! preg_match( '#^/wp/v2/media/(?P<id>\d+)/edit$#', $request_route, $matches ) ) {
		return null;
	}

	$params = $request->get_json_params();
	if ( ! is_array( $params ) ) {
		return null;
	}
	if ( ! isset( $params['transform'] ) && ! isset( $params['crop'] ) ) {
		return null;
	}

	$validation = gutenberg_source_region_validate( $params );
	if ( is_wp_error( $validation ) ) {
		return $validation;
	}

	return gutenberg_source_region_process( (int) $matches['id'], $request, $params );
}
add_filter( 'rest_dispatch_request', 'gutenberg_source_region_dispatch', 10, 4 );

/**
 * Validates `transform` and `crop` fields of the request body.
 * Returns `true` on success, or a `WP_Error` with `rest_invalid_param`
 * on the first failure.
 *
 * @param array $params Full request body as parsed JSON.
 * @return true|WP_Error
 */
function gutenberg_source_region_validate( $params ) {
	if ( isset( $params['transform'] ) ) {
		$transform = $params['transform'];
		if ( ! is_array( $transform ) ) {
			return new WP_Error(
				'rest_invalid_param',
				__( 'transform must be an object.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}
		if ( isset( $transform['rotation'] ) && ! is_numeric( $transform['rotation'] ) ) {
			return new WP_Error(
				'rest_invalid_param',
				__( 'transform.rotation must be a number.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}
	}

	if ( isset( $params['crop'] ) ) {
		$crop = $params['crop'];
		if ( ! is_array( $crop ) ) {
			return new WP_Error(
				'rest_invalid_param',
				__( 'crop must be an object.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}
		foreach ( array( 'x', 'y', 'width', 'height' ) as $field ) {
			if ( ! isset( $crop[ $field ] ) || ! is_numeric( $crop[ $field ] ) ) {
				return new WP_Error(
					'rest_invalid_param',
					sprintf(
						/* translators: %s: field name */
						__( 'crop.%s must be a number.', 'gutenberg' ),
						$field
					),
					array( 'status' => 400 )
				);
			}
		}
		foreach ( array( 'width', 'height' ) as $dim ) {
			if ( (float) $crop[ $dim ] <= 0 ) {
				return new WP_Error(
					'rest_invalid_param',
					sprintf(
						/* translators: %s: dimension name */
						__( 'crop.%s must be greater than 0.', 'gutenberg' ),
						$dim
					),
					array( 'status' => 400 )
				);
			}
		}
	}

	if ( isset( $params['output'] ) ) {
		if ( ! is_array( $params['output'] ) ) {
			return new WP_Error(
				'rest_invalid_param',
				__( 'output must be an object.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}
		foreach ( array( 'width', 'height' ) as $dim ) {
			if ( isset( $params['output'][ $dim ] ) ) {
				$v = $params['output'][ $dim ];
				if ( ! is_numeric( $v ) || (int) $v < 1 ) {
					return new WP_Error(
						'rest_invalid_param',
						sprintf(
							/* translators: %s: dimension name */
							__( 'output.%s must be a positive integer.', 'gutenberg' ),
							$dim
						),
						array( 'status' => 400 )
					);
				}
			}
		}
	}

	return true;
}

/**
 * Handles a validated `{ transform, crop }` edit request. Mirrors Core's
 * `edit_media_item` for everything outside the operation loop so the
 * response shape, filename scheme, metadata regeneration, and filter
 * calls are identical.
 *
 * Operation order: rotate → flip → crop. This matches the cropper's
 * source-to-screen composition (`S_flip · R_rotation` on source points)
 * so the `crop` rect's coordinate frame is the canvas the user sees.
 *
 * @param int             $attachment_id Attachment being edited.
 * @param WP_REST_Request $request       Original request.
 * @param array           $params        Parsed JSON body.
 * @return WP_REST_Response|WP_Error
 */
function gutenberg_source_region_process( $attachment_id, $request, $params ) {
	require_once ABSPATH . 'wp-admin/includes/image.php';

	$image_file = wp_get_original_image_path( $attachment_id );
	$image_meta = wp_get_attachment_metadata( $attachment_id );

	if (
		! $image_meta ||
		! $image_file ||
		! isset( $params['src'] ) ||
		! wp_image_file_matches_image_meta( $params['src'], $image_meta, $attachment_id )
	) {
		return new WP_Error(
			'rest_unknown_attachment',
			__( 'Unable to get meta information for file.', 'default' ),
			array( 'status' => 404 )
		);
	}

	$supported_types = array( 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/heic' );
	$mime_type       = get_post_mime_type( $attachment_id );
	if ( ! in_array( $mime_type, $supported_types, true ) ) {
		return new WP_Error(
			'rest_cannot_edit_file_type',
			__( 'This type of file cannot be edited.', 'default' ),
			array( 'status' => 400 )
		);
	}

	$image_file_to_edit = $image_file;
	if ( ! file_exists( $image_file_to_edit ) ) {
		$image_file_to_edit = _load_image_to_edit_path( $attachment_id );
	}

	$image_editor = wp_get_image_editor( $image_file_to_edit );
	if ( is_wp_error( $image_editor ) ) {
		return new WP_Error(
			'rest_unknown_image_file_type',
			__( 'Unable to edit this image.', 'default' ),
			array( 'status' => 500 )
		);
	}

	$raw_transform = isset( $params['transform'] ) && is_array( $params['transform'] )
		? $params['transform']
		: array();
	$transform     = array(
		'rotation' => isset( $raw_transform['rotation'] ) ? (float) $raw_transform['rotation'] : 0.0,
		'flip'     => array(
			'horizontal' => ! empty( $raw_transform['flip']['horizontal'] ),
			'vertical'   => ! empty( $raw_transform['flip']['vertical'] ),
		),
	);

	// Round crop to integer pixels — `WP_Image_Editor::crop` requires ints.
	$crop = null;
	if ( isset( $params['crop'] ) && is_array( $params['crop'] ) ) {
		$crop = array(
			'x'      => (int) round( (float) $params['crop']['x'] ),
			'y'      => (int) round( (float) $params['crop']['y'] ),
			'width'  => (int) round( (float) $params['crop']['width'] ),
			'height' => (int) round( (float) $params['crop']['height'] ),
		);
	}

	// Normalize to [0, 360) so snap-rotation comparisons and the sign flip
	// below behave for negative or > 360° inputs.
	$angle = fmod( fmod( $transform['rotation'], 360 ) + 360, 360 );

	// No-op guard: no rotation, no flips, and either no crop or a crop that
	// covers the full source canvas. Mirrors Core's `rest_image_not_edited`
	// so a save with nothing to apply doesn't spawn a duplicate file and
	// attachment row. Only checked when rotation is 0° — a non-zero angle
	// is already a real edit regardless of the crop rect.
	$has_rotation = 0.0 !== $angle;
	$has_flip     = $transform['flip']['horizontal'] || $transform['flip']['vertical'];
	$has_crop     = false;
	if ( null !== $crop ) {
		$src_size = $image_editor->get_size();
		$has_crop = 0 !== $crop['x']
			|| 0 !== $crop['y']
			|| $crop['width'] !== (int) $src_size['width']
			|| $crop['height'] !== (int) $src_size['height'];
	}

	if ( ! $has_rotation && ! $has_flip && ! $has_crop ) {
		return new WP_Error(
			'rest_image_not_edited',
			__( 'The image was not edited. Edit the image before applying the changes.', 'default' ),
			array( 'status' => 400 )
		);
	}

	if ( $has_rotation ) {
		// Core's WP_Image_Editor::rotate is counterclockwise-positive;
		// the wire contract is clockwise-positive (screen convention).
		$result = $image_editor->rotate( 0 - $angle );
		if ( is_wp_error( $result ) ) {
			return new WP_Error(
				'rest_image_rotation_failed',
				__( 'Unable to rotate this image.', 'default' ),
				array( 'status' => 500 )
			);
		}
	}

	if ( $has_flip ) {
		// WP_Image_Editor::flip( $vertical, $horizontal ) — first arg
		// flips along the horizontal axis (top/bottom), second along
		// the vertical axis (left/right).
		$result = $image_editor->flip( $transform['flip']['vertical'], $transform['flip']['horizontal'] );
		if ( is_wp_error( $result ) ) {
			return new WP_Error(
				'rest_image_flip_failed',
				__( 'Unable to flip this image.', 'default' ),
				array( 'status' => 500 )
			);
		}
	}

	if ( null !== $crop ) {
		if ( $crop['width'] < 1 || $crop['height'] < 1 ) {
			return new WP_Error(
				'rest_image_crop_failed',
				__( 'Unable to crop this image.', 'gutenberg' ),
				array( 'status' => 400 )
			);
		}
		$result = $image_editor->crop( $crop['x'], $crop['y'], $crop['width'], $crop['height'] );
		if ( is_wp_error( $result ) ) {
			return new WP_Error(
				'rest_image_crop_failed',
				__( 'Unable to crop this image.', 'default' ),
				array( 'status' => 500 )
			);
		}
	}

	if ( isset( $params['output']['width'], $params['output']['height'] ) ) {
		$out_w        = (int) $params['output']['width'];
		$out_h        = (int) $params['output']['height'];
		$current_size = $image_editor->get_size();
		if ( $out_w !== (int) $current_size['width'] || $out_h !== (int) $current_size['height'] ) {
			$result = $image_editor->resize( $out_w, $out_h, true );
			if ( is_wp_error( $result ) ) {
				return new WP_Error(
					'rest_image_resize_failed',
					__( 'Unable to resize this image.', 'gutenberg' ),
					array( 'status' => 500 )
				);
			}
		}
	}

	$image_ext  = pathinfo( $image_file, PATHINFO_EXTENSION );
	$image_name = wp_basename( $image_file, ".{$image_ext}" );

	if ( preg_match( '/-edited(-\d+)?$/', $image_name ) ) {
		$image_name = preg_replace( '/-edited(-\d+)?$/', '-edited', $image_name );
	} else {
		$image_name .= '-edited';
	}

	$filename = "{$image_name}.{$image_ext}";
	$uploads  = wp_upload_dir();
	$filename = wp_unique_filename( $uploads['path'], $filename );

	$saved = $image_editor->save( $uploads['path'] . "/$filename" );
	if ( is_wp_error( $saved ) ) {
		return $saved;
	}

	$original_attachment_post = get_post( $attachment_id );

	// Honor Details-tab edits sent in the same request. The modal bundles
	// staged title/caption/description/alt_text edits into the `/edit` call
	// so a single save can't silently drop them; fall back to the parent's
	// values when the client didn't send an override. Caption and description
	// are passed through raw here — `wp_insert_attachment` runs the usual
	// post-field sanitizers (kses, etc.) before writing to the DB.
	$request_title   = isset( $params['title'] ) ? sanitize_text_field( (string) $params['title'] ) : null;
	$request_caption = isset( $params['caption'] ) ? (string) $params['caption'] : null;
	$request_desc    = isset( $params['description'] ) ? (string) $params['description'] : null;

	$new_attachment_post                 = new stdClass();
	$new_attachment_post->post_mime_type = $saved['mime-type'];
	$new_attachment_post->guid           = $uploads['url'] . "/$filename";
	$new_attachment_post->post_title     = $request_title ?? $original_attachment_post->post_title ?? $image_name;
	$new_attachment_post->post_excerpt   = $request_caption ?? $original_attachment_post->post_excerpt ?? '';
	$new_attachment_post->post_content   = $request_desc ?? $original_attachment_post->post_content ?? '';
	$new_attachment_post->post_parent    = 0;

	$new_attachment_id = wp_insert_attachment(
		wp_slash( (array) $new_attachment_post ),
		$saved['path'],
		0,
		true
	);

	if ( is_wp_error( $new_attachment_id ) ) {
		if ( 'db_update_error' === $new_attachment_id->get_error_code() ) {
			$new_attachment_id->add_data( array( 'status' => 500 ) );
		} else {
			$new_attachment_id->add_data( array( 'status' => 400 ) );
		}
		return $new_attachment_id;
	}

	$image_alt = isset( $params['alt_text'] )
		? sanitize_text_field( $params['alt_text'] )
		: get_post_meta( $attachment_id, '_wp_attachment_image_alt', true );

	if ( ! empty( $image_alt ) ) {
		update_post_meta( $new_attachment_id, '_wp_attachment_image_alt', wp_slash( $image_alt ) );
	}

	if ( wp_is_serving_rest_request() ) {
		header( 'X-WP-Upload-Attachment-ID: ' . $new_attachment_id );
	}

	$new_image_meta = wp_generate_attachment_metadata( $new_attachment_id, $saved['path'] );

	if ( isset( $image_meta['image_meta'] ) && isset( $new_image_meta['image_meta'] ) && is_array( $new_image_meta['image_meta'] ) ) {
		foreach ( (array) $image_meta['image_meta'] as $key => $value ) {
			if ( empty( $new_image_meta['image_meta'][ $key ] ) && ! empty( $value ) ) {
				$new_image_meta['image_meta'][ $key ] = $value;
			}
		}
	}

	if ( ! empty( $new_image_meta['image_meta']['orientation'] ) ) {
		$new_image_meta['image_meta']['orientation'] = 1;
	}

	$new_image_meta['parent_image'] = array(
		'attachment_id' => $attachment_id,
		'file'          => _wp_relative_upload_path( $image_file ),
	);

	/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-attachments-controller.php */
	$new_image_meta = apply_filters( 'wp_edited_image_metadata', $new_image_meta, $new_attachment_id, $attachment_id );

	wp_update_attachment_metadata( $new_attachment_id, $new_image_meta );

	$controller = new WP_REST_Attachments_Controller( 'attachment' );
	$response   = $controller->prepare_item_for_response( get_post( $new_attachment_id ), $request );
	$response->set_status( 201 );
	$response->header(
		'Location',
		rest_url( sprintf( 'wp/v2/media/%d', $new_attachment_id ) )
	);

	return $response;
}
