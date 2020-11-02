<?php
/**
 * Bootstraps Global Styles.
 *
 * @package gutenberg
 */

/**
 * Whether the current theme has a theme.json file.
 *
 * @return boolean
 */
function gutenberg_experimental_global_styles_has_theme_json_support() {
	return is_readable( locate_template( 'experimental-theme.json' ) );
}

/**
 * Given a tree, it creates a flattened one
 * by merging the keys and binding the leaf values
 * to the new keys.
 *
 * It also transforms camelCase names into kebab-case
 * and substitutes '/' by '-'.
 *
 * This is thought to be useful to generate
 * CSS Custom Properties from a tree,
 * although there's nothing in the implementation
 * of this function that requires that format.
 *
 * For example, assuming the given prefix is '--wp'
 * and the token is '--', for this input tree:
 *
 * {
 *   'some/property': 'value',
 *   'nestedProperty': {
 *     'sub-property': 'value'
 *   }
 * }
 *
 * it'll return this output:
 *
 * {
 *   '--wp--some-property': 'value',
 *   '--wp--nested-property--sub-property': 'value'
 * }
 *
 * @param array  $tree Input tree to process.
 * @param string $prefix Prefix to prepend to each variable. '' by default.
 * @param string $token Token to use between levels. '--' by default.
 *
 * @return array The flattened tree.
 */
function gutenberg_experimental_global_styles_get_css_vars( $tree, $prefix = '', $token = '--' ) {
	$result = array();
	foreach ( $tree as $property => $value ) {
		$new_key = $prefix . str_replace(
			'/',
			'-',
			strtolower( preg_replace( '/(?<!^)[A-Z]/', '-$0', $property ) ) // CamelCase to kebab-case.
		);

		if ( is_array( $value ) ) {
			$new_prefix = $new_key . $token;
			$result     = array_merge(
				$result,
				gutenberg_experimental_global_styles_get_css_vars( $value, $new_prefix, $token )
			);
		} else {
			$result[ $new_key ] = $value;
		}
	}
	return $result;
}

/**
 * Processes a file that adheres to the theme.json
 * schema and returns an array with its contents,
 * or a void array if none found.
 *
 * @param string $file_path Path to file.
 * @return array Contents that adhere to the theme.json schema.
 */
function gutenberg_experimental_global_styles_get_from_file( $file_path ) {
	$config = array();
	if ( file_exists( $file_path ) ) {
		$decoded_file = json_decode(
			file_get_contents( $file_path ),
			true
		);

		$json_decoding_error = json_last_error();
		if ( JSON_ERROR_NONE !== $json_decoding_error ) {
			error_log( 'Error when decoding file schema: ' . json_last_error_msg() );
			return $config;
		}

		if ( is_array( $decoded_file ) ) {
			$config = $decoded_file;
		}
	}
	return $config;
}

/**
 * Returns the user's origin config.
 *
 * @return array Config that adheres to the theme.json schema.
 */
function gutenberg_experimental_global_styles_get_user() {
	$config   = array();
	$user_cpt = gutenberg_experimental_global_styles_get_user_cpt();
	if ( array_key_exists( 'post_content', $user_cpt ) ) {
		$decoded_data = json_decode( $user_cpt['post_content'], true );

		$json_decoding_error = json_last_error();
		if ( JSON_ERROR_NONE !== $json_decoding_error ) {
			error_log( 'Error when decoding user schema: ' . json_last_error_msg() );
			return $config;
		}

		if ( is_array( $decoded_data ) ) {
			$config = $decoded_data;
		}
	}

	return $config;
}

/**
 * Returns the CPT that contains the user's origin config
 * for the current theme or a void array if none found.
 *
 * It can also create and return a new draft CPT.
 *
 * @param bool  $should_create_cpt Whether a new CPT should be created if no one was found.
 *                                   False by default.
 * @param array $post_status_filter  Filter CPT by post status.
 *                                   ['publish'] by default, so it only fetches published posts.
 * @return array Custom Post Type for the user's origin config.
 */
