<?php
/**
 * REST API: Gutenberg_REST_Attachments_Controller_7_1 class
 *
 * @package gutenberg
 */

/**
 * Controller which provides REST endpoint for retrieving attachments.
 * This overrides the core WP_REST_Attachments_Controller to provide
 * support for filtering by multiple media types.
 *
 * @since 7.1.0
 *
 * @see WP_REST_Attachments_Controller
 */
class Gutenberg_REST_Attachments_Controller_7_1 extends WP_REST_Attachments_Controller {

	/**
	 * Determines the allowed query_vars for a get_items() response and
	 * prepares for WP_Query.
	 *
	 * This overrides the parent method to add support for filtering by
	 * multiple media types, which was added in WordPress 7.1.
	 *
	 * @since 4.7.0
	 * @since 7.1.0 Added orderby_mime_type filter to add custom ordering.
	 * @since 7.1.0 Extends the `media_type` and `mime_type` request arguments to support array values.
	 *
	 * @param array           $prepared_args Optional. Array of prepared arguments. Default empty array.
	 * @param WP_REST_Request $request       Optional. Request to prepare items for.
	 * @return array Array of query arguments.
	 */
	protected function prepare_items_query( $prepared_args = array(), $request = null ) {
		// Store array parameters that we'll handle separately.
		$media_type_array = null;
		$mime_type_array  = null;

		if ( ! empty( $request['media_type'] ) && is_array( $request['media_type'] ) ) {
			$media_type_array = $request['media_type'];
			unset( $request['media_type'] );
		}

		if ( ! empty( $request['mime_type'] ) && is_array( $request['mime_type'] ) ) {
			$mime_type_array = $request['mime_type'];
			unset( $request['mime_type'] );
		}

		$query_args = parent::prepare_items_query( $prepared_args, $request );

		// Restore the array parameters to the request.
		if ( null !== $media_type_array ) {
			$request['media_type'] = $media_type_array;
		}

		if ( null !== $mime_type_array ) {
			$request['mime_type'] = $mime_type_array;
		}

		if ( empty( $query_args['post_status'] ) ) {
			$query_args['post_status'] = 'inherit';
		}

		$all_mime_types = array();
		$media_types    = $this->get_media_types();

		if ( null !== $media_type_array ) {
			foreach ( $media_type_array as $type ) {
				if ( isset( $media_types[ $type ] ) ) {
					$all_mime_types = array_merge( $all_mime_types, $media_types[ $type ] );
				}
			}
		}

		if ( null !== $mime_type_array ) {
			foreach ( $mime_type_array as $mime_type ) {
				$parts = explode( '/', $mime_type );
				if ( isset( $media_types[ $parts[0] ] ) && in_array( $mime_type, $media_types[ $parts[0] ], true ) ) {
					$all_mime_types[] = $mime_type;
				}
			}
		}

		if ( ! empty( $all_mime_types ) ) {
			$query_args['post_mime_type'] = array_values( array_unique( $all_mime_types ) );
		}

		// Filter query clauses to include filenames.
		if ( isset( $query_args['s'] ) ) {
			add_filter( 'wp_allow_query_attachment_by_filename', '__return_true' );
		}

		return $query_args;
	}

	/**
	 * Applies edits to a media item and creates a new attachment record.
	 *
	 * Unlike core (as of 7.1), uprights the image before applying the
	 * requested edits. Core edits the file from
	 * `wp_get_original_image_path()`, whose EXIF orientation may still be
	 * unapplied: client-side uploads deliberately preserve the tag, and
	 * server-side uploads only bake the rotation into the scaled copy,
	 * never the original. Clients build the edit modifiers against the
	 * oriented preview (browsers apply the tag at render), so editing the
	 * raw pixels lands rotations and crops in the wrong frame — e.g.
	 * rotating an EXIF-oriented iPhone photo appears to do nothing.
	 *
	 * PLUGIN-ONLY SCAFFOLDING: in core, the entire fix is one line inside
	 * this method, after the editor is created —
	 * `$image_editor->maybe_exif_rotate();`. A plugin cannot reach that
	 * local variable, so it swaps the editor classes for subclasses that
	 * upright on load instead. Remove this override and both
	 * `Gutenberg_EXIF_Orienting_Image_Editor_*` classes once the core
	 * change ships.
	 *
	 * @since 7.1.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, WP_Error object on failure.
	 */
	public function edit_media_item( $request ) {
		add_filter( 'wp_image_editors', array( __CLASS__, '_use_exif_orienting_image_editors' ) );

		$response = parent::edit_media_item( $request );

		remove_filter( 'wp_image_editors', array( __CLASS__, '_use_exif_orienting_image_editors' ) );

		return $response;
	}

	/**
	 * Swaps the default image editors for EXIF-orienting subclasses.
	 *
	 * Mapped per class (rather than prepended) so a site's filtered editor
	 * preference order is preserved.
	 *
	 * Only public because the hook system must be able to call it; it is
	 * plugin-only scaffolding (see `edit_media_item()`), not an API.
	 *
	 * @since 7.1.0
	 * @access private
	 *
	 * @param string[] $editors Image editor class names.
	 * @return string[] Image editor class names.
	 */
	public static function _use_exif_orienting_image_editors( $editors ) {
		// The parent editor classes are loaded lazily by core immediately
		// before this filter fires (see `_wp_image_editor_choose()`), so the
		// subclasses must not be required any earlier than this.
		require_once __DIR__ . '/class-gutenberg-exif-orienting-image-editor-imagick.php';
		require_once __DIR__ . '/class-gutenberg-exif-orienting-image-editor-gd.php';

		$replacements = array(
			'WP_Image_Editor_Imagick' => 'Gutenberg_EXIF_Orienting_Image_Editor_Imagick',
			'WP_Image_Editor_GD'      => 'Gutenberg_EXIF_Orienting_Image_Editor_GD',
		);

		foreach ( $editors as $index => $editor ) {
			if ( isset( $replacements[ $editor ] ) ) {
				$editors[ $index ] = $replacements[ $editor ];
			}
		}

		return $editors;
	}

	/**
	 * Retrieves the query params for collections of attachments.
	 *
	 * @since 4.7.0
	 * @since 7.1.0 Extends the `media_type` and `mime_type` request arguments to support array values.
	 *
	 * @return array Query parameters for the attachment collection as an array.
	 */
	public function get_collection_params() {
		$params                            = parent::get_collection_params();
		$params['status']['default']       = 'inherit';
		$params['status']['items']['enum'] = array( 'inherit', 'private', 'trash' );
		$media_types                       = array_keys( $this->get_media_types() );

		$params['media_type'] = array(
			'default'     => null,
			'description' => __( 'Limit result set to attachments of a particular media type or media types.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'string',
				'enum' => $media_types,
			),
		);

		$params['mime_type'] = array(
			'default'     => null,
			'description' => __( 'Limit result set to attachments of a particular MIME type or MIME types.' ),
			'type'        => 'array',
			'items'       => array(
				'type' => 'string',
			),
		);

		return $params;
	}
}
