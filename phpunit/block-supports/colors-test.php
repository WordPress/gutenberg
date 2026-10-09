<?php

/**
 * Test the typography block supports.
 *
 * @package gutenberg
 */

class WP_Block_Supports_Colors_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
	}

	public function tear_down() {
		if ( $this->test_block_name ) {
			unregister_block_type( $this->test_block_name );
		}
		$this->test_block_name = null;
		parent::tear_down();
	}

	public function test_color_slugs_with_numbers_are_kebab_cased_properly() {
		$this->test_block_name = 'test/color-slug-with-numbers';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
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
		$block_type = $registry->get_registered( $this->test_block_name );

		$block_atts = array(
			'textColor'       => 'fg1',
			'backgroundColor' => 'bg2',
			'gradient'        => 'gr3',
		);

		$actual   = gutenberg_apply_colors_support( $block_type, $block_atts );
		$expected = array( 'class' => 'has-text-color has-fg-1-color has-background has-bg-2-background-color has-gr-3-gradient-background' );

		$this->assertSame( $expected, $actual );
	}

	public function test_color_with_skipped_serialization_block_supports() {
		$this->test_block_name = 'test/color-with-skipped-serialization-block-supports';
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
					'color' => array(
						'text'                            => true,
						'gradients'                       => true,
						'__experimentalSkipSerialization' => true,
					),
				),
			)
		);

		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array(
			'style' => array(
				'color' => array(
					'text'     => '#d92828',
					'gradient' => 'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(223,13,13) 46%,rgb(155,81,224) 100%)',
				),
			),
		);

		$actual   = gutenberg_apply_colors_support( $block_type, $block_atts );
		$expected = array();

		$this->assertSame( $expected, $actual );
	}

	public function test_gradient_with_individual_skipped_serialization_block_supports() {
		$this->test_block_name = 'test/gradient-with-individual-skipped-serialization-block-support';
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
					'color' => array(
						'text'                            => true,
						'gradients'                       => true,
						'__experimentalSkipSerialization' => array( 'gradients' ),
					),
				),
			)
		);

		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array(
			'style' => array(
				'color' => array(
					'text' => '#d92828',
				),
			),
		);

		$actual   = gutenberg_apply_colors_support( $block_type, $block_atts );
		$expected = array(
			'class' => 'has-text-color',
			'style' => 'color:#d92828;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_color_gradient_suppressed_when_background_gradient_is_supported_and_set() {
		$this->test_block_name = 'test/color-gradient-suppressed-by-background-gradient';
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
					'color'      => array(
						'gradients' => true,
					),
					'background' => array(
						'gradient' => true,
					),
				),
			)
		);

		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );

		// Both color.gradient and background.gradient are set — background.php
		// owns CSS generation, so color.gradient CSS must be suppressed.
		$block_atts = array(
			'style' => array(
				'color'      => array(
					'gradient' => 'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%)',
				),
				'background' => array(
					'gradient' => 'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%)',
				),
			),
		);

		$actual   = gutenberg_apply_colors_support( $block_type, $block_atts );
		$expected = array();

		$this->assertSame( $expected, $actual );
	}

	public function test_color_gradient_emitted_when_background_gradient_is_supported_but_not_set() {
		$this->test_block_name = 'test/color-gradient-not-suppressed-without-background-gradient-value';
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
					'color'      => array(
						'gradients' => true,
					),
					'background' => array(
						'gradient' => true,
					),
				),
			)
		);

		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );

		// background.gradient is supported but not yet set — legacy color.gradient
		// CSS must still be emitted to preserve existing content rendering.
		$block_atts = array(
			'style' => array(
				'color' => array(
					'gradient' => 'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%)',
				),
			),
		);

		$actual   = gutenberg_apply_colors_support( $block_type, $block_atts );
		$expected = array(
			'class' => 'has-background',
			'style' => 'background:linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%);',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_color_gradient_emitted_when_background_gradient_is_not_supported() {
		$this->test_block_name = 'test/color-gradient-no-background-gradient-support';
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
					'color' => array(
						'gradients' => true,
					),
				),
			)
		);

		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );

		$block_atts = array(
			'style' => array(
				'color' => array(
					'gradient' => 'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%)',
				),
			),
		);

		$actual   = gutenberg_apply_colors_support( $block_type, $block_atts );
		$expected = array(
			'class' => 'has-background',
			'style' => 'background:linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%);',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_color_support_true_applies_text_and_background_colors() {
		$this->test_block_name = 'test/color-support-true';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'textColor'       => array(
						'type' => 'string',
					),
					'backgroundColor' => array(
						'type' => 'string',
					),
				),
				'supports'    => array(
					'color' => true,
				),
			)
		);

		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );

		$block_atts = array(
			'textColor'       => 'contrast',
			'backgroundColor' => 'base',
		);

		$actual   = gutenberg_apply_colors_support( $block_type, $block_atts );
		$expected = array(
			'class' => 'has-text-color has-contrast-color has-background has-base-background-color',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_color_text_support_disabled_skips_text_color() {
		$this->test_block_name = 'test/color-text-support-disabled';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'textColor' => array(
						'type' => 'string',
					),
				),
				'supports'    => array(
					'color' => array(
						'text' => false,
					),
				),
			)
		);

		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );

		$block_atts = array(
			'textColor' => 'contrast',
		);

		$actual   = gutenberg_apply_colors_support( $block_type, $block_atts );
		$expected = array();

		$this->assertSame( $expected, $actual );
	}

	/**
	 * @covers ::gutenberg_get_color_classes_and_styles
	 *
	 * @dataProvider data_get_color_classes_and_styles
	 *
	 * @param mixed $block_attributes Block attributes.
	 * @param array $expected         Expected classes and styles.
	 */
	public function test_get_color_classes_and_styles( $block_attributes, $expected ) {
		$this->assertSame( $expected, gutenberg_get_color_classes_and_styles( $block_attributes ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_color_classes_and_styles() {
		return array(
			'custom'                       => array(
				'block_attributes' => array(
					'style' => array(
						'color' => array(
							'text'       => '#d92828',
							'background' => '#ffffff',
							'gradient'   => 'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%)',
						),
					),
				),
				'expected'         => array(
					'class' => 'has-text-color has-background',
					'style' => 'color:#d92828;background-color:#ffffff;background:linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%);',
				),
			),
			'preset'                       => array(
				'block_attributes' => array(
					'textColor'       => 'contrast',
					'backgroundColor' => 'base',
					'gradient'        => 'vivid-cyan-blue-to-vivid-purple',
				),
				'expected'         => array(
					'class' => 'has-text-color has-contrast-color has-background has-base-background-color has-vivid-cyan-blue-to-vivid-purple-gradient-background',
				),
			),
			'preset wins over custom'      => array(
				'block_attributes' => array(
					'textColor' => 'contrast',
					'style'     => array(
						'color' => array(
							'text' => '#d92828',
						),
					),
				),
				'expected'         => array(
					'class' => 'has-text-color has-contrast-color',
				),
			),
			'null preset wins over custom' => array(
				'block_attributes' => array(
					'textColor' => null,
					'style'     => array(
						'color' => array(
							'text' => '#d92828',
						),
					),
				),
				'expected'         => array(
					'class' => 'has-text-color',
				),
			),
			'numeric'                      => array(
				'block_attributes' => array(
					'textColor' => 1,
				),
				'expected'         => array(
					'class' => 'has-text-color has-1-color',
				),
			),
			'zero'                         => array(
				'block_attributes' => array(
					'style' => array(
						'color' => array(
							'text' => '0',
						),
					),
				),
				'expected'         => array(
					'style' => 'color:0;',
				),
			),
			'empty'                        => array(
				'block_attributes' => array(),
				'expected'         => array(),
			),
			'malformed color'              => array(
				'block_attributes' => array(
					'style' => array(
						'color' => '#d92828',
					),
				),
				'expected'         => array(),
			),
			'malformed attributes'         => array(
				'block_attributes' => 'color',
				'expected'         => array(),
			),
		);
	}
}
