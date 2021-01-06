<?php
/**
 * REST API: Block_Templates_Test class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Tests for the Block Templates abstraction layer.
 */
class Block_Templates_Test extends WP_UnitTestCase {
	private static $post;

	public static function wpSetUpBeforeClass() {
		switch_theme( 'tt1-blocks' );
		gutenberg_register_template_post_type();
		gutenberg_register_template_part_post_type();
		gutenberg_register_wp_theme_taxonomy();

		$args = array(
			'post_type'    => 'wp_template',
			'post_name'    => 'my_template',
			'post_title'   => 'My Template',
			'post_content' => 'Content',
			'post_excerpt' => 'Description of my template',
			'tax_input'    => array(
				'wp_theme' => array(
					get_stylesheet(),
				),
			),
		);

		self::assertTrue( taxonomy_exists( 'wp_theme' ) );
		self::$post = self::factory()->post->create_and_get( $args );
		wp_set_post_terms( self::$post->ID, get_stylesheet(), 'wp_theme' );
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post->ID );
	}

	function test_gutenberg_build_template_result_from_file() {
		$template = _gutenberg_build_template_result_from_file(
			array(
				'slug' => 'single',
				'path' => __DIR__ . '/fixtures/template.html',
			),
			'wp_template'
		);

		$this->assertEquals( get_stylesheet() . '|single', $template->id );
		$this->assertEquals( get_stylesheet(), $template->theme );
		$this->assertEquals( 'single', $template->slug );
		$this->assertEquals( 'publish', $template->status );
		$this->assertEquals( false, $template->is_custom );
		$this->assertEquals( 'Single', $template->title );
		$this->assertEquals( 'Used when a single entry that is not a Page is queried', $template->description );
		$this->assertEquals( 'wp_template', $template->type );
	}

	function test_gutenberg_build_template_result_from_post() {
		$template = _gutenberg_build_template_result_from_post(
			self::$post,
			'wp_template'
		);

		$this->assertNotWPError( $template );
		$this->assertEquals( get_stylesheet() . '|my_template', $template->id );
		$this->assertEquals( get_stylesheet(), $template->theme );
		$this->assertEquals( 'my_template', $template->slug );
		$this->assertEquals( 'publish', $template->status );
		$this->assertEquals( true, $template->is_custom );
		$this->assertEquals( 'My Template', $template->title );
		$this->assertEquals( 'Description of my template', $template->description );
		$this->assertEquals( 'wp_template', $template->type );
	}
}
