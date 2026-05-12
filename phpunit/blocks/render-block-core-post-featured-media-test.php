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
		delete_post_meta( self::$post_id, '_featured_media_id' );
		delete_post_meta( self::$post_id, '_featured_media_type' );
		delete_post_thumbnail( self::$post_id );
		parent::tear_down();
	}

	private function set_featured_media( int $attachment_id, string $type ): void {
		update_post_meta( self::$post_id, '_featured_media_id', $attachment_id );
		update_post_meta( self::$post_id, '_featured_media_type', $type );
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
				'attrs'     => array(
					'isLink'     => false,
					'linkTarget' => '_self',
					'controls'   => true,
				),
			)
			// No context — postId is absent.
		);
		$this->assertSame( '', $block->render() );
	}

	public function test_returns_empty_string_when_no_media_set() {
		$this->assertSame( '', $this->render_block() );
	}

	public function test_renders_featured_video() {
		$this->set_featured_media( self::$video_id, 'video' );

		$output = $this->render_block();

		$this->assertStringContainsString( '<video', $output );
		$this->assertStringContainsString( 'test-video.mp4', $output );
	}

	public function test_renders_featured_audio() {
		$this->set_featured_media( self::$audio_id, 'audio' );

		$output = $this->render_block();

		$this->assertStringContainsString( '<audio', $output );
		$this->assertStringContainsString( 'test-audio.mp3', $output );
	}

	public function test_featured_image_wins_when_both_slots_populated() {
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
		update_post_meta(
			$image_id,
			'_wp_attachment_metadata',
			array(
				'width'  => 800,
				'height' => 600,
				'sizes'  => array(),
			)
		);
		set_post_thumbnail( self::$post_id, $image_id );
		$this->set_featured_media( self::$video_id, 'video' );

		$output = $this->render_block();

		$this->assertStringContainsString( '<img', $output );
		$this->assertStringNotContainsString( '<video', $output );

		wp_delete_post( $image_id, true );
	}

	public function test_video_shows_controls_by_default() {
		$this->set_featured_media( self::$video_id, 'video' );

		$output = $this->render_block( array( 'controls' => true ) );

		$this->assertStringContainsString( ' controls', $output );
	}

	public function test_video_hides_controls_when_disabled() {
		$this->set_featured_media( self::$video_id, 'video' );

		$output = $this->render_block( array( 'controls' => false ) );

		$this->assertStringNotContainsString( ' controls', $output );
	}

	public function test_audio_shows_controls_by_default() {
		$this->set_featured_media( self::$audio_id, 'audio' );

		$output = $this->render_block( array( 'controls' => true ) );

		$this->assertStringContainsString( ' controls', $output );
	}

	public function test_audio_hides_controls_when_disabled() {
		$this->set_featured_media( self::$audio_id, 'audio' );

		$output = $this->render_block( array( 'controls' => false ) );

		$this->assertStringNotContainsString( ' controls', $output );
	}

	public function test_wraps_video_in_link_when_is_link_true() {
		$this->set_featured_media( self::$video_id, 'video' );

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
		$this->set_featured_media( self::$audio_id, 'audio' );

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
		$this->set_featured_media( self::$video_id, 'video' );

		$output = $this->render_block();

		$this->assertStringContainsString( '<figure ', $output );
		$this->assertStringContainsString( '</figure>', $output );
	}

	public function test_video_has_full_width_style() {
		$this->set_featured_media( self::$video_id, 'video' );

		$output = $this->render_block();

		$this->assertStringContainsString( 'width:100%', $output );
	}

	public function test_get_post_featured_media_returns_image() {
		$image_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_title'     => 'Test Image',
				'post_status'    => 'inherit',
				'post_mime_type' => 'image/jpeg',
				'post_parent'    => self::$post_id,
				'guid'           => 'http://example.org/wp-content/uploads/test-image-2.jpg',
			)
		);
		set_post_thumbnail( self::$post_id, $image_id );

		$this->assertSame(
			array(
				'id'   => $image_id,
				'type' => 'image',
			),
			get_post_featured_media( self::$post_id )
		);

		wp_delete_post( $image_id, true );
	}

	public function test_get_post_featured_media_returns_video() {
		$this->set_featured_media( self::$video_id, 'video' );

		$this->assertSame(
			array(
				'id'   => self::$video_id,
				'type' => 'video',
			),
			get_post_featured_media( self::$post_id )
		);
	}

	public function test_get_post_featured_media_returns_null_when_unset() {
		$this->assertNull( get_post_featured_media( self::$post_id ) );
	}

	public function test_invalid_link_target_falls_back_to_self() {
		$this->set_featured_media( self::$video_id, 'video' );

		$output = $this->render_block(
			array(
				'isLink'     => true,
				'linkTarget' => 'javascript:alert(1)',
			)
		);

		$this->assertStringContainsString( 'target="_self"', $output );
		$this->assertStringNotContainsString( 'javascript', $output );
	}

	public function test_valid_scale_is_emitted() {
		$this->set_featured_media( self::$video_id, 'video' );

		$output = $this->render_block(
			array(
				'aspectRatio' => '16/9',
				'scale'       => 'contain',
			)
		);

		$this->assertStringContainsString( 'object-fit:contain', $output );
	}

	public function test_invalid_scale_is_dropped() {
		$this->set_featured_media( self::$video_id, 'video' );

		$output = $this->render_block(
			array(
				'aspectRatio' => '16/9',
				'scale'       => 'url(evil)',
			)
		);

		$this->assertStringNotContainsString( 'object-fit', $output );
	}

	/**
	 * Helper used by the get_the_post_thumbnail tests below. Inserts an image
	 * attachment, sets it as the post thumbnail, and returns the attachment ID.
	 */
	private function make_test_image_thumbnail(): int {
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
		update_post_meta(
			$image_id,
			'_wp_attachment_metadata',
			array(
				'width'  => 800,
				'height' => 600,
				'sizes'  => array(),
			)
		);
		set_post_thumbnail( self::$post_id, $image_id );
		return $image_id;
	}

	public function test_linked_image_uses_post_title_as_alt() {
		$image_id = $this->make_test_image_thumbnail();

		$output = $this->render_block( array( 'isLink' => true ) );

		$this->assertStringContainsString( 'alt="Featured Media Test Post"', $output );

		wp_delete_post( $image_id, true );
	}

	public function test_video_has_preload_metadata_and_playsinline() {
		$this->set_featured_media( self::$video_id, 'video' );

		$output = $this->render_block();

		$this->assertStringContainsString( 'preload="metadata"', $output );
		$this->assertStringContainsString( 'playsinline', $output );
	}

	public function test_audio_has_preload_metadata() {
		$this->set_featured_media( self::$audio_id, 'audio' );

		$output = $this->render_block();

		$this->assertStringContainsString( 'preload="metadata"', $output );
	}

	public function test_image_attributes_filter_is_applied() {
		$image_id = $this->make_test_image_thumbnail();

		// Themes/plugins commonly hook this filter to add classes, loading
		// attributes, etc. Refactoring away from get_the_post_thumbnail()
		// would skip the filter — assert it runs.
		$ran = false;
		$cb  = static function ( $attr ) use ( &$ran ) {
			$ran           = true;
			$attr['class'] = ( $attr['class'] ?? '' ) . ' from-filter';
			return $attr;
		};
		add_filter( 'wp_get_attachment_image_attributes', $cb );

		$output = $this->render_block();

		remove_filter( 'wp_get_attachment_image_attributes', $cb );

		$this->assertTrue( $ran, 'wp_get_attachment_image_attributes was not called' );
		$this->assertStringContainsString( 'from-filter', $output );

		wp_delete_post( $image_id, true );
	}
}
