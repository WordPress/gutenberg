<?php
/**
 * Start: Include for phase 2
 * Image Editor: Image_Editor class
 *
 * @package gutenberg
 * @since 7.x ?
 */

/**
 * Image flip/mirror modifier.
 */
require_once __DIR__ . '/class-image-editor-flip.php';

/**
 * Image rotate modifier.
 */
require_once __DIR__ . '/class-image-editor-rotate.php';

/**
 * Image crop modifier.
 */
require_once __DIR__ . '/class-image-editor-crop.php';

/**
 * Image editor.
 *
 * @since 7.x ?
 */
class Image_Editor {
	const META_KEY = 'richimage';

	/**
	 * Constructs an Image_Editor.
	 */
	public function __construct() {
		$this->all_modifiers = array(
			'Image_Editor_Crop',
			'Image_Editor_Flip',
			'Image_Editor_Rotate',
		);
	}

	/**
	 * Modifies an image.
	 *
	 * @param integer $media_id Media id.
	 * @param array   $modifiers Modifier to apply to the image.
	 * @return array|WP_Error If successful image JSON containing the media_id and url of modified image, otherwise WP_Error.
	 */
	public function modify_image( $media_id, $modifiers ) {
		// Get image information.
		$info = $this->load_image_info( $media_id );
		if ( is_wp_error( $info ) ) {
			return $info;
		}

		foreach ( $modifiers as $modifier ) {
			// Update it with our modifier.
			$info['meta'] = $modifier->apply_to_meta( $info['meta'] );
		}

		// Generate filename based on current attributes.
		$target_file = $this->get_filename( $info['meta'] );

		// Does the image already exist?
		$existing_image = $this->get_existing_image( $info, $target_file );
		if ( $existing_image ) {
			// Return the existing image.
			return $existing_image;
		}

		// Try and load the image itself.
		$image = $this->load_image( $media_id, $info );
		if ( is_wp_error( $image ) ) {
			return $image;
		}

		foreach ( $modifiers as $modifier ) {
			// Finally apply the modification.
			$modified = $modifier->apply_to_image( $image['editor'] );
			if ( is_wp_error( $modified ) ) {
				return $modified;
			}
		}

		// And save.
		return $this->save_image( $image, $target_file, $info );
	}

	/**
	 * Loads an image for editing.
	 *
	 * @param integer $media_id Image ID.
	 * @return array|WP_Error The WP_Image_Editor and image path if successful, WP_Error otherwise.
	 */
	private function load_image( $media_id ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$image_path = get_attached_file( $media_id );

		if ( empty( $image_path ) ) {
			return new WP_Error( 'fileunknown', 'Unable to find original media file' );
		}

		$image_editor = wp_get_image_editor( $image_path );
		if ( ! $image_editor->load() ) {
			return new WP_Error( 'fileload', 'Unable to load original media file' );
		}

		return array(
			'editor' => $image_editor,
			'path'   => $image_path,
		);
	}

	/**
	 * Gets the JSON response object for an image.
	 *
	 * @param integer $id Image ID.
	 * @return array Image JSON.
	 */
	private function get_image_as_json( $id ) {
		return array(
			'media_id' => $id,
			'url'      => wp_get_attachment_image_url( $id, 'original' ),
		);
	}

	/**
	 * Checks for the existence of an image and if it exists, return the image.
	 *
	 * @param array  $attachment Attachment with url to look up.
	 * @param string $target_file Target file name to look up.
	 * @return array|false Image JSON if exists, otherwise false.
	 */
	private function get_existing_image( $attachment, $target_file ) {
		$url = str_replace( basename( $attachment['url'] ), $target_file, $attachment['url'] );

		$new_id = attachment_url_to_postid( $url );
		if ( $new_id > 0 ) {
			return $this->get_image_as_json( $new_id );
		}

		return false;
	}

