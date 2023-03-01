<?php
/**
 * Tests Fallback Behavior for Navigation block
 *
 * @package WordPress
 */

class Tests_Block_Navigation_Fallbacks extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

	public static function wpSetUpBeforeClass() {

	}

	public static function wpTearDownAfterClass() {

	}

	public function test_creates_fallback_with_page_list_by_default() {
		$fallback = gutenberg_block_core_navigation_create_fallback();

		$this->assertEquals( $fallback->post_type, 'wp_navigation' );
		$this->assertEquals( $fallback->post_title, 'Navigation' );
		$this->assertEquals( $fallback->post_content, '<!-- wp:page-list /-->' );
		$this->assertEquals( $fallback->post_status, 'publish' );
	}

	public function test_skip_if_filter_returns_truthy() {
		add_filter( 'block_core_navigation_skip_fallback', '__return_true' );

		$actual = gutenberg_block_core_navigation_create_fallback();

		$this->assertEquals( $actual, null );

		remove_filter( 'block_core_navigation_skip_fallback', '__return_true' );
	}
}


