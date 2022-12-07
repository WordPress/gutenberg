<?php
/**
 * WP_Theme_JSON_6_2 class
 *
 * @package gutenberg
 */

/**
 * Class that encapsulates the processing of structures that adhere to the theme.json spec.
 *
 * This class is for internal core usage and is not supposed to be used by extenders (plugins and/or themes).
 * This is a low-level API that may need to do breaking changes. Please,
 * use get_global_settings, get_global_styles, and get_global_stylesheet instead.
 *
 * @access private
 */
class WP_Theme_JSON_6_2 extends WP_Theme_JSON_6_1 {
	const APPEARANCE_TOOLS_OPT_INS = array(
		array( 'border', 'color' ),
		array( 'border', 'radius' ),
		array( 'border', 'style' ),
		array( 'border', 'width' ),
		array( 'color', 'link' ),
		array( 'dimensions', 'minHeight' ),
		array( 'spacing', 'blockGap' ),
		array( 'spacing', 'margin' ),
		array( 'spacing', 'padding' ),
		array( 'typography', 'lineHeight' ),
	);

	/**
	 * Metadata for style properties.
	 *
	 * Each element is a direct mapping from the CSS property name to the
	 * path to the value in theme.json & block attributes.
	 *
	 * @since 5.8.0
	 * @since 5.9.0 Added the `border-*`, `font-family`, `font-style`, `font-weight`,
	 *              `letter-spacing`, `margin-*`, `padding-*`, `--wp--style--block-gap`,
	 *              `text-decoration`, `text-transform`, and `filter` properties,
	 *              simplified the metadata structure.
	 * @since 6.1.0 Added the `border-*-color`, `border-*-width`, `border-*-style`,
	 *              `--wp--style--root--padding-*`, and `box-shadow` properties,
	 *              removed the `--wp--style--block-gap` property.
	 * @since 6.2.0 Added `min-height`.
	 * @var array
	 */
	const PROPERTIES_METADATA = array(
		'background'                        => array( 'color', 'gradient' ),
		'background-color'                  => array( 'color', 'background' ),
		'border-radius'                     => array( 'border', 'radius' ),
		'border-top-left-radius'            => array( 'border', 'radius', 'topLeft' ),
		'border-top-right-radius'           => array( 'border', 'radius', 'topRight' ),
		'border-bottom-left-radius'         => array( 'border', 'radius', 'bottomLeft' ),
		'border-bottom-right-radius'        => array( 'border', 'radius', 'bottomRight' ),
		'border-color'                      => array( 'border', 'color' ),
		'border-width'                      => array( 'border', 'width' ),
		'border-style'                      => array( 'border', 'style' ),
		'border-top-color'                  => array( 'border', 'top', 'color' ),
		'border-top-width'                  => array( 'border', 'top', 'width' ),
		'border-top-style'                  => array( 'border', 'top', 'style' ),
		'border-right-color'                => array( 'border', 'right', 'color' ),
		'border-right-width'                => array( 'border', 'right', 'width' ),
		'border-right-style'                => array( 'border', 'right', 'style' ),
		'border-bottom-color'               => array( 'border', 'bottom', 'color' ),
		'border-bottom-width'               => array( 'border', 'bottom', 'width' ),
		'border-bottom-style'               => array( 'border', 'bottom', 'style' ),
		'border-left-color'                 => array( 'border', 'left', 'color' ),
		'border-left-width'                 => array( 'border', 'left', 'width' ),
		'border-left-style'                 => array( 'border', 'left', 'style' ),
		'color'                             => array( 'color', 'text' ),
		'font-family'                       => array( 'typography', 'fontFamily' ),
		'font-size'                         => array( 'typography', 'fontSize' ),
		'font-style'                        => array( 'typography', 'fontStyle' ),
		'font-weight'                       => array( 'typography', 'fontWeight' ),
		'letter-spacing'                    => array( 'typography', 'letterSpacing' ),
		'line-height'                       => array( 'typography', 'lineHeight' ),
		'margin'                            => array( 'spacing', 'margin' ),
		'margin-top'                        => array( 'spacing', 'margin', 'top' ),
		'margin-right'                      => array( 'spacing', 'margin', 'right' ),
		'margin-bottom'                     => array( 'spacing', 'margin', 'bottom' ),
		'margin-left'                       => array( 'spacing', 'margin', 'left' ),
		'min-height'                        => array( 'dimensions', 'minHeight' ),
		'padding'                           => array( 'spacing', 'padding' ),
		'padding-top'                       => array( 'spacing', 'padding', 'top' ),
		'padding-right'                     => array( 'spacing', 'padding', 'right' ),
		'padding-bottom'                    => array( 'spacing', 'padding', 'bottom' ),
		'padding-left'                      => array( 'spacing', 'padding', 'left' ),
		'--wp--style--root--padding'        => array( 'spacing', 'padding' ),
		'--wp--style--root--padding-top'    => array( 'spacing', 'padding', 'top' ),
		'--wp--style--root--padding-right'  => array( 'spacing', 'padding', 'right' ),
		'--wp--style--root--padding-bottom' => array( 'spacing', 'padding', 'bottom' ),
		'--wp--style--root--padding-left'   => array( 'spacing', 'padding', 'left' ),
		'text-decoration'                   => array( 'typography', 'textDecoration' ),
		'text-transform'                    => array( 'typography', 'textTransform' ),
		'filter'                            => array( 'filter', 'duotone' ),
		'box-shadow'                        => array( 'shadow' ),
	);