	/**
	 * Saves an edited image.
	 *
	 * @param array  $image_edit Image path and editor to save.
	 * @param string $target_name Target file name to save as.
	 * @param array  $attachment Attachment with metadata to apply.
	 * @return array|WP_Error Image JSON if successful, WP_Error otherwise
	 */
	private function save_image( $image_edit, $target_name, $attachment ) {
		$filename = rtrim( dirname( $image_edit['path'] ), '/' ) . '/' . $target_name;

		// Save to disk.
		$saved = $image_edit['editor']->save( $filename );

		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		// Update attachment details.
		$attachment_post = array(
			'guid'           => $saved['path'],
			'post_mime_type' => $saved['mime-type'],
			'post_title'     => pathinfo( $target_name, PATHINFO_FILENAME ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		);

		// Add this as an attachment.
		$attachment_id = wp_insert_attachment( $attachment_post, $saved['path'], 0 );
		if ( 0 === $attachment_id ) {
			return new WP_Error( 'attachment', 'Unable to add image as attachment' );
		}

		// Generate thumbnails.
		$metadata = wp_generate_attachment_metadata( $attachment_id, $saved['path'] );

		// Store out meta data.
		$metadata[ self::META_KEY ] = $attachment['meta'];

		wp_update_attachment_metadata( $attachment_id, $metadata );

		return $this->get_image_as_json( $attachment_id );
	}

	/**
	 * Computes the filename based on metadata.
	 *
	 * @param array $meta Metadata for the image.
	 * @return string Name of the edited file.
	 */
	private function get_filename( $meta ) {
		$parts = array();

		foreach ( $this->all_modifiers as $modifier ) {
			$parts[] = $modifier::get_filename( $meta );
		}

		$parts = array_filter( $parts );

		if ( count( $parts ) > 0 ) {
			return sprintf( '%s-%s', implode( '-', $parts ), $meta['original_name'] );
		}

		return $meta['original_name'];
	}

	/**
	 * Loads image info.
	 *
	 * @param integer $media_id Image ID.
	 * @return array|WP_Error If successful image info, otherwise a WP_Error
	 */
	private function load_image_info( $media_id ) {
		$attachment_info = wp_get_attachment_metadata( $media_id );
		$media_url       = wp_get_attachment_image_url( $media_id, 'original' );

		if ( ! $attachment_info || ! $media_url ) {
			return new WP_Error( 'unknown', 'Unable to get meta information for file' );
		}

		$default_meta = array();
		foreach ( $this->all_modifiers as $modifier ) {
			$default_meta = array_merge( $default_meta, $modifier::get_default_meta() );
		}

		$info = array(
			'url'      => $media_url,
			'media_id' => $media_id,
			'meta'     => array_merge(
				$default_meta,
				array( 'original_name' => basename( $media_url ) )
			),
		);

		if ( isset( $attachment_info[ self::META_KEY ] ) ) {
			$info['meta'] = array_merge( $info['meta'], $attachment_info[ self::META_KEY ] );
		}

		return $info;
	}
}

/**
 * Abstract class for image modifiers. Any modifier to an image should implement this.
 *
 * @abstract
 */
abstract class Image_Editor_Modifier {

	/**
	 * Update the image metadata with the modifier.
	 *
	 * @abstract
	 * @access public
	 *
	 * @param array $meta Metadata to update.
	 * @return array Updated metadata.
	 */
	abstract public function apply_to_meta( $meta );

	/**
	 * Apply the modifier to the image
	 *
	 * @abstract
	 * @access public
	 *
	 * @param WP_Image_Editor $image Image editor.
	 * @return bool|WP_Error True on success, WP_Error object or false on failure.
	 */
	abstract public function apply_to_image( $image );

	/**
	 * Gets the new filename based on metadata.
	 *
	 * @abstract
	 * @access public
	 *
	 * @param array $meta Image metadata.
	 * @return string Filename for the edited image.
	 */
	abstract public static function get_filename( $meta );

	/**
	 * Gets the default metadata for an image modifier.
	 *
	 * @abstract
	 * @access public
	 *
	 * @return array Default metadata.
	 */
	abstract public static function get_default_meta();
}
