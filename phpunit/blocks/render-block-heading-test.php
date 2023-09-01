<?php
/**
 * Heading block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Heading block.
 *
 * @group blocks
 */
class Render_Block_Heading_Test extends WP_UnitTestCase {


	/**
	 * @covers ::gutenberg_block_core_heading_render
	 * @dataProvider add_css_class_test_examples
	 */
	public function test_block_core_heading_render_appends_css_class_to_a_vanilla_element( $input, $expected_result ) {
		$actual = gutenberg_block_core_heading_render( array(), $input );
		$this->assertEquals( $expected_result, $actual );
	}

	public function add_css_class_test_examples() {
		return array(
			'should add a class name to a vanilla h2 element' => array(
				'<h2>Hello World</h2>',
				'<h2 class="wp-block-heading">Hello World</h2>',
			),
			'should not add a class name to a header element' => array(
				'<header>Hello World</header>',
				'<header>Hello World</header>',
			),
			'should not add a class name to a span element' => array(
				'<span>Hello World</span>',
				'<span>Hello World</span>',
			),
			'should not add a class name to an invalid h7 element' => array(
				'<h7>Hello World</h7>',
				'<h7>Hello World</h7>',
			),
			'should add a class name even when the class attribute is already defined' => array(
				'<h2 class="is-align-right">Hello World</h2>',
				'<h2 class="is-align-right wp-block-heading">Hello World</h2>',
			),
			'should handle single quotes'                => array(
				"<h2 class='is-align-right'>Hello World</h2>",
				'<h2 class="is-align-right wp-block-heading">Hello World</h2>',
			),
			'should handle single quotes with double quotes inside' => array(
				"<h2 class='\" is-align-right'>Hello World</h2>",
				'<h2 class="&quot; is-align-right wp-block-heading">Hello World</h2>',
			),
			'should not add a class name even when it is already defined' => array(
				'<h2 class="is-align-right wp-block-heading">Hello World</h2>',
				'<h2 class="is-align-right wp-block-heading">Hello World</h2>',
			),
			'should add a class name even when there are other HTML attributes present' => array(
				'<h2 style="display: block">Hello World</h2>',
				'<h2 class="wp-block-heading" style="display: block">Hello World</h2>',
			),
			'should add a class name even when the class attribute is already defined and has many entries' => array(
				'<h2 class="is-align-right custom   classes">Hello World</h2>',
				'<h2 class="is-align-right custom   classes wp-block-heading">Hello World</h2>',
			),
			'should not add a class name to a nested h2' => array(
				'<h2 class="is-align-right custom classes"><h2>Hello World</h2></h2>',
				'<h2 class="is-align-right custom classes wp-block-heading"><h2>Hello World</h2></h2>',
			),
			'should not add a class name to a nested h2 when the parent has another attribute' => array(
				'<h2 style="display: block" class="is-align-right"><h2>Hello World</h2></h2>',
				'<h2 style="display: block" class="is-align-right wp-block-heading"><h2>Hello World</h2></h2>',
			),
			'should add a class name even when the class attribute is surrounded by other attributes' => array(
				'<h2 style="display: block" class="is-align-right" data-class="corner case!"><h2>Hello World</h2></h2>',
				'<h2 style="display: block" class="is-align-right wp-block-heading" data-class="corner case!"><h2>Hello World</h2></h2>',
			),
			'should add a class name without getting confused when there is a tricky data-class attribute present' => array(
				'<h2 data-class="corner case!" style="display: block" class="is-align-right"><h2>Hello World</h2></h2>',
				'<h2 data-class="corner case!" style="display: block" class="is-align-right wp-block-heading"><h2>Hello World</h2></h2>',
			),
		);
	}
}
