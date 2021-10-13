<?php

/**
 * Test the Spacing block supports.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Spacing_Test extends WP_UnitTestCase {
	private $sample_block_content = '<div class="wp-block-test-block">Test</div>';
	private $test_gap_block_value = array();
	private $test_gap_block_args  = array();

	function setUp() {
		parent::setUp();

		$this->test_gap_block_value = array(
			'blockName' => 'test/test-block',
			'attrs'     => array(
				'style' => array(
					'spacing' => array(
						'blockGap' => '3em',
					),
				),
			),
		);

		$this->test_gap_block_args = array(
			'api_version' => 2,
			'supports'    => array(
				'spacing' => array(
					'blockGap' => true,
				),
			),
		);
	}

	function tearDown() {
		unregister_block_type( 'test/test-block' );

		parent::tearDown();
	}

	function test_spacing_gap_block_support_renders_block_inline_style() {
		register_block_type( 'test/test-block', $this->test_gap_block_args );
		$render_output = gutenberg_render_spacing_gap_support(
			$this->sample_block_content,
			$this->test_gap_block_value
		);

		$this->assertSame(
			'<div style="--wp--style--block-gap: 3em" class="wp-block-test-block">Test</div>',
			$render_output
		);
	}

	function test_spacing_gap_block_support_renders_block_inline_style_with_inner_tag() {
		register_block_type( 'test/test-block', $this->test_gap_block_args );
		$render_output = gutenberg_render_spacing_gap_support(
			'<div class="wp-test-block"><p style="color: red;">Test</p></div>',
			$this->test_gap_block_value
		);

		$this->assertSame(
			'<div style="--wp--style--block-gap: 3em" class="wp-test-block"><p style="color: red;">Test</p></div>',
			$render_output
		);
	}

	function test_spacing_gap_block_support_renders_block_inline_style_with_no_other_attributes() {
		register_block_type( 'test/test-block', $this->test_gap_block_args );
		$render_output = gutenberg_render_spacing_gap_support(
			'<div><p>Test</p></div>',
			$this->test_gap_block_value
		);

		$this->assertSame(
			'<div style="--wp--style--block-gap: 3em"><p>Test</p></div>',
			$render_output
		);
	}

	function test_spacing_gap_block_support_renders_appended_block_inline_style() {
		register_block_type( 'test/test-block', $this->test_gap_block_args );
		$render_output = gutenberg_render_spacing_gap_support(
			'<div class="wp-test-block" style="background: green;"><p style="color: red;">Test</p></div>',
			$this->test_gap_block_value
		);

		$this->assertSame(
			'<div class="wp-test-block" style="--wp--style--block-gap: 3em; background: green;"><p style="color: red;">Test</p></div>',
			$render_output
		);
	}

	function test_spacing_gap_block_support_does_not_render_style_when_support_is_false() {
		$this->test_gap_block_args['supports']['spacing']['blockGap'] = false;

		register_block_type( 'test/test-block', $this->test_gap_block_args );
		$render_output = gutenberg_render_spacing_gap_support(
			$this->sample_block_content,
			$this->test_gap_block_value
		);

		$this->assertEquals(
			$this->sample_block_content,
			$render_output
		);
	}

	function test_spacing_gap_block_support_does_not_render_style_when_gap_is_null() {
		$this->test_gap_block_value['attrs']['style']['spacing']['blockGap'] = null;
		$this->test_gap_block_args['supports']['spacing']['blockGap']        = true;

		register_block_type( 'test/test-block', $this->test_gap_block_args );
		$render_output = gutenberg_render_spacing_gap_support(
			$this->sample_block_content,
			$this->test_gap_block_value
		);

		$this->assertEquals(
			$this->sample_block_content,
			$render_output
		);
	}

	function test_spacing_gap_block_support_does_not_render_style_when_gap_is_illegal_value() {
		$this->test_gap_block_value['attrs']['style']['spacing']['blockGap'] = '" javascript="alert("hello");';
		$this->test_gap_block_args['supports']['spacing']['blockGap']        = true;

		register_block_type( 'test/test-block', $this->test_gap_block_args );
		$render_output = gutenberg_render_spacing_gap_support(
			$this->sample_block_content,
			$this->test_gap_block_value
		);

		$this->assertEquals(
			$this->sample_block_content,
			$render_output
		);
	}
}
