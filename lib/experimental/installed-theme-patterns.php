<?php
/**
 * Offers the patterns of installed themes, other than the active theme and its
 * parent, in the editor.
 *
 * @package gutenberg
 */

/**
 * Registers the route that lists the patterns of an installed theme.
 */
function gutenberg_register_installed_theme_patterns_route() {
	$controller = new Gutenberg_REST_Installed_Theme_Patterns_Controller();
	$controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_installed_theme_patterns_route' );

/**
 * Lists the installed themes, other than the active theme and its parent,
 * whose patterns the editor offers. Loading a theme's patterns previews the
 * theme, so they're only offered to users who can switch themes.
 *
 * @return array[] The stylesheet and name of each theme.
 */
function gutenberg_get_installed_theme_pattern_sources() {
	if ( ! current_user_can( 'switch_themes' ) ) {
		return array();
	}

	$themes = array();
	foreach ( wp_get_themes() as $theme ) {
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

		$themes[] = array(
			'stylesheet' => $theme->get_stylesheet(),
			'name'       => $theme->display( 'Name', false ),
		);
	}
	return $themes;
}

/**
 * Adds the installed themes whose patterns the editor offers to the editor
 * settings.
 *
 * @param array $settings The editor settings.
 * @return array The editor settings with the installed themes.
 */
function gutenberg_add_installed_theme_patterns_to_editor_settings( $settings ) {
	$settings['installedThemePatternSources'] = gutenberg_get_installed_theme_pattern_sources();
	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_add_installed_theme_patterns_to_editor_settings' );

/**
 * Adds "Other categories" to the pattern views in the site editor. It holds
 * the patterns of other installed themes whose categories are only registered
 * while their theme is active.
 *
 * @param Gutenberg_View_Config_Data $data The view configuration container for patterns.
 * @return Gutenberg_View_Config_Data The updated view configuration container.
 */
function gutenberg_add_other_categories_to_pattern_views( $data ) {
	if ( ! gutenberg_get_installed_theme_pattern_sources() ) {
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
