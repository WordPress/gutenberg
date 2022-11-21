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
	);

	/**
	 * Get the CSS layout rules for a particular block from theme.json layout definitions.
	 *
	 * @param array $block_metadata Metadata about the block to get styles for.
	 *
	 * @return string Layout styles for the block.
	 */
	protected function get_layout_styles( $block_metadata ) {
		$block_rules = '';
		$block_type  = null;

		// Skip outputting layout styles if explicitly disabled.
		if ( current_theme_supports( 'disable-layout-styles' ) ) {
			return $block_rules;
		}

		if ( isset( $block_metadata['name'] ) ) {
			$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_metadata['name'] );
			if ( ! block_has_support( $block_type, array( '__experimentalLayout' ), false ) ) {
				return $block_rules;
			}
		}

		$selector                 = isset( $block_metadata['selector'] ) ? $block_metadata['selector'] : '';
		$has_block_gap_support    = _wp_array_get( $this->theme_json, array( 'settings', 'spacing', 'blockGap' ) ) !== null;
		$has_fallback_gap_support = ! $has_block_gap_support; // This setting isn't useful yet: it exists as a placeholder for a future explicit fallback gap styles support.
		$node                     = _wp_array_get( $this->theme_json, $block_metadata['path'], array() );
		$layout_definitions       = _wp_array_get( $this->theme_json, array( 'settings', 'layout', 'definitions' ), array() );
		$layout_selector_pattern  = '/^[a-zA-Z0-9\-\.\ *+>:\(\)]*$/'; // Allow alphanumeric classnames, spaces, wildcard, sibling, child combinator and pseudo class selectors.

		// Gap styles will only be output if the theme has block gap support, or supports a fallback gap.
		// Default layout gap styles will be skipped for themes that do not explicitly opt-in to blockGap with a `true` or `false` value.
		if ( $has_block_gap_support || $has_fallback_gap_support ) {
			$block_gap_value = null;
			// Use a fallback gap value if block gap support is not available.
			if ( ! $has_block_gap_support ) {
				$block_gap_value = static::ROOT_BLOCK_SELECTOR === $selector ? '0.5em' : null;
				if ( ! empty( $block_type ) ) {
					$block_gap_value = _wp_array_get( $block_type->supports, array( 'spacing', 'blockGap', '__experimentalDefault' ), null );
				}
			} else {
				$block_gap_value = static::get_property_value( $node, array( 'spacing', 'blockGap' ) );
			}

			// Support split row / column values and concatenate to a shorthand value.
			if ( is_array( $block_gap_value ) ) {
				if ( isset( $block_gap_value['top'] ) && isset( $block_gap_value['left'] ) ) {
					$gap_row         = static::get_property_value( $node, array( 'spacing', 'blockGap', 'top' ) );
					$gap_column      = static::get_property_value( $node, array( 'spacing', 'blockGap', 'left' ) );
					$block_gap_value = $gap_row === $gap_column ? $gap_row : $gap_row . ' ' . $gap_column;
				} else {
					// Skip outputting gap value if not all sides are provided.
					$block_gap_value = null;
				}
			}

			// If the block should have custom gap, add the gap styles.
			if ( null !== $block_gap_value && false !== $block_gap_value && '' !== $block_gap_value ) {
				foreach ( $layout_definitions as $layout_definition_key => $layout_definition ) {
					// Allow outputting fallback gap styles for flex layout type when block gap support isn't available.
					if ( ! $has_block_gap_support && 'flex' !== $layout_definition_key ) {
						continue;
					}

					$class_name    = sanitize_title( _wp_array_get( $layout_definition, array( 'className' ), false ) );
					$spacing_rules = _wp_array_get( $layout_definition, array( 'spacingStyles' ), array() );

					if (
						! empty( $class_name ) &&
						! empty( $spacing_rules )
					) {
						foreach ( $spacing_rules as $spacing_rule ) {
							$declarations = array();
							if (
								isset( $spacing_rule['selector'] ) &&
								preg_match( $layout_selector_pattern, $spacing_rule['selector'] ) &&
								! empty( $spacing_rule['rules'] )
							) {
								// Iterate over each of the styling rules and substitute non-string values such as `null` with the real `blockGap` value.
								foreach ( $spacing_rule['rules'] as $css_property => $css_value ) {
									$current_css_value = is_string( $css_value ) ? $css_value : $block_gap_value;
									if ( static::is_safe_css_declaration( $css_property, $current_css_value ) ) {
										$declarations[] = array(
											'name'  => $css_property,
											'value' => $current_css_value,
										);
									}
								}

								if ( ! $has_block_gap_support ) {
									// For fallback gap styles, use lower specificity, to ensure styles do not unintentionally override theme styles.
									$format          = static::ROOT_BLOCK_SELECTOR === $selector ? ':where(.%2$s%3$s)' : ':where(%1$s.%2$s%3$s)';
									$layout_selector = sprintf(
										$format,
										$selector,
										$class_name,
										$spacing_rule['selector']
									);
								} else {
									$format          = static::ROOT_BLOCK_SELECTOR === $selector ? '.%2$s%3$s' : '%s.%s%s';
									$layout_selector = sprintf(
										$format,
										$selector,
										$class_name,
										$spacing_rule['selector']
									);
								}
								$block_rules .= static::to_ruleset( $layout_selector, $declarations );
							}
						}
					}
				}
			}
		}

		// Output base styles.
		if (
			static::ROOT_BLOCK_SELECTOR === $selector
		) {
			$valid_display_modes = array( 'block', 'flex', 'grid' );
			foreach ( $layout_definitions as $layout_definition ) {
				$class_name       = sanitize_title( _wp_array_get( $layout_definition, array( 'className' ), false ) );
				$base_style_rules = _wp_array_get( $layout_definition, array( 'baseStyles' ), array() );

				if (
					! empty( $class_name ) &&
					! empty( $base_style_rules )
				) {
					// Output display mode. This requires special handling as `display` is not exposed in `safe_style_css_filter`.
					if (
						! empty( $layout_definition['displayMode'] ) &&
						is_string( $layout_definition['displayMode'] ) &&
						in_array( $layout_definition['displayMode'], $valid_display_modes, true )
					) {
						$layout_selector = sprintf(
							'%s .%s',
							$selector,
							$class_name
						);
						$block_rules    .= static::to_ruleset(
							$layout_selector,
							array(
								array(
									'name'  => 'display',
									'value' => $layout_definition['displayMode'],
								),
							)
						);
					}

					foreach ( $base_style_rules as $base_style_rule ) {
						$declarations = array();

						if (
							isset( $base_style_rule['selector'] ) &&
							preg_match( $layout_selector_pattern, $base_style_rule['selector'] ) &&
							! empty( $base_style_rule['rules'] )
						) {
							foreach ( $base_style_rule['rules'] as $css_property => $css_value ) {
								if ( static::is_safe_css_declaration( $css_property, $css_value ) ) {
									$declarations[] = array(
										'name'  => $css_property,
										'value' => $css_value,
									);
								}
							}

							$layout_selector = sprintf(
								'.%s%s',
								$class_name,
								$base_style_rule['selector']
							);
							$block_rules    .= static::to_ruleset( $layout_selector, $declarations );
						}
					}
				}
			}
		}
		return $block_rules;
	}
}
