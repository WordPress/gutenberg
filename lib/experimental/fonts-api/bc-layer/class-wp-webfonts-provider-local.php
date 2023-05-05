<?php
/**
 * Fonts API: Provider for locally-hosted fonts.
 *
 * Part of the backwards-compatibility (BC) layer for all
 * deprecated publicly exposed methods and functionality.
 *
 * This class/file will NOT be backported to Core. Rather for sites
 * using the previous API, it exists to prevent breakages, giving
 * developers time to upgrade their code.
 *
 * @package    WordPress
 * @subpackage Fonts
 * @since      X.X.X
 */

if ( class_exists( 'WP_Webfonts_Provider_Local' ) ) {
	return;
}

/**
 * A deprecated core bundled provider for generating `@font-face` styles
 * from locally-hosted font files.
 *
 * BACKPORT NOTE: Do not backport this file to Core.
 *
 * @since X.X.X
 * @deprecated GB 15.1 Use `WP_Fonts_Provider_Local` instead.
 */
class WP_Webfonts_Provider_Local extends WP_Webfonts_Provider {

	/**
	 * The provider's unique ID.
	 *
	 * @since 6.0.0
	 *
	 * @var string
	 */
	protected $id = 'local';

	/**
	 * Constructor.
	 *
	 * @since 6.1.0
	 */
	public function __construct() {
		_deprecated_function( __METHOD__, 'GB 15.1', 'WP_Fonts_Provider_Local' );

		if (
			function_exists( 'is_admin' ) && ! is_admin()
			&&
			function_exists( 'current_theme_supports' ) && ! current_theme_supports( 'html5', 'style' )
		) {
			$this->style_tag_atts = array( 'type' => 'text/css' );
		}
	}

	/**
	 * Gets the `@font-face` CSS styles for locally-hosted font files.
	 *
	 * This method does the following processing tasks:
	 *    1. Orchestrates an optimized `src` (with format) for browser support.
	 *    2. Generates the `@font-face` for all its webfonts.
	 *
	 * For example, when given these webfonts:
	 * <code>
	 * array(
	 *      'source-serif-pro.normal.200 900' => array(
	 *          'provider'    => 'local',
	 *          'font_family' => 'Source Serif Pro',
	 *          'font_weight' => '200 900',
	 *          'font_style'  => 'normal',
	 *          'src'         => 'https://example.com/wp-content/themes/twentytwentytwo/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2' ),
	 *      ),
	 *      'source-serif-pro.italic.400 900' => array(
	 *          'provider'    => 'local',
	 *          'font_family' => 'Source Serif Pro',
	 *          'font_weight' => '200 900',
	 *          'font_style'  => 'italic',
	 *          'src'         => 'https://example.com/wp-content/themes/twentytwentytwo/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2' ),
	 *      ),
	 * )
	 * </code>
	 *
	 * the following `@font-face` styles are generated and returned:
	 * <code>
	 *
	 * @font-face{
	 *      font-family:"Source Serif Pro";
	 *      font-style:normal;
	 *      font-weight:200 900;
	 *      font-stretch:normal;
	 *      src:local("Source Serif Pro"), url('/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2') format('woff2');
	 * }
	 * @font-face{
	 *      font-family:"Source Serif Pro";
	 *      font-style:italic;
	 *      font-weight:200 900;
	 *      font-stretch:normal;
	 *      src:local("Source Serif Pro"), url('/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2') format('woff2');
	 * }
	 * </code>
	 *
	 * @since X.X.X
	 *
	 * @return string The `@font-face` CSS.
	 */
	public function get_css() {
		$css = '';

		foreach ( $this->webfonts as $webfont ) {
			// Order the webfont's `src` items to optimize for browser support.
			$webfont = $this->order_src( $webfont );

			// Build the @font-face CSS for this webfont.
			$css .= '@font-face{' . $this->build_font_face_css( $webfont ) . '}';
		}

		return $css;
	}

