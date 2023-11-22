<?php
/**
 * Adds settings to the mobile block editor.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'keep_supported_block_editor_settings_mobile' ) ) {
	/**
	 * Keeps only supported settings for the mobile block editor.
	 *
	 * This is used to control the editor settings payload. Keys can be specified
	 * as `true` to be allowed, which will also allow entire nested structures.
	 * Alternatively, nested structures can have nested allow-lists for their keys.
	 *
	 * @param array $initial_array Existing block editor settings.
	 *
	 * @param array $allow_list_array Structured allow-list.
	 *
	 * @return array New block editor settings.
	 */
	function keep_supported_block_editor_settings_mobile( $initial_array, $allow_list_array ) {
		$result = array();

		foreach ( $allow_list_array as $key => $value ) {
			if ( ! array_key_exists( $key, $initial_array ) ) {
				continue;
			}

			$initial_value = $initial_array[ $key ];

			if ( array_key_exists( $key, $initial_array ) ) {
				if ( is_array( $value ) && is_array( $initial_value ) ) {
					$result[ $key ] = keep_supported_block_editor_settings_mobile( $initial_value, $value );
				} else {
					$result[ $key ] = $initial_value;
				}
			}
		}

		return $result;
	}
}


/**
 * Adds settings to the mobile block editor.
 *
 * This is used by the settings REST endpoint and it should land in core
 * as soon as lib/class-wp-rest-block-editor-settings-controller.php does.
 *
 * @param array $settings Existing block editor settings.
 *
 * @return array New block editor settings.
 */
function gutenberg_get_block_editor_settings_mobile( $settings ) {
	if (
		defined( 'REST_REQUEST' ) &&
		REST_REQUEST &&
		isset( $_GET['context'] ) &&
		'mobile' === $_GET['context']
	) {
		if ( wp_theme_has_theme_json() ) {
			$settings['__experimentalStyles'] = gutenberg_get_global_styles();
		}

		// To tell mobile that the site uses quote v2 (inner blocks).
		// See https://github.com/WordPress/gutenberg/pull/25892.
		$settings['__experimentalEnableQuoteBlockV2'] = true;
		// To tell mobile that the site uses list v2 (inner blocks).
		$settings['__experimentalEnableListBlockV2'] = true;
	}

	return keep_supported_block_editor_settings_mobile(
		$settings,
		array(
			'alignWide'                        => true,
			'allowedBlockTypes'                => true,
			'allowedMimeTypes'                 => true,
			'defaultEditorStyles'              => true,
			'blockCategories'                  => true,
			'isRTL'                            => true,
			'imageDefaultSize'                 => true,
			'imageDimensions'                  => true,
			'imageEditing'                     => true,
			'imageSizes'                       => true,
			'maxUploadFileSize'                => true,
			'__unstableGalleryWithImageBlocks' => true,
			'disableCustomColors'              => true,
			'disableCustomFontSizes'           => true,
			'disableCustomGradients'           => true,
			'disableLayoutStyles'              => true,
			'enableCustomLineHeight'           => true,
			'enableCustomSpacing'              => true,
			'enableCustomUnits'                => true,
			'colors'                           => true,
			'fontSizes'                        => true,
			'__experimentalStyles'             => array(
				'elements'   => true,
				'spacing'    => true,
				'blocks'     => true,
				'color'      => true,
				'typography' => true,
			),
			'__experimentalFeatures'           => array(
				'appearanceTools'               => true,
				'useRootPaddingAwareAlignments' => true,
				'border'                        => true,
				'color'                         => true,
				'shadow'                        => true,
				'spacing'                       => true,
				'typography'                    => array(
					'dropCap'        => true,
					'fontSizes'      => true,
					'fontStyle'      => true,
					'fontWeight'     => true,
					'letterSpacing'  => true,
					'textColumns'    => true,
					'textDecoration' => true,
					'textTransform'  => true,
					'writingMode'    => true,
				),
				'blocks'                        => true,
				'background'                    => true,
				'dimensions'                    => true,
				'position'                      => true,
			),
			'gradients'                        => true,
			'disableCustomSpacingSizes'        => true,
			'spacingSizes'                     => true,
			'__unstableIsBlockBasedTheme'      => true,
			'localAutosaveInterval'            => true,
			'__experimentalDiscussionSettings' => true,
			'__experimentalDashboardLink'      => true,
			'__experimentalEnableQuoteBlockV2' => true,
			'__experimentalEnableListBlockV2'  => true,
		)
	);
}

add_filter( 'block_editor_settings_all', 'gutenberg_get_block_editor_settings_mobile', PHP_INT_MAX );
