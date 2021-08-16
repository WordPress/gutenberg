<?php

/**
 * Test the Spacing block supports.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Spacing_Test extends WP_UnitTestCase {
	private $old_wp_styles;
	private $sample_block_content = '<div class="wp-block-test-block">Test</div>';

	function setUp() {
		parent::setUp();

		if ( empty( $GLOBALS['wp_styles'] ) ) {
			$GLOBALS['wp_styles'] = null;
		}

		$this->old_wp_styles = $GLOBALS['wp_styles'];

		remove_action( 'wp_default_styles', 'wp_default_styles' );
		remove_action( 'wp_print_styles', 'print_emoji_styles' );

		$GLOBALS['wp_styles']                  = new WP_Styles();
		$GLOBALS['wp_styles']->default_version = get_bloginfo( 'version' );

		$GLOBALS['wp_scripts']                  = new WP_Scripts();
		$GLOBALS['wp_scripts']->default_version = get_bloginfo( 'version' );
	}

	function tearDown() {
		unregister_block_type( 'test/test-block' );

		$GLOBALS['wp_styles'] = $this->old_wp_styles;

		add_action( 'wp_default_styles', 'wp_default_styles' );
		add_action( 'wp_print_styles', 'print_emoji_styles' );

		parent::tearDown();
	}

	private function get_footer_styles() {
		ob_start();
		wp_footer();
		$wp_footer_output = ob_get_contents();
		ob_end_clean();

		return $wp_footer_output;
	}

	function test_spacing_gap_block_support_renders_block_style() {
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
		$render_output    = gutenberg_render_spacing_support( $this->sample_block_content, $block );
		$wp_footer_output = $this->get_footer_styles();

		$expected_content_pattern = '/^<div class="wp-container-([a-z0-9]{13}) wp-block-test-block">Test<\/div>$/';
		$matches                  = array();
		$found_match              = preg_match(
			$expected_content_pattern,
			$render_output,
			$matches
		);

		$this->assertSame(
			1,
			$found_match,
			sprintf(
				"Rendered block content did not match pattern: %s\n\nActual block rendered content:\n\n%s",
				$expected_content_pattern,
				$render_output
			)
		);

		$container_id = $matches[1];

		$this->assertEquals(
			'<style>.wp-container-' . $container_id . ' { --wp--style--block-gap: 3em; }</style>',
			$wp_footer_output
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
		$render_output    = gutenberg_render_spacing_support( $this->sample_block_content, $block );
		$wp_footer_output = $this->get_footer_styles();

		$this->assertEquals(
			$this->sample_block_content,
			$render_output
		);

		$this->assertEquals(
			'',
			$wp_footer_output
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
		$render_output    = gutenberg_render_spacing_support( $this->sample_block_content, $block );
		$wp_footer_output = $this->get_footer_styles();

		$this->assertEquals(
			$this->sample_block_content,
			$render_output
		);

		$this->assertEquals(
			'',
			$wp_footer_output
		);
	}
}
