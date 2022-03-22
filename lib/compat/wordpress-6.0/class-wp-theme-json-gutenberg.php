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
class WP_Theme_JSON_Gutenberg extends WP_Theme_JSON_5_9 {

	/**
	 * The top-level keys a theme.json can have.
	 *
	 * @var string[]
	 */
	const VALID_TOP_LEVEL_KEYS = array(
		'customTemplates',
		'patterns',
		'settings',
		'styles',
		'templateParts',
		'version',
	);

	/**
	 * Returns the current theme's wanted patterns(slugs) to be
	 * registered from Pattern Directory.
	 *
	 * @return array
	 */
	public function get_patterns() {
		if ( isset( $this->theme_json['patterns'] ) && is_array( $this->theme_json['patterns'] ) ) {
			return $this->theme_json['patterns'];
		}
		return array();
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
				$block_rules .= 'body { margin: 0; }';
			}

			// 2. Generate the rules that use the general selector.
			$block_rules .= static::to_ruleset( $selector, $declarations );

			// 3. Generate the rules that use the duotone selector.
			if ( isset( $metadata['duotone'] ) && ! empty( $declarations_duotone ) ) {
				$selector_duotone = static::scope_selector( $metadata['selector'], $metadata['duotone'] );
				$block_rules     .= static::to_ruleset( $selector_duotone, $declarations_duotone );
			}

			if ( self::ROOT_BLOCK_SELECTOR === $selector ) {
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
	 * Returns a valid theme.json for a theme.
	 * Essentially, it flattens the preset data.
	 *
	 * @return array
	 */
	public function get_data() {
		$flattened_theme_json = $this->theme_json;
		$nodes                = static::get_setting_nodes( $this->theme_json );
		foreach ( $nodes as $node ) {
			foreach ( static::PRESETS_METADATA as $preset_metadata ) {
				$path   = array_merge( $node['path'], $preset_metadata['path'] );
				$preset = _wp_array_get( $flattened_theme_json, $path, null );
				if ( null === $preset ) {
					continue;
				}

				$items = array();
				if ( isset( $preset['theme'] ) ) {
					foreach ( $preset['theme'] as $item ) {
						$slug = $item['slug'];
						unset( $item['slug'] );
						$items[ $slug ] = $item;
					}
				}
				if ( isset( $preset['custom'] ) ) {
					foreach ( $preset['custom'] as $item ) {
						$slug = $item['slug'];
						unset( $item['slug'] );
						$items[ $slug ] = $item;
					}
				}
				$flattened_preset = array();
				foreach ( $items as $slug => $value ) {
					$flattened_preset[] = array_merge( array( 'slug' => $slug ), $value );
				}
				_wp_array_set( $flattened_theme_json, $path, $flattened_preset );
			}
		}

		return $flattened_theme_json;
	}

	/**
	 * Merge new incoming data.
	 *
	 * @since 5.8.0
	 * @since 5.9.0 Duotone preset also has origins.
	 * @since 6.0.0 Calls functional_merge internally
	 *
	 * @param WP_Theme_JSON $incoming Data to merge.
	 */
	public function merge( $incoming ) {
		$this->theme_json = static::functional_merge( $this->theme_json, $incoming->get_raw_data() );
	}

	/**
	 * Merge two theme.json data structures
	 *
	 * @since 6.0.0
	 *
	 * @param array $base Data to merge onto.
	 * @param array $replacements Data to add onto $base
	 * @return array The result of the merge
	 */
	public static function functional_merge( $base, $replacements ) {
		$merged_data = array_replace_recursive( $base, $replacements );

		/*
		 * The array_replace_recursive algorithm merges at the leaf level,
		 * but we don't want leaf arrays to be merged, so we overwrite it.
		 *
		 * For leaf values that are sequential arrays it will use the numeric indexes for replacement.
		 * We rather replace the existing with the incoming value, if it exists.
		 * This is the case of spacing.units.
		 *
		 * For leaf values that are associative arrays it will merge them as expected.
		 * This is also not the behavior we want for the current associative arrays (presets).
		 * We rather replace the existing with the incoming value, if it exists.
		 * This happens, for example, when we merge data from theme.json upon existing
		 * theme supports or when we merge anything coming from the same source twice.
		 * This is the case of color.palette, color.gradients, color.duotone,
		 * typography.fontSizes, or typography.fontFamilies.
		 *
		 * Additionally, for some preset types, we also want to make sure the
		 * values they introduce don't conflict with default values. We do so
		 * by checking the incoming slugs for theme presets and compare them
		 * with the equivalent default presets: if a slug is present as a default
		 * we remove it from the theme presets.
		 */
		$nodes        = static::get_setting_nodes( $replacements );
		$slugs_global = static::get_default_slugs( $base, array( 'settings' ) );
		foreach ( $nodes as $node ) {
			$slugs_node = static::get_default_slugs( $base, $node['path'] );
			$slugs      = array_merge_recursive( $slugs_global, $slugs_node );

			// Replace the spacing.units.
			$path    = array_merge( $node['path'], array( 'spacing', 'units' ) );
			$content = _wp_array_get( $replacements, $path, null );
			if ( isset( $content ) ) {
				_wp_array_set( $merged_data, $path, $content );
			}

			// Replace the presets.
			foreach ( static::PRESETS_METADATA as $preset ) {
				$override_preset = ! static::get_metadata_boolean( $base['settings'], $preset['prevent_override'], true );

				foreach ( static::VALID_ORIGINS as $origin ) {
					$base_path = array_merge( $node['path'], $preset['path'] );
					$path      = array_merge( $base_path, array( $origin ) );
					$content   = _wp_array_get( $replacements, $path, null );
					if ( ! isset( $content ) ) {
						continue;
					}

					if ( 'theme' === $origin && $preset['use_default_names'] ) {
						foreach ( $content as &$item ) {
							if ( ! array_key_exists( 'name', $item ) ) {
								$name = static::get_name_from_defaults( $item['slug'], $base_path );
								if ( null !== $name ) {
									$item['name'] = $name;
								}
							}
						}
					}

					if (
						( 'theme' !== $origin ) ||
						( 'theme' === $origin && $override_preset )
					) {
						_wp_array_set( $base, $path, $content );
					} else {
						$slugs_for_preset = _wp_array_get( $slugs, $preset['path'], array() );
						$content          = static::filter_slugs( $content, $slugs_for_preset );
						_wp_array_set( $base, $path, $content );
					}
				}
			}
		}

		return $merged_data;
	}

}
