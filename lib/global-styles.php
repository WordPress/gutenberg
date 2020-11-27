<?php
/**
 * Bootstraps Global Styles.
 *
 * @package gutenberg
 */

/**
 * Whether the current theme has a theme.json file.
 *
 * @return boolean
 */
function gutenberg_experimental_global_styles_has_theme_json_support() {
	return is_readable( locate_template( 'experimental-theme.json' ) );
}

/**
 * Returns the theme presets registered via add_theme_support, if any.
 *
 * @param array $settings Existing editor settings.
 *
 * @return array Config that adheres to the theme.json schema.
 */
function gutenberg_experimental_global_styles_get_theme_support_settings( $settings ) {
	$theme_settings                       = array();
	$theme_settings['global']             = array();
	$theme_settings['global']['settings'] = array();

	// Deprecated theme supports.
	if ( isset( $settings['disableCustomColors'] ) ) {
		if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
			$theme_settings['global']['settings']['color'] = array();
		}
		$theme_settings['global']['settings']['color']['custom'] = ! $settings['disableCustomColors'];
	}

	if ( isset( $settings['disableCustomGradients'] ) ) {
		if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
			$theme_settings['global']['settings']['color'] = array();
		}
		$theme_settings['global']['settings']['color']['customGradient'] = ! $settings['disableCustomGradients'];
	}

	if ( isset( $settings['disableCustomFontSizes'] ) ) {
		if ( ! isset( $theme_settings['global']['settings']['typography'] ) ) {
			$theme_settings['global']['settings']['typography'] = array();
		}
		$theme_settings['global']['settings']['typography']['customFontSize'] = ! $settings['disableCustomFontSizes'];
	}

	if ( isset( $settings['enableCustomLineHeight'] ) ) {
		if ( ! isset( $theme_settings['global']['settings']['typography'] ) ) {
			$theme_settings['global']['settings']['typography'] = array();
		}
		$theme_settings['global']['settings']['typography']['customLineHeight'] = $settings['enableCustomLineHeight'];
	}

	if ( isset( $settings['enableCustomUnits'] ) ) {
		if ( ! isset( $theme_settings['global']['settings']['spacing'] ) ) {
			$theme_settings['global']['settings']['spacing'] = array();
		}
		$theme_settings['global']['settings']['spacing']['units'] = ( true === $settings['enableCustomUnits'] ) ?
			array( 'px', 'em', 'rem', 'vh', 'vw' ) :
			$settings['enableCustomUnits'];
	}

	if ( isset( $settings['colors'] ) ) {
		if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
			$theme_settings['global']['settings']['color'] = array();
		}
		$theme_settings['global']['settings']['color']['palette'] = $settings['colors'];
	}

	if ( isset( $settings['gradients'] ) ) {
		if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
			$theme_settings['global']['settings']['color'] = array();
		}
		$theme_settings['global']['settings']['color']['gradients'] = $settings['gradients'];
	}

	if ( isset( $settings['fontSizes'] ) ) {
		$font_sizes = $settings['fontSizes'];
		// Back-compatibility for presets without units.
		foreach ( $font_sizes as &$font_size ) {
			if ( is_numeric( $font_size['size'] ) ) {
				$font_size['size'] = $font_size['size'] . 'px';
			}
		}
		if ( ! isset( $theme_settings['global']['settings']['typography'] ) ) {
			$theme_settings['global']['settings']['typography'] = array();
		}
		$theme_settings['global']['settings']['typography']['fontSizes'] = $font_sizes;
	}

	// Things that didn't land in core yet, so didn't have a setting assigned.
	if ( current( (array) get_theme_support( 'custom-spacing' ) ) ) {
		if ( ! isset( $theme_settings['global']['settings']['spacing'] ) ) {
			$theme_settings['global']['settings']['spacing'] = array();
		}
		$theme_settings['global']['settings']['spacing']['customPadding'] = true;
	}

	if ( current( (array) get_theme_support( 'experimental-link-color' ) ) ) {
		if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
			$theme_settings['global']['settings']['color'] = array();
		}
		$theme_settings['global']['settings']['color']['link'] = true;
	}

	return $theme_settings;
}

/**
 * Takes a tree adhering to the theme.json schema and generates
 * the corresponding stylesheet.
 *
 * @param WP_Theme_JSON $tree Input tree.
 * @param string        $type Type of stylesheet we want accepts 'all', 'block_styles', and 'css_variables'.
 *
 * @return string Stylesheet.
 */
