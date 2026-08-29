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
	 * Post object.
	 *
	 * @var object
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
	 * Test gutenberg_render_block_core_cover() method.
	 *
	 * @covers ::gutenberg_render_block_core_cover
	 */
	public function test_gutenberg_render_block_core_cover() {

		global $wp_query;

		// Fake being in the loop.
		$wp_query->in_the_loop = true;
		$wp_query->post        = self::$post;

		$wp_query->posts = array( self::$post );
		$GLOBALS['post'] = self::$post;

		$attributes = array(
			'useFeaturedImage' => true,
			'backgroundType'   => 'image',
			'hasParallax'      => true,
			'isRepeated'       => true,
			'minHeight'        => '100px',
		);

		$content  = '<div class="wp-block-cover" style="min-height:100px"><span></span><div class="wp-block-cover__inner-container"></div></div>';
		$rendered = gutenberg_render_block_core_cover( $attributes, $content );

		$this->assertStringContainsString( wp_get_attachment_image_url( self::$attachment_id, 'full' ), $rendered );
		$this->assertStringContainsString( 'background-image', $rendered );
		$this->assertStringContainsString( 'min-height', $rendered );

		// If cover background type is not image.
		$attributes['backgroundType'] = 'color';
		$rendered                     = gutenberg_render_block_core_cover( $attributes, '' );
		$this->assertEmpty( $rendered );

		// If cover background is not post featured image.
		$attributes['backgroundType']   = 'image';
		$attributes['useFeaturedImage'] = false;
		$rendered                       = gutenberg_render_block_core_cover( $attributes, '' );
		$this->assertEmpty( $rendered );
	}

	/**
	 * Test gutenberg_render_block_core_cover() method.
	 *
	 * @covers ::gutenberg_render_block_core_cover
	 */
	public function test_gutenberg_render_block_core_cover_fixed_or_repeated_background() {

		global $wp_query;

		// Fake being in the loop.
		$wp_query->post  = self::$post;
		$GLOBALS['post'] = self::$post;

		$attributes = array(
			'useFeaturedImage' => true,
			'backgroundType'   => 'image',
			'hasParallax'      => false,
			'isRepeated'       => false,
			'minHeight'        => '100px',
			'focalPoint'       => array(
				'x' => 10,
				'y' => 10,
			),
		);

		$content  = '<div class="wp-block-cover"><span></span><div class="wp-block-cover__inner-container"></div></div>';
		$rendered = gutenberg_render_block_core_cover( $attributes, $content );

		$this->assertStringContainsString( wp_get_attachment_image_url( self::$attachment_id, 'full' ), $rendered );
		$this->assertStringContainsString( 'object-position', $rendered );
		$this->assertStringNotContainsString( 'background-image', $rendered );
		$this->assertStringNotContainsString( 'min-height', $rendered );
	}

	/**
	 * Tests that an embed background reads the iframe src, decoded, from the
	 * oEmbed HTML.
	 *
	 * @covers ::gutenberg_render_block_core_cover
	 */
	public function test_gutenberg_render_block_core_cover_embed_background_reads_decoded_iframe_src() {
		$oembed_html = '<iframe data-src="https://example.com/placeholder" src="https://www.youtube.com/embed/abc123?feature=oembed&amp;si=xyz" title="Video"></iframe>';
		$filter      = static function () use ( $oembed_html ) {
			return $oembed_html;
		};
		add_filter( 'pre_oembed_result', $filter );

		$attributes = array(
			'backgroundType' => 'embed-video',
			'url'            => 'https://www.youtube.com/watch?v=abc123',
		);
		$content    = '<div class="wp-block-cover"><figure class="wp-block-embed"><div class="wp-block-embed__wrapper">https://www.youtube.com/watch?v=abc123</div></figure></div>';
		$rendered   = gutenberg_render_block_core_cover( $attributes, $content );

		remove_filter( 'pre_oembed_result', $filter );

		$processor = new WP_HTML_Tag_Processor( $rendered );
		$this->assertTrue( $processor->next_tag( 'IFRAME' ), 'The rendered cover should contain an iframe.' );

		$src = $processor->get_attribute( 'src' );
		$this->assertSame( 'www.youtube.com', wp_parse_url( $src, PHP_URL_HOST ), 'The src should come from the src attribute, not data-src.' );

		parse_str( wp_parse_url( $src, PHP_URL_QUERY ), $query_params );
		$this->assertSame( 'oembed', $query_params['feature'] ?? null );
		$this->assertSame( 'xyz', $query_params['si'] ?? null, 'Parameters after the first one should keep their names.' );
		$this->assertArrayNotHasKey( 'amp;si', $query_params );
	}
}
