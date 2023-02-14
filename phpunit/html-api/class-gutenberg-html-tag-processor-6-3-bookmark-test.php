<?php
/**
 * Unit tests covering Gutenberg_HTML_Tag_Processor_6_3 functionality.
 *
 * @package WordPress
 * @subpackage HTML
 */

require_once __DIR__ . '/../../lib/compat/wordpress-6.3/html-api/class-gutenberg-html-tag-processor-6-3.php';

/**
 * @group html-api
 *
 * @coversDefaultClass Gutenberg_HTML_Tag_Processor_6_3
 */
class Gutenberg_HTML_Tag_Processor_6_3_Bookmark_Test extends WP_UnitTestCase {
	/**
	 * @covers has_bookmark
	 */
	public function test_has_bookmark_returns_false_if_bookmark_does_not_exist() {
		$p = new Gutenberg_HTML_Tag_Processor_6_3( '<div>Test</div>' );
		$this->assertFalse( $p->has_bookmark( 'my-bookmark' ) );
	}

	/**
	 * @covers has_bookmark
	 */
	public function test_has_bookmark_returns_true_if_bookmark_exists() {
		$p = new Gutenberg_HTML_Tag_Processor_6_3( '<div>Test</div>' );
		$p->next_tag();
		$p->set_bookmark( 'my-bookmark' );
		$this->assertTrue( $p->has_bookmark( 'my-bookmark' ) );
	}

	/**
	 * @covers has_bookmark
	 */
	public function test_has_bookmark_returns_false_if_bookmark_has_been_released() {
		$p = new Gutenberg_HTML_Tag_Processor_6_3( '<div>Test</div>' );
		$p->next_tag();
		$p->set_bookmark( 'my-bookmark' );
		$p->release_bookmark( 'my-bookmark' );
		$this->assertFalse( $p->has_bookmark( 'my-bookmark' ) );
	}
}