function gutenberg_experimental_global_styles_get_user_cpt( $should_create_cpt = false, $post_status_filter = array( 'publish' ) ) {
	$user_cpt         = array();
	$post_type_filter = 'wp_global_styles';
	$post_name_filter = 'wp-global-styles-' . urlencode( wp_get_theme()->get_stylesheet() );
	$recent_posts     = wp_get_recent_posts(
		array(
			'numberposts' => 1,
			'orderby'     => 'date',
			'order'       => 'desc',
			'post_type'   => $post_type_filter,
			'post_status' => $post_status_filter,
			'name'        => $post_name_filter,
		)
	);

	if ( is_array( $recent_posts ) && ( count( $recent_posts ) === 1 ) ) {
		$user_cpt = $recent_posts[0];
	} elseif ( $should_create_cpt ) {
		$cpt_post_id = wp_insert_post(
			array(
				'post_content' => '{}',
				'post_status'  => 'publish',
				'post_type'    => $post_type_filter,
				'post_name'    => $post_name_filter,
			),
			true
		);
		$user_cpt    = get_post( $cpt_post_id, ARRAY_A );
	}

	return $user_cpt;
}

/**
 * Returns the post ID of the CPT containing the user's origin config.
 *
 * @return integer
 */
function gutenberg_experimental_global_styles_get_user_cpt_id() {
	$user_cpt_id = null;
	$user_cpt    = gutenberg_experimental_global_styles_get_user_cpt( true );
	if ( array_key_exists( 'ID', $user_cpt ) ) {
		$user_cpt_id = $user_cpt['ID'];
	}
	return $user_cpt_id;
}

/**
 * Return core's origin config.
 *
 * @return array Config that adheres to the theme.json schema.
 */
function gutenberg_experimental_global_styles_get_core() {
	$config = gutenberg_experimental_global_styles_get_from_file(
		__DIR__ . '/experimental-default-theme.json'
	);
	// Start i18n logic to remove when JSON i18 strings are extracted.
	$default_colors_i18n = array(
		'black'                 => __( 'Black', 'gutenberg' ),
		'cyan-bluish-gray'      => __( 'Cyan bluish gray', 'gutenberg' ),
		'white'                 => __( 'White', 'gutenberg' ),
		'pale-pink'             => __( 'Pale pink', 'gutenberg' ),
		'vivid-red'             => __( 'Vivid red', 'gutenberg' ),
		'luminous-vivid-orange' => __( 'Luminous vivid orange', 'gutenberg' ),
		'luminous-vivid-amber'  => __( 'Luminous vivid amber', 'gutenberg' ),
		'light-green-cyan'      => __( 'Light green cyan', 'gutenberg' ),
		'vivid-green-cyan'      => __( 'Vivid green cyan', 'gutenberg' ),
		'pale-cyan-blue'        => __( 'Pale cyan blue', 'gutenberg' ),
		'vivid-cyan-blue'       => __( 'Vivid cyan blue', 'gutenberg' ),
		'vivid-purple'          => __( 'Vivid purple', 'gutenberg' ),
	);

	if ( ! empty( $config['global']['settings']['color']['palette'] ) ) {
		foreach ( $config['global']['settings']['color']['palette'] as &$color ) {
			$color['name'] = $default_colors_i18n[ $color['slug'] ];
		}
	}

	$default_gradients_i18n = array(
		'vivid-cyan-blue-to-vivid-purple'               => __( 'Vivid cyan blue to vivid purple', 'gutenberg' ),
		'light-green-cyan-to-vivid-green-cyan'          => __( 'Light green cyan to vivid green cyan', 'gutenberg' ),
		'luminous-vivid-amber-to-luminous-vivid-orange' => __( 'Luminous vivid amber to luminous vivid orange', 'gutenberg' ),
		'luminous-vivid-orange-to-vivid-red'            => __( 'Luminous vivid orange to vivid red', 'gutenberg' ),
		'very-light-gray-to-cyan-bluish-gray'           => __( 'Very light gray to cyan bluish gray', 'gutenberg' ),
		'cool-to-warm-spectrum'                         => __( 'Cool to warm spectrum', 'gutenberg' ),
		'blush-light-purple'                            => __( 'Blush light purple', 'gutenberg' ),
		'blush-bordeaux'                                => __( 'Blush bordeaux', 'gutenberg' ),
		'luminous-dusk'                                 => __( 'Luminous dusk', 'gutenberg' ),
		'pale-ocean'                                    => __( 'Pale ocean', 'gutenberg' ),
		'electric-grass'                                => __( 'Electric grass', 'gutenberg' ),
		'midnight'                                      => __( 'Midnight', 'gutenberg' ),
	);

	if ( ! empty( $config['global']['settings']['color']['gradients'] ) ) {
		foreach ( $config['global']['settings']['color']['gradients'] as &$gradient ) {
			$gradient['name'] = $default_gradients_i18n[ $gradient['slug'] ];
		}
	}

	$default_font_sizes_i18n = array(
		'small'  => __( 'Small', 'gutenberg' ),
		'normal' => __( 'Normal', 'gutenberg' ),
		'medium' => __( 'Medium', 'gutenberg' ),
		'large'  => __( 'Large', 'gutenberg' ),
		'huge'   => __( 'Huge', 'gutenberg' ),
	);

	if ( ! empty( $config['global']['settings']['typography']['fontSizes'] ) ) {
		foreach ( $config['global']['settings']['typography']['fontSizes'] as &$font_size ) {
			$font_size['name'] = $default_font_sizes_i18n[ $font_size['slug'] ];
		}
	}
	// End i18n logic to remove when JSON i18 strings are extracted.
	return $config;
}

