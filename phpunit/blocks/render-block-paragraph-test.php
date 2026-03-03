<?php
/**
 * Paragraph block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Paragraph block.
 *
 * @group blocks
 */
class Render_Block_Paragraph_Test extends WP_UnitTestCase {

	/**
	 * @dataProvider data_css_class_examples
	 *
	 * @param string $input           The input HTML.
	 * @param string $expected_result The expected result HTML.
	 */
	public function test_block_core_paragraph_render_appends_css_class_to_a_vanilla_element( $input, $expected_result ) {
		$parsed_blocks = parse_blocks( '<!-- wp:paragraph -->' . $input . '<!-- /wp:paragraph -->' );
		$block         = new WP_Block( $parsed_blocks[0] );
		$actual        = $block->render();
		$this->assertEquals( $expected_result, $actual );
	}

	public function data_css_class_examples() {
		return array(
			'should add a class name to a vanilla p element' => array(
				'<p>Hello World</p>',
				'<p class="wp-block-paragraph">Hello World</p>',
			),
			'should not add a class name to a div element' => array(
				'<div>Hello World</div>',
				'<div>Hello World</div>',
			),
			'should not add a class name to a span element' => array(
				'<span>Hello World</span>',
				'<span>Hello World</span>',
			),
			'should not add a class name to a heading element' => array(
				'<h2>Hello World</h2>',
				'<h2>Hello World</h2>',
			),
			'should add a class name even when the class attribute is already defined' => array(
				'<p class="is-align-right">Hello World</p>',
				'<p class="is-align-right wp-block-paragraph">Hello World</p>',
			),
			'should handle single quotes'                  => array(
				"<p class='is-align-right'>Hello World</p>",
				'<p class="is-align-right wp-block-paragraph">Hello World</p>',
			),
			'should handle single quotes with double quotes inside' => array(
				"<p class='\" is-align-right'>Hello World</p>",
				'<p class="&quot; is-align-right wp-block-paragraph">Hello World</p>',
			),
			'should not add a class name even when it is already defined' => array(
				'<p class="is-align-right wp-block-paragraph">Hello World</p>',
				'<p class="is-align-right wp-block-paragraph">Hello World</p>',
			),
			'should add a class name even when there are other HTML attributes present' => array(
				'<p style="display: block">Hello World</p>',
				'<p class="wp-block-paragraph" style="display: block">Hello World</p>',
			),
			'should add a class name even when the class attribute is already defined and has many entries' => array(
				'<p class="is-align-right custom   classes">Hello World</p>',
				'<p class="is-align-right custom   classes wp-block-paragraph">Hello World</p>',
			),
			'should not add a class name to a nested p'    => array(
				'<p class="is-align-right custom classes"><p>Hello World</p></p>',
				'<p class="is-align-right custom classes wp-block-paragraph"><p>Hello World</p></p>',
			),
			'should not add a class name to a nested p when the parent has another attribute' => array(
				'<p style="display: block" class="is-align-right"><p>Hello World</p></p>',
				'<p style="display: block" class="is-align-right wp-block-paragraph"><p>Hello World</p></p>',
			),
			'should add a class name even when the class attribute is surrounded by other attributes' => array(
				'<p style="display: block" class="is-align-right" data-class="corner case!"><p>Hello World</p></p>',
				'<p style="display: block" class="is-align-right wp-block-paragraph" data-class="corner case!"><p>Hello World</p></p>',
			),
			'should add a class name without getting confused when there is a tricky data-class attribute present' => array(
				'<p data-class="corner case!" style="display: block" class="is-align-right"><p>Hello World</p></p>',
				'<p data-class="corner case!" style="display: block" class="is-align-right wp-block-paragraph"><p>Hello World</p></p>',
			),
		);
	}
}
