<?php
/**
 * Adds settings to the block editor.
 *
 * @package gutenberg
 */

/**
 * Adds styles and __experimentalFeatures to the block editor settings.
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_get_block_editor_settings( $settings ) {
	// Set what is the context for this data request.
	$context = 'other';
	if (
		is_callable( 'get_current_screen' ) &&
		function_exists( 'gutenberg_is_edit_site_page' ) &&
		gutenberg_is_edit_site_page( get_current_screen()->id )
	) {
		$context = 'site-editor';
	}

	if ( 'other' === $context ) {
		// Make sure the styles array exists.
		// In some contexts, like the navigation editor, it doesn't.
		if ( ! isset( $settings['styles'] ) ) {
			$settings['styles'] = array();
		}

		$styles_without_existing_global_styles = array();
		foreach ( $settings['styles'] as $style ) {
			if (
				! isset( $style['__unstableType'] ) ||
				// 'globalStyles' is for WordPress 5.8. 'theme' and 'presets' is for WordPress 5.9.
				! in_array( $style['__unstableType'], array( 'globalStyles', 'theme', 'presets' ), true )
			) {
				$styles_without_existing_global_styles[] = $style;
			}
		}

		$new_global_styles = array();
		$presets           = array(
			array(
				'css'            => 'variables',
				'__unstableType' => 'presets',
			),
			array(
				'css'            => 'presets',
				'__unstableType' => 'presets',
			),
		);
		foreach ( $presets as $preset_style ) {
			$actual_css = gutenberg_get_global_stylesheet( array( $preset_style['css'] ) );
			if ( '' !== $actual_css ) {
				$preset_style['css'] = $actual_css;
				$new_global_styles[] = $preset_style;
			}
		}

		if ( WP_Theme_JSON_Resolver::theme_has_support() ) {
			$block_classes = array(
				'css'            => 'styles',
				'__unstableType' => 'theme',
			);
			$actual_css    = gutenberg_get_global_stylesheet( array( $block_classes['css'] ) );
			if ( '' !== $actual_css ) {
				$block_classes['css'] = $actual_css;
				$new_global_styles[]  = $block_classes;
			}
		}

		$settings['styles'] = array_merge( $new_global_styles, $styles_without_existing_global_styles );
	}

	// Copied from get_block_editor_settings() at wordpress-develop/block-editor.php.
	$settings['__experimentalFeatures'] = gutenberg_get_global_settings();

	if ( isset( $settings['__experimentalFeatures']['color']['palette'] ) ) {
		$colors_by_origin   = $settings['__experimentalFeatures']['color']['palette'];
		$settings['colors'] = isset( $colors_by_origin['custom'] ) ?
			$colors_by_origin['custom'] : (
				isset( $colors_by_origin['theme'] ) ?
					$colors_by_origin['theme'] :
					$colors_by_origin['default']
			);
	}

	if ( isset( $settings['__experimentalFeatures']['color']['gradients'] ) ) {
		$gradients_by_origin   = $settings['__experimentalFeatures']['color']['gradients'];
		$settings['gradients'] = isset( $gradients_by_origin['custom'] ) ?
			$gradients_by_origin['custom'] : (
				isset( $gradients_by_origin['theme'] ) ?
					$gradients_by_origin['theme'] :
					$gradients_by_origin['default']
			);
	}

	if ( isset( $settings['__experimentalFeatures']['typography']['fontSizes'] ) ) {
		$font_sizes_by_origin  = $settings['__experimentalFeatures']['typography']['fontSizes'];
		$settings['fontSizes'] = isset( $font_sizes_by_origin['custom'] ) ?
			$font_sizes_by_origin['custom'] : (
				isset( $font_sizes_by_origin['theme'] ) ?
					$font_sizes_by_origin['theme'] :
					$font_sizes_by_origin['default']
			);
	}

	if ( isset( $settings['__experimentalFeatures']['color']['custom'] ) ) {
		$settings['disableCustomColors'] = ! $settings['__experimentalFeatures']['color']['custom'];
		unset( $settings['__experimentalFeatures']['color']['custom'] );
	}
	if ( isset( $settings['__experimentalFeatures']['color']['customGradient'] ) ) {
		$settings['disableCustomGradients'] = ! $settings['__experimentalFeatures']['color']['customGradient'];
		unset( $settings['__experimentalFeatures']['color']['customGradient'] );
	}
	if ( isset( $settings['__experimentalFeatures']['typography']['customFontSize'] ) ) {
		$settings['disableCustomFontSizes'] = ! $settings['__experimentalFeatures']['typography']['customFontSize'];
		unset( $settings['__experimentalFeatures']['typography']['customFontSize'] );
	}
	if ( isset( $settings['__experimentalFeatures']['typography']['lineHeight'] ) ) {
		$settings['enableCustomLineHeight'] = $settings['__experimentalFeatures']['typography']['lineHeight'];
		unset( $settings['__experimentalFeatures']['typography']['lineHeight'] );
	}
	if ( isset( $settings['__experimentalFeatures']['spacing']['units'] ) ) {
		$settings['enableCustomUnits'] = $settings['__experimentalFeatures']['spacing']['units'];
		unset( $settings['__experimentalFeatures']['spacing']['units'] );
	}
	if ( isset( $settings['__experimentalFeatures']['spacing']['padding'] ) ) {
		$settings['enableCustomSpacing'] = $settings['__experimentalFeatures']['spacing']['padding'];
		unset( $settings['__experimentalFeatures']['spacing']['padding'] );
	}

	return $settings;
}

add_filter( 'block_editor_settings_all', 'gutenberg_get_block_editor_settings', PHP_INT_MAX );
