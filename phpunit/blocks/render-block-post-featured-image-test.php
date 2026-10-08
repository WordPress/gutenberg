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

	/**
	 * Renders a Post Featured Image block with an overlay and returns the
	 * class and style of the image and the overlay span.
	 *
	 * @param array $attributes Block attributes.
	 * @return array Image and overlay class and style attributes.
	 */
	private function render_element_attributes( $attributes ) {
		$block = new WP_Block(
			array(
				'blockName' => 'core/post-featured-image',
				'attrs'     => array_merge( array( 'dimRatio' => 50 ), $attributes ),
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

		return array(
			'image'   => $image,
			'overlay' => $overlay,
		);
	}

	/**
	 * @dataProvider data_border_styles
	 *
	 * @param array $attributes Block attributes.
	 * @param array $expected   Expected image and overlay class and style.
	 */
	public function test_image_and_overlay_border_styles( $attributes, $expected ) {
		$this->assertSame( $expected, $this->render_element_attributes( $attributes ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_border_styles() {
		return array(
			'custom'   => array(
				'attributes' => array(
					'style' => array(
						'border' => array(
							'radius' => '10px',
							'width'  => '2px',
							'style'  => 'solid',
							'color'  => '#ff0000',
						),
					),
				),
				'expected'   => array(
					'image'   => array(
						'class' => 'has-border-color wp-post-image',
						'style' => 'border-color:#ff0000;border-radius:10px;border-style:solid;border-width:2px;object-fit:cover;',
					),
					'overlay' => array(
						'class' => 'wp-block-post-featured-image__overlay has-border-color has-background-dim has-background-dim-50',
						'style' => 'border-color:#ff0000;border-radius:10px;border-style:solid;border-width:2px',
					),
				),
			),
			'preset'   => array(
				'attributes' => array(
					'borderColor' => 'accent-2',
					'style'       => array(
						'border' => array(
							'width' => '1px',
							'style' => 'solid',
						),
					),
				),
				'expected'   => array(
					'image'   => array(
						'class' => 'has-border-color has-accent-2-border-color wp-post-image',
						'style' => 'border-style:solid;border-width:1px;object-fit:cover;',
					),
					'overlay' => array(
						'class' => 'wp-block-post-featured-image__overlay has-border-color has-accent-2-border-color has-background-dim has-background-dim-50',
						'style' => 'border-style:solid;border-width:1px',
					),
				),
			),
			'per side' => array(
				'attributes' => array(
					'style' => array(
						'border' => array(
							'top'  => array(
								'color' => '#00ff00',
								'style' => 'dashed',
								'width' => '3px',
							),
							'left' => array(
								'width' => '1px',
							),
						),
					),
				),
				'expected'   => array(
					'image'   => array(
						'class' => 'attachment-post-thumbnail size-post-thumbnail wp-post-image',
						'style' => 'border-top-width:3px;border-top-color:#00ff00;border-top-style:dashed;border-left-width:1px;object-fit:cover;',
					),
					'overlay' => array(
						'class' => 'wp-block-post-featured-image__overlay has-background-dim has-background-dim-50',
						'style' => 'border-top-width:3px;border-top-color:#00ff00;border-top-style:dashed;border-left-width:1px',
					),
				),
			),
			'numeric'  => array(
				'attributes' => array(
					'style' => array(
						'border' => array(
							'radius' => 5,
							'width'  => 2,
						),
					),
				),
				'expected'   => array(
					'image'   => array(
						'class' => 'attachment-post-thumbnail size-post-thumbnail wp-post-image',
						'style' => 'border-radius:5px;border-width:2px;object-fit:cover;',
					),
					'overlay' => array(
						'class' => 'wp-block-post-featured-image__overlay has-background-dim has-background-dim-50',
						'style' => 'border-radius:5px;border-width:2px',
					),
				),
			),
			'zero'     => array(
				'attributes' => array(
					'style' => array(
						'border' => array(
							'radius' => 0,
							'width'  => 0,
							'style'  => 'solid',
						),
					),
				),
				'expected'   => array(
					'image'   => array(
						'class' => 'attachment-post-thumbnail size-post-thumbnail wp-post-image',
						'style' => 'border-radius:0px;border-style:solid;border-width:0px;object-fit:cover;',
					),
					'overlay' => array(
						'class' => 'wp-block-post-featured-image__overlay has-background-dim has-background-dim-50',
						'style' => 'border-radius:0px;border-style:solid;border-width:0px',
					),
				),
			),
			'shadow'   => array(
				'attributes' => array(
					'style' => array(
						'border' => array(
							'radius' => '10px',
							'color'  => '#ff0000',
						),
						'shadow' => '10px 10px 5px #000000',
					),
				),
				'expected'   => array(
					'image'   => array(
						'class' => 'has-border-color wp-post-image',
						'style' => 'border-color:#ff0000;border-radius:10px;object-fit:cover;box-shadow:10px 10px 5px #000000;',
					),
					'overlay' => array(
						'class' => 'wp-block-post-featured-image__overlay has-border-color has-background-dim has-background-dim-50',
						'style' => 'border-color:#ff0000;border-radius:10px',
					),
				),
			),
		);
	}
}
