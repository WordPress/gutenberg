<?php
/**
 * Tests_Block_Template_Utils class
 *
 * @package gutenberg
 */

/**
 * Tests for the Block Templates abstraction layer.
 *
 * @group block-templates
 */
class Tests_Block_Template_Utils_6_1 extends WP_UnitTestCase {
	private static $post;

	public static function wpSetUpBeforeClass() {
		$args       = array(
			'post_type'    => 'post',
			'post_name'    => 'hello-world',
			'post_title'   => 'Hello World!',
			'post_content' => 'Welcome to WordPress. This is your first post. Edit or delete it, then start writing!',
			'post_excerpt' => 'Welcome to WordPress.',
		);
		self::$post = self::factory()->post->create_and_get( $args );
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post->ID );
	}

	public function test_get_template_slugs() {
		$templates = gutenberg_get_template_slugs( 'single-post-hello-world' );
		$this->assertSame(
			array(
				'single-post-hello-world',
				// Should *not* fall back to `single-post-hello`!
				'single-post',
				'single',
			),
			$templates
		);
	}

	public function test_gutenberg_get_block_template_type_for_slug() {
		$template_slug = 'single-' . self::$post->post_type . '-' . self::$post->post_name;
		$template_info = gutenberg_get_block_template_type_for_slug( $template_slug );
		$this->assertSame(
			array(
				'title'       => 'Post: Hello World!',
				'description' => 'Template for Post: Hello World!',
			),
			$template_info
		);
	}
}
