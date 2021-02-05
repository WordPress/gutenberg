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
	private static $template_part_post;

	public static function wpSetUpBeforeClass() {
		switch_theme( 'tt1-blocks' );
		gutenberg_register_template_post_type();
		gutenberg_register_template_part_post_type();
		gutenberg_register_wp_theme_taxonomy();
		gutenberg_register_wp_template_section_taxonomy();

		// Set up template post.
		$args       = array(
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
		self::$post = self::factory()->post->create_and_get( $args );
		wp_set_post_terms( self::$post->ID, get_stylesheet(), 'wp_theme' );

		// Set up template part post.
		$template_part_args       = array(
			'post_type'    => 'wp_template_part',
			'post_name'    => 'my_template_part',
			'post_title'   => 'My Template Part',
			'post_content' => 'Content',
			'post_excerpt' => 'Description of my template part',
			'tax_input'    => array(
				'wp_theme'            => array(
					get_stylesheet(),
				),
				'wp_template_section' => array(
					WP_TEMPLATE_SECTION_SIDEBAR,
				),
			),
		);
		self::$template_part_post = self::factory()->post->create_and_get( $template_part_args );
		wp_set_post_terms( self::$template_part_post->ID, WP_TEMPLATE_SECTION_SIDEBAR, 'wp_template_section' );
		wp_set_post_terms( self::$template_part_post->ID, get_stylesheet(), 'wp_theme' );
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

		$this->assertEquals( get_stylesheet() . '//single', $template->id );
		$this->assertEquals( get_stylesheet(), $template->theme );
		$this->assertEquals( 'single', $template->slug );
		$this->assertEquals( 'publish', $template->status );
		$this->assertEquals( false, $template->is_custom );
		$this->assertEquals( 'Single', $template->title );
		$this->assertEquals( 'Used when a single entry that is not a Page is queried', $template->description );
		$this->assertEquals( 'wp_template', $template->type );

		// Test template parts.
		$template_part = _gutenberg_build_template_result_from_file(
			array(
				'slug'    => 'header',
				'path'    => __DIR__ . '/fixtures/template.html',
				'section' => WP_TEMPLATE_SECTION_HEADER,
			),
			'wp_template_part'
		);
		$this->assertEquals( get_stylesheet() . '//header', $template_part->id );
		$this->assertEquals( get_stylesheet(), $template_part->theme );
		$this->assertEquals( 'header', $template_part->slug );
		$this->assertEquals( 'publish', $template_part->status );
		$this->assertEquals( false, $template_part->is_custom );
		$this->assertEquals( 'header', $template_part->title );
		$this->assertEquals( '', $template_part->description );
		$this->assertEquals( 'wp_template_part', $template_part->type );
		$this->assertEquals( WP_TEMPLATE_SECTION_HEADER, $template_part->section );
	}

	function test_gutenberg_build_template_result_from_post() {
		$template = _gutenberg_build_template_result_from_post(
			self::$post,
			'wp_template'
		);

		$this->assertNotWPError( $template );
		$this->assertEquals( get_stylesheet() . '//my_template', $template->id );
		$this->assertEquals( get_stylesheet(), $template->theme );
		$this->assertEquals( 'my_template', $template->slug );
		$this->assertEquals( 'publish', $template->status );
		$this->assertEquals( true, $template->is_custom );
		$this->assertEquals( 'My Template', $template->title );
		$this->assertEquals( 'Description of my template', $template->description );
		$this->assertEquals( 'wp_template', $template->type );

		// Test template parts.
		$template_part = _gutenberg_build_template_result_from_post(
			self::$template_part_post,
			'wp_template_part'
		);
		$this->assertNotWPError( $template_part );
		$this->assertEquals( get_stylesheet() . '//my_template_part', $template_part->id );
		$this->assertEquals( get_stylesheet(), $template_part->theme );
		$this->assertEquals( 'my_template_part', $template_part->slug );
		$this->assertEquals( 'publish', $template_part->status );
		$this->assertEquals( true, $template_part->is_custom );
		$this->assertEquals( 'My Template Part', $template_part->title );
		$this->assertEquals( 'Description of my template part', $template_part->description );
		$this->assertEquals( 'wp_template_part', $template_part->type );
		$this->assertEquals( WP_TEMPLATE_SECTION_SIDEBAR, $template_part->section );
	}

	function test_inject_theme_attribute_in_content() {
		$theme                           = get_stylesheet();
		$content_without_theme_attribute = '<!-- wp:template-part {"slug":"header","align":"full", "tagName":"header","className":"site-header"} /-->';
		$template_content                = _inject_theme_attribute_in_content(
			$content_without_theme_attribute,
			$theme
		);
		$expected                        = sprintf(
			'<!-- wp:template-part {"slug":"header","align":"full","tagName":"header","className":"site-header","theme":"%s"} /-->',
			get_stylesheet()
		);
		$this->assertEquals( $expected, $template_content );

		// Does not inject theme when there is an existing theme attribute.
		$content_with_existing_theme_attribute = '<!-- wp:template-part {"slug":"header","theme":"fake-theme","align":"full", "tagName":"header","className":"site-header"} /-->';
		$template_content                      = _inject_theme_attribute_in_content(
			$content_with_existing_theme_attribute,
			$theme
		);
		$this->assertEquals( $content_with_existing_theme_attribute, $template_content );

		// Does not inject theme when there is no template part.
		$content_with_no_template_part = '<!-- wp:post-content /-->';
		$template_content              = _inject_theme_attribute_in_content(
			$content_with_no_template_part,
			$theme
		);
		$this->assertEquals( $content_with_no_template_part, $template_content );
	}

	/**
	 * Should retrieve the template from the theme files.
	 */
	function test_gutenberg_get_block_template_from_file() {
		$id       = get_stylesheet() . '//' . 'index';
		$template = gutenberg_get_block_template( $id, 'wp_template' );
		$this->assertEquals( $id, $template->id );
		$this->assertEquals( get_stylesheet(), $template->theme );
		$this->assertEquals( 'index', $template->slug );
		$this->assertEquals( 'publish', $template->status );
		$this->assertEquals( false, $template->is_custom );
		$this->assertEquals( 'wp_template', $template->type );

		// Test template parts.
		$id       = get_stylesheet() . '//' . 'header';
		$template = gutenberg_get_block_template( $id, 'wp_template_part' );
		$this->assertEquals( $id, $template->id );
		$this->assertEquals( get_stylesheet(), $template->theme );
		$this->assertEquals( 'header', $template->slug );
		$this->assertEquals( 'publish', $template->status );
		$this->assertEquals( false, $template->is_custom );
		$this->assertEquals( 'wp_template_part', $template->type );
		// TODO - update 'UNCATEGORIZED' to 'HEADER' once tt1-blocks theme.json updated for template part section info.
		$this->assertEquals( WP_TEMPLATE_SECTION_UNCATEGORIZED, $template->section );
	}

	/**
	 * Should retrieve the template from the CPT.
	 */
	function test_gutenberg_get_block_template_from_post() {
		$id       = get_stylesheet() . '//' . 'my_template';
		$template = gutenberg_get_block_template( $id, 'wp_template' );
		$this->assertEquals( $id, $template->id );
		$this->assertEquals( get_stylesheet(), $template->theme );
		$this->assertEquals( 'my_template', $template->slug );
		$this->assertEquals( 'publish', $template->status );
		$this->assertEquals( true, $template->is_custom );
		$this->assertEquals( 'wp_template', $template->type );

		// Test template parts.
		$id       = get_stylesheet() . '//' . 'my_template_part';
		$template = gutenberg_get_block_template( $id, 'wp_template_part' );
		$this->assertEquals( $id, $template->id );
		$this->assertEquals( get_stylesheet(), $template->theme );
		$this->assertEquals( 'my_template_part', $template->slug );
		$this->assertEquals( 'publish', $template->status );
		$this->assertEquals( true, $template->is_custom );
		$this->assertEquals( 'wp_template_part', $template->type );
		$this->assertEquals( WP_TEMPLATE_SECTION_SIDEBAR, $template->section );
	}

	/**
	 * Should retrieve block templates (file and CPT)
	 */
	function test_gutenberg_get_block_templates() {
		function get_template_ids( $templates ) {
			return array_map(
				function( $template ) {
					return $template->id;
				},
				$templates
			);
		}

		// All results.
		$templates    = gutenberg_get_block_templates( array(), 'wp_template' );
		$template_ids = get_template_ids( $templates );

		// Avoid testing the entire array because the theme might add/remove templates.
		$this->assertContains( get_stylesheet() . '//' . 'my_template', $template_ids );
		$this->assertContains( get_stylesheet() . '//' . 'index', $template_ids );

		// Filter by slug.
		$templates    = gutenberg_get_block_templates( array( 'slug__in' => array( 'my_template' ) ), 'wp_template' );
		$template_ids = get_template_ids( $templates );
		$this->assertEquals( array( get_stylesheet() . '//' . 'my_template' ), $template_ids );

		// Filter by CPT ID.
		$templates    = gutenberg_get_block_templates( array( 'wp_id' => self::$post->ID ), 'wp_template' );
		$template_ids = get_template_ids( $templates );
		$this->assertEquals( array( get_stylesheet() . '//' . 'my_template' ), $template_ids );

		// Filter template part by section.
		$templates    = gutenberg_get_block_templates( array( 'section' => WP_TEMPLATE_SECTION_SIDEBAR ), 'wp_template_part' );
		$template_ids = get_template_ids( $templates );
		// TODO - update following array result once tt1-blocks theme.json is updated for section info.
		$this->assertEquals( array( get_stylesheet() . '//' . 'my_template_part' ), $template_ids );
	}
}
