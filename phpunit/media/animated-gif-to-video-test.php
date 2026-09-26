<?php

/**
 * Tests for animated GIF → video companion-file cleanup.
 *
 * An uploaded animated GIF stays a normal image attachment; a converted video
 * and a static poster are sideloaded as companion files (recorded in attachment
 * metadata). The swap to a video happens in the editor (the Video block's "GIF"
 * variation), so the only PHP responsibility is removing those companions when
 * the attachment is deleted. See lib/media/animated-gif-to-video.php.
 */
class Animated_Gif_To_Video_Test extends WP_UnitTestCase {
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
	 * Creates a GIF attachment with companion video + poster files on disk.
	 *
	 * @param bool $with_poster Whether to also create the poster companion.
	 * @return int Attachment ID.
	 */
	private function create_gif_attachment( bool $with_poster = true ): int {
		// Minimal valid 1x1 GIF so the upload passes mime validation.
		$gif_path = get_temp_dir() . 'animated-test-' . wp_generate_uuid4() . '.gif';
		file_put_contents(
			$gif_path,
			base64_decode( 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' )
		);

		$attachment_id = self::factory()->attachment->create_upload_object( $gif_path );

		$dir        = dirname( get_attached_file( $attachment_id, true ) );
		$video_name = 'animated-test-video.mp4';
		$video_path = $dir . '/' . $video_name;
		file_put_contents( $video_path, 'video' );
		$this->companion_files[] = $video_path;

		$metadata                   = wp_get_attachment_metadata( $attachment_id, true );
		$metadata                   = is_array( $metadata ) ? $metadata : array();
		$metadata['animated_video'] = $video_name;

		if ( $with_poster ) {
			$poster_name = 'animated-test-poster.jpg';
			$poster_path = $dir . '/' . $poster_name;
			file_put_contents( $poster_path, 'poster' );
			$this->companion_files[]           = $poster_path;
			$metadata['animated_video_poster'] = $poster_name;
		}

		wp_update_attachment_metadata( $attachment_id, $metadata );

		return $attachment_id;
	}

	/**
	 * The companion path is rebuilt from the attachment's own directory plus
	 * the recorded basename.
	 *
	 * @covers ::gutenberg_get_animated_gif_companion_path
	 */
	public function test_companion_path_resolves_inside_attachment_directory() {
		$attachment_id = $this->create_gif_attachment();
		$dir           = dirname( get_attached_file( $attachment_id, true ) );

		$this->assertSame(
			$dir . '/animated-test-video.mp4',
			gutenberg_get_animated_gif_companion_path( $attachment_id, 'animated_video' )
		);
		$this->assertSame(
			$dir . '/animated-test-poster.jpg',
			gutenberg_get_animated_gif_companion_path( $attachment_id, 'animated_video_poster' )
		);
	}

	/**
	 * Only the basename of the recorded value is trusted, so a path traversal
	 * in the metadata cannot escape the attachment's directory.
	 *
	 * @covers ::gutenberg_get_animated_gif_companion_path
	 */
	public function test_companion_path_ignores_directory_traversal() {
		$attachment_id = $this->create_gif_attachment( false );
		$dir           = dirname( get_attached_file( $attachment_id, true ) );

		$metadata                   = wp_get_attachment_metadata( $attachment_id, true );
		$metadata['animated_video'] = '../../evil.mp4';
		wp_update_attachment_metadata( $attachment_id, $metadata );

		$this->assertSame(
			$dir . '/evil.mp4',
			gutenberg_get_animated_gif_companion_path( $attachment_id, 'animated_video' )
		);
	}

	/**
	 * @covers ::gutenberg_get_animated_gif_companion_path
	 */
	public function test_companion_path_is_null_without_companion() {
		$attachment_id = self::factory()->attachment->create_upload_object(
			DIR_TESTDATA . '/images/canola.jpg'
		);

		$this->assertNull(
			gutenberg_get_animated_gif_companion_path( $attachment_id, 'animated_video' )
		);
	}

	/**
	 * @covers ::gutenberg_delete_animated_gif_video
	 */
	public function test_deletes_companion_files_on_attachment_delete() {
		$attachment_id = $this->create_gif_attachment();
		$video_path    = gutenberg_get_animated_gif_companion_path( $attachment_id, 'animated_video' );
		$poster_path   = gutenberg_get_animated_gif_companion_path( $attachment_id, 'animated_video_poster' );

		$this->assertFileExists( $video_path );
		$this->assertFileExists( $poster_path );

		// Delete through the real attachment-deletion path so the
		// delete_attachment hook wiring is covered, not just the callback.
		wp_delete_attachment( $attachment_id, true );

		$this->assertFileDoesNotExist( $video_path );
		$this->assertFileDoesNotExist( $poster_path );
	}
}
