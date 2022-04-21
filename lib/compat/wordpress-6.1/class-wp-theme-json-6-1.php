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
	/**
	 * Returns the stylesheet that results of processing
	 * the theme.json structure this object represents.
	 *
	 * @param array $types    Types of styles to load. Will load all by default. It accepts:
	 *                         'variables': only the CSS Custom Properties for presets & custom ones.
	 *                         'styles': only the styles section in theme.json.
	 *                         'presets': only the classes for the presets.
	 * @param array $origins A list of origins to include. By default it includes VALID_ORIGINS.
	 * @return string Stylesheet.
	 */
	public function get_stylesheet( $types = array( 'variables', 'styles', 'presets' ), $origins = null ) {
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
		$separate_block_assets = wp_should_load_separate_core_block_assets();
		$style_nodes_without_blocks = static::get_style_nodes( $this->theme_json, $blocks_metadata, $separate_block_assets );
		$setting_nodes   = static::get_setting_nodes( $this->theme_json, $blocks_metadata );

		$stylesheet = '';

		if ( in_array( 'variables', $types, true ) ) {
			$stylesheet .= $this->get_css_variables( $setting_nodes, $origins );
		}

		if ( in_array( 'styles', $types, true ) ) {
			$stylesheet .= $this->get_block_classes( $style_nodes_without_blocks );
		}

		if ( in_array( 'presets', $types, true ) ) {
			$stylesheet .= $this->get_preset_classes( $setting_nodes, $origins );
		}

		return $stylesheet;
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
	 * @param array $theme_json     The tree to extract style nodes from.
	 * @param array $selectors      List of selectors per block.
	 * @param array $exclude_blocks Exclude blocks from the style nodes.
	 * @return array
	 */
	protected static function get_style_nodes( $theme_json, $selectors = array(), $exclude_blocks = false ) {
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

		if ( $exclude_blocks ) {
			return $nodes;
		}

		// Blocks.
		if ( ! isset( $theme_json['styles']['blocks'] ) ) {
			return $nodes;
		}

		// TODO - test this ( turn off separate assets i think)
		$nodes = array_merge( $nodes, static::get_block_nodes_private( $theme_json ) );

		return $nodes;
	}

	// TODO - this is duplicated from get_style_nodes.
	public function get_block_nodes() {
		return static::get_block_nodes_private( $this->theme_json );
	}

	private static function get_block_nodes_private( $theme_json ) {
		$selectors = static::get_blocks_metadata();
		$nodes = array();
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
	 * @param array $block_metadata Meta data about the block to get styles for.
	 *
	 * @return array Styles for the block.
	 */
	public function get_styles_for_block( $block_metadata ) {
		$node         = _wp_array_get( $this->theme_json, $block_metadata['path'], array() );
		$selector     = $block_metadata['selector'];
		$settings     = _wp_array_get( $this->theme_json, array( 'settings' ) );
		$declarations = static::compute_style_properties( $node, $settings );
		$block_rules = static::to_ruleset( $selector, $declarations );
		return $block_rules;
	}
}
