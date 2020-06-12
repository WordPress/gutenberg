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
 * This is thought to be useful to generate
 * CSS Custom Properties from a tree,
 * although there's nothing in the implementation
 * of this function that requires that format.
 *
 * For example, assuming the given prefix is '--wp'
 * and the token is '--', for this input tree:
 *
 * {
 *   'property': 'value',
 *   'nested-property': {
 *     'sub-property': 'value'
 *   }
 * }
 *
 * it'll return this output:
 *
 * {
 *   '--wp--property': 'value',
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
		$new_key = $prefix . str_replace( '/', '-', $property );

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
	$user_cpt = gutenberg_experimental_global_styles_get_user_cpt( array( 'publish' ) );
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
 * @param array $post_status_filter  Filter CPT by post status.
 *                                   ['publish'] by default, so it only fetches published posts.
 * @param bool  $should_create_draft Whether a new draft should be created if no CPT was found.
 *                                   False by default.
 * @return array Custom Post Type for the user's origin config.
 */
function gutenberg_experimental_global_styles_get_user_cpt( $post_status_filter = array( 'publish' ), $should_create_draft = false ) {
	$user_cpt         = array();
	$post_type_filter = 'wp_global_styles';
	$post_name_filter = 'wp-global-styles-' . strtolower( wp_get_theme()->get( 'TextDomain' ) );
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
	} elseif ( $should_create_draft ) {
		$cpt_post_id = wp_insert_post(
			array(
				'post_content' => '{}',
				'post_status'  => 'draft',
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
	$user_cpt    = gutenberg_experimental_global_styles_get_user_cpt( array( 'publish', 'draft' ), true );
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

	return $config;
}

/**
 * Returns the theme presets registered via add_theme_support, if any.
 *
 * @return array Config that adheres to the theme.json schema.
 */
function gutenberg_experimental_global_styles_get_theme_presets() {
	$theme_presets = array();

	$theme_colors = gutenberg_experimental_get( get_theme_support( 'editor-color-palette' ), array( '0' ) );
	foreach ( $theme_colors as $color ) {
		$theme_presets['global']['presets']['color'][] = array(
			'slug'  => $color['slug'],
			'value' => $color['color'],
		);
	}

	$theme_gradients = gutenberg_experimental_get( get_theme_support( 'editor-gradient-presets' ), array( '0' ) );
	foreach ( $theme_gradients as $gradient ) {
		$theme_presets['global']['presets']['gradient'][] = array(
			'slug'  => $gradient['slug'],
			'value' => $gradient['gradient'],
		);
	}

	$theme_font_sizes = gutenberg_experimental_get( get_theme_support( 'editor-font-sizes' ), array( '0' ) );
	foreach ( $theme_font_sizes as $font_size ) {
		$theme_presets['global']['presets']['font-size'][] = array(
			'slug'  => $font_size['slug'],
			'value' => $font_size['size'],
		);
	}

	return $theme_presets;
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
	$theme_presets = gutenberg_experimental_global_styles_get_theme_presets();
	$theme_config  = gutenberg_experimental_global_styles_get_from_file(
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
		$theme_presets,
		$theme_config
	);

	return $theme_config;
}

/**
 * Returns the style features a particular block supports.
 *
 * @param array $supports The block supports array.
 *
 * @return array Style features supported by the block.
 */
function gutenberg_experimental_global_styles_get_supported_styles( $supports ) {
	$style_features = array(
		'color'            => array( '__experimentalColor' ),
		'background-color' => array( '__experimentalColor' ),
		'background'       => array( '__experimentalColor', 'gradients' ),
		'line-height'      => array( '__experimentalLineHeight' ),
		'font-size'        => array( '__experimentalFontSize' ),
	);

	$supported_features = array();
	foreach ( $style_features as $style_feature => $path ) {
		if ( gutenberg_experimental_get( $supports, $path ) ) {
			$supported_features[] = $style_feature;
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
	$block_data = array(
		'global' => array(
			'selector' => ':root',
			'supports' => array( 'background-color' ),
		),
	);

	$registry = WP_Block_Type_Registry::get_instance();
	foreach ( $registry->get_all_registered() as $block_name => $block_type ) {
		if ( empty( $block_type->supports ) || ! is_array( $block_type->supports ) ) {
			continue;
		}

		$supports = gutenberg_experimental_global_styles_get_supported_styles( $block_type->supports );
		if ( empty( $supports ) ) {
			continue;
		}

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
				'selector' => $block_type->supports['__experimentalSelector'],
				'supports' => $supports,
			);
		} elseif (
			isset( $block_type->supports['__experimentalSelector'] ) &&
			is_array( $block_type->supports['__experimentalSelector'] )
		) {
			foreach ( $block_type->supports['__experimentalSelector'] as $key => $selector ) {
				$block_data[ $key ] = array(
					'selector' => $selector,
					'supports' => $supports,
				);
			}
		} else {
			$block_data[ $block_name ] = array(
				'selector' => '.wp-block-' . str_replace( '/', '-', str_replace( 'core/', '', $block_name ) ),
				'supports' => $supports,
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
	$mappings = array(
		'line-height'              => array( 'typography', 'lineHeight' ),
		'font-size'                => array( 'typography', 'fontSize' ),
		'background'               => array( 'color', 'gradient' ),
		'background-color'         => array( 'color', 'background' ),
		'color'                    => array( 'color', 'text' ),
		'--wp--style--color--link' => array( 'color', 'link' ),
	);

	$result = array();

	foreach ( $mappings as $key => $path ) {
		$value = gutenberg_experimental_get( $styles, $path );
		if ( null !== $value ) {
			$result[ $key ] = $value;
		}
	}
	return $result;

}

/**
 * Takes a tree adhering to the theme.json schema and generates
 * the corresponding stylesheet.
 *
 * @param array $tree Input tree.
 *
 * @return string Stylesheet.
 */
function gutenberg_experimental_global_styles_resolver( $tree ) {
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

		// Extract the relevant preset info before converting them to CSS Custom Properties.
		foreach ( array_keys( $tree[ $block_name ]['presets'] ) as $preset_category ) {
			$flattened_values = array();
			foreach ( $tree[ $block_name ]['presets'][ $preset_category ] as $preset_value ) {
				$flattened_values[ $preset_value['slug'] ] = $preset_value['value'];
			}
			$tree[ $block_name ]['presets'][ $preset_category ] = $flattened_values;
		}

		$token         = '--';
		$prefix        = '--wp--preset' . $token;
		$css_variables = gutenberg_experimental_global_styles_get_css_vars( $tree[ $block_name ]['presets'], $prefix, $token );

		$stylesheet .= gutenberg_experimental_global_styles_resolver_styles(
			$block_data[ $block_name ]['selector'],
			$block_data[ $block_name ]['supports'],
			array_merge(
				gutenberg_experimental_global_styles_flatten_styles_tree( $tree[ $block_name ]['styles'] ),
				$css_variables
			)
		);
	}

	if ( gutenberg_experimental_global_styles_has_theme_json_support() ) {
		// To support all themes, we added in the block-library stylesheet
		// a style rule such as .has-link-color a { color: var(--wp--style--color--link, #00e); }
		// so that existing link colors themes used didn't break.
		// We add this here to make it work for themes that opt-in to theme.json
		// In the future, we may do this differently.
		$stylesheet .= 'a { color: var(--wp--style--color--link, #00e); }';
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
	$css_rule         = '';
	$css_declarations = '';

	foreach ( $block_styles as $property => $value ) {
		// Only convert to CSS:
		//
		// 1) The style attributes the block has declared support for.
		// 2) Any CSS custom property attached to the node.
		if ( in_array( $property, $block_supports, true ) || strstr( $property, '--' ) ) {
			$css_declarations .= "\t" . $property . ': ' . $value . ";\n";
		}
	}
	if ( '' !== $css_declarations ) {
		$css_rule .= $block_selector . " {\n";
		$css_rule .= $css_declarations;
		$css_rule .= "}\n";
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
		foreach ( array( 'presets', 'styles', 'features' ) as $subtree ) {
			$result[ $block_name ][ $subtree ] = array_merge(
				$core[ $block_name ][ $subtree ],
				$theme[ $block_name ][ $subtree ],
				$user[ $block_name ][ $subtree ]
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
		'styles'   => array(),
		'features' => array(),
		'presets'  => array(),
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
 * Returns the stylesheet resulting of merging
 * core's, theme's, and user's origins.
 *
 * @return string
 */
function gutenberg_experimental_global_styles_get_stylesheet() {
	$gs_merged = array();
	$gs_core   = gutenberg_experimental_global_styles_get_core();
	$gs_theme  = gutenberg_experimental_global_styles_get_theme();
	$gs_user   = gutenberg_experimental_global_styles_get_user();

	$gs_merged = gutenberg_experimental_global_styles_merge_trees( $gs_core, $gs_theme, $gs_user );

	$stylesheet = gutenberg_experimental_global_styles_resolver( $gs_merged );
	if ( empty( $stylesheet ) ) {
		return;
	}
	return $stylesheet;
}

/**
 * Fetches the preferences for each origin (core, theme, user)
 * and enqueues the resulting stylesheet.
 */
function gutenberg_experimental_global_styles_enqueue_assets() {

	$stylesheet = gutenberg_experimental_global_styles_get_stylesheet();

	wp_register_style( 'global-styles', false, array(), true, true );
	wp_add_inline_style( 'global-styles', $stylesheet );
	wp_enqueue_style( 'global-styles' );
}

/**
 * Adds the necessary data for the Global Styles client UI to the block settings.
 *
 * @param array $settings Existing block editor settings.
 * @return array New block editor settings
 */
function gutenberg_experimental_global_styles_settings( $settings ) {

	if ( gutenberg_experimental_global_styles_has_theme_json_support() ) {
		$settings['__experimentalGlobalStylesUserEntityId'] = gutenberg_experimental_global_styles_get_user_cpt_id();

		$global_styles = gutenberg_experimental_global_styles_merge_trees(
			gutenberg_experimental_global_styles_get_core(),
			gutenberg_experimental_global_styles_get_theme()
		);

		$settings['__experimentalGlobalStylesBase'] = $global_styles;
	}

	// Add the styles for the editor via the settings
	// so they get processed as if they were added via add_editor_styles:
	// they will get the editor wrapper class.
	$settings['styles'][] = array( 'css' => gutenberg_experimental_global_styles_get_stylesheet() );

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
