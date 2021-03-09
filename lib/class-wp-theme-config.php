<?php
/**
 * Object representing the current theme config.
 *
 * @package gutenberg
 */

/**
 * Class that encapsulates the processing of
 * structures that adhere to the theme.json spec.
 */
class WP_Theme_Config {

	/**
	 * Whether or not it has a theme.json is present.
	 *
	 * @var boolean
	 */
	private $has_theme_json;

	/**
	 * All configs merged (user and theme)
	 *
	 * @var WP_Theme_JSON
	 */
	private $merged_config;

	/**
	 * Theme config.
	 *
	 * @var WP_Theme_JSON
	 */
	private $theme_config;

	/**
	 * Constructor.
	 *
	 * @param boolean $has_theme_json Whether or not the theme.json file is present.
	 * @param array   $default_settings_and_styles Default settings and styles.
	 * @param array   $theme_settings_and_styles Theme provided settings and styles.
	 * @param array   $user_settings_and_styles User settings and styles.
	 */
	public function __construct( $has_theme_json, $default_settings_and_styles, $theme_settings_and_styles, $user_settings_and_styles ) {
		$this->has_theme_json = $has_theme_json;

		// All Merged configs.
		$merged_config = new WP_Theme_JSON();
		$merged_config->merge( $default_settings_and_styles );
		$merged_config->merge( $theme_settings_and_styles );
		if ( $has_theme_json && gutenberg_is_fse_theme() ) {
			$merged_config->merge( $user_settings_and_styles );
		}
		$this->merged_config = $merged_config;

		// Theme configs.
		$theme_config = new WP_Theme_JSON();
		$theme_config = new WP_Theme_JSON();
		$theme_config->merge( $default_settings_and_styles );
		$theme_config->merge( $theme_settings_and_styles );
		$this->theme_config = $theme_config;
	}

	/**
	 * Whether or not it has a theme.json is present.
	 *
	 * @return boolean
	 */
	public function has_theme_json_file() {
		return $this->has_theme_json;
	}

	/**
	 * Generate the stylesheet corresponding to the theme config.
	 *
	 * @param string $type Type of stylesheet we want accepts 'all', 'block_styles', and 'css_variables'.
	 *
	 * @return string Stylesheet.
	 */
	public function get_stylesheet( $type = 'all' ) {
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

		$stylesheet = $this->merged_config->get_stylesheet( $type );

		if ( ( 'all' === $type || 'block_styles' === $type ) && $this->has_theme_json ) {
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
	 * Retrieve the current theme settings.
	 *
	 * @return array settings.
	 */
	public function get_settings() {
		return $this->merged_config->get_settings();
	}

	/**
	 * Returns the theme raw config.
	 * The Raw config is an array matching the theme.json format.
	 *
	 * @return array config.
	 */
	public function get_theme_raw_config() {
		return $this->theme_config->get_raw_data();
	}

	/**
	 * Returns the defined template parts areas.
	 *
	 * @return array config.
	 */
	public function get_template_parts() {
		return $this->merged_config->get_template_parts();
	}

	/**
	 * Returns the defined custom templates.
	 *
	 * @return array cuustom templates.
	 */
	public function get_custom_templates() {
		return $this->merged_config->get_custom_templates();
	}
}
