<?php
/**
 * Audio block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Audio block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Audio extends WP_UnitTestCase {

	/**
	 * @covers ::render_block_core_audio
	 */
	public function test_render_block_core_audio_adds_directives_to_audio() {
		$content = '<figure class="wp-block-audio"><audio controls src="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/song.mp3"></audio><figcaption class="wp-element-caption">Song</figcaption></figure>';

		$processor = new WP_HTML_Tag_Processor( gutenberg_render_block_core_audio( array(), $content ) );

		$this->assertTrue( $processor->next_tag( 'FIGURE' ) );
		$this->assertNull( $processor->get_attribute( 'data-wp-interactive' ) );

		$this->assertTrue( $processor->next_tag( 'AUDIO' ) );
		$this->assertSame( 'core/audio', $processor->get_attribute( 'data-wp-interactive' ) );
		$this->assertSame( 'actions.pauseOtherAudio', $processor->get_attribute( 'data-wp-on--play' ) );
	}

	/**
	 * @covers ::render_block_core_audio
	 */
	public function test_render_block_core_audio_enqueues_view_script_module() {
		$content = '<figure class="wp-block-audio"><audio controls src="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/song.mp3"></audio></figure>';

		// An earlier render in the same request may have enqueued it already.
		wp_dequeue_script_module( '@wordpress/block-library/audio/view' );
		gutenberg_render_block_core_audio( array(), $content );

		$this->assertContains( '@wordpress/block-library/audio/view', wp_script_modules()->get_queue() );
	}

	/**
	 * @covers ::render_block_core_audio
	 */
	public function test_render_block_core_audio_leaves_content_without_audio_unchanged() {
		$content = '<figure class="wp-block-audio"></figure>';

		$this->assertSame( $content, gutenberg_render_block_core_audio( array(), $content ) );
	}
}
