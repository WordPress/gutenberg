<?php
/**
 * Tests the Style Engine CSS Rules group class.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */

/**
 * Tests for registering, storing and generating CSS rules groups.
 *
 * @group style-engine
 * @coversDefaultClass WP_Style_Engine_CSS_Rules_Group
 */
class WP_Style_Engine_CSS_Rules_Group_Test extends WP_UnitTestCase {
	/**
	 * Tests that declarations are set on instantiation.
	 *
	 * @covers ::__construct
	 */
	public function test_should_instantiate_with_selector_and_rules() {
		$rules_group = '#gecko';
		$css_rule    = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'&:hover',
			array(
				'background-position' => '50% 50%',
				'color'               => 'green',
			),
			$rules_group
		);
		$group = new WP_Style_Engine_CSS_Rules_Group_Gutenberg( $rules_group, $css_rule );

		$this->assertSame( $rules_group, $group->get_rule_group(), 'Return value of get_selector() does not match value passed to constructor.' );

		$expected = "$rules_group{{$css_rule->get_css()}}";

		$this->assertSame( $expected, $group->get_css(), 'Value returned by get_css() does not match expected CSS string.' );
	}

	/**
	 * Tests that empty values cannot be added.
	 *
	 * @covers ::add_rules
	 * @covers ::get_rules
	 */
	public function test_cannot_add_empty_values() {
		$css_container = new WP_Style_Engine_CSS_Rules_Group_Gutenberg( '@media not all and (hover: hover)' );

		$css_container->add_rules( '' );
		$this->assertEmpty( $css_container->get_rules(), 'Return value of get_rules() does not match expected rules when empty string added.' );

		$css_container->add_rules( array() );
		$this->assertEmpty( $css_container->get_rules(), 'Return value of get_rules() does not match expected rules when array() added.' );
	}

	/**
	 * Tests that nested rule declaration properties are deduplicated.
	 *
	 * @covers ::add_rules
	 * @covers ::get_css
	 */
	public function test_should_merge_existing_rule_declarations() {
		$rule_group    = '@media not all and (hover: hover)';
		$css_container = new WP_Style_Engine_CSS_Rules_Group_Gutenberg( $rule_group );
		$selector      = '.goanna';
		$css_rule_1    = new WP_Style_Engine_CSS_Rule_Gutenberg(
			$selector,
			array(
				'font-size' => '2rem',
			),
			$rule_group
		);
		$css_container->add_rules( $css_rule_1 );

		$this->assertSame( '@media not all and (hover: hover){.goanna{font-size:2rem;}}', $css_container->get_css(), 'Return value of get_css() does not match expected CSS container CSS.' );

		$css_rule_2 = new WP_Style_Engine_CSS_Rule_Gutenberg(
			$selector,
			array(
				'font-size' => '4px',
			),
			$rule_group
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
		$rules_group = '@media screen, print';
		$css_container = new WP_Style_Engine_CSS_Rules_Group_Gutenberg( $rules_group );

		$css_rule_1 = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'body',
			array(
				'line-height' => '0.1',
			),
			$rules_group
		);
		$css_container->add_rules( $css_rule_1 );

		$css_rule_2 = new WP_Style_Engine_CSS_Rule_Gutenberg(
			'p',
			array(
				'line-height' => '0.9',
			),
			$rules_group
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
	public function test_should_set_rule_group() {
		$css_container = new WP_Style_Engine_CSS_Rules_Group_Gutenberg( '@layer state' );

		$this->assertSame( '@layer state', $css_container->get_rule_group(), 'Return value of get_selector() does not match value passed to constructor.' );

		$css_container->set_rule_group( '@layer pony' );

		$this->assertSame( '@layer pony', $css_container->get_rule_group(), 'Return value of get_selector() does not match value passed to set_selector().' );
	}

	/**
	 * Tests generating a CSS rule string.
	 *
	 * @covers ::get_css
	 */
	public function test_should_generate_css_rule_string() {
		$rules_group        = '@layer sauce';
		$selector           = '.chips';
		$input_declarations = array(
			'margin-top' => '10px',
			'font-size'  => '2rem',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations_Gutenberg( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule_Gutenberg( $selector, $css_declarations, $rules_group );
		$css_container      = new WP_Style_Engine_CSS_Rules_Group_Gutenberg( $rules_group, $css_rule );
		$expected           = "{$rules_group}{{$selector}{{$css_declarations->get_declarations_string()}}}";

		$this->assertSame( $expected, $css_container->get_css() );
	}

	/**
	 * Tests that an empty string will be returned where there are no rules in a CSS container.
	 *
	 * @covers ::get_css
	 */
	public function test_should_return_empty_string_with_no_rules() {
		$selector           = '.droolio';
		$input_declarations = array();
		$css_declarations   = new WP_Style_Engine_CSS_Declarations_Gutenberg( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule_Gutenberg( $selector, $css_declarations );
		$css_container      = new WP_Style_Engine_CSS_Rules_Group_Gutenberg( '@layer coolio', $css_rule );

		$this->assertSame( '', $css_container->get_css() );
	}

	/**
	 * Tests that CSS containers are prettified.
	 *
	 * @covers ::get_css
	 */
	public function test_should_prettify_css_rule_output() {
		$rules_group        = '@container (width < 650px)';
		$selector           = '.baptiste';
		$input_declarations = array(
			'margin-left' => '0',
			'font-family' => 'Detective Sans',
		);
		$css_declarations   = new WP_Style_Engine_CSS_Declarations_Gutenberg( $input_declarations );
		$css_rule           = new WP_Style_Engine_CSS_Rule_Gutenberg( $selector, $css_declarations, $rules_group );
		$expected           = '@container (width < 650px) {
	.baptiste {
		margin-left: 0;
		font-family: Detective Sans;
	}
}';
		$css_container      = new WP_Style_Engine_CSS_Rules_Group_Gutenberg( $rules_group, $css_rule );

		$this->assertSame( $expected, $css_container->get_css( true ) );
	}
}
