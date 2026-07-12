<?php
/**
 * Gutenberg_EXIF_Orienting_Image_Editor_Imagick class.
 *
 * @package gutenberg
 */

/**
 * Imagick image editor that applies any unapplied EXIF orientation on load.
 *
 * PLUGIN-ONLY SCAFFOLDING — none of this file is intended for WordPress
 * core. In core, the fix this enables is a single line in
 * `WP_REST_Attachments_Controller::edit_media_item()`, right after the
 * editor is created:
 *
 *     $image_editor = wp_get_image_editor( $image_file_to_edit );
 *     $image_editor->maybe_exif_rotate(); // <- the entire core fix.
 *
 * A plugin cannot add a line inside core's method, and core exposes no hook
 * between loading the editor and applying the edit modifiers. The closest
 * seam is the `wp_image_editors` filter (class selection), so the plugin
 * swaps in this subclass, whose `load()` runs `maybe_exif_rotate()` at the
 * same point in the sequence the core one-liner would.
 *
 * Delete this file, its GD sibling, and the `edit_media_item()` override in
 * `Gutenberg_REST_Attachments_Controller_7_1` once the core change ships.
 *
 * @since 7.1.0
 *
 * @see Gutenberg_REST_Attachments_Controller_7_1::edit_media_item()
 */
class Gutenberg_EXIF_Orienting_Image_Editor_Imagick extends WP_Image_Editor_Imagick {
	/**
	 * Loads image from $this->file into editor and uprights it.
	 *
	 * @return true|WP_Error True if loaded successfully; WP_Error on failure.
	 */
	public function load() {
		$loaded = parent::load();

		if ( true === $loaded ) {
			// A failed rotation (e.g. missing EXIF support) degrades to
			// editing the raw pixels, matching previous behavior.
			$this->maybe_exif_rotate();
		}

		return $loaded;
	}
}
