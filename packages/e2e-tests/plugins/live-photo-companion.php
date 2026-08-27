<?php
/**
 * Plugin Name: Gutenberg Test Live Photo Companion
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-live-photo-companion
 */

/**
 * Makes every uploaded image look like a converted HEIC/HEIF image sequence.
 *
 * The real conversion needs a platform HEVC decoder, which CI's Linux Chromium
 * does not have, so the editor behavior it produces — the automatic swap to a
 * Live photo, undo, and the return to a still image — would otherwise be
 * untestable there. Recording the companion metadata directly reproduces the
 * state the upload pipeline leaves behind, without needing to decode anything.
 *
 * The companion points at a file that does not exist. Nothing under test plays
 * it: the assertions are about which block is in the canvas and what it points
 * at.
 *
 * @param array $metadata Attachment metadata.
 * @return array Metadata carrying a companion video.
 */
function gutenberg_test_add_live_photo_companion( $metadata ) {
	if ( isset( $metadata['width'] ) && ! isset( $metadata['animated_video'] ) ) {
		$metadata['animated_video'] = 'live-photo-companion.mp4';
	}

	return $metadata;
}

add_filter( 'wp_generate_attachment_metadata', 'gutenberg_test_add_live_photo_companion' );
