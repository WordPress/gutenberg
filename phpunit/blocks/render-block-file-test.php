<?php
/**
 * File block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the File block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_File extends WP_UnitTestCase {

	/**
	 * @covers ::render_block_core_file
	 */
	public function test_render_block_core_file() {
		$attributes = array(
			'href'               => 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf',
			'fileId'             => 'wp-block-file--media-_clientId_0',
			'textLinkHref'       => 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf',
			'showDownloadButton' => true,
			'displayPreview'     => true,
			'previewHeight'      => 370,
		);
		$content    = '<div class="wp-block-file"><object class="wp-block-file__embed" data="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf" type="application/pdf" style="width:100%;height:370px" aria-label="yolo"></object><a id="wp-block-file--media-_clientId_0" href="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf">yolo</a><a href="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf" class="wp-block-file__button wp-element-button" download aria-describedby="wp-block-file--media-_clientId_0">Download</a></div>';

		$parsed_blocks = parse_blocks(
			'<!-- wp:file {"href":"http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf","displayPreview":true} -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$new_content = gutenberg_render_block_core_file( $attributes, $content, $block );
		$this->assertStringContainsString( 'aria-label="Embed of yolo."', $new_content );
	}

	/**
	 * @covers ::render_block_core_file
	 */
	public function test_render_block_core_file_custom_filename() {
		$attributes = array(
			'href'               => 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf',
			'fileId'             => 'wp-block-file--media-_clientId_0',
			'textLinkHref'       => 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf',
			'showDownloadButton' => true,
			'displayPreview'     => true,
			'previewHeight'      => 370,
		);
		$content    = '<div class="wp-block-file"><object class="wp-block-file__embed" data="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf" type="application/pdf" style="width:100%;height:370px" aria-label="custom filename"></object><a id="wp-block-file--media-_clientId_0" href="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf">custom filename</a><a href="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf" class="wp-block-file__button wp-element-button" download aria-describedby="wp-block-file--media-_clientId_0">Download</a></div>';

		$parsed_blocks = parse_blocks(
			'<!-- wp:file {"href":"http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf","displayPreview":true} -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$new_content = gutenberg_render_block_core_file( $attributes, $content, $block );
		$this->assertStringContainsString( 'aria-label="Embed of custom filename."', $new_content );
	}

	/**
	 * @covers ::render_block_core_file
	 */
	public function test_render_block_core_file_empty_filename() {
		$attributes = array(
			'href'               => 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf',
			'fileId'             => 'wp-block-file--media-_clientId_0',
			'textLinkHref'       => 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf',
			'showDownloadButton' => true,
			'displayPreview'     => true,
			'previewHeight'      => 370,
		);
		$content    = '<div class="wp-block-file"><object class="wp-block-file__embed" data="' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf" type="application/pdf" style="width:100%;height:370px" aria-label="PDF embed"></object><a id="wp-block-file--media-_clientId_0" href="http://' . WP_TESTS_DOMAIN . 'wp-content/uploads/2021/04/yolo.pdf">yolo</a><a href="http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf" class="wp-block-file__button wp-element-button" download aria-describedby="wp-block-file--media-_clientId_0">Download</a></div>';

		$parsed_blocks = parse_blocks(
			'<!-- wp:file {"href":"http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/2021/04/yolo.pdf","displayPreview":true} -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$block         = new WP_Block( $parsed_block );

		$new_content = gutenberg_render_block_core_file( $attributes, $content, $block );
		$this->assertStringContainsString( 'aria-label="PDF embed"', $new_content );
	}
}
