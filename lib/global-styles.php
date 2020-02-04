<?php
/**
 * Global styles functions, filters and actions, etc.
 *
 * @package gutenberg
 */

/**
 * Whether theme has support for Global Styles
 *
 * @return boolean
 */
function gutenberg_experimental_global_styles_has_theme_support() {
	return is_readable( locate_template( 'experimental-theme.json' ) );
}

/**
 * Given Global Styles tree it creates a flattened tree
 * whose keys are the CSS custom properties
 * and its values the CSS custom properties' values.
 *
 * @param array  $global_styles Global Styles object to process.
 * @param string $prefix Prefix to append to each variable.
 * @return array The flattened tree.
 */
function gutenberg_experimental_global_styles_get_css_vars( $global_styles, $prefix = '' ) {
	$result = array();
	foreach ( $global_styles as $key => $value ) {
		$new_key = $prefix . str_replace( '/', '-', $key );

		if ( is_array( $value ) ) {
			$result = array_merge(
				$result,
				gutenberg_experimental_global_styles_get_css_vars( $value, $new_key . '-' )
			);
		} else {
			$result[ $new_key ] = $value;
		}
	}
	return $result;
}

/**
 * Returns an array containing the Global Styles
 * design tokens found in a file. A void array if none.
 *
 * @param string $global_styles_path Path to file.
 * @return array Global Styles design tokens.
 */