/**
 * Returns the theme presets registered via add_theme_support, if any.
 *
 * @return array Config that adheres to the theme.json schema.
 */
function gutenberg_experimental_global_styles_get_theme_support_settings() {
	$theme_settings                       = array();
	$theme_settings['global']             = array();
	$theme_settings['global']['settings'] = array();

	// Deprecated theme supports.
	if ( get_theme_support( 'disable-custom-colors' ) ) {
		if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
			$theme_settings['global']['settings']['color'] = array();
		}
		$theme_settings['global']['settings']['color']['custom'] = false;
	}
	if ( get_theme_support( 'disable-custom-gradients' ) ) {
		if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
			$theme_settings['global']['settings']['color'] = array();
		}
		$theme_settings['global']['settings']['color']['customGradient'] = false;
	}
	if ( get_theme_support( 'disable-custom-font-sizes' ) ) {
		if ( ! isset( $theme_settings['global']['settings']['typography'] ) ) {
			$theme_settings['global']['settings']['typography'] = array();
		}
		$theme_settings['global']['settings']['typography']['customFontSize'] = false;
	}
	if ( get_theme_support( 'custom-line-height' ) ) {
		if ( ! isset( $theme_settings['global']['settings']['typography'] ) ) {
			$theme_settings['global']['settings']['typography'] = array();
		}
		$theme_settings['global']['settings']['typography']['customLineHeight'] = true;
	}
	if ( get_theme_support( 'custom-spacing' ) ) {
		if ( ! isset( $theme_settings['global']['settings']['spacing'] ) ) {
			$theme_settings['global']['settings']['spacing'] = array();
		}
		$theme_settings['global']['settings']['spacing']['custom'] = true;
	}
	if ( get_theme_support( 'experimental-link-color' ) ) {
		if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
			$theme_settings['global']['settings']['color'] = array();
		}
		$theme_settings['global']['settings']['color']['link'] = true;
	}

	$custom_units_theme_support = get_theme_support( 'custom-units' );
	if ( $custom_units_theme_support ) {
		if ( ! isset( $theme_settings['global']['settings']['spacing'] ) ) {
			$theme_settings['global']['settings']['spacing'] = array();
		}
		$theme_settings['global']['settings']['spacing'] ['units'] = true === $custom_units_theme_support ? array( 'px', 'em', 'rem', 'vh', 'vw' ) : $custom_units_theme_support;
	}

	$theme_colors = get_theme_support( 'editor-color-palette' );
	if ( ! empty( $theme_colors[0] ) ) {
		if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
			$theme_settings['global']['settings']['color'] = array();
		}
		$theme_settings['global']['settings']['color']['palette'] = array();
		$theme_settings['global']['settings']['color']['palette'] = $theme_colors[0];
	}

	$theme_gradients = get_theme_support( 'editor-gradient-presets' );
	if ( ! empty( $theme_gradients[0] ) ) {
		if ( ! isset( $theme_settings['global']['settings']['color'] ) ) {
			$theme_settings['global']['settings']['color'] = array();
		}
		$theme_settings['global']['settings']['color']['gradients'] = array();
		$theme_settings['global']['settings']['color']['gradients'] = $theme_gradients[0];
	}

	$theme_font_sizes = get_theme_support( 'editor-font-sizes' );
	if ( ! empty( $theme_font_sizes[0] ) ) {
		if ( ! isset( $theme_settings['global']['settings']['typography'] ) ) {
			$theme_settings['global']['settings']['typography'] = array();
		}
		$theme_settings['global']['settings']['typography']['fontSizes'] = array();
		// Back-compatibility for presets without units.
		foreach ( $theme_font_sizes[0] as &$font_size ) {
			if ( is_numeric( $font_size['size'] ) ) {
				$font_size['size'] = $font_size['size'] . 'px';
			}
		}
		$theme_settings['global']['settings']['typography']['fontSizes'] = $theme_font_sizes[0];
	}

	return $theme_settings;
}

