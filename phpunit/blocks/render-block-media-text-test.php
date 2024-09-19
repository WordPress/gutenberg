<?php
/**
 * Media & Text block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Media & Text block.
 *
 * @group blocks
 *
 * @covers ::render_block_core_media_text
 */
class Render_Block_MediaText_Test extends WP_UnitTestCase {

	/**
	 * Post object.
	 *
	 * @var WP_Post
	 */
	protected static $post;

	/**
	 * Attachment id.
	 *
	 * @var int
	 */
	protected static $attachment_id;

	/**
	 * Setup method.
	 */
	public static function wpSetUpBeforeClass() {
		self::$post = self::factory()->post->create_and_get();
		$file       = DIR_TESTDATA . '/images/canola.jpg';

		self::$attachment_id = self::factory()->attachment->create_upload_object(
			$file,
			self::$post->ID,
			array(
				'post_mime_type' => 'image/jpeg',
			)
		);

		set_post_thumbnail( self::$post, self::$attachment_id );
	}

	/**
	 * Tear down method.
	 */
	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post->ID, true );
		wp_delete_post( self::$attachment_id, true );
	}

	/**
	 * Helper method for $wp_query.
	 */
	public static function setup_query() {
		global $wp_query;
		$wp_query->in_the_loop = true;
		$wp_query->post        = self::$post;
		$wp_query->posts       = array( self::$post );
		$GLOBALS['post']       = self::$post;
	}

	/**
	 * Test gutenberg_render_block_core_media_text with the featured image on the left.
	 */
	public function test_render_block_core_media_text_featured_image() {
		$this->setup_query();

		$content = '<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"></figure><div class="wp-block-media-text__content"><p></p></div></div>';

		// Assert that the rendered block contains the featured image.
		$attributes = array(
			'useFeaturedImage' => true,
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );

		// Assert that the rendered block contains the featured image as an image element,
		// when image fill is true.
		$attributes = array(
			'useFeaturedImage' => true,
			'imageFill'        => true,
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );
	}

	/**
	 * Test gutenberg_render_block_core_media_text with the featured image on the left,
	 * and a second media & text block nested inside the content area.
	 */
	public function test_render_block_core_media_text_featured_image_nested() {
		$this->setup_query();
		$content = '<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"></figure><div class="wp-block-media-text__content"><div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"></figure><div class="wp-block-media-text__content"><p></p></div></div></div></div>';

		// Assert that the rendered block contains the featured image.
		$attributes = array(
			'useFeaturedImage' => true,
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );

		// Assert that the rendered block contains the featured image as an image element,
		// when image fill is true.
		$attributes = array(
			'useFeaturedImage' => true,
			'imageFill'        => true,
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );
	}

	/**
	 * Test gutenberg_render_block_core_media_text with the featured image on the right.
	 */
	public function test_render_block_core_media_text_featured_image_media_on_right() {
		$this->setup_query();

		$content = '<div class="wp-block-media-text has-media-on-the-right is-stacked-on-mobile"><div class="wp-block-media-text__content"><p></p></div><figure class="wp-block-media-text__media"></figure></div>';

		// Assert that the rendered block contains the featured image when media is on the right.
		$attributes = array(
			'useFeaturedImage' => true,
			'mediaPosition'    => 'right',
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );

		// Assert that the rendered block contains the featured image as an image element,
		// when image fill is true and the media is on the right.
		$attributes = array(
			'useFeaturedImage' => true,
			'mediaPosition'    => 'right',
			'imageFill'        => true,
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );
	}

	/**
	 * Test gutenberg_render_block_core_media_text with the featured image on the right,
	 * and a second media & text block nested inside the content area.
	 */
	public function test_render_block_core_media_text_featured_image_media_on_right_nested() {
		$this->setup_query();

		$content = '<div class="wp-block-media-text has-media-on-the-right is-stacked-on-mobile"><div class="wp-block-media-text__content"><div class="wp-block-media-text is-stacked-on-mobile"><div class="wp-block-media-text__content"><p></p></div><figure class="wp-block-media-text__media"></figure></div></div><figure class="wp-block-media-text__media"></figure></div>';

		// Assert that the rendered block contains the featured image when media is on the right.
		$attributes = array(
			'useFeaturedImage' => true,
			'mediaPosition'    => 'right',
		);

		$rendered = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );

		// Assert that the rendered block contains the featured image as an image element,
		// when image fill is true and the media is on the right.
		$attributes = array(
			'useFeaturedImage' => true,
			'mediaPosition'    => 'right',
			'imageFill'        => true,
		);

		$rendered = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );
	}
}
