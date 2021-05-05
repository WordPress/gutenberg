<?php
/**
 * Template_Loader_Test class
 *
 * @package WordPress
 */

/**
 * Tests for the block template loading algorithm.
 */
class Template_Loader_Test extends WP_UnitTestCase {
	private static $post;
	private static $template_part_post;

	public static function wpSetUpBeforeClass() {
		switch_theme( 'tt1-blocks' );
		gutenberg_register_template_post_type();
		gutenberg_register_template_part_post_type();
		gutenberg_register_wp_theme_taxonomy();
		gutenberg_register_wp_template_part_area_taxonomy();

		// Set up template post.
		$args       = array(
			'post_type'    => 'wp_template',
			'post_name'    => 'page',
			'post_title'   => 'Page',
			'post_content' => 'Content',
			'post_excerpt' => 'Description of my template',
			'tax_input'    => array(
				'wp_theme' => array(
					get_stylesheet(),
				),
			),
		);
		self::$post = self::factory()->post->create_and_get( $args );
		wp_set_post_terms( self::$post->ID, get_stylesheet(), 'wp_theme' );
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post->ID );
	}

	function test_gutenberg_page_template() {
		$type = 'page';
		$templates = array(
			'page-slug.php',
			'page-1.php',
			'page.php',
		);
		$resolved_template_path = gutenberg_override_query_template( $custom_page_template_path, $type, $templates );
		$this->assertEquals( gutenberg_dir_path() . 'lib/template-canvas.php', $resolved_template_path );
	}

	function test_gutenberg_custom_page_template() {
		$custom_page_template = 'templates/full-width.php';
		$custom_page_template_path = get_stylesheet_directory() . '/' . $custom_page_template; 
		$type = 'page';
		$templates = array(
			$custom_page_template,
			'page-slug.php',
			'page-1.php',
			'page.php',
		);
		$resolved_template_path = gutenberg_override_query_template( $custom_page_template_path, $type, $templates );
		$this->assertEquals( $custom_page_template_path, $resolved_template_path );
	}
}
