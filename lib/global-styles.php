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
 * @return WP_Theme_JSON Entity that holds user data.
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

	return new WP_Theme_JSON( $config );
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
 * @return WP_Theme_JSON Entity that holds core data.
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

	$default_font_styles_i18n = array(
		'normal'  => __( 'Regular', 'gutenberg' ),
		'italic'  => __( 'Italic', 'gutenberg' ),
		'initial' => __( 'Initial', 'gutenberg' ),
		'inherit' => __( 'Inherit', 'gutenberg' ),
	);
	if ( ! empty( $config['global']['settings']['typography']['fontStyles'] ) ) {
		foreach ( $config['global']['settings']['typography']['fontStyles'] as &$font_style ) {
			$font_style['name'] = $default_font_styles_i18n[ $font_style['slug'] ];
		}
	}

	$default_font_weights_i18n = array(
		'100'     => __( 'Ultralight', 'gutenberg' ),
		'200'     => __( 'Thin', 'gutenberg' ),
		'300'     => __( 'Light', 'gutenberg' ),
		'400'     => __( 'Regular', 'gutenberg' ),
		'500'     => __( 'Medium', 'gutenberg' ),
		'600'     => __( 'Semibold', 'gutenberg' ),
		'700'     => __( 'Bold', 'gutenberg' ),
		'800'     => __( 'Heavy', 'gutenberg' ),
		'900'     => __( 'Black', 'gutenberg' ),
		'initial' => __( 'Initial', 'gutenberg' ),
		'inherit' => __( 'Inherit', 'gutenberg' ),
	);
	if ( ! empty( $config['global']['settings']['typography']['fontWeights'] ) ) {
		foreach ( $config['global']['settings']['typography']['fontWeights'] as &$font_weight ) {
			$font_weight['name'] = $default_font_weights_i18n[ $font_weight['slug'] ];
		}
	}
	// End i18n logic to remove when JSON i18 strings are extracted.

	return new WP_Theme_JSON( $config );
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
 * @return WP_Theme_JSON Entity that holds theme data.
 */
function gutenberg_experimental_global_styles_get_theme() {
	$theme_support_data = gutenberg_experimental_global_styles_get_theme_support_settings();
	$theme_json_data    = gutenberg_experimental_global_styles_get_from_file(
		locate_template( 'experimental-theme.json' )
	);

	/*
	 * We want the presets declared in theme.json
	 * to override the ones declared via add_theme_support.
	 */
	$result = new WP_Theme_JSON( $theme_support_data );
	$all    = new WP_Theme_JSON( $theme_json_data );
	$result->merge( $all );

	return $result;
}

/**
 * Takes a tree adhering to the theme.json schema and generates
 * the corresponding stylesheet.
 *
 * @param WP_Theme_JSON $tree Input tree.
 *
 * @return string Stylesheet.
 */
function gutenberg_experimental_global_styles_get_stylesheet( $tree ) {
	// Check if we can use cached.
	$can_use_cached = (
		( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) &&
		( ! defined( 'SCRIPT_DEBUG' ) || ! SCRIPT_DEBUG ) &&
		( ! defined( 'REST_REQUEST' ) || ! REST_REQUEST ) &&
		! is_admin()
	);

	if ( $can_use_cached ) {
		// Check if we have the styles already cached.
		$cached = get_transient( 'global_styles' );
		if ( $cached ) {
			return $cached;
		}
	}

	$stylesheet = $tree->get_stylesheet();

	if ( gutenberg_experimental_global_styles_has_theme_json_support() ) {
		// To support all themes, we added in the block-library stylesheet
		// a style rule such as .has-link-color a { color: var(--wp--style--color--link, #00e); }
		// so that existing link colors themes used didn't break.
		// We add this here to make it work for themes that opt-in to theme.json
		// In the future, we may do this differently.
		$stylesheet .= 'a{color:var(--wp--style--color--link, #00e);}';
	}

	if ( $can_use_cached ) {
		// Cache for a minute.
		// This cache doesn't need to be any longer, we only want to avoid spikes on high-trafic sites.
		set_transient( 'global_styles', $stylesheet, MINUTE_IN_SECONDS );
	}

	return $stylesheet;
}

/**
 * Fetches the preferences for each origin (core, theme, user)
 * and enqueues the resulting stylesheet.
 */
function gutenberg_experimental_global_styles_enqueue_assets() {
	$all = gutenberg_experimental_global_styles_get_core();
	$all->merge( gutenberg_experimental_global_styles_get_theme() );
	$all->merge( gutenberg_experimental_global_styles_get_user() );

	$stylesheet = gutenberg_experimental_global_styles_get_stylesheet( $all );
	if ( empty( $stylesheet ) ) {
		return;
	}

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
	$base = gutenberg_experimental_global_styles_get_core();
	$base->merge( gutenberg_experimental_global_styles_get_theme() );

	$all = gutenberg_experimental_global_styles_get_core();
	$all->merge( gutenberg_experimental_global_styles_get_theme() );
	$all->merge( gutenberg_experimental_global_styles_get_user() );

	// STEP 1: ADD FEATURES
	// These need to be added to settings always.
	// We also need to unset the deprecated settings defined by core.
	$settings['__experimentalFeatures'] = $all->get_settings();

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
		$settings['__experimentalGlobalStylesContexts']     = $base->get_blocks_metadata();
		$settings['__experimentalGlobalStylesBaseStyles']   = $base->get_raw_data();
	} else {
		// STEP 3 - OTHERWISE, ADD STYLES
		//
		// If we are in a block editor context, but not in edit-site,
		// we need to add the styles via the settings. This is because
		// we want them processed as if they were added via add_editor_styles,
		// which adds the editor wrapper class.
		$settings['styles'][] = array( 'css' => gutenberg_experimental_global_styles_get_stylesheet( $all ) );
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
