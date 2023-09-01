<?php
/**
 * Tests the Style Engine CSS Rule class.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */

/**
 * Tests for registering, storing and generating CSS rules.
 *
 * @group style-engine
 * @coversDefaultClass WP_Style_Engine_CSS_Rule_Gutenberg
 */
class WP_Style_Engine_CSS_Rule_Test extends WP_UnitTestCase {
	/**
	 * Tests that declarations are set on instantiation.
	 *
	 * @covers ::__construct
	 */
	public function test_should_instantiate_with_selector_and_rules() {
		$selector           = '.law-and-order';
		$input_declarations = array(
			'margin-top' => '10px',
			'font-size'  => '2rem',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations_Gutenberg( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule_Gutenberg( $selector, $css_declarations );

		$this->assertSame( $selector, $css_rule->get_selector(), 'Return value of get_selector() does not match value passed to constructor.' );

		$expected = "$selector{{$css_declarations->get_declarations_string()}}";

		$this->assertSame( $expected, $css_rule->get_css(), 'Value returned by get_css() does not match expected declarations string.' );
	}

	/**
	 * Tests that declaration properties are deduplicated.
	 *
	 * @covers ::add_declarations
	 * @covers ::get_css
	 */
	public function test_should_dedupe_properties_in_rules() {
		$selector                    = '.taggart';
		$first_declaration           = array(
			'font-size' => '2rem',
		);
		$overwrite_first_declaration = array(
			'font-size' => '4px',
		);
		$css_rule                    = new WP_Style_Engine_CSS_Rule_Gutenberg( $selector, $first_declaration );
		$css_rule->add_declarations( new WP_Style_Engine_CSS_Declarations_Gutenberg( $overwrite_first_declaration ) );

		$expected = '.taggart{font-size:4px;}';
		$this->assertSame( $expected, $css_rule->get_css() );
	}

	/**
	 * Tests that declarations can be added to existing rules.
	 *
	 * @covers ::add_declarations
	 * @covers ::get_css
	 */
	public function test_should_add_declarations_to_existing_rules() {
		// Declarations using a WP_Style_Engine_CSS_Declarations object.
		$some_css_declarations = new WP_Style_Engine_CSS_Declarations_Gutenberg( array( 'margin-top' => '10px' ) );
		// Declarations using a property => value array.
		$some_more_css_declarations = array( 'font-size' => '1rem' );
		$css_rule                   = new WP_Style_Engine_CSS_Rule_Gutenberg( '.hill-street-blues', $some_css_declarations );
		$css_rule->add_declarations( $some_more_css_declarations );

		$expected = '.hill-street-blues{margin-top:10px;font-size:1rem;}';

		$this->assertSame( $expected, $css_rule->get_css() );
	}

	/**
	 * Tests setting a selector to a rule.
	 *
	 * @covers ::set_selector
	 */
	public function test_should_set_selector() {
		$selector = '.taggart';
		$css_rule = new WP_Style_Engine_CSS_Rule_Gutenberg( $selector );

		$this->assertSame( $selector, $css_rule->get_selector(), 'Return value of get_selector() does not match value passed to constructor.' );

		$css_rule->set_selector( '.law-and-order' );

		$this->assertSame( '.law-and-order', $css_rule->get_selector(), 'Return value of get_selector() does not match value passed to set_selector().' );
	}

	/**
	 * Tests generating a CSS rule string.
	 *
	 * @covers ::get_css
	 */
	public function test_should_generate_css_rule_string() {
		$selector           = '.chips';
		$input_declarations = array(
			'margin-top' => '10px',
			'font-size'  => '2rem',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations_Gutenberg( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule_Gutenberg( $selector, $css_declarations );
		$expected           = "$selector{{$css_declarations->get_declarations_string()}}";

		$this->assertSame( $expected, $css_rule->get_css() );
	}

	/**
	 * Tests that an empty string will be returned where there are no declarations in a CSS rule.
	 *
	 * @covers ::get_css
	 */
	public function test_should_return_empty_string_with_no_declarations() {
		$selector           = '.holmes';
		$input_declarations = array();
		$css_declarations   = new WP_Style_Engine_CSS_Declarations_Gutenberg( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule_Gutenberg( $selector, $css_declarations );

		$this->assertSame( '', $css_rule->get_css() );
	}

	/**
	 * Tests that CSS rules are prettified.
	 *
	 * @covers ::get_css
	 */
	public function test_should_prettify_css_rule_output() {
		$selector           = '.baptiste';
		$input_declarations = array(
			'margin-left' => '0',
			'font-family' => 'Detective Sans',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations_Gutenberg( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule_Gutenberg( $selector, $css_declarations );
		$expected           = '.baptiste {
	margin-left: 0;
	font-family: Detective Sans;
}';

		$this->assertSame( $expected, $css_rule->get_css( true ) );
	}

	/**
	 * Tests that a string of multiple selectors is trimmed.
	 *
	 * @covers ::get_css
	 */
	public function test_should_trim_multiple_selectors() {
		$selector           = '.poirot, .poirot:active, #miss-marple > .st-mary-mead ';
		$input_declarations = array(
			'margin-left' => '0',
			'font-family' => 'Detective Sans',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations_Gutenberg( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule_Gutenberg( $selector, $css_declarations );
		$expected           = '.poirot, .poirot:active, #miss-marple > .st-mary-mead {margin-left:0;font-family:Detective Sans;}';

		$this->assertSame( $expected, $css_rule->get_css(), 'Return value should be not prettified.' );

		$expected_prettified = '.poirot,
.poirot:active,
#miss-marple > .st-mary-mead {
	margin-left: 0;
	font-family: Detective Sans;
}';

		$this->assertSame( $expected_prettified, $css_rule->get_css( true ), 'Return value should be prettified with new lines and indents.' );
	}
}
