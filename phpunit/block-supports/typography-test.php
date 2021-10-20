<?php

/**
 * Test the typography block supports.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Typography_Test extends WP_UnitTestCase {

	function test_font_size_slug_with_numbers_is_kebab_cased_properly() {
		register_block_type(
			'test/font-size-slug-with-numbers',
			array(
				'api_version' => 2,
				'attributes'  => array(
					'fontSize' => array(
						'type' => 'string',
					),
				),
				'supports'    => array(
					'typography' => array(
						'fontSize' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( 'test/font-size-slug-with-numbers' );

		$block_atts = array( 'fontSize' => 'h1' );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array( 'class' => 'has-h-1-font-size' );

		$this->assertSame( $expected, $actual );
		unregister_block_type( 'test/font-size-slug-with-numbers' );
	}

	function test_font_family_with_legacy_inline_styles_using_a_value() {
		$block_name = 'test/font-family-with-inline-styles-using-value';
		register_block_type(
			$block_name,
			array(
				'api_version' => 2,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'typography' => array(
						'__experimentalFontFamily' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $block_name );
		$block_atts = array( 'style' => array( 'typography' => array( 'fontFamily' => 'serif' ) ) );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array( 'style' => 'font-family: serif;' );

		$this->assertSame( $expected, $actual );
		unregister_block_type( $block_name );
	}

	function test_font_family_with_legacy_inline_styles_using_a_css_var() {
		$block_name = 'test/font-family-with-inline-styles-using-css-var';
		register_block_type(
			$block_name,
			array(
				'api_version' => 2,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'typography' => array(
						'__experimentalFontFamily' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $block_name );
		$block_atts = array( 'style' => array( 'typography' => array( 'fontFamily' => 'var:preset|font-family|h1' ) ) );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array( 'style' => 'font-family: var(--wp--preset--font-family--h-1);' );

		$this->assertSame( $expected, $actual );
		unregister_block_type( $block_name );
	}

	function test_font_family_with_class() {
		$block_name = 'test/font-family-with-class';
		register_block_type(
			$block_name,
			array(
				'api_version' => 2,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'typography' => array(
						'__experimentalFontFamily' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $block_name );
		$block_atts = array( 'fontFamily' => 'h1' );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array( 'class' => 'has-h-1-font-family' );

		$this->assertSame( $expected, $actual );
		unregister_block_type( $block_name );
	}

}