/**
 * Returns the theme's origin config.
 *
 * It also fetches the existing presets the theme declared via add_theme_support
 * and uses them if the theme hasn't declared any via theme.json.
 *
 * @return array Config that adheres to the theme.json schema.
 */
function gutenberg_experimental_global_styles_get_theme() {
	$theme_support_settings = gutenberg_experimental_global_styles_get_theme_support_settings();
	$theme_config           = gutenberg_experimental_global_styles_get_from_file(
		locate_template( 'experimental-theme.json' )
	);

	/*
	 * We want the presets declared in theme.json
	 * to take precedence over the ones declared via add_theme_support.
	 *
	 * Note that merging happens at the preset category level. Example:
	 *
	 * - if the theme declares a color palette via add_theme_support &
	 *   a set of font sizes via theme.json, both will be included in the output.
	 *
	 * - if the theme declares a color palette both via add_theme_support &
	 *   via theme.json, the later takes precedence.
	 *
	 */
	$theme_config = gutenberg_experimental_global_styles_merge_trees(
		$theme_support_settings,
		$theme_config
	);

	return $theme_config;
}

/**
 * Convert style property to its CSS name.
 *
 * @param string $style_property Style property name.
 * @return string CSS property name.
 */
function gutenberg_experimental_global_styles_get_css_property( $style_property ) {
	switch ( $style_property ) {
		case 'backgroundColor':
			return 'background-color';
		case 'fontSize':
			return 'font-size';
		case 'lineHeight':
			return 'line-height';
		default:
			return $style_property;
	}
}

/**
 * Return how the style property is structured.
 *
 * @return array Style property structure.
 */
function gutenberg_experimental_global_styles_get_style_property() {
	return array(
		'--wp--style--color--link' => array( 'color', 'link' ),
		'background'               => array( 'color', 'gradient' ),
		'backgroundColor'          => array( 'color', 'background' ),
		'color'                    => array( 'color', 'text' ),
		'fontSize'                 => array( 'typography', 'fontSize' ),
		'lineHeight'               => array( 'typography', 'lineHeight' ),
	);
}

/**
 * Return how the support keys are structured.
 *
 * @return array Support keys structure.
 */
function gutenberg_experimental_global_styles_get_support_keys() {
	return array(
		'--wp--style--color--link' => array( 'color', 'linkColor' ),
		'background'               => array( 'color', 'gradients' ),
		'backgroundColor'          => array( 'color' ),
		'color'                    => array( 'color' ),
		'fontSize'                 => array( 'fontSize' ),
		'lineHeight'               => array( 'lineHeight' ),
	);
}

/**
 * Returns how the presets css variables are structured on the global styles data.
 *
 * @return array Presets structure
 */
function gutenberg_experimental_global_styles_get_presets_structure() {
	return array(
		'color'    => array(
			'path' => array( 'color', 'palette' ),
			'key'  => 'color',
		),
		'gradient' => array(
			'path' => array( 'color', 'gradients' ),
			'key'  => 'gradient',
		),
		'fontSize' => array(
			'path' => array( 'typography', 'fontSizes' ),
			'key'  => 'size',
		),
	);
}

/**
 * Returns the style features a particular block supports.
 *
 * @param array $supports The block supports array.
 *
 * @return array Style features supported by the block.
 */
function gutenberg_experimental_global_styles_get_supported_styles( $supports ) {
	$support_keys       = gutenberg_experimental_global_styles_get_support_keys();
	$supported_features = array();
	foreach ( $support_keys as $key => $path ) {
		if ( gutenberg_experimental_get( $supports, $path ) ) {
			$supported_features[] = $key;
		}
	}

	return $supported_features;
}

/**
 * Retrieves the block data (selector/supports).
 *
 * @return array
 */
