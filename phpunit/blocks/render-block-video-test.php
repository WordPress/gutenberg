<?php
/**
 * Video block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Video block's Live photo playback wiring.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Video extends WP_UnitTestCase {

	/**
	 * Attachment the rendered blocks point at.
	 *
	 * @var int
	 */
	private $attachment_id;

	public function set_up() {
		parent::set_up();

		$this->attachment_id = self::factory()->attachment->create_upload_object(
			DIR_TESTDATA . '/images/canola.jpg'
		);
	}

	public function tear_down() {
		$this->remove_added_uploads();

		parent::tear_down();
	}

	/**
	 * Records a converted-sequence companion video on the attachment.
	 */
	private function add_motion_companion(): void {
		$metadata                   = wp_get_attachment_metadata( $this->attachment_id, true );
		$metadata                   = is_array( $metadata ) ? $metadata : array();
		$metadata['animated_video'] = 'live-photo.mp4';
		wp_update_attachment_metadata( $this->attachment_id, $metadata );
	}

	/**
	 * Builds saved Video block markup.
	 *
	 * @param string $video_attributes Playback attributes for the VIDEO tag.
	 * @return string Block content.
	 */
	private function get_content( string $video_attributes ): string {
		return '<figure class="wp-block-video"><video ' . $video_attributes .
			' src="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/live-photo.mp4"></video></figure>';
	}

	/**
	 * A Live photo plays on hover and on focus, and is reachable by keyboard.
	 *
	 * @covers ::render_block_core_video
	 */
	public function test_live_photo_gets_hover_playback_directives() {
		$this->add_motion_companion();

		$rendered = gutenberg_render_block_core_video(
			array( 'id' => $this->attachment_id ),
			$this->get_content( 'loop muted playsinline' )
		);

		$this->assertStringContainsString( 'data-wp-interactive="core/video"', $rendered );
		$this->assertStringContainsString( 'data-wp-on--pointerenter="actions.playLivePhoto"', $rendered );
		$this->assertStringContainsString( 'data-wp-on--pointerleave="actions.pauseLivePhoto"', $rendered );
		$this->assertStringContainsString( 'data-wp-on--focus="actions.playLivePhoto"', $rendered );
		$this->assertStringContainsString( 'tabindex="0"', $rendered );
	}

	/**
	 * An ordinary video must not pay for behavior it does not use.
	 *
	 * @covers ::render_block_core_video
	 */
	public function test_ordinary_video_gets_no_directives() {
		$rendered = gutenberg_render_block_core_video(
			array( 'id' => $this->attachment_id ),
			$this->get_content( 'controls' )
		);

		$this->assertStringNotContainsString( 'data-wp-interactive', $rendered );
	}

	/**
	 * The GIF variation autoplays in pure HTML and needs no script.
	 *
	 * @covers ::render_block_core_video
	 */
	public function test_gif_variation_gets_no_directives() {
		$this->add_motion_companion();

		$rendered = gutenberg_render_block_core_video(
			array( 'id' => $this->attachment_id ),
			$this->get_content( 'autoplay loop muted playsinline' )
		);

		$this->assertStringNotContainsString( 'data-wp-interactive', $rendered );
	}

	/**
	 * A hand-built video can happen to be muted, looping and inline. Without a
	 * companion video there is no evidence it came from an image sequence, so
	 * its playback must be left alone.
	 *
	 * @covers ::render_block_core_video
	 */
	public function test_matching_playback_without_a_companion_is_left_alone() {
		$rendered = gutenberg_render_block_core_video(
			array( 'id' => $this->attachment_id ),
			$this->get_content( 'loop muted playsinline' )
		);

		$this->assertStringNotContainsString( 'data-wp-interactive', $rendered );
	}
}
