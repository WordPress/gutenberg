<?php
/**
 * Class that implements a WP_Theme_JSON_Schema to convert
 * a given structure in v1 schema to the latest one.
 *
 * @package gutenberg
 */

/**
 * Class that implements a WP_Theme_JSON_Schema to convert
 * a given structure in v0 schema to the latest one.
 */
class WP_Theme_JSON_Schema_V1 implements WP_Theme_JSON_Schema {
	/**
	 * Data schema for v1 theme.json.
	 */
	const SCHEMA = array(
		'version'         => 1,
		'settings'        => array(
			'border'     => array(
				'radius' => null,
				'color'  => null,
				'style'  => null,
				'width'  => null,
			),
			'color'      => array(
				'custom'         => null,
				'customGradient' => null,
				'gradients'      => null,
				'link'           => null,
				'palette'        => null,
			),
			'spacing'    => array(
				'customPadding' => null,
				'units'         => null,
			),
			'typography' => array(
				'customFontSize'   => null,
				'customLineHeight' => null,
				'dropCap'          => null,
				'fontFamilies'     => null,
				'fontSizes'        => null,
				'fontStyle'        => null,
				'fontWeight'       => null,
				'letterSpacing'    => null,
				'textDecorations'  => null,
				'textTransforms'   => null,
			),
			'custom'     => null,
			'layout'     => null,
		),
		'styles'          => array(
			'border'     => array(
				'radius' => null,
				'color'  => null,
				'style'  => null,
				'width'  => null,
			),
			'color'      => array(
				'background' => null,
				'gradient'   => null,
				'link'       => null,
				'text'       => null,
			),
			'spacing'    => array(
				'padding' => array(
					'top'    => null,
					'right'  => null,
					'bottom' => null,
					'left'   => null,
				),
			),
			'typography' => array(
				'fontFamily'     => null,
				'fontSize'       => null,
				'fontStyle'      => null,
				'fontWeight'     => null,
				'lineHeight'     => null,
				'textDecoration' => null,
				'textTransform'  => null,
			),
		),
		'customTemplates' => null,
		'templateParts'   => null,
	);

	/**
	 * Maps old properties to their new location within the schema's settings.
	 * This will be applied at both the defaults and individual block levels.
	 */
	const RENAMED_PATHS = array(
		'border.customColor'               => 'border.color',
		'border.customStyle'               => 'border.style',
		'border.customWidth'               => 'border.width',
		'typography.customFontStyle'       => 'typography.fontStyle',
		'typography.customFontWeight'      => 'typography.fontWeight',
		'typography.customLetterSpacing'   => 'typography.letterSpacing',
		'typography.customTextDecorations' => 'typography.textDecoration',
		'typography.customTextTransforms'  => 'typography.textTransform',
	);

	/**
	 * Converts a v1 schema into the latest.
	 *
	 * @param array $old Data in v1 schema.
	 *
	 * @return array Data in the latest schema.
	 */
	public static function parse( $old ) {
		// Copy everything.
		$new = $old;

		// Overwrite the things that change.
		if ( isset( $old['settings'] ) ) {
			$new['settings'] = self::process_settings( $old['settings'] );
		}

		$new['version'] = WP_Theme_JSON_Gutenberg::LATEST_SCHEMA;

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
