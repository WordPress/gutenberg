<?php
/**
 * Class that implements a WP_Theme_JSON_Schema migrator.
 *
 * @package gutenberg
 */

/**
 * Class that implements a migration from a v1 data structure into a v2 one.
 */
class WP_Theme_JSON_Schema_V1_To_V2 implements WP_Theme_JSON_Schema {
	/**
	 * Maps old properties to their new location within the schema's settings.
	 * This will be applied at both the defaults and individual block levels.
	 */
	const RENAMED_PATHS = array(
		'border.customRadius'         => 'border.radius',
		'spacing.customMargin'        => 'spacing.margin',
		'spacing.customPadding'       => 'spacing.padding',
		'typography.customLineHeight' => 'typography.lineHeight',
	);

	/**
	 * Removes the custom prefixes for a few properties
	 * that were part of v1:
	 *
	 * 'border.customRadius'         => 'border.radius',
	 * 'spacing.customMargin'        => 'spacing.margin',
	 * 'spacing.customPadding'       => 'spacing.padding',
	 * 'typography.customLineHeight' => 'typography.lineHeight',
	 *
	 * @param array $old Data to migrate.
	 *
	 * @return array Data without the custom prefixes.
	 */
	public static function migrate( $old ) {
		// Copy everything.
		$new = $old;

		// Overwrite the things that changed.
		if ( isset( $old['settings'] ) ) {
			$new['settings'] = self::process_settings( $old['settings'] );
		}

		// Set the new version.
		$new['version'] = 2;

		return $new;
	}

	/**
	 * Processes the settings subtree.
	 *
	 * @param array $settings Array to process.
	 *
	 * @return array The settings in the new format.
	 */
	private static function process_settings( $settings ) {
		$new_settings = $settings;

		// Process any renamed/moved paths within default settings.
		self::rename_settings( $new_settings );

		// Process individual block settings.
		if ( isset( $new_settings['blocks'] ) && is_array( $new_settings['blocks'] ) ) {
			foreach ( $new_settings['blocks'] as &$block_settings ) {
				self::rename_settings( $block_settings );
			}
		}

		return $new_settings;
	}

	/**
	 * Processes a settings array, renaming or moving properties according to
	 * `self::RENAMED_PATHS`.
	 *
	 * @param array $settings Reference to settings either defaults or an individual block's.
	 * @return void
	 */
	private static function rename_settings( &$settings ) {
		foreach ( self::RENAMED_PATHS as $original => $renamed ) {
			$original_path = explode( '.', $original );
			$renamed_path  = explode( '.', $renamed );
			$current_value = _wp_array_get( $settings, $original_path, null );

			if ( null !== $current_value ) {
				gutenberg_experimental_set( $settings, $renamed_path, $current_value );
				self::unset_setting_by_path( $settings, $original_path );
			}
		}
	}

	/**
	 * Removes a property from within the provided settings by its path.
	 *
	 * @param array $settings Reference to the current settings array.
	 * @param array $path Path to the property to be removed.
	 *
	 * @return void
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
