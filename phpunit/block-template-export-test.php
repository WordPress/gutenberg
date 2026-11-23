<?php
/**
 * Test block template export utilities.
 *
 * @package gutenberg
 */

/**
 * Tests for gutenberg_generate_block_templates_export_file().
 *
 * @covers ::gutenberg_generate_block_templates_export_file
 */
class Tests_Block_Template_Export extends WP_UnitTestCase {

	/**
	 * Created template and template part post IDs.
	 *
	 * @var int[]
	 */
	protected $created_post_ids = array();

	/**
	 * Temporary files to delete in tear_down.
	 *
	 * @var string[]
	 */
	protected $temp_files = array();

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		foreach ( $this->created_post_ids as $post_id ) {
			wp_delete_post( $post_id, true );
		}
		$this->created_post_ids = array();

		foreach ( $this->temp_files as $file ) {
			if ( file_exists( $file ) ) {
				unlink( $file );
			}
		}
		$this->temp_files = array();

		parent::tear_down();
	}

	/**
	 * Tests that template parts strip the "theme" attribute from nested template parts when exported.
	 */
	public function test_template_part_nested_template_part_theme_attribute_is_removed() {
		if ( ! class_exists( 'ZipArchive' ) ) {
			$this->markTestSkipped( 'ZipArchive is required.' );
		}

		$current_theme = get_stylesheet();

		$template_part_id = wp_insert_post(
			array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_title'   => 'Test Template Part With Nested Part',
				'post_name'    => 'test-nested-part',
				'post_content' => '<!-- wp:group --><div class="wp-block-group"><!-- wp:template-part {"slug":"inner-part","theme":"old-theme","area":"header"} /--></div><!-- /wp:group -->',
			),
			true
		);
		$this->assertNotWPError( $template_part_id );
		$this->created_post_ids[] = $template_part_id;

		wp_set_post_terms( $template_part_id, array( $current_theme ), 'wp_theme' );
		wp_set_post_terms( $template_part_id, array( 'header' ), 'wp_template_part_area' );

		$filename = gutenberg_generate_block_templates_export_file();
		$this->assertNotWPError( $filename );
		$this->assertFileExists( $filename );
		$this->temp_files[] = $filename;

		$zip = new ZipArchive();
		$this->assertTrue( $zip->open( $filename ) );

		$part_content = $zip->getFromName( 'parts/test-nested-part.html' );
		$zip->close();

		$this->assertNotEmpty( $part_content );
		$this->assertStringNotContainsString( '"theme":', $part_content );
		$this->assertStringContainsString( '<!-- wp:template-part {"slug":"inner-part","area":"header"} /-->', $part_content );
	}

	/**
	 * Tests that templates still strip the "theme" attribute from nested template parts when exported.
	 */
	public function test_template_nested_template_part_theme_attribute_is_removed() {
		if ( ! class_exists( 'ZipArchive' ) ) {
			$this->markTestSkipped( 'ZipArchive is required.' );
		}

		$current_theme = get_stylesheet();

		$template_id = wp_insert_post(
			array(
				'post_type'    => 'wp_template',
				'post_status'  => 'publish',
				'post_title'   => 'Test Template With Nested Part',
				'post_name'    => 'test-nested-template',
				'post_content' => '<!-- wp:template-part {"slug":"header","theme":"old-theme","area":"header"} /-->',
			),
			true
		);
		$this->assertNotWPError( $template_id );
		$this->created_post_ids[] = $template_id;

		wp_set_post_terms( $template_id, array( $current_theme ), 'wp_theme' );

		$filename = gutenberg_generate_block_templates_export_file();
		$this->assertNotWPError( $filename );
		$this->assertFileExists( $filename );
		$this->temp_files[] = $filename;

		$zip = new ZipArchive();
		$this->assertTrue( $zip->open( $filename ) );

		$template_content = $zip->getFromName( 'templates/test-nested-template.html' );
		$zip->close();

		$this->assertNotEmpty( $template_content );
		$this->assertStringNotContainsString( '"theme":', $template_content );
		$this->assertStringContainsString( '<!-- wp:template-part {"slug":"header","area":"header"} /-->', $template_content );
	}
}
