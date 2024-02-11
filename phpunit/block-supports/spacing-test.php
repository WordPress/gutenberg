<?php

/**
 * Test the spacing block supports.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Spacing_Test extends WP_UnitTestCase {
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

	public function test_spacing_style_is_applied() {
		$this->test_block_name = 'test/spacing-style-is-applied';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'spacing' => array(
						'margin'   => true,
						'padding'  => true,
						'blockGap' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array(
			'style' => array(
				'spacing' => array(
					'margin'   => array(
						'top'    => '1px',
						'right'  => '2px',
						'bottom' => '3px',
						'left'   => '4px',
					),
					'padding'  => '111px',
					'blockGap' => '2em',
				),
			),
		);

		$actual   = gutenberg_apply_spacing_support( $block_type, $block_atts );
		$expected = array(
			'style' => 'padding:111px;margin-top:1px;margin-right:2px;margin-bottom:3px;margin-left:4px;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_spacing_with_skipped_serialization_block_supports() {
		$this->test_block_name = 'test/spacing-with-skipped-serialization-block-supports';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'spacing' => array(
						'margin'                          => true,
						'padding'                         => true,
						'blockGap'                        => true,
						'__experimentalSkipSerialization' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array(
			'style' => array(
				'spacing' => array(
					'margin'   => array(
						'top'    => '1px',
						'right'  => '2px',
						'bottom' => '3px',
						'left'   => '4px',
					),
					'padding'  => '111px',
					'blockGap' => '2em',
				),
			),
		);

		$actual   = gutenberg_apply_spacing_support( $block_type, $block_atts );
		$expected = array();

		$this->assertSame( $expected, $actual );
	}

	public function test_margin_with_individual_skipped_serialization_block_supports() {
		$this->test_block_name = 'test/margin-with-individual-skipped-serialization-block-supports';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'spacing' => array(
						'margin'                          => true,
						'padding'                         => true,
						'blockGap'                        => true,
						'__experimentalSkipSerialization' => array( 'margin' ),
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array(
			'style' => array(
				'spacing' => array(
					'padding'  => array(
						'top'    => '1px',
						'right'  => '2px',
						'bottom' => '3px',
						'left'   => '4px',
					),
					'margin'   => '111px',
					'blockGap' => '2em',
				),
			),
		);

		$actual   = gutenberg_apply_spacing_support( $block_type, $block_atts );
		$expected = array(
			'style' => 'padding-top:1px;padding-right:2px;padding-bottom:3px;padding-left:4px;',
		);

		$this->assertSame( $expected, $actual );
	}
}