function gutenberg_experimental_global_styles_get_block_data() {
	$block_data = array();

	$registry = WP_Block_Type_Registry::get_instance();
	$blocks   = array_merge(
		$registry->get_all_registered(),
		array(
			'global' => new WP_Block_Type(
				'global',
				array(
					'supports' => array(
						'__experimentalSelector' => ':root',
						'fontSize'               => true,
						'color'                  => array(
							'linkColor' => true,
							'gradients' => true,
						),
					),
				)
			),
		)
	);
	foreach ( $blocks as $block_name => $block_type ) {
		if ( ! property_exists( $block_type, 'supports' ) || empty( $block_type->supports ) || ! is_array( $block_type->supports ) ) {
			continue;
		}

		$supports = gutenberg_experimental_global_styles_get_supported_styles( $block_type->supports );

		/*
		 * Assign the selector for the block.
		 *
		 * Some blocks can declare multiple selectors:
		 *
		 * - core/heading represents the H1-H6 HTML elements
		 * - core/list represents the UL and OL HTML elements
		 * - core/group is meant to represent DIV and other HTML elements
		 *
		 * Some other blocks don't provide a selector,
		 * so we generate a class for them based on their name:
		 *
		 * - 'core/group' => '.wp-block-group'
		 * - 'my-custom-library/block-name' => '.wp-block-my-custom-library-block-name'
		 *
		 * Note that, for core blocks, we don't add the `core/` prefix to its class name.
		 * This is for historical reasons, as they come with a class without that infix.
		 *
		 */
		if (
			isset( $block_type->supports['__experimentalSelector'] ) &&
			is_string( $block_type->supports['__experimentalSelector'] )
		) {
			$block_data[ $block_name ] = array(
				'selector'  => $block_type->supports['__experimentalSelector'],
				'supports'  => $supports,
				'blockName' => $block_name,
			);
		} elseif (
			isset( $block_type->supports['__experimentalSelector'] ) &&
			is_array( $block_type->supports['__experimentalSelector'] )
		) {
			foreach ( $block_type->supports['__experimentalSelector'] as $key => $selector ) {
				$block_data[ $key ] = array(
					'selector'  => $selector,
					'supports'  => $supports,
					'blockName' => $block_name,
				);
			}
		} else {
			$block_data[ $block_name ] = array(
				'selector'  => '.wp-block-' . str_replace( '/', '-', str_replace( 'core/', '', $block_name ) ),
				'supports'  => $supports,
				'blockName' => $block_name,
			);
		}
	}

	return $block_data;
}

/**
 * Given an array contain the styles shape returns the css for this styles.
 * A similar function exists on the client at /packages/block-editor/src/hooks/style.js.
 *
 * @param array $styles  Array containing the styles shape from global styles.
 *
 * @return array Containing a set of css rules.
 */
function gutenberg_experimental_global_styles_flatten_styles_tree( $styles ) {
	$mappings = gutenberg_experimental_global_styles_get_style_property();

	$result = array();
	foreach ( $mappings as $key => $path ) {
		$value = gutenberg_experimental_get( $styles, $path, null );
		if ( null !== $value ) {
			$result[ $key ] = $value;
		}
	}
	return $result;

}

/**
 * Given a selector for a block, and the settings of the block, returns a string
 * with the stylesheet of the preset classes required for that block.
 *
 * @param string $selector  String with the CSS selector for the block.
 * @param array  $settings  Array containing the settings of the block.
 *
 * @return string Stylesheet with the preset classes.
 */
function gutenberg_experimental_global_styles_get_preset_classes( $selector, $settings ) {
	if ( empty( $settings ) || empty( $selector ) ) {
		return '';
	}

	$stylesheet        = '';
	$class_prefix      = 'has';
	$classes_structure = array(
		'color'               => array(
			'path'     => array( 'color', 'palette' ),
			'key'      => 'color',
			'property' => 'color',
		),
		'background-color'    => array(
			'path'     => array( 'color', 'palette' ),
			'key'      => 'color',
			'property' => 'background-color',
		),
		'gradient-background' => array(
			'path'     => array( 'color', 'gradients' ),
			'key'      => 'gradient',
			'property' => 'background',
		),
		'font-size'           => array(
			'path'     => array( 'typography', 'fontSizes' ),
			'key'      => 'size',
			'property' => 'font-size',
		),
	);

	foreach ( $classes_structure as $class_suffix => $preset_structure ) {
		$path    = $preset_structure['path'];
		$presets = gutenberg_experimental_get( $settings, $path );

		if ( empty( $presets ) ) {
			continue;
		}

		$key      = $preset_structure['key'];
		$property = $preset_structure['property'];

		foreach ( $presets as $preset ) {
			$slug  = $preset['slug'];
			$value = $preset[ $key ];

			$class_to_use    = ".$class_prefix-$slug-$class_suffix";
			$selector_to_use = '';
			if ( ':root' === $selector ) {
				$selector_to_use = $class_to_use;
			} else {
				$selector_to_use = "$selector$class_to_use";
			}
			if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
				$stylesheet .= "$selector_to_use {\n\t$property: $value;\n}\n";
			} else {
				$stylesheet .= $selector_to_use . '{' . "$property:$value;}\n";
			}
		}
	}
	return $stylesheet;
}

