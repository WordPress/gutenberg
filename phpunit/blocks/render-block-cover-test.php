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
	 * Tests that border classes are added to the wrapper when a border and a
	 * border radius are set, so the cover only clips its content when it has to.
	 *
	 * @dataProvider data_border_classes
	 *
	 * @covers ::gutenberg_render_block_core_cover
	 *
	 * @param array $attributes        Block attributes.
	 * @param bool  $has_border        Whether the `has-border` class is expected.
	 * @param bool  $has_border_radius Whether the `has-border-radius` class is expected.
	 */
	public function test_gutenberg_render_block_core_cover_border_classes( $attributes, $has_border, $has_border_radius ) {
		$attributes = array_merge(
			array(
				'backgroundType'   => 'image',
				'useFeaturedImage' => false,
			),
			$attributes
		);
		$content    = '<div class="wp-block-cover"><span class="wp-block-cover__background"></span><div class="wp-block-cover__inner-container"></div></div>';
		$rendered   = gutenberg_render_block_core_cover( $attributes, $content );

		$processor = new WP_HTML_Tag_Processor( $rendered );
		$processor->next_tag();

		$this->assertTrue( $processor->has_class( 'wp-block-cover' ), 'The wrapper should keep its block class.' );
		$this->assertSame( $has_border, $processor->has_class( 'has-border' ), 'Unexpected has-border class.' );
		$this->assertSame( $has_border_radius, $processor->has_class( 'has-border-radius' ), 'Unexpected has-border-radius class.' );

		$processor->next_tag();
		$this->assertFalse( $processor->has_class( 'has-border' ), 'Only the wrapper should get the border classes.' );
	}

	/**
	 * Data provider for test_gutenberg_render_block_core_cover_border_classes().
	 *
	 * @return array
	 */
	public function data_border_classes() {
		return array(
			'no border'                    => array( array(), false, false ),
			'unified width and radius'     => array(
				array(
					'style' => array(
						'border' => array(
							'width'  => '4px',
							'radius' => '20px',
						),
					),
				),
				true,
				true,
			),
			'per-side width, corner radii' => array(
				array(
					'style' => array(
						'border' => array(
							'top'    => array( 'width' => '4px' ),
							'radius' => array( 'topLeft' => '20px' ),
						),
					),
				),
				true,
				true,
			),
			'color only, no radius'        => array(
				array( 'style' => array( 'border' => array( 'color' => '#000' ) ) ),
				true,
				false,
			),
			'preset color only'            => array(
				array( 'borderColor' => 'contrast' ),
				true,
				false,
			),
			'radius only'                  => array(
				array( 'style' => array( 'border' => array( 'radius' => '20px' ) ) ),
				false,
				true,
			),
			'empty corner radii'           => array(
				array(
					'style' => array(
						'border' => array(
							'radius' => array( 'topLeft' => '' ),
						),
					),
				),
				false,
				false,
			),
			'malformed border value'       => array(
				array( 'style' => array( 'border' => 'solid' ) ),
				false,
				false,
			),
		);
	}
}
