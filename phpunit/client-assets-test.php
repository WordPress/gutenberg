<?php
/**
 * Tests the assets that Gutenberg registers by hand from its build directory.
 *
 * A build made with `--no-script-debug` leaves out the non-minified files.
 * `SCRIPT_DEBUG` is a constant, so these tests pass the value they need to
 * gutenberg_should_load_debug_assets() rather than depend on the environment.
 *
 * @package gutenberg
 */

class Gutenberg_Client_Assets_Test extends WP_UnitTestCase {
	/**
	 * Build files that the stylesheets registered by hand load, without the
	 * suffix and extension, keyed by style handle.
	 *
	 * @var string[]
	 */
	const STYLE_FILES = array(
		'wp-theme'                        => 'build/styles/theme/design-tokens',
		'wp-base-styles'                  => 'build/styles/base-styles/admin-schemes',
		'wp-block-editor-content'         => 'build/styles/block-editor/content',
		'wp-block-library'                => 'build/styles/block-library/style',
		'wp-reset-editor-styles'          => 'build/styles/block-library/reset',
		'wp-editor-classic-layout-styles' => 'build/styles/edit-post/classic',
		'wp-block-library-editor'         => 'build/styles/block-library/editor',
		'wp-edit-blocks'                  => 'build/styles/block-library/editor',
		'wp-block-library-theme'          => 'build/styles/block-library/theme',
		'classic-theme-styles'            => 'build/styles/block-library/classic',
		'wp-block-paragraph'              => 'build/styles/block-library/paragraph/style',
	);

	/**
	 * Cleans up global scope.
	 *
	 * @global WP_Styles $wp_styles
	 */
	public function clean_up_global_scope() {
		global $wp_styles; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::clean_up_global_scope();
		$wp_styles = null;
	}

	/**
	 * Returns the array that the current build's `build/constants.php` returns.
	 *
	 * @return array Build constants.
	 */
	private function get_build_constants() {
		$constants_file = gutenberg_dir_path() . 'build/constants.php';
		$this->assertFileExists( $constants_file, 'The plugin should be built.' );

		return require $constants_file;
	}

	/**
	 * Returns the suffix the registration code adds before the extension.
	 *
	 * @param bool|null $script_debug     Whether `SCRIPT_DEBUG` is on.
	 * @param bool|null $has_debug_assets Whether the build has non-minified files.
	 * @return string Either an empty string or `.min`.
	 */
	private function get_suffix( $script_debug = null, $has_debug_assets = null ) {
		return gutenberg_should_load_debug_assets( $script_debug, $has_debug_assets ) ? '' : '.min';
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_should_load_debug_assets() {
		return array(
			'SCRIPT_DEBUG on, debug files built'  => array( true, true, true ),
			'SCRIPT_DEBUG on, no debug files'     => array( true, false, false ),
			'SCRIPT_DEBUG off, debug files built' => array( false, true, false ),
			'SCRIPT_DEBUG off, no debug files'    => array( false, false, false ),
		);
	}

	/**
	 * Tests that the non-minified files load only when `SCRIPT_DEBUG` is on and
	 * the build includes them.
	 *
	 * @dataProvider data_should_load_debug_assets
	 *
	 * @covers ::gutenberg_should_load_debug_assets
	 *
	 * @param bool $script_debug     Whether `SCRIPT_DEBUG` is on.
	 * @param bool $has_debug_assets Whether the build has non-minified files.
	 * @param bool $expected         Expected result.
	 */
	public function test_should_load_debug_assets( $script_debug, $has_debug_assets, $expected ) {
		$this->assertSame( $expected, gutenberg_should_load_debug_assets( $script_debug, $has_debug_assets ) );
	}

	/**
	 * Tests that the plugin reads `has_debug_assets` from the current build.
	 *
	 * @covers ::gutenberg_should_load_debug_assets
	 */
	public function test_has_debug_assets_comes_from_the_build() {
		$build_constants = $this->get_build_constants();

		$this->assertTrue( defined( 'GUTENBERG_HAS_DEBUG_ASSETS' ), 'GUTENBERG_HAS_DEBUG_ASSETS should be defined.' );
		$this->assertSame( (bool) $build_constants['has_debug_assets'], GUTENBERG_HAS_DEBUG_ASSETS );
		$this->assertSame(
			gutenberg_should_load_debug_assets( true, $build_constants['has_debug_assets'] ),
			gutenberg_should_load_debug_assets( true ),
			'The default should match the current build.'
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_script_debug() {
		return array(
			'SCRIPT_DEBUG on'  => array( true ),
			'SCRIPT_DEBUG off' => array( false ),
		);
	}

	/**
	 * Tests that, for the current build, every stylesheet registered by hand
	 * resolves to a file that exists, with `SCRIPT_DEBUG` on or off.
	 *
	 * Fails on a `--no-script-debug` build if the suffix ignores the
	 * `has_debug_assets` value of that build.
	 *
	 * @dataProvider data_script_debug
	 *
	 * @covers ::gutenberg_should_load_debug_assets
	 *
	 * @param bool $script_debug Whether `SCRIPT_DEBUG` is on.
	 */
	public function test_build_has_files_for_suffix( $script_debug ) {
		$suffix = $this->get_suffix( $script_debug );

		foreach ( array_unique( self::STYLE_FILES ) as $file ) {
			$this->assertFileExists( gutenberg_dir_path() . $file . $suffix . '.css' );
			$this->assertFileExists( gutenberg_dir_path() . $file . '-rtl' . $suffix . '.css' );
		}
	}

	/**
	 * Tests that the stylesheets registered by hand use the suffix from
	 * gutenberg_should_load_debug_assets().
	 *
	 * @covers ::gutenberg_register_packages_styles
	 * @covers ::gutenberg_register_core_block_assets
	 */
	public function test_registered_styles_use_suffix() {
		$suffix = $this->get_suffix();

		add_filter( 'should_load_separate_core_block_assets', '__return_false' );
		$GLOBALS['wp_styles'] = null;
		wp_styles();

		add_filter( 'should_load_separate_core_block_assets', '__return_true', 11 );
		gutenberg_register_core_block_assets( 'core/paragraph' );

		foreach ( self::STYLE_FILES as $handle => $file ) {
			$style = wp_styles()->query( $handle, 'registered' );

			$this->assertInstanceOf( _WP_Dependency::class, $style, "The $handle style should be registered." );
			$this->assertSame( gutenberg_url( $file . $suffix . '.css' ), $style->src, "The $handle style should load the file for the current suffix." );
			$this->assertSame( $suffix, $style->extra['suffix'] ?? null, "The $handle style should carry the suffix for its RTL file." );
		}
	}
}
