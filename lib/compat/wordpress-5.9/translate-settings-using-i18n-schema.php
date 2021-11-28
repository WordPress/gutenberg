<?php
/**
 * Function to translate json files.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_translate_settings_using_i18n_schema' ) ) {
	/**
	 * Translates the provided settings value using its i18n schema.
	 *
	 * @param string|string[]|array[]|object $i18n_schema I18n schema for the setting.
	 * @param string|string[]|array[]        $settings    Value for the settings.
	 * @param string                         $textdomain  Textdomain to use with translations.
	 *
	 * @return string|string[]|array[] Translated settings.
	 */
	function wp_translate_settings_using_i18n_schema( $i18n_schema, $settings, $textdomain ) {
		if ( empty( $i18n_schema ) || empty( $settings ) || empty( $textdomain ) ) {
			return $settings;
		}

		if ( is_string( $i18n_schema ) && is_string( $settings ) ) {
			//phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText, WordPress.WP.I18n.NonSingularStringLiteralContext, WordPress.WP.I18n.NonSingularStringLiteralDomain, WordPress.WP.I18n.LowLevelTranslationFunction
			return translate_with_gettext_context( $settings, $i18n_schema, $textdomain );
		}
		if ( is_array( $i18n_schema ) && is_array( $settings ) ) {
			$translated_settings = array();
			foreach ( $settings as $value ) {
				$translated_settings[] = wp_translate_settings_using_i18n_schema( $i18n_schema[0], $value, $textdomain );
			}
			return $translated_settings;
		}
		if ( is_object( $i18n_schema ) && is_array( $settings ) ) {
			$group_key           = '*';
			$translated_settings = array();
			foreach ( $settings as $key => $value ) {
				if ( isset( $i18n_schema->$key ) ) {
					$translated_settings[ $key ] = wp_translate_settings_using_i18n_schema( $i18n_schema->$key, $value, $textdomain );
				} elseif ( isset( $i18n_schema->$group_key ) ) {
					$translated_settings[ $key ] = wp_translate_settings_using_i18n_schema( $i18n_schema->$group_key, $value, $textdomain );
				} else {
					$translated_settings[ $key ] = $value;
				}
			}
			return $translated_settings;
		}
		return $settings;
	}
}