/**
 * Takes a tree adhering to the theme.json schema and generates
 * the corresponding stylesheet.
 *
 * @param array $tree Input tree.
 *
 * @return string Stylesheet.
 */
function gutenberg_experimental_global_styles_get_stylesheet( $tree ) {
	$stylesheet = '';
	$block_data = gutenberg_experimental_global_styles_get_block_data();
	foreach ( array_keys( $tree ) as $block_name ) {
		if (
			! array_key_exists( $block_name, $block_data ) ||
			! array_key_exists( 'selector', $block_data[ $block_name ] ) ||
			! array_key_exists( 'supports', $block_data[ $block_name ] )
		) {
			// Skip blocks that haven't declared support,
			// because we don't know to process them.
			continue;
		}

		// Create the CSS Custom Properties for the presets.
		$computed_presets  = array();
		$presets_structure = gutenberg_experimental_global_styles_get_presets_structure();
		foreach ( $presets_structure as $token => $preset_meta ) {
			$block_preset = gutenberg_experimental_get( $tree[ $block_name ]['settings'], $preset_meta['path'] );
			if ( ! empty( $block_preset ) ) {
				$computed_presets[ $token ] = array();
				foreach ( $block_preset as $preset_value ) {
					$computed_presets[ $token ][ $preset_value['slug'] ] = $preset_value[ $preset_meta['key'] ];
				}
			}
		}
		$token            = '--';
		$preset_prefix    = '--wp--preset' . $token;
		$preset_variables = gutenberg_experimental_global_styles_get_css_vars( $computed_presets, $preset_prefix, $token );

		// Create the CSS Custom Properties that are specific to the theme.
		$computed_theme_props = gutenberg_experimental_get( $tree[ $block_name ]['settings'], array( 'custom' ) );
		$theme_props_prefix   = '--wp--custom' . $token;
		$theme_variables      = gutenberg_experimental_global_styles_get_css_vars(
			$computed_theme_props,
			$theme_props_prefix,
			$token
		);

		$stylesheet .= gutenberg_experimental_global_styles_resolver_styles(
			$block_data[ $block_name ]['selector'],
			$block_data[ $block_name ]['supports'],
			array_merge(
				gutenberg_experimental_global_styles_flatten_styles_tree( $tree[ $block_name ]['styles'] ),
				$preset_variables,
				$theme_variables
			)
		);

		$stylesheet .= gutenberg_experimental_global_styles_get_preset_classes( $block_data[ $block_name ]['selector'], $tree[ $block_name ]['settings'] );
	}

	if ( gutenberg_experimental_global_styles_has_theme_json_support() ) {
		// To support all themes, we added in the block-library stylesheet
		// a style rule such as .has-link-color a { color: var(--wp--style--color--link, #00e); }
		// so that existing link colors themes used didn't break.
		// We add this here to make it work for themes that opt-in to theme.json
		// In the future, we may do this differently.
		$stylesheet .= 'a{color:var(--wp--style--color--link, #00e);}';
	}

	return $stylesheet;
}

/**
 * Generates CSS declarations for a block.
 *
 * @param string $block_selector CSS selector for the block.
 * @param array  $block_supports A list of properties supported by the block.
 * @param array  $block_styles The list of properties/values to be converted to CSS.
 *
 * @return string The corresponding CSS rule.
 */
