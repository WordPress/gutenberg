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
	 * Tear down after each test.
	 */
	public function tear_down() {
		parent::tear_down();
		WP_Style_Engine_CSS_Rules_Store::remove_all_stores();
	}
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
	public function test_get_store() {
		$new_fish_store = WP_Style_Engine_CSS_Rules_Store::get_store( 'fish-n-chips' );
		$selector       = '.haddock';

		$new_fish_store->add_rule( $selector )->get_selector();
		$this->assertEquals( $selector, $new_fish_store->add_rule( $selector )->get_selector() );

		$the_same_fish_store = WP_Style_Engine_CSS_Rules_Store::get_store( 'fish-n-chips' );
		$this->assertEquals( $selector, $the_same_fish_store->add_rule( $selector )->get_selector() );
	}

	/**
	 * Should return all previously created stores.
	 */
	public function test_get_stores() {
		$burrito_store    = WP_Style_Engine_CSS_Rules_Store::get_store( 'burrito' );
		$quesadilla_store = WP_Style_Engine_CSS_Rules_Store::get_store( 'quesadilla' );
		$this->assertEquals(
			array(
				'burrito'    => $burrito_store,
				'quesadilla' => $quesadilla_store,
			),
			WP_Style_Engine_CSS_Rules_Store::get_stores()
		);
	}

	/**
	 * Should delete all previously created stores.
	 */
	public function test_remove_all_stores() {
		$dolmades_store = WP_Style_Engine_CSS_Rules_Store::get_store( 'dolmades' );
		$tzatziki_store = WP_Style_Engine_CSS_Rules_Store::get_store( 'tzatziki' );
		$this->assertEquals(
			array(
				'dolmades' => $dolmades_store,
				'tzatziki' => $tzatziki_store,
			),
			WP_Style_Engine_CSS_Rules_Store::get_stores()
		);
		WP_Style_Engine_CSS_Rules_Store::remove_all_stores();
		$this->assertEquals(
			array(),
			WP_Style_Engine_CSS_Rules_Store::get_stores()
		);
	}

	/**
	 * Should return a stored rule.
	 */
	public function test_add_rule() {
		$new_pie_store = WP_Style_Engine_CSS_Rules_Store::get_store( 'meat-pie' );
		$selector      = '.wp-block-sauce a:hover';
		$store_rule    = $new_pie_store->add_rule( $selector );
		$expected      = '';
		$this->assertEquals( $expected, $store_rule->get_css() );

		$pie_declarations = array(
			'color'         => 'brown',
			'border-color'  => 'yellow',
			'border-radius' => '10rem',
		);
		$css_declarations = new WP_Style_Engine_CSS_Declarations( $pie_declarations );
		$store_rule->add_declarations( $css_declarations );

		$store_rule = $new_pie_store->add_rule( $selector );
		$expected   = "$selector{{$css_declarations->get_declarations_string()}}";
		$this->assertEquals( $expected, $store_rule->get_css() );
	}

	/**
	 * Should return all stored rules.
	 */
	public function test_get_all_rules() {
		$new_pizza_store = WP_Style_Engine_CSS_Rules_Store::get_store( 'pizza-with-mozzarella' );
		$selector        = '.wp-block-anchovies a:hover';
		$store_rule      = $new_pizza_store->add_rule( $selector );
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
		$store_rule->add_declarations( array( $css_declarations ) );

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
		$store_rule->add_declarations( array( $css_declarations ) );

		$expected = array(
			$selector => $store_rule,
		);
		$this->assertEquals( $expected, $new_pizza_store->get_all_rules() );

		$new_selector             = '.wp-block-mushroom a:hover';
		$newer_pizza_declarations = array(
			'padding' => '100px',
		);
		$new_store_rule           = $new_pizza_store->add_rule( $new_selector );
		$css_declarations         = new WP_Style_Engine_CSS_Declarations( $newer_pizza_declarations );
		$new_store_rule->add_declarations( array( $css_declarations ) );

		$expected = array(
			$selector     => $store_rule,
			$new_selector => $new_store_rule,
		);
		$this->assertEquals( $expected, $new_pizza_store->get_all_rules() );
	}
}
