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
	private $post;

	public function setUp() {
		parent::setUp();

		register_taxonomy(
			'wp_theme',
			array( 'wp_template', 'wp_template_part' )
		);

		$args = array(
			'post_type'    => 'wp_template',
			'post_name'    => 'my_template',
			'post_title'   => 'My Template',
			'post_content' => 'Content',
			'post_excerpt' => 'Description of my template',
			'tax_input'    => array(
				'wp_theme' => array(
					'twentytwenty',
				),
			),
		);

		$this->post = get_post( wp_insert_post( $args ) );
	}

	function test_gutenberg_build_template_result_from_file() {
		$template = _gutenberg_build_template_result_from_file(
			array(
				'slug' => 'single',
				'path' => __DIR__ . '/fixtures/template.html',
			),
			'wp_template'
		);

		$this->assertEquals( $template->id, 'default|single' );
		$this->assertEquals( $template->theme, 'default' );
		$this->assertEquals( $template->slug, 'single' );
		$this->assertEquals( $template->status, 'publish' );
		$this->assertEquals( $template->is_custom, false );
		$this->assertEquals( $template->title, 'Single' );
		$this->assertEquals( $template->description, 'Used when a single entry that is not a Page is queried' );
		$this->assertEquals( $template->type, 'wp_template' );
	}

	function test_gutenberg_build_template_result_from_post() {
		$template = _gutenberg_build_template_result_from_post(
			$this->post,
			'wp_template'
		);

		// $this->assertEquals( $template->id, 'twentytwenty|my_template' );
		// $this->assertEquals( $template->theme, 'twentytwenty' );
		$this->assertEquals( $template->slug, 'my_template' );
		$this->assertEquals( $template->status, 'draft' );
		$this->assertEquals( $template->is_custom, true );
		$this->assertEquals( $template->title, 'My Template' );
		$this->assertEquals( $template->description, 'Description of my template' );
		$this->assertEquals( $template->type, 'wp_template' );
	}
}
