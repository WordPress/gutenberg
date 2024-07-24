<?php
/**
 * Adds settings to the block editor.
 *
 * @package gutenberg
 */

/**
 * Replaces core 'styles' and '__experimentalFeatures' block editor settings from
 * wordpress-develop/block-editor.php with the Gutenberg versions. Much of the
 * code is copied from get_block_editor_settings() in that file.
 *
 * This hook should run first as it completely replaces the core settings that
 * other hooks may need to update.
 *
 * Note: The settings that are WP version specific should be handled inside the `compat` directory.
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_get_block_editor_settings( $settings ) {
	$global_styles = array();
	$presets       = array(
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
			$global_styles[]     = $preset_style;
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
			$global_styles[]      = $block_classes;
		}

		/*
		 * Add the custom CSS as a separate stylesheet so any invalid CSS
		 * entered by users does not break other global styles.
		 */
		$global_styles[] = array(
			'css'            => gutenberg_get_global_stylesheet( array( 'custom-css' ) ),
			'__unstableType' => 'user',
			'isGlobalStyles' => true,
		);
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
			$global_styles[]      = $block_classes;
		}
	}

	$settings['styles'] = array_merge( $global_styles, get_block_editor_theme_styles() );

	$settings['__experimentalFeatures'] = gutenberg_get_global_settings();
	// These settings may need to be updated based on data coming from theme.json sources.
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

    /*
     * Locale settings.
     *
     * Add user and site locale settings to block editor settings.
     * Because the current value of is_rtl() refers to the current locale,
     * we need to switch to the site locale to get the correct is_rtl() value for the site.
     *
     * Note: settings.isRTL is already available to determine the direction of the editor interface.
     *
     * Core backport notes:
     * - This could be added to block editor settings, e.g., $editor_settings array in /wp-includes/block-editor.php#L214
     * - Potential for abstracting this into a separate function in src/wp-includes/l10n.php, e.g., wp_get_site_locale() or something.
     *
     */
    // Current user locale in the block editor.
    $current_user_locale = get_user_locale();
    $current_user_is_rtl = is_rtl();

    // Current site locale.
    $current_site_locale = get_locale();
    $current_site_is_rtl = $current_user_is_rtl;

    if ( $current_user_locale !== $current_site_locale ) {
        $switched_locale = switch_to_locale( $current_site_locale );
        if ( is_locale_switched() && $switched_locale ) {
            $current_site_is_rtl = is_rtl();
            restore_previous_locale();
        }
    }

    $settings['locale'] = array(
        'site' => array(
            'lang'  => $current_site_locale,
            'isRTL' => $current_site_is_rtl,
        ),
        'user' => array(
            'lang'  => $current_user_locale,
            'isRTL' => $current_user_is_rtl,
        ),
    );

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_get_block_editor_settings', 0 );
