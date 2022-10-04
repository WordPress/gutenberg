<?php

/**
 * Test the block layout support.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Layout_Test extends WP_UnitTestCase {
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
	}

	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
		parent::tear_down();
	}

	public function filter_set_theme_root() {
		return $this->theme_root;
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
		$expected_other_attributes      = '<div class="wp-block-image is-style-round my-custom-classname"><figure style="color: red" class=\'alignright size-full\' data-random-tag=">"><img src="/my-image.jpg"/></figure></div>';

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

	/**
	 * Generates the CSS corresponding to the provided layout.
	 *
	 * @dataProvider data_gutenberg_get_layout_style
	 *
	 * @covers ::gutenberg_get_layout_style
	 *
	 * @param array  $args {
	 *       Arguments for the test function.
	 *
	 *      @type string  $selector                      CSS selector.
	 *      @type array   $layout                        Layout object. The one that is passed has already checked the existence of default block layout.
	 *      @type boolean $has_block_gap_support         Whether the theme has support for the block gap.
	 *      @type string  $gap_value                     The block gap value to apply.
	 *      @type boolean $should_skip_gap_serialization Whether to skip applying the user-defined value set in the editor.
	 *      @type string  $fallback_gap_value            The block gap value to apply.
	 *      @type array   $block_spacing                 Custom spacing set on the block.
	 * }
	 * @param string $expected_output The expected output.
	 */
	public function test_gutenberg_get_layout_style( $args, $expected_output ) {
		$layout_styles = gutenberg_get_layout_style( $args['selector'], $args['layout'], $args['has_block_gap_support'], $args['gap_value'], $args['should_skip_gap_serialization'], $args['fallback_gap_value'], $args['block_spacing'] );
		$this->assertSame( $expected_output, $layout_styles );
	}

	/**
	 * Data provider for test_gutenberg_get_layout_style().
	 *
	 * @return array
	 */
	public function data_gutenberg_get_layout_style() {
		return array(
			'should_return_empty_value_with_no_args'       => array(
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
			'should_return_empty_value_with_only_selector' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => null,
					'has_block_gap_support'         => null,
					'gap_value'                     => null,
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '',
			),
			'should_return_default_layout_with_block_gap_support' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => null,
					'has_block_gap_support'         => true,
					'gap_value'                     => '1em',
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '.wp-layout > *{margin-block-start:0;margin-block-end:0;}.wp-layout.wp-layout > * + *{margin-block-start:1em;margin-block-end:0;}',
			),
			'should_return_empty_value_with_block_gap_support_and_skip_serialization' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => null,
					'has_block_gap_support'         => true,
					'gap_value'                     => '1em',
					'should_skip_gap_serialization' => true,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '',
			),
			'should_return_default_layout_with_axial_block_gap_support' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => null,
					'has_block_gap_support'         => true,
					'gap_value'                     => array( 'top' => '1em' ),
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '.wp-layout > *{margin-block-start:0;margin-block-end:0;}.wp-layout.wp-layout > * + *{margin-block-start:1em;margin-block-end:0;}',
			),
			'should_return_constrained_layout_with_sizes'  => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => array(
						'type'        => 'constrained',
						'contentSize' => '800px',
						'wideSize'    => '1200px',
					),
					'has_block_gap_support'         => null,
					'gap_value'                     => null,
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '.wp-layout > :where(:not(.alignleft):not(.alignright):not(.alignfull)){max-width:800px;margin-left:auto !important;margin-right:auto !important;}.wp-layout > .alignwide{max-width:1200px;}.wp-layout .alignfull{max-width:none;}',
			),
			'should_return_constrained_layout_with_sizes_and_block_spacing' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => array(
						'type'        => 'constrained',
						'contentSize' => '800px',
						'wideSize'    => '1200px',
					),
					'has_block_gap_support'         => null,
					'gap_value'                     => null,
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => array(
						'padding' => array(
							'left'  => '20px',
							'right' => '10px',
						),
					),
				),
				'expected_output' => '.wp-layout > :where(:not(.alignleft):not(.alignright):not(.alignfull)){max-width:800px;margin-left:auto !important;margin-right:auto !important;}.wp-layout > .alignwide{max-width:1200px;}.wp-layout .alignfull{max-width:none;}.wp-layout > .alignfull{margin-right:calc(10px * -1);margin-left:calc(20px * -1);}',
			),
			'should_return_constrained_layout_with_block_gap_support' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => array(
						'type' => 'constrained',
					),
					'has_block_gap_support'         => true,
					'gap_value'                     => '2.5rem',
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '.wp-layout > *{margin-block-start:0;margin-block-end:0;}.wp-layout.wp-layout > * + *{margin-block-start:2.5rem;margin-block-end:0;}',
			),
			'should_return_constrained_layout_with_axial_block_gap_support' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => array(
						'type' => 'constrained',
					),
					'has_block_gap_support'         => true,
					'gap_value'                     => array( 'top' => '2.5rem' ),
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '.wp-layout > *{margin-block-start:0;margin-block-end:0;}.wp-layout.wp-layout > * + *{margin-block-start:2.5rem;margin-block-end:0;}',
			),
			'should_return_constrained_layout_with_block_gap_support_and_spacing' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => array(
						'type' => 'constrained',
					),
					'has_block_gap_support'         => true,
					'gap_value'                     => 'var:preset|spacing|50',
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '.wp-layout > *{margin-block-start:0;margin-block-end:0;}.wp-layout.wp-layout > * + *{margin-block-start:var(--wp--preset--spacing--50);margin-block-end:0;}',
			),
			'should_return_empty_value_for_flex_layout_with_no_args' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => array(
						'type' => 'flex',
					),
					'has_block_gap_support'         => null,
					'gap_value'                     => null,
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '',
			),
			'should_return_empty_value_for_horizontal_flex_layout_with_orientation_only' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => array(
						'type'        => 'flex',
						'orientation' => 'horizontal',
					),
					'has_block_gap_support'         => null,
					'gap_value'                     => null,
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '',
			),
			'should_return_rule_horizontal_flex_layout_with_flex_properties' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => array(
						'type'              => 'flex',
						'orientation'       => 'horizontal',
						'flexWrap'          => 'nowrap',
						'justifyContent'    => 'left',
						'verticalAlignment' => 'bottom',
					),
					'has_block_gap_support'         => null,
					'gap_value'                     => null,
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '.wp-layout{flex-wrap:nowrap;justify-content:flex-start;align-items:flex-end;}',
			),
			'should_return_rule_for_horizontal_flex_layout_with_flex_properties_and_gap' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => array(
						'type'              => 'flex',
						'orientation'       => 'horizontal',
						'flexWrap'          => 'nowrap',
						'justifyContent'    => 'left',
						'verticalAlignment' => 'bottom',
					),
					'has_block_gap_support'         => true,
					'gap_value'                     => '29px',
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '.wp-layout{flex-wrap:nowrap;gap:29px;justify-content:flex-start;align-items:flex-end;}',
			),
			'should_return_rule_for_horizontal_flex_layout_with_flex_properties_and_axial_gap' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => array(
						'type'              => 'flex',
						'orientation'       => 'horizontal',
						'flexWrap'          => 'nowrap',
						'justifyContent'    => 'left',
						'verticalAlignment' => 'bottom',
					),
					'has_block_gap_support'         => true,
					'gap_value'                     => array(
						'top'  => '1px',
						'left' => '2px',
					),
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '.wp-layout{flex-wrap:nowrap;gap:1px 2px;justify-content:flex-start;align-items:flex-end;}',
			),
			'should_return_rule_for_horizontal_flex_layout_with_flex_properties_gap_fallback_and_spacing' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => array(
						'type'              => 'flex',
						'orientation'       => 'horizontal',
						'flexWrap'          => 'nowrap',
						'justifyContent'    => 'left',
						'verticalAlignment' => 'bottom',
					),
					'has_block_gap_support'         => true,
					'gap_value'                     => array(
						'left' => 'var:preset|spacing|40',
					),
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => '11px',
					'block_spacing'                 => null,
				),
				'expected_output' => '.wp-layout{flex-wrap:nowrap;gap:11px var(--wp--preset--spacing--40);justify-content:flex-start;align-items:flex-end;}',
			),
			'should_return_rule_for_vertical_flex_layout_with_flex_properties' => array(
				'args'            => array(
					'selector'                      => '.wp-layout',
					'layout'                        => array(
						'type'              => 'flex',
						'orientation'       => 'vertical',
						'flexWrap'          => 'nowrap',
						'justifyContent'    => 'left',
						'verticalAlignment' => 'bottom',
					),
					'has_block_gap_support'         => null,
					'gap_value'                     => null,
					'should_skip_gap_serialization' => null,
					'fallback_gap_value'            => null,
					'block_spacing'                 => null,
				),
				'expected_output' => '.wp-layout{flex-wrap:nowrap;flex-direction:column;align-items:flex-start;}',
			),
		);
	}
}
