<?php
/**
 * Tests the Style Engine CSS Rules Store class.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */

require __DIR__ . '/../class-wp-style-engine-css-rules-store.php';
require __DIR__ . '/../class-wp-style-engine-css-rule.php';
require __DIR__ . '/../class-wp-style-engine-css-declarations.php';

/**
 * Tests for registering, storing and retrieving CSS Rules.
 */
class WP_Style_Engine_CSS_Rules_Store_Test extends WP_UnitTestCase {
	/**
	 * Should create a new store.
	 */
	public function test_create_new_store() {
		$new_pancakes_store = WP_Style_Engine_CSS_Rules_Store::get_store( 'pancakes-with-strawberries' );
		$this->assertInstanceOf( 'WP_Style_Engine_CSS_Rules_Store', $new_pancakes_store );
	}

	/**
	 * Should return previously created store when the same selector key is passed.
	 */
	// public function test_get_store() {
	// $new_pancakes_store   = WP_Style_Engine_CSS_Rules_Store::get_store( 'pancakes-with-strawberries' );
	// $selector             = '.cream';
	// $pancake_declarations = array(
	// 'color' => 'white',
	// );
	// $new_pancakes_store->set_rule( $selector, $pancake_declarations );
	// $the_same_pancakes_store   = WP_Style_Engine_CSS_Rules_Store::get_store( 'pancakes-with-strawberries' );
	// $this->assertEquals( $pancake_declarations, $the_same_pancakes_store->get_rule( $selector )->get_declarations_array() );
	// }

	/**
	 * Should return a stored rule.
	 */
	public function test_get_rule() {
		$new_pie_store = WP_Style_Engine_CSS_Rules_Store::get_store( 'meat-pie' );
		$selector      = '.wp-block-sauce a:hover';
		$store_rule    = $new_pie_store->get_rule( $selector );
		$expected      = "$selector {}";
		$this->assertEquals( $expected, $store_rule->get_css() );

		$pie_declarations = array(
			'color'         => 'brown',
			'border-color'  => 'yellow',
			'border-radius' => '10rem',
		);
		$css_declarations = new WP_Style_Engine_CSS_Declarations( $pie_declarations );
		$store_rule->set_declarations( $css_declarations );

		$store_rule = $new_pie_store->get_rule( $selector );
		$expected   = "$selector {{$css_declarations->get_declarations_string()}}";
		$this->assertEquals( $expected, $store_rule->get_css() );
	}

	/**
	 * Should return all stored rules.
	 */
	public function test_get_all_rules() {
		$new_pizza_store = WP_Style_Engine_CSS_Rules_Store::get_store( 'pizza-with-mozzarella' );
		$selector        = '.wp-block-anchovies a:hover';
		$store_rule      = $new_pizza_store->get_rule( $selector );
		$expected        = array(
			$selector => $store_rule,
		);

		$this->assertEquals( $expected, $new_pizza_store->get_all_rules() );

		$pizza_declarations = array(
			'color'         => 'red',
			'border-color'  => 'yellow',
			'border-radius' => '10rem',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations( $pizza_declarations );
		$store_rule->set_declarations( array( $css_declarations ) );

		$expected = array(
			$selector => $store_rule,
		);
		$this->assertEquals( $expected, $new_pizza_store->get_all_rules() );

		$new_pizza_declarations = array(
			'color'        => 'red',
			'border-color' => 'red',
			'font-size'    => '10rem',
		);
		$css_declarations       = new WP_Style_Engine_CSS_Declarations( $new_pizza_declarations );
		$store_rule->set_declarations( array( $css_declarations ) );

		$expected = array(
			$selector => $store_rule,
		);
		$this->assertEquals( $expected, $new_pizza_store->get_all_rules() );

		$new_selector             = '.wp-block-mushroom a:hover';
		$newer_pizza_declarations = array(
			'padding' => '100px',
		);
		$new_store_rule           = $new_pizza_store->get_rule( $new_selector );
		$css_declarations         = new WP_Style_Engine_CSS_Declarations( $newer_pizza_declarations );
		$new_store_rule->set_declarations( array( $css_declarations ) );

		$expected = array(
			$selector     => $store_rule,
			$new_selector => $new_store_rule,
		);
		$this->assertEquals( $expected, $new_pizza_store->get_all_rules() );
	}
}
