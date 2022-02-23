<?php
/**
 * Adds settings to the block editor.
 *
 * @package gutenberg
 */

/**
 * Adds the necessary settings for the Global Styles client UI.
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_experimental_global_styles_settings( $settings ) {
	// Set what is the context for this data request.
	$context = 'other';
	if (
		is_callable( 'get_current_screen' ) &&
		function_exists( 'gutenberg_is_edit_site_page' ) &&
		gutenberg_is_edit_site_page( get_current_screen()->id )
	) {
		$context = 'site-editor';
	}

	if (
		defined( 'REST_REQUEST' ) &&
		REST_REQUEST &&
		isset( $_GET['context'] ) &&
		'mobile' === $_GET['context']
	) {
		$context = 'mobile';
	}

	if ( 'mobile' === $context && WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		$settings['__experimentalStyles'] = gutenberg_get_global_styles();
	}

	if ( 'other' === $context ) {
		// Make sure the styles array exists.
		// In some contexts, like the navigation editor, it doesn't.
		if ( ! isset( $settings['styles'] ) ) {
			$settings['styles'] = array();
		}

		// Reset existing global styles.
		$styles_without_existing_global_styles = array();
		foreach ( $settings['styles'] as $style ) {
			if ( ! isset( $style['__unstableType'] ) || 'globalStyles' !== $style['__unstableType'] ) {
				$styles_without_existing_global_styles[] = $style;
			}
		}

		$new_global_styles = array();

		$css_variables = gutenberg_get_global_stylesheet( array( 'variables' ) );
		if ( '' !== $css_variables ) {
			$new_global_styles[] = array(
				'css'            => $css_variables,
				'__unstableType' => 'presets',
			);
		}

		$css_presets = gutenberg_get_global_stylesheet( array( 'presets' ) );
		if ( '' !== $css_presets ) {
			$new_global_styles[] = array(
				'css'            => $css_presets,
				'__unstableType' => 'presets',
			);
		}

		if ( WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
			$css_blocks = gutenberg_get_global_stylesheet( array( 'styles' ) );
			if ( '' !== $css_blocks ) {
				$new_global_styles[] = array(
					'css'            => $css_blocks,
					'__unstableType' => 'theme',
				);
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
			$font_sizes_by_origin['user'] : (
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
	}
	if ( isset( $settings['__experimentalFeatures']['spacing']['padding'] ) ) {
		$settings['enableCustomSpacing'] = $settings['__experimentalFeatures']['spacing']['padding'];
		unset( $settings['__experimentalFeatures']['spacing']['padding'] );
	}

	return $settings;
}

add_filter( 'block_editor_settings_all', 'gutenberg_experimental_global_styles_settings', PHP_INT_MAX );