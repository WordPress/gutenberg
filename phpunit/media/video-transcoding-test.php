<?php
/**
 * Tests for video transcoding companion-file cleanup and the keep-original
 * developer filter.
 *
 * An uploaded video that is not web-safe stays the attachment; a transcoded,
 * web-safe version is sideloaded as a companion file recorded in attachment
 * metadata under `optimized_video`. The swap to the companion happens in the
 * editor, so the only PHP responsibilities are removing the companion when the
 * attachment is deleted and exposing the keep-original opt-out. See
 * lib/media/video-transcoding.php.
 *
 * @group media
 */
class Video_Transcoding_Test extends WP_UnitTestCase {

	public function tear_down(): void {
		$this->remove_added_uploads();

		parent::tear_down();
	}

	/**
	 * The companion file recorded in metadata['optimized_video'] is removed
	 * from disk when the attachment is deleted.
	 *
	 * @covers ::gutenberg_delete_optimized_video
	 */
	public function test_deletes_companion_file_recorded_in_metadata(): void {
		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );
		$this->assertIsInt( $attachment_id );

		$attached_file = get_attached_file( $attachment_id, true );
		$this->assertIsString( $attached_file );
		$dir        = dirname( $attached_file );
		$video_name = 'optimized-' . wp_generate_password( 6, false ) . '.mp4';
		$video_path = $dir . '/' . $video_name;

		file_put_contents( $video_path, 'optimized' );
		$this->assertFileExists( $video_path, 'Test fixture should be on disk.' );

		$metadata = wp_get_attachment_metadata( $attachment_id, true );
		$this->assertIsArray( $metadata );
		$metadata['optimized_video'] = $video_name;
		wp_update_attachment_metadata( $attachment_id, $metadata );

		$this->assertTrue(
			gutenberg_delete_optimized_video( $attachment_id ),
			'Function should report that a companion file was deleted.'
		);
		$this->assertFileDoesNotExist( $video_path, 'Companion file should be deleted alongside the attachment.' );
	}

	/**
	 * No companion file is recorded, so the hook is a no-op and attachment
	 * deletion still proceeds normally.
	 *
	 * @covers ::gutenberg_delete_optimized_video
	 */
	public function test_noop_when_metadata_optimized_video_is_missing(): void {
		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );
		$this->assertIsInt( $attachment_id );

		$metadata = wp_get_attachment_metadata( $attachment_id, true );
		$this->assertIsArray( $metadata );
		$this->assertArrayNotHasKey( 'optimized_video', $metadata );

		$this->assertFalse( gutenberg_delete_optimized_video( $attachment_id ) );

		wp_delete_attachment( $attachment_id, true );

		$this->assertNull( get_post( $attachment_id ) );
	}

	/**
	 * A path-traversal value in the metadata only ever resolves to the
	 * attachment's own directory, so a file outside it is never touched.
	 *
	 * @covers ::gutenberg_delete_optimized_video
	 */
	public function test_traversal_value_does_not_delete_outside_attachment_dir(): void {
		$attachment_id = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );
		$this->assertIsInt( $attachment_id );

		$attached_file = get_attached_file( $attachment_id, true );
		$this->assertIsString( $attached_file );

		// A file one level above the attachment's directory.
		$outside_path = dirname( $attached_file, 2 ) . '/outside-' . wp_generate_password( 6, false ) . '.mp4';
		file_put_contents( $outside_path, 'outside' );

		$metadata = wp_get_attachment_metadata( $attachment_id, true );
		$this->assertIsArray( $metadata );
		$metadata['optimized_video'] = '../' . wp_basename( $outside_path );
		wp_update_attachment_metadata( $attachment_id, $metadata );

		$this->assertFalse( gutenberg_delete_optimized_video( $attachment_id ) );
		$this->assertFileExists( $outside_path, 'A file outside the attachment directory must not be deleted.' );

		wp_delete_file( $outside_path );
	}

	/**
	 * The keep-original preference defaults to true and is filterable.
	 */
	public function test_keep_original_filter_defaults_true_and_is_filterable(): void {
		$this->assertTrue(
			(bool) apply_filters( 'gutenberg_video_transcoding_keep_original', true )
		);

		add_filter( 'gutenberg_video_transcoding_keep_original', '__return_false' );

		$this->assertFalse(
			(bool) apply_filters( 'gutenberg_video_transcoding_keep_original', true )
		);

		remove_filter( 'gutenberg_video_transcoding_keep_original', '__return_false' );
	}
}
