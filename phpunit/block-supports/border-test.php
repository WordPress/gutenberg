<?php

/**
 * Test the border block supports.
 *
 * @package gutenberg
 */

class WP_Block_Supports_Border_Test extends WP_UnitTestCase {
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

	/**
	 * Registers a new block for testing border support.
	 *
	 * @param string $block_name Name for the test block.
	 * @param array  $supports   Array defining block support configuration.
	 * @return WP_Block_Type The block type for the newly registered test block.
	 */
	private function register_bordered_block_with_support( $block_name, $supports = array() ) {
		$this->test_block_name = $block_name;
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'borderColor' => array(
						'type' => 'string',
					),
					'style'       => array(
						'type' => 'object',
					),
				),
				'supports'    => $supports,
			)
		);
		$registry = WP_Block_Type_Registry::get_instance();

		return $registry->get_registered( $this->test_block_name );
	}

	public function test_border_object_with_no_styles() {
		$block_type  = self::register_bordered_block_with_support(
			'test/border-object-with-no-styles',
			array(
				'__experimentalBorder' => array(
					'color'  => true,
					'radius' => true,
					'width'  => true,
					'style'  => true,
				),
			)
		);
		$block_attrs = array( 'style' => array( 'border' => array() ) );
		$actual      = gutenberg_apply_border_support( $block_type, $block_attrs );
		$expected    = array();

		$this->assertSame( $expected, $actual );
	}

	public function test_border_object_with_invalid_style_prop() {
		$block_type  = self::register_bordered_block_with_support(
			'test/border-object-with-invalid-style-prop',
			array(
				'__experimentalBorder' => array(
					'color'  => true,
					'radius' => true,
					'width'  => true,
					'style'  => true,
				),
			)
		);
		$block_attrs = array( 'style' => array( 'border' => array( 'invalid' => '10px' ) ) );
		$actual      = gutenberg_apply_border_support( $block_type, $block_attrs );
		$expected    = array();

		$this->assertSame( $expected, $actual );
	}

	public function test_border_color_slug_with_numbers_is_kebab_cased_properly() {
		$block_type = self::register_bordered_block_with_support(
			'test/border-color-slug-with-numbers-is-kebab-cased-properly',
			array(
				'__experimentalBorder' => array(
					'color'  => true,
					'radius' => true,
					'width'  => true,
					'style'  => true,
				),
			)
		);
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
			'style' => 'border-radius:10px;border-style:dashed;border-width:1px;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_flat_border_with_skipped_serialization() {
		$block_type = self::register_bordered_block_with_support(
			'test/flat-border-with-skipped-serialization',
			array(
				'__experimentalBorder' => array(
					'color'                           => true,
					'radius'                          => true,
					'width'                           => true,
					'style'                           => true,
					'__experimentalSkipSerialization' => true,
				),
			)
		);
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

	public function test_flat_border_with_individual_skipped_serialization() {
		$block_type = self::register_bordered_block_with_support(
			'test/flat-border-with-individual-skipped-serialization',
			array(
				'__experimentalBorder' => array(
					'color'                           => true,
					'radius'                          => true,
					'width'                           => true,
					'style'                           => true,
					'__experimentalSkipSerialization' => array( 'radius', 'color' ),
				),
			)
		);
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
			'style' => 'border-style:dotted;border-width:1px;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_border_color_preset_with_skipped_color_serialization() {
		$block_type  = self::register_bordered_block_with_support(
			'test/border-color-preset-with-skipped-color-serialization',
			array(
				'__experimentalBorder' => array(
					'color'                           => true,
					'width'                           => true,
					'__experimentalSkipSerialization' => array( 'color' ),
				),
			)
		);
		$block_attrs = array(
			'borderColor' => 'red',
			'style'       => array( 'border' => array( 'width' => '1px' ) ),
		);

		$this->assertSame(
			array( 'style' => 'border-width:1px;' ),
			gutenberg_apply_border_support( $block_type, $block_attrs )
		);
	}

	public function test_split_border_radius() {
		$block_type  = self::register_bordered_block_with_support(
			'test/split-border-radius',
			array(
				'__experimentalBorder' => array(
					'radius' => true,
				),
			)
		);
		$block_attrs = array(
			'style' => array(
				'border' => array(
					'radius' => array(
						'topLeft'     => '1em',
						'topRight'    => '2rem',
						'bottomLeft'  => '30px',
						'bottomRight' => '4vh',
					),
				),
			),
		);
		$actual      = gutenberg_apply_border_support( $block_type, $block_attrs );
		$expected    = array(
			'style' => 'border-top-left-radius:1em;border-top-right-radius:2rem;border-bottom-left-radius:30px;border-bottom-right-radius:4vh;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_flat_border_with_custom_color() {
		$block_type  = self::register_bordered_block_with_support(
			'test/flat-border-with-custom-color',
			array(
				'__experimentalBorder' => array(
					'color' => true,
					'width' => true,
					'style' => true,
				),
			)
		);
		$block_attrs = array(
			'style' => array(
				'border' => array(
					'color' => '#72aee6',
					'width' => '2px',
					'style' => 'dashed',
				),
			),
		);
		$actual      = gutenberg_apply_border_support( $block_type, $block_attrs );
		$expected    = array(
			'class' => 'has-border-color',
			'style' => 'border-color:#72aee6;border-style:dashed;border-width:2px;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_split_borders_with_custom_colors() {
		$block_type  = self::register_bordered_block_with_support(
			'test/split-borders-with-custom-colors',
			array(
				'__experimentalBorder' => array(
					'color' => true,
					'width' => true,
					'style' => true,
				),
			)
		);
		$block_attrs = array(
			'style' => array(
				'border' => array(
					'top'    => array(
						'color' => '#72aee6',
						'width' => '2px',
						'style' => 'dashed',
					),
					'right'  => array(
						'color' => '#e65054',
						'width' => '0.25rem',
						'style' => 'dotted',
					),
					'bottom' => array(
						'color' => '#007017',
						'width' => '0.5em',
						'style' => 'solid',
					),
					'left'   => array(
						'color' => '#f6f7f7',
						'width' => '1px',
						'style' => 'solid',
					),
				),
			),
		);
		$actual      = gutenberg_apply_border_support( $block_type, $block_attrs );
		$expected    = array(
			'style' => 'border-top-width:2px;border-top-color:#72aee6;border-top-style:dashed;border-right-width:0.25rem;border-right-color:#e65054;border-right-style:dotted;border-bottom-width:0.5em;border-bottom-color:#007017;border-bottom-style:solid;border-left-width:1px;border-left-color:#f6f7f7;border-left-style:solid;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_split_borders_with_skipped_serialization() {
		$block_type  = self::register_bordered_block_with_support(
			'test/split-borders-with-skipped-serialization',
			array(
				'__experimentalBorder' => array(
					'color'                           => true,
					'width'                           => true,
					'style'                           => true,
					'__experimentalSkipSerialization' => true,
				),
			)
		);
		$block_attrs = array(
			'style' => array(
				'border' => array(
					'top'    => array(
						'color' => '#72aee6',
						'width' => '2px',
						'style' => 'dashed',
					),
					'right'  => array(
						'color' => '#e65054',
						'width' => '0.25rem',
						'style' => 'dotted',
					),
					'bottom' => array(
						'color' => '#007017',
						'width' => '0.5em',
						'style' => 'solid',
					),
					'left'   => array(
						'color' => '#f6f7f7',
						'width' => '1px',
						'style' => 'solid',
					),
				),
			),
		);
		$actual      = gutenberg_apply_border_support( $block_type, $block_attrs );
		$expected    = array();

		$this->assertSame( $expected, $actual );
	}

	public function test_split_borders_with_skipped_individual_feature_serialization() {
		$block_type  = self::register_bordered_block_with_support(
			'test/split-borders-with-skipped-individual-feature-serialization',
			array(
				'__experimentalBorder' => array(
					'color'                           => true,
					'width'                           => true,
					'style'                           => true,
					'__experimentalSkipSerialization' => array( 'width', 'style' ),
				),
			)
		);
		$block_attrs = array(
			'style' => array(
				'border' => array(
					'top'    => array(
						'color' => '#72aee6',
						'width' => '2px',
						'style' => 'dashed',
					),
					'right'  => array(
						'color' => '#e65054',
						'width' => '0.25rem',
						'style' => 'dotted',
					),
					'bottom' => array(
						'color' => '#007017',
						'width' => '0.5em',
						'style' => 'solid',
					),
					'left'   => array(
						'color' => '#f6f7f7',
						'width' => '1px',
						'style' => 'solid',
					),
				),
			),
		);
		$actual      = gutenberg_apply_border_support( $block_type, $block_attrs );
		$expected    = array(
			'style' => 'border-top-color:#72aee6;border-right-color:#e65054;border-bottom-color:#007017;border-left-color:#f6f7f7;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_partial_split_borders() {
		$block_type  = self::register_bordered_block_with_support(
			'test/partial-split-borders',
			array(
				'__experimentalBorder' => array(
					'color' => true,
					'width' => true,
					'style' => true,
				),
			)
		);
		$block_attrs = array(
			'style' => array(
				'border' => array(
					'top'   => array(
						'color' => '#72aee6',
						'width' => '2px',
						'style' => 'dashed',
					),
					'right' => array(
						'color' => '#e65054',
						'width' => '0.25rem',
					),
					'left'  => array(
						'style' => 'solid',
					),
				),
			),
		);
		$actual      = gutenberg_apply_border_support( $block_type, $block_attrs );
		$expected    = array(
			'style' => 'border-top-width:2px;border-top-color:#72aee6;border-top-style:dashed;border-right-width:0.25rem;border-right-color:#e65054;border-left-style:solid;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_split_borders_with_named_colors() {
		$block_type  = self::register_bordered_block_with_support(
			'test/split-borders-with-named-colors',
			array(
				'__experimentalBorder' => array(
					'color' => true,
					'width' => true,
					'style' => true,
				),
			)
		);
		$block_attrs = array(
			'style' => array(
				'border' => array(
					'top'    => array(
						'width' => '2px',
						'style' => 'dashed',
						'color' => 'var:preset|color|red',
					),
					'right'  => array(
						'width' => '0.25rem',
						'style' => 'dotted',
						'color' => 'var:preset|color|green',
					),
					'bottom' => array(
						'width' => '0.5em',
						'style' => 'solid',
						'color' => 'var:preset|color|blue',
					),
					'left'   => array(
						'width' => '1px',
						'style' => 'solid',
						'color' => 'var:preset|color|yellow',
					),
				),
			),
		);
		$actual      = gutenberg_apply_border_support( $block_type, $block_attrs );
		$expected    = array(
			'style' => 'border-top-width:2px;border-top-color:var(--wp--preset--color--red);border-top-style:dashed;border-right-width:0.25rem;border-right-color:var(--wp--preset--color--green);border-right-style:dotted;border-bottom-width:0.5em;border-bottom-color:var(--wp--preset--color--blue);border-bottom-style:solid;border-left-width:1px;border-left-color:var(--wp--preset--color--yellow);border-left-style:solid;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_split_borders_with_color_support_only_keeps_side_style() {
		$block_type  = self::register_bordered_block_with_support(
			'test/split-borders-with-color-support-only',
			array(
				'__experimentalBorder' => array(
					'color' => true,
				),
			)
		);
		$block_attrs = array(
			'style' => array(
				'border' => array(
					'style' => 'solid',
					'top'   => array(
						'color' => '#72aee6',
						'style' => 'dashed',
					),
				),
			),
		);
		$actual      = gutenberg_apply_border_support( $block_type, $block_attrs );
		$expected    = array(
			'style' => 'border-top-color:#72aee6;border-top-style:dashed;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_split_borders_with_width_support_only_keeps_side_color() {
		$block_type  = self::register_bordered_block_with_support(
			'test/split-borders-with-width-support-only',
			array(
				'__experimentalBorder' => array(
					'width' => true,
				),
			)
		);
		$block_attrs = array(
			'borderColor' => 'red',
			'style'       => array(
				'border' => array(
					'top' => array(
						'color' => '#72aee6',
						'width' => '2px',
					),
				),
			),
		);
		$actual      = gutenberg_apply_border_support( $block_type, $block_attrs );
		$expected    = array(
			'style' => 'border-top-width:2px;border-top-color:#72aee6;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_split_borders_without_color_or_width_support_are_dropped() {
		$block_type  = self::register_bordered_block_with_support(
			'test/split-borders-without-color-or-width-support',
			array(
				'__experimentalBorder' => array(
					'radius' => true,
					'style'  => true,
				),
			)
		);
		$block_attrs = array(
			'style' => array(
				'border' => array(
					'radius' => '5px',
					'top'    => array(
						'style' => 'dashed',
						'width' => '2px',
					),
				),
			),
		);
		$actual      = gutenberg_apply_border_support( $block_type, $block_attrs );
		$expected    = array(
			'style' => 'border-radius:5px;',
		);

		$this->assertSame( $expected, $actual );
	}

	public function test_non_array_border_and_sides_are_ignored() {
		$block_type = self::register_bordered_block_with_support(
			'test/non-array-border-and-sides',
			array(
				'__experimentalBorder' => true,
			)
		);

		$this->assertSame( array(), gutenberg_apply_border_support( $block_type, array( 'style' => 'invalid' ) ) );
		$this->assertSame( array(), gutenberg_apply_border_support( $block_type, array( 'style' => array( 'border' => 'invalid' ) ) ) );
		$this->assertSame(
			array( 'style' => 'border-bottom-width:1px;' ),
			gutenberg_apply_border_support(
				$block_type,
				array(
					'style' => array(
						'border' => array(
							'top'    => 'invalid',
							'bottom' => array( 'width' => '1px' ),
						),
					),
				)
			)
		);
	}

	/**
	 * @dataProvider data_get_border_classes_and_styles
	 *
	 * @param mixed $block_attributes Block attributes.
	 * @param array $expected         Expected classes and styles.
	 */
	public function test_get_border_classes_and_styles( $block_attributes, $expected ) {
		$this->assertSame( $expected, gutenberg_get_border_classes_and_styles( $block_attributes ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_border_classes_and_styles() {
		return array(
			'custom'                  => array(
				'block_attributes' => array(
					'style' => array(
						'border' => array(
							'radius' => '10px',
							'style'  => 'solid',
							'width'  => '2px',
							'color'  => '#ff0000',
							'top'    => array(
								'style' => 'dashed',
								'color' => '#00ff00',
								'width' => '3px',
							),
						),
					),
				),
				'expected'         => array(
					'class' => 'has-border-color',
					'style' => 'border-color:#ff0000;border-radius:10px;border-style:solid;border-width:2px;border-top-width:3px;border-top-color:#00ff00;border-top-style:dashed;',
				),
			),
			'preset wins over custom' => array(
				'block_attributes' => array(
					'borderColor' => 'red',
					'style'       => array(
						'border' => array(
							'color' => '#ff0000',
						),
					),
				),
				'expected'         => array(
					'class' => 'has-border-color has-red-border-color',
				),
			),
			'preset only'             => array(
				'block_attributes' => array(
					'borderColor' => 'red',
				),
				'expected'         => array(
					'class' => 'has-border-color has-red-border-color',
				),
			),
			'numeric'                 => array(
				'block_attributes' => array(
					'style' => array(
						'border' => array(
							'radius' => 5,
							'width'  => 2,
						),
					),
				),
				'expected'         => array(
					'style' => 'border-radius:5px;border-width:2px;',
				),
			),
			'zero'                    => array(
				'block_attributes' => array(
					'style' => array(
						'border' => array(
							'radius' => 0,
							'width'  => 0,
						),
					),
				),
				'expected'         => array(
					'style' => 'border-radius:0px;border-width:0px;',
				),
			),
			'empty'                   => array(
				'block_attributes' => array(),
				'expected'         => array(),
			),
			'malformed border'        => array(
				'block_attributes' => array(
					'style' => array(
						'border' => 'solid',
					),
				),
				'expected'         => array(),
			),
			'malformed side'          => array(
				'block_attributes' => array(
					'style' => array(
						'border' => array(
							'top' => '1px solid',
						),
					),
				),
				'expected'         => array(),
			),
			'malformed style'         => array(
				'block_attributes' => array(
					'style' => 'border:1px solid',
				),
				'expected'         => array(),
			),
			'malformed non-array'     => array(
				'block_attributes' => 'border',
				'expected'         => array(),
			),
		);
	}
}