	/**
	 * Indirect metadata for style properties that are not directly output.
	 *
	 * Each element is a direct mapping from a CSS property name to the
	 * path to the value in theme.json & block attributes.
	 *
	 * Indirect properties are not output directly by `compute_style_properties`,
	 * but are used elsewhere in the processing of global styles. The indirect
	 * property is used to validate whether or not a style value is allowed.
	 *
	 * @since 6.2.0
	 * @var array
	 */
	const INDIRECT_PROPERTIES_METADATA = array(
		'gap'        => array( 'spacing', 'blockGap' ),
		'column-gap' => array( 'spacing', 'blockGap', 'left' ),
		'row-gap'    => array( 'spacing', 'blockGap', 'top' ),
	);

	/**
	 * The valid properties under the settings key.
	 *
	 * @since 5.8.0 As `ALLOWED_SETTINGS`.
	 * @since 5.9.0 Renamed from `ALLOWED_SETTINGS` to `VALID_SETTINGS`,
	 *              added new properties for `border`, `color`, `spacing`,
	 *              and `typography`, and renamed others according to the new schema.
	 * @since 6.0.0 Added `color.defaultDuotone`.
	 * @since 6.1.0 Added `layout.definitions` and `useRootPaddingAwareAlignments`.
	 * @since 6.2.0 Added `dimensions.minHeight`.
	 * @var array
	 */
	const VALID_SETTINGS = array(
		'appearanceTools'               => null,
		'useRootPaddingAwareAlignments' => null,
		'border'                        => array(
			'color'  => null,
			'radius' => null,
			'style'  => null,
			'width'  => null,
		),
		'color'                         => array(
			'background'       => null,
			'custom'           => null,
			'customDuotone'    => null,
			'customGradient'   => null,
			'defaultDuotone'   => null,
			'defaultGradients' => null,
			'defaultPalette'   => null,
			'duotone'          => null,
			'gradients'        => null,
			'link'             => null,
			'palette'          => null,
			'text'             => null,
		),
		'custom'                        => null,
		'dimensions'                    => array(
			'minHeight' => null,
		),
		'layout'                        => array(
			'contentSize' => null,
			'definitions' => null,
			'wideSize'    => null,
		),
		'spacing'                       => array(
			'customSpacingSize' => null,
			'spacingSizes'      => null,
			'spacingScale'      => null,
			'blockGap'          => null,
			'margin'            => null,
			'padding'           => null,
			'units'             => null,
		),
		'typography'                    => array(
			'fluid'          => null,
			'customFontSize' => null,
			'dropCap'        => null,
			'fontFamilies'   => null,
			'fontSizes'      => null,
			'fontStyle'      => null,
			'fontWeight'     => null,
			'letterSpacing'  => null,
			'lineHeight'     => null,
			'textDecoration' => null,
			'textTransform'  => null,
		),
	);

