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
class Tests_Blocks_Render_Post_Featured_Image extends WP_UnitTestCase {

	/**
	 * Post with a featured image.
	 *
	 * @var int
	 */
	private static $post_id;

	/**
	 * Featured image attachment.
	 *
	 * @var int
	 */
	private static $attachment_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$post_id       = $factory->post->create();
		self::$attachment_id = $factory->attachment->create_upload_object(
			DIR_TESTDATA . '/images/canola.jpg',
			self::$post_id,
			array(
				'post_mime_type' => 'image/jpeg',
			)
		);
		set_post_thumbnail( self::$post_id, self::$attachment_id );
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$attachment_id, true );
	}

	public function test_image_and_overlay_border_styles() {
		$block = new WP_Block(
			array(
				'blockName' => 'core/post-featured-image',
				'attrs'     => array(
					'dimRatio'    => 50,
					'borderColor' => 'accent-2',
					'style'       => array(
						'border' => array(
							'radius' => 5,
							'top'    => array(
								'style' => 'dashed',
								'width' => '3px',
							),
						),
						'shadow' => '10px 10px 5px #000000',
					),
				),
			),
			array( 'postId' => self::$post_id )
		);

		$processor = new WP_HTML_Tag_Processor( $block->render() );
		$this->assertTrue( $processor->next_tag( 'img' ) );
		$image = array(
			'class' => $processor->get_attribute( 'class' ),
			'style' => $processor->get_attribute( 'style' ),
		);
		$this->assertTrue( $processor->next_tag( 'span' ) );
		$overlay = array(
			'class' => $processor->get_attribute( 'class' ),
			'style' => $processor->get_attribute( 'style' ),
		);

		$this->assertSame(
			array(
				'class' => 'has-border-color has-accent-2-border-color wp-post-image',
				'style' => 'border-radius:5px;border-top-width:3px;border-top-style:dashed;object-fit:cover;box-shadow:10px 10px 5px #000000;',
			),
			$image
		);
		$this->assertSame(
			array(
				'class' => 'wp-block-post-featured-image__overlay has-border-color has-accent-2-border-color has-background-dim has-background-dim-50',
				'style' => 'border-radius:5px;border-top-width:3px;border-top-style:dashed',
			),
			$overlay
		);
	}
}
