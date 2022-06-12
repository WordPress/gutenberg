<?php
/**
 * WP_Theme_JSON_6_1 class
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
	const __EXPERIMENTAL_ELEMENT_BUTTON_CLASS_NAME = 'wp-element-button';

	const ELEMENTS = array(
		'link'   => 'a',
		'h1'     => 'h1',
		'h2'     => 'h2',
		'h3'     => 'h3',
		'h4'     => 'h4',
		'h5'     => 'h5',
		'h6'     => 'h6',
		'button' => '.wp-element-button, .wp-block-button__link', // We have the .wp-block-button__link class so that this will target older buttons that have been serialized.
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
	 * Builds metadata for the style nodes, which returns in the form of:
	 *
	 *     [
	 *       [
	 *         'path'     => [ 'path', 'to', 'some', 'node' ],
	 *         'selector' => 'CSS selector for some node',
	 *         'duotone'  => 'CSS selector for duotone for some node'
	 *       ],
	 *       [
	 *         'path'     => ['path', 'to', 'other', 'node' ],
	 *         'selector' => 'CSS selector for other node',
	 *         'duotone'  => null
	 *       ],
	 *     ]
	 *
	 * @since 5.8.0
	 *
	 * @param array $theme_json The tree to extract style nodes from.
	 * @param array $selectors  List of selectors per block.
	 * @return array
	 */
	protected static function get_style_nodes( $theme_json, $selectors = array() ) {
		$nodes = array();
		if ( ! isset( $theme_json['styles'] ) ) {
			return $nodes;
		}

		// Top-level.
		$nodes[] = array(
			'path'     => array( 'styles' ),
			'selector' => static::ROOT_BLOCK_SELECTOR,
		);

		if ( isset( $theme_json['styles']['elements'] ) ) {
			foreach ( $theme_json['styles']['elements'] as $element => $node ) {
				$nodes[] = array(
					'path'     => array( 'styles', 'elements', $element ),
					'selector' => static::ELEMENTS[ $element ],
				);
			}
		}

		// Blocks.
		if ( ! isset( $theme_json['styles']['blocks'] ) ) {
			return $nodes;
		}

		$nodes = array_merge( $nodes, static::get_block_nodes( $theme_json, $selectors ) );

		// This filter allows us to modify the output of WP_Theme_JSON so that we can do things like loading block CSS independently.
		return apply_filters( 'gutenberg_get_style_nodes', $nodes );
	}

	/**
	 * A public helper to get the block nodes from a theme.json file.
	 *
	 * @return array The block nodes in theme.json.
	 */
	public function get_styles_block_nodes() {
		return static::get_block_nodes( $this->theme_json );
	}

	/**
	 * An internal method to get the block nodes from a theme.json file.
	 *
	 * @param array $theme_json The theme.json converted to an array.
	 * @param array $selectors  Optional list of selectors per block.
	 *
	 * @return array The block nodes in theme.json.
	 */
	private static function get_block_nodes( $theme_json, $selectors = array() ) {
		$selectors = empty( $selectors ) ? static::get_blocks_metadata() : $selectors;
		$nodes     = array();
		if ( ! isset( $theme_json['styles'] ) ) {
			return $nodes;
		}

		// Blocks.
		if ( ! isset( $theme_json['styles']['blocks'] ) ) {
			return $nodes;
		}

		foreach ( $theme_json['styles']['blocks'] as $name => $node ) {
			$selector = null;
			if ( isset( $selectors[ $name ]['selector'] ) ) {
				$selector = $selectors[ $name ]['selector'];
			}

			$duotone_selector = null;
			if ( isset( $selectors[ $name ]['duotone'] ) ) {
				$duotone_selector = $selectors[ $name ]['duotone'];
			}

			$nodes[] = array(
				'name'     => $name,
				'path'     => array( 'styles', 'blocks', $name ),
				'selector' => $selector,
				'duotone'  => $duotone_selector,
			);

			if ( isset( $theme_json['styles']['blocks'][ $name ]['elements'] ) ) {
				foreach ( $theme_json['styles']['blocks'][ $name ]['elements'] as $element => $node ) {
					$nodes[] = array(
						'path'     => array( 'styles', 'blocks', $name, 'elements', $element ),
						'selector' => $selectors[ $name ]['elements'][ $element ],
					);
				}
			}
		}

		return $nodes;
	}

	/**
	 * Gets the CSS rules for a particular block from theme.json.
	 *
	 * @param array $block_metadata Metadata about the block to get styles for.
	 *
	 * @return string Styles for the block.
	 */
	public function get_styles_for_block( $block_metadata ) {
		$node         = _wp_array_get( $this->theme_json, $block_metadata['path'], array() );
		$selector     = $block_metadata['selector'];
		$settings     = _wp_array_get( $this->theme_json, array( 'settings' ) );
		$declarations = static::compute_style_properties( $node, $settings );
		$block_rules  = '';

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
		if ( isset( $block_metadata['duotone'] ) && ! empty( $declarations_duotone ) ) {
			$selector_duotone = static::scope_selector( $block_metadata['selector'], $block_metadata['duotone'] );
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

		return $block_rules;
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
			$block_rules .= static::get_styles_for_block( $metadata );
		}

		return $block_rules;
	}
}
