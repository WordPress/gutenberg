<?php
/**
 * Tests block template registry via block-related functions.
 */
class Tests_Block_Template extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();
		switch_theme( 'block-theme' );
	}

	public function test_get_block_templates_from_registry() {
		$template_name = 'test-plugin//test-template';

		register_block_template( $template_name );

		$templates = get_block_templates();

		$this->assertArrayHasKey( $template_name, $templates );

		unregister_block_template( $template_name );
	}

	public function test_get_block_template_from_registry() {
		$template_name = 'test-plugin//test-template';
		$args          = array(
			'title' => 'Test Template',
		);

		register_block_template( $template_name, $args );

		$template = get_block_template( 'block-theme//test-template' );

		$this->assertEquals( 'Test Template', $template->title );

		unregister_block_template( $template_name );
	}

	public function test_gutenberg_get_available_zip_path_adds_suffix_for_existing_entries() {
		if ( ! class_exists( 'ZipArchive' ) ) {
			$this->markTestSkipped( 'The ZipArchive class is not available.' );
		}

		$zip_path = wp_tempnam( 'theme-export.zip' );
		$zip      = new ZipArchive();

		$this->assertIsString( $zip_path );
		$this->assertTrue( $zip->open( $zip_path, ZipArchive::CREATE | ZipArchive::OVERWRITE ) );
		$this->assertTrue( $zip->addFromString( 'assets/img/image.png', 'first image' ) );
		$this->assertTrue( $zip->addFromString( 'assets/img/image-1.png', 'second image' ) );

		$this->assertSame(
			'assets/img/image-2.png',
			gutenberg_get_available_zip_path( $zip, 'assets/img/image.png' )
		);

		$zip->close();
		unlink( $zip_path );
	}
}