function gutenberg_experimental_global_styles_get_stylesheet( $tree, $type = 'all' ) {
	// Check if we can use cached.
	$can_use_cached = (
		( 'all' === $type ) &&
		( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) &&
		( ! defined( 'SCRIPT_DEBUG' ) || ! SCRIPT_DEBUG ) &&
		( ! defined( 'REST_REQUEST' ) || ! REST_REQUEST ) &&
		! is_admin()
	);

	if ( $can_use_cached ) {
		// Check if we have the styles already cached.
		$cached = get_transient( 'global_styles' );
		if ( $cached ) {
			return $cached;
		}
	}

	$stylesheet = $tree->get_stylesheet( $type );

	if ( ( 'all' === $type || 'block_styles' === $type ) && gutenberg_experimental_global_styles_has_theme_json_support() ) {
		// To support all themes, we added in the block-library stylesheet
		// a style rule such as .has-link-color a { color: var(--wp--style--color--link, #00e); }
		// so that existing link colors themes used didn't break.
		// We add this here to make it work for themes that opt-in to theme.json
		// In the future, we may do this differently.
		$stylesheet .= 'a{color:var(--wp--style--color--link, #00e);}';
	}

	if ( $can_use_cached ) {
		// Cache for a minute.
		// This cache doesn't need to be any longer, we only want to avoid spikes on high-traffic sites.
		set_transient( 'global_styles', $stylesheet, MINUTE_IN_SECONDS );
	}

	return $stylesheet;
}

/**
 * Fetches the preferences for each origin (core, theme, user)
 * and enqueues the resulting stylesheet.
 */
function gutenberg_experimental_global_styles_enqueue_assets() {
	$settings           = gutenberg_get_common_block_editor_settings();
	$theme_support_data = gutenberg_experimental_global_styles_get_theme_support_settings( $settings );

	$resolver = new WP_Theme_JSON_Resolver();
	$all      = $resolver->get_origin( $theme_support_data );

	$stylesheet = gutenberg_experimental_global_styles_get_stylesheet( $all );
	if ( empty( $stylesheet ) ) {
		return;
	}

	wp_register_style( 'global-styles', false, array(), true, true );
	wp_add_inline_style( 'global-styles', $stylesheet );
	wp_enqueue_style( 'global-styles' );
}

/**
 * Adds the necessary data for the Global Styles client UI to the block settings.
 *
 * @param array $settings Existing block editor settings.
 * @return array New block editor settings
 */
function gutenberg_experimental_global_styles_settings( $settings ) {
	$theme_support_data = gutenberg_experimental_global_styles_get_theme_support_settings( $settings );
	unset( $settings['colors'] );
	unset( $settings['disableCustomColors'] );
	unset( $settings['disableCustomFontSizes'] );
	unset( $settings['disableCustomGradients'] );
	unset( $settings['enableCustomLineHeight'] );
	unset( $settings['enableCustomUnits'] );
	unset( $settings['fontSizes'] );
	unset( $settings['gradients'] );

	$resolver = new WP_Theme_JSON_Resolver();
	$all      = $resolver->get_origin( $theme_support_data );
	$base     = $resolver->get_origin( $theme_support_data, 'theme' );

	// STEP 1: ADD FEATURES
	// These need to be added to settings always.
	$settings['__experimentalFeatures'] = $all->get_settings();

	// STEP 2 - IF EDIT-SITE, ADD DATA REQUIRED FOR GLOBAL STYLES SIDEBAR
	// The client needs some information to be able to access/update the user styles.
	// We only do this if the theme has support for theme.json, though,
	// as an indicator that the theme will know how to combine this with its stylesheet.
	$screen = get_current_screen();
	if (
		! empty( $screen ) &&
		function_exists( 'gutenberg_is_edit_site_page' ) &&
		gutenberg_is_edit_site_page( $screen->id ) &&
		gutenberg_experimental_global_styles_has_theme_json_support()
	) {
		$settings['__experimentalGlobalStylesUserEntityId'] = WP_Theme_JSON_Resolver::get_user_custom_post_type_id();
		$settings['__experimentalGlobalStylesBaseStyles']   = $base->get_raw_data();
	} else {
		// STEP 3 - OTHERWISE, ADD STYLES
		//
		// If we are in a block editor context, but not in edit-site,
		// we need to add the styles via the settings. This is because
		// we want them processed as if they were added via add_editor_styles,
		// which adds the editor wrapper class.
		$settings['styles'][] = array(
			'css'                     => gutenberg_experimental_global_styles_get_stylesheet( $all, 'css_variables' ),
			'__experimentalNoWrapper' => true,
		);
		$settings['styles'][] = array(
			'css' => gutenberg_experimental_global_styles_get_stylesheet( $all, 'block_styles' ),
		);
	}

	return $settings;
}

add_action( 'init', array( 'WP_Theme_JSON_Resolver', 'register_user_custom_post_type' ) );
add_filter( 'block_editor_settings', 'gutenberg_experimental_global_styles_settings', PHP_INT_MAX );
add_action( 'wp_enqueue_scripts', 'gutenberg_experimental_global_styles_enqueue_assets' );
