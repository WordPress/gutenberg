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

	/**
	 * @covers ::render_block_core_file
	 */
	public function test_render_block_core_file_describes_inner_download_button() {
		$content = '<div class="wp-block-file"><a id="wp-block-file--media-_clientId_0" href="http://' . WP_TESTS_DOMAIN . '/yolo.zip">yolo</a><div class="wp-block-buttons"><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="http://' . WP_TESTS_DOMAIN . '/yolo.zip" download>Download</a></div></div></div>';

		$new_content = gutenberg_render_block_core_file( array(), $content );

		$processor = new WP_HTML_Tag_Processor( $new_content );
		$processor->next_tag( array( 'class_name' => 'wp-block-button__link' ) );
		$this->assertSame( 'wp-block-file--media-_clientId_0', $processor->get_attribute( 'aria-describedby' ) );
	}

	/**
	 * @covers ::render_block_core_file
	 */
	public function test_render_block_core_file_inner_download_button_without_filename() {
		$content = '<div class="wp-block-file"><div class="wp-block-buttons"><div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="http://' . WP_TESTS_DOMAIN . '/yolo.zip" download>Download</a></div></div></div>';

		$this->assertSame( $content, gutenberg_render_block_core_file( array(), $content ) );
	}

	/**
	 * @covers ::render_block_core_file
	 */
	public function test_render_block_core_file_keeps_legacy_download_button() {
		$content = '<div class="wp-block-file"><a id="wp-block-file--media-_clientId_0" href="http://' . WP_TESTS_DOMAIN . '/yolo.zip">yolo</a><a href="http://' . WP_TESTS_DOMAIN . '/yolo.zip" class="wp-block-file__button wp-element-button" download aria-describedby="wp-block-file--media-_clientId_0">Download</a></div>';

		$this->assertSame( $content, gutenberg_render_block_core_file( array(), $content ) );
	}
}