function gutenberg_experimental_global_styles_get_from_file( $global_styles_path ) {
	$global_styles = [];
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
 * Returns an array containing the Global Styles
 * design tokens found in a given CPT. A void array if none.
 *
 * @return array Global Styles design tokens.
 */
function gutenberg_experimental_global_styles_get_user() {
	$global_styles = [];
	$user_cpt = gutenberg_experimental_global_styles_get_user_cpt();
	if ( in_array( 'post_content', $user_cpt ) ) {
		$decoded_data = json_decode( $user_cpt[ 'post_content' ], true );
		if ( is_array( $decoded_data ) ) {
			$global_styles = $decoded_data;
		}
	}

	return $global_styles;
}

/**
 * Returns the CPT containing the user global styles.
 *
 * @return array CPT.
 */
function gutenberg_experimental_global_styles_get_user_cpt() {
	$user_cpt = [];
	$recent_posts = wp_get_recent_posts( [
		'numberposts' => 1,
		'orderby'     => 'date',
		'order'       => 'desc',
		'post_type'   => 'wp_global_styles',
		'name'        => 'wp_global_styles_' . strtolower( wp_get_theme()->get( 'Name' ) ),
	] );

	if ( is_array( $recent_posts ) && ( count( $recent_posts ) === 1 ) ) {
		$user_cpt = $recent_posts[ 0 ];
	}

	return $user_cpt;
}

/**
 * Returns the post ID of the CPT containing the user global styles.
 *
 * @return integer CPT ID.
 */
function gutenberg_experimental_global_styles_get_user_cpt_id() {
	$user_cpt_id = null;
	$user_cpt = gutenberg_experimental_global_styles_get_user_cpt();
	if ( in_array( 'ID', $user_cpt ) ) {
		$user_cpt_id = $user_cpt[ 'ID' ];
	}
	return $user_cpt_id;
}

/**
 * Return core's Global Styles design tokens.
 *
 * @return array Global Styles.
 */
function gutenberg_experimental_global_styles_get_core() {
	return gutenberg_experimental_global_styles_get_from_file(
		dirname( dirname( __FILE__ ) ) . '/experimental-default-global-styles.json'
	);
}

/**
 * Return theme's Global Styles design tokens.
 *
 * @return array Global Styles.
 */
function gutenberg_experimental_global_styles_get_theme() {
	return gutenberg_experimental_global_styles_get_from_file(
		locate_template( 'experimental-theme.json' )
	);
}

/**
 * Takes a Global Styles design tokens tree
 * and returns the corresponding CSS rule
 * that contains the CSS custom properties.
 *
 * @param array $global_styles Global Styles design tokens.
 * @return string Resulting CSS rule.
 */
function gutenberg_experimental_global_styles_resolver( $global_styles ) {
	$css_rule = '';

	$css_vars = gutenberg_experimental_global_styles_get_css_vars( $global_styles, '--wp-' );
	if ( empty( $css_vars ) ) {
		return $css_rule;
	}

	$css_rule = ":root {\n";
	foreach ( $css_vars as $var => $value ) {
		$css_rule .= "\t" . $var . ': ' . $value . ";\n";
	}
	$css_rule .= '}';

	return $css_rule;
}

/**
 * Fetches the Global Styles design tokens (defaults, theme, user),
 * and enqueues the resulting CSS custom properties if any.
 */
function gutenberg_experimental_global_styles_enqueue_assets() {
	if ( ! gutenberg_experimental_global_styles_has_theme_support() ) {
		return;
	}

	$global_styles = array_merge(
		gutenberg_experimental_global_styles_get_core(),
		gutenberg_experimental_global_styles_get_theme(),
		gutenberg_experimental_global_styles_get_user(),
	);

	$inline_style = gutenberg_experimental_global_styles_resolver( $global_styles );
	if ( empty ( $inline_style ) ) {
		return;
	}

	wp_register_style( 'global-styles', false, array(), true, true );
	wp_add_inline_style( 'global-styles', $inline_style );
	wp_enqueue_style( 'global-styles' );
}
add_action( 'enqueue_block_assets', 'gutenberg_experimental_global_styles_enqueue_assets' );

/**
 * Adds class wp-gs to the frontend body class
 * if the theme has support for Global Styles.
 *
 * @param array $classes Existing body classes.
 * @return array The filtered array of body classes.
 */
function gutenberg_experimental_global_styles_wp_gs_class_front_end( $classes ) {
	if ( gutenberg_experimental_global_styles_has_theme_support() ) {
		return array_merge( $classes, array( 'wp-gs' ) );
	}
	return $classes;
}
add_filter( 'body_class', 'gutenberg_experimental_global_styles_wp_gs_class_front_end' );


/**
 * Adds class wp-gs to the block-editor body class
 * if the theme has support for Global Styles.
 *
 * @param string $classes Existing body classes separated by space.
 * @return string The filtered string of body classes.
 */
function gutenberg_experimental_global_styles_wp_gs_class_editor( $classes ) {
	global $current_screen;
	if ( $current_screen->is_block_editor() && gutenberg_experimental_global_styles_has_theme_support() ) {
		return $classes . ' wp-gs';
	}
	return $classes;
}
add_filter( 'admin_body_class', 'gutenberg_experimental_global_styles_wp_gs_class_editor' );

function gutenberg_experimental_global_styles_settings( $settings ) {
	if ( ! gutenberg_experimental_global_styles_has_theme_support() ) {
		return $settings;
	}

	// Add CPT ID
	$settings['__experimentalGlobalStylesId'] = gutenberg_experimental_global_styles_get_user_cpt_id();

	// Make base Global Styles (core+theme) available.
	$global_styles = array_merge(
		gutenberg_experimental_global_styles_get_core(),
		gutenberg_experimental_global_styles_get_theme(),
	);
	$settings['__experimentalGlobalStyles'] = $global_styles;

	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_experimental_global_styles_settings' );

function gutenberg_experimental_global_styles_register_cpt() {
	if ( ! gutenberg_experimental_global_styles_has_theme_support() ) {
		return;
	}

	$args = [
		'label'        => 'Global Styles', 'gutenberg',
		'description'  => 'CPT to store user design tokens',
		'public'       => false,
		'show_ui'      => false,
		'show_in_rest' => true,
		'rest_base'    => '__experimental/global-styles',
		'capabilities' => [
			'read'                   => 'edit_theme_options',
			'create_posts'           => 'edit_theme_options',
			'edit_posts'             => 'edit_theme_options',
			'edit_published_posts'   => 'edit_theme_options',
			'delete_published_posts' => 'edit_theme_options',
			'edit_others_posts'      => 'edit_theme_options',
			'delete_others_posts'    => 'edit_theme_options',
		],
		'map_meta_cap' => true,
		'supports'     => [
			'editor',
			'revisions',
		]
	];
	register_post_type( 'wp_global_styles', $args );
}
add_action( 'init', 'gutenberg_experimental_global_styles_register_cpt' );
