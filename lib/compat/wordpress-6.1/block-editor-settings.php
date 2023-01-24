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
		defined( 'REST_REQUEST' ) &&
		REST_REQUEST &&
		isset( $_GET['context'] ) &&
		'mobile' === $_GET['context']
	) {
		$context = 'mobile';
	}

	if ( 'other' === $context ) {
		global $wp_version;
		$is_wp_5_9 = version_compare( $wp_version, '5.9', '>=' ) && version_compare( $wp_version, '6.0-beta1', '<' );
		$is_wp_6_0 = version_compare( $wp_version, '6.0-beta1', '>=' );

		// Make sure the styles array exists.
		// In some contexts, like the navigation editor, it doesn't.
		if ( ! isset( $settings['styles'] ) ) {
			$settings['styles'] = array();
		}

		// Remove existing global styles provided by core.
		$styles_without_existing_global_styles = array();
		foreach ( $settings['styles'] as $style ) {
			if (
				( $is_wp_5_9 && ! gutenberg_is_global_styles_in_5_9( $style ) ) || // Can be removed when plugin minimum version is 6.0.
				( $is_wp_6_0 && ( ! isset( $style['isGlobalStyles'] ) || ! $style['isGlobalStyles'] ) )
			) {
				$styles_without_existing_global_styles[] = $style;
			}
		}

		// Recreate global styles.
		$new_global_styles = array();
		$presets           = array(
			array(
				'css'            => 'variables',
				'__unstableType' => 'presets',
				'isGlobalStyles' => true,
			),
			array(
				'css'            => 'presets',
				'__unstableType' => 'presets',
				'isGlobalStyles' => true,
			),
		);
		foreach ( $presets as $preset_style ) {
			$actual_css = gutenberg_get_global_stylesheet( array( $preset_style['css'] ) );
			if ( '' !== $actual_css ) {
				$preset_style['css'] = $actual_css;
				$new_global_styles[] = $preset_style;
			}
		}

		if ( wp_theme_has_theme_json() ) {
			$block_classes = array(
				'css'            => 'styles',
				'__unstableType' => 'theme',
				'isGlobalStyles' => true,
			);
			$actual_css    = gutenberg_get_global_stylesheet( array( $block_classes['css'] ) );
			if ( '' !== $actual_css ) {
				$block_classes['css'] = $actual_css;
				$new_global_styles[]  = $block_classes;
			}
		} else {
			// If there is no `theme.json` file, ensure base layout styles are still available.
			$block_classes = array(
				'css'            => 'base-layout-styles',
				'__unstableType' => 'base-layout',
				'isGlobalStyles' => true,
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
	if ( isset( $settings['__experimentalFeatures']['spacing']['customSpacingSize'] ) ) {
		$settings['disableCustomSpacingSizes'] = ! $settings['__experimentalFeatures']['spacing']['customSpacingSize'];
		unset( $settings['__experimentalFeatures']['spacing']['customSpacingSize'] );
	}

	if ( isset( $settings['__experimentalFeatures']['spacing']['spacingSizes'] ) ) {
		$spacing_sizes_by_origin  = $settings['__experimentalFeatures']['spacing']['spacingSizes'];
		$settings['spacingSizes'] = isset( $spacing_sizes_by_origin['custom'] ) ?
			$spacing_sizes_by_origin['custom'] : (
				isset( $spacing_sizes_by_origin['theme'] ) ?
					$spacing_sizes_by_origin['theme'] :
					$spacing_sizes_by_origin['default']
			);
	}

	$settings['localAutosaveInterval'] = 15;
	$settings['disableLayoutStyles']   = current_theme_supports( 'disable-layout-styles' );

	return $settings;
}

add_filter( 'block_editor_settings_all', 'gutenberg_get_block_editor_settings', PHP_INT_MAX );
