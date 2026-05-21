<?php

/**
 * Tests for the animated GIF → video render-time swap.
 *
 * An uploaded animated GIF stays a normal image attachment; a converted video
 * and a static poster are sideloaded as companion files (recorded in attachment
 * metadata) and the GIF `<img>` is swapped for a `<video>` at render time, but
 * only for top-level Image blocks. See lib/media/animated-gif-to-video.php.
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

	private function image_block_html( int $attachment_id ): string {
		return sprintf(
			'<figure class="wp-block-image size-large"><img class="wp-image-%1$d" src="%2$s" alt="A cat"/></figure>',
			$attachment_id,
			esc_url( wp_get_attachment_url( $attachment_id ) )
		);
	}

	/**
	 * @covers ::gutenberg_mark_animated_gif_for_video_swap
	 */
	public function test_marks_top_level_image_with_companion_video() {
		$attachment_id = $this->create_gif_attachment();
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array( 'id' => $attachment_id ),
		);
		$instance      = new WP_Block( $block );

		$output = gutenberg_mark_animated_gif_for_video_swap(
			$this->image_block_html( $attachment_id ),
			$block,
			$instance
		);

		$this->assertStringContainsString( 'data-gutenberg-gif-swap', $output );
	}

	/**
	 * @covers ::gutenberg_mark_animated_gif_for_video_swap
	 */
	public function test_does_not_mark_when_author_opted_out() {
		$attachment_id = $this->create_gif_attachment();
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array(
				'id'                  => $attachment_id,
				'preserveAnimatedGif' => true,
			),
		);
		$instance      = new WP_Block( $block );

		$output = gutenberg_mark_animated_gif_for_video_swap(
			$this->image_block_html( $attachment_id ),
			$block,
			$instance
		);

		$this->assertStringNotContainsString( 'data-gutenberg-gif-swap', $output );
	}

	/**
	 * Images nested in a Gallery carry the galleryId context and must be left
	 * as GIFs so gallery layout, lightbox and captions are unaffected.
	 *
	 * @covers ::gutenberg_mark_animated_gif_for_video_swap
	 */
	public function test_does_not_mark_gallery_inner_image() {
		$attachment_id = $this->create_gif_attachment();
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array( 'id' => $attachment_id ),
		);
		$instance      = new WP_Block( $block, array( 'galleryId' => 123 ) );

		$output = gutenberg_mark_animated_gif_for_video_swap(
			$this->image_block_html( $attachment_id ),
			$block,
			$instance
		);

		$this->assertStringNotContainsString( 'data-gutenberg-gif-swap', $output );
	}

	/**
	 * @covers ::gutenberg_mark_animated_gif_for_video_swap
	 */
	public function test_does_not_mark_image_without_companion_video() {
		$attachment_id = self::factory()->attachment->create_upload_object(
			DIR_TESTDATA . '/images/canola.jpg'
		);
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array( 'id' => $attachment_id ),
		);
		$instance      = new WP_Block( $block );

		$output = gutenberg_mark_animated_gif_for_video_swap(
			$this->image_block_html( $attachment_id ),
			$block,
			$instance
		);

		$this->assertStringNotContainsString( 'data-gutenberg-gif-swap', $output );
	}

	/**
	 * @covers ::gutenberg_swap_animated_gif_for_video
	 */
	public function test_swaps_marked_image_for_video_with_poster() {
		$attachment_id = $this->create_gif_attachment();
		$img           = sprintf(
			'<img class="wp-image-%1$d" src="%2$s" alt="A cat" data-gutenberg-gif-swap="1" />',
			$attachment_id,
			esc_url( wp_get_attachment_url( $attachment_id ) )
		);

		$output = gutenberg_swap_animated_gif_for_video( $img, 'the_content', $attachment_id );

		$this->assertStringContainsString( '<video', $output );
		$this->assertStringContainsString( 'autoplay loop muted playsinline', $output );
		$this->assertStringContainsString( 'animated-test-video.mp4', $output );
		$this->assertStringContainsString( 'type="video/mp4"', $output );
		// The accessible name carries over and the lightweight poster is used.
		$this->assertStringContainsString( 'aria-label="A cat"', $output );
		$this->assertStringContainsString( 'animated-test-poster.jpg', $output );
		// The internal marker never leaks into the output.
		$this->assertStringNotContainsString( 'data-gutenberg-gif-swap', $output );
	}

	/**
	 * @covers ::gutenberg_swap_animated_gif_for_video
	 */
	public function test_does_not_swap_unmarked_image() {
		$attachment_id = $this->create_gif_attachment();
		$img           = sprintf(
			'<img class="wp-image-%1$d" src="%2$s" alt="A cat" />',
			$attachment_id,
			esc_url( wp_get_attachment_url( $attachment_id ) )
		);

		$output = gutenberg_swap_animated_gif_for_video( $img, 'the_content', $attachment_id );

		$this->assertSame( $img, $output );
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

		gutenberg_delete_animated_gif_video( $attachment_id );

		$this->assertFileDoesNotExist( $video_path );
		$this->assertFileDoesNotExist( $poster_path );
	}
}
