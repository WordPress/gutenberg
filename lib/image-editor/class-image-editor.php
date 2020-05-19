<?php

require_once __DIR__ . '/class-image-editor-flip.php';
require_once __DIR__ . '/class-image-editor-rotate.php';
require_once __DIR__ . '/class-image-editor-crop.php';

class Image_Editor {
	const META_KEY = 'richimage';

	public function modify_image( $media_id, Image_Editor_Modifier $modifier ) {
		// Get image information
		$info = $this->load_image_info( $media_id );
		if ( is_wp_error( $info ) ) {
			return $info;
		}

		// Update it with our modifier
		$info['meta'] = $modifier->apply_to_meta( $info['meta'] );

		// Generate filename based on current attributes
		$target_file = $this->get_filename( $info['meta'] );

		// Does the image already exist?
		$image = $this->get_existing_image( $info, $target_file );
		if ( $image ) {
			// Return the existing image
			return $image;
		}

		// Try and load the image itself
		$image = $this->load_image( $media_id, $info );
		if ( is_wp_error( $image ) ) {
			return $image;
		}

		// Finally apply the modification
		$info = $modifier->apply_to_image( $image['editor'], $info, $target_file );

		// And save
		return $this->save_image( $image, $target_file, $info );
	}

	private function load_image( $media_id ) {
		require_once ABSPATH . 'wp-admin/includes/image.php';

		$attachment_meta = wp_get_attachment_metadata( $media_id );
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
			'path' => $image_path,
		);
	}

	private function get_image_as_json( $id ) {
		return array(
			'mediaID' => $id,
			'url' => wp_get_attachment_image_url( $id, 'original' ),
		);
	}

	private function get_existing_image( $attachment, $target_file ) {
		$url = str_replace( basename( $attachment['url'] ), $target_file, $attachment['url'] );

		$new_id = attachment_url_to_postid( $url );
		if ( $new_id > 0 ) {
			return $this->get_image_as_json( $new_id );
		}

		return false;
	}

	private function save_image( $image, $target_name, $attachment ) {
		$filename = rtrim( dirname( $image['path'] ), '/' ) . '/' . $target_name;

		// Save to disk
		$saved = $image['editor']->save( $filename );

		if ( is_wp_error( $saved ) ) {
			return $saved;
		}

		// Update attachment details
		$attachment_post = array(
			'guid'           => $saved['path'],
			'post_mime_type' => $saved['mime-type'],
			'post_title'     => pathinfo( $target_name, PATHINFO_FILENAME ),
			'post_content'   => '',
			'post_status'    => 'inherit',
		);

		// Add this as an attachment
		$attachment_id = wp_insert_attachment( $attachment_post, $saved['path'], 0 );
		if ( $attachment_id === 0 ) {
			return new WP_Error( 'attachment', 'Unable to add image as attachment' );
		}

		// Generate thumbnails
		$metadata = wp_generate_attachment_metadata( $attachment_id, $saved['path'] );

		// Store out meta data
		$metadata[ self::META_KEY ] = $attachment['meta'];

		wp_update_attachment_metadata( $attachment_id, $metadata );

		return $this->get_image_as_json( $attachment_id );
	}

	private function get_all_modifiers() {
		return array(
			'Image_Editor_Crop',
			'Image_Editor_Flip',
			'Image_Editor_Rotate',
		);
	}

	private function get_filename( $meta ) {
		$parts = array();

		foreach ( $this->get_all_modifiers() as $modifier ) {
			$parts[] = $modifier::get_filename( $meta );
		}

		$parts = array_filter( $parts );

		if ( count( $parts ) > 0 ) {
			return sprintf( '%s-%s', implode( '-', $parts ), $meta['original_name'] );
		}

		return $meta['original_name'];
	}

	private function load_image_info( $media_id ) {
		$attachment_info = wp_get_attachment_metadata( $media_id );
		$media_url = wp_get_attachment_image_url( $media_id, 'original' );

		if ( ! $attachment_info || ! $media_url ) {
			return new WP_Error( 'unknown', 'Unable to get meta information for file' );
		}

		$default_meta = array();
		foreach ( $this->get_all_modifiers() as $modifier ) {
			$default_meta = array_merge( $default_meta, $modifier::get_default_meta() );
		}

		$info = array(
			'url' => $media_url,
			'media_id' => $media_id,
			'meta' => array_merge(
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

abstract class Image_Editor_Modifier {
	abstract public function apply_to_meta( array $meta );
	abstract public function apply_to_image( $image, array $meta, $target_file );
	abstract public static function get_filename( array $meta );
	abstract public static function get_default_meta();
}
