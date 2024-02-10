<?php
/**
 * Tests the Style Engine CSS Rules Container class.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */

/**
 * Tests for registering, storing and generating CSS rules containers.
 *
 * @group style-engine
 * @coversDefaultClass WP_Style_Engine_CSS_Rules_Container
 */
class WP_Style_Engine_CSS_Rules_Container_Test extends WP_UnitTestCase {
	/**
	 * Tests that declarations are set on instantiation.
	 *
	 * @covers ::__construct
	 */
	public function test_should_instantiate_with_selector_and_rules() {
		$container_selector = '#gecko';
		$css_rule           = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'&:hover',
			array(
				'background-position' => '50% 50%',
				'color'               => 'green',
			)
		);
		$css_container      = new WP_Style_Engine_CSS_Rules_Container_Gutenberg( $container_selector, $css_rule );

		$this->assertSame( $container_selector, $css_container->get_selector(), 'Return value of get_selector() does not match value passed to constructor.' );

		$expected = "$container_selector{{$css_rule->get_css()}}";

		$this->assertSame( $expected, $css_container->get_css(), 'Value returned by get_css() does not match expected CSS string.' );
	}

	/**
	 * Tests that only WP_Style_Engine_CSS_Rule can be added to a container.
	 *
	 * @covers ::add_rules
	 * @covers ::get_rules
	 */
	public function test_should_only_add_rule_objects() {
		$css_container = new WP_Style_Engine_CSS_Rules_Container_Gutenberg( '@media not all and (hover: hover)' );
		$selector      = '.goanna';
		$css_rule_1    = new WP_Style_Engine_CSS_Rule_Gutenberg(
			$selector,
			array(
				'font-size' => '2rem',
			)
		);
		$css_container->add_rules( '' );
		$this->assertSame( array(), $css_container->get_rules(), 'Return value of get_rules() does not match expected rules.' );
	}

	/**
	 * Tests that nested rule declaration properties are deduplicated.
	 *
	 * @covers ::add_rules
	 * @covers ::get_css
	 */
	public function test_should_dedupe_properties_in_rules() {
		$css_container = new WP_Style_Engine_CSS_Rules_Container_Gutenberg( '@media not all and (hover: hover)' );
		$selector      = '.goanna';
		$css_rule_1    = new WP_Style_Engine_CSS_Rule_Gutenberg(
			$selector,
			array(
				'font-size' => '2rem',
			)
		);
		$css_container->add_rules( $css_rule_1 );

		$this->assertSame( '@media not all and (hover: hover){.goanna{font-size:2rem;}}', $css_container->get_css(), 'Return value of get_css() does not match expected CSS container CSS.' );

		$css_rule_2 = new WP_Style_Engine_CSS_Rule_Gutenberg(
			$selector,
			array(
				'font-size' => '4px',
			)
		);
		$css_container->add_rules( $css_rule_2 );

		$this->assertSame( '@media not all and (hover: hover){.goanna{font-size:4px;}}', $css_container->get_css(), 'Return value of get_css() does not match expected value with overwritten rule declaration.' );
	}

	/**
	 * Tests that rules can be added to existing containers.
	 *
	 * @covers ::add_rules
	 * @covers ::get_rule
	 * @covers ::get_css
	 */
	public function test_should_add_rules_to_existing_containers() {
		$css_container = new WP_Style_Engine_CSS_Rules_Container_Gutenberg( '@media screen, print' );

		$css_rule_1 = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'body',
			array(
				'line-height' => '0.1',
			)
		);
		$css_container->add_rules( $css_rule_1 );

		$css_rule_2 = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'p',
			array(
				'line-height' => '0.9',
			)
		);
		$css_container->add_rules( $css_rule_2 );

		$this->assertEquals( $css_rule_2, $css_container->get_rule( 'p' ), 'Return value of get_rule() does not match expected value.' );

		$expected = '@media screen, print{body{line-height:0.1;}p{line-height:0.9;}}';

		$this->assertSame( $expected, $css_container->get_css(), 'Return value of get_css() does not match expected value.' );
	}

	/**
	 * Tests setting a selector to a container.
	 *
	 * @covers ::set_selector
	 */
	public function test_should_set_selector() {
		$css_container = new WP_Style_Engine_CSS_Rules_Container_Gutenberg( '@layer state' );

		$this->assertSame( '@layer state', $css_container->get_selector(), 'Return value of get_selector() does not match value passed to constructor.' );

		$css_container->set_selector( '@layer pony' );

		$this->assertSame( '@layer pony', $css_container->get_selector(), 'Return value of get_selector() does not match value passed to set_selector().' );
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
		$css_container      = new WP_Style_Engine_CSS_Rules_Container_Gutenberg( '@layer sauce', $css_rule );
		$expected           = "@layer sauce{{$selector}{{$css_declarations->get_declarations_string()}}}";

		$this->assertSame( $expected, $css_container->get_css() );
	}

	/**
	 * Tests that an empty string will be returned where there are no rules in a CSS container.
	 *
	 * @covers ::get_css
	 */
	public function test_should_return_empty_string_with_no_rules() {
		$selector           = '.holmes';
		$input_declarations = array();
		$css_declarations   = new WP_Style_Engine_CSS_Declarations_Gutenberg( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule_Gutenberg( $selector, $css_declarations );
		$css_container      = new WP_Style_Engine_CSS_Rules_Container_Gutenberg( '@layer sauce', $css_rule );

		$this->assertSame( '', $css_container->get_css() );
	}

	/**
	 * Tests that CSS containers are prettified.
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
		$expected           = '@container (width < 650px) {
	.baptiste {
		margin-left: 0;
		font-family: Detective Sans;
	}
}';
		$css_container      = new WP_Style_Engine_CSS_Rules_Container_Gutenberg( '@container (width < 650px)', $css_rule );

		$this->assertSame( $expected, $css_container->get_css( true ) );
	}
}
