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

	/**
	 * Ensures `$`/`\` sequences in image attributes (e.g. a price in the alt
	 * text, or a filename containing `$1`) are not interpreted as regular
	 * expression backreferences when the lightbox trigger button is injected.
	 *
	 * The lightbox button is added by the `render_block_core/image` filter, so
	 * the block must be rendered through `WP_Block::render()` for the filter to
	 * run — calling the render callback directly does not exercise this path.
	 *
	 * @covers ::block_core_image_render_lightbox
	 */
	public function test_should_not_treat_dollar_sequences_in_img_as_backreferences_in_lightbox() {
		$content = '<figure class="wp-block-image"><img src="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/price-$1-canola.jpg" alt="Only $1 today"/></figure>';

		$parsed_blocks = parse_blocks( '<!-- wp:image {"lightbox":{"enabled":true}} -->' . $content . '<!-- /wp:image -->' );
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$rendered_block = $block->render();

		// The lightbox trigger button should have been injected.
		$this->assertStringContainsString(
			'class="lightbox-trigger"',
			$rendered_block,
			'The lightbox trigger button was not injected, so the regression path was not exercised.'
		);

		// The `$1` sequences must survive unchanged in both alt and src.
		$this->assertStringContainsString(
			'alt="Only $1 today"',
			$rendered_block,
			'The alt text containing "$1" was corrupted by backreference interpretation.'
		);
		$this->assertStringContainsString(
			'price-$1-canola.jpg',
			$rendered_block,
			'The src filename containing "$1" was corrupted by backreference interpretation.'
		);

		remove_all_filters( 'render_block_core/image' );
	}
	/**
	 * @ticket 65960
	 *
	 * @covers ::render_block_core_image
	 */
	public function test_should_replace_stale_backed_up_intermediate_image_src() {
		$attachment_id = self::factory()->post->create(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'image/jpeg',
			)
		);

		update_post_meta(
			$attachment_id,
			'_wp_attached_file',
			'2026/09/canola-e1234567890123.jpg'
		);

		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'file'   => '2026/09/canola-e1234567890123.jpg',
				'width'  => 1200,
				'height' => 900,
				'sizes'  => array(
					'medium' => array(
						'file'      => 'canola-e1234567890123-300x225.jpg',
						'width'     => 300,
						'height'    => 225,
						'mime-type' => 'image/jpeg',
					),
				),
			)
		);

		update_post_meta(
			$attachment_id,
			'_wp_attachment_backup_sizes',
			array(
				'medium-orig' => array(
					'file'      => 'canola-300x225.jpg',
					'width'     => 300,
					'height'    => 225,
					'mime-type' => 'image/jpeg',
				),
			)
		);

		$current_image = wp_get_attachment_image_src( $attachment_id, 'medium' );
		$this->assertIsArray( $current_image );

		$attachment_url = wp_get_attachment_url( $attachment_id );
		$this->assertIsString( $attachment_url );

		$stale_src =
		trailingslashit( dirname( $attachment_url ) ) .
		'canola-300x225.jpg';

		$attributes = array(
			'id'       => $attachment_id,
			'sizeSlug' => 'medium',
		);

		$content =
		'<figure class="wp-block-image size-medium">' .
		'<img src="' . esc_url( $stale_src ) . '" class="wp-image-' . $attachment_id . '"/>' .
		'</figure>';

		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);

		$parsed_block = $parsed_blocks[0];
		$block        = new WP_Block( $parsed_block );

		$rendered_block =
		gutenberg_render_block_core_image(
			$attributes,
			$content,
			$block
		);

		$processor = new WP_HTML_Tag_Processor( $rendered_block );

		$this->assertTrue( $processor->next_tag( 'img' ) );

		$this->assertSame(
			$current_image[0],
			$processor->get_attribute( 'src' )
		);
	}

	/**
	 * @ticket 65960
	 *
	 * @covers ::render_block_core_image
	 */
	public function test_should_not_replace_unrelated_image_src() {
		$attachment_id = self::factory()->post->create(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'image/jpeg',
			)
		);

		update_post_meta(
			$attachment_id,
			'_wp_attached_file',
			'2026/09/canola-e1234567890123.jpg'
		);

		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'file'   => '2026/09/canola-e1234567890123.jpg',
				'width'  => 1200,
				'height' => 900,
				'sizes'  => array(
					'medium' => array(
						'file'      => 'canola-e1234567890123-300x225.jpg',
						'width'     => 300,
						'height'    => 225,
						'mime-type' => 'image/jpeg',
					),
				),
			)
		);

		update_post_meta(
			$attachment_id,
			'_wp_attachment_backup_sizes',
			array(
				'medium-orig' => array(
					'file'      => 'canola-300x225.jpg',
					'width'     => 300,
					'height'    => 225,
					'mime-type' => 'image/jpeg',
				),
			)
		);

		$custom_src =
		'https://example.org/custom-image.jpg';

		$attributes = array(
			'id'       => $attachment_id,
			'sizeSlug' => 'medium',
		);

		$content =
		'<figure class="wp-block-image size-medium">' .
		'<img src="' . esc_url( $custom_src ) . '" class="wp-image-' . $attachment_id . '"/>' .
		'</figure>';

		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);

		$parsed_block = $parsed_blocks[0];
		$block        = new WP_Block( $parsed_block );

		$rendered_block =
		gutenberg_render_block_core_image(
			$attributes,
			$content,
			$block
		);

		$processor = new WP_HTML_Tag_Processor( $rendered_block );

		$this->assertTrue( $processor->next_tag( 'img' ) );

		$this->assertSame(
			$custom_src,
			$processor->get_attribute( 'src' )
		);
	}

	/**
	 * @ticket 65960
	 *
	 * @covers ::render_block_core_image
	 */
	public function test_should_replace_stale_numeric_backed_up_intermediate_image_src() {
		$attachment_id = self::factory()->post->create(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'image/jpeg',
			)
		);

		update_post_meta(
			$attachment_id,
			'_wp_attached_file',
			'2026/09/canola-e1234567890123.jpg'
		);

		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'file'   => '2026/09/canola-e1234567890123.jpg',
				'width'  => 1200,
				'height' => 900,
				'sizes'  => array(
					'medium' => array(
						'file'      => 'canola-e1234567890123-300x225.jpg',
						'width'     => 300,
						'height'    => 225,
						'mime-type' => 'image/jpeg',
					),
				),
			)
		);

		update_post_meta(
			$attachment_id,
			'_wp_attachment_backup_sizes',
			array(
				'medium-1720000000123' => array(
					'file'      => 'canola-pre-edit-300x225.jpg',
					'width'     => 300,
					'height'    => 225,
					'mime-type' => 'image/jpeg',
				),
			)
		);

		$current_image = wp_get_attachment_image_src( $attachment_id, 'medium' );
		$this->assertIsArray( $current_image );

		$attachment_url = wp_get_attachment_url( $attachment_id );
		$this->assertIsString( $attachment_url );

		$stale_src =
			trailingslashit( dirname( $attachment_url ) ) .
			'canola-pre-edit-300x225.jpg';

		$attributes = array(
			'id'       => $attachment_id,
			'sizeSlug' => 'medium',
		);

		$content =
			'<figure class="wp-block-image size-medium">' .
			'<img src="' . esc_url( $stale_src ) . '" class="wp-image-' . $attachment_id . '"/>' .
			'</figure>';

		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);

		$parsed_block = $parsed_blocks[0];
		$block        = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image(
			$attributes,
			$content,
			$block
		);

		$processor = new WP_HTML_Tag_Processor( $rendered_block );

		$this->assertTrue( $processor->next_tag( 'img' ) );

		$this->assertSame(
			$current_image[0],
			$processor->get_attribute( 'src' )
		);
	}

	/**
	 * @ticket 65960
	 *
	 * @covers ::render_block_core_image
	 */
	public function test_should_not_replace_prefix_colliding_different_image_size_backup() {
		$attachment_id = self::factory()->post->create(
			array(
				'post_type'      => 'attachment',
				'post_mime_type' => 'image/jpeg',
			)
		);

		update_post_meta(
			$attachment_id,
			'_wp_attached_file',
			'2026/09/canola-e1234567890123.jpg'
		);

		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'file'   => '2026/09/canola-e1234567890123.jpg',
				'width'  => 1200,
				'height' => 900,
				'sizes'  => array(
					'medium' => array(
						'file'      => 'canola-e1234567890123-300x225.jpg',
						'width'     => 300,
						'height'    => 225,
						'mime-type' => 'image/jpeg',
					),
				),
			)
		);

		update_post_meta(
			$attachment_id,
			'_wp_attachment_backup_sizes',
			array(
				'medium-custom-orig' => array(
					'file'      => 'canola-custom-300x225.jpg',
					'width'     => 300,
					'height'    => 225,
					'mime-type' => 'image/jpeg',
				),
			)
		);

		$current_image = wp_get_attachment_image_src( $attachment_id, 'medium' );
		$this->assertIsArray( $current_image );

		$attachment_url = wp_get_attachment_url( $attachment_id );
		$this->assertIsString( $attachment_url );

		$stale_src =
			trailingslashit( dirname( $attachment_url ) ) .
			'canola-custom-300x225.jpg';

		$this->assertNotSame( $current_image[0], $stale_src );

		$attributes = array(
			'id'       => $attachment_id,
			'sizeSlug' => 'medium',
		);

		$content =
			'<figure class="wp-block-image size-medium">' .
			'<img src="' . esc_url( $stale_src ) . '" class="wp-image-' . $attachment_id . '"/>' .
			'</figure>';

		$parsed_blocks = parse_blocks(
			'<!-- wp:image -->'
		);

		$parsed_block = $parsed_blocks[0];
		$block        = new WP_Block( $parsed_block );

		$rendered_block = gutenberg_render_block_core_image(
			$attributes,
			$content,
			$block
		);

		$processor = new WP_HTML_Tag_Processor( $rendered_block );

		$this->assertTrue( $processor->next_tag( 'img' ) );

		$this->assertSame(
			$stale_src,
			$processor->get_attribute( 'src' )
		);
	}
}
