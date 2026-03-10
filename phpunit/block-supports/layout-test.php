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
			$args['block_spacing']
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
			'default grid layout'                          => array(
				'args'            => array(
					'selector' => '.wp-layout',
					'layout'   => array(
						'type' => 'grid',
					),
				),
				'expected_output' => '.wp-layout{grid-template-columns:repeat(auto-fill, minmax(min(12rem, 100%), 1fr));container-type:inline-size;}',
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
	 * @param array $block_attrs     Dataset to test.
	 * @param array $expected_class  Class generated for the passed dataset.
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

		$this->assertEquals(
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
}
