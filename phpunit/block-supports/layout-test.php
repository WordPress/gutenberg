<?php

/**
 * Test the block layout support.
 *
 * @package gutenberg
 */

class WP_Block_Supports_Layout_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $theme_root;

	/**
	 * @var array|null
	 */
	private $orig_theme_dir;

	/**
	 * @var array|null
	 */
	private $queries;

	public function set_up() {
		parent::set_up();
		$this->theme_root     = realpath( __DIR__ . '/../data/themedir1' );
		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );
		$this->queries = array();
		// Clear caches.
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

			/*
		 * Register a style variation with a custom blockGap value for testing.
		 */
		register_block_style(
			'core/group',
			array(
				'name'       => 'custom-gap',
				'label'      => 'Custom Gap',
				'style_data' => array(
					'spacing' => array(
						'blockGap' => '99px',
					),
				),
			)
		);
	}

	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();

		// Clean up variation test data.
		unregister_block_style( 'core/group', 'custom-gap' );
		WP_Theme_JSON_Resolver::clean_cached_data();

		remove_filter( 'pre_option_gutenberg-experiments', array( $this, 'filter_enable_grid_interactivity' ), 11 );

		parent::tear_down();
	}

	/**
	 * Turns on the grid interactivity experiment. It runs after the test suite's own
	 * `pre_option_gutenberg-experiments` filter, so it keeps the experiments that filter
	 * returns; when another test has removed it, the filter receives `false` and grid
	 * interactivity is the only experiment on.
	 *
	 * @param mixed $experiments The `gutenberg-experiments` option.
	 * @return array The experiments, with grid interactivity turned on.
	 */
	public function filter_enable_grid_interactivity( $experiments ) {
		$experiments                                 = is_array( $experiments ) ? $experiments : array();
		$experiments['gutenberg-grid-interactivity'] = true;
		return $experiments;
	}

	public function filter_set_theme_root() {
		return $this->theme_root;
	}

	/**
	 * @dataProvider data_sanitize_block_gap_value
	 *
	 * @covers ::gutenberg_sanitize_block_gap_value
	 */
	public function test_sanitize_block_gap_value_normalizes_zero_and_rejects_other_non_string_values( $gap_value, $expected ) {
		$this->assertSame( $expected, gutenberg_sanitize_block_gap_value( $gap_value ) );
	}

	/**
	 * Data provider for test_sanitize_block_gap_value_normalizes_zero_and_rejects_other_non_string_values().
	 *
	 * @return array[] Test data.
	 */
	public function data_sanitize_block_gap_value() {
		return array(
			'string value'           => array( '1rem', '1rem' ),
			'empty string'           => array( '', null ),
			'whitespace-only string' => array( " \t\n", null ),
			'integer zero'           => array( 0, '0' ),
			'floating-point zero'    => array( 0.0, '0' ),
			'non-zero integer'       => array( 1, null ),
			'boolean value'          => array( true, null ),
			'object value'           => array( new stdClass(), null ),
			'nested array value'     => array(
				array(
					'top'  => array( '1rem' ),
					'left' => '2rem',
				),
				array( 'left' => '2rem' ),
			),
			'empty sanitized array'  => array( array( array( '1rem' ) ), null ),
		);
	}

	public function test_outer_container_not_restored_for_non_aligned_image_block_with_non_themejson_theme() {
		// The "default" theme doesn't have theme.json support.
		switch_theme( 'default' );
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array(),
		);
		$block_content = '<figure class="wp-block-image size-full"><img src="/my-image.jpg"/></figure>';
		$expected      = '<figure class="wp-block-image size-full"><img src="/my-image.jpg"/></figure>';

		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_content, $block ) );
	}

	public function test_outer_container_restored_for_aligned_image_block_with_non_themejson_theme() {
		// The "default" theme doesn't have theme.json support.
		switch_theme( 'default' );
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array(),
		);
		$block_content = '<figure class="wp-block-image alignright size-full"><img src="/my-image.jpg"/></figure>';
		$expected      = '<div class="wp-block-image"><figure class="alignright size-full"><img src="/my-image.jpg"/></figure></div>';

		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_content, $block ) );
	}

	public function test_additional_styles_moved_to_restored_outer_container_for_aligned_image_block_with_non_themejson_theme() {
		// The "default" theme doesn't have theme.json support.
		switch_theme( 'default' );
		$block = array(
			'blockName' => 'core/image',
			'attrs'     => array(
				'className' => 'is-style-round my-custom-classname',
			),
		);

		$block_classes_end_placement    = '<figure class="wp-block-image alignright size-full is-style-round my-custom-classname"><img src="/my-image.jpg"/></figure>';
		$block_classes_start_placement  = '<figure class="is-style-round my-custom-classname wp-block-image alignright size-full"><img src="/my-image.jpg"/></figure>';
		$block_classes_middle_placement = '<figure class="wp-block-image is-style-round my-custom-classname alignright size-full"><img src="/my-image.jpg"/></figure>';
		$block_classes_random_placement = '<figure class="is-style-round wp-block-image alignright my-custom-classname size-full"><img src="/my-image.jpg"/></figure>';
		$expected                       = '<div class="wp-block-image is-style-round my-custom-classname"><figure class="alignright size-full"><img src="/my-image.jpg"/></figure></div>';

		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_classes_end_placement, $block ) );
		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_classes_start_placement, $block ) );
		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_classes_middle_placement, $block ) );
		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_classes_random_placement, $block ) );

		$block_classes_other_attributes = '<figure style="color: red" class=\'is-style-round wp-block-image alignright my-custom-classname size-full\' data-random-tag=">"><img src="/my-image.jpg"/></figure>';
		$expected_other_attributes      = '<div class="wp-block-image is-style-round my-custom-classname"><figure style="color: red" class="alignright size-full" data-random-tag=">"><img src="/my-image.jpg"/></figure></div>';

		$this->assertSame( $expected_other_attributes, gutenberg_restore_image_outer_container( $block_classes_other_attributes, $block ) );
	}

	public function test_outer_container_not_restored_for_aligned_image_block_with_themejson_theme() {
		switch_theme( 'block-theme' );
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array(
				'className' => 'is-style-round my-custom-classname',
			),
		);
		$block_content = '<figure class="wp-block-image alignright size-full is-style-round my-custom-classname"><img src="/my-image.jpg"/></figure>';
		$expected      = '<figure class="wp-block-image alignright size-full is-style-round my-custom-classname"><img src="/my-image.jpg"/></figure>';

		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_content, $block ) );
	}

	const ARGS_DEFAULTS = array(
		'selector'                      => null,
		'layout'                        => null,
		'has_block_gap_support'         => false,
		'gap_value'                     => null,
		'should_skip_gap_serialization' => false,
		'fallback_gap_value'            => '0.5em',
		'block_spacing'                 => null,
		'options'                       => array(),
	);

	/**
	 * Generates the CSS corresponding to the provided layout.
	 *
	 * @dataProvider data_gutenberg_get_layout_style
	 *
	 * @covers ::gutenberg_get_layout_style
	 *
	 * @param array  $args            Dataset to test.
	 * @param string $expected_output The expected output.
	 */
	public function test_gutenberg_get_layout_style( $args, $expected_output ) {
		$args          = array_merge( static::ARGS_DEFAULTS, $args );
		$layout_styles = gutenberg_get_layout_style(
			$args['selector'],
			$args['layout'],
			$args['has_block_gap_support'],
			$args['gap_value'],
			$args['should_skip_gap_serialization'],
			$args['fallback_gap_value'],
			$args['block_spacing'],
			$args['options']
		);

		$this->assertSame( $expected_output, $layout_styles );
	}

	/**
	 * Data provider for test_gutenberg_get_layout_style().
	 *
	 * @return array
	 */
	public function data_gutenberg_get_layout_style() {
		return array(
			'no args should return empty value'            => array(
				'args'            => array(),
				'expected_output' => '',
			),
			'nulled args should return empty value'        => array(
				'args'            => array(
					'selector'                      => null,
					'layout'                        => null,
					'has_block_gap_support'         => null,
					'gap_value'                     => null,
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '',
			),
			'only selector should return empty value'      => array(
				'args'            => array(
					'selector' => '.wp-layout',
				),
				'expected_output' => '',
			),
			'default layout and block gap support'         => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'has_block_gap_support' => true,
					'gap_value'             => '1em',
				),
				'expected_output' => '.wp-layout > *{margin-block-start:0;margin-block-end:0;}.wp-layout > * + *{margin-block-start:1em;margin-block-end:0;}',
			),
			'skip serialization should return empty value' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'has_block_gap_support'         => true,
					'gap_value'                     => '1em',
					'should_skip_gap_serialization' => true,
				),
				'expected_output' => '',
			),
			'default layout and axial block gap support'   => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'has_block_gap_support' => true,
					'gap_value'             => array( 'top' => '1em' ),
				),
				'expected_output' => '.wp-layout > *{margin-block-start:0;margin-block-end:0;}.wp-layout > * + *{margin-block-start:1em;margin-block-end:0;}',
			),
			'constrained layout with sizes'                => array(
				'args'            => array(
					'selector' => '.wp-layout',
					'layout'   => array(
						'type'        => 'constrained',
						'contentSize' => '800px',
						'wideSize'    => '1200px',
					),
				),
				'expected_output' => '.wp-layout > :where(:not(.alignleft):not(.alignright):not(.alignfull)){max-width:800px;margin-left:auto !important;margin-right:auto !important;}.wp-layout > .alignwide{max-width:1200px;}.wp-layout .alignfull{max-width:none;}',
			),
			'constrained layout with sizes and block spacing' => array(
				'args'            => array(
					'selector'      => '.wp-layout',
					'layout'        => array(
						'type'        => 'constrained',
						'contentSize' => '800px',
						'wideSize'    => '1200px',
					),
					'block_spacing' => array(
						'padding' => array(
							'left'  => '20px',
							'right' => '10px',
						),
					),
				),
				'expected_output' => '.wp-layout > :where(:not(.alignleft):not(.alignright):not(.alignfull)){max-width:800px;margin-left:auto !important;margin-right:auto !important;}.wp-layout > .alignwide{max-width:1200px;}.wp-layout .alignfull{max-width:none;}.wp-layout > .alignfull{margin-right:calc(10px * -1);margin-left:calc(20px * -1);}',
			),
			'constrained layout with content size unset in viewport' => array(
				'args'            => array(
					'selector' => '.wp-layout',
					'layout'   => array(
						'type'        => 'constrained',
						'contentSize' => '800px',
					),
					'options'  => array(
						'viewport_overrides' => array(
							'contentSize' => null,
						),
					),
				),
				'expected_output' => '.wp-layout > :where(:not(.alignleft):not(.alignright):not(.alignfull)){max-width:var(--wp--style--global--content-size, none);}.wp-layout > .alignwide{max-width:var(--wp--style--global--wide-size, none);}.wp-layout .alignfull{max-width:none;}',
			),
			'constrained layout with block gap support'    => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'layout'                => array(
						'type' => 'constrained',
					),
					'has_block_gap_support' => true,
					'gap_value'             => '2.5rem',
				),
				'expected_output' => '.wp-layout > *{margin-block-start:0;margin-block-end:0;}.wp-layout > * + *{margin-block-start:2.5rem;margin-block-end:0;}',
			),
			'constrained layout with axial block gap support' => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'layout'                => array(
						'type' => 'constrained',
					),
					'has_block_gap_support' => true,
					'gap_value'             => array( 'top' => '2.5rem' ),
				),
				'expected_output' => '.wp-layout > *{margin-block-start:0;margin-block-end:0;}.wp-layout > * + *{margin-block-start:2.5rem;margin-block-end:0;}',
			),
			'constrained layout with block gap support and spacing preset' => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'layout'                => array(
						'type' => 'constrained',
					),
					'has_block_gap_support' => true,
					'gap_value'             => 'var:preset|spacing|50',
				),
				'expected_output' => '.wp-layout > *{margin-block-start:0;margin-block-end:0;}.wp-layout > * + *{margin-block-start:var(--wp--preset--spacing--50);margin-block-end:0;}',
			),
			'flex layout with no args should return empty value' => array(
				'args'            => array(
					'selector' => '.wp-layout',
					'layout'   => array(
						'type' => 'flex',
					),
				),
				'expected_output' => '',
			),
			'horizontal flex layout should return empty value' => array(
				'args'            => array(
					'selector' => '.wp-layout',
					'layout'   => array(
						'type'        => 'flex',
						'orientation' => 'horizontal',
					),
				),
				'expected_output' => '',
			),
			'flex layout with properties'                  => array(
				'args'            => array(
					'selector' => '.wp-layout',
					'layout'   => array(
						'type'              => 'flex',
						'orientation'       => 'horizontal',
						'flexWrap'          => 'nowrap',
						'justifyContent'    => 'left',
						'verticalAlignment' => 'bottom',
					),
				),
				'expected_output' => '.wp-layout{flex-wrap:nowrap;justify-content:flex-start;align-items:flex-end;}',
			),
			'flex layout with properties and block gap'    => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'layout'                => array(
						'type'              => 'flex',
						'orientation'       => 'horizontal',
						'flexWrap'          => 'nowrap',
						'justifyContent'    => 'left',
						'verticalAlignment' => 'bottom',
					),
					'has_block_gap_support' => true,
					'gap_value'             => '29px',
				),
				'expected_output' => '.wp-layout{flex-wrap:nowrap;gap:29px;justify-content:flex-start;align-items:flex-end;}',
			),
			'flex layout with properties and axial block gap' => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'layout'                => array(
						'type'              => 'flex',
						'orientation'       => 'horizontal',
						'flexWrap'          => 'nowrap',
						'justifyContent'    => 'left',
						'verticalAlignment' => 'bottom',
					),
					'has_block_gap_support' => true,
					'gap_value'             => array(
						'top'  => '1px',
						'left' => '2px',
					),
				),
				'expected_output' => '.wp-layout{flex-wrap:nowrap;gap:1px 2px;justify-content:flex-start;align-items:flex-end;}',
			),
			'flex layout with properties and axial block gap using spacing preset' => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'layout'                => array(
						'type'              => 'flex',
						'orientation'       => 'horizontal',
						'flexWrap'          => 'nowrap',
						'justifyContent'    => 'left',
						'verticalAlignment' => 'bottom',
					),
					'has_block_gap_support' => true,
					'gap_value'             => array(
						'left' => 'var:preset|spacing|40',
					),
					'fallback_gap_value'    => '11px',
				),
				'expected_output' => '.wp-layout{flex-wrap:nowrap;gap:11px var(--wp--preset--spacing--40);justify-content:flex-start;align-items:flex-end;}',
			),
			'flex layout uses the default for malformed gap values' => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'layout'                => array( 'type' => 'flex' ),
					'has_block_gap_support' => true,
					'gap_value'             => array( 'left' => '2rem' ),
					'fallback_gap_value'    => array(
						'top'  => array( '1rem' ),
						'left' => new stdClass(),
					),
				),
				'expected_output' => '.wp-layout{gap:0.5em 2rem;}',
			),
			'flex layout ignores an empty block gap'       => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'layout'                => array( 'type' => 'flex' ),
					'has_block_gap_support' => true,
					'gap_value'             => '',
				),
				'expected_output' => '',
			),
			'vertical flex layout with properties'         => array(
				'args'            => array(
					'selector' => '.wp-layout',
					'layout'   => array(
						'type'              => 'flex',
						'orientation'       => 'vertical',
						'flexWrap'          => 'nowrap',
						'justifyContent'    => 'left',
						'verticalAlignment' => 'bottom',
					),
				),
				'expected_output' => '.wp-layout{flex-wrap:nowrap;flex-direction:column;align-items:flex-start;justify-content:flex-end;}',
			),
			'vertical flex layout switched to horizontal in a viewport' => array(
				'args'            => array(
					'selector' => '.wp-layout',
					'layout'   => array(
						'type'           => 'flex',
						'orientation'    => 'vertical',
						'flexWrap'       => 'nowrap',
						'justifyContent' => 'center',
					),
					'options'  => array(
						'viewport_overrides' => array(
							'orientation'    => 'horizontal',
							'justifyContent' => 'left',
						),
					),
				),
				'expected_output' => '.wp-layout{flex-direction:row;justify-content:flex-start;}',
			),
			'horizontal flex layout keeps flex-direction implicit in a viewport' => array(
				'args'            => array(
					'selector' => '.wp-layout',
					'layout'   => array(
						'type'           => 'flex',
						'orientation'    => 'horizontal',
						'justifyContent' => 'left',
					),
					'options'  => array(
						'viewport_overrides' => array(
							'justifyContent' => 'right',
						),
					),
				),
				'expected_output' => '.wp-layout{justify-content:flex-end;}',
			),
			'default grid layout'                          => array(
				'args'            => array(
					'selector' => '.wp-layout',
					'layout'   => array(
						'type' => 'grid',
					),
				),
				'expected_output' => '.wp-layout{grid-template-columns:repeat(auto-fill, minmax(min(12rem, 100%), 1fr));container-type:inline-size;}',
			),
			'grid layout uses the default for malformed gap values' => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'layout'                => array( 'type' => 'grid' ),
					'has_block_gap_support' => true,
					'gap_value'             => array( 'left' => '2rem' ),
					'fallback_gap_value'    => array(
						'top'  => array( '1rem' ),
						'left' => new stdClass(),
					),
				),
				'expected_output' => '.wp-layout{grid-template-columns:repeat(auto-fill, minmax(min(12rem, 100%), 1fr));container-type:inline-size;gap:0.5em 2rem;}',
			),
			'grid layout with columnCount'                 => array(
				'args'            => array(
					'selector' => '.wp-layout',
					'layout'   => array(
						'type'        => 'grid',
						'columnCount' => 3,
					),
				),
				'expected_output' => '.wp-layout{grid-template-columns:repeat(3, minmax(0, 1fr));}',
			),
			'grid layout uses horizontal gap for responsive columns' => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'layout'                => array(
						'type'               => 'grid',
						'columnCount'        => 3,
						'minimumColumnWidth' => '12rem',
					),
					'has_block_gap_support' => true,
					'gap_value'             => array(
						'top'  => '2rem',
						'left' => '3rem',
					),
				),
				'expected_output' => '.wp-layout{grid-template-columns:repeat(auto-fill, minmax(max(min(12rem, 100%), (100% - (3rem * (3 - 1))) /3), 1fr));container-type:inline-size;gap:2rem 3rem;}',
			),
			'grid layout uses fallback when horizontal gap is missing' => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'layout'                => array(
						'type'               => 'grid',
						'columnCount'        => 3,
						'minimumColumnWidth' => '12rem',
					),
					'has_block_gap_support' => true,
					'gap_value'             => array( 'top' => '2rem' ),
					'fallback_gap_value'    => '1.2rem',
				),
				'expected_output' => '.wp-layout{grid-template-columns:repeat(auto-fill, minmax(max(min(12rem, 100%), (100% - (1.2rem * (3 - 1))) /3), 1fr));container-type:inline-size;gap:2rem 1.2rem;}',
			),
			'grid layout preserves zero horizontal gap'    => array(
				'args'            => array(
					'selector'              => '.wp-layout',
					'layout'                => array(
						'type'               => 'grid',
						'columnCount'        => 3,
						'minimumColumnWidth' => '12rem',
					),
					'has_block_gap_support' => true,
					'gap_value'             => array(
						'top'  => '2rem',
						'left' => '0',
					),
				),
				'expected_output' => '.wp-layout{grid-template-columns:repeat(auto-fill, minmax(max(min(12rem, 100%), (100% - (0px * (3 - 1))) /3), 1fr));container-type:inline-size;gap:2rem 0;}',
			),
			'default layout with blockGap to verify converting gap value into valid CSS' => array(
				'args'            => array(
					'selector'              => '.wp-block-group.wp-container-6',
					'layout'                => array(
						'type' => 'default',
					),
					'has_block_gap_support' => true,
					'gap_value'             => 'var:preset|spacing|70',
					'block_spacing'         => array(
						'blockGap' => 'var(--wp--preset--spacing--70)',
					),
				),
				'expected_output' => '.wp-block-group.wp-container-6 > *{margin-block-start:0;margin-block-end:0;}.wp-block-group.wp-container-6 > * + *{margin-block-start:var(--wp--preset--spacing--70);margin-block-end:0;}',
			),
		);
	}

	/**
	 * Check that gutenberg_get_child_layout_style_rules() renders flex child sizing styles.
	 *
	 * @dataProvider data_gutenberg_get_child_layout_style_rules
	 *
	 * @covers ::gutenberg_get_child_layout_style_rules
	 *
	 * @param array      $child_layout       Child layout values.
	 * @param array|null $viewport_overrides Optional child viewport layout overrides.
	 * @param array      $expected_output    The expected output.
	 */
	public function test_gutenberg_get_child_layout_style_rules( $child_layout, $viewport_overrides, $expected_output ) {
		$actual_output = gutenberg_get_child_layout_style_rules(
			'.wp-container-content-test',
			$child_layout,
			array(),
			$viewport_overrides
		);

		$this->assertSame( $expected_output, $actual_output );
	}

	/**
	 * Data provider for test_gutenberg_get_child_layout_style_rules().
	 *
	 * @return array
	 */
	public function data_gutenberg_get_child_layout_style_rules() {
		return array(
			'legacy fixed sizing remains shrinkable'      => array(
				'child_layout'       => array(
					'selfStretch' => 'fixed',
					'flexSize'    => '320px',
				),
				'viewport_overrides' => null,
				'expected_output'    => array(
					array(
						'selector'     => '.wp-container-content-test',
						'declarations' => array(
							'flex-basis' => '320px',
							'box-sizing' => 'border-box',
						),
					),
				),
			),
			'fixed sizing can opt out of shrinking'       => array(
				'child_layout'       => array(
					'selfStretch' => 'fixedNoShrink',
					'flexSize'    => '320px',
				),
				'viewport_overrides' => null,
				'expected_output'    => array(
					array(
						'selector'     => '.wp-container-content-test',
						'declarations' => array(
							'flex-basis'  => '320px',
							'flex-shrink' => '0',
							'box-sizing'  => 'border-box',
						),
					),
				),
			),
			'viewport overrides can switch fixedNoShrink to max' => array(
				'child_layout'       => array(
					'selfStretch' => 'fixedNoShrink',
					'flexSize'    => '320px',
				),
				'viewport_overrides' => array(
					'selfStretch' => 'fixed',
				),
				'expected_output'    => array(
					array(
						'selector'     => '.wp-container-content-test',
						'declarations' => array(
							'flex-basis'  => '320px',
							'flex-shrink' => 'unset',
							'box-sizing'  => 'border-box',
						),
					),
				),
			),
			'viewport overrides can switch fixedNoShrink to fit' => array(
				'child_layout'       => array(
					'selfStretch' => 'fixedNoShrink',
					'flexSize'    => '320px',
				),
				'viewport_overrides' => array(
					'selfStretch' => 'fit',
				),
				'expected_output'    => array(
					array(
						'selector'     => '.wp-container-content-test',
						'declarations' => array(
							'flex-basis'  => 'unset',
							'flex-shrink' => 'unset',
						),
					),
				),
			),
			'viewport overrides can switch fixed to fit'  => array(
				'child_layout'       => array(
					'selfStretch' => 'fixed',
					'flexSize'    => '320px',
				),
				'viewport_overrides' => array(
					'selfStretch' => 'fit',
				),
				'expected_output'    => array(
					array(
						'selector'     => '.wp-container-content-test',
						'declarations' => array(
							'flex-basis' => 'unset',
						),
					),
				),
			),
			'viewport overrides can switch fixedNoShrink to grow' => array(
				'child_layout'       => array(
					'selfStretch' => 'fixedNoShrink',
					'flexSize'    => '320px',
				),
				'viewport_overrides' => array(
					'selfStretch' => 'fill',
				),
				'expected_output'    => array(
					array(
						'selector'     => '.wp-container-content-test',
						'declarations' => array(
							'flex-basis'  => 'unset',
							'flex-shrink' => 'unset',
							'flex-grow'   => '1',
						),
					),
				),
			),
			'viewport overrides can switch fixed to grow' => array(
				'child_layout'       => array(
					'selfStretch' => 'fixed',
					'flexSize'    => '320px',
				),
				'viewport_overrides' => array(
					'selfStretch' => 'fill',
				),
				'expected_output'    => array(
					array(
						'selector'     => '.wp-container-content-test',
						'declarations' => array(
							'flex-basis' => 'unset',
							'flex-grow'  => '1',
						),
					),
				),
			),
		);
	}

	/**
	 * Check that gutenberg_render_layout_support_flag() renders the correct classnames on the wrapper.
	 *
	 * @dataProvider data_layout_support_flag_renders_classnames_on_wrapper
	 *
	 * @covers ::gutenberg_render_layout_support_flag
	 *
	 * @param array  $args            Dataset to test.
	 * @param string $expected_output The expected output.
	 */
	public function test_layout_support_flag_renders_classnames_on_wrapper( $args, $expected_output ) {
		switch_theme( 'default' );
		$actual_output = gutenberg_render_layout_support_flag( $args['block_content'], $args['block'] );
		$this->assertEquals( $expected_output, $actual_output );
	}

	/**
	 * Data provider for test_layout_support_flag_renders_classnames_on_wrapper.
	 *
	 * @return array
	 */
	public function data_layout_support_flag_renders_classnames_on_wrapper() {
		return array(
			'single wrapper block layout with flow type'   => array(
				'args'            => array(
					'block_content' => '<div class="wp-block-group"></div>',
					'block'         => array(
						'blockName'    => 'core/group',
						'attrs'        => array(
							'layout' => array(
								'type' => 'default',
							),
						),
						'innerBlocks'  => array(),
						'innerHTML'    => '<div class="wp-block-group"></div>',
						'innerContent' => array(
							'<div class="wp-block-group"></div>',
						),
					),
				),
				'expected_output' => '<div class="wp-block-group is-layout-flow wp-block-group-is-layout-flow"></div>',
			),
			'single wrapper block layout with malformed axial block gap' => array(
				'args'            => array(
					'block_content' => '<div class="wp-block-group"></div>',
					'block'         => array(
						'blockName'    => 'core/group',
						'attrs'        => array(
							'layout' => array(
								'type' => 'default',
							),
							'style'  => array(
								'spacing' => array(
									'blockGap' => array(
										'top' => array( '1rem' ),
									),
								),
							),
						),
						'innerBlocks'  => array(),
						'innerHTML'    => '<div class="wp-block-group"></div>',
						'innerContent' => array(
							'<div class="wp-block-group"></div>',
						),
					),
				),
				'expected_output' => '<div class="wp-block-group is-layout-flow wp-block-group-is-layout-flow"></div>',
			),
			'single wrapper block layout with constrained type' => array(
				'args'            => array(
					'block_content' => '<div class="wp-block-group"></div>',
					'block'         => array(
						'blockName'    => 'core/group',
						'attrs'        => array(
							'layout' => array(
								'type' => 'constrained',
							),
						),
						'innerBlocks'  => array(),
						'innerHTML'    => '<div class="wp-block-group"></div>',
						'innerContent' => array(
							'<div class="wp-block-group"></div>',
						),
					),
				),
				'expected_output' => '<div class="wp-block-group is-layout-constrained wp-block-group-is-layout-constrained"></div>',
			),
			'multiple wrapper block layout with flow type' => array(
				'args'            => array(
					'block_content' => '<div class="wp-block-group"><div class="wp-block-group__inner-wrapper"></div></div>',
					'block'         => array(
						'blockName'    => 'core/group',
						'attrs'        => array(
							'layout' => array(
								'type' => 'default',
							),
						),
						'innerBlocks'  => array(),
						'innerHTML'    => '<div class="wp-block-group"><div class="wp-block-group__inner-wrapper"></div></div>',
						'innerContent' => array(
							'<div class="wp-block-group"><div class="wp-block-group__inner-wrapper">',
							' ',
							' </div></div>',
						),
					),
				),
				'expected_output' => '<div class="wp-block-group"><div class="wp-block-group__inner-wrapper is-layout-flow wp-block-group-is-layout-flow"></div></div>',
			),
			'block with child layout'                      => array(
				'args'            => array(
					'block_content' => '<p>Some text.</p>',
					'block'         => array(
						'blockName'    => 'core/paragraph',
						'attrs'        => array(
							'style' => array(
								'layout' => array(
									'columnSpan' => '2',
								),
							),
						),
						'innerBlocks'  => array(),
						'innerHTML'    => '<p>Some text.</p>',
						'innerContent' => array(
							'<p>Some text.</p>',
						),
					),
				),
				'expected_output' => '<p class="wp-container-content-b7aa651c">Some text.</p>',
			),
			'single wrapper block layout with flex type'   => array(
				'args'            => array(
					'block_content' => '<div class="wp-block-group"></div>',
					'block'         => array(
						'blockName'    => 'core/group',
						'attrs'        => array(
							'layout' => array(
								'type'        => 'flex',
								'orientation' => 'horizontal',
								'flexWrap'    => 'nowrap',
							),
						),
						'innerBlocks'  => array(),
						'innerHTML'    => '<div class="wp-block-group"></div>',
						'innerContent' => array(
							'<div class="wp-block-group"></div>',
						),
					),
				),
				'expected_output' => '<div class="wp-block-group is-horizontal is-nowrap is-layout-flex wp-container-core-group-is-layout-ee7b5020 wp-block-group-is-layout-flex"></div>',
			),
			'single wrapper block layout with grid type'   => array(
				'args'            => array(
					'block_content' => '<div class="wp-block-group"></div>',
					'block'         => array(
						'blockName'    => 'core/group',
						'attrs'        => array(
							'layout' => array(
								'type' => 'grid',
							),
						),
						'innerBlocks'  => array(),
						'innerHTML'    => '<div class="wp-block-group"></div>',
						'innerContent' => array(
							'<div class="wp-block-group"></div>',
						),
					),
				),
				'expected_output' => '<div class="wp-block-group is-layout-grid wp-container-core-group-is-layout-9d260ee2 wp-block-group-is-layout-grid"></div>',
			),
			/*
			 * When the first innerContent chunk contains a sibling element (one that fully opens
			 * and closes before the inner blocks), the layout classes must be added to the outer
			 * container — not to the sibling. The sibling's class was incorrectly chosen by the
			 * previous logic because it was the last class encountered while scanning the chunk.
			 */
			'outer wrapper targeted when sibling element precedes inner blocks' => array(
				'args'            => array(
					'block_content' => '<div class="wp-block-group"><div class="wp-block-group__header">Header</div><p>Inner block</p></div>',
					'block'         => array(
						'blockName'    => 'core/group',
						'attrs'        => array(
							'layout' => array(
								'type' => 'default',
							),
						),
						'innerBlocks'  => array(),
						'innerHTML'    => '<div class="wp-block-group"><div class="wp-block-group__header">Header</div><p>Inner block</p></div>',
						'innerContent' => array(
							'<div class="wp-block-group"><div class="wp-block-group__header">Header</div>',
							null,
							'</div>',
						),
					),
				),
				'expected_output' => '<div class="wp-block-group is-layout-flow wp-block-group-is-layout-flow"><div class="wp-block-group__header">Header</div><p>Inner block</p></div>',
			),
		);
	}

	/**
	 * Check that gutenberg_restore_group_inner_container() restores the legacy inner container on the Group block.
	 *
	 * @dataProvider data_restore_group_inner_container
	 *
	 * @covers ::gutenberg_restore_group_inner_container
	 *
	 * @param array  $args            Dataset to test.
	 * @param string $expected_output The expected output.
	 */
	public function test_restore_group_inner_container( $args, $expected_output ) {
		$actual_output = gutenberg_restore_group_inner_container( $args['block_content'], $args['block'] );
		$this->assertEquals( $expected_output, $actual_output );
	}

	/**
	 * Data provider for test_restore_group_inner_container.
	 *
	 * @return array
	 */
	public function data_restore_group_inner_container() {
		return array(
			'group block with existing inner container'    => array(
				'args'            => array(
					'block_content' => '<div class="wp-block-group"><div class="wp-block-group__inner-container"></div></div>',
					'block'         => array(
						'blockName'    => 'core/group',
						'attrs'        => array(
							'layout' => array(
								'type' => 'default',
							),
						),
						'innerBlocks'  => array(),
						'innerHTML'    => '<div class="wp-block-group"><div class="wp-block-group__inner-container"></div></div>',
						'innerContent' => array(
							'<div class="wp-block-group"><div class="wp-block-group__inner-container">',
							' ',
							' </div></div>',
						),
					),
				),
				'expected_output' => '<div class="wp-block-group"><div class="wp-block-group__inner-container"></div></div>',
			),
			'group block with no existing inner container' => array(
				'args'            => array(
					'block_content' => '<div class="wp-block-group"></div>',
					'block'         => array(
						'blockName'    => 'core/group',
						'attrs'        => array(
							'layout' => array(
								'type' => 'default',
							),
						),
						'innerBlocks'  => array(),
						'innerHTML'    => '<div class="wp-block-group"></div>',
						'innerContent' => array(
							'<div class="wp-block-group">',
							' ',
							' </div>',
						),
					),
				),
				'expected_output' => '<div class="wp-block-group"><div class="wp-block-group__inner-container"></div></div>',
			),
			'group block with layout classnames'           => array(
				'args'            => array(
					'block_content' => '<div class="wp-block-group is-layout-constrained wp-block-group-is-layout-constrained"></div>',
					'block'         => array(
						'blockName'    => 'core/group',
						'attrs'        => array(
							'layout' => array(
								'type' => 'default',
							),
						),
						'innerBlocks'  => array(),
						'innerHTML'    => '<div class="wp-block-group"></div>',
						'innerContent' => array(
							'<div class="wp-block-group">',
							' ',
							' </div>',
						),
					),
				),
				'expected_output' => '<div class="wp-block-group"><div class="wp-block-group__inner-container is-layout-constrained wp-block-group-is-layout-constrained"></div></div>',
			),
		);
	}

	/**
	 * Check that gutenberg_render_layout_support_flag() renders consistent hashes
	 * for the container class when the relevant layout properties are the same.
	 *
	 * @dataProvider data_layout_support_flag_renders_consistent_container_hash
	 *
	 * @covers ::gutenberg_render_layout_support_flag
	 *
	 * @param array $block_attrs    Dataset to test.
	 * @param array $expected_class Class generated for the passed dataset.
	 */
	public function test_layout_support_flag_renders_consistent_container_hash( $block_attrs, $expected_class ) {
		switch_theme( 'default' );

		$block_content = '<div class="wp-block-group"></div>';
		$block         = array(
			'blockName'    => 'core/group',
			'innerBlocks'  => array(),
			'innerHTML'    => '<div class="wp-block-group"></div>',
			'innerContent' => array(
				'<div class="wp-block-group"></div>',
			),
			'attrs'        => $block_attrs,
		);

		/*
		 * The `appearance-tools` theme support is temporarily added to ensure
		 * that the block gap support is enabled during rendering, which is
		 * necessary to compute styles for layouts with block gap values.
		 */
		add_theme_support( 'appearance-tools' );
		$output = gutenberg_render_layout_support_flag( $block_content, $block );
		remove_theme_support( 'appearance-tools' );

		// Process the output and look for the expected class in the first rendered element.
		$processor = new WP_HTML_Tag_Processor( $output );
		$processor->next_tag();

		// Extract the actual container class from the output for better error messages.
		$actual_class = '';
		foreach ( $processor->class_list() as $class_name ) {
			if ( str_starts_with( $class_name, 'wp-container-core-group-is-layout-' ) ) {
				$actual_class = $class_name;
				break;
			}
		}

		$this->assertSame(
			$expected_class,
			$actual_class,
			'Expected class not found in the rendered output, probably because of a different hash.'
		);
	}

	/**
	 * Data provider for test_layout_support_flag_renders_consistent_container_hash.
	 *
	 * @return array
	 */
	public function data_layout_support_flag_renders_consistent_container_hash() {
		return array(
			'default type block gap 12px'      => array(
				'block_attributes' => array(
					'layout' => array(
						'type' => 'default',
					),
					'style'  => array(
						'spacing' => array(
							'blockGap' => '12px',
						),
					),
				),
				'expected_class'   => 'wp-container-core-group-is-layout-a6248535',
			),
			'default type block gap 24px'      => array(
				'block_attributes' => array(
					'layout' => array(
						'type' => 'default',
					),
					'style'  => array(
						'spacing' => array(
							'blockGap' => '24px',
						),
					),
				),
				'expected_class'   => 'wp-container-core-group-is-layout-61b496ee',
			),
			'constrained type justified left'  => array(
				'block_attributes' => array(
					'layout' => array(
						'type'           => 'constrained',
						'justifyContent' => 'left',
					),
				),
				'expected_class'   => 'wp-container-core-group-is-layout-54d22900',
			),
			'constrained type justified right' => array(
				'block_attributes' => array(
					'layout' => array(
						'type'           => 'constrained',
						'justifyContent' => 'right',
					),
				),
				'expected_class'   => 'wp-container-core-group-is-layout-2910ada7',
			),
			'flex type horizontal'             => array(
				'block_attributes' => array(
					'layout' => array(
						'type'        => 'flex',
						'orientation' => 'horizontal',
						'flexWrap'    => 'nowrap',
					),
				),
				'expected_class'   => 'wp-container-core-group-is-layout-f5d79bea',
			),
			'flex type vertical'               => array(
				'block_attributes' => array(
					'layout' => array(
						'type'        => 'flex',
						'orientation' => 'vertical',
					),
				),
				'expected_class'   => 'wp-container-core-group-is-layout-2c90304e',
			),
			'grid type'                        => array(
				'block_attributes' => array(
					'layout' => array(
						'type' => 'grid',
					),
				),
				'expected_class'   => 'wp-container-core-group-is-layout-5a23bf8e',
			),
			'grid type 3 columns'              => array(
				'block_attributes' => array(
					'layout' => array(
						'type'        => 'grid',
						'columnCount' => 3,
					),
				),
				'expected_class'   => 'wp-container-core-group-is-layout-cda6dc4f',
			),
		);
	}

	/**
	 * Tests that block style variations with blockGap values are applied to layout styles.
	 *
	 * @covers ::wp_render_layout_support_flag
	 */
	public function test_layout_support_flag_uses_variation_block_gap_value() {
		switch_theme( 'block-theme' );

		$block_content = '<div class="wp-block-group is-style-custom-gap"></div>';
		$block         = array(
			'blockName'    => 'core/group',
			'attrs'        => array(
				'className' => 'is-style-custom-gap',
				'layout'    => array(
					'type'               => 'grid',
					'columnCount'        => 3,
					'minimumColumnWidth' => '12rem',

				),
			),
			'innerBlocks'  => array(),
			'innerHTML'    => '<div class="wp-block-group is-style-custom-gap"></div>',
			'innerContent' => array(
				'<div class="wp-block-group is-style-custom-gap"></div>',
			),
		);

		gutenberg_render_layout_support_flag( $block_content, $block );

		// Get the generated CSS from the style engine.
		$actual_stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );

		// The CSS grid declaration should contain the variation's blockGap value of 99px.
		$this->assertStringContainsString(
			'grid-template-columns:repeat(auto-fill, minmax(max(min(12rem, 100%), (100% - (99px * (3 - 1))) /3), 1fr))',
			$actual_stylesheet,
			'Generated CSS should contain the variation blockGap value of 99px.'
		);
	}

	/**
	 * Tests that gutenberg_get_block_style_variation_name_from_registered_style correctly extracts variation names from class strings.
	 *
	 * @covers ::gutenberg_get_block_style_variation_name_from_registered_style
	 *
	 * @dataProvider data_get_block_style_variation_name_from_registered_style
	 *
	 * @param string      $class_name        CSS class string to test.
	 * @param array       $registered_styles Registered block styles.
	 * @param string|null $expected_result   Expected variation name or null.
	 */
	public function test_get_block_style_variation_name_from_registered_style( $class_name, $registered_styles, $expected_result ) {
		$result = gutenberg_get_block_style_variation_name_from_registered_style( $class_name, $registered_styles );
		$this->assertSame( $expected_result, $result );
	}

	/**
	 * Data provider for test_get_block_style_variation_name_from_registered_style.
	 *
	 * @return array
	 */
	public function data_get_block_style_variation_name_from_registered_style() {
		return array(
			'empty class name'                             => array(
				'class_name'        => '',
				'registered_styles' => array(),
				'expected_result'   => null,
			),
			'no matching registered styles'                => array(
				'class_name'        => 'is-style-shadowed wp-block-button',
				'registered_styles' => array(
					array( 'name' => 'rounded' ),
					array( 'name' => 'outlined' ),
				),
				'expected_result'   => null,
			),
			'single matching variation found'              => array(
				'class_name'        => 'wp-block-button is-style-rounded',
				'registered_styles' => array(
					array( 'name' => 'rounded' ),
					array( 'name' => 'outlined' ),
				),
				'expected_result'   => 'rounded',
			),
			'ignores default style only'                   => array(
				'class_name'        => 'is-style-default wp-block-button',
				'registered_styles' => array(
					array( 'name' => 'default' ),
					array( 'name' => 'rounded' ),
				),
				'expected_result'   => null,
			),
			'ignores default and returns next variation'   => array(
				'class_name'        => 'is-style-default is-style-rounded wp-block-button',
				'registered_styles' => array(
					array( 'name' => 'default' ),
					array( 'name' => 'rounded' ),
					array( 'name' => 'outlined' ),
				),
				'expected_result'   => 'rounded',
			),
			'returns first matching variation when multiple present' => array(
				'class_name'        => 'is-style-shadowed is-style-rounded',
				'registered_styles' => array(
					array( 'name' => 'rounded' ),
					array( 'name' => 'outlined' ),
					array( 'name' => 'shadowed' ),
				),
				'expected_result'   => 'shadowed',
			),
			'empty registered styles array'                => array(
				'class_name'        => 'is-style-rounded',
				'registered_styles' => array(),
				'expected_result'   => null,
			),
			'registered styles with missing name property' => array(
				'class_name'        => 'is-style-outlined wp-block-button',
				'registered_styles' => array(
					array( 'label' => 'Rounded' ),
					array( 'name' => 'outlined' ),
				),
				'expected_result'   => 'outlined',
			),
		);
	}

	/**
	 * Tests that a non-string `className` attribute does not cause a fatal
	 * when checking for style variation layout styles.
	 *
	 * @covers ::gutenberg_render_layout_support_flag
	 */
	public function test_layout_support_flag_with_non_string_class_name() {
		$block_content = '<div class="wp-block-group 0 1"></div>';
		$block         = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'className' => array( '0', '1' ),
				'layout'    => array(
					'type' => 'constrained',
				),
			),
		);

		$this->assertSame(
			'<div class="wp-block-group 0 1 is-layout-constrained wp-block-group-is-layout-constrained"></div>',
			gutenberg_render_layout_support_flag( $block_content, $block ),
			'Layout support should render the expected markup when className is not a string'
		);
	}

	/**
	 * Tests that layout support returns early, without resolving global settings,
	 * for a block that cannot produce any layout output.
	 *
	 * Resolving global settings reads the user's `wp_global_styles` post with a
	 * `WP_Query`, which fires `the_posts`. A callback on that hook that renders
	 * blocks re-enters this filter, so the bail-out has to happen before the
	 * lookup or the recursion has no base case.
	 *
	 * @covers ::gutenberg_render_layout_support_flag
	 */
	public function test_layout_support_flag_returns_early_before_resolving_global_settings() {
		$user_data_resolutions = 0;
		add_filter(
			'wp_theme_json_data_user',
			static function ( $theme_json ) use ( &$user_data_resolutions ) {
				++$user_data_resolutions;
				return $theme_json;
			}
		);

		// A block with no layout support and no child layout, as produced by
		// parsing content that has no block delimiters.
		$block_content = '<p>Not a block.</p>';
		$block         = array(
			'blockName' => null,
			'attrs'     => array(),
		);

		// Start from a cold cache, as on a front-end request.
		_gutenberg_clean_theme_json_caches();

		$this->assertSame(
			$block_content,
			gutenberg_render_layout_support_flag( $block_content, $block ),
			'Block content should be returned unchanged when the block has no layout support.'
		);
		$this->assertSame(
			0,
			$user_data_resolutions,
			'Global settings should not be resolved for a block that cannot produce layout output.'
		);

		// A block that does support layout still resolves global settings, which
		// confirms the assertion above is not passing because of a warm cache.
		_gutenberg_clean_theme_json_caches();

		gutenberg_render_layout_support_flag(
			'<div class="wp-block-group"></div>',
			array(
				'blockName' => 'core/group',
				'attrs'     => array( 'layout' => array( 'type' => 'constrained' ) ),
			)
		);

		$this->assertGreaterThan(
			0,
			$user_data_resolutions,
			'Global settings should still be resolved for a block that supports layout.'
		);
	}

	/**
	 * Tests that a constrained layout with non-string contentSize/wideSize/justifyContent
	 * values (e.g. from hand-edited, imported, or AI-generated content) does not cause a
	 * fatal error in the explode() calls.
	 *
	 * @covers ::gutenberg_get_layout_style
	 */
	public function test_gutenberg_get_layout_style_with_non_string_constrained_sizes() {
		$layout_styles = gutenberg_get_layout_style(
			'.wp-layout',
			array(
				'type'           => 'constrained',
				'contentSize'    => array( '800px' ),
				'wideSize'       => array( '1200px' ),
				'justifyContent' => array( 'center' ),
			)
		);

		$this->assertIsString( $layout_styles, 'Constrained layout should not fatal when sizes are not strings.' );
		$this->assertStringNotContainsString( 'Array', $layout_styles, 'A non-string size value should not leak into the output.' );
	}

	/**
	 * Tests that a flex layout with non-string justifyContent/verticalAlignment values
	 * does not cause a fatal error in the array_key_exists() calls.
	 *
	 * @covers ::gutenberg_get_layout_style
	 */
	public function test_gutenberg_get_layout_style_with_non_string_flex_alignment() {
		$layout_styles = gutenberg_get_layout_style(
			'.wp-layout',
			array(
				'type'              => 'flex',
				'orientation'       => 'horizontal',
				'justifyContent'    => array( 'right' ),
				'verticalAlignment' => array( 'center' ),
			)
		);

		$this->assertIsString( $layout_styles, 'Flex layout should not fatal when alignment values are not strings.' );
	}

	/**
	 * Tests that a responsive grid child with a non-string parent minimumColumnWidth
	 * does not cause a fatal error in the explode() call.
	 *
	 * @covers ::gutenberg_get_child_layout_style_rules
	 */
	public function test_gutenberg_get_child_layout_style_rules_with_non_string_minimum_column_width() {
		$actual_output = gutenberg_get_child_layout_style_rules(
			'.wp-container-content-test',
			array( 'columnSpan' => '2' ),
			array( 'minimumColumnWidth' => array( '12rem' ) ),
			null
		);

		$this->assertIsArray( $actual_output, 'Child layout rules should not fatal when minimumColumnWidth is not a string.' );
	}

	/**
	 * Tests that layout classname generation does not fatal when the layout type,
	 * orientation, or justifyContent attributes are not strings.
	 *
	 * @covers ::gutenberg_render_layout_support_flag
	 */
	public function test_layout_support_flag_with_non_string_layout_values() {
		$block_content = '<div class="wp-block-group"></div>';
		$block         = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'layout' => array(
					'type'           => array( 'constrained' ),
					'orientation'    => array( 'horizontal' ),
					'justifyContent' => array( 'center' ),
				),
			),
		);

		$this->assertIsString(
			gutenberg_render_layout_support_flag( $block_content, $block ),
			'Layout support should not fatal when layout values are not strings.'
		);
	}

	/**
	 * Tests that restoring the group inner container does not fatal when the tagName
	 * attribute is not a string (which would break the preg_quote() calls).
	 *
	 * @covers ::gutenberg_restore_group_inner_container
	 */
	public function test_restore_group_inner_container_with_non_string_tag_name() {
		// The "default" theme doesn't have theme.json support, so the preg_quote() path runs.
		switch_theme( 'default' );
		$block_content = '<div class="wp-block-group"><p>Test</p></div>';
		$block         = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'tagName' => array( 'div' ),
			),
		);

		$this->assertIsString(
			gutenberg_restore_group_inner_container( $block_content, $block ),
			'Group inner container restore should not fatal when tagName is not a string.'
		);
	}

	/**
	 * Tests that non-numeric grid placement values are dropped rather than being
	 * interpolated into the `grid-column` and `grid-row` declarations.
	 *
	 * @covers ::gutenberg_get_child_layout_style_rules
	 */
	public function test_gutenberg_get_child_layout_style_rules_with_non_numeric_grid_placement() {
		$actual_output = gutenberg_get_child_layout_style_rules(
			'.wp-container-content-test',
			array(
				'columnStart' => array( 2 ),
				'columnSpan'  => array( 3 ),
				'rowStart'    => array( 1 ),
				'rowSpan'     => array( 2 ),
			),
			array(),
			null
		);

		$this->assertSame(
			array(),
			$actual_output,
			'Non-numeric grid placement values should not produce any child layout rules.'
		);
	}

	/**
	 * Tests that grid placement values saved as numeric strings (WordPress 6.3 to 6.6)
	 * produce the same declarations as numbers.
	 *
	 * @covers ::gutenberg_get_child_layout_style_rules
	 */
	public function test_gutenberg_get_child_layout_style_rules_with_numeric_string_grid_placement() {
		$expected_output = array(
			array(
				'selector'     => '.wp-container-content-test',
				'declarations' => array(
					'grid-column' => '2 / span 3',
					'grid-row'    => '1 / span 2',
				),
			),
		);

		$actual_output = gutenberg_get_child_layout_style_rules(
			'.wp-container-content-test',
			array(
				'columnStart' => '2',
				'columnSpan'  => '3',
				'rowStart'    => '1',
				'rowSpan'     => '2',
			),
			array( 'columnCount' => '3' ),
			null
		);

		$this->assertSame( $expected_output, $actual_output );
	}

	/**
	 * Tests that non-numeric grid counts are treated as absent instead of leaking into the
	 * CSS. The rowCount case keeps columnCount valid, because the row track rule is only
	 * reached when there is a column count.
	 *
	 * @dataProvider data_gutenberg_get_layout_style_with_non_numeric_grid_counts
	 *
	 * @covers ::gutenberg_get_layout_style
	 *
	 * @param array  $layout          Grid layout values.
	 * @param string $expected_output The expected output.
	 */
	public function test_gutenberg_get_layout_style_with_non_numeric_grid_counts( $layout, $expected_output ) {
		$this->assertSame( $expected_output, gutenberg_get_layout_style( '.wp-layout', $layout ) );
	}

	/**
	 * Data provider for test_gutenberg_get_layout_style_with_non_numeric_grid_counts().
	 *
	 * @return array
	 */
	public function data_gutenberg_get_layout_style_with_non_numeric_grid_counts() {
		return array(
			'non-numeric columnCount falls back to the responsive default' => array(
				'layout'          => array(
					'type'        => 'grid',
					'columnCount' => array( 3 ),
				),
				'expected_output' => '.wp-layout{grid-template-columns:repeat(auto-fill, minmax(min(12rem, 100%), 1fr));container-type:inline-size;}',
			),
			'non-numeric rowCount drops the row track rule' => array(
				'layout'          => array(
					'type'        => 'grid',
					'columnCount' => 3,
					'rowCount'    => array( 2 ),
				),
				'expected_output' => '.wp-layout{grid-template-columns:repeat(3, minmax(0, 1fr));}',
			),
		);
	}

	/**
	 * Tests that grid counts saved as numeric strings (WordPress 6.3 to 6.6) produce the
	 * same CSS as numbers.
	 *
	 * @covers ::gutenberg_get_layout_style
	 */
	public function test_gutenberg_get_layout_style_with_numeric_string_grid_counts() {
		$layout_styles = gutenberg_get_layout_style(
			'.wp-layout',
			array(
				'type'        => 'grid',
				'columnCount' => '3',
				'rowCount'    => '2',
			)
		);

		$this->assertSame(
			'.wp-layout{grid-template-columns:repeat(3, minmax(0, 1fr));grid-template-rows:repeat(2, minmax(1rem, auto));}',
			$layout_styles
		);
	}

	/**
	 * Check that manual placement grids take their height from their width when the grid
	 * interactivity experiment is on, and that their images cover their cells.
	 *
	 * @covers ::gutenberg_get_layout_style
	 */
	public function test_gutenberg_get_layout_style_sizes_manual_grids_by_width() {
		add_filter( 'pre_option_gutenberg-experiments', array( $this, 'filter_enable_grid_interactivity' ), 11 );

		$layout_styles = gutenberg_get_layout_style(
			'.wp-layout',
			array(
				'type'              => 'grid',
				'columnCount'       => 3,
				'rowCount'          => 2,
				'isManualPlacement' => true,
			)
		);

		$this->assertSame(
			'.wp-layout{grid-template-columns:repeat(3, minmax(0, 1fr));grid-template-rows:repeat(2, minmax(1rem, 1fr));grid-auto-rows:minmax(1rem, 1fr);aspect-ratio:3 / 2;min-height:0;}' .
			'.wp-layout > .wp-block-image{display:flex;flex-direction:column;}' .
			'.wp-layout > .wp-block-image > :is(img, a){flex:1 1 0;min-height:0;}' .
			'.wp-layout > .wp-block-image > img, .wp-layout > .wp-block-image > a > img{width:100%;height:100%;object-fit:cover;}',
			$layout_styles
		);
	}

	/**
	 * Check that manual placement grids size their rows by their content when the grid
	 * interactivity experiment is off.
	 *
	 * @covers ::gutenberg_get_layout_style
	 */
	public function test_gutenberg_get_layout_style_sizes_manual_grid_rows_by_content_without_experiment() {
		$layout_styles = gutenberg_get_layout_style(
			'.wp-layout',
			array(
				'type'              => 'grid',
				'columnCount'       => 3,
				'rowCount'          => 2,
				'isManualPlacement' => true,
			)
		);

		$this->assertSame(
			'.wp-layout{grid-template-columns:repeat(3, minmax(0, 1fr));grid-template-rows:repeat(2, minmax(1rem, auto));}',
			$layout_styles
		);
	}

	/**
	 * Check that same-size cells are only output for manual placement grids with the grid
	 * interactivity experiment on, and that the grid is only sized by its width, with images
	 * covering its cells, when it has no minimum column width.
	 *
	 * @dataProvider data_gutenberg_get_layout_style_same_size_cells
	 *
	 * @covers ::gutenberg_get_layout_style
	 *
	 * @param bool       $experiment_enabled Whether the grid interactivity experiment is on.
	 * @param array      $layout             The grid's layout.
	 * @param array|null $viewport_overrides Viewport layout overrides, or null for the default viewport.
	 * @param string     $expected_output    The expected CSS.
	 */
	public function test_gutenberg_get_layout_style_same_size_cells( $experiment_enabled, $layout, $viewport_overrides, $expected_output ) {
		if ( $experiment_enabled ) {
			add_filter( 'pre_option_gutenberg-experiments', array( $this, 'filter_enable_grid_interactivity' ), 11 );
		}

		$options = null === $viewport_overrides ? array() : array( 'viewport_overrides' => $viewport_overrides );

		$this->assertSame(
			$expected_output,
			gutenberg_get_layout_style( '.wp-layout', $layout, false, null, false, '0.5em', null, $options )
		);
	}

	/**
	 * Data provider for test_gutenberg_get_layout_style_same_size_cells().
	 *
	 * @return array
	 */
	public function data_gutenberg_get_layout_style_same_size_cells() {
		$manual_layout = array(
			'type'              => 'grid',
			'columnCount'       => 3,
			'rowCount'          => 2,
			'isManualPlacement' => true,
		);
		$auto_layout   = array(
			'type'        => 'grid',
			'columnCount' => 3,
			'rowCount'    => 2,
		);
		$image_cover   = '.wp-layout > .wp-block-image{display:flex;flex-direction:column;}' .
			'.wp-layout > .wp-block-image > :is(img, a){flex:1 1 0;min-height:0;}' .
			'.wp-layout > .wp-block-image > img, .wp-layout > .wp-block-image > a > img{width:100%;height:100%;object-fit:cover;}';

		return array(
			'manual grid, experiment on, viewport column count' => array(
				'experiment_enabled' => true,
				'layout'             => $manual_layout,
				'viewport_overrides' => array( 'columnCount' => 1 ),
				'expected_output'    => '.wp-layout{grid-template-columns:repeat(1, minmax(0, 1fr));grid-template-rows:repeat(2, minmax(1rem, 1fr));grid-auto-rows:minmax(1rem, 1fr);aspect-ratio:1 / 2;min-height:0;}' . $image_cover,
			),
			'manual grid, experiment off, viewport column count' => array(
				'experiment_enabled' => false,
				'layout'             => $manual_layout,
				'viewport_overrides' => array( 'columnCount' => 1 ),
				'expected_output'    => '.wp-layout{grid-template-columns:repeat(1, minmax(0, 1fr));}',
			),
			'auto grid, experiment on' => array(
				'experiment_enabled' => true,
				'layout'             => $auto_layout,
				'viewport_overrides' => null,
				'expected_output'    => '.wp-layout{grid-template-columns:repeat(3, minmax(0, 1fr));grid-template-rows:repeat(2, minmax(1rem, auto));}',
			),
			'auto grid, experiment on, viewport column count' => array(
				'experiment_enabled' => true,
				'layout'             => $auto_layout,
				'viewport_overrides' => array( 'columnCount' => 1 ),
				'expected_output'    => '.wp-layout{grid-template-columns:repeat(1, minmax(0, 1fr));}',
			),
			'auto grid, experiment off, viewport column count' => array(
				'experiment_enabled' => false,
				'layout'             => $auto_layout,
				'viewport_overrides' => array( 'columnCount' => 1 ),
				'expected_output'    => '.wp-layout{grid-template-columns:repeat(1, minmax(0, 1fr));}',
			),
			'manual grid with a minimum column width, experiment on' => array(
				'experiment_enabled' => true,
				'layout'             => array_merge( $manual_layout, array( 'minimumColumnWidth' => '12rem' ) ),
				'viewport_overrides' => null,
				'expected_output'    => '.wp-layout{grid-template-columns:repeat(auto-fill, minmax(max(min(12rem, 100%), (100% - (0.5em * (3 - 1))) /3), 1fr));container-type:inline-size;grid-template-rows:repeat(2, minmax(1rem, 1fr));grid-auto-rows:minmax(1rem, 1fr);}',
			),
			'manual grid with a minimum column width, experiment on, viewport column count' => array(
				'experiment_enabled' => true,
				'layout'             => array_merge( $manual_layout, array( 'minimumColumnWidth' => '12rem' ) ),
				'viewport_overrides' => array( 'columnCount' => 1 ),
				'expected_output'    => '.wp-layout{grid-template-columns:repeat(auto-fill, minmax(max(min(12rem, 100%), (100% - (0.5em * (1 - 1))) /1), 1fr));grid-template-rows:repeat(2, minmax(1rem, 1fr));grid-auto-rows:minmax(1rem, 1fr);}',
			),
			'manual grid, experiment on, viewport minimum column width' => array(
				'experiment_enabled' => true,
				'layout'             => $manual_layout,
				'viewport_overrides' => array( 'minimumColumnWidth' => '12rem' ),
				'expected_output'    => '.wp-layout{grid-template-columns:repeat(auto-fill, minmax(max(min(12rem, 100%), (100% - (0.5em * (3 - 1))) /3), 1fr));container-type:inline-size;grid-template-rows:repeat(2, minmax(1rem, 1fr));grid-auto-rows:minmax(1rem, 1fr);aspect-ratio:auto;min-height:auto;}' .
					'.wp-layout > .wp-block-image{display:block;}' .
					'.wp-layout > .wp-block-image > img, .wp-layout > .wp-block-image > a > img{width:auto;height:auto;}',
			),
		);
	}

	/**
	 * Check that manual placement grids stack their children on mobile when the grid
	 * interactivity experiment is on, unless they opt out.
	 *
	 * @dataProvider data_layout_support_flag_stacks_manual_grids_on_mobile
	 *
	 * @covers ::gutenberg_render_layout_support_flag
	 *
	 * @param bool  $experiment_enabled Whether the grid interactivity experiment is on.
	 * @param array $layout             Grid layout attribute.
	 * @param bool  $should_stack       Whether stacking rules are expected.
	 * @param array $style              Optional. Grid style attribute.
	 */
	public function test_layout_support_flag_stacks_manual_grids_on_mobile( $experiment_enabled, $layout, $should_stack, $style = array() ) {
		if ( $experiment_enabled ) {
			add_filter( 'pre_option_gutenberg-experiments', array( $this, 'filter_enable_grid_interactivity' ), 11 );
		}
		switch_theme( 'default' );

		$block_content = '<div class="wp-block-group"></div>';
		$block         = array(
			'blockName'    => 'core/group',
			'attrs'        => array(
				'layout' => $layout,
				'style'  => $style,
			),
			'innerBlocks'  => array(),
			'innerHTML'    => $block_content,
			'innerContent' => array( $block_content ),
		);

		$output = gutenberg_render_layout_support_flag( $block_content, $block );
		preg_match( '/wp-container-core-group-is-layout-[a-z0-9]+/', $output, $matches );
		$this->assertNotEmpty( $matches, 'The grid should get a container class.' );
		$container_class = $matches[0];

		$stylesheet    = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );
		$sizing_rule   = ".$container_class.$container_class{aspect-ratio:auto;grid-template-rows:none;grid-auto-rows:auto;}";
		$stacking_rule = ".$container_class.$container_class > *{grid-column:1 / -1;grid-row:span var(--wp--grid-item--row-span, 1);rotate:none;}";
		$figure_rule   = ".$container_class.$container_class > .wp-block-image{display:block;}";
		$image_rule    = ".$container_class.$container_class > .wp-block-image > img, .$container_class.$container_class > .wp-block-image > a > img{width:auto;height:auto;}";

		if ( $should_stack ) {
			$this->assertStringContainsString( '@media (width <= 480px){' . $sizing_rule . '}', $stylesheet, 'A stacked grid should be sized by its content.' );
			$this->assertStringContainsString( '@media (width <= 480px){' . $stacking_rule . '}', $stylesheet, 'The children of a stacked grid should be full width, unrotated, and keep their row spans.' );
			$this->assertStringContainsString( '@media (width <= 480px){' . $figure_rule . '}', $stylesheet, 'The images of a stacked grid should be laid out as blocks.' );
			$this->assertStringContainsString( '@media (width <= 480px){' . $image_rule . '}', $stylesheet, 'The images of a stacked grid should keep their own size.' );
		} else {
			$this->assertStringNotContainsString( $sizing_rule, $stylesheet );
			$this->assertStringNotContainsString( $stacking_rule, $stylesheet );
			$this->assertStringNotContainsString( $figure_rule, $stylesheet );
			$this->assertStringNotContainsString( $image_rule, $stylesheet );
		}
	}

	/**
	 * Data provider for test_layout_support_flag_stacks_manual_grids_on_mobile().
	 *
	 * @return array
	 */
	public function data_layout_support_flag_stacks_manual_grids_on_mobile() {
		return array(
			'manual placement grid stacks by default'     => array(
				'experiment_enabled' => true,
				'layout'             => array(
					'type'              => 'grid',
					'isManualPlacement' => true,
					'columnCount'       => 3,
				),
				'should_stack'       => true,
			),
			'manual placement grid can opt out'           => array(
				'experiment_enabled' => true,
				'layout'             => array(
					'type'              => 'grid',
					'isManualPlacement' => true,
					'columnCount'       => 4,
					'stackOnMobile'     => false,
				),
				'should_stack'       => false,
			),
			'manual placement grid can opt out on mobile' => array(
				'experiment_enabled' => true,
				'layout'             => array(
					'type'              => 'grid',
					'isManualPlacement' => true,
					'columnCount'       => 6,
				),
				'should_stack'       => false,
				'style'              => array(
					'@mobile' => array(
						'layout' => array( 'stackOnMobile' => false ),
					),
				),
			),
			'manual placement grid switched to auto on mobile does not stack' => array(
				'experiment_enabled' => true,
				'layout'             => array(
					'type'              => 'grid',
					'isManualPlacement' => true,
					'columnCount'       => 8,
				),
				'should_stack'       => false,
				'style'              => array(
					'@mobile' => array(
						'layout' => array( 'isManualPlacement' => null ),
					),
				),
			),
			'auto placement grid does not stack'          => array(
				'experiment_enabled' => true,
				'layout'             => array(
					'type'        => 'grid',
					'columnCount' => 5,
				),
				'should_stack'       => false,
			),
			'manual placement grid without the experiment does not stack' => array(
				'experiment_enabled' => false,
				'layout'             => array(
					'type'              => 'grid',
					'isManualPlacement' => true,
					'columnCount'       => 7,
				),
				'should_stack'       => false,
			),
		);
	}

	/**
	 * Check that children of manual placement grids publish their row span for mobile
	 * stacking when the grid interactivity experiment is on.
	 *
	 * @covers ::gutenberg_get_child_layout_style_rules
	 */
	public function test_gutenberg_get_child_layout_style_rules_publishes_row_span_in_manual_grids() {
		add_filter( 'pre_option_gutenberg-experiments', array( $this, 'filter_enable_grid_interactivity' ), 11 );

		$manual_grid = array(
			'isManualPlacement' => true,
			'columnCount'       => 3,
		);

		$this->assertSame(
			array(
				array(
					'selector'     => '.wp-container-content-test',
					'declarations' => array(
						'grid-column'               => '1',
						'grid-row'                  => '1 / span 2',
						'--wp--grid-item--row-span' => '2',
					),
				),
			),
			gutenberg_get_child_layout_style_rules(
				'.wp-container-content-test',
				array(
					'columnStart' => 1,
					'rowStart'    => 1,
					'rowSpan'     => 2,
				),
				$manual_grid
			)
		);

		$single_row_rules = gutenberg_get_child_layout_style_rules(
			'.wp-container-content-test',
			array( 'columnStart' => 2 ),
			$manual_grid
		);
		$this->assertSame( '1', $single_row_rules[0]['declarations']['--wp--grid-item--row-span'], 'A child without a row span should publish 1.' );

		$viewport_rules = gutenberg_get_child_layout_style_rules(
			'.wp-container-content-test',
			array( 'rowSpan' => 2 ),
			$manual_grid,
			array( 'rowSpan' => 3 )
		);
		$this->assertArrayNotHasKey( '--wp--grid-item--row-span', $viewport_rules[0]['declarations'], 'Viewport overrides should not publish a row span.' );

		$auto_grid_rules = gutenberg_get_child_layout_style_rules(
			'.wp-container-content-test',
			array( 'rowSpan' => 2 ),
			array( 'columnCount' => 3 )
		);
		$this->assertArrayNotHasKey( '--wp--grid-item--row-span', $auto_grid_rules[0]['declarations'], 'Auto placement grid children should not publish a row span.' );
	}

	/**
	 * Check that children of manual placement grids don't publish their row span when the
	 * grid interactivity experiment is off.
	 *
	 * @covers ::gutenberg_get_child_layout_style_rules
	 */
	public function test_gutenberg_get_child_layout_style_rules_does_not_publish_row_span_without_experiment() {
		$this->assertSame(
			array(
				array(
					'selector'     => '.wp-container-content-test',
					'declarations' => array(
						'grid-row' => 'span 2',
					),
				),
			),
			gutenberg_get_child_layout_style_rules(
				'.wp-container-content-test',
				array( 'rowSpan' => 2 ),
				array(
					'isManualPlacement' => true,
					'columnCount'       => 3,
				)
			)
		);
	}

	/**
	 * Check that children of manual and auto placement grids get different content classes
	 * when the grid interactivity experiment is on, since only the former publish their row
	 * span, and the same classes when it is off.
	 *
	 * @covers ::gutenberg_render_layout_support_flag
	 */
	public function test_layout_support_flag_content_class_depends_on_manual_placement() {
		$render_child = static function ( $parent_layout ) {
			$block_content = '<p>Child</p>';
			return gutenberg_render_layout_support_flag(
				$block_content,
				array(
					'blockName'    => 'core/paragraph',
					'attrs'        => array(
						'style' => array(
							'layout' => array(
								'columnStart' => 1,
								'rowStart'    => 1,
							),
						),
					),
					'parentLayout' => $parent_layout,
					'innerBlocks'  => array(),
					'innerHTML'    => $block_content,
					'innerContent' => array( $block_content ),
				)
			);
		};
		$manual_grid  = array(
			'type'              => 'grid',
			'columnCount'       => 3,
			'isManualPlacement' => true,
		);
		$auto_grid    = array(
			'type'        => 'grid',
			'columnCount' => 3,
		);

		$this->assertSame( $render_child( $auto_grid ), $render_child( $manual_grid ), 'Without the experiment, manual placement should not change the content class.' );

		add_filter( 'pre_option_gutenberg-experiments', array( $this, 'filter_enable_grid_interactivity' ), 11 );
		$this->assertNotSame( $render_child( $auto_grid ), $render_child( $manual_grid ), 'With the experiment, manual placement should change the content class.' );
	}

	/**
	 * Check that the stacking rule unrotates the children of a stacked grid, with a
	 * selector more specific than the rotate support's class rules, inside and outside
	 * of media queries.
	 *
	 * @covers ::gutenberg_render_layout_support_flag
	 */
	public function test_layout_support_flag_stacking_rule_beats_rotation() {
		add_filter( 'pre_option_gutenberg-experiments', array( $this, 'filter_enable_grid_interactivity' ), 11 );
		switch_theme( 'default' );

		$child_content = '<p>Rotated</p>';
		$child_output  = gutenberg_render_rotate_support(
			$child_content,
			array(
				'blockName' => 'core/paragraph',
				'attrs'     => array(
					'style' => array(
						'rotate'  => 30,
						'@mobile' => array( 'rotate' => 15 ),
					),
				),
			)
		);
		$this->assertMatchesRegularExpression( '/wp-rotate-[a-z0-9]+/', $child_output, 'The child should be rotated.' );
		preg_match( '/wp-rotate-[a-z0-9]+/', $child_output, $rotate_matches );
		$rotate_class = $rotate_matches[0];

		$block_content = '<div class="wp-block-group"></div>';
		$output        = gutenberg_render_layout_support_flag(
			$block_content,
			array(
				'blockName'    => 'core/group',
				'attrs'        => array(
					'layout' => array(
						'type'              => 'grid',
						'isManualPlacement' => true,
						'columnCount'       => 3,
					),
				),
				'innerBlocks'  => array(),
				'innerHTML'    => $block_content,
				'innerContent' => array( $block_content ),
			)
		);
		preg_match( '/wp-container-core-group-is-layout-[a-z0-9]+/', $output, $matches );
		$container_class = $matches[0];

		$stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );
		$this->assertStringContainsString( ".$rotate_class{rotate:30deg;}", $stylesheet );
		$this->assertStringContainsString( "@media (width <= 480px){.$rotate_class{rotate:15deg;}}", $stylesheet );
		// Two classes beat the rotate support's single class, whatever the order of the rules.
		$this->assertStringContainsString( "@media (width <= 480px){.$container_class.$container_class > *{grid-column:1 / -1;grid-row:span var(--wp--grid-item--row-span, 1);rotate:none;}}", $stylesheet );
	}

	/**
	 * Check that the row span custom property and the stacking rule survive CSS sanitization.
	 *
	 * @covers ::gutenberg_render_layout_support_flag
	 */
	public function test_row_span_declarations_survive_sanitization() {
		$this->assertSame( '--wp--grid-item--row-span:2', safecss_filter_attr( '--wp--grid-item--row-span:2' ) );
		$this->assertSame( 'grid-row:span var(--wp--grid-item--row-span, 1)', safecss_filter_attr( 'grid-row:span var(--wp--grid-item--row-span, 1)' ) );
		$this->assertSame( 'rotate:none', safecss_filter_attr( 'rotate:none' ) );
	}

	/**
	 * Check that a rendered manual placement grid makes its images cover their cells, and
	 * that a viewport adding a minimum column width puts them back to their own size inside
	 * that viewport's media query.
	 *
	 * @covers ::gutenberg_render_layout_support_flag
	 */
	public function test_layout_support_flag_resets_manual_grid_images_in_viewport_with_minimum_column_width() {
		add_filter( 'pre_option_gutenberg-experiments', array( $this, 'filter_enable_grid_interactivity' ), 11 );
		switch_theme( 'block-theme' );

		$block_content = '<div class="wp-block-group"></div>';
		$block         = array(
			'blockName'    => 'core/group',
			'attrs'        => array(
				'layout' => array(
					'type'              => 'grid',
					'columnCount'       => 3,
					'rowCount'          => 2,
					'isManualPlacement' => true,
				),
				'style'  => array(
					'@tablet' => array(
						'layout' => array( 'minimumColumnWidth' => '12rem' ),
					),
				),
			),
			'innerBlocks'  => array(),
			'innerHTML'    => $block_content,
			'innerContent' => array( $block_content ),
		);

		$output = gutenberg_render_layout_support_flag( $block_content, $block );
		$this->assertMatchesRegularExpression( '/wp-container-core-group-is-layout-[a-z0-9]+/', $output );
		preg_match( '/wp-container-core-group-is-layout-[a-z0-9]+/', $output, $matches );
		$container_class = $matches[0];

		$media_queries = WP_Theme_JSON_Gutenberg::get_viewport_media_queries( null );
		$stylesheet    = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );
		$image         = ".$container_class > .wp-block-image > img, .$container_class > .wp-block-image > a > img";
		$cover_rule    = "$image{width:100%;height:100%;object-fit:cover;}";
		$reset_rule    = "$image{width:auto;height:auto;}";

		$this->assertStringContainsString( $cover_rule, $stylesheet, 'Images should cover their cells.' );
		$this->assertStringNotContainsString( $media_queries['@tablet'] . '{' . $cover_rule, $stylesheet, 'The cover rule should not be inside the tablet media query.' );

		$tablet_styles = strstr( $stylesheet, $media_queries['@tablet'] . '{' );
		$this->assertNotFalse( $tablet_styles, 'The tablet viewport should have its own styles.' );
		$this->assertStringContainsString( ".$container_class > .wp-block-image{display:block;}", $tablet_styles, 'Images should be laid out as blocks again on tablets.' );
		$this->assertStringContainsString( $reset_rule, $tablet_styles, 'Images should keep their own size on tablets.' );
	}

	/**
	 * Check that children of manual placement grids without a child layout of their own
	 * publish a row span of 1 when the grid interactivity experiment is on, and are left
	 * alone when it is off.
	 *
	 * @covers ::gutenberg_render_layout_support_flag
	 */
	public function test_layout_support_flag_publishes_row_span_for_manual_grid_children_without_layout() {
		$block_content = '<p>Child</p>';
		$block         = array(
			'blockName'    => 'core/paragraph',
			'attrs'        => array(),
			'parentLayout' => array(
				'type'              => 'grid',
				'columnCount'       => 3,
				'isManualPlacement' => true,
			),
			'innerBlocks'  => array(),
			'innerHTML'    => $block_content,
			'innerContent' => array( $block_content ),
		);

		$this->assertSame( $block_content, gutenberg_render_layout_support_flag( $block_content, $block ), 'Without the experiment, the child should be left alone.' );

		add_filter( 'pre_option_gutenberg-experiments', array( $this, 'filter_enable_grid_interactivity' ), 11 );
		$output = gutenberg_render_layout_support_flag( $block_content, $block );
		preg_match( '/wp-container-content-[a-z0-9]+/', $output, $matches );
		$this->assertNotEmpty( $matches, 'The child should get a content class.' );

		$stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );
		$this->assertStringContainsString( ".{$matches[0]}{--wp--grid-item--row-span:1;}", $stylesheet );
	}
}