	/**
	 * Order `src` items to optimize for browser support.
	 *
	 * @since 6.0.0
	 *
	 * @param array $webfont Webfont to process.
	 * @return array
	 */
	private function order_src( array $webfont ) {
		if ( ! is_array( $webfont['src'] ) ) {
			$webfont['src'] = (array) $webfont['src'];
		}

		$src         = array();
		$src_ordered = array();

		foreach ( $webfont['src'] as $url ) {
			// Add data URIs first.
			if ( str_starts_with( trim( $url ), 'data:' ) ) {
				$src_ordered[] = array(
					'url'    => $url,
					'format' => 'data',
				);
				continue;
			}
			$format         = pathinfo( $url, PATHINFO_EXTENSION );
			$src[ $format ] = $url;
		}

		// Add woff2.
		if ( ! empty( $src['woff2'] ) ) {
			$src_ordered[] = array(
				'url'    => $src['woff2'],
				'format' => 'woff2',
			);
		}

		// Add woff.
		if ( ! empty( $src['woff'] ) ) {
			$src_ordered[] = array(
				'url'    => $src['woff'],
				'format' => 'woff',
			);
		}

		// Add ttf.
		if ( ! empty( $src['ttf'] ) ) {
			$src_ordered[] = array(
				'url'    => $src['ttf'],
				'format' => 'truetype',
			);
		}

		// Add eot.
		if ( ! empty( $src['eot'] ) ) {
			$src_ordered[] = array(
				'url'    => $src['eot'],
				'format' => 'embedded-opentype',
			);
		}

		// Add otf.
		if ( ! empty( $src['otf'] ) ) {
			$src_ordered[] = array(
				'url'    => $src['otf'],
				'format' => 'opentype',
			);
		}
		$webfont['src'] = $src_ordered;

		return $webfont;
	}

	/**
	 * Builds the font-family's CSS.
	 *
	 * @since 6.0.0
	 *
	 * @param array $webfont Webfont to process.
	 * @return string This font-family's CSS.
	 */
	private function build_font_face_css( array $webfont ) {
		$css = '';

		// Wrap font-family in quotes if it contains spaces
		// and is not already wrapped in quotes.
		if (
			str_contains( $webfont['font-family'], ' ' ) &&
			! str_contains( $webfont['font-family'], '"' ) &&
			! str_contains( $webfont['font-family'], "'" )
		) {
			$webfont['font-family'] = '"' . $webfont['font-family'] . '"';
		}

		foreach ( $webfont as $key => $value ) {

			// Skip "provider", since it's for internal API use,
			// and not a valid CSS property.
			if ( 'provider' === $key ) {
				continue;
			}

			// Compile the "src" parameter.
			if ( 'src' === $key ) {
				$value = $this->compile_src( $webfont['font-family'], $value );
			}

			// If font-variation-settings is an array, convert it to a string.
			if ( 'font-variation-settings' === $key && is_array( $value ) ) {
				$value = $this->compile_variations( $value );
			}

			if ( ! empty( $value ) ) {
				$css .= "$key:$value;";
			}
		}

		return $css;
	}

	/**
	 * Compiles the `src` into valid CSS.
	 *
	 * @since 6.0.0
	 *
	 * @param string $font_family Font family.
	 * @param array  $value       Value to process.
	 * @return string The CSS.
	 */
	private function compile_src( $font_family, array $value ) {
		$src = "local($font_family)";

		foreach ( $value as $item ) {

			if ( str_starts_with( $item['url'], get_site_url() ) ) {
				$item['url'] = wp_make_link_relative( $item['url'] );
			}

			$src .= ( 'data' === $item['format'] )
				? ", url({$item['url']})"
				: ", url('{$item['url']}') format('{$item['format']}')";
		}
		return $src;
	}

	/**
	 * Compiles the font variation settings.
	 *
	 * @since 6.0.0
	 *
	 * @param array $font_variation_settings Array of font variation settings.
	 * @return string The CSS.
	 */
	private function compile_variations( array $font_variation_settings ) {
		$variations = '';

		foreach ( $font_variation_settings as $key => $value ) {
			$variations .= "$key $value";
		}

		return $variations;
	}
}
