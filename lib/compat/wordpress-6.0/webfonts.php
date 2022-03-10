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
	global $wp_webfonts;

	if ( ! $wp_webfonts instanceof WP_Webfonts ) {
		$wp_webfonts = new WP_Webfonts();
		$wp_webfonts->init();
	}

	return $wp_webfonts;
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
 *              'id'          => 'source-serif-200-900-normal',
 *              'provider'    => 'local',
 *              'font_family' => 'Source Serif Pro',
 *              'font_weight' => '200 900',
 *              'font_style'  => 'normal',
 *              'src'         => get_theme_file_uri( 'assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2' ),
 *          ),
 *          array(
 *              'id'          => 'source-serif-200-900-italic',
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
 * Webfonts should be registered in the `after_setup_theme` hook.
 *
 * @since 6.0.0
 *
 * @param array $webfonts Webfonts to be registered.
 *                        This contains an array of webfonts to be registered.
 *                        Each webfont is an array.
 */
function wp_register_webfonts( $webfonts = array() ) {
	foreach ( $webfonts as $webfont ) {
		wp_register_webfont( $webfont['id'], $webfont );
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
 *      'source-serif-pro-normal',
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
 * @since 6.0.0
 *
 * @param string $id The webfont id.
 * @param array  $webfont Webfont to be registered.
 */
function wp_register_webfont( $id, $webfont ) {
	wp_webfonts()->register_font( $id, $webfont );
}

/**
 * Enqueues a collection of webfonts.
 *
 * Example of how to enqueue Source Serif Pro font with font-weight range of 200-900
 * and font-style of normal and italic:
 *
 * <code>
 * wp_enqueue_webfonts(
 *      array(
 *          'some-already-registered-font', // This requires the font to be registered beforehand.
 *          array(
 *              'id'          => 'source-serif-200-900-normal',
 *              'provider'    => 'local',
 *              'font_family' => 'Source Serif Pro',
 *              'font_weight' => '200 900',
 *              'font_style'  => 'normal',
 *              'src'         => get_theme_file_uri( 'assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2' ),
 *          ),
 *          array(
 *              'id'          => 'source-serif-200-900-italic',
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
 * Webfonts should be enqueued in the `after_setup_theme` hook.
 *
 * @since 6.0.0
 *
 * @param array $webfonts Webfonts to be enqueued.
 *                        This contains an array of webfonts to be enqueued.
 *                        Each webfont is an array.
 */
function wp_enqueue_webfonts( $webfonts = array() ) {
	foreach ( $webfonts as $webfont ) {
		if ( is_string( $webfont ) ) {
			wp_enqueue_webfont( $webfont );
			continue;
		}

		wp_enqueue_webfont( $webfont['id'], $webfont );
	}
}

/**
 * Enqueue a single webfont.
 *
 * Register the webfont if $webfont is provided and enqueues.
 *
 * Example of how to register Source Serif Pro font with font-weight range of 200-900:
 *
 * If the font file is contained within the theme:
 * ```
 * wp_enqueue_webfont(
 *      'source-serif-pro-normal',
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
 * @since 6.0.0
 *
 * @param string     $id The webfont id.
 * @param array|null $webfont Webfont to be enqueued. Can be omitted if the font was registered beforehand.
 */
function wp_enqueue_webfont( $id, $webfont = null ) {
	wp_webfonts()->enqueue_font( $id, $webfont );
}

/**
 * Registers a custom font service provider.
 *
 * A webfont provider contains the business logic for how to
 * interact with a remote font service and how to generate
 * the `@font-face` styles for that remote service.
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
