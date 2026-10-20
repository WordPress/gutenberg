<?php
/**
 * Offers the patterns of installed themes, other than the active theme and its
 * parent, in the editor.
 *
 * @package gutenberg
 */

/**
 * Registers the route that lists the patterns of the other installed themes.
 */
function gutenberg_register_installed_theme_patterns_route() {
	$controller = new Gutenberg_REST_Installed_Theme_Patterns_Controller();
	$controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_installed_theme_patterns_route' );

/**
 * Returns whether the current user gets patterns from installed themes other
 * than the active one. Patterns from other themes are offered to users who can
 * switch themes.
 *
 * This runs on every editor load, so it doesn't look at the installed themes.
 * Which themes offer patterns is only worked out when patterns are shown.
 *
 * @return bool Whether the current user gets patterns from other themes.
 */
function gutenberg_can_use_installed_theme_patterns() {
	return current_user_can( 'switch_themes' );
}

/**
 * Lists the installed themes, other than the active theme and its parent,
 * whose patterns the editor offers. On a multisite, only the themes the site
 * is allowed to use are listed.
 *
 * @return WP_Theme[] The themes.
 */
function gutenberg_get_installed_theme_pattern_sources() {
	if ( ! gutenberg_can_use_installed_theme_patterns() ) {
		return array();
	}

	$themes = array();
	foreach ( wp_get_themes( array( 'allowed' => true ) ) as $theme ) {
		if ( in_array( $theme->get_stylesheet(), array( get_stylesheet(), get_template() ), true ) ) {
			continue;
		}

		/**
		 * Filters whether the editor offers the patterns of an installed theme
		 * other than the active one.
		 *
		 * Return false for every theme to turn off patterns from other themes,
		 * or check the theme to skip some of them. To filter single patterns,
		 * use the `installed_theme_block_patterns` filter.
		 *
		 * @param bool     $should_load Whether to offer the theme's patterns. Default true.
		 * @param WP_Theme $theme       The installed theme.
		 */
		if ( ! apply_filters( 'should_load_installed_theme_block_patterns', true, $theme ) ) {
			continue;
		}

		$themes[] = $theme;
	}
	return $themes;
}

/**
 * Tells the editor whether to offer patterns from other installed themes.
 *
 * @param array $settings The editor settings.
 * @return array The editor settings.
 */
function gutenberg_add_installed_theme_patterns_to_editor_settings( $settings ) {
	$settings['hasInstalledThemePatterns'] = gutenberg_can_use_installed_theme_patterns();
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_installed_theme_patterns_to_editor_settings' );

/**
 * Adds "Other categories" to the pattern views in the site editor. It holds
 * the patterns of other installed themes whose categories are only registered
 * while their theme is active. The site editor hides it when it's empty.
 *
 * @param Gutenberg_View_Config_Data $data The view configuration container for patterns.
 * @return Gutenberg_View_Config_Data The updated view configuration container.
 */
function gutenberg_add_other_categories_to_pattern_views( $data ) {
	if ( ! gutenberg_can_use_installed_theme_patterns() ) {
		return $data;
	}

	return $data->merge(
		array(
			'view_list' => array(
				array(
					'title' => __( 'Other categories', 'gutenberg' ),
					'slug'  => 'other-categories',
				),
			),
		),
		1
	);
}
add_filter( 'get_entity_view_config_posttype_wp_block', 'gutenberg_add_other_categories_to_pattern_views', 6 );
