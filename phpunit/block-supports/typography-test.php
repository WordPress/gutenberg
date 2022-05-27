<?php

/**
 * Test the typography block supports.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Typography_Test extends WP_UnitTestCase {
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

	function test_font_size_slug_with_numbers_is_kebab_cased_properly() {
		$this->test_block_name = 'test/font-size-slug-with-numbers';
		register_block_type(
			$this->test_block_name,
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
		$block_type = $registry->get_registered( $this->test_block_name );

		$block_atts = array( 'fontSize' => 'h1' );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array( 'class' => 'has-h-1-font-size' );

		$this->assertSame( $expected, $actual );
	}

	function test_font_family_with_legacy_inline_styles_using_a_value() {
		$this->test_block_name = 'test/font-family-with-inline-styles-using-value';
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
					'typography' => array(
						'__experimentalFontFamily' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array( 'style' => array( 'typography' => array( 'fontFamily' => 'serif' ) ) );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array( 'style' => 'font-family: serif;' );

		$this->assertSame( $expected, $actual );
	}

	function test_typography_with_skipped_serialization_block_supports() {
		$this->test_block_name = 'test/typography-with-skipped-serialization-block-supports';
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
					'typography' => array(
						'fontSize'                        => true,
						'lineHeight'                      => true,
						'__experimentalFontFamily'        => true,
						'__experimentalLetterSpacing'     => true,
						'__experimentalSkipSerialization' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array(
			'style' => array(
				'typography' => array(
					'fontSize'      => 'serif',
					'lineHeight'    => 'serif',
					'fontFamily'    => '22px',
					'letterSpacing' => '22px',
				),
			),
		);

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array();

		$this->assertSame( $expected, $actual );
	}

	function test_letter_spacing_with_individual_skipped_serialization_block_supports() {
		$this->test_block_name = 'test/letter-spacing-with-individual-skipped-serialization-block-supports';
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
					'typography' => array(
						'__experimentalLetterSpacing'     => true,
						'__experimentalSkipSerialization' => array(
							'letterSpacing',
						),
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array( 'style' => array( 'typography' => array( 'letterSpacing' => '22px' ) ) );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array();

		$this->assertSame( $expected, $actual );
	}

	function test_font_family_with_legacy_inline_styles_using_a_css_var() {
		$this->test_block_name = 'test/font-family-with-inline-styles-using-css-var';
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
					'typography' => array(
						'__experimentalFontFamily' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array( 'style' => array( 'typography' => array( 'fontFamily' => 'var:preset|font-family|h1' ) ) );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array( 'style' => 'font-family: var(--wp--preset--font-family--h-1);' );

		$this->assertSame( $expected, $actual );
	}

	function test_font_family_with_class() {
		$this->test_block_name = 'test/font-family-with-class';
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
					'typography' => array(
						'__experimentalFontFamily' => true,
					),
				),
			)
		);
		$registry   = WP_Block_Type_Registry::get_instance();
		$block_type = $registry->get_registered( $this->test_block_name );
		$block_atts = array( 'fontFamily' => 'h1' );

		$actual   = gutenberg_apply_typography_support( $block_type, $block_atts );
		$expected = array( 'class' => 'has-h-1-font-family' );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests generating font size values, including fluid formulae, from fontSizes preset.
	 *
	 * @dataProvider data_generate_font_size_preset_fixtures
	 */
	function test_gutenberg_get_typography_font_size_value( $font_size_preset, $expected_output ) {
		$actual = gutenberg_get_typography_font_size_value( $font_size_preset );

		$this->assertSame( $expected_output, $actual );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_generate_font_size_preset_fixtures() {
		return array(
			'default_return_value'                         => array(
				'font_size_preset' => array(
					'size' => '28px',
				),
				'expected_output'  => '28px',
			),

			'default_return_value_with_no_valid_fluid_values' => array(
				'font_size_preset' => array(
					'size'      => '28px',
					'fluidSize' => array(),
				),
				'expected_output'  => '28px',
			),

			'default_return_size_with_invalid_fluid_units' => array(
				'font_size_preset' => array(
					'size'      => '10em',
					'fluidSize' => array(
						'min' => '20vw',
						'max' => '50%',
					),
				),
				'expected_output'  => '10em',
			),

			'default_return_fluid_clamp_value'             => array(
				'font_size_preset' => array(
					'size'      => '28px',
					'fluidSize' => array(
						'min' => '20px',
						'max' => '50rem',
					),
				),
				'expected_output'  => 'clamp(20px, 1.25rem + ((1vw - 7.68px) * 93.75), 50rem)',
			),

			'default_return_fluid_min_value'               => array(
				'font_size_preset' => array(
					'size'      => '28px',
					'fluidSize' => array(
						'min' => '2.6rem',
					),
				),
				'expected_output'  => 'max(2.6rem, 5.417 * 1vw)',
			),

			'default_return_fluid_max_value'               => array(
				'font_size_preset' => array(
					'size'      => '28px',
					'fluidSize' => array(
						'max' => '80px',
					),
				),
				'expected_output'  => 'min(5rem, 5 * 1vw)',
			),
		);
	}
}
