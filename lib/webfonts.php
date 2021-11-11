<?php
/**
 * Webfonts API: Webfonts functions
 *
 * @since 5.9.0
 *
 * @package WordPress
 * @subpackage Webfonts
 */

/**
 * Instantiates the webfonts controller, if not already set, and returns it.
 *
 * @since 5.9.0
 *
 * @return WP_Webfonts_Controller Instance of the controller.
 */
function wp_webfonts() {
	static $instance;

	if ( ! $instance instanceof WP_Webfonts_Controller ) {
		$instance = new WP_Webfonts_Controller(
			new WP_Webfonts_Registry(
				new WP_Webfonts_Schema_Validator()
			),
			new WP_Webfonts_Provider_Registry()
		);
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
 * @since 5.9.0
 *
 * @param array $webfonts Webfonts to be registered.
 *                        This contains an array of webfonts to be registered.
 *                        Each webfont is an array.
 *                        See {@see WP_Webfonts_Registry::register()} for a list of
 *                        supported arguments for each webfont.
 */
function wp_register_webfonts( array $webfonts = array() ) {
	foreach ( $webfonts as $webfont ) {
		wp_webfonts()->webfonts()->register( $webfont );
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
 * @since 5.9.0
 *
 * @param array $webfont Webfont to be registered.
 *                       See {@see WP_Webfonts_Registry::register()} for a list of supported arguments.
 * @return string Registration key.
 */
function wp_register_webfont( array $webfont ) {
	return wp_webfonts()->webfonts()->register( $webfont );
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
 * @since 5.9.0
 *
 * @param string $classname The provider's class name.
 *                          The class should be a child of `WP_Webfonts_Provider`.
 *                          See {@see WP_Webfonts_Provider}.
 *
 * @return bool True when registered. False when provider does not exist.
 */
function wp_register_webfont_provider( $classname ) {
	return wp_webfonts()->providers()->register( $classname );
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
 * @since 5.9.0
 *
 * @return WP_Webfonts_Provider[] All registered providers,
 *                               each keyed by their unique ID.
 */
function wp_get_webfont_providers() {
	return wp_webfonts()->providers()->get_all_registered();
}
