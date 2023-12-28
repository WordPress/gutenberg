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
	 *
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
}
