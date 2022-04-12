<?php

/**
 * Test the border block supports.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Border_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	function setUp() {
		parent::setUp();
		$this->test_block_name = null;
	}

	function tearDown() {
		unregister_block_type( $this->test_block_name );
		$this->test_block_name = null;
		parent::tearDown();
	}

	function test_border_color_slug_with_numbers_is_kebab_cased_properly() {
		$this->test_block_name = 'test/border-color-slug-with-numbers-is-kebab-cased-properly';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 2,
				'attributes'  => array(
					'borderColor' => array(
						'type' => 'string',
					),
					'style'       => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'__experimentalBorder' => array(
						'color'  => true,
						'radius' => true,
						'width'  => true,
						'style'  => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array(
			'borderColor' => 'red',
			'style'       => array(
				'border' => array(
					'radius' => '10px',
					'width'  => '1px',
					'style'  => 'dashed',
				),
			),
		);

		$actual   = gutenberg_apply_border_support( $block_type, $block_atts );
		$expected = array(
			'class' => 'has-border-color has-red-border-color',
			'style' => 'border-radius: 10px; border-style: dashed; border-width: 1px;',
		);

		$this->assertSame( $expected, $actual );
	}

	function test_border_with_skipped_serialization_block_supports() {
		$this->test_block_name = 'test/border-with-skipped-serialization-block-supports';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 2,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'__experimentalBorder' => array(
						'color'                           => true,
						'radius'                          => true,
						'width'                           => true,
						'style'                           => true,
						'__experimentalSkipSerialization' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array(
			'style' => array(
				'border' => array(
					'color'  => '#eeeeee',
					'width'  => '1px',
					'style'  => 'dotted',
					'radius' => '10px',
				),
			),
		);

		$actual   = gutenberg_apply_border_support( $block_type, $block_atts );
		$expected = array();

		$this->assertSame( $expected, $actual );
	}

	function test_radius_with_individual_skipped_serialization_block_supports() {
		$this->test_block_name = 'test/radius-with-individual-skipped-serialization-block-supports';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 2,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'__experimentalBorder' => array(
						'color'                           => true,
						'radius'                          => true,
						'width'                           => true,
						'style'                           => true,
						'__experimentalSkipSerialization' => array( 'radius', 'color' ),
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array(
			'style' => array(
				'border' => array(
					'color'  => '#eeeeee',
					'width'  => '1px',
					'style'  => 'dotted',
					'radius' => '10px',
				),
			),
		);

		$actual   = gutenberg_apply_border_support( $block_type, $block_atts );
		$expected = array(
			'style' => 'border-style: dotted; border-width: 1px;',
		);

		$this->assertSame( $expected, $actual );
	}
}
