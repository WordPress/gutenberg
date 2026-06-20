<?php

/**
 * Tests for video transcoding companion-file cleanup and the keep-original
 * developer filter.
 *
 * An uploaded video that is not web-safe stays the attachment; a transcoded,
 * web-safe version is sideloaded as a companion file (recorded in attachment
 * metadata under `optimized_video`). The swap to the companion happens in the
 * editor (the core/video block's src), so the only PHP responsibilities are
 * removing the companion when the attachment is deleted and exposing the
 * keep-original opt-out. See lib/media/video-transcoding.php.
 */
class Video_Transcoding_Test extends WP_UnitTestCase {
	/**
	 * @var string[] Absolute paths of companion files created during a test.
	 */
	private $companion_files = array();

	public function tear_down() {
		foreach ( $this->companion_files as $file ) {
			if ( file_exists( $file ) ) {
				wp_delete_file( $file );
			}
		}
		$this->companion_files = array();

		$this->remove_added_uploads();

		parent::tear_down();
	}

	/**
	 * Creates an attachment with a transcoded video companion file on disk.
	 *
	 * The companion cleanup logic operates purely on the recorded metadata and
	 * file paths, so a guaranteed test-data image is used as the underlying
	 * attachment; only the sideloaded `optimized_video` companion is a video.
	 *
	 * @return int Attachment ID.
	 */
	private function create_video_attachment(): int {
		$attachment_id = self::factory()->attachment->create_upload_object(
			DIR_TESTDATA . '/images/canola.jpg'
		);

		$dir        = dirname( get_attached_file( $attachment_id, true ) );
		$video_name = 'video-transcoding-optimized.mp4';
		$video_path = $dir . '/' . $video_name;
		file_put_contents( $video_path, 'optimized' );
		$this->companion_files[] = $video_path;

		$metadata                    = wp_get_attachment_metadata( $attachment_id, true );
		$metadata                    = is_array( $metadata ) ? $metadata : array();
		$metadata['optimized_video'] = $video_name;
		wp_update_attachment_metadata( $attachment_id, $metadata );

		return $attachment_id;
	}

	/**
	 * The companion path is rebuilt from the attachment's own directory plus
	 * the recorded basename.
	 *
	 * @covers ::gutenberg_get_optimized_video_companion_path
	 */
	public function test_companion_path_resolves_inside_attachment_directory() {
		$attachment_id = $this->create_video_attachment();
		$dir           = dirname( get_attached_file( $attachment_id, true ) );

		$this->assertSame(
			$dir . '/video-transcoding-optimized.mp4',
			gutenberg_get_optimized_video_companion_path( $attachment_id )
		);
	}

	/**
	 * Only the basename of the recorded value is trusted, so a path traversal
	 * in the metadata cannot escape the attachment's directory.
	 *
	 * @covers ::gutenberg_get_optimized_video_companion_path
	 */
	public function test_companion_path_ignores_directory_traversal() {
		$attachment_id = $this->create_video_attachment();
		$dir           = dirname( get_attached_file( $attachment_id, true ) );

		$metadata                    = wp_get_attachment_metadata( $attachment_id, true );
		$metadata['optimized_video'] = '../../evil.mp4';
		wp_update_attachment_metadata( $attachment_id, $metadata );

		$this->assertSame(
			$dir . '/evil.mp4',
			gutenberg_get_optimized_video_companion_path( $attachment_id )
		);
	}

	/**
	 * @covers ::gutenberg_get_optimized_video_companion_path
	 */
	public function test_companion_path_is_null_without_companion() {
		$attachment_id = self::factory()->attachment->create_upload_object(
			DIR_TESTDATA . '/images/canola.jpg'
		);

		$this->assertNull(
			gutenberg_get_optimized_video_companion_path( $attachment_id )
		);
	}

	/**
	 * @covers ::gutenberg_delete_optimized_video
	 */
	public function test_deletes_companion_file_on_attachment_delete() {
		$attachment_id = $this->create_video_attachment();
		$video_path    = gutenberg_get_optimized_video_companion_path( $attachment_id );

		$this->assertFileExists( $video_path );

		gutenberg_delete_optimized_video( $attachment_id );

		$this->assertFileDoesNotExist( $video_path );
	}

	/**
	 * The keep-original preference defaults to true and is filterable.
	 *
	 * @covers ::gutenberg_set_video_transcoding_keep_original_flag
	 */
	public function test_keep_original_filter_defaults_true_and_is_filterable() {
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
