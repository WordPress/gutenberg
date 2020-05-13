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
	$global_styles = array();
	$user_cpt      = gutenberg_experimental_global_styles_get_user_cpt( array( 'publish' ) );
	if ( array_key_exists( 'post_content', $user_cpt ) ) {
		$decoded_data = json_decode( $user_cpt['post_content'], true );
		if ( is_array( $decoded_data ) ) {
			$global_styles = $decoded_data;
		}
	}

	return $global_styles;
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
	return gutenberg_experimental_global_styles_get_from_file(
		dirname( dirname( __FILE__ ) ) . '/experimental-default-global-styles.json'
	);
}

/**
 * Return theme's Global Styles. It also fetches the editor palettes
 * declared via add_theme_support.
 *
 * @return array Global Styles tree.
 */
function gutenberg_experimental_global_styles_get_theme() {
	$theme_supports = array();
	// Take colors from declared theme support.
	$theme_colors = get_theme_support( 'editor-color-palette' )[0];
	if ( is_array( $theme_colors ) ) {
		foreach ( $theme_colors as $color ) {
			$theme_supports['color'][ $color['slug'] ] = $color['color'];
		}
	}

	// Take gradients from declared theme support.
	$theme_gradients = get_theme_support( 'editor-gradient-presets' )[0];
	if ( is_array( $theme_gradients ) ) {
		foreach ( $theme_gradients as $gradient ) {
			$theme_supports['gradient'][ $gradient['slug'] ] = $gradient['gradient'];
		}
	}

	// Take font-sizes from declared theme support.
	$theme_font_sizes = get_theme_support( 'editor-font-sizes' )[0];
	if ( is_array( $theme_font_sizes ) ) {
		foreach ( $theme_font_sizes as $font_size ) {
			$theme_supports['font-size'][ $font_size['slug'] ] = $font_size['size'];
		}
	}

	/*
	 * We want the presets declared in theme.json
	 * to take precedence over the ones declared via add_theme_support.
	 *
	 * However, at the moment, it's not clear how we're going to declare them
	 * in theme.json until we resolve issues related to i18n and
	 * unfold the proper theme.json hierarchy. See:
	 *
	 * https://github.com/wp-cli/i18n-command/pull/210
	 * https://github.com/WordPress/gutenberg/issues/20588
	 *
	 */
	$theme_styles = gutenberg_experimental_global_styles_get_from_file(
		locate_template( 'experimental-theme.json' )
	);

	if ( ! array_key_exists( 'globals', $theme_styles ) ) {
		$theme_styles['globals'] = array();
	}

	$theme_styles['globals'] = array_merge_recursive(
		$theme_supports,
		$theme_styles['globals']
	);

	return $theme_styles;
}

/**
 * Maintains a list of the CSS selectors available to use.
 * This should be taken from the block / pattern registry.
 *
 * @return array
 */
function gutenberg_experimental_global_styles_get_block_data() {
	// TODO: this data should be taken from the block.json.
	//
	// We need the ability to have many selectors per block
	// like for heading (core/heading/h1, core/heading/h2, etc)
	// but also for other blocks that have complex layouts
	// (ex: for gallery we may want to target the wrapper element
	// and the individual images).
	//
	// Having access to this via the block registry
	// requires block server registration.
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

	if ( ! is_array( $global_styles ) || ! array_key_exists( 'blocks', $global_styles ) ) {
		return $css_rules;
	}
	$styles = $global_styles['blocks'];

	$block_data = gutenberg_experimental_global_styles_get_block_data();

	foreach ( $styles as $block_name => $block_style ) {
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

	if ( ! is_array( $global_styles ) || ! array_key_exists( 'globals', $global_styles ) ) {
		return $css_rules;
	}
	$styles = $global_styles['globals'];

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
 * Fetches the Global Styles for each level (core, theme, user)
 * and enqueues the resulting CSS custom properties for the editor.
 */
function gutenberg_experimental_global_styles_enqueue_assets_editor() {
	if ( gutenberg_experimental_global_styles_is_site_editor() ) {
		gutenberg_experimental_global_styles_enqueue_assets();
	}
}

/**
 * Fetches the Global Styles for each level (core, theme, user)
 * and enqueues the resulting CSS custom properties.
 */
function gutenberg_experimental_global_styles_enqueue_assets() {
	if ( ! gutenberg_experimental_global_styles_has_theme_support() ) {
		return;
	}

	$global_styles = array_merge(
		gutenberg_experimental_global_styles_get_core(),
		gutenberg_experimental_global_styles_get_theme(),
		gutenberg_experimental_global_styles_get_user()
	);

	$inline_style  = gutenberg_experimental_global_styles_resolver_globals( $global_styles );
	$inline_style .= gutenberg_experimental_global_styles_resolver_block_styles( $global_styles );
	if ( empty( $inline_style ) ) {
		return;
	}

	wp_register_style( 'global-styles', false, array(), true, true );
	wp_add_inline_style( 'global-styles', $inline_style );
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
	// enqueue_block_assets is not fired in edit-site, so we use separate back/front hooks instead.
	add_action( 'wp_enqueue_scripts', 'gutenberg_experimental_global_styles_enqueue_assets' );
	add_action( 'admin_enqueue_scripts', 'gutenberg_experimental_global_styles_enqueue_assets_editor' );
}
