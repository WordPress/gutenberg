<?php
/**
 * Tests the Style Engine Utils class.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */

/**
 * Tests for the Style Engine Utils utility functions.
 *
 * @group style-engine
 * @coversDefaultClass WP_Style_Engine_Utils_Gutenberg
 */
class WP_Style_Engine_Utils_Test extends WP_UnitTestCase {

	/**
	 * Tests converting theme.json declarations format to style engine format.
	 *
	 * @covers ::convert_theme_json_declarations
	 */
	public function test_convert_theme_json_declarations() {
		$theme_json_declarations = array(
			array(
				'name'  => 'color',
				'value' => 'red',
			),
			array(
				'name'  => 'background-color',
				'value' => 'blue',
			),
			array(
				'name'  => 'font-size',
				'value' => '16px',
			),
		);

		$expected = array(
			'color'            => 'red',
			'background-color' => 'blue',
			'font-size'        => '16px',
		);

		$result = WP_Style_Engine_Utils_Gutenberg::convert_theme_json_declarations( $theme_json_declarations );

		$this->assertSame( $expected, $result );
	}

	/**
	 * Tests converting empty array returns empty array.
	 *
	 * @covers ::convert_theme_json_declarations
	 */
	public function test_convert_theme_json_declarations_empty_array() {
		$result = WP_Style_Engine_Utils_Gutenberg::convert_theme_json_declarations( array() );

		$this->assertSame( array(), $result );
	}

	/**
	 * Tests converting null returns empty array.
	 *
	 * @covers ::convert_theme_json_declarations
	 */
	public function test_convert_theme_json_declarations_null() {
		$result = WP_Style_Engine_Utils_Gutenberg::convert_theme_json_declarations( null );

		$this->assertSame( array(), $result );
	}

	/**
	 * Tests converting non-array returns empty array.
	 *
	 * @covers ::convert_theme_json_declarations
	 */
	public function test_convert_theme_json_declarations_non_array() {
		$result = WP_Style_Engine_Utils_Gutenberg::convert_theme_json_declarations( 'not an array' );

		$this->assertSame( array(), $result );
	}

	/**
	 * Tests that declarations without name or value are skipped.
	 *
	 * @covers ::convert_theme_json_declarations
	 */
	public function test_convert_theme_json_declarations_skips_invalid() {
		$theme_json_declarations = array(
			array(
				'name'  => 'color',
				'value' => 'red',
			),
			array(
				'name' => 'background-color',
				// Missing 'value' key.
			),
			array(
				'value' => '16px',
				// Missing 'name' key.
			),
			array(
				'name'  => 'font-size',
				'value' => '16px',
			),
		);

		$expected = array(
			'color'     => 'red',
			'font-size' => '16px',
		);

		$result = WP_Style_Engine_Utils_Gutenberg::convert_theme_json_declarations( $theme_json_declarations );

		$this->assertSame( $expected, $result );
	}

	/**
	 * Tests converting CSS custom properties declarations.
	 *
	 * @covers ::convert_theme_json_declarations
	 */
	public function test_convert_theme_json_declarations_css_variables() {
		$theme_json_declarations = array(
			array(
				'name'  => '--wp--preset--color--grey',
				'value' => 'grey',
			),
			array(
				'name'  => '--wp--preset--font-size--small',
				'value' => '14px',
			),
			array(
				'name'  => '--wp--custom--base-font',
				'value' => '16',
			),
		);

		$expected = array(
			'--wp--preset--color--grey'      => 'grey',
			'--wp--preset--font-size--small' => '14px',
			'--wp--custom--base-font'        => '16',
		);

		$result = WP_Style_Engine_Utils_Gutenberg::convert_theme_json_declarations( $theme_json_declarations );

		$this->assertSame( $expected, $result );
	}

	/**
	 * Tests that duplicate property names overwrite previous values.
	 *
	 * @covers ::convert_theme_json_declarations
	 */
	public function test_convert_theme_json_declarations_duplicate_properties() {
		$theme_json_declarations = array(
			array(
				'name'  => 'color',
				'value' => 'red',
			),
			array(
				'name'  => 'color',
				'value' => 'blue',
			),
		);

		$expected = array(
			'color' => 'blue',
		);

		$result = WP_Style_Engine_Utils_Gutenberg::convert_theme_json_declarations( $theme_json_declarations );

		$this->assertSame( $expected, $result );
	}

	/**
	 * Tests converting declarations with complex values.
	 *
	 * @covers ::convert_theme_json_declarations
	 */
	public function test_convert_theme_json_declarations_complex_values() {
		$theme_json_declarations = array(
			array(
				'name'  => 'background',
				'value' => 'linear-gradient(135deg, rgba(0,0,0) 0%, rgb(0,0,0) 100%)',
			),
			array(
				'name'  => 'font-size',
				'value' => 'clamp(14px, 0.875rem + ((1vw - 3.2px) * 0.156), 16px)',
			),
			array(
				'name'  => 'box-shadow',
				'value' => '5px 5px 5px 0 black',
			),
		);

		$expected = array(
			'background' => 'linear-gradient(135deg, rgba(0,0,0) 0%, rgb(0,0,0) 100%)',
			'font-size'  => 'clamp(14px, 0.875rem + ((1vw - 3.2px) * 0.156), 16px)',
			'box-shadow' => '5px 5px 5px 0 black',
		);

		$result = WP_Style_Engine_Utils_Gutenberg::convert_theme_json_declarations( $theme_json_declarations );

		$this->assertSame( $expected, $result );
	}

	/**
	 * Tests converting declarations with numeric values.
	 *
	 * @covers ::convert_theme_json_declarations
	 */
	public function test_convert_theme_json_declarations_numeric_values() {
		$theme_json_declarations = array(
			array(
				'name'  => 'opacity',
				'value' => '0',
			),
			array(
				'name'  => 'z-index',
				'value' => '999',
			),
		);

		$expected = array(
			'opacity' => '0',
			'z-index' => '999',
		);

		$result = WP_Style_Engine_Utils_Gutenberg::convert_theme_json_declarations( $theme_json_declarations );

		$this->assertSame( $expected, $result );
	}
}