	/**
	 * The valid properties under the styles key.
	 *
	 * @since 5.8.0 As `ALLOWED_STYLES`.
	 * @since 5.9.0 Renamed from `ALLOWED_STYLES` to `VALID_STYLES`,
	 *              added new properties for `border`, `filter`, `spacing`,
	 *              and `typography`.
	 * @since 6.1.0 Added new side properties for `border`,
	 *              added new property `shadow`,
	 *              updated `blockGap` to be allowed at any level.
	 * @since 6.2.0 Added new property `css`.
	 * @var array
	 */
	const VALID_STYLES = array(
		'border'     => array(
			'color'  => null,
			'radius' => null,
			'style'  => null,
			'width'  => null,
			'top'    => null,
			'right'  => null,
			'bottom' => null,
			'left'   => null,
		),
		'color'      => array(
			'background' => null,
			'gradient'   => null,
			'text'       => null,
		),
		'dimensions' => array(
			'minHeight' => null,
		),
		'filter'     => array(
			'duotone' => null,
		),
		'shadow'     => null,
		'spacing'    => array(
			'margin'   => null,
			'padding'  => null,
			'blockGap' => null,
		),
		'typography' => array(
			'fontFamily'     => null,
			'fontSize'       => null,
			'fontStyle'      => null,
			'fontWeight'     => null,
			'letterSpacing'  => null,
			'lineHeight'     => null,
			'textDecoration' => null,
			'textTransform'  => null,
		),
		'css'        => null,
	);

	/**
	 * Processes a style node and returns the same node
	 * without the insecure styles.
	 *
	 * @since 5.9.0
	 * @since 6.2.0 Allow indirect properties used outside of `compute_style_properties`.
	 *
	 * @param array $input Node to process.
	 * @return array
	 */
	protected static function remove_insecure_styles( $input ) {
		$output       = array();
		$declarations = static::compute_style_properties( $input );

		foreach ( $declarations as $declaration ) {
			if ( static::is_safe_css_declaration( $declaration['name'], $declaration['value'] ) ) {
				$path = static::PROPERTIES_METADATA[ $declaration['name'] ];

				// Check the value isn't an array before adding so as to not
				// double up shorthand and longhand styles.
				$value = _wp_array_get( $input, $path, array() );
				if ( ! is_array( $value ) ) {
					_wp_array_set( $output, $path, $value );
				}
			}
		}

		// Ensure indirect properties not handled by `compute_style_properties` are allowed.
		foreach ( static::INDIRECT_PROPERTIES_METADATA as $property => $path ) {
			$value = _wp_array_get( $input, $path, array() );
			if (
				isset( $value ) &&
				! is_array( $value ) &&
				static::is_safe_css_declaration( $property, $value )
			) {
				_wp_array_set( $output, $path, $value );
			}
		}

		return $output;
	}

