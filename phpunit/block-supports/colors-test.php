<?php

/**
 * Test the typography block supports.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Colors_Test extends WP_UnitTestCase {

	function test_color_slugs_with_numbers_are_kebab_cased_properly() {
		register_block_type(
			'test/color-slug-with-numbers',
			array(
				'api_version' => 2,
				'attributes'  => array(
					'textColor'       => array(
						'type' => 'string',
					),
					'backgroundColor' => array(
						'type' => 'string',
					),
					'gradient'        => array(
						'type' => 'string',
					),
				),
				'supports'    => array(
					'color' => array(
						'text'       => true,
						'background' => true,
						'gradients'  => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( 'test/color-slug-with-numbers' );

		$block_atts = array(
			'textColor'       => 'fg1',
			'backgroundColor' => 'bg2',
			'gradient'        => 'gr3',
		);

		$actual   = gutenberg_apply_colors_support( $block_type, $block_atts );
		$expected = array( 'class' => 'has-text-color has-fg-1-color has-background has-bg-2-background-color has-background has-gr-3-gradient-background' );

		$this->assertSame( $expected, $actual );
		unregister_block_type( 'test/color-slug-with-numbers' );
	}
}
