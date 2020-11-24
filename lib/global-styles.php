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
 * Takes a tree adhering to the theme.json schema and generates
 * the corresponding stylesheet.
 *
 * @param WP_Theme_JSON $tree Input tree.
 *
 * @return string Stylesheet.
 */
function gutenberg_experimental_global_styles_get_stylesheet( $tree ) {
	// Check if we can use cached.
	$can_use_cached = (
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

	$stylesheet = $tree->get_stylesheet();

	if ( gutenberg_experimental_global_styles_has_theme_json_support() ) {
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
	$settings = gutenberg_get_common_block_editor_settings();
	$resolver = new WP_Theme_JSON_Resolver();
	$all      = $resolver->get_origin( $settings );

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
	$resolver = new WP_Theme_JSON_Resolver();
	$all      = $resolver->get_origin( $settings );
	$base     = $resolver->get_origin( $settings, 'theme' );

	// STEP 1: ADD FEATURES
	// These need to be added to settings always.
	// We also need to unset the deprecated settings defined by core.
	$settings['__experimentalFeatures'] = $all->get_settings();
	unset( $settings['colors'] );
	unset( $settings['disableCustomColors'] );
	unset( $settings['disableCustomFontSizes'] );
	unset( $settings['disableCustomGradients'] );
	unset( $settings['enableCustomLineHeight'] );
	unset( $settings['enableCustomUnits'] );
	unset( $settings['fontSizes'] );
	unset( $settings['gradients'] );

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
		$settings['styles'][] = array( 'css' => gutenberg_experimental_global_styles_get_stylesheet( $all ) );
	}

	return $settings;
}

add_action( 'init', [ 'WP_Theme_JSON_Resolver', 'register_user_custom_post_type'] );
add_filter( 'block_editor_settings', 'gutenberg_experimental_global_styles_settings', PHP_INT_MAX );
add_action( 'wp_enqueue_scripts', 'gutenberg_experimental_global_styles_enqueue_assets' );
