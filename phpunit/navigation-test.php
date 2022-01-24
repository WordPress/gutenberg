<?php
/**
 * This class tests the functionality of block navigation
 *
 * @package Gutenberg
 */

class WP_Navigation_Test extends WP_UnitTestCase {
	const NAVIGATION_POST_TYPE     = 'wp_navigation';
	const NON_NAVIGATION_POST_TYPE = 'wp_non_navigation';

	public function setUp() {
		$this->enable_editor_support();
	}

	public function tearDown() {
		$this->enable_editor_support();
	}

	public function test_it_doesnt_disable_block_editor_for_non_navigation_post_types() {
		$filtered_result = gutenberg_disable_block_editor_for_navigation_post_type( true, static::NON_NAVIGATION_POST_TYPE );
		$this->assertTrue( $filtered_result );
	}

	public function test_it_disables_block_editor_for_navigation_post_types() {
		$filtered_result = gutenberg_disable_block_editor_for_navigation_post_type( true, static::NAVIGATION_POST_TYPE );
		$this->assertFalse( $filtered_result );
	}

	public function test_it_doesnt_disable_content_editor_for_non_navigation_type_posts() {
		$post = $this->create_non_navigation_post();
		$this->assertTrue( $this->supports_block_editor() );

		gutenberg_disable_content_editor_for_navigation_post_type( $post );

		$this->assertTrue( $this->supports_block_editor() );
	}

	public function test_it_disables_content_editor_for_navigation_type_posts() {
		$post = $this->create_navigation_post();
		$this->assertTrue( $this->supports_block_editor() );

		gutenberg_disable_content_editor_for_navigation_post_type( $post );

		$this->assertFalse( $this->supports_block_editor() );
	}

	public function test_it_enables_content_editor_for_non_navigation_type_posts_after_the_content_editor_form() {
		$this->disable_editor_support();
		$post = $this->create_navigation_post();
		$this->assertFalse( $this->supports_block_editor() );

		gutenberg_enable_content_editor_for_navigation_post_type( $post );

		$this->assertTrue( $this->supports_block_editor() );
	}

	public function test_it_doesnt_enable_content_editor_for_non_navigation_type_posts_after_the_content_editor_form() {
		$this->disable_editor_support();
		$post = $this->create_non_navigation_post();
		$this->assertFalse( $this->supports_block_editor() );

		gutenberg_enable_content_editor_for_navigation_post_type( $post );

		$this->assertFalse( $this->supports_block_editor() );
	}

	private function create_post( $type ) {
		$post            = new WP_Post( new StdClass() );
		$post->post_type = $type;
		$post->filter    = 'raw';
		return $post;
	}

	private function create_non_navigation_post() {
		return $this->create_post( static::NON_NAVIGATION_POST_TYPE );
	}

	private function create_navigation_post() {
		return $this->create_post( static::NAVIGATION_POST_TYPE );
	}

	private function supports_block_editor() {
		return post_type_supports( static::NAVIGATION_POST_TYPE, 'editor' );
	}

	private function enable_editor_support() {
		add_post_type_support( static::NAVIGATION_POST_TYPE, 'editor' );
	}

	private function disable_editor_support() {
		remove_post_type_support( static::NAVIGATION_POST_TYPE, 'editor' );
	}
}
