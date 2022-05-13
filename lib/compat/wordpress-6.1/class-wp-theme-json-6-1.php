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
		'--wp--style--root--padding'        => array( 'spacing', 'padding' ),
		'--wp--style--root--padding-top'    => array( 'spacing', 'padding', 'top' ),
		'--wp--style--root--padding-right'  => array( 'spacing', 'padding', 'right' ),
		'--wp--style--root--padding-bottom' => array( 'spacing', 'padding', 'bottom' ),
		'--wp--style--root--padding-left'   => array( 'spacing', 'padding', 'left' ),
		'--wp--style--root--block-gap'      => array( 'spacing', 'blockGap' ),
		'--wp--style--block-gap'            => array( 'spacing', 'blockGap' ),
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
		'text-decoration'                   => array( 'typography', 'textDecoration' ),
		'text-transform'                    => array( 'typography', 'textTransform' ),
		'filter'                            => array( 'filter', 'duotone' ),
	);

	const ROOT_STYLE_CSS_VARIABLES = array(
		'padding'                => '--wp--style--root--padding',
		'padding-top'            => '--wp--style--root--padding-top',
		'padding-right'          => '--wp--style--root--padding-right',
		'padding-bottom'         => '--wp--style--root--padding-bottom',
		'padding-left'           => '--wp--style--root--padding-left',
		// This should be 'gap'.
		'--wp--style--block-gap' => '--wp--style--root--block-gap',
	);

	/**
	 * The valid properties under the styles key.
	 *
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
		'filter'     => array(
			'duotone' => null,
		),
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
	 * Given a selector and a declaration list,
	 * creates the corresponding ruleset.
	 *
	 * To help debugging, will add some space
	 * if SCRIPT_DEBUG is defined and true.
	 *
	 * @param string $selector CSS selector.
	 * @param array  $declarations List of declarations.
	 *
	 * @return string CSS ruleset.
	 */
	protected static function to_ruleset( $selector, $declarations ) {
		if ( empty( $declarations ) ) {
			return '';
		}

		$ruleset = '';

		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			$declaration_block = array_reduce(
				$declarations,
				function ( $carry, $element ) use ( $selector ) {
					if ( static::ROOT_BLOCK_SELECTOR === $selector ) {
						if ( array_key_exists( $element['name'], static::ROOT_STYLE_CSS_VARIABLES ) ) {
							return $carry .= "\t" . $element['name'] . ': var(' . static::ROOT_STYLE_CSS_VARIABLES[ $element['name'] ] . ");\n";
						}
					} elseif ( str_starts_with( $element['name'], '--wp--style--root--' ) ) {
						return $carry;
					}
					return $carry .= "\t" . $element['name'] . ': ' . $element['value'] . ";\n";
					},
				''
			);
			$ruleset          .= $selector . " {\n" . $declaration_block . "}\n";
		} else {
			$declaration_block = array_reduce(
				$declarations,
				function ( $carry, $element ) use ( $selector ) {
					if (
						array_key_exists( $element['name'], static::ROOT_STYLE_CSS_VARIABLES )
					) {
						if ( static::ROOT_BLOCK_SELECTOR === $selector ) {
							return $carry .= $element['name'] . ': var(' . static::ROOT_STYLE_CSS_VARIABLES[ $element['name'] ] . ');';
						}
						return $carry;
					}
					return $carry .= $element['name'] . ': ' . $element['value'] . ';'; },
				''
			);
			$ruleset          .= $selector . '{' . $declaration_block . '}';
		}

		return $ruleset;
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

			$node         = _wp_array_get( $this->theme_json, $metadata['path'], array() );
			$selector     = $metadata['selector'];
			$settings     = _wp_array_get( $this->theme_json, array( 'settings' ) );
			$declarations = static::compute_style_properties( $node, $settings );

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
				$declarations[] = array(
					'name'  => 'margin',
					'value' => '0',
				);
			}

			// 2. Generate the rules that use the general selector.
			$block_rules .= static::to_ruleset( $selector, $declarations );

			// 3. Generate the rules that use the duotone selector.
			if ( isset( $metadata['duotone'] ) && ! empty( $declarations_duotone ) ) {
				$selector_duotone = static::scope_selector( $metadata['selector'], $metadata['duotone'] );
				$block_rules     .= static::to_ruleset( $selector_duotone, $declarations_duotone );
			}

			if ( static::ROOT_BLOCK_SELECTOR === $selector ) {
				$block_rules .= '.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }';
				$block_rules .= '.wp-site-blocks > .alignright { float: right; margin-left: 2em; }';
				$block_rules .= '.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

				$has_block_gap_support = _wp_array_get( $this->theme_json, array( 'settings', 'spacing', 'blockGap' ) ) !== null;
				if ( $has_block_gap_support ) {
					$block_rules .= '.wp-site-blocks > * { margin-block-start: 0; margin-block-end: 0; }';
					$block_rules .= '.wp-site-blocks > * + * { margin-block-start: var( --wp--style--block-gap ); }';
				}
			}
		}

		return $block_rules;
	}

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
}
