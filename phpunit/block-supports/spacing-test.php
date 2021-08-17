<?php

/**
 * Test the Spacing block supports.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Spacing_Test extends WP_UnitTestCase {
	private $sample_block_content = '<div class="wp-block-test-block">Test</div>';

	function setUp() {
		parent::setUp();
	}

	function tearDown() {
		unregister_block_type( 'test/test-block' );

		parent::tearDown();
	}

	function test_spacing_gap_block_support_renders_block_inline_style() {
		$block = array(
			'blockName' => 'test/test-block',
			'attrs'     => array(
				'style' => array(
					'spacing' => array(
						'blockGap' => '3em',
					),
				),
			),
		);

		$test_block_args = array(
			'api_version' => 2,
			'supports'    => array(
				'spacing' => array(
					'blockGap' => true,
				),
			),
		);

		register_block_type( 'test/test-block', $test_block_args );
		$render_output = gutenberg_render_spacing_support( $this->sample_block_content, $block );

		$this->assertSame(
			'<div style="--wp--style--block-gap: 3em;" class="wp-block-test-block">Test</div>',
			$render_output
		);
	}

	function test_spacing_gap_block_support_renders_appended_block_inline_style() {
		$block = array(
			'blockName' => 'test/test-block',
			'attrs'     => array(
				'style' => array(
					'spacing' => array(
						'blockGap' => '3em',
					),
				),
			),
		);

		$test_block_args = array(
			'api_version' => 2,
			'supports'    => array(
				'spacing' => array(
					'blockGap' => true,
				),
			),
		);

		register_block_type( 'test/test-block', $test_block_args );
		$render_output = gutenberg_render_spacing_support(
			'<div class="wp-test-block" style="background: green;"><p style="color: red;">Test</p></div>',
			$block
		);

		$this->assertSame(
			'<div class="wp-test-block" style="--wp--style--block-gap: 3em; background: green;"><p style="color: red;">Test</p></div>',
			$render_output
		);
	}

	function test_spacing_gap_block_support_does_not_render_style_when_support_is_false() {
		$block = array(
			'blockName' => 'test/test-block',
			'attrs'     => array(
				'style' => array(
					'spacing' => array(
						'blockGap' => '3em',
					),
				),
			),
		);

		$test_block_args = array(
			'api_version' => 2,
			'supports'    => array(
				'spacing' => array(
					'blockGap' => false,
				),
			),
		);

		register_block_type( 'test/test-block', $test_block_args );
		$render_output = gutenberg_render_spacing_support( $this->sample_block_content, $block );

		$this->assertEquals(
			$this->sample_block_content,
			$render_output
		);
	}

	function test_spacing_gap_block_support_does_not_render_style_when_gap_is_null() {
		$block = array(
			'blockName' => 'test/test-block',
			'attrs'     => array(
				'style' => array(
					'spacing' => array(
						'blockGap' => null,
					),
				),
			),
		);

		$test_block_args = array(
			'api_version' => 2,
			'supports'    => array(
				'spacing' => array(
					'blockGap' => true,
				),
			),
		);

		register_block_type( 'test/test-block', $test_block_args );
		$render_output = gutenberg_render_spacing_support( $this->sample_block_content, $block );

		$this->assertEquals(
			$this->sample_block_content,
			$render_output
		);
	}
}
