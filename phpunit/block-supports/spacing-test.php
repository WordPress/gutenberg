<?php

/**
 * Test the spacing block supports.
 *
 * @package gutenberg
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

	/**
	 * @dataProvider data_generate_spacing_size_preset_fixtures
	 *
	 * @param array  $spacing_size    A spacingSizes preset value as seen in theme.json.
	 * @param array  $settings        Theme JSON settings array that overrides any global theme settings.
	 * @param string $expected_output Expected output of gutenberg_get_spacing_size_value().
	 */
	public function test_gutenberg_get_spacing_size_value( $spacing_size, $settings, $expected_output ) {
		$actual = gutenberg_get_spacing_size_value( $spacing_size, $settings );

		$this->assertSame( $expected_output, $actual );
	}

	/**
	 * Data provider for test_gutenberg_get_spacing_size_value.
	 *
	 * @return array
	 */
	public function data_generate_spacing_size_preset_fixtures() {
		return array(
			'returns null when size is not set'   => array(
				'spacing_size'    => array(),
				'settings'        => array(),
				'expected_output' => null,
			),

			'returns value when fluid spacing is deactivated' => array(
				'spacing_size'    => array(
					'size' => '28px',
				),
				'settings'        => array(),
				'expected_output' => '28px',
			),

			'returns value when fluid is `false`' => array(
				'spacing_size'    => array(
					'size'  => '1.75rem',
					'fluid' => false,
				),
				'settings'        => array(
					'spacing' => array(
						'fluid' => true,
					),
				),
				'expected_output' => '1.75rem',
			),

			'returns value when global fluid is enabled but preset has no fluid bounds' => array(
				'spacing_size'    => array(
					'size' => '1.75rem',
				),
				'settings'        => array(
					'spacing' => array(
						'fluid' => true,
					),
				),
				'expected_output' => '1.75rem',
			),

			'returns value when preset fluid is `true` with no explicit min/max' => array(
				'spacing_size'    => array(
					'size'  => '1.75rem',
					'fluid' => true,
				),
				'settings'        => array(),
				'expected_output' => '1.75rem',
			),

			'returns value when preset fluid is missing `max`' => array(
				'spacing_size'    => array(
					'size'  => '1.75rem',
					'fluid' => array(
						'min' => '1.5rem',
					),
				),
				'settings'        => array(),
				'expected_output' => '1.75rem',
			),

			'returns clamp value with explicit min/max and default viewport widths' => array(
				'spacing_size'    => array(
					'size'  => '1.75rem',
					'fluid' => array(
						'min' => '1.5rem',
						'max' => '1.75rem',
					),
				),
				'settings'        => array(),
				'expected_output' => 'clamp(1.5rem, 1.5rem + ((1vw - 0.2rem) * 0.313), 1.75rem)',
			),

			'returns clamp value using px units'  => array(
				'spacing_size'    => array(
					'size'  => '32px',
					'fluid' => array(
						'min' => '16px',
						'max' => '32px',
					),
				),
				'settings'        => array(),
				'expected_output' => 'clamp(16px, 1rem + ((1vw - 3.2px) * 1.25), 32px)',
			),

			'returns clamp value with custom global viewport widths' => array(
				'spacing_size'    => array(
					'size'  => '2rem',
					'fluid' => array(
						'min' => '1rem',
						'max' => '2rem',
					),
				),
				'settings'        => array(
					'spacing' => array(
						'fluid' => array(
							'minViewportWidth' => '768px',
							'maxViewportWidth' => '1280px',
						),
					),
				),
				'expected_output' => 'clamp(1rem, 1rem + ((1vw - 0.48rem) * 3.125), 2rem)',
			),
		);
	}
}
