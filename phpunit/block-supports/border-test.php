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
		remove_filter(
			'wp_theme_json_data_theme',
			array( $this, 'filter_inject_block_type_border_style' )
		);
		remove_filter(
			'wp_theme_json_data_theme',
			array( $this, 'filter_inject_root_border_style' )
		);
		remove_filter(
			'wp_theme_json_data_theme',
			array( $this, 'filter_inject_block_type_border_none' )
		);
		_gutenberg_clean_theme_json_caches();
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

	/**
	 * Helper that builds a parsed-block array shape and runs it through the
	 * `render_block` filter chain so we exercise the wired-up fallback exactly
	 * as it runs at render time.
	 *
	 * @param string $block_name Registered block type name.
	 * @param array  $attrs      Parsed block attributes.
	 * @param string $inner_html Inner HTML (block wrapper).
	 *
	 * @return string Filtered block HTML.
	 */
	private function render_block_through_filter( $block_name, $attrs, $inner_html ) {
		$block = array(
			'blockName'    => $block_name,
			'attrs'        => $attrs,
			'innerBlocks'  => array(),
			'innerHTML'    => $inner_html,
			'innerContent' => array( $inner_html ),
		);
		return gutenberg_render_block_border_fallback( $inner_html, $block );
	}

	/**
	 * The pure fallback helper handles flat color/width inputs by emitting
	 * `border-{side}-style:solid` for every side.
	 */
	public function test_get_border_style_fallbacks_flat_color() {
		$attrs = array( 'style' => array( 'border' => array( 'color' => '#72aee6' ) ) );
		$this->assertSame(
			array(
				'border-top-style:solid',
				'border-right-style:solid',
				'border-bottom-style:solid',
				'border-left-style:solid',
			),
			gutenberg_get_border_style_fallbacks(
				$attrs,
				array(
					'top'    => false,
					'right'  => false,
					'bottom' => false,
					'left'   => false,
				)
			)
		);
	}

	public function test_get_border_style_fallbacks_flat_width() {
		$attrs = array( 'style' => array( 'border' => array( 'width' => '2px' ) ) );
		$this->assertSame(
			array(
				'border-top-style:solid',
				'border-right-style:solid',
				'border-bottom-style:solid',
				'border-left-style:solid',
			),
			gutenberg_get_border_style_fallbacks(
				$attrs,
				array(
					'top'    => false,
					'right'  => false,
					'bottom' => false,
					'left'   => false,
				)
			)
		);
	}

	public function test_get_border_style_fallbacks_border_color_preset_alone() {
		$attrs = array( 'borderColor' => 'accent' );
		$this->assertSame(
			array(
				'border-top-style:solid',
				'border-right-style:solid',
				'border-bottom-style:solid',
				'border-left-style:solid',
			),
			gutenberg_get_border_style_fallbacks(
				$attrs,
				array(
					'top'    => false,
					'right'  => false,
					'bottom' => false,
					'left'   => false,
				)
			)
		);
	}

	/**
	 * An explicit shorthand `style` covers every side via CSS, so the
	 * helper must emit nothing.
	 */
	public function test_get_border_style_fallbacks_shorthand_style_covers_sides() {
		$attrs = array(
			'style' => array(
				'border' => array(
					'style' => 'dashed',
					'top'   => array( 'color' => '#fff' ),
					'right' => array( 'color' => '#fff' ),
				),
			),
		);
		$this->assertSame(
			array(),
			gutenberg_get_border_style_fallbacks(
				$attrs,
				array(
					'top'    => false,
					'right'  => false,
					'bottom' => false,
					'left'   => false,
				)
			)
		);
	}

	/**
	 * Mixed shape: explicit per-side style on top, shorthand color elsewhere.
	 * Top is preserved (helper emits nothing for it); right/bottom/left need
	 * the fallback because the shorthand color leaves them otherwise invisible.
	 */
	public function test_get_border_style_fallbacks_mixed_preserves_explicit_side_style() {
		$attrs = array(
			'style' => array(
				'border' => array(
					'color' => '#000',
					'top'   => array(
						'color' => '#fff',
						'style' => 'dashed',
					),
				),
			),
		);
		$this->assertSame(
			array(
				'border-right-style:solid',
				'border-bottom-style:solid',
				'border-left-style:solid',
			),
			gutenberg_get_border_style_fallbacks(
				$attrs,
				array(
					'top'    => false,
					'right'  => false,
					'bottom' => false,
					'left'   => false,
				)
			)
		);
	}

	/**
	 * Per-side: only sides that have color/width but no style get the fallback.
	 */
	public function test_get_border_style_fallbacks_per_side_mixed() {
		$attrs = array(
			'style' => array(
				'border' => array(
					'top'   => array(
						'color' => '#000',
						'style' => 'dashed',
					),
					'right' => array( 'color' => '#000' ),
				),
			),
		);
		$this->assertSame(
			array( 'border-right-style:solid' ),
			gutenberg_get_border_style_fallbacks(
				$attrs,
				array(
					'top'    => false,
					'right'  => false,
					'bottom' => false,
					'left'   => false,
				)
			)
		);
	}

	/**
	 * Inherited shorthand style suppresses every side.
	 */
	public function test_get_border_style_fallbacks_inherited_shorthand_suppresses_all_sides() {
		$attrs = array( 'style' => array( 'border' => array( 'color' => '#72aee6' ) ) );
		$this->assertSame(
			array(),
			gutenberg_get_border_style_fallbacks(
				$attrs,
				array(
					'top'    => true,
					'right'  => true,
					'bottom' => true,
					'left'   => true,
				)
			)
		);
	}

	/**
	 * End-to-end: the `render_block` filter injects fallback styles into
	 * the rendered wrapper for a static block that has a saved border color
	 * but no border style.
	 */
	public function test_render_block_filter_injects_fallback_for_legacy_static_content() {
		self::register_bordered_block_with_support(
			'test/render-fallback-legacy-static',
			array(
				'__experimentalBorder' => array(
					'color' => true,
					'width' => true,
					'style' => true,
				),
			)
		);

		$inner_html = '<div class="wp-block-test has-border-color" style="border-color:#ff0000;border-width:4px">x</div>';
		$rendered   = $this->render_block_through_filter(
			'test/render-fallback-legacy-static',
			array(
				'style' => array(
					'border' => array(
						'color' => '#ff0000',
						'width' => '4px',
					),
				),
			),
			$inner_html
		);

		$this->assertStringContainsString( 'border-top-style:solid', $rendered );
		$this->assertStringContainsString( 'border-right-style:solid', $rendered );
		$this->assertStringContainsString( 'border-bottom-style:solid', $rendered );
		$this->assertStringContainsString( 'border-left-style:solid', $rendered );
		$this->assertStringContainsString( 'border-color:#ff0000', $rendered );
	}

	/**
	 * End-to-end: a block with an explicit `border.style` already in its
	 * attributes is left untouched by the filter.
	 */
	public function test_render_block_filter_is_noop_when_border_style_set() {
		self::register_bordered_block_with_support(
			'test/render-fallback-noop-style-set',
			array(
				'__experimentalBorder' => array(
					'color' => true,
					'width' => true,
					'style' => true,
				),
			)
		);

		$inner_html = '<div style="border-color:#ff0000;border-style:dotted">x</div>';
		$rendered   = $this->render_block_through_filter(
			'test/render-fallback-noop-style-set',
			array(
				'style' => array(
					'border' => array(
						'color' => '#ff0000',
						'style' => 'dotted',
					),
				),
			),
			$inner_html
		);

		$this->assertSame( $inner_html, $rendered );
		$this->assertStringNotContainsString( 'solid', $rendered );
	}

	/**
	 * End-to-end: the filter respects skipped serialization of the `style`
	 * feature and leaves the block untouched.
	 */
	public function test_render_block_filter_skips_when_style_serialization_skipped() {
		self::register_bordered_block_with_support(
			'test/render-fallback-skip-serialization',
			array(
				'__experimentalBorder' => array(
					'color'                           => true,
					'width'                           => true,
					'style'                           => true,
					'__experimentalSkipSerialization' => array( 'style' ),
				),
			)
		);

		$inner_html = '<div style="border-color:#ff0000">x</div>';
		$rendered   = $this->render_block_through_filter(
			'test/render-fallback-skip-serialization',
			array(
				'style' => array(
					'border' => array(
						'color' => '#ff0000',
					),
				),
			),
			$inner_html
		);

		$this->assertSame( $inner_html, $rendered );
	}

	/**
	 * End-to-end: a block that opts into `color` (and/or `width`) but not
	 * `style` still receives the visibility fallback. Opting out of `style`
	 * means the user cannot pick a style via UI; it does not mean a block
	 * whose attributes carry a color or width should be invisible. This
	 * matches the legacy CSS `:where()` fallback behaviour.
	 */
	public function test_render_block_filter_applies_to_block_without_style_support() {
		self::register_bordered_block_with_support(
			'test/fallback-color-only-support',
			array(
				'__experimentalBorder' => array(
					'color' => true,
					'width' => true,
				),
			)
		);

		$inner_html = '<div style="border-color:#ff0000;border-width:2px">x</div>';
		$rendered   = $this->render_block_through_filter(
			'test/fallback-color-only-support',
			array(
				'style' => array(
					'border' => array(
						'color' => '#ff0000',
						'width' => '2px',
					),
				),
			),
			$inner_html
		);

		$this->assertStringContainsString( 'border-top-style:solid', $rendered );
		$this->assertStringContainsString( 'border-right-style:solid', $rendered );
		$this->assertStringContainsString( 'border-bottom-style:solid', $rendered );
		$this->assertStringContainsString( 'border-left-style:solid', $rendered );
	}

	/**
	 * End-to-end: inheritance from the resolved global block-type border
	 * style suppresses the fallback for all sides.
	 */
	public function test_render_block_filter_suppressed_by_inherited_block_type_border_style() {
		add_filter(
			'wp_theme_json_data_theme',
			array( $this, 'filter_inject_block_type_border_style' )
		);
		_gutenberg_clean_theme_json_caches();

		self::register_bordered_block_with_support(
			'test/fallback-inherited-block-type',
			array(
				'__experimentalBorder' => array(
					'color' => true,
					'width' => true,
					'style' => true,
				),
			)
		);
		$inner_html = '<div style="border-color:#72aee6">x</div>';
		$rendered   = $this->render_block_through_filter(
			'test/fallback-inherited-block-type',
			array(
				'style' => array( 'border' => array( 'color' => '#72aee6' ) ),
			),
			$inner_html
		);

		remove_filter(
			'wp_theme_json_data_theme',
			array( $this, 'filter_inject_block_type_border_style' )
		);
		_gutenberg_clean_theme_json_caches();

		$this->assertSame( $inner_html, $rendered );
	}

	/**
	 * End-to-end: root-level `styles.border.style` must NOT suppress the
	 * fallback (root border styles compile to `body` and `border-style`
	 * does not cascade as an inherited CSS property).
	 */
	public function test_render_block_filter_not_suppressed_by_root_border_style() {
		add_filter(
			'wp_theme_json_data_theme',
			array( $this, 'filter_inject_root_border_style' )
		);
		_gutenberg_clean_theme_json_caches();

		self::register_bordered_block_with_support(
			'test/fallback-root-border-noop',
			array(
				'__experimentalBorder' => array(
					'color' => true,
					'width' => true,
					'style' => true,
				),
			)
		);
		$inner_html = '<div style="border-color:#72aee6">x</div>';
		$rendered   = $this->render_block_through_filter(
			'test/fallback-root-border-noop',
			array(
				'style' => array( 'border' => array( 'color' => '#72aee6' ) ),
			),
			$inner_html
		);

		remove_filter(
			'wp_theme_json_data_theme',
			array( $this, 'filter_inject_root_border_style' )
		);
		_gutenberg_clean_theme_json_caches();

		$this->assertStringContainsString( 'border-top-style:solid', $rendered );
	}

	/**
	 * Filter callback: injects a block-type-level border style for the
	 * `test/fallback-inherited-block-type` block.
	 */
	public function filter_inject_block_type_border_style( $theme_json ) {
		return $theme_json->update_with(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'test/fallback-inherited-block-type' => array(
							'border' => array(
								'style' => 'dashed',
							),
						),
					),
				),
			)
		);
	}

	/**
	 * Filter callback: injects a root-level border style. Used to verify
	 * that the fallback ignores root border styles.
	 */
	public function filter_inject_root_border_style( $theme_json ) {
		return $theme_json->update_with(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'border' => array(
						'style' => 'dashed',
					),
				),
			)
		);
	}

	/**
	 * End-to-end: a non-rendering inherited style (`none`/`hidden`) must
	 * NOT suppress the fallback — otherwise a user adding a `borderColor`
	 * would see no border at all.
	 */
	public function test_render_block_filter_not_suppressed_by_non_rendering_inherited_style() {
		add_filter(
			'wp_theme_json_data_theme',
			array( $this, 'filter_inject_block_type_border_none' )
		);
		_gutenberg_clean_theme_json_caches();

		self::register_bordered_block_with_support(
			'test/fallback-inherited-none',
			array(
				'__experimentalBorder' => array(
					'color' => true,
					'width' => true,
					'style' => true,
				),
			)
		);
		$inner_html = '<div style="border-color:#72aee6">x</div>';
		$rendered   = $this->render_block_through_filter(
			'test/fallback-inherited-none',
			array(
				'style' => array( 'border' => array( 'color' => '#72aee6' ) ),
			),
			$inner_html
		);

		remove_filter(
			'wp_theme_json_data_theme',
			array( $this, 'filter_inject_block_type_border_none' )
		);
		_gutenberg_clean_theme_json_caches();

		$this->assertStringContainsString( 'border-top-style:solid', $rendered );
	}

	/**
	 * Filter callback: injects a block-type-level `border.style: 'none'`
	 * to verify it does not suppress the fallback.
	 */
	public function filter_inject_block_type_border_none( $theme_json ) {
		return $theme_json->update_with(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'test/fallback-inherited-none' => array(
							'border' => array(
								'style' => 'none',
							),
						),
					),
				),
			)
		);
	}

	public function test_gutenberg_get_variation_name_from_class_returns_null_for_empty_inputs() {
		$this->assertNull( gutenberg_get_variation_name_from_class( '', array() ) );
		$this->assertNull(
			gutenberg_get_variation_name_from_class(
				'is-style-outlined',
				array()
			)
		);
		$this->assertNull(
			gutenberg_get_variation_name_from_class(
				'',
				array( array( 'name' => 'outlined' ) )
			)
		);
	}

	public function test_gutenberg_get_variation_name_from_class_matches_registered_variation() {
		$registered = array(
			array( 'name' => 'outlined' ),
			array( 'name' => 'flush' ),
		);
		$this->assertSame(
			'outlined',
			gutenberg_get_variation_name_from_class(
				'wp-block-group is-style-outlined',
				$registered
			)
		);
	}

	public function test_gutenberg_get_variation_name_from_class_ignores_default_and_unknowns() {
		$registered = array( array( 'name' => 'outlined' ) );
		$this->assertNull(
			gutenberg_get_variation_name_from_class(
				'is-style-default is-style-unknown',
				$registered
			)
		);
	}
}
