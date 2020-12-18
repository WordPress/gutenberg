<?php

/**
 * Test using CSS Custom Properties as values in CSS.
 *
 * @package Gutenberg
 */

class KSES_CSS_Custom_Properties_Test extends WP_UnitTestCase {

	function test_pass_through_if_allow_css_truthy() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( true, 'background-color: green' );
		$this->assertTrue( $result );
	}

	function test_shorthand_property_uses_value_with_var() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'background-color: var(--color)' );
		$this->assertTrue( $result );
	}

	function test_shorthand_property_uses_function_with_var() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'background-color: rgb(green, var(--color), green)' );
		$this->assertTrue( $result );
	}

	function test_shorthand_property_uses_invalid(){
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'property: \u003C\/style\u003E\u003Cscript\u003Ealert(invalid)\u003C\/script\u003E' );
		$this->assertFalse( $result );
	}

	function test_longhand_property_uses_values_with_var() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'background: content-box var(--color)' );
		$this->assertTrue( $result );
	}

	function test_longhand_property_uses_function_with_var() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'background: content-box var(--color)' );
		$this->assertTrue( $result );
	}

	function test_longhand_property_uses_invalid(){
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'property: valid \u003C\/style\u003E\u003Cscript\u003Ealert(invalid)\u003C\/script\u003E' );
		$this->assertFalse( $result );
	}

}
