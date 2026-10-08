<?php
/**
 * Post Featured Image block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Post Featured Image block.
 *
 * @group blocks
 *
 * @covers ::gutenberg_render_block_core_post_featured_image
 */
class Render_Block_Post_Featured_Image_Test extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static $post_id;

	/**
	 * @var int
	 */
	private static $attachment_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$post_id       = $factory->post->create();
		self::$attachment_id = $factory->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg', self::$post_id );
		set_post_thumbnail( self::$post_id, self::$attachment_id );
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$attachment_id, true );
	}

	/**
	 * Renders a Post Featured Image block and returns the class and style
	 * attributes of the image and the overlay.
	 *
	 * @param array $attributes Block attributes.
	 * @return array Class and style of the image and the overlay.
	 */
	private function render_attributes( $attributes ) {
		$block = new WP_Block(
			array(
				'blockName' => 'core/post-featured-image',
				'attrs'     => $attributes,
			),
			array( 'postId' => self::$post_id )
		);

		$processor = new WP_HTML_Tag_Processor( $block->render() );
		$this->assertTrue( $processor->next_tag( 'img' ) );
		$actual = array(
			'image_class' => $processor->get_attribute( 'class' ),
			'image_style' => $processor->get_attribute( 'style' ),
		);
		if ( $processor->next_tag( 'span' ) ) {
			$actual['overlay_class'] = $processor->get_attribute( 'class' );
			$actual['overlay_style'] = $processor->get_attribute( 'style' );
		}

		return $actual;
	}

	public function test_shadow_is_applied_to_the_image() {
		$actual = $this->render_attributes(
			array( 'style' => array( 'shadow' => 'var:preset|shadow|natural' ) )
		);

		$this->assertSame( 'object-fit:cover;box-shadow:var(--wp--preset--shadow--natural);', $actual['image_style'] );
	}

	public function test_shadow_follows_border_and_dimensions_on_the_image() {
		$actual = $this->render_attributes(
			array(
				'dimRatio' => 50,
				'style'    => array(
					'border' => array(
						'radius' => '10px',
						'color'  => '#ff0000',
					),
					'shadow' => '1px 1px 1px #000',
				),
			)
		);

		$this->assertSame( 'has-border-color wp-post-image', $actual['image_class'] );
		$this->assertSame( 'border-color:#ff0000;border-radius:10px;object-fit:cover;box-shadow:1px 1px 1px #000;', $actual['image_style'] );
		$this->assertSame( 'wp-block-post-featured-image__overlay has-border-color has-background-dim has-background-dim-50', $actual['overlay_class'] );
		$this->assertSame( 'border-color:#ff0000;border-radius:10px', $actual['overlay_style'] );
	}

	public function test_empty_shadow_is_ignored() {
		$actual = $this->render_attributes( array( 'style' => array( 'shadow' => '' ) ) );

		$this->assertSame( 'object-fit:cover;', $actual['image_style'] );
	}
}
