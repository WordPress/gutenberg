<?php
/**
 * Bootstraps Global Styles.
 *
 * @package gutenberg
 */

/**
 * Whether the current theme has support for Global Styles.
 *
 * @return boolean
 */
function gutenberg_experimental_global_styles_has_theme_support() {
	return is_readable( locate_template( 'experimental-theme.json' ) );
}

/**
 * Given a Global Styles tree, it creates a flattened tree
 * whose keys are the CSS custom properties
 * and its values the CSS custom properties' values.
 *
 * @param array  $global_styles Global Styles object to process.
 * @param string $prefix Prefix to prepend to each variable.
 * @param string $token Token to use between levels.
 *
 * @return array The flattened tree.
 */
function gutenberg_experimental_global_styles_get_css_vars( $global_styles, $prefix = '', $token = '--' ) {
	$result = array();
	foreach ( $global_styles as $key => $value ) {
		$new_key = $prefix . str_replace( '/', '-', $key );

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
 * Returns an array containing the Global Styles
 * found in a file, or a void array if none found.
 *
 * @param string $global_styles_path Path to file.
 * @return array Global Styles tree.
 */
function gutenberg_experimental_global_styles_get_from_file( $global_styles_path ) {
	$global_styles = array();
	if ( file_exists( $global_styles_path ) ) {
		$decoded_file = json_decode(
			file_get_contents( $global_styles_path ),
			true
		);
		if ( is_array( $decoded_file ) ) {
			$global_styles = $decoded_file;
		}
	}
	return $global_styles;
}

/**
 * Returns an array containing the user's Global Styles
 * or a void array if none.
 *
 * @return array Global Styles tree.
 */
function gutenberg_experimental_global_styles_get_user() {
	$config   = array();
	$user_cpt = gutenberg_experimental_global_styles_get_user_cpt( array( 'publish' ) );
	if ( array_key_exists( 'post_content', $user_cpt ) ) {
		$decoded_data = json_decode( $user_cpt['post_content'], true );
		if ( is_array( $decoded_data ) ) {
			$config = $decoded_data;
		}
	}

	return gutenberg_experimental_global_styles_normalize_shape( $config );
}

/**
 * Returns the CPT that contains the user's Global Styles
 * for the current theme or a void array if none found.
 * It can also create and return a new draft CPT.
 *
 * @param array $post_status_filter Filter CPT by post status.
 *                                  By default, only fetches published posts.
 * @param bool  $should_create_draft Whether a new draft should be created
 *                                   if no CPT was found. False by default.
 * @return array Custom Post Type for the user's Global Styles.
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
 * Returns the post ID of the CPT containing the user's Global Styles.
 *
 * @return integer Custom Post Type ID for the user's Global Styles.
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
 * Return core's Global Styles.
 *
 * @return array Global Styles tree.
 */
function gutenberg_experimental_global_styles_get_core() {
	$config = gutenberg_experimental_global_styles_get_from_file(
		dirname( dirname( __FILE__ ) ) . '/experimental-default-global-styles.json'
	);

	return gutenberg_experimental_global_styles_normalize_shape( $config );
}

/**
 * Returns the registered theme presets, if any.
 *
 * @return array
 */
function gutenberg_experimental_global_styles_get_theme_presets() {
	$theme_presets = gutenberg_experimental_global_styles_normalize_shape( array() );

	// Take colors from declared theme support.
	$theme_colors = get_theme_support( 'editor-color-palette' )[0];
	if ( is_array( $theme_colors ) ) {
		foreach ( $theme_colors as $color ) {
			$theme_presets['preset']['color'][ $color['slug'] ] = $color['color'];
		}
	}

	// Take gradients from declared theme support.
	$theme_gradients = get_theme_support( 'editor-gradient-presets' )[0];
	if ( is_array( $theme_gradients ) ) {
		foreach ( $theme_gradients as $gradient ) {
			$theme_presets['preset']['gradient'][ $gradient['slug'] ] = $gradient['gradient'];
		}
	}

	// Take font-sizes from declared theme support.
	$theme_font_sizes = get_theme_support( 'editor-font-sizes' )[0];
	if ( is_array( $theme_font_sizes ) ) {
		foreach ( $theme_font_sizes as $font_size ) {
			$theme_presets['preset']['font-size'][ $font_size['slug'] ] = $font_size['size'];
		}
	}

	return $theme_presets;
}

/**
 * Return theme's Global Styles. It also fetches the editor palettes
 * declared via add_theme_support.
 *
 * @return array Global Styles tree.
 */
function gutenberg_experimental_global_styles_get_theme() {
	$theme_presets = gutenberg_experimental_global_styles_get_theme_presets();
	$theme_config  = gutenberg_experimental_global_styles_normalize_shape(
		gutenberg_experimental_global_styles_get_from_file(
			locate_template( 'experimental-theme.json' )
		)
	);

	/*
	 * We want the presets declared in theme.json
	 * to take precedence over the ones declared via add_theme_support.
	 */
	$theme_config = array_merge(
		$theme_presets,
		$theme_config
	);

	return $theme_config;
}

/**
 * Retrieves the block data (selector/supports).
 *
 * @return array
 */
function gutenberg_experimental_global_styles_get_block_data() {
	// TODO: this data should be taken from the block registry.
	//
	// At the moment this array replicates the current capabilities
	// declared by blocks via __experimentalLineHeight,
	// __experimentalColor, and __experimentalFontSize.
	$block_data = array(
		'global'          => array(
			'selector' => ':root',
			'supports' => array(),
		),
		'core/paragraph'  => array(
			'selector' => 'p',
			'supports' => array( 'line-height', 'font-size', 'color' ),
		),
		'core/heading/h1' => array(
			'selector' => 'h1',
			'supports' => array( 'line-height', 'font-size', 'color' ),
		),
		'core/heading/h2' => array(
			'selector' => 'h2',
			'supports' => array( 'line-height', 'font-size', 'color' ),
		),
		'core/heading/h3' => array(
			'selector' => 'h3',
			'supports' => array( 'line-height', 'font-size', 'color' ),
		),
		'core/heading/h4' => array(
			'selector' => 'h4',
			'supports' => array( 'line-height', 'font-size', 'color' ),
		),
		'core/heading/h5' => array(
			'selector' => 'h5',
			'supports' => array( 'line-height', 'font-size', 'color' ),
		),
		'core/heading/h6' => array(
			'selector' => 'h6',
			'supports' => array( 'line-height', 'font-size', 'color' ),
		),
		'core/columns'    => array(
			'selector' => '.wp-block-columns',
			'supports' => array( 'color' ),
		),
		'core/group'      => array(
			'selector' => '.wp-block-group',
			'supports' => array( 'color' ),
		),
		'core/media-text' => array(
			'selector' => '.wp-block-media-text',
			'supports' => array( 'color' ),
		),
	);

	return $block_data;
}

/**
 * Takes a tree and returns the CSS rules
 * with the proper declarations.
 *
 * @param array $global_styles Global Styles tree.
 * @return string A list of CSS rules.
 */
function gutenberg_experimental_global_styles_resolver_block_styles( $global_styles ) {
	$css_rules = '';
	$styles    = $global_styles['styles']['blocks'];

	$block_data = gutenberg_experimental_global_styles_get_block_data();

	foreach ( $styles as $block_name => $block_style ) {
		if (
			! array_key_exists( $block_name, $block_data ) ||
			! array_key_exists( 'selector', $block_data[ $block_name ] ) ||
			! array_key_exists( 'supports', $block_data[ $block_name ] )
		) {
			// Do not process blocks that haven't declared support,
			// so we don't know to process.
			continue;
		}

		$css_declarations = '';
		foreach ( $block_style as $property => $value ) {
			// Only convert to CSS the style attributes the block has declared support for.
			if ( in_array( $property, $block_data[ $block_name ]['supports'], true ) ) {
				$css_declarations .= "\t" . $property . ': ' . $value . ";\n";
			}
		}
		if ( '' !== $css_declarations ) {
			$css_rules .= $block_data[ $block_name ]['selector'] . " {\n";
			$css_rules .= $css_declarations;
			$css_rules .= "}\n";
		}
	}

	return $css_rules;
}

/**
 * Takes a tree and returns a CSS rule
 * that contains the corresponding CSS custom properties.
 *
 * @param array $global_styles Global Styles tree.
 * @return string A list of CSS rules.
 */
function gutenberg_experimental_global_styles_resolver_globals( $global_styles ) {
	$css_rules = '';
	$styles    = $global_styles['styles']['globals'];

	$token    = '--';
	$prefix   = '--wp' . $token;
	$css_vars = gutenberg_experimental_global_styles_get_css_vars( $styles, $prefix, $token );
	if ( empty( $css_vars ) ) {
		return $css_rules;
	}

	$css_rules .= " :root {\n";
	foreach ( $css_vars as $var => $value ) {
		$css_rules .= "\t" . $var . ': ' . $value . ";\n";
	}
	$css_rules .= "}\n";

	return $css_rules;
}

/**
 * Function that incorporates into the source tree
 * the modifications given as updates. We use the source
 * instead of creating a new array to keep memory usage down.
 *
 * @param array $source Source tree to be updated.
 * @param array $updates Modifications to incorporate.
 *
 * @return void
 */
function gutenberg_experimental_global_styles_merge_trees( $source, $updates ) {
	foreach ( array( 'color', 'font-size', 'gradient' ) as $property ) {
		$source['styles']['globals']['preset'][ $property ] = array_merge(
			$source['styles']['globals']['preset'][ $property ],
			$updates['styles']['globals']['preset'][ $property ]
		);
	}

	$block_data = gutenberg_experimental_global_styles_get_block_data();
	foreach ( $block_data as $block_name ) {
		$source['styles']['blocks'][ $block_name ] = array_merge(
			$source['styles']['blocks'][ $block_name ],
			$updates['styles']['blocks'][ $block_name ]
		);
	}
}

/**
 * Given a global styles tree, it normalizes it
 * to the expected shape.
 *
 * @param array $tree Source tree to normalize.
 *
 * @return array
 */
function gutenberg_experimental_global_styles_normalize_shape( $tree ) {
	$normalized_tree = array(
		'styles' => array(
			'globals' => array(
				'preset' => array(
					'color'     => array(),
					'font-size' => array(),
					'gradient'  => array(),
				),
			),
			'blocks'  => array(),
		),
	);

	// Add the supported blocks, which we don't know prior which they are.
	$block_data = gutenberg_experimental_global_styles_get_block_data();
	foreach ( array_keys( $block_data ) as $block_name ) {
		$normalized_tree['styles']['blocks'][ $block_name ] = array();
	}

	$tree = array_merge_recursive(
		$normalized_tree,
		$tree
	);

	return $tree;
}

/**
 * Returns the merged styles from core, theme, and user preferences.
 *
 * @return string
 */
function gutenberg_experimental_global_styles_get_stylesheet() {
	$gs_merged = array();
	$gs_core   = gutenberg_experimental_global_styles_get_core();
	$gs_theme  = gutenberg_experimental_global_styles_get_theme();
	$gs_user   = gutenberg_experimental_global_styles_get_user();

	$gs_merged['styles']['globals'] = array_merge_recursive(
		$gs_core['styles']['globals'],
		$gs_theme['styles']['globals'],
		$gs_user['styles']['globals']
	);
	$gs_merged['styles']['blocks']  = array_merge_recursive(
		$gs_core['styles']['blocks'],
		$gs_theme['styles']['blocks'],
		$gs_user['styles']['blocks']
	);

	$stylesheet  = gutenberg_experimental_global_styles_resolver_globals( $gs_merged );
	$stylesheet .= gutenberg_experimental_global_styles_resolver_block_styles( $gs_merged );
	if ( empty( $stylesheet ) ) {
		return;
	}
	return $stylesheet;
}

/**
 * Fetches the Global Styles for each level (core, theme, user)
 * and enqueues the resulting CSS custom properties.
 */
function gutenberg_experimental_global_styles_enqueue_assets() {
	if ( ! gutenberg_experimental_global_styles_has_theme_support() ) {
		return;
	}

	$stylesheet = gutenberg_experimental_global_styles_get_stylesheet();

	wp_register_style( 'global-styles', false, array(), true, true );
	wp_add_inline_style( 'global-styles', $stylesheet );
	wp_enqueue_style( 'global-styles' );
}

/**
 * Whether the loaded page is the site editor.
 *
 * @return boolean Whether the loaded page is the site editor.
 */
function gutenberg_experimental_global_styles_is_site_editor() {
	if ( ! function_exists( 'get_current_screen' ) ) {
		return false;
	}

	$screen = get_current_screen();
	return ! empty( $screen ) && gutenberg_is_edit_site_page( $screen->id );
}

/**
 * Makes the base Global Styles (core, theme)
 * and the ID of the CPT that stores the user's Global Styles
 * available to the client, to be used for live rendering the styles.
 *
 * @param array $settings Existing block editor settings.
 * @return array New block editor settings
 */
function gutenberg_experimental_global_styles_settings( $settings ) {
	if (
		! gutenberg_experimental_global_styles_has_theme_support() ||
		! gutenberg_experimental_global_styles_is_site_editor()
	) {
		return $settings;
	}

	$settings['__experimentalGlobalStylesUserEntityId'] = gutenberg_experimental_global_styles_get_user_cpt_id();

	$global_styles = array_merge(
		gutenberg_experimental_global_styles_get_core(),
		gutenberg_experimental_global_styles_get_theme()
	);

	$settings['__experimentalGlobalStylesBase'] = $global_styles;

	// Add the styles for the editor via the settings
	// so they get processed as if they were added by add_editor_styles:
	// they will get the editor wrapper class.
	$settings['styles'][] = array( 'css' => gutenberg_experimental_global_styles_get_stylesheet() );

	return $settings;
}

/**
 * Registers a Custom Post Type to store the user's Global Styles.
 */
function gutenberg_experimental_global_styles_register_cpt() {
	if ( ! gutenberg_experimental_global_styles_has_theme_support() ) {
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

if ( gutenberg_is_experiment_enabled( 'gutenberg-full-site-editing' ) ) {
	add_action( 'init', 'gutenberg_experimental_global_styles_register_cpt' );
	add_filter( 'block_editor_settings', 'gutenberg_experimental_global_styles_settings' );
	add_action( 'wp_enqueue_scripts', 'gutenberg_experimental_global_styles_enqueue_assets' );
}
