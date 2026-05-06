<?php
/**
 * Tests for the render_block_core_post_featured_media() function.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @covers ::render_block_core_post_featured_media
 * @group blocks
 */

require_once dirname( __DIR__, 2 ) . '/packages/block-library/src/post-featured-media/index.php';

class Tests_Blocks_Render_Post_Featured_Media extends WP_UnitTestCase {

	protected static $post_id;
	protected static $video_id;
	protected static $audio_id;

	public static function wpSetUpBeforeClass( $factory ) {
		// Register the block so WP_Block populates $block->context from usesContext.
		if ( ! WP_Block_Type_Registry::get_instance()->is_registered( 'core/post-featured-media' ) ) {
			register_block_core_post_featured_media();
		}

		self::$post_id = $factory->post->create(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Featured Media Test Post',
			)
		);

		self::$video_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_title'     => 'Test Video',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/mp4',
				'post_parent'    => self::$post_id,
				'guid'           => 'http://example.org/wp-content/uploads/test-video.mp4',
			)
		);
		update_post_meta( self::$video_id, '_wp_attached_file', 'test-video.mp4' );

		self::$audio_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_title'     => 'Test Audio',
				'post_status'    => 'inherit',
				'post_mime_type' => 'audio/mpeg',
				'post_parent'    => self::$post_id,
				'guid'           => 'http://example.org/wp-content/uploads/test-audio.mp3',
			)
		);
		update_post_meta( self::$audio_id, '_wp_attached_file', 'test-audio.mp3' );
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post_id, true );
		wp_delete_post( self::$video_id, true );
		wp_delete_post( self::$audio_id, true );
		parent::wpTearDownAfterClass();
	}

	public function tear_down() {
		delete_post_meta( self::$post_id, '_featured_video_id' );
		delete_post_meta( self::$post_id, '_featured_audio_id' );
		delete_post_thumbnail( self::$post_id );
		parent::tear_down();
	}

	/**
	 * Renders the block with the given attributes in the test post context.
	 */
	private function render_block( array $attributes = array() ): string {
		$defaults = array(
			'isLink'     => false,
			'linkTarget' => '_self',
			'controls'   => true,
		);
		$block    = new WP_Block(
			array(
				'blockName' => 'core/post-featured-media',
				'attrs'     => array_merge( $defaults, $attributes ),
			),
			array(
				'postId'   => self::$post_id,
				'postType' => 'post',
			)
		);
		return $block->render();
	}

	public function test_returns_empty_string_when_no_post_context() {
		$block = new WP_Block(
			array(
				'blockName' => 'core/post-featured-media',
				'attrs'     => array( 'isLink' => false, 'linkTarget' => '_self', 'controls' => true ),
			)
			// No context — postId is absent.
		);
		$this->assertSame( '', $block->render() );
	}

	public function test_returns_empty_string_when_no_media_set() {
		$this->assertSame( '', $this->render_block() );
	}

	public function test_renders_featured_video() {
		update_post_meta( self::$post_id, '_featured_video_id', self::$video_id );

		$output = $this->render_block();

		$this->assertStringContainsString( '<video', $output );
		$this->assertStringContainsString( 'test-video.mp4', $output );
	}

	public function test_renders_featured_audio() {
		update_post_meta( self::$post_id, '_featured_audio_id', self::$audio_id );

		$output = $this->render_block();

		$this->assertStringContainsString( '<audio', $output );
		$this->assertStringContainsString( 'test-audio.mp3', $output );
	}

	public function test_featured_image_takes_priority_over_video() {
		$image_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_title'     => 'Test Image',
				'post_status'    => 'inherit',
				'post_mime_type' => 'image/jpeg',
				'post_parent'    => self::$post_id,
				'guid'           => 'http://example.org/wp-content/uploads/test-image.jpg',
			)
		);
		update_post_meta( $image_id, '_wp_attached_file', 'test-image.jpg' );
		update_post_meta( $image_id, '_wp_attachment_metadata', array( 'width' => 800, 'height' => 600, 'sizes' => array() ) );
		set_post_thumbnail( self::$post_id, $image_id );
		update_post_meta( self::$post_id, '_featured_video_id', self::$video_id );

		$output = $this->render_block();

		$this->assertStringContainsString( '<img', $output );
		$this->assertStringNotContainsString( '<video', $output );

		wp_delete_post( $image_id, true );
	}

	public function test_video_shows_controls_by_default() {
		update_post_meta( self::$post_id, '_featured_video_id', self::$video_id );

		$output = $this->render_block( array( 'controls' => true ) );

		$this->assertStringContainsString( ' controls', $output );
	}

	public function test_video_hides_controls_when_disabled() {
		update_post_meta( self::$post_id, '_featured_video_id', self::$video_id );

		$output = $this->render_block( array( 'controls' => false ) );

		$this->assertStringNotContainsString( ' controls', $output );
	}

	public function test_audio_shows_controls_by_default() {
		update_post_meta( self::$post_id, '_featured_audio_id', self::$audio_id );

		$output = $this->render_block( array( 'controls' => true ) );

		$this->assertStringContainsString( ' controls', $output );
	}

	public function test_audio_hides_controls_when_disabled() {
		update_post_meta( self::$post_id, '_featured_audio_id', self::$audio_id );

		$output = $this->render_block( array( 'controls' => false ) );

		$this->assertStringNotContainsString( ' controls', $output );
	}

	public function test_wraps_video_in_link_when_is_link_true() {
		update_post_meta( self::$post_id, '_featured_video_id', self::$video_id );

		$output = $this->render_block(
			array(
				'isLink'     => true,
				'linkTarget' => '_blank',
			)
		);

		$this->assertStringContainsString( '<a ', $output );
		$this->assertStringContainsString( 'target="_blank"', $output );
		$this->assertStringContainsString( '<video', $output );
	}

	public function test_wraps_audio_in_link_when_is_link_true() {
		update_post_meta( self::$post_id, '_featured_audio_id', self::$audio_id );

		$output = $this->render_block(
			array(
				'isLink'     => true,
				'linkTarget' => '_self',
			)
		);

		$this->assertStringContainsString( '<a ', $output );
		$this->assertStringContainsString( 'target="_self"', $output );
		$this->assertStringContainsString( '<audio', $output );
	}

	public function test_output_is_wrapped_in_figure() {
		update_post_meta( self::$post_id, '_featured_video_id', self::$video_id );

		$output = $this->render_block();

		$this->assertStringContainsString( '<figure ', $output );
		$this->assertStringContainsString( '</figure>', $output );
	}

	public function test_video_has_full_width_style() {
		update_post_meta( self::$post_id, '_featured_video_id', self::$video_id );

		$output = $this->render_block();

		$this->assertStringContainsString( 'width:100%', $output );
	}
}