function gutenberg_experimental_global_styles_resolver_styles( $block_selector, $block_supports, $block_styles ) {
	$css_property     = '';
	$css_rule         = '';
	$css_declarations = '';

	foreach ( $block_styles as $property => $value ) {
		// Only convert to CSS:
		//
		// 1) The style attributes the block has declared support for.
		// 2) Any CSS custom property attached to the node.
		if (
			in_array( $property, $block_supports, true ) ||
			strstr( $property, '--' )
		) {
			$css_property = gutenberg_experimental_global_styles_get_css_property( $property );

			// Add whitespace if SCRIPT_DEBUG is defined and set to true.
			if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
				$css_declarations .= "\t" . $css_property . ': ' . $value . ";\n";
			} else {
				$css_declarations .= $css_property . ':' . $value . ';';
			}
		}
	}

	if ( '' !== $css_declarations ) {

		// Add whitespace if SCRIPT_DEBUG is defined and set to true.
		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			$css_rule .= $block_selector . " {\n";
			$css_rule .= $css_declarations;
			$css_rule .= "}\n";
		} else {
			$css_rule .= $block_selector . '{' . $css_declarations . '}';
		}
	}

	return $css_rule;
}

/**
 * Helper function that merges trees that adhere to the theme.json schema.
 *
 * @param array $core Core origin.
 * @param array $theme Theme origin.
 * @param array $user User origin. An empty array by default.
 *
 * @return array The merged result.
 */
function gutenberg_experimental_global_styles_merge_trees( $core, $theme, $user = array() ) {
	$core   = gutenberg_experimental_global_styles_normalize_schema( $core );
	$theme  = gutenberg_experimental_global_styles_normalize_schema( $theme );
	$user   = gutenberg_experimental_global_styles_normalize_schema( $user );
	$result = gutenberg_experimental_global_styles_normalize_schema( array() );

	foreach ( array_keys( $core ) as $block_name ) {
		foreach ( array_keys( $core[ $block_name ]['settings'] ) as $subtree ) {
			$result[ $block_name ]['settings'][ $subtree ] = array_merge(
				$core[ $block_name ]['settings'][ $subtree ],
				$theme[ $block_name ]['settings'][ $subtree ],
				$user[ $block_name ]['settings'][ $subtree ]
			);
		}
		foreach ( array_keys( $core[ $block_name ]['styles'] ) as $subtree ) {
			$result[ $block_name ]['styles'][ $subtree ] = array_merge(
				$core[ $block_name ]['styles'][ $subtree ],
				$theme[ $block_name ]['styles'][ $subtree ],
				$user[ $block_name ]['styles'][ $subtree ]
			);
		}
	}

	return $result;
}

/**
 * Given a tree, it normalizes it to the expected schema.
 *
 * @param array $tree Source tree to normalize.
 *
 * @return array Normalized tree.
 */
function gutenberg_experimental_global_styles_normalize_schema( $tree ) {
	$block_schema = array(
		'styles'   => array(
			'typography' => array(),
			'color'      => array(),
		),
		'settings' => array(
			'color'      => array(),
			'custom'     => array(),
			'typography' => array(),
			'spacing'    => array(),
		),
	);

	$normalized_tree = array();
	$block_data      = gutenberg_experimental_global_styles_get_block_data();
	foreach ( array_keys( $block_data ) as $block_name ) {
		$normalized_tree[ $block_name ] = $block_schema;
	}

	$tree = array_merge_recursive(
		$normalized_tree,
		$tree
	);

	return $tree;
}

/**
 * Takes data from the different origins (core, theme, and user)
 * and returns the merged result.
 *
 * @return array Merged trees
 */
function gutenberg_experimental_global_styles_get_merged_origins() {
	$core  = gutenberg_experimental_global_styles_get_core();
	$theme = gutenberg_experimental_global_styles_get_theme();
	$user  = gutenberg_experimental_global_styles_get_user();

	return gutenberg_experimental_global_styles_merge_trees( $core, $theme, $user );
}

/**
 * Fetches the preferences for each origin (core, theme, user)
 * and enqueues the resulting stylesheet.
 */
function gutenberg_experimental_global_styles_enqueue_assets() {
	$merged     = gutenberg_experimental_global_styles_get_merged_origins();
	$stylesheet = gutenberg_experimental_global_styles_get_stylesheet( $merged );
	if ( empty( $stylesheet ) ) {
		return;
	}

	wp_register_style( 'global-styles', false, array(), true, true );
	wp_add_inline_style( 'global-styles', $stylesheet );
	wp_enqueue_style( 'global-styles' );
}

