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
	private static $global_styles_presets = array();

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
	private static $global_styles_block_names = array();

	/**
	 * An array of Duotone SVG and CSS output needed for the frontend duotone rendering based on what is
	 * being output on the page. Organized by a slug of the preset/color group and the information needed
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
	private static $output = array();

	/**
	 * Prefix used for generating and referencing duotone CSS custom properties.
	 */
	const CSS_VAR_PREFIX = '--wp--preset--duotone--';

	/**
	 * Get all possible duotone presets from global and theme styles and store as slug => [ colors array ]
	 * We only want to process this one time. On block render we'll access and output only the needed presets for that page.
	 */
	public static function set_global_styles_presets() {
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
	 * Scrape all block names from global styles and store in self::$global_styles_block_names
	 */
	public static function set_global_style_block_names() {
		// Get the per block settings from the theme.json.
		$tree        = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data();
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
	private static function gutenberg_get_slug_from_attr( $duotone_attr ) {
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
	private static function is_preset( $duotone_attr ) {
		$slug = self::gutenberg_get_slug_from_attr( $duotone_attr );

		return array_key_exists( $slug, self::$global_styles_presets );
	}

	/**
	 * Get the CSS variable name for a duotone preset.
	 *
	 * @param string $slug The slug of the duotone preset.
	 * @return string The CSS variable name.
	 */
	private static function get_css_custom_property_name( $slug ) {
		return self::CSS_VAR_PREFIX . $slug;
	}

	/**
	 * Get the CSS variable for a duotone preset.
	 *
	 * @param string $slug The slug of the duotone preset.
	 * @return string The CSS variable.
	 */
	private static function get_css_var( $slug ) {
		return 'var(' . self::get_css_custom_property_name( $slug ) . ')';
	}

	/**
	 * Get the CSS declaration for a duotone preset.
	 * Example: --wp--preset--duotone--blue-orange: url('#wp-duotone-blue-orange');
	 *
	 * @param array $filter_data The duotone data for presets and custom filters.
	 * @return string The CSS declaration.
	 */
	private static function get_css_custom_property_declaration( $filter_data ) {
		$declaration_value                = gutenberg_get_duotone_filter_property( $filter_data );
		$duotone_preset_css_property_name = self::get_css_custom_property_name( $filter_data['slug'] );
		return $duotone_preset_css_property_name . ': ' . $declaration_value . ';';
	}

	/**
	 * Outputs all necessary SVG for duotone filters, CSS for classic themes.
	 */
	public static function output_footer_assets() {
		foreach ( self::$output as $filter_data ) {

			// SVG will be output on the page later.
			$filter_svg = gutenberg_get_duotone_filter_svg( $filter_data );

			echo $filter_svg;

			// This is for classic themes - in block themes, the CSS is added in the head via wp_add_inline_style in the wp_enqueue_scripts action.
			if ( ! wp_is_block_theme() ) {
				wp_add_inline_style( 'core-block-supports', 'body{' . self::get_css_custom_property_declaration( $filter_data ) . '}' );
			}
		}
	}

	/**
	 * Adds the duotone SVGs and CSS custom properties to the editor settings so
	 * they can be pulled in by the EditorStyles component in JS and rendered in
	 * the post editor.
	 *
	 * @param array $settings The block editor settings from the `block_editor_settings_all` filter.
	 * @return array The editor settings with duotone SVGs and CSS custom properties.
	 */
	public static function add_editor_settings( $settings ) {
		$duotone_svgs = '';
		$duotone_css  = 'body{';
		foreach ( self::$global_styles_presets as $filter_data ) {
			$duotone_svgs .= gutenberg_get_duotone_filter_svg( $filter_data );
			$duotone_css  .= self::get_css_custom_property_declaration( $filter_data );
		}
		$duotone_css .= '}';

		if ( ! isset( $settings['styles'] ) ) {
			$settings['styles'] = array();
		}

		$settings['styles'][] = array(
			'assets'         => $duotone_svgs,
			// The 'svgs' type is new in 6.3 and requires the corresponding JS changes in the EditorStyles component to work.
			'__unstableType' => 'svgs',
			'isGlobalStyles' => false,
		);

		$settings['styles'][] = array(
			'css'            => $duotone_css,
			// This must be set and must be something other than 'theme' or they will be stripped out in the post editor <Editor> component.
			'__unstableType' => 'presets',
			// These styles are no longer generated by global styles, so this must be false or they will be stripped out in gutenberg_get_block_editor_settings.
			'isGlobalStyles' => false,
		);

		return $settings;
	}

	/**
	 * Appends the used global style duotone filter CSS Vars to the inline global styles CSS
	 */
	public static function output_global_styles() {

		if ( empty( self::$output ) ) {
			return;
		}

		$duotone_css_vars = '';

		foreach ( self::$output as $filter_data ) {
			if ( ! array_key_exists( $filter_data['slug'], self::$global_styles_presets ) ) {
				continue;
			}

			$duotone_css_vars .= self::get_css_custom_property_declaration( $filter_data );
		}

		if ( ! empty( $duotone_css_vars ) ) {
			wp_add_inline_style( 'global-styles', 'body{' . $duotone_css_vars . '}' );
		}
	}

	/**
	 * Get the CSS selector for a block type.
	 *
	 * @param string $block_name The block name.
	 *
	 * @return string The CSS selector or null if there is no support.
	 */
	private static function get_selector( $block_name ) {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );

		if ( $block_type && property_exists( $block_type, 'supports' ) ) {
			// Backwards compatibility with `supports.color.__experimentalDuotone`
			// is provided via the `block_type_metadata_settings` filter. If
			// `supports.filter.duotone` has not been set and the experimental
			// property has been, the experimental property value is copied into
			// `supports.filter.duotone`.
			$duotone_support = _wp_array_get( $block_type->supports, array( 'filter', 'duotone' ), false );
			if ( ! $duotone_support ) {
				return null;
			}

			// If the experimental duotone support was set, that value is to be
			// treated as a selector and requires scoping.
			$experimental_duotone = _wp_array_get( $block_type->supports, array( 'color', '__experimentalDuotone' ), false );
			if ( $experimental_duotone ) {
				$root_selector = wp_get_block_css_selector( $block_type );
				return is_string( $experimental_duotone )
					? WP_Theme_JSON_Gutenberg::scope_selector( $root_selector, $experimental_duotone )
					: $root_selector;
			}

			// Regular filter.duotone support uses filter.duotone selectors with fallbacks.
			return wp_get_block_css_selector( $block_type, array( 'filter', 'duotone' ), true );
		}
	}

	/**
	 * Render out the duotone CSS styles and SVG.
	 *
	 * @param  string $block_content Rendered block content.
	 * @param  array  $block         Block object.
	 * @return string                Filtered block content.
	 */
	public static function render_duotone_support( $block_content, $block ) {
		$duotone_selector = self::get_selector( $block['blockName'] );

		// The block should have a duotone attribute or have duotone defined in its theme.json to be processed.
		$has_duotone_attribute     = isset( $block['attrs']['style']['color']['duotone'] );
		$has_global_styles_duotone = array_key_exists( $block['blockName'], self::$global_styles_block_names );

		if (
			empty( $block_content ) ||
			! $duotone_selector ||
			( ! $has_duotone_attribute && ! $has_global_styles_duotone )
		) {
			return $block_content;
		}

		// Generate the pieces needed for rendering a duotone to the page.
		if ( $has_duotone_attribute ) {

			// Possible values for duotone attribute:
			// 1. Array of colors - e.g. array('#000000', '#ffffff').
			// 2. Variable for an existing Duotone preset - e.g. 'var:preset|duotone|green-blue' or 'var(--wp--preset--duotone--green-blue)''
			// 3. A CSS string - e.g. 'unset' to remove globally applied duotone.

			$duotone_attr = $block['attrs']['style']['color']['duotone'];
			$is_preset    = is_string( $duotone_attr ) && self::is_preset( $duotone_attr );
			$is_css       = is_string( $duotone_attr ) && ! $is_preset;
			$is_custom    = is_array( $duotone_attr );

			if ( $is_preset ) {

				// Extract the slug from the preset variable string.
				$slug = self::gutenberg_get_slug_from_attr( $duotone_attr );

				// Utilize existing preset CSS custom property.
				$declaration_value = self::get_css_var( $slug );

				self::$output[ $slug ] = self::$global_styles_presets[ $slug ];

			} elseif ( $is_css ) {
				// Build a unique slug for the filter based on the CSS value.
				$slug = wp_unique_id( sanitize_key( $duotone_attr . '-' ) );

				// Pass through the CSS value.
				$declaration_value = $duotone_attr;
			} elseif ( $is_custom ) {
				// Build a unique slug for the filter based on the array of colors.
				$slug = wp_unique_id( sanitize_key( implode( '-', $duotone_attr ) . '-' ) );

				$filter_data = array(
					'slug'   => $slug,
					'colors' => $duotone_attr,
				);
				// Build a customized CSS filter property for unique slug.
				$declaration_value = gutenberg_get_duotone_filter_property( $filter_data );

				self::$output[ $slug ] = $filter_data;
			}
		} elseif ( $has_global_styles_duotone ) {
			$slug = self::$global_styles_block_names[ $block['blockName'] ];

			// Utilize existing preset CSS custom property.
			$declaration_value = self::get_css_var( $slug );

			self::$output[ $slug ] = self::$global_styles_presets[ $slug ];
		}

		// - Applied as a class attribute to the block wrapper.
		// - Used as a selector to apply the filter to the block.
		$filter_id = gutenberg_get_duotone_filter_id( array( 'slug' => $slug ) );

		// Build the CSS selectors to which the filter will be applied.
		$selectors = explode( ',', $duotone_selector );

		$selectors_scoped = array();
		foreach ( $selectors as $selector_part ) {
			// Assuming the selector part is a subclass selector (not a tag name)
			// so we can prepend the filter id class. If we want to support elements
			// such as `img` or namespaces, we'll need to add a case for that here.
			$selectors_scoped[] = '.' . $filter_id . trim( $selector_part );
		}

		$selector = implode( ', ', $selectors_scoped );

		// We only want to add the selector if we have it in the output already, essentially skipping 'unset'.
		if ( array_key_exists( $slug, self::$output ) ) {
			self::$output[ $slug ]['selector'] = $selector;
		}

		// Pass styles to the block-supports stylesheet via the style engine.
		// This ensures that Duotone styles are included in a single stylesheet,
		// avoiding multiple style tags or multiple stylesheets being output to
		// the site frontend.
		gutenberg_style_engine_get_stylesheet_from_css_rules(
			array(
				array(
					'selector'     => $selector,
					'declarations' => array(
						// !important is needed because these styles
						// render before global styles,
						// and they should be overriding the duotone
						// filters set by global styles.
						'filter' => $declaration_value . ' !important',
					),
				),
			),
			array(
				'context' => 'block-supports',
			)
		);

		// Like the layout hook, this assumes the hook only applies to blocks with a single wrapper.
		$tags = new WP_HTML_Tag_Processor( $block_content );
		if ( $tags->next_tag() ) {
			$tags->add_class( $filter_id );
		}

		return $tags->get_updated_html();
	}

	/**
	 * Migrate the old experimental duotone support flag to its stabilized location
	 * under `supports.filter.duotone` and sets.
	 *
	 * @param array $settings Current block type settings.
	 * @param array $metadata Block metadata as read in via block.json.
	 *
	 * @return array Filtered block type settings.
	 */
	public static function migrate_experimental_duotone_support_flag( $settings, $metadata ) {
		$duotone_support = _wp_array_get( $metadata, array( 'supports', 'color', '__experimentalDuotone' ), null );

		if ( ! isset( $settings['supports']['filter']['duotone'] ) && null !== $duotone_support ) {
			_wp_array_set( $settings, array( 'supports', 'filter', 'duotone' ), (bool) $duotone_support );
		}

		return $settings;
	}
}
