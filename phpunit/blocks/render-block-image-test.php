<?php
/**
 * Image block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Image block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Image extends WP_UnitTestCase {
	public function tear_down() {
		if ( get_block_bindings_source( 'test/source' ) ) {
			unregister_block_bindings_source( 'test/source' );
		}

		parent::tear_down();
	}

	/**
	 * @covers ::render_block_core_image
	 */
	public function test_should_render_block_core_image_when_src_is_defined() {
		$attributes    = array();
		$content       = '<figure class="wp-block-image"><img src="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/canola.jpg" aria-label="test render"/></figure>';
		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image( $attributes, $content, $block );
		$this->assertStringContainsString( 'aria-label="test render"', $rendered_block );
	}

	/**
	 * @covers ::render_block_core_image
	 */
	public function test_should_not_render_block_core_image_when_src_is_not_defined() {
		$attributes    = array();
		$content       = '<figure class="wp-block-image"><img /></figure>';
		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image( $attributes, $content, $block );
		$this->assertEquals( '', $rendered_block );
	}

	/**
	 * @covers ::render_block_core_image
	 */
	public function test_should_not_render_block_core_image_when_src_is_empty_string() {
		$attributes    = array();
		$content       = '<figure class="wp-block-image"><img src=""/></figure>';
		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image( $attributes, $content, $block );
		$this->assertEquals( '', $rendered_block );
	}

	public function test_should_use_image_id_from_block_bindings_in_classname() {
		register_block_bindings_source(
			'test/source',
			array(
				'label'              => array( 'label' => 'Test Source' ),
				'get_value_callback' => function () {
					return 123;
				},
			)
		);

		$attributes    = array(
			'metadata' => array(
				'bindings' => array(
					'id' => array(
						'source' => 'test/source',
					),
				),
			),
			'id'       => 456,
		);
		$content       = '<figure class="wp-block-image"><img class="wp-image-123" src="canola.jpg"/></figure>';
		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image( $attributes, $content, $block );
		$this->assertSame( '<figure class="wp-block-image"><img class="wp-image-456" src="canola.jpg"/></figure>', $rendered_block );
	}

	public function test_should_keep_figcaption_if_it_is_not_empty() {
		$content       = '<figure class="wp-block-image"><img src="canola.jpg"/><figcaption class="wp-element-caption">Image caption</figcaption></figure>';
		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image( array(), $content, $block );
		$this->assertSame( '<figure class="wp-block-image"><img src="canola.jpg"/><figcaption class="wp-element-caption">Image caption</figcaption></figure>', $rendered_block );
	}

	public function test_should_remove_figcaption_when_caption_is_empty() {
		$attributes    = array(
			'caption' => '',
		);
		$content       = '<figure class="wp-block-image"><img src="canola.jpg"/><figcaption class="wp-element-caption"></figcaption></figure>';
		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image( $attributes, $content, $block );
		$this->assertSame( '<figure class="wp-block-image"><img src="canola.jpg"/></figure>', $rendered_block );
	}

	public function test_should_format_lightbox_exif_data_from_attachment_metadata() {
		$file          = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id = self::factory()->attachment->create_upload_object(
			$file,
			0,
			array(
				'post_mime_type' => 'image/jpeg',
			)
		);

		try {
			wp_update_attachment_metadata(
				$attachment_id,
				array(
					'width'      => 1024,
					'height'     => 768,
					'image_meta' => array(
						'camera'        => 'Nikon D70',
						'aperture'      => '2.80',
						'shutter_speed' => '0.004',
						// A long fractional focal length is rounded to one decimal.
						'focal_length'  => '57.019002375297',
						'copyright'     => 'Example Photographer',
						'keywords'      => array( 'ignored' ),
					),
				)
			);

			$get_exif = function_exists( 'gutenberg_block_core_image_get_lightbox_exif_data' )
				? 'gutenberg_block_core_image_get_lightbox_exif_data'
				: 'block_core_image_get_lightbox_exif_data';

			$this->assertTrue( function_exists( $get_exif ) );
			$this->assertSame(
				array(
					'camera'       => 'Nikon D70',
					'aperture'     => 'f/2.8',
					'shutterSpeed' => '1/250s',
					'focalLength'  => '57mm',
					'copyright'    => 'Example Photographer',
				),
				$get_exif( $attachment_id )
			);
		} finally {
			wp_delete_attachment( $attachment_id, true );
		}
	}

	public function test_should_add_exif_data_to_lightbox_interactivity_state() {
		$file          = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id = self::factory()->attachment->create_upload_object(
			$file,
			0,
			array(
				'post_mime_type' => 'image/jpeg',
			)
		);

		try {
			wp_update_attachment_metadata(
				$attachment_id,
				array(
					'width'      => 1024,
					'height'     => 768,
					'image_meta' => array(
						'camera'        => 'Nikon D70',
						'aperture'      => '2.8',
						'shutter_speed' => '0.004',
						'focal_length'  => '50',
					),
				)
			);

			$parsed_block = array(
				'blockName' => 'core/image',
				'attrs'     => array(
					'id'              => $attachment_id,
					'lightbox'        => array(
						'enabled' => true,
					),
					'linkDestination' => 'none',
				),
			);
			$block        = new WP_Block( $parsed_block );
			$content      = sprintf(
				'<figure class="wp-block-image"><img class="wp-image-%d" src="%s" alt="A camera"/></figure>',
				$attachment_id,
				esc_url( wp_get_attachment_url( $attachment_id ) )
			);

			$render_lightbox = function_exists( 'gutenberg_block_core_image_render_lightbox' )
				? 'gutenberg_block_core_image_render_lightbox'
				: 'block_core_image_render_lightbox';

			$this->assertTrue( function_exists( $render_lightbox ) );
			$rendered_block = $render_lightbox( $content, $parsed_block, $block );
			$this->assertSame( 1, preg_match( '/data-wp-key="([^"]+)"/', $rendered_block, $matches ) );

			$state = wp_interactivity_state( 'core/image' );
			$this->assertSame(
				array(
					'camera'       => 'Nikon D70',
					'aperture'     => 'f/2.8',
					'shutterSpeed' => '1/250s',
					'focalLength'  => '50mm',
				),
				$state['metadata'][ $matches[1] ]['exif']
			);
		} finally {
			wp_delete_attachment( $attachment_id, true );
		}
	}
}
