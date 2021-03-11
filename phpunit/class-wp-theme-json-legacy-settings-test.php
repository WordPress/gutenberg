<?php

/**
 * Test that legacy settings are properly
 * reorganized into the theme.json structure.
 *
 * @package Gutenberg
 */

class Theme_JSON_Legacy_Settings_Test extends WP_UnitTestCase {

	function get_editor_settings_no_theme_support() {
		return array(
			'__unstableEnableFullSiteEditingBlocks' => false,
			'disableCustomColors'                   => false,
			'disableCustomFontSizes'                => false,
			'disableCustomGradients'                => false,
			'enableCustomLineHeight'                => false,
			'enableCustomUnits'                     => false,
			'imageSizes'                            => array(
				array(
					'slug' => 'thumbnail',
					'name' => 'Thumbnail',
				),
				array(
					'slug' => 'medium',
					'name' => 'Medium',
				),
				array(
					'slug' => 'large',
					'name' => 'Large',
				),
				array(
					'slug' => 'full',
					'name' => 'Full Size',
				),
			),
			'isRTL'                                 => false,
			'maxUploadFileSize'                     => 123,
		);
	}

	function test_legacy_settings_blank() {
		$all_blocks = WP_Theme_JSON::ALL_BLOCKS_NAME;
		$input      = array();
		$expected   = array(
			'settings' => array(
				$all_blocks => array(),
			),
		);

		$actual = gutenberg_experimental_global_styles_get_theme_support_settings( $input );

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_legacy_settings_no_theme_support() {
		$all_blocks = WP_Theme_JSON::ALL_BLOCKS_NAME;
		$input      = $this->get_editor_settings_no_theme_support();
		$expected   = array(
			'settings' => array(
				$all_blocks => array(
					'color'      => array(
						'custom'         => true,
						'customGradient' => true,
					),
					'spacing'    => array(
						'units' => false,
					),
					'typography' => array(
						'customFontSize'   => true,
						'customLineHeight' => false,
					),
				),
			),
		);

		$actual = gutenberg_experimental_global_styles_get_theme_support_settings( $input );

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_legacy_settings_custom_units_can_be_disabled() {
		$all_blocks = WP_Theme_JSON::ALL_BLOCKS_NAME;
		add_theme_support( 'custom-units', array() );
		$input = gutenberg_get_common_block_editor_settings();

		$expected = array(
			'units'         => array( array() ),
			'customPadding' => false,
		);

		$actual = gutenberg_experimental_global_styles_get_theme_support_settings( $input );

		$this->assertEqualSetsWithIndex( $expected, $actual['settings'][ $all_blocks ]['spacing'] );
	}

	function test_legacy_settings_custom_units_can_be_enabled() {
		$all_blocks = WP_Theme_JSON::ALL_BLOCKS_NAME;
		add_theme_support( 'custom-units' );
		$input = gutenberg_get_common_block_editor_settings();

		$expected = array(
			'units'         => array( 'px', 'em', 'rem', 'vh', 'vw' ),
			'customPadding' => false,
		);

		$actual = gutenberg_experimental_global_styles_get_theme_support_settings( $input );

		$this->assertEqualSetsWithIndex( $expected, $actual['settings'][ $all_blocks ]['spacing'] );
	}

	function test_legacy_settings_custom_units_can_be_filtered() {
		$all_blocks = WP_Theme_JSON::ALL_BLOCKS_NAME;
		add_theme_support( 'custom-units', 'rem', 'em' );
		$input = gutenberg_get_common_block_editor_settings();

		$expected = array(
			'units'         => array( 'rem', 'em' ),
			'customPadding' => false,
		);

		$actual = gutenberg_experimental_global_styles_get_theme_support_settings( $input );

		$this->assertEqualSetsWithIndex( $expected, $actual['settings'][ $all_blocks ]['spacing'] );
	}

	function test_legacy_settings_filled() {
		$all_blocks = WP_Theme_JSON::ALL_BLOCKS_NAME;
		$input      = array(
			'disableCustomColors'    => true,
			'disableCustomGradients' => true,
			'disableCustomFontSizes' => true,
			'enableCustomLineHeight' => true,
			'enableCustomUnits'      => true,
			'colors'                 => array(
				array(
					'slug'  => 'color-slug',
					'name'  => 'Color Name',
					'color' => 'colorvalue',
				),
			),
			'gradients'              => array(
				array(
					'slug'     => 'gradient-slug',
					'name'     => 'Gradient Name',
					'gradient' => 'gradientvalue',
				),
			),
			'fontSizes'              => array(
				array(
					'slug' => 'size-slug',
					'name' => 'Size Name',
					'size' => 'sizevalue',
				),
			),
		);

		$expected = array(
			'settings' => array(
				$all_blocks => array(
					'color'      => array(
						'custom'         => false,
						'customGradient' => false,
						'gradients'      => array(
							array(
								'slug'     => 'gradient-slug',
								'name'     => 'Gradient Name',
								'gradient' => 'gradientvalue',
							),
						),
						'palette'        => array(
							array(
								'slug'  => 'color-slug',
								'name'  => 'Color Name',
								'color' => 'colorvalue',
							),
						),
					),
					'spacing'    => array(
						'units' => array( 'px', 'em', 'rem', 'vh', 'vw' ),
					),
					'typography' => array(
						'customFontSize'   => false,
						'customLineHeight' => true,
						'fontSizes'        => array(
							array(
								'slug' => 'size-slug',
								'name' => 'Size Name',
								'size' => 'sizevalue',
							),
						),
					),
				),
			),
		);

		$actual = gutenberg_experimental_global_styles_get_theme_support_settings( $input );

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}
}
