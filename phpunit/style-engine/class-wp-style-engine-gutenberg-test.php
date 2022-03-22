<?php
/**
 * Tests the Style Engine class and associated functionality.
 *
 * @package    Gutenberg
 * @subpackage block-library
 */

/**
 * Tests for registering, storing and generating styles.
 */
class WP_Style_Engine_Gutenberg_Test extends WP_UnitTestCase {
	function test_returns_inline_styles_from_string() {
		$style_engine   = WP_Style_Engine_Gutenberg::get_instance();
		$block_styles   = array(
			'spacing' => array(
				'padding' => '111px',
			),
		);
		$padding_styles = $style_engine->get_inline_css_from_block_styles(
			$block_styles,
			array( 'spacing', 'padding' )
		);
		$expected       = 'padding:111px;';
		$this->assertSame( $expected, $padding_styles );
	}

	function test_returns_inline_styles_from_box_rules() {
		$style_engine   = WP_Style_Engine_Gutenberg::get_instance();
		$block_styles   = array(
			'spacing' => array(
				'padding' => array(
					'top'    => '42px',
					'left'   => '2%',
					'bottom' => '44px',
					'right'  => '5rem',
				),
			),
		);
		$padding_styles = $style_engine->get_inline_css_from_block_styles(
			$block_styles,
			array( 'spacing', 'padding' )
		);
		$expected       = 'padding-top:42px;padding-left:2%;padding-bottom:44px;padding-right:5rem;';
		$this->assertSame( $expected, $padding_styles );
	}

	function test_returns_empty_string_when_invalid_path_passed() {
		$style_engine   = WP_Style_Engine_Gutenberg::get_instance();
		$block_styles   = array(
			'spacing' => array(
				'padding' => '111px',
			),
		);
		$padding_styles = $style_engine->get_inline_css_from_block_styles(
			$block_styles,
			null
		);
		$expected       = '';
		$this->assertSame( $expected, $padding_styles );
	}
}
