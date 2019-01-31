<?php
/**
 * Test `gutenberg_extend_block_editor_styles`.
 *
 * @package Gutenberg
 */

class Extend_Styles_Test extends WP_UnitTestCase {

	/**
	 * Path of the `editor-styles.css` stub file created, or null if one had
	 * already existed on the filesystem.
	 *
	 * @var string|null
	 */
	protected static $stub_file;

	/**
	 * Contents of the `editor-styles.css` file.
	 *
	 * @var string
	 */
	protected static $style_contents;

	public static function wpSetUpBeforeClass() {
		self::ensure_editor_styles();
	}

	public static function wpTearDownAfterClass() {
		if ( self::$stub_file ) {
			unlink( self::$stub_file );
		}
	}

	/**
	 * Verifies that an `editor-styles.css` file exists, creating it otherwise,
	 * and assigning the `style_contents` and `stub_file` class properties.
	 */
	protected static function ensure_editor_styles() {
		$path = gutenberg_dir_path() . 'build/editor/editor-styles.css';

		if ( file_exists( $path ) ) {
			self::$style_contents = file_get_contents( $path );
			self::$stub_file      = null;
		} else {
			self::$style_contents = '';
			file_put_contents( $path, self::$style_contents );
			self::$stub_file = $path;
		}
	}

	/**
	 * Tests an unset `styles` setting.
	 */
	function test_unset_editor_settings_style() {
		$settings = array();

		$settings = gutenberg_extend_block_editor_styles( $settings );

		$this->assertEquals(
			array( array( 'css' => self::$style_contents ) ),
			$settings['styles']
		);
	}

	/**
	 * Tests a default `styles` setting.
	 */
	function test_default_editor_settings_style() {
		$settings = array(
			'styles' => array(
				array( 'css' => 'original' ),
				array( 'css' => 'someother' ),
			),
		);

		$settings = gutenberg_extend_block_editor_styles( $settings );

		$this->assertEquals(
			array(
				array( 'css' => self::$style_contents ),
				array( 'css' => 'someother' ),
			),
			$settings['styles']
		);
	}

}
