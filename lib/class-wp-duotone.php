<?php
/**
 * WP_Duotone class
 *
 * @package gutenberg
 * @since 6.3.0
 */

/**
 * Manages which duotone filters need to be output on the page.
 *
 * @access public
 */
class WP_Duotone {
	/**
	 * An array of Duotone presets from global, theme, and custom styles.
	 *
	 * Example:
	 * [
	 *      'blue-orange' =>
	 *          [
	 *              'slug'  => 'blue-orange',
	 *              'colors' => [ '#0000ff', '#ffcc00' ],
	 *          ]
	 *      ],
	 *      …
	 * ]
	 *
	 * @since 6.3.0
	 * @var array
	 */
	static $global_styles_presets = array();

	/**
	 * An array of block names from global, theme, and custom styles that have duotone presets. We'll use this to quickly
	 * check if a block being rendered needs to have duotone applied, and which duotone preset to use.
	 *
	 * Example:
	 *  [
	 *      'core/featured-image' => 'blue-orange',
	 *       …
	 *  ]
	 *
	 * @since 6.3.0
	 * @var array
	 */
	static $global_styles_block_names = array();

	/**
	 * An array of Duotone SVG and CSS ouput needed for the frontend duotone rendering based on what is
	 * being ouptput on the page. Organized by a slug of the preset/color group and the information needed
	 * to generate the SVG and CSS at render.
	 *
	 * Example:
	 *  [
	 *      'blue-orange' => [
	 *          'slug'  => 'blue-orange',
	 *          'colors' => [ '#0000ff', '#ffcc00' ],
	 *      ],
	 *      'wp-duotone-000000-ffffff-2' => [
	 *          'slug' => 'wp-duotone-000000-ffffff-2',
	 *          'colors' => [ '#000000', '#ffffff' ],
	 *      ],
	 * ]
	 *
	 * @since 6.3.0
	 * @var array
	 */
	static $output = array();

	/**
	 * Get all possible duotone presets from global and theme styles and store as slug => [ colors array ]
	 * We only want to process this one time. On block render we'll access and output only the needed presets for that page.
	 */
	static function set_global_styles_presets() {
		// Get the per block settings from the theme.json.
		$tree              = gutenberg_get_global_settings();
		$presets_by_origin = _wp_array_get( $tree, array( 'color', 'duotone' ), array() );

		foreach ( $presets_by_origin as $presets ) {
			foreach ( $presets as $preset ) {
				self::$global_styles_presets[ _wp_to_kebab_case( $preset['slug'] ) ] = array(
					'slug'   => $preset['slug'],
					'colors' => $preset['colors'],
				);
			}
		}
	}

	/**
	 * Scrape all block names from global styles and store in WP_Duotone::$global_styles_block_names
	 */
	static function set_global_style_block_names() {
		// Get the per block settings from the theme.json.
		$tree        = WP_Theme_JSON_Resolver::get_merged_data();
		$block_nodes = $tree->get_styles_block_nodes();
		$theme_json  = $tree->get_raw_data();

		foreach ( $block_nodes as $block_node ) {
			// This block definition doesn't include any duotone settings. Skip it.
			if ( empty( $block_node['duotone'] ) ) {
				continue;
			}

			// Value looks like this: 'var(--wp--preset--duotone--blue-orange)' or 'var:preset|duotone|default-filter'.
			$duotone_attr_path = array_merge( $block_node['path'], array( 'filter', 'duotone' ) );
			$duotone_attr      = _wp_array_get( $theme_json, $duotone_attr_path, array() );

			if ( empty( $duotone_attr ) ) {
				continue;
			}
			// If it has a duotone filter preset, save the block name and the preset slug.
			$slug = self::gutenberg_get_slug_from_attr( $duotone_attr );

			if ( $slug && $slug !== $duotone_attr ) {
				self::$global_styles_block_names[ $block_node['name'] ] = $slug;
			}
		}
	}

	/**
	 * Take the inline CSS duotone variable from a block and return the slug. Handles styles slugs like:
	 * var:preset|duotone|default-filter
	 * var(--wp--preset--duotone--blue-orange)
	 *
	 * @param string $duotone_attr The duotone attribute from a block.
	 * @return string The slug of the duotone preset or an empty string if no slug is found.
	 */
	static function gutenberg_get_slug_from_attr( $duotone_attr ) {
		// Uses Branch Reset Groups `(?|…)` to return one capture group.
		preg_match( '/(?|var:preset\|duotone\|(\S+)|var\(--wp--preset--duotone--(\S+)\))/', $duotone_attr, $matches );

		return ! empty( $matches[1] ) ? $matches[1] : '';
	}

	/**
	 * Check if we have a valid duotone preset.
	 *
	 * @param string $duotone_attr The duotone attribute from a block.
	 * @return bool True if the duotone preset present and valid.
	 */
	static function is_preset( $duotone_attr ) {
		$slug = WP_Duotone::gutenberg_get_slug_from_attr( $duotone_attr );

		return array_key_exists( $slug, WP_Duotone::$global_styles_presets );
	}
}

add_action( 'wp_loaded', array( 'WP_Duotone', 'set_global_styles_presets' ), 10 );
add_action( 'wp_loaded', array( 'WP_Duotone', 'set_global_style_block_names' ), 10 );
