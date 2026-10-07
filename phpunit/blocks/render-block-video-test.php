<?php
/**
 * Video block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Video block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Video extends WP_UnitTestCase {

	/**
	 * The landscape video attachment ID used in tests.
	 *
	 * @var int
	 */
	private $attachment_id;

	public function set_up() {
		parent::set_up();

		// Create a landscape video attachment (width=1920, height=1080, no rotation).
		$this->attachment_id = $this->factory->attachment->create(
			array(
				'post_mime_type' => 'video/mp4',
				'post_title'     => 'Test Landscape Video',
			)
		);

		wp_update_attachment_metadata(
			$this->attachment_id,
			array(
				'width'  => 1920,
				'height' => 1080,
			)
		);
	}

	public function tear_down() {
		wp_delete_attachment( $this->attachment_id, true );
		parent::tear_down();
	}

	/**
	 * @covers ::render_block_core_video
	 */
	public function test_render_block_core_video_returns_content_unchanged_when_no_video_tag() {
		$attributes = array( 'id' => $this->attachment_id );
		$content    = '<figure class="wp-block-video"></figure>';

		$result = render_block_core_video( $attributes, $content );
		$this->assertSame( $content, $result );
	}

	/**
	 * @covers ::render_block_core_video
	 */
	public function test_render_block_core_video_returns_content_unchanged_when_no_id() {
		$attributes = array();
		$content    = '<figure class="wp-block-video"><video src="test.mp4"></video></figure>';

		$result = render_block_core_video( $attributes, $content );
		$this->assertSame( $content, $result );
	}

	/**
	 * @covers ::render_block_core_video
	 */
	public function test_render_block_core_video_adds_landscape_aspect_ratio() {
		$attributes = array( 'id' => $this->attachment_id );
		$content    = '<figure class="wp-block-video"><video src="test.mp4"></video></figure>';

		$result = render_block_core_video( $attributes, $content );
		$this->assertStringContainsString( 'aspect-ratio: 1920 / 1080;', $result );
		$this->assertStringNotContainsString( 'aspect-ratio: auto', $result );
	}

	/**
	 * @covers ::render_block_core_video
	 */
	public function test_render_block_core_video_adds_width_and_height_attributes() {
		$attributes = array( 'id' => $this->attachment_id );
		$content    = '<figure class="wp-block-video"><video src="test.mp4"></video></figure>';

		$result = render_block_core_video( $attributes, $content );
		$this->assertStringContainsString( 'width="1920"', $result );
		$this->assertStringContainsString( 'height="1080"', $result );
	}

	/**
	 * Tests that a portrait video whose rotation is stored in attachment metadata renders
	 * with the correct portrait aspect ratio.
	 *
	 * Some devices (e.g. older mobile phones) encode video frames as landscape but embed a
	 * 90° or 270° rotation flag in the container metadata. WordPress stores the physical
	 * (pre-rotation) dimensions, so the render function must swap them to produce the
	 * correct displayed aspect ratio and avoid a landscape-shaped layout box for a portrait
	 * video.
	 *
	 * @covers ::render_block_core_video
	 */
	public function test_render_block_core_video_portrait_video_with_rotation_metadata() {
		// Simulate a portrait video physically encoded as landscape (1920x1080) with a 90°
		// rotation flag. The rendered aspect ratio and HTML attributes should reflect the
		// displayed (portrait) dimensions: width=1080, height=1920.
		$portrait_id = $this->factory->attachment->create(
			array(
				'post_mime_type' => 'video/mp4',
				'post_title'     => 'Portrait Video (90° rotation)',
			)
		);
		wp_update_attachment_metadata(
			$portrait_id,
			array(
				'width'  => 1920,
				'height' => 1080,
				'rotate' => 90,
			)
		);

		$attributes = array( 'id' => $portrait_id );
		$content    = '<figure class="wp-block-video"><video src="portrait.mp4"></video></figure>';

		$result = render_block_core_video( $attributes, $content );

		// The aspect-ratio must use the swapped (portrait) dimensions.
		$this->assertStringContainsString( 'aspect-ratio: 1080 / 1920;', $result );
		// The `auto` keyword must NOT be added (it would reintroduce CLS via the 300×150 default object size).
		$this->assertStringNotContainsString( 'aspect-ratio: auto', $result );
		// Width and height attributes must also reflect the displayed (portrait) dimensions.
		$this->assertStringContainsString( 'width="1080"', $result );
		$this->assertStringContainsString( 'height="1920"', $result );

		wp_delete_attachment( $portrait_id, true );
	}

	/**
	 * Tests that a 270° rotation is treated identically to 90° (both require swapping).
	 *
	 * @covers ::render_block_core_video
	 */
	public function test_render_block_core_video_portrait_video_with_270_rotation() {
		$portrait_id = $this->factory->attachment->create(
			array(
				'post_mime_type' => 'video/mp4',
				'post_title'     => 'Portrait Video (270° rotation)',
			)
		);
		wp_update_attachment_metadata(
			$portrait_id,
			array(
				'width'  => 1920,
				'height' => 1080,
				'rotate' => 270,
			)
		);

		$attributes = array( 'id' => $portrait_id );
		$content    = '<figure class="wp-block-video"><video src="portrait.mp4"></video></figure>';

		$result = render_block_core_video( $attributes, $content );

		$this->assertStringContainsString( 'aspect-ratio: 1080 / 1920;', $result );
		$this->assertStringContainsString( 'width="1080"', $result );
		$this->assertStringContainsString( 'height="1920"', $result );

		wp_delete_attachment( $portrait_id, true );
	}

	/**
	 * Tests that a 180° rotation does NOT swap the dimensions (the video is upside down
	 * but still landscape).
	 *
	 * @covers ::render_block_core_video
	 */
	public function test_render_block_core_video_180_rotation_does_not_swap_dimensions() {
		$flipped_id = $this->factory->attachment->create(
			array(
				'post_mime_type' => 'video/mp4',
				'post_title'     => 'Flipped Video (180° rotation)',
			)
		);
		wp_update_attachment_metadata(
			$flipped_id,
			array(
				'width'  => 1920,
				'height' => 1080,
				'rotate' => 180,
			)
		);

		$attributes = array( 'id' => $flipped_id );
		$content    = '<figure class="wp-block-video"><video src="flipped.mp4"></video></figure>';

		$result = render_block_core_video( $attributes, $content );

		// 180° rotation flips the video upside-down but does not change the aspect ratio.
		$this->assertStringContainsString( 'aspect-ratio: 1920 / 1080;', $result );
		$this->assertStringContainsString( 'width="1920"', $result );
		$this->assertStringContainsString( 'height="1080"', $result );

		wp_delete_attachment( $flipped_id, true );
	}

	/**
	 * Tests that a negative rotation value (e.g. -90°, equivalent to 270°) is handled correctly.
	 *
	 * @covers ::render_block_core_video
	 */
	public function test_render_block_core_video_negative_90_rotation_swaps_dimensions() {
		$portrait_id = $this->factory->attachment->create(
			array(
				'post_mime_type' => 'video/mp4',
				'post_title'     => 'Portrait Video (-90° rotation)',
			)
		);
		wp_update_attachment_metadata(
			$portrait_id,
			array(
				'width'  => 1920,
				'height' => 1080,
				'rotate' => -90,
			)
		);

		$attributes = array( 'id' => $portrait_id );
		$content    = '<figure class="wp-block-video"><video src="portrait.mp4"></video></figure>';

		$result = render_block_core_video( $attributes, $content );

		$this->assertStringContainsString( 'aspect-ratio: 1080 / 1920;', $result );
		$this->assertStringContainsString( 'width="1080"', $result );
		$this->assertStringContainsString( 'height="1920"', $result );

		wp_delete_attachment( $portrait_id, true );
	}

	/**
	 * Tests that the `gutenberg_add_video_rotation_to_metadata` filter adds the rotation
	 * from getID3 raw data to the stored attachment metadata.
	 *
	 * @covers ::gutenberg_add_video_rotation_to_metadata
	 */
	public function test_gutenberg_add_video_rotation_to_metadata_adds_rotate_from_getid3_data() {
		$metadata = array(
			'width'  => 1920,
			'height' => 1080,
		);
		$data     = array(
			'video' => array(
				'rotate' => 90,
			),
		);

		$result = gutenberg_add_video_rotation_to_metadata( $metadata, '/fake/path.mp4', 'mp4', $data );

		$this->assertArrayHasKey( 'rotate', $result );
		$this->assertSame( 90, $result['rotate'] );
	}

	/**
	 * Tests that the filter does not overwrite a rotate value already present in metadata.
	 *
	 * @covers ::gutenberg_add_video_rotation_to_metadata
	 */
	public function test_gutenberg_add_video_rotation_to_metadata_does_not_overwrite_existing_rotate() {
		$metadata = array(
			'width'  => 1920,
			'height' => 1080,
			'rotate' => 0,
		);
		$data     = array(
			'video' => array(
				'rotate' => 90,
			),
		);

		$result = gutenberg_add_video_rotation_to_metadata( $metadata, '/fake/path.mp4', 'mp4', $data );

		// The pre-existing rotate=0 must not be overwritten.
		$this->assertSame( 0, $result['rotate'] );
	}

	/**
	 * Tests that the filter does nothing when no rotation is present in the raw getID3 data.
	 *
	 * @covers ::gutenberg_add_video_rotation_to_metadata
	 */
	public function test_gutenberg_add_video_rotation_to_metadata_does_nothing_when_no_rotation_in_data() {
		$metadata = array(
			'width'  => 1920,
			'height' => 1080,
		);
		$data     = array(
			'video' => array(),
		);

		$result = gutenberg_add_video_rotation_to_metadata( $metadata, '/fake/path.mp4', 'mp4', $data );

		$this->assertArrayNotHasKey( 'rotate', $result );
	}
}