/**
 * Returns the default config for editor features,
 * or an empty array if none found.
 *
 * @param array $config Config to extract values from.
 * @return array Default features config for the editor.
 */
function gutenberg_experimental_global_styles_get_editor_settings( $config ) {
	$settings = array();
	foreach ( array_keys( $config ) as $context ) {
		if (
			empty( $config[ $context ]['settings'] ) ||
			! is_array( $config[ $context ]['settings'] )
		) {
			$settings[ $context ] = array();
		} else {
			$settings[ $context ] = $config[ $context ]['settings'];
		}
	}
	return $settings;
}

/**
 * Adds the necessary data for the Global Styles client UI to the block settings.
 *
 * @param array $settings Existing block editor settings.
 * @return array New block editor settings
 */
function gutenberg_experimental_global_styles_settings( $settings ) {
	$merged = gutenberg_experimental_global_styles_get_merged_origins();

	// STEP 1: ADD FEATURES
	// These need to be added to settings always.
	// We also need to unset the deprecated settings defined by core.
	$settings['__experimentalFeatures'] = gutenberg_experimental_global_styles_get_editor_settings( $merged );

	unset( $settings['colors'] );
	unset( $settings['gradients'] );
	unset( $settings['fontSizes'] );
	unset( $settings['disableCustomColors'] );
	unset( $settings['disableCustomGradients'] );
	unset( $settings['disableCustomFontSizes'] );
	unset( $settings['enableCustomLineHeight'] );
	unset( $settings['enableCustomUnits'] );

	// STEP 2 - IF EDIT-SITE, ADD DATA REQUIRED FOR GLOBAL STYLES SIDEBAR
	// The client needs some information to be able to access/update the user styles.
	// We only do this if the theme has support for theme.json, though,
	// as an indicator that the theme will know how to combine this with its stylesheet.
	$screen = get_current_screen();
	if (
		! empty( $screen ) &&
		function_exists( 'gutenberg_is_edit_site_page' ) &&
		gutenberg_is_edit_site_page( $screen->id ) &&
		gutenberg_experimental_global_styles_has_theme_json_support()
	) {
		$settings['__experimentalGlobalStylesUserEntityId'] = gutenberg_experimental_global_styles_get_user_cpt_id();
		$settings['__experimentalGlobalStylesContexts']     = gutenberg_experimental_global_styles_get_block_data();
		$settings['__experimentalGlobalStylesBaseStyles']   = gutenberg_experimental_global_styles_merge_trees(
			gutenberg_experimental_global_styles_get_core(),
			gutenberg_experimental_global_styles_get_theme()
		);
	} else {
		// STEP 3 - OTHERWISE, ADD STYLES
		//
		// If we are in a block editor context, but not in edit-site,
		// we need to add the styles via the settings. This is because
		// we want them processed as if they were added via add_editor_styles,
		// which adds the editor wrapper class.
		$settings['styles'][] = array( 'css' => gutenberg_experimental_global_styles_get_stylesheet( $merged ) );
	}

	return $settings;
}

/**
 * Registers a Custom Post Type to store the user's origin config.
 */
function gutenberg_experimental_global_styles_register_cpt() {
	if ( ! gutenberg_experimental_global_styles_has_theme_json_support() ) {
		return;
	}

	$args = array(
		'label'        => __( 'Global Styles', 'gutenberg' ),
		'description'  => 'CPT to store user design tokens',
		'public'       => false,
		'show_ui'      => false,
		'show_in_rest' => true,
		'rest_base'    => '__experimental/global-styles',
		'capabilities' => array(
			'read'                   => 'edit_theme_options',
			'create_posts'           => 'edit_theme_options',
			'edit_posts'             => 'edit_theme_options',
			'edit_published_posts'   => 'edit_theme_options',
			'delete_published_posts' => 'edit_theme_options',
			'edit_others_posts'      => 'edit_theme_options',
			'delete_others_posts'    => 'edit_theme_options',
		),
		'map_meta_cap' => true,
		'supports'     => array(
			'editor',
			'revisions',
		),
	);
	register_post_type( 'wp_global_styles', $args );
}

add_action( 'init', 'gutenberg_experimental_global_styles_register_cpt' );
add_filter( 'block_editor_settings', 'gutenberg_experimental_global_styles_settings' );
add_action( 'wp_enqueue_scripts', 'gutenberg_experimental_global_styles_enqueue_assets' );
