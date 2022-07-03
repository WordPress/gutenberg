<?php
/**
 * Cover block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Cover block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Cover extends WP_UnitTestCase {
	/**
	 * Post object .
	 *
	 * @var array
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
	 * Test render_block_core_cover() method.
	 *
	 * @covers ::render_block_core_cover
	 */
	public function test_render_block_core_latest_posts() {

		global $wp_query;

		// Fake being in the loop.
		$wp_query->in_the_loop = true;

		$attributes = array(
			'useFeaturedImage' => true,
			'backgroundType'   => 'image',
			'hasParallax'      => true,
			'isRepeated'       => true,
		);

		$content = '<div class="wp-block-cover"><span></span><div class="wp-block-cover__inner-container"></div></div>';

		$wp_query->post  = self::$post;
		$wp_query->posts = array( self::$post );

		$attributes['minHeight'] = '100px';
		$rendered                = render_block_core_cover( $attributes, $content );
		$this->assertStringContainsString( wp_get_attachment_image_url( self::$attachment_id, 'full' ), $rendered );
		$this->assertStringContainsString( 'background-image', $rendered );
		$this->assertStringContainsString( 'min-height', $rendered );

		$attributes['hasParallax'] = false;
		$attributes['isRepeated']  = false;
		$attributes['focalPoint']  = array(
			'x' => 10,
			'y' => 10,
		);

		$rendered = render_block_core_cover( $attributes, $content );

		$this->assertStringContainsString( wp_get_attachment_image_url( self::$attachment_id, 'full' ), $rendered );
		$this->assertStringNotContainsString( 'background-image', $rendered );
		$this->assertStringNotContainsString( 'min-height', $rendered );

		$attributes['backgroundType'] = 'color';
		$rendered                     = render_block_core_cover( $attributes, '' );
		$this->assertEmpty( $rendered );

		$attributes['backgroundType']   = 'image';
		$attributes['useFeaturedImage'] = false;
		$rendered                       = render_block_core_cover( $attributes, '' );
		$this->assertEmpty( $rendered );
	}
}
