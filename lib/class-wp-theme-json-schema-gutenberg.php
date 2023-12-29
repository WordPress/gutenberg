<?php
/**
 * WP_Theme_JSON_Schema_Gutenberg class
 *
 * This class/file will NOT be backported to Core. It exists to provide a
 * migration path for theme.json files that used the deprecated "behaviors".
 * This file will be removed from Gutenberg in version 17.0.0.
 *
 * @package gutenberg
 * @since 16.7.0
 */

if ( class_exists( 'WP_Theme_JSON_Schema_Gutenberg' ) ) {
	return;
}

/**
 * Class that migrates a given theme.json structure to the latest schema.
 *
 * This class is for internal core usage and is not supposed to be used by extenders (plugins and/or themes).
 * This is a low-level API that may need to do breaking changes. Please,
 * use get_global_settings, get_global_styles, and get_global_stylesheet instead.
 *
 * @since 5.9.0
 * @access private
 */
#[AllowDynamicProperties]
class WP_Theme_JSON_Schema_Gutenberg {

	/**
	 * Maps old properties to their new location within the schema's settings.
	 * This will be applied at both the defaults and individual block levels.
	 */
	const V1_TO_V2_RENAMED_PATHS = array(
		'border.customRadius'         => 'border.radius',
		'spacing.customMargin'        => 'spacing.margin',
		'spacing.customPadding'       => 'spacing.padding',
		'typography.customLineHeight' => 'typography.lineHeight',
	);

	/**
	 * Function that migrates a given theme.json structure to the last version.
	 *
	 * @since 5.9.0
	 *
	 * @param array $theme_json The structure to migrate.
	 *
	 * @return array The structure in the last version.
	 */
	public static function migrate( $theme_json ) {
		if ( ! isset( $theme_json['version'] ) ) {
			$theme_json = array(
				'version' => WP_Theme_JSON::LATEST_SCHEMA,
			);
		}

		if ( 1 === $theme_json['version'] ) {
			$theme_json = self::migrate_v1_to_v2( $theme_json );
		}

		if ( 2 === $theme_json['version'] ) {
			$theme_json = self::migrate_deprecated_lightbox_behaviors( $theme_json );
		}

		return $theme_json;
	}

	/**
	 * Removes the custom prefixes for a few properties
	 * that were part of v1:
	 *
	 * 'border.customRadius'         => 'border.radius',
	 * 'spacing.customMargin'        => 'spacing.margin',
	 * 'spacing.customPadding'       => 'spacing.padding',
	 * 'typography.customLineHeight' => 'typography.lineHeight',
	 *
	 * @since 5.9.0
	 *
	 * @param array $old Data to migrate.
	 *
	 * @return array Data without the custom prefixes.
	 */
	private static function migrate_v1_to_v2( $old ) {
		// Copy everything.
		$new = $old;

		// Overwrite the things that changed.
		if ( isset( $old['settings'] ) ) {
			$new['settings'] = self::rename_paths( $old['settings'], self::V1_TO_V2_RENAMED_PATHS );
		}

		// Set the new version.
		$new['version'] = 2;

		return $new;
	}


	/**
	 * Migrate away from the previous syntax that used a top-level "behaviors" key
	 * in the `theme.json` to a new "lightbox" setting.
	 *
	 * This function SHOULD NOT be ported to Core!!!
	 *
	 * It is a temporary migration that will be removed in Gutenberg 17.0.0
	 *
	 * @since 16.7.0
	 *
	 * @param array $old Data with (potentially) behaviors.
	 * @return array Data with behaviors removed.
	 */
	private static function migrate_deprecated_lightbox_behaviors( $old ) {
		// Copy everything.
		$new = $old;

		// Migrate the old behaviors syntax to the new "lightbox" syntax.
		if ( isset( $old['behaviors']['blocks']['core/image']['lightbox']['enabled'] ) ) {
			_wp_array_set(
				$new,
				array( 'settings', 'blocks', 'core/image', 'lightbox', 'enabled' ),
				$old['behaviors']['blocks']['core/image']['lightbox']['enabled']
			);
		}

		// Migrate the behaviors setting to the new syntax. This setting controls
		// whether the Lightbox UI shows up in the block editor.
		if ( isset( $old['settings']['blocks']['core/image']['behaviors']['lightbox'] ) ) {
			_wp_array_set(
				$new,
				array( 'settings', 'blocks', 'core/image', 'lightbox', 'allowEditing' ),
				$old['settings']['blocks']['core/image']['behaviors']['lightbox']
			);
		}

		return $new;
	}

	/**
	 * Processes the settings subtree.
	 *
	 * @since 5.9.0
	 *
	 * @param array $settings        Array to process.
	 * @param array $paths_to_rename Paths to rename.
	 *
	 * @return array The settings in the new format.
	 */
	private static function rename_paths( $settings, $paths_to_rename ) {
		$new_settings = $settings;

		// Process any renamed/moved paths within default settings.
		self::rename_settings( $new_settings, $paths_to_rename );

		// Process individual block settings.
		if ( isset( $new_settings['blocks'] ) && is_array( $new_settings['blocks'] ) ) {
			foreach ( $new_settings['blocks'] as &$block_settings ) {
				self::rename_settings( $block_settings, $paths_to_rename );
			}
		}

		return $new_settings;
	}

	/**
	 * Processes a settings array, renaming or moving properties.
	 *
	 * @since 5.9.0
	 *
	 * @param array $settings        Reference to settings either defaults or an individual block's.
	 * @param array $paths_to_rename Paths to rename.
	 */
	private static function rename_settings( &$settings, $paths_to_rename ) {
		foreach ( $paths_to_rename as $original => $renamed ) {
			$original_path = explode( '.', $original );
			$renamed_path  = explode( '.', $renamed );
			$current_value = _wp_array_get( $settings, $original_path, null );

			if ( null !== $current_value ) {
				_wp_array_set( $settings, $renamed_path, $current_value );
				self::unset_setting_by_path( $settings, $original_path );
			}
		}
	}

	/**
	 * Removes a property from within the provided settings by its path.
	 *
	 * @since 5.9.0
	 *
	 * @param array $settings Reference to the current settings array.
	 * @param array $path Path to the property to be removed.
	 */
	private static function unset_setting_by_path( &$settings, $path ) {
		$tmp_settings = &$settings; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$last_key     = array_pop( $path );
		foreach ( $path as $key ) {
			$tmp_settings = &$tmp_settings[ $key ];
		}

		unset( $tmp_settings[ $last_key ] );
	}
}
