<?php
/**
 * Test `gutenberg_extend_block_editor_styles`.
 *
 * @package Gutenberg
 */

class Extend_Styles_Test extends WP_UnitTestCase {

	/**
	 * Path of the original `editor-styles.css` file.
	 *
	 * @var string|null
	 */
	protected $orignal_file = null;

	/**
	 * Contents of the `editor-styles.css` file.
	 *
	 * @var string
	 */
	protected $style_contents = null;

	public function wpTearDown() {
		parent::wpTearDown();

		$this->restore_editor_styles();
	}

	/**
	 * Restores the existence of `editor-styles.css` to its original state.
	 */
	protected function restore_editor_styles() {
		$path = gutenberg_dir_path() . 'build/editor/editor-styles.css';

		if ( $this->original_file ) {
			if ( $this->original_file !== $path ) {
				rename( $this->original_file, $path );
			}
		} elseif ( file_exists( $path ) ) {
			unlink( $path );
		}

		$this->style_contents = null;
		$this->original_file  = null;
	}

	/**
	 * Guarantees that an `editor-styles.css` file exists, if and only if it
	 * should exist. Assigns `style_contents` according to the contents of the
	 * file if it should exist. Renames the existing file temporarily if it
	 * exists but should not.
	 *
	 * @param bool $should_exist Whether the editor styles file should exist.
	 */
	protected function ensure_editor_styles( $should_exist = true ) {
		$path = gutenberg_dir_path() . 'build/editor/editor-styles.css';

		if ( file_exists( $path ) ) {
			if ( $should_exist ) {
				$this->style_contents = file_get_contents( $path );
				$this->original_file  = $path;
			} else {
				rename( $path, $path . '.bak' );
				$this->original_file = $path . '.bak';
			}
		} elseif ( $should_exist ) {
			$this->style_contents = '';
			file_put_contents( $path, $this->style_contents );
			$this->original_file = null;
		}
	}

	/**
	 * Tests a non-existent build `styles`.
	 */
	function test_without_built_styles() {
		$this->ensure_editor_styles( false );

		$settings = array(
			'styles' => array(
				array( 'css' => 'original' ),
				array( 'css' => 'someother' ),
			),
		);

		$result = gutenberg_extend_block_editor_styles( $settings );

		$this->assertEquals( $settings, $result );
	}

	/**
	 * Tests an unset `styles` setting.
	 */
	function test_unset_editor_settings_style() {
		$this->ensure_editor_styles();

		$settings = array();

		$settings = gutenberg_extend_block_editor_styles( $settings );

		$this->assertEquals(
			array( array( 'css' => $this->style_contents ) ),
			$settings['styles']
		);
	}

	/**
	 * Tests replacing the default styles.
	 */
	function test_replace_default_editor_styles() {
		$this->ensure_editor_styles();
		$default_styles = file_get_contents(
			ABSPATH . WPINC . '/css/dist/editor/editor-styles.css'
		);

		$settings = array(
			'styles' => array(
				array( 'css' => $default_styles ),
				array( 'css' => 'someother' ),
			),
		);

		$settings = gutenberg_extend_block_editor_styles( $settings );

		$this->assertEquals(
			array(
				array( 'css' => $this->style_contents ),
				array( 'css' => 'someother' ),
			),
			$settings['styles']
		);
	}

	/**
	 * Tests replacing the rearranged default styles.
	 */
	function test_replace_rearranged_default_editor_styles() {
		$this->ensure_editor_styles();
		$default_styles = file_get_contents(
			ABSPATH . WPINC . '/css/dist/editor/editor-styles.css'
		);

		$settings = array(
			'styles' => array(
				array( 'css' => 'someother' ),
				array( 'css' => $default_styles ),
			),
		);

		$settings = gutenberg_extend_block_editor_styles( $settings );

		$this->assertEquals(
			array(
				array( 'css' => 'someother' ),
				array( 'css' => $this->style_contents ),
			),
			$settings['styles']
		);
	}

	/**
	 * Tests when the default styles aren't in the styles setting.
	 */
	function test_without_default_editor_styles() {
		$this->ensure_editor_styles();

		$settings = array(
			'styles' => array(
				array( 'css' => 'someother' ),
			),
		);

		$settings = gutenberg_extend_block_editor_styles( $settings );

		$this->assertEquals(
			array(
				array( 'css' => $this->style_contents ),
				array( 'css' => 'someother' ),
			),
			$settings['styles']
		);
	}

}
