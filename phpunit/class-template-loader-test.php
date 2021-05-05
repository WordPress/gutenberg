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
		//self::$post = self::factory()->post->create_and_get( $args );
		//wp_set_post_terms( self::$post->ID, get_stylesheet(), 'wp_theme' );
	}

	public static function wpTearDownAfterClass() {
		//wp_delete_post( self::$post->ID );
	}

	function test_gutenberg_page_home_block_template_takes_precedence_over_less_specific_block_templates() {
		global $_wp_current_template_content;
		$type = 'page';
		$templates = array(
			'page-home.php',
			'page-1.php',
			'page.php',
		);
		$resolved_template_path = gutenberg_override_query_template( get_stylesheet_directory() . '/page-home.php', $type, $templates );
		$this->assertEquals( gutenberg_dir_path() . 'lib/template-canvas.php', $resolved_template_path );

		$expected_template = gutenberg_get_block_file_template( get_stylesheet() . '//page-home' );
		$this->assertEquals( $expected_template->content, $_wp_current_template_content );
		unset( $_wp_current_template_content );
	}

	function test_gutenberg_page_block_template_takes_precedence() {
		global $_wp_current_template_content;
		$type = 'page';
		$templates = array(
			'page-slug-doesnt-exist.php',
			'page-1.php',
			'page.php',
		);
		$resolved_template_path = gutenberg_override_query_template( get_stylesheet_directory() . '/page.php', $type, $templates );
		$this->assertEquals( gutenberg_dir_path() . 'lib/template-canvas.php', $resolved_template_path );

		$expected_template = gutenberg_get_block_file_template( get_stylesheet() . '//page' );
		$this->assertEquals( $expected_template->content, $_wp_current_template_content );
		unset( $_wp_current_template_content );
	}

	function test_gutenberg_block_template_takes_precedence_over_equally_specific_php_template() {
		global $_wp_current_template_content;
		$type = 'index';
		$templates = array(
			'index.php',
		);
		$resolved_template_path = gutenberg_override_query_template( get_stylesheet_directory() . '/index.php', $type, $templates );
		$this->assertEquals( gutenberg_dir_path() . 'lib/template-canvas.php', $resolved_template_path );

		$expected_template = gutenberg_get_block_file_template( get_stylesheet() . '//index' );
		$this->assertEquals( $expected_template->content, $_wp_current_template_content );
		unset( $_wp_current_template_content );
	}

	// Covers https://github.com/WordPress/gutenberg/pull/29026
	function test_gutenberg_more_specific_php_template_takes_precedence_over_less_specific_block_template() {
		global $_wp_current_template_content;
		$page_id_template = 'page-1.php';
		$page_id_template_path = get_stylesheet_directory() . '/' . $page_id_template;
		$type = 'page';
		$templates = array(
			'page-slug-doesnt-exist.php',
			'page-1.php',
			'page.php',
		);
		$resolved_template_path = gutenberg_override_query_template( $page_id_template_path, $type, $templates );
		$this->assertEquals( $page_id_template_path, $resolved_template_path );
	}

	// Regression: https://github.com/WordPress/gutenberg/issues/31399
	function test_gutenberg_custom_page_template_takes_precedence_over_all_other_templates() {
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
