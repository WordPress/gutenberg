<?php
/**
 * Files block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Files block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Files extends WP_UnitTestCase {

	/**
	 * @covers ::render_block_core_files
	 */
	public function test_render_block_core_files_marks_the_files_as_a_list() {
		$content = '<div class="wp-block-files"><div class="wp-block-file"><a href="https://example.com/report.pdf">report</a><a href="https://example.com/report.pdf" class="wp-block-file__button wp-element-button" download>Download</a></div><div class="wp-block-file"><a href="https://example.com/notes.txt">notes</a></div></div>';

		$processor = new WP_HTML_Tag_Processor( gutenberg_render_block_core_files( array(), $content ) );

		$processor->next_tag();
		$this->assertSame( 'list', $processor->get_attribute( 'role' ), 'The Files block should be a list.' );

		$roles = array();
		while ( $processor->next_tag( array( 'class_name' => 'wp-block-file' ) ) ) {
			$roles[] = $processor->get_attribute( 'role' );
		}
		$this->assertSame( array( 'listitem', 'listitem' ), $roles, 'Each File block should be a list item.' );
	}

	/**
	 * @covers ::render_block_core_files
	 */
	public function test_render_block_core_files_leaves_the_download_button_alone() {
		$content = '<div class="wp-block-files"><div class="wp-block-file"><a href="https://example.com/report.pdf">report</a><a href="https://example.com/report.pdf" class="wp-block-file__button wp-element-button" download>Download</a></div></div>';

		$processor = new WP_HTML_Tag_Processor( gutenberg_render_block_core_files( array(), $content ) );

		$this->assertTrue( $processor->next_tag( array( 'class_name' => 'wp-block-file__button' ) ) );
		$this->assertNull( $processor->get_attribute( 'role' ) );
	}

	/**
	 * @covers ::render_block_core_files
	 */
	public function test_render_block_core_files_without_files_is_not_a_list() {
		$content = '<div class="wp-block-files"></div>';

		$this->assertSame( $content, gutenberg_render_block_core_files( array(), $content ) );
	}
}
