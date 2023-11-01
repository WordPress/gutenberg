<?php
/**
 * Webfonts API: Provider for locally-hosted fonts.
 *
 * @package    WordPress
 * @subpackage Fonts API
 * @since      X.X.X
 */

if ( class_exists( 'WP_Fonts_Provider_Local' ) ) {
	return;
}

/**
 * A core bundled provider for generating `@font-face` styles
 * from locally-hosted font files.
 *
 * This provider builds an optimized `src` (for browser support)
 * and then generates the `@font-face` styles.
 *
 * All know-how (business logic) for how to interact with and
 * generate styles from locally-hosted font files is contained
 * in this provider.
 *
 * @since X.X.X
 */
class WP_Fonts_Provider_Local extends WP_Fonts_Provider {

	/**
	 * The provider's unique ID.
	 *
	 * @since X.X.X
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
	 *    2. Generates the `@font-face` for all its fonts.
	 *
	 * @since X.X.X
	 *
	 * @return string The `@font-face` CSS.
	 */
	public function get_css() {
		$css = '';

		foreach ( $this->fonts as $font ) {
			// Order the font's `src` items to optimize for browser support.
			$font = $this->order_src( $font );

			// Build the @font-face CSS for this font.
			$css .= '@font-face{' . $this->build_font_face_css( $font ) . '}';
		}

		return $css;
	}

	/**
	 * Order `src` items to optimize for browser support.
	 *
	 * @since X.X.X
	 *
	 * @param array $font Font to process.
	 * @return array
	 */
	private function order_src( array $font ) {
		if ( ! is_array( $font['src'] ) ) {
			$font['src'] = (array) $font['src'];
		}

		$src         = array();
		$src_ordered = array();

		foreach ( $font['src'] as $url ) {
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
		$font['src'] = $src_ordered;

		return $font;
	}

	/**
	 * Builds the font-family's CSS.
	 *
	 * @since X.X.X
	 *
	 * @param array $font Font to process.
	 * @return string This font-family's CSS.
	 */
	private function build_font_face_css( array $font ) {
		$css = '';

		// Wrap font-family in quotes if it contains spaces
		// and is not already wrapped in quotes.
		if (
			str_contains( $font['font-family'], ' ' ) &&
			! str_contains( $font['font-family'], '"' ) &&
			! str_contains( $font['font-family'], "'" )
		) {
			$font['font-family'] = '"' . $font['font-family'] . '"';
		}

		foreach ( $font as $key => $value ) {

			// Skip "provider", since it's for internal API use,
			// and not a valid CSS property.
			if ( 'provider' === $key ) {
				continue;
			}

			// Compile the "src" parameter.
			if ( 'src' === $key ) {
				$value = $this->compile_src( $value );
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
	 * @since X.X.X
	 *
	 * @param array $value Value to process.
	 * @return string The CSS.
	 */
	private function compile_src( array $value ) {
		$src = '';

		foreach ( $value as $item ) {
			$src .= ( 'data' === $item['format'] )
				? ", url({$item['url']})"
				: ", url('{$item['url']}') format('{$item['format']}')";
		}

		$src = ltrim( $src, ', ' );
		return $src;
	}

	/**
	 * Compiles the font variation settings.
	 *
	 * @since X.X.X
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
