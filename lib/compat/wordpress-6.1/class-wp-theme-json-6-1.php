<?php
/**
 * WP_Theme_JSON_Gutenberg class
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
class WP_Theme_JSON_6_1 extends WP_Theme_JSON_6_0 {
	/**
	 * Metadata for style properties.
	 *
	 * Each element is a direct mapping from the CSS property name to the
	 * path to the value in theme.json & block attributes.
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
		'--wp--style--block-gap'            => array( 'spacing', 'blockGap' ),
		'text-decoration'                   => array( 'typography', 'textDecoration' ),
		'text-transform'                    => array( 'typography', 'textTransform' ),
		'filter'                            => array( 'filter', 'duotone' ),
	);

	/**
	 * The valid properties under the settings key.
	 *
	 * @var array
	 */
	const VALID_SETTINGS = array(
		'appearanceTools'  => null,
		'useRootVariables' => null,
		'border'           => array(
			'color'  => null,
			'radius' => null,
			'style'  => null,
			'width'  => null,
		),
		'color'            => array(
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
		'custom'           => null,
		'layout'           => array(
			'contentSize' => null,
			'wideSize'    => null,
		),
		'spacing'          => array(
			'blockGap' => null,
			'margin'   => null,
			'padding'  => null,
			'units'    => null,
		),
		'typography'       => array(
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
	 * Returns the metadata for each block.
	 *
	 * Example:
	 *
	 *     {
	 *       'core/paragraph': {
	 *         'selector': 'p',
	 *         'elements': {
	 *           'link' => 'link selector',
	 *           'etc'  => 'element selector'
	 *         }
	 *       },
	 *       'core/heading': {
	 *         'selector': 'h1',
	 *         'elements': {}
	 *       },
	 *       'core/image': {
	 *         'selector': '.wp-block-image',
	 *         'duotone': 'img',
	 *         'elements': {}
	 *       }
	 *     }
	 *
	 * @return array Block metadata.
	 */
	protected static function get_blocks_metadata() {
		if ( null !== static::$blocks_metadata ) {
			return static::$blocks_metadata;
		}

		static::$blocks_metadata = array();

		$registry = WP_Block_Type_Registry::get_instance();
		$blocks   = $registry->get_all_registered();
		foreach ( $blocks as $block_name => $block_type ) {
			if (
				isset( $block_type->supports['__experimentalSelector'] ) &&
				is_string( $block_type->supports['__experimentalSelector'] )
			) {
				static::$blocks_metadata[ $block_name ]['selector'] = $block_type->supports['__experimentalSelector'];
			} else {
				static::$blocks_metadata[ $block_name ]['selector'] = '.wp-block-' . str_replace( '/', '-', str_replace( 'core/', '', $block_name ) );
			}

			if (
				isset( $block_type->supports['color']['__experimentalDuotone'] ) &&
				is_string( $block_type->supports['color']['__experimentalDuotone'] )
			) {
				static::$blocks_metadata[ $block_name ]['duotone'] = $block_type->supports['color']['__experimentalDuotone'];
			}

			// Assign defaults, then overwrite those that the block sets by itself.
			// If the block selector is compounded, will append the element to each
			// individual block selector.
			$block_selectors = explode( ',', static::$blocks_metadata[ $block_name ]['selector'] );
			foreach ( static::ELEMENTS as $el_name => $el_selector ) {
				$element_selector = array();
				foreach ( $block_selectors as $selector ) {
					if ( $selector === $el_selector ) {
						$element_selector = array( $el_selector );
						break;
					}

					$element_selector[] = $selector . ' ' . $el_selector;
				}
				static::$blocks_metadata[ $block_name ]['elements'][ $el_name ] = implode( ',', $element_selector );
			}
		}

		return static::$blocks_metadata;
	}

	/**
	 * Converts each style section into a list of rulesets
	 * containing the block styles to be appended to the stylesheet.
	 *
	 * See glossary at https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax
	 *
	 * For each section this creates a new ruleset such as:
	 *
	 *   block-selector {
	 *     style-property-one: value;
	 *   }
	 *
	 * @param array $style_nodes Nodes with styles.
	 * @return string The new stylesheet.
	 */
	protected function get_block_classes( $style_nodes ) {
		$block_rules = '';

		foreach ( $style_nodes as $metadata ) {
			if ( null === $metadata['selector'] ) {
				continue;
			}

			$use_root_vars = _wp_array_get( $this->theme_json, array( 'settings', 'useRootVariables' ), false );
			$node          = _wp_array_get( $this->theme_json, $metadata['path'], array() );
			$selector      = $metadata['selector'];
			$settings      = _wp_array_get( $this->theme_json, array( 'settings' ) );
			$declarations  = static::compute_style_properties( $node, $settings, null, $selector, $use_root_vars );

			// 1. Separate the ones who use the general selector
			// and the ones who use the duotone selector.
			$declarations_duotone = array();
			foreach ( $declarations as $index => $declaration ) {
				if ( 'filter' === $declaration['name'] ) {
					unset( $declarations[ $index ] );
					$declarations_duotone[] = $declaration;
				}
			}

			/*
			 * Reset default browser margin on the root body element.
			 * This is set on the root selector **before** generating the ruleset
			 * from the `theme.json`. This is to ensure that if the `theme.json` declares
			 * `margin` in its `spacing` declaration for the `body` element then these
			 * user-generated values take precedence in the CSS cascade.
			 * @link https://github.com/WordPress/gutenberg/issues/36147.
			 */
			if ( static::ROOT_BLOCK_SELECTOR === $selector ) {
				$block_rules .= 'body { margin: 0; }';
			}

			// 2. Generate the rules that use the general selector.
			$block_rules .= static::to_ruleset( $selector, $declarations );

			// 3. Generate the rules that use the duotone selector.
			if ( isset( $metadata['duotone'] ) && ! empty( $declarations_duotone ) ) {
				$selector_duotone = static::scope_selector( $metadata['selector'], $metadata['duotone'] );
				$block_rules     .= static::to_ruleset( $selector_duotone, $declarations_duotone );
			}

			// 4. Generate additional rules for the root block.
			$block_rules .= static::additional_root_selector_rules( $selector, $this->theme_json, $use_root_vars );
		}

		return $block_rules;
	}

	/**
	 * Generate additional rules for the root selector
	 *
	 * @param string $selector The selector to generate rules for.
	 * @param object $theme_json A copy of $this->theme_json.
	 * @param bool   $use_root_vars whether or not the theme has opted in to root padding variables.
	 * @return string The rules for the root selector.
	 */
	protected static function additional_root_selector_rules( $selector, $theme_json, $use_root_vars ) {
		$block_rules = '';
		if ( static::ROOT_BLOCK_SELECTOR === $selector ) {
			if ( $use_root_vars ) {
				// These rules are duplicated in use-global-styles-output.js.
				$block_rules .= '.wp-site-blocks { padding-top: var(--wp--style--root--padding-top); padding-bottom: var(--wp--style--root--padding-bottom); }';

				$block_rules .= '.wp-site-blocks,
				.wp-block-group.alignfull,
				.wp-block-group.has-background,
				.wp-block-columns.alignfull.has-background,
				.wp-block-cover.alignfull
				{ padding-right: var(--wp--style--root--padding-right); padding-left: var(--wp--style--root--padding-left); }';

				$block_rules .= '.wp-site-blocks .alignfull { margin-right: calc(var(--wp--style--root--padding-right) * -1); margin-left: calc(var(--wp--style--root--padding-left) * -1); width: unset; }';

				// Alignfull blocks in the block editor that are direct children of post content should also get negative margins.
				if ( is_callable( 'get_current_screen' ) && get_current_screen()->is_block_editor() ) {
					$block_rules .= 'body > .is-root-container,
					.edit-post-visual-editor__post-title-wrapper,
					.is-root-container .wp-block.alignfull > .wp-block-group,
					.is-root-container .wp-block.alignfull > .wp-block-columns.has-background,
					.is-root-container .wp-block.alignfull > .wp-block-cover
					{ padding-right: var(--wp--style--root--padding-right); padding-left: var(--wp--style--root--padding-left); }';

					$block_rules .= '.is-root-container .wp-block.alignfull { margin-right: calc(var(--wp--style--root--padding-right) * -1); margin-left: calc(var(--wp--style--root--padding-left) * -1); max-width: unset; width: unset; }';
				}
			}

			$block_rules .= '.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }';
			$block_rules .= '.wp-site-blocks > .alignright { float: right; margin-left: 2em; }';
			$block_rules .= '.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

			$has_block_gap_support = _wp_array_get( $theme_json, array( 'settings', 'spacing', 'blockGap' ) ) !== null;
			if ( $has_block_gap_support ) {
				$block_rules .= '.wp-site-blocks > * { margin-block-start: 0; margin-block-end: 0; }';
				$block_rules .= '.wp-site-blocks > * + * { margin-block-start: var( --wp--style--block-gap ); }';
			}
		}

		return $block_rules;
	}

	/**
	 * Given a styles array, it extracts the style properties
	 * and adds them to the $declarations array following the format:
	 *
	 * ```php
	 * array(
	 *   'name'  => 'property_name',
	 *   'value' => 'property_value,
	 * )
	 * ```
	 *
	 * @param array   $styles Styles to process.
	 * @param array   $settings Theme settings.
	 * @param array   $properties Properties metadata.
	 * @param string  $selector Selector for styles.
	 * @param boolean $use_root_vars Whether to use root variables.
	 * @return array Returns the modified $declarations.
	 */
	protected static function compute_style_properties( $styles, $settings = array(), $properties = null, $selector = null, $use_root_vars = null ) {
		if ( null === $properties ) {
			$properties = static::PROPERTIES_METADATA;
		}

		$declarations             = array();
		$root_variable_duplicates = array();

		if ( empty( $styles ) ) {
			return $declarations;
		}

		foreach ( $properties as $css_property => $value_path ) {
			$value = static::get_property_value( $styles, $value_path );

			if ( strpos( $css_property, '--wp--style--root--' ) === 0 && ( ! $use_root_vars || static::ROOT_BLOCK_SELECTOR !== $selector ) ) {
				continue;
			}

			if ( strpos( $css_property, '--wp--style--root--' ) === 0 && $use_root_vars ) {
				$root_variable_duplicates[] = substr( $css_property, strlen( '--wp--style--root--' ) );
			}

			// Root padding requires special logic to split shorthand values.
			if ( '--wp--style--root--padding' === $css_property && is_string( $value ) ) {
				if ( empty( $value ) ) {
					$value = '0 0 0 0';
				}

				$shorthand_top    = '0';
				$shorthand_right  = '0';
				$shorthand_bottom = '0';
				$shorthand_left   = '0';

				$separate_values = explode( ' ', $value );

				switch ( count( $separate_values ) ) {
					case 1:
						$shorthand_top    = $separate_values[0];
						$shorthand_right  = $separate_values[0];
						$shorthand_bottom = $separate_values[0];
						$shorthand_left   = $separate_values[0];
						break;
					case 2:
						$shorthand_top    = $separate_values[0];
						$shorthand_right  = $separate_values[1];
						$shorthand_bottom = $separate_values[0];
						$shorthand_left   = $separate_values[1];
						break;
					case 3:
						$shorthand_top    = $separate_values[0];
						$shorthand_right  = $separate_values[1];
						$shorthand_bottom = $separate_values[2];
						$shorthand_left   = $separate_values[1];
						break;
					case 4:
						$shorthand_top    = $separate_values[0];
						$shorthand_right  = $separate_values[1];
						$shorthand_bottom = $separate_values[2];
						$shorthand_left   = $separate_values[3];
						break;
				}

				$all_properties = array(
					array(
						'name'  => '--wp--style--root--padding-top',
						'value' => $shorthand_top,
					),
					array(
						'name'  => '--wp--style--root--padding-right',
						'value' => $shorthand_right,
					),
					array(
						'name'  => '--wp--style--root--padding-bottom',
						'value' => $shorthand_bottom,
					),
					array(
						'name'  => '--wp--style--root--padding-left',
						'value' => $shorthand_left,
					),
				);

				$declarations = array_merge( $declarations, $all_properties );
				continue;
			}

			// Look up protected properties, keyed by value path.
			// Skip protected properties that are explicitly set to `null`.
			if ( is_array( $value_path ) ) {
				$path_string = implode( '.', $value_path );
				if (
					array_key_exists( $path_string, static::PROTECTED_PROPERTIES ) &&
					_wp_array_get( $settings, static::PROTECTED_PROPERTIES[ $path_string ], null ) === null
				) {
					continue;
				}
			}

			// Skip if empty and not "0" or value represents array of longhand values.
			$has_missing_value = empty( $value ) && ! is_numeric( $value );
			if ( $has_missing_value || is_array( $value ) ) {
				continue;
			}

			$declarations[] = array(
				'name'  => $css_property,
				'value' => $value,
			);
		}

		// If a variable value is added to the root, the corresponding property should be removed.
		foreach ( $root_variable_duplicates as $duplicate ) {
			$discard = array_search( $duplicate, array_column( $declarations, 'name' ), true );
			if ( false !== $discard ) {
				array_splice( $declarations, $discard, 1 );
			}
		}

		return $declarations;
	}
}
