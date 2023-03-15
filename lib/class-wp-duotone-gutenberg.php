<?php
/**
 * WP_Duotone_Gutenberg class
 *
 * @package gutenberg
 * @since 6.3.0
 */

/**
 * Manages which duotone filters need to be output on the page.
 *
 * @access public
 */
class WP_Duotone_Gutenberg {
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


	const CSS_VAR_PREFIX = '--wp--preset--duotone--';

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
	 * Scrape all block names from global styles and store in WP_Duotone_Gutenberg::$global_styles_block_names
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
		$slug = WP_Duotone_Gutenberg::gutenberg_get_slug_from_attr( $duotone_attr );

		return array_key_exists( $slug, WP_Duotone_Gutenberg::$global_styles_presets );
	}

	/**
	 * Get the CSS variable name for a duotone preset.
	 *
	 * @param string $slug The slug of the duotone preset.
	 * @return string The CSS variable name.
	 */
	static function get_css_custom_property_name( $slug ) {
		return self::CSS_VAR_PREFIX . $slug;
	}

	static function get_css_var( $slug ) {
		return 'var(' . self::get_css_custom_property_name( $slug ) . ')';
	}

	/**
	 * Get the CSS declaration for a duotone preset.
	 * Example: --wp--preset--duotone--blue-orange: url('#wp-duotone-blue-orange');
	 *
	 * @param array $filter_data The duotone data for presets and custom filters.
	 * @return string The CSS declaration.
	 */
	static function get_css_custom_property_declaration( $filter_data ) {
		$declaration_value                = gutenberg_get_duotone_filter_property( $filter_data );
		$duotone_preset_css_property_name = WP_Duotone_Gutenberg::get_css_custom_property_name( $filter_data['slug'] );
		return $duotone_preset_css_property_name . ': ' . $declaration_value . ';';
	}

	/**
	 * Safari renders elements incorrectly on first paint when the SVG filter comes after the content that it is filtering,
	 * so we force a repaint with a WebKit hack which solves the issue.
	 *
	 * @param string $selector The selector to apply the hack for.
	 * @return string The <script> to rerender the image.
	 */
	static function safari_rerender_hack( $selector ) {
		/*
		* Simply accessing el.offsetHeight flushes layout and style
		* changes in WebKit without having to wait for setTimeout.
		*/
		printf(
			'<script>( function() { var el = document.querySelector( %s ); var display = el.style.display; el.style.display = "none"; el.offsetHeight; el.style.display = display; } )();</script>',
			wp_json_encode( $selector )
		);
	}

	/**
	 * Outputs all necessary SVG for duotone filters, CSS for classic themes, and safari rerendering hack
	 */
	static function output_footer_assets() {
		foreach ( WP_Duotone_Gutenberg::$output as $filter_data ) {

			// SVG will be output on the page later.
			$filter_svg = gutenberg_get_duotone_filter_svg( $filter_data );

			echo $filter_svg;

			// This is for classic themes - in block themes, the CSS is added in the head via wp_add_inline_style in the wp_enqueue_scripts action.
			if ( ! wp_is_block_theme() ) {
				wp_add_inline_style( 'core-block-supports', 'body{' . WP_Duotone_Gutenberg::get_css_custom_property_declaration( $filter_data ) . '}' );
			}

			global $is_safari;
			if ( $is_safari ) {
				WP_Duotone_Gutenberg::safari_rerender_hack( $filter_data['selector'] );
			}
		}
	}

	/**
	 * Appends the used global style duotone filter CSS Vars to the inline global styles CSS
	 */
	static function output_global_styles() {

		if ( empty( WP_Duotone_Gutenberg::$output ) ) {
			return;
		}

		$duotone_css_vars = '';

		foreach ( WP_Duotone_Gutenberg::$output as $filter_data ) {
			if ( ! array_key_exists( $filter_data['slug'], WP_Duotone_Gutenberg::$global_styles_presets ) ) {
				continue;
			}

			$duotone_css_vars .= WP_Duotone_Gutenberg::get_css_custom_property_declaration( $filter_data );
		}

		if ( ! empty( $duotone_css_vars ) ) {
			wp_add_inline_style( 'global-styles', 'body{' . $duotone_css_vars . '}' );
		}
	}
}

add_action( 'wp_loaded', array( 'WP_Duotone_Gutenberg', 'set_global_styles_presets' ), 10 );
add_action( 'wp_loaded', array( 'WP_Duotone_Gutenberg', 'set_global_style_block_names' ), 10 );
add_action( 'wp_footer', array( 'WP_Duotone_Gutenberg', 'output_footer_assets' ), 10 );
add_action( 'wp_enqueue_scripts', array( 'WP_Duotone_Gutenberg', 'output_global_styles' ), 11 );
