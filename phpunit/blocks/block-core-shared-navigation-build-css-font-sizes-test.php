<?php
/**
 * Tests for block_core_shared_navigation_build_css_font_sizes() function.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the shared navigation font sizes helper function.
 *
 * @group blocks
 */
class Block_Core_Shared_Navigation_Build_Css_Font_Sizes_Test extends WP_UnitTestCase {

	public static function set_up_before_class() {
		parent::set_up_before_class();

		// Load the shared navigation font sizes helper file.
		require_once dirname( __DIR__, 2 ) . '/packages/block-library/src/navigation-link/shared/build-css-font-sizes.php';
	}

	/**
	 * Test that the function exists.
	 */
	public function test_function_exists() {
		$this->assertTrue(
			function_exists( 'block_core_shared_navigation_build_css_font_sizes' ),
			'Function block_core_shared_navigation_build_css_font_sizes should exist'
		);
	}

	/**
	 * Test that the function returns expected array structure.
	 */
	public function test_returns_array_structure() {
		$context = array();
		$result  = block_core_shared_navigation_build_css_font_sizes( $context );

		$this->assertIsArray( $result, 'Function should return an array' );
		$this->assertArrayHasKey( 'css_classes', $result, 'Result should have css_classes key' );
		$this->assertArrayHasKey( 'inline_styles', $result, 'Result should have inline_styles key' );
		$this->assertIsArray( $result['css_classes'], 'css_classes should be an array' );
		$this->assertIsString( $result['inline_styles'], 'inline_styles should be a string' );
	}

	/**
	 * Test with empty context.
	 */
	public function test_with_empty_context() {
		$context = array();
		$result  = block_core_shared_navigation_build_css_font_sizes( $context );

		$this->assertEmpty( $result['css_classes'], 'css_classes should be empty with no font size' );
		$this->assertSame( '', $result['inline_styles'], 'inline_styles should be empty string with no font size' );
	}

	/**
	 * Test with named font size.
	 */
	public function test_with_named_font_size() {
		$context = array(
			'fontSize' => 'large',
		);
		$result  = block_core_shared_navigation_build_css_font_sizes( $context );

		$this->assertCount( 1, $result['css_classes'], 'Should have one CSS class for named font size' );
		$this->assertSame( 'has-large-font-size', $result['css_classes'][0], 'Should have correct font size class' );
		$this->assertSame( '', $result['inline_styles'], 'inline_styles should be empty with named font size' );
	}

	/**
	 * Test with custom font size.
	 */
	public function test_with_custom_font_size() {
		$context = array(
			'style' => array(
				'typography' => array(
					'fontSize' => '20px',
				),
			),
		);
		$result  = block_core_shared_navigation_build_css_font_sizes( $context );

		$this->assertEmpty( $result['css_classes'], 'css_classes should be empty with only custom font size' );
		$this->assertStringContainsString( 'font-size:', $result['inline_styles'], 'inline_styles should contain font-size property' );
		$this->assertStringContainsString( '20px', $result['inline_styles'], 'inline_styles should contain the custom font size value' );
	}

	/**
	 * Test that named font size takes precedence over custom font size.
	 */
	public function test_named_takes_precedence() {
		$context = array(
			'fontSize' => 'medium',
			'style'    => array(
				'typography' => array(
					'fontSize' => '18px',
				),
			),
		);
		$result  = block_core_shared_navigation_build_css_font_sizes( $context );

		$this->assertCount( 1, $result['css_classes'], 'Should have CSS class for named font size' );
		$this->assertSame( 'has-medium-font-size', $result['css_classes'][0], 'Should use named font size class' );
		$this->assertSame( '', $result['inline_styles'], 'inline_styles should be empty when named font size is present' );
	}

	/**
	 * Test with various named font size values.
	 *
	 * @dataProvider data_named_font_sizes
	 */
	public function test_with_various_named_sizes( $font_size_name ) {
		$context = array(
			'fontSize' => $font_size_name,
		);
		$result  = block_core_shared_navigation_build_css_font_sizes( $context );

		$expected_class = sprintf( 'has-%s-font-size', $font_size_name );
		$this->assertContains( $expected_class, $result['css_classes'], "Should have class for {$font_size_name} font size" );
	}

	/**
	 * Data provider for named font sizes.
	 */
	public function data_named_font_sizes() {
		return array(
			'small'      => array( 'small' ),
			'medium'     => array( 'medium' ),
			'large'      => array( 'large' ),
			'x-large'    => array( 'x-large' ),
			'custom-big' => array( 'custom-big' ),
		);
	}

	/**
	 * Test with custom font size using different units.
	 *
	 * @dataProvider data_custom_font_sizes
	 */
	public function test_with_various_custom_sizes( $custom_size ) {
		$context = array(
			'style' => array(
				'typography' => array(
					'fontSize' => $custom_size,
				),
			),
		);
		$result  = block_core_shared_navigation_build_css_font_sizes( $context );

		$this->assertStringContainsString( 'font-size:', $result['inline_styles'], 'inline_styles should contain font-size property' );
		$this->assertNotEmpty( $result['inline_styles'], 'inline_styles should not be empty with custom font size' );
	}

	/**
	 * Data provider for custom font sizes.
	 */
	public function data_custom_font_sizes() {
		return array(
			'pixels'     => array( '16px' ),
			'ems'        => array( '1.5em' ),
			'rems'       => array( '2rem' ),
			'percentage' => array( '120%' ),
		);
	}
}
