<?php
/**
 * Tests the Style Engine CSS Rule class.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */

require __DIR__ . '/../class-wp-style-engine-css-rule.php';
require __DIR__ . '/../class-wp-style-engine-css-declarations.php';

/**
 * Tests for registering, storing and generating CSS declarations.
 */
class WP_Style_Engine_CSS_Rule_Test extends WP_UnitTestCase {
	/**
	 * Should set declarations on instantiation.
	 */
	public function test_instantiate_with_selector_and_rules() {
		$selector           = '.law-and-order';
		$input_declarations = array(
			'margin-top' => '10px',
			'font-size'  => '2rem',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule( $selector, $css_declarations );

		$this->assertSame( $selector, $css_rule->get_selector() );

		$expected = "$selector{{$css_declarations->get_declarations_string()}}";
		$this->assertSame( $expected, $css_rule->get_css() );
	}

	/**
	 * Test dedupe declaration properties.
	 */
	public function test_dedupe_properties_in_rules() {
		$selector                    = '.taggart';
		$first_declaration           = array(
			'font-size' => '2rem',
		);
		$overwrite_first_declaration = array(
			'font-size' => '4px',
		);
		$css_rule                    = new WP_Style_Engine_CSS_Rule( $selector, $first_declaration );
		$css_rule->add_declarations( new WP_Style_Engine_CSS_Declarations( $overwrite_first_declaration ) );

		$expected = '.taggart{font-size:4px;}';
		$this->assertSame( $expected, $css_rule->get_css() );
	}

	/**
	 * Should add declarations.
	 */
	public function test_add_declarations() {
		// Declarations using a WP_Style_Engine_CSS_Declarations object.
		$some_css_declarations = new WP_Style_Engine_CSS_Declarations( array( 'margin-top' => '10px' ) );
		// Declarations using a property => value array.
		$some_more_css_declarations = array( 'font-size' => '1rem' );
		$css_rule                   = new WP_Style_Engine_CSS_Rule( '.hill-street-blues', $some_css_declarations );
		$css_rule->add_declarations( $some_more_css_declarations );

		$expected = '.hill-street-blues{margin-top:10px;font-size:1rem;}';
		$this->assertSame( $expected, $css_rule->get_css() );
	}

	/**
	 * Should set selector.
	 */
	public function test_set_selector() {
		$selector = '.taggart';
		$css_rule = new WP_Style_Engine_CSS_Rule( $selector );

		$this->assertSame( $selector, $css_rule->get_selector() );

		$css_rule->set_selector( '.law-and-order' );

		$this->assertSame( '.law-and-order', $css_rule->get_selector() );
	}

	/**
	 * Should generate CSS rules.
	 */
	public function test_get_css() {
		$selector           = '.chips';
		$input_declarations = array(
			'margin-top' => '10px',
			'font-size'  => '2rem',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule( $selector, $css_declarations );
		$expected           = "$selector{{$css_declarations->get_declarations_string()}}";

		$this->assertSame( $expected, $css_rule->get_css() );
	}

	/**
	 * Should return empty string with no declarations.
	 */
	public function test_get_css_no_declarations() {
		$selector           = '.holmes';
		$input_declarations = array();
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule( $selector, $css_declarations );

		$this->assertSame( '', $css_rule->get_css() );
	}

	/**
	 * Should generate prettified CSS rules.
	 */
	public function test_get_prettified_css() {
		$selector           = '.baptiste';
		$input_declarations = array(
			'margin-left' => '0',
			'font-family' => 'Detective Sans',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule( $selector, $css_declarations );
		$expected           = '.baptiste {
	margin-left: 0;
	font-family: Detective Sans;
}';

		$this->assertSame( $expected, $css_rule->get_css( true ) );
	}
}
