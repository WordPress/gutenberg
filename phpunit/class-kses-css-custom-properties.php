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

	function test_shorthand_property_with_var_is_allowed() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'background-color: var(--color)' );
		$this->assertTrue( $result );
	}

	function test_shorthand_property_with_var_in_function_is_not_allowed() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'background-color: rgb(var(--color), 255, 255)' );
		$this->assertFalse( $result );
	}

	function test_shorthand_property_with_var_and_fallback_is_not_allowed() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'background-color: var(--color, green)' );
		$this->assertFalse( $result );
	}

	function test_shorthand_property_with_var_and_fallback_being_a_var_is_not_allowed() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'background-color: var(--color, var(--other-color, green)' );
		$this->assertFalse( $result );
	}

	function test_shorthand_property_with_invalid_is_not_allowed(){
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'property: \u003C\/style\u003E\u003Cscript\u003Ealert(invalid)\u003C\/script\u003E' );
		$this->assertFalse( $result );
	}

	function test_longhand_property_with_var_is_allowed() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'background: content-box var(--color)' );
		$this->assertTrue( $result );
	}

	function test_longhand_property_with_var_in_function_is_not_allowed() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'background: content-box rgb(var(--color), 255, 255)' );
		$this->assertFalse( $result );
	}

	function test_longhand_property_with_var_and_fallback_is_not_allowed() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'background: content-box var(--color, green)' );
		$this->assertFalse( $result );
	}

	function test_longhand_property_with_var_and_fallback_being_a_var_is_not_allowed() {
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'background: content-box var(--color, var(--other-color, green))' );
		$this->assertFalse( $result );
	}

	function test_longhand_property_with_invalid_is_not_allowed(){
		$result = gutenberg_experimental_global_styles_allow_css_var_value( false, 'property: valid \u003C\/style\u003E\u003Cscript\u003Ealert(invalid)\u003C\/script\u003E' );
		$this->assertFalse( $result );
	}

}
