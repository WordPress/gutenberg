<?php

/**
 * Test the dimensions block supports.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Dimensions_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
	}

	public function tear_down() {
		unregister_block_type( $this->test_block_name );
		$this->test_block_name = null;
		parent::tear_down();
	}

	public function test_dimensions_style_is_applied() {
		$this->test_block_name = 'test/dimensions-style-is-applied';
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
					'dimensions' => array(
						'minHeight' => true,
					),
				),
			)
		);
		$registry    = WP_Block_Type_Registry::get_instance();
		$block_type  = $registry->get_registered( $this->test_block_name );
		$block_attrs = array(
			'style' => array(
				'dimensions' => array(
					'minHeight' => '50vh',
				),
			),
		);

		$actual   = gutenberg_apply_dimensions_support( $block_type, $block_attrs );
		$expected = array(
			'style' => 'min-height:50vh;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_dimensions_with_skipped_serialization_block_supports() {
		$this->test_block_name = 'test/dimensions-with-skipped-serialization-block-supports';
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
					'dimensions' => array(
						'minHeight'                       => true,
						'__experimentalSkipSerialization' => true,
					),
				),
			)
		);
		$registry    = WP_Block_Type_Registry::get_instance();
		$block_type  = $registry->get_registered( $this->test_block_name );
		$block_attrs = array(
			'style' => array(
				'dimensions' => array(
					'minHeight' => '50vh',
				),
			),
		);

		$actual   = gutenberg_apply_dimensions_support( $block_type, $block_attrs );
		$expected = array();

		$this->assertSame( $expected, $actual );
	}

	public function test_min_height_with_individual_skipped_serialization_block_supports() {
		$this->test_block_name = 'test/min-height-with-individual-skipped-serialization-block-supports';
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
					'dimensions' => array(
						'minHeight'                       => true,
						'__experimentalSkipSerialization' => array( 'minHeight' ),
					),
				),
			)
		);
		$registry    = WP_Block_Type_Registry::get_instance();
		$block_type  = $registry->get_registered( $this->test_block_name );
		$block_attrs = array(
			'style' => array(
				'dimensions' => array(
					'minHeight' => '50vh',
				),
			),
		);

		$actual = gutenberg_apply_dimensions_support( $block_type, $block_attrs );

		/*
		 * There is currently only one dimensions property available,
		 * so the expected result is an empty array. This test exists
		 * so that as new properties are added, this test can be expanded
		 * to check that skipping individual serialization works as expected.
		 */
		$expected = array();

		$this->assertSame( $expected, $actual );
	}
}
