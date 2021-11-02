<?php
/**
 * This class is supposed to test the functionality of the navigation.php
 *
 * @package Gutenberg
 */

class WP_Navigation_Test extends WP_UnitTestCase {
	public function test_it_doesnt_disable_block_editor_for_non_navigation_post_types() {
		$filtered_result = gutenberg_disable_block_editor_for_navigation_post_type(true, 'sample_post_type');
		$this->assertTrue($filtered_result);
	}

	public function test_it_disables_block_editor_for_navigation_post_types() {
		$filtered_result = gutenberg_disable_block_editor_for_navigation_post_type(true, 'wp_navigation');
		$this->assertFalse($filtered_result);
	}

	public function test_it_doesnt_disable_edit_links_for_non_navigation_post_types() {
		$post = $this->create_sample_post();
		$url = 'someUrl';
		$filtered_url = gutenberg_disable_edit_links_for_navigation_post_type($url, $post);
		$this->assertSame($url, $filtered_url);
	}

	public function test_it_disables_edit_links_for_navigation_post_types() {
		$post = $this->create_navigation_post();
		$url = 'someUrl';
		$filtered_url = gutenberg_disable_edit_links_for_navigation_post_type($url, $post);
		$this->assertNotSame($url, $filtered_url);
		$this->assertNotEmpty($filtered_url);
		$this->assertIsString($filtered_url);
	}

	public function test_it_doesnt_remove_edit_row_action_for_non_navigation_post_types() {
		$actions = [
			'edit' => 1,
		];

		$post = $this->create_sample_post();
		$filtered_actions = gutenberg_disable_edit_row_action_for_navigation_post_type( $actions, $post );
		$this->assertSame( $actions, $filtered_actions );
	}

	public function test_it_removes_edit_row_action_for_navigation_post_types() {
		$actions = [
			'edit' => 1,
		];

		$post = $this->create_navigation_post();
		$filtered_actions = gutenberg_disable_edit_row_action_for_navigation_post_type( $actions, $post );
		$this->assertSame( array(), $filtered_actions );
	}

	private function create_post($type)
	{
		$post = new WP_Post(new StdClass());
		$post->post_type = $type;
		$post->filter = 'raw';
		return $post;
	}

	private function create_sample_post()
	{
		return $this->create_post('sample_post_type');
	}

	private function create_navigation_post()
	{
		return $this->create_post('wp_navigation');
	}
}