	/**
	 * Returns the stylesheet that results of processing
	 * the theme.json structure this object represents.
	 *
	 * @param array $types    Types of styles to load. Will load all by default. It accepts:
	 *                         'variables': only the CSS Custom Properties for presets & custom ones.
	 *                         'styles': only the styles section in theme.json.
	 *                         'presets': only the classes for the presets.
	 *                         'custom-css': only the css from global styles.css.
	 * @param array $origins A list of origins to include. By default it includes VALID_ORIGINS.
	 * @param array $options An array of options for now used for internal purposes only (may change without notice).
	 *                       The options currently supported are 'scope' that makes sure all style are scoped to a given selector,
	 *                       and root_selector which overwrites and forces a given selector to be used on the root node.
	 * @return string Stylesheet.
	 */
	public function get_stylesheet( $types = array( 'variables', 'styles', 'presets' ), $origins = null, $options = array() ) {
		if ( null === $origins ) {
			$origins = static::VALID_ORIGINS;
		}

		if ( is_string( $types ) ) {
			// Dispatch error and map old arguments to new ones.
			_deprecated_argument( __FUNCTION__, '5.9' );
			if ( 'block_styles' === $types ) {
				$types = array( 'styles', 'presets' );
			} elseif ( 'css_variables' === $types ) {
				$types = array( 'variables' );
			} else {
				$types = array( 'variables', 'styles', 'presets' );
			}
		}

		$blocks_metadata = static::get_blocks_metadata();
		$style_nodes     = static::get_style_nodes( $this->theme_json, $blocks_metadata );
		$setting_nodes   = static::get_setting_nodes( $this->theme_json, $blocks_metadata );

		$root_style_key    = array_search( static::ROOT_BLOCK_SELECTOR, array_column( $style_nodes, 'selector' ), true );
		$root_settings_key = array_search( static::ROOT_BLOCK_SELECTOR, array_column( $setting_nodes, 'selector' ), true );

		if ( ! empty( $options['scope'] ) ) {
			foreach ( $setting_nodes as &$node ) {
				$node['selector'] = static::scope_selector( $options['scope'], $node['selector'] );
			}
			foreach ( $style_nodes as &$node ) {
				$node['selector'] = static::scope_selector( $options['scope'], $node['selector'] );
			}
		}

		if ( ! empty( $options['root_selector'] ) ) {
			if ( false !== $root_settings_key ) {
				$setting_nodes[ $root_settings_key ]['selector'] = $options['root_selector'];
			}
			if ( false !== $root_style_key ) {
				$setting_nodes[ $root_style_key ]['selector'] = $options['root_selector'];
			}
		}

		$stylesheet = '';

		if ( in_array( 'variables', $types, true ) ) {
			$stylesheet .= $this->get_css_variables( $setting_nodes, $origins );
		}

		if ( in_array( 'styles', $types, true ) ) {
			if ( false !== $root_style_key ) {
				$stylesheet .= $this->get_root_layout_rules( $style_nodes[ $root_style_key ]['selector'], $style_nodes[ $root_style_key ] );
			}
			$stylesheet .= $this->get_block_classes( $style_nodes );
		} elseif ( in_array( 'base-layout-styles', $types, true ) ) {
			$root_selector    = static::ROOT_BLOCK_SELECTOR;
			$columns_selector = '.wp-block-columns';
			if ( ! empty( $options['scope'] ) ) {
				$root_selector    = static::scope_selector( $options['scope'], $root_selector );
				$columns_selector = static::scope_selector( $options['scope'], $columns_selector );
			}
			if ( ! empty( $options['root_selector'] ) ) {
				$root_selector = $options['root_selector'];
			}
			// Base layout styles are provided as part of `styles`, so only output separately if explicitly requested.
			// For backwards compatibility, the Columns block is explicitly included, to support a different default gap value.
			$base_styles_nodes = array(
				array(
					'path'     => array( 'styles' ),
					'selector' => $root_selector,
				),
				array(
					'path'     => array( 'styles', 'blocks', 'core/columns' ),
					'selector' => $columns_selector,
					'name'     => 'core/columns',
				),
			);

			foreach ( $base_styles_nodes as $base_style_node ) {
				$stylesheet .= $this->get_layout_styles( $base_style_node );
			}
		}

		if ( in_array( 'presets', $types, true ) ) {
			$stylesheet .= $this->get_preset_classes( $setting_nodes, $origins );
		}

		// Load the custom CSS last so it has the highest specificity.
		if ( in_array( 'custom-css', $types, true ) ) {
			$stylesheet .= _wp_array_get( $this->theme_json, array( 'styles', 'css' ) );
		}

		return $stylesheet;
	}
}
