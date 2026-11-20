<?php
/**
 * Tests the assets that Gutenberg registers by hand from its build directory.
 *
 * A build made with `--no-script-debug` leaves out the non-minified files, so
 * these tests check that every registered file exists on disk, whichever way
 * the plugin was built and whatever the value of `SCRIPT_DEBUG`.
 *
 * @package gutenberg
 */

class Gutenberg_Client_Assets_Test extends WP_UnitTestCase {
	/**
	 * Cleans up global scope.
	 *
	 * @global WP_Styles  $wp_styles
	 * @global WP_Scripts $wp_scripts
	 */
	public function clean_up_global_scope() {
		global $wp_styles, $wp_scripts; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::clean_up_global_scope();
		$wp_styles  = null;
		$wp_scripts = null;
	}

	/**
	 * Converts a URL inside the plugin's build directory to a file path.
	 *
	 * @param string $url URL of a file in the build directory.
	 * @return string Absolute path to the file.
	 */
	private function get_build_file_path( $url ) {
		$build_url = gutenberg_url( 'build/' );

		$this->assertIsString( $url, 'The asset should be registered with a URL.' );
		$this->assertStringStartsWith( $build_url, $url, 'The asset should load from the build directory.' );

		return gutenberg_dir_path() . 'build/' . substr( $url, strlen( $build_url ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_style_handles() {
		return array(
			array( 'wp-theme' ),
			array( 'wp-base-styles' ),
			array( 'wp-block-editor-content' ),
			array( 'wp-block-library' ),
			array( 'wp-reset-editor-styles' ),
			array( 'wp-editor-classic-layout-styles' ),
			array( 'wp-block-library-editor' ),
			array( 'wp-edit-blocks' ),
			array( 'wp-block-library-theme' ),
			array( 'classic-theme-styles' ),
		);
	}

	/**
	 * Tests that the stylesheets registered by hand load files that exist.
	 *
	 * @dataProvider data_style_handles
	 *
	 * @covers ::gutenberg_register_packages_styles
	 * @covers ::gutenberg_should_load_debug_assets
	 *
	 * @param string $handle Style handle.
	 */
	public function test_registered_style_files_exist( $handle ) {
		$style = wp_styles()->query( $handle, 'registered' );

		$this->assertInstanceOf( _WP_Dependency::class, $style, "The $handle style should be registered." );

		$path = $this->get_build_file_path( $style->src );
		$this->assertFileExists( $path );

		// `WP_Styles` builds the RTL URL from the suffix the same way.
		$suffix = $style->extra['suffix'] ?? '';
		$this->assertFileExists( str_replace( "{$suffix}.css", "-rtl{$suffix}.css", $path ) );

		if ( isset( $style->extra['path'] ) ) {
			$this->assertSame( $path, $style->extra['path'], 'The path used for inlining should match the URL.' );
		}
	}

	/**
	 * Tests that the per-block stylesheets registered by hand load files that exist.
	 *
	 * @covers ::gutenberg_register_core_block_assets
	 * @covers ::gutenberg_should_load_debug_assets
	 */
	public function test_registered_block_style_files_exist() {
		add_filter( 'should_load_separate_core_block_assets', '__return_true' );

		gutenberg_register_core_block_assets( 'core/paragraph' );
		$style = wp_styles()->query( 'wp-block-paragraph', 'registered' );

		$this->assertInstanceOf( _WP_Dependency::class, $style, 'The paragraph block style should be registered.' );
		$this->assertFileExists( $this->get_build_file_path( $style->src ) );
		$this->assertSame( $this->get_build_file_path( $style->src ), $style->extra['path'], 'The path used for inlining should match the URL.' );
	}
}
