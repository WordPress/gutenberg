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

	/**
	 * Tests the `sizes` value for a background image, which has to account for
	 * the height of the block.
	 *
	 * @dataProvider data_background_image_sizes
	 *
	 * @covers ::gutenberg_block_core_cover_get_background_image_sizes
	 *
	 * @param array       $attributes   Block attributes.
	 * @param int         $image_width  Image width.
	 * @param int         $image_height Image height.
	 * @param string|null $expected     Expected `sizes` value.
	 */
	public function test_background_image_sizes( $attributes, $image_width, $image_height, $expected ) {
		$this->assertSame(
			$expected,
			gutenberg_block_core_cover_get_background_image_sizes( $attributes, $image_width, $image_height )
		);
	}

	/**
	 * Data provider for test_background_image_sizes().
	 *
	 * @return array
	 */
	public function data_background_image_sizes() {
		return array(
			'min height in px'                           => array(
				array( 'style' => array( 'dimensions' => array( 'minHeight' => '400px' ) ) ),
				2400,
				500,
				'max(100vw, 1920px)',
			),
			'min height in vh'                           => array(
				array( 'style' => array( 'dimensions' => array( 'minHeight' => '50vh' ) ) ),
				2400,
				500,
				'max(100vw, 240vh)',
			),
			'min height from legacy attributes'          => array(
				array(
					'minHeight'     => 400,
					'minHeightUnit' => 'px',
				),
				2400,
				500,
				'max(100vw, 1920px)',
			),
			'no height uses the stylesheet min height'   => array(
				array(),
				2400,
				500,
				'max(100vw, 2064px)',
			),
			'aspect ratio narrower than the image'       => array(
				array( 'style' => array( 'dimensions' => array( 'aspectRatio' => '16/9' ) ) ),
				2400,
				500,
				'270vw',
			),
			'aspect ratio wider than the image'          => array(
				array( 'style' => array( 'dimensions' => array( 'aspectRatio' => '21/9' ) ) ),
				640,
				480,
				null,
			),
			'auto aspect ratio falls back to min height' => array(
				array( 'style' => array( 'dimensions' => array( 'aspectRatio' => 'auto' ) ) ),
				2400,
				500,
				'max(100vw, 2064px)',
			),
			'min height that sizes cannot use'           => array(
				array( 'style' => array( 'dimensions' => array( 'minHeight' => 'var(--wp--preset--dimension--large)' ) ) ),
				2400,
				500,
				null,
			),
			'style that is not an array'                 => array(
				array( 'style' => 'min-height: 400px' ),
				2400,
				500,
				'max(100vw, 2064px)',
			),
			'image without dimensions'                   => array(
				array(),
				2400,
				0,
				null,
			),
		);
	}

	/**
	 * Tests that an uploaded background image gets a `sizes` value that accounts
	 * for the height of the block.
	 *
	 * @covers ::gutenberg_render_block_core_cover
	 */
	public function test_gutenberg_render_block_core_cover_adds_sizes_to_background_image() {
		$attributes = array(
			'backgroundType'   => 'image',
			'useFeaturedImage' => false,
			'hasParallax'      => false,
			'isRepeated'       => false,
			'id'               => self::$attachment_id,
			'style'            => array( 'dimensions' => array( 'minHeight' => '400px' ) ),
		);
		$content    = '<div class="wp-block-cover"><img class="wp-block-cover__image-background wp-image-' . self::$attachment_id . '" alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"/><div class="wp-block-cover__inner-container"></div></div>';

		$processor = new WP_HTML_Tag_Processor( gutenberg_render_block_core_cover( $attributes, $content ) );
		$processor->next_tag( 'IMG' );

		// The test image is 640x480, so a 400px tall block needs a 533.33px wide image.
		$this->assertSame( 'max(100vw, 533.33px)', $processor->get_attribute( 'sizes' ) );
	}

	/**
	 * Tests that an existing `sizes` value on a background image is kept.
	 *
	 * @covers ::gutenberg_render_block_core_cover
	 */
	public function test_gutenberg_render_block_core_cover_keeps_existing_sizes() {
		$attributes = array(
			'backgroundType'   => 'image',
			'useFeaturedImage' => false,
			'hasParallax'      => false,
			'isRepeated'       => false,
			'id'               => self::$attachment_id,
		);
		$content    = '<div class="wp-block-cover"><img class="wp-block-cover__image-background" sizes="50vw" src="image.jpg"/></div>';

		$this->assertSame( $content, gutenberg_render_block_core_cover( $attributes, $content ) );
	}

	/**
	 * Tests that the `auto` keyword WordPress adds to lazy-loaded images is
	 * removed from a `sizes` value set by the Cover block, and only from that.
	 *
	 * @covers ::gutenberg_block_core_cover_remove_background_image_auto_sizes
	 */
	public function test_remove_background_image_auto_sizes() {
		$this->assertSame(
			'<img class="wp-block-cover__image-background" sizes="max(100vw, 1920px)" loading="lazy">',
			gutenberg_block_core_cover_remove_background_image_auto_sizes( '<img class="wp-block-cover__image-background" sizes="auto, max(100vw, 1920px)" loading="lazy">' )
		);
		$this->assertSame(
			'<img class="wp-block-cover__image-background" sizes="270vw" loading="lazy">',
			gutenberg_block_core_cover_remove_background_image_auto_sizes( '<img class="wp-block-cover__image-background" sizes="auto, 270vw" loading="lazy">' )
		);

		$default_sizes = '<img class="wp-block-cover__image-background" sizes="auto, (max-width: 640px) 100vw, 640px" loading="lazy">';
		$this->assertSame( $default_sizes, gutenberg_block_core_cover_remove_background_image_auto_sizes( $default_sizes ) );

		$other_image = '<img class="wp-image-1" sizes="auto, max(100vw, 1920px)" loading="lazy">';
		$this->assertSame( $other_image, gutenberg_block_core_cover_remove_background_image_auto_sizes( $other_image ) );
	}

	/**
	 * Tests that a lazy-loaded Cover background image keeps its `sizes` value
	 * after WordPress filters the content.
	 *
	 * @covers ::gutenberg_block_core_cover_remove_background_image_auto_sizes
	 */
	public function test_lazy_background_image_keeps_sizes_after_content_filtering() {
		$image = sprintf(
			'<img loading="lazy" width="640" height="480" class="wp-block-cover__image-background wp-image-%1$d" alt="" src="%2$s" sizes="max(100vw, 533.33px)"/>',
			self::$attachment_id,
			wp_get_attachment_image_url( self::$attachment_id, 'full' )
		);

		$processor = new WP_HTML_Tag_Processor( wp_filter_content_tags( $image ) );
		$processor->next_tag( 'IMG' );

		$this->assertSame( 'max(100vw, 533.33px)', $processor->get_attribute( 'sizes' ) );
		$this->assertNotEmpty( $processor->get_attribute( 'srcset' ), 'WordPress should still add the srcset.' );
	}
}
