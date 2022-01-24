<?php
/**
 * Webfonts API: Webfonts functions
 *
 * @since 6.0.0
 *
 * @package WordPress
 * @subpackage Webfonts
 */

/**
 * Instantiates the webfonts controller, if not already set, and returns it.
 *
 * @since 6.0.0
 *
 * @return WP_Webfonts Instance of the controller.
 */
function wp_webfonts() {
	static $instance;

	if ( ! $instance instanceof WP_Webfonts ) {
		$instance = new WP_Webfonts();
		$instance->init();
	}

	return $instance;
}

/**
 * Registers a collection of webfonts.
 *
 * Example of how to register Source Serif Pro font with font-weight range of 200-900
 * and font-style of normal and italic:
 *
 * If the font files are contained within the theme:
 * <code>
 * wp_register_webfonts(
 *      array(
 *          array(
 *              'provider'    => 'local',
 *              'font_family' => 'Source Serif Pro',
 *              'font_weight' => '200 900',
 *              'font_style'  => 'normal',
 *              'src'         => get_theme_file_uri( 'assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2' ),
 *          ),
 *          array(
 *              'provider'    => 'local',
 *              'font_family' => 'Source Serif Pro',
 *              'font_weight' => '200 900',
 *              'font_style'  => 'italic',
 *              'src'         => get_theme_file_uri( 'assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2' ),
 *          ),
 *      )
 * );
 * </code>
 *
 * When requesting from the remote Google Fonts API service provider:
 * <code>
 * wp_register_webfonts(
 *      array(
 *          array(
 *              'provider'    => 'google',
 *              'font_family' => 'Source Serif Pro',
 *              'font_weight' => '200 900',
 *              'font_style'  => 'normal',
 *          ),
 *          array(
 *              'provider'    => 'google',
 *              'font_family' => 'Source Serif Pro',
 *              'font_weight' => '200 900',
 *              'font_style'  => 'italic',
 *          ),
 *      )
 * );
 * </code>
 *
 * @since 6.0.0
 *
 * @param array $webfonts Webfonts to be registered.
 *                        This contains an array of webfonts to be registered.
 *                        Each webfont is an array.
 *                        See {@see WP_Webfonts_Registry::register()} for a list of
 *                        supported arguments for each webfont.
 */
function wp_register_webfonts( array $webfonts = array() ) {
	foreach ( $webfonts as $webfont ) {
		wp_register_webfont( $webfont );
	}
}

/**
 * Registers a single webfont.
 *
 * Example of how to register Source Serif Pro font with font-weight range of 200-900:
 *
 * If the font file is contained within the theme:
 * ```
 * wp_register_webfont(
 *      array(
 *          'provider'    => 'local',
 *          'font_family' => 'Source Serif Pro',
 *          'font_weight' => '200 900',
 *          'font_style'  => 'normal',
 *          'src'         => get_theme_file_uri( 'assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2' ),
 *      )
 * );
 * ```
 *
 * When requesting from the remote Google Fonts API service provider:
 * ```
 * wp_register_webfonts(
 *      array(
 *          'provider'    => 'google',
 *          'font_family' => 'Source Serif Pro',
 *          'font_weight' => '200 900',
 *          'font_style'  => 'normal',
 *      )
 * );
 * ```
 *
 * @since 6.0.0
 *
 * @param array $webfont Webfont to be registered.
 *                       See {@see WP_Webfonts_Registry::register()} for a list of supported arguments.
 */
function wp_register_webfont( array $webfont ) {
	wp_webfonts()->register_font( $webfont );
}

/**
 * Registers a custom font service provider.
 *
 * A webfont provider contains the business logic for how to
 * interact with a remote font service and how to generate
 * the `@font-face` styles for that remote service.
 *
 * See the `WP_Webfonts_Google_Provider` for inspiration.
 *
 * How to register a custom font service provider:
 *    1. Load its class file into memory before registration.
 *    2. Pass the class' name to this function.
 *
 * For example, for a class named `My_Custom_Font_Service_Provider`:
 * ```
 *    wp_register_webfont_provider( My_Custom_Font_Service_Provider::class );
 * ```
 *
 * @since 6.0.0
 *
 * @param string $name      The provider's name.
 * @param string $classname The provider's class name.
 *                          The class should be a child of `WP_Webfonts_Provider`.
 *                          See {@see WP_Webfonts_Provider}.
 *
 * @return bool True when registered. False when provider does not exist.
 */
function wp_register_webfont_provider( $name, $classname ) {
	return wp_webfonts()->register_provider( $name, $classname );
}

/**
 * Gets all registered providers.
 *
 * Return an array of providers, each keyed by their unique
 * ID (i.e. the `$id` property in the provider's object) with
 * an instance of the provider (object):
 *     ID => provider instance
 *
 * Each provider contains the business logic for how to
 * process its specific font service (i.e. local or remote)
 * and how to generate the `@font-face` styles for its service.
 *
 * @since 6.0.0
 *
 * @return WP_Webfonts_Provider[] All registered providers,
 *                               each keyed by their unique ID.
 */
function wp_get_webfont_providers() {
	return wp_webfonts()->get_providers();
}

/**
 * Add webfonts mime types.
 */
add_filter(
	'mime_types',
	function( $mime_types ) {
		// Webfonts formats.
		$mime_types['woff2'] = 'font/woff2';
		$mime_types['woff']  = 'font/woff';
		$mime_types['ttf']   = 'font/ttf';
		$mime_types['eot']   = 'application/vnd.ms-fontobject';
		$mime_types['otf']   = 'application/x-font-opentype';

		return $mime_types;
	}
);
