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
function gutenberg_global_styles_has_theme_support() {
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
function gutenberg_global_styles_get_css_vars( $global_styles, $prefix = '' ) {
	$result = array();
	foreach ( $global_styles as $key => $value ) {
		$new_key = $prefix . str_replace( '/', '-', $key );

		if ( is_array( $value ) ) {
			$result = array_merge(
				$result,
				gutenberg_global_styles_get_css_vars( $value, $new_key . '-' )
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
function gutenberg_global_styles_get_from_file( $global_styles_path ) {
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
function gutenberg_global_styles_get_from_cpt() {
	// TODO: fetch from CPT.
	return [];
}

/**
 * Takes a Global Styles design tokens tree
 * and returns the corresponding CSS rule
 * that contains the CSS custom properties.
 *
 * @param array $global_styles Global Styles design tokens.
 * @return string Resulting CSS rule.
 */
function gutenberg_global_styles_resolver( $global_styles ) {
	$css_rule = '';

	$css_vars = gutenberg_global_styles_get_css_vars( $global_styles, '--wp-' );
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
function gutenberg_global_styles_enqueue_assets() {
	if ( ! gutenberg_global_styles_has_theme_support() ) {
		return;
	}

	$default_global_styles = gutenberg_global_styles_get_from_file( dirname( dirname( __FILE__ ) ) . '/experimental-default-global-styles.json' );
	$theme_global_styles   = gutenberg_global_styles_get_from_file( locate_template( 'experimental-theme.json' ) );
	$user_global_styles    = gutenberg_global_styles_get_from_cpt();
	$global_styles         = array_merge(
		$default_global_styles,
		$theme_global_styles,
		$user_global_styles,
	);

	$inline_style = gutenberg_global_styles_resolver( $global_styles );
	if ( empty ( $inline_style ) ) {
		return;
	}

	wp_register_style( 'global-styles', false, array(), true, true );
	wp_add_inline_style( 'global-styles', $inline_style );
	wp_enqueue_style( 'global-styles' );
}
add_action( 'enqueue_block_assets', 'gutenberg_global_styles_enqueue_assets' );

/**
 * Adds class wp-gs to the frontend body class
 * if the theme has support for Global Styles.
 *
 * @param array $classes Existing body classes.
 * @return array The filtered array of body classes.
 */
function gutenberg_global_styles_add_wp_gs_class_front_end( $classes ) {
	if ( gutenberg_global_styles_has_theme_support() ) {
		return array_merge( $classes, array( 'wp-gs' ) );
	}
	return $classes;
}
add_filter( 'body_class', 'gutenberg_global_styles_add_wp_gs_class_front_end' );


/**
 * Adds class wp-gs to the block-editor body class
 * if the theme has support for Global Styles.
 *
 * @param string $classes Existing body classes separated by space.
 * @return string The filtered string of body classes.
 */
function gutenberg_global_styles_add_wp_gs_class_editor( $classes ) {
	global $current_screen;
	if ( $current_screen->is_block_editor() && gutenberg_global_styles_has_theme_support() ) {
		return $classes . ' wp-gs';
	}
	return $classes;
}
add_filter( 'admin_body_class', 'gutenberg_global_styles_add_wp_gs_class_editor' );

function gutenberg_global_styles_experimental_settings( $settings ) {
	// Add CPT ID
	$recent_posts = wp_get_recent_posts( [
		'numberposts' => 1,
		'orderby'     => 'ID',
		'order'       => 'desc',
		'post_type'   => 'wp_global_styles',
	] );
	if ( is_array( $recent_posts ) && ( count( $recent_posts ) > 0 ) ) {
		$settings['__experimentalGlobalStylesId'] = $recent_posts[ 0 ][ 'ID' ];
	} else {
		$settings['__experimentalGlobalStylesId'] = null;
	}

	// Make base Global Styles (core+theme) available.
	$settings['__experimentalGlobalStyles'] = [
		'core' => [
			'color'=> [
				'text' => 'black',
			],
		],
		'core/paragraph' => [
			'color' => [
				'text' => 'black',
			],
		],
	];

	return $settings;
}
add_filter( 'block_editor_settings', 'gutenberg_global_styles_experimental_settings' );

function gutenberg_global_styles_experimental_register_cpt() {
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
add_action( 'init', 'gutenberg_global_styles_experimental_register_cpt' );
