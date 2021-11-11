<?php
/**
 * Webfonts API: Google Fonts provider.
 *
 * @since      5.9.0
 * @subpackage WebFonts
 * @package    WordPress
 */

/**
 * A core bundled provider for making remote requests to the
 * Google Fonts API service and generating `@font-face` styles.
 *
 * This provider builds optimized request URL(s) for its webfonts,
 * makes a remote request to the Google Fonts API service, and
 * then generates the `@font-face` styles.
 *
 * When enqueued styles are rendered, the Controller passes its
 * 'google' webfonts {@see WP_Webfonts_Provider::set_setfonts()}
 * and then triggers {@see WP_Webfonts_Google_Provider::get_css()}
 * the processing to transform them into `@font-face` styles.
 *
 * All know-how (business logic) for how to interact with and
 * generate styles from Google Fonts API is contained in this provider.
 *
 * @since 5.9.0
 */
class WP_Webfonts_Google_Provider extends WP_Webfonts_Provider {

	/**
	 * The provider's unique ID.
	 *
	 * @since 5.9.0
	 *
	 * @var string
	 */
	protected $id = 'google';

	/**
	 * The provider's root URL.
	 *
	 * @since 5.9.0
	 * @var string
	 */
	protected $root_url = 'https://fonts.googleapis.com/css2';

	/**
	 * Array of resources hints, used to render the resource `<link>` in the `<head>`.
	 *
	 * @since 5.9.0
	 *
	 * @var string[] See {@see WP_Webfonts_Provider::$resource_hints} for
	 *               the list of resource hints.
	 */
	protected $resource_hints = array(
		'preconnect' => array(
			array(
				'href'        => 'https://fonts.gstatic.com',
				'crossorigin' => 'anonymous',
			),
		),
	);

	/**
	 * Gets the `@font-face` CSS styles for Google Fonts.
	 *
	 * This method does the following processing tasks:
	 *    1. Orchestrates an optimized Google Fonts API URL for each font-family.
	 *    2. Caches each URL, if not already cached.
	 *    3. Does a remote request to the Google Fonts API service to fetch the styles.
	 *    4. Generates the `@font-face` for all its webfonts.
	 *
	 * @since 5.9.0
	 *
	 * @return string The `@font-face` CSS.
	 */
	public function get_css() {
		$css  = '';
		$urls = $this->build_collection_api_urls();

		foreach ( $urls as $url ) {
			$css .= $this->get_cached_remote_styles( 'google_fonts_' . md5( $url ), $url );
		}

		return $css;
	}

	/**
	 * Builds the Google Fonts URL for a collection of webfonts.
	 *
	 * For example, if given the following webfonts:
	 * ```
	 * array(
	 *      array(
	 *          'font-family' => 'Source Serif Pro',
	 *          'font-style'  => 'normal',
	 *          'font-weight' => '200 400',
	 *      ),
	 *      array(
	 *          'font-family' => 'Source Serif Pro',
	 *          'font-style'  => 'italic',
	 *          'font-weight' => '400 600',
	 *      ),
	 * )
	 * ```
	 * then the returned collection would be:
	 * ```
	 * array(
	 *      'https://fonts.googleapis.com/css2?family=Source+Serif+Pro:ital,wght@0,200;0,300;0,400;1,400;1,500;1,600&display=fallback'
	 * )
	 * ```
	 *
	 * @since 5.9.0
	 *
	 * @return array Collection of font-family urls.
	 */
	private function build_collection_api_urls() {
		$font_families_urls = array();

		/*
		 * Iterate over each font-family group to build the Google Fonts API URL
		 * for that specific family. Each is added to the collection of URLs to be
		 * returned to the `get_css()` method for making the remote request.
		 */
		foreach ( $this->organize_webfonts() as $font_display => $font_families ) {
			$url_parts = array();
			foreach ( $font_families as $font_family => $webfonts ) {
				list( $normal_weights, $italic_weights ) = $this->collect_font_weights( $webfonts );

				// Build the font-style with its font-weights.
				$url_part = urlencode( $font_family );
				if ( empty( $italic_weights ) && ! empty( $normal_weights ) ) {
					$url_part .= ':wght@' . implode( ';', $normal_weights );
				} elseif ( ! empty( $italic_weights ) && empty( $normal_weights ) ) {
					$url_part .= ':ital,wght@1,' . implode( ';', $normal_weights );
				} elseif ( ! empty( $italic_weights ) && ! empty( $normal_weights ) ) {
					$url_part .= ':ital,wght@0,' . implode( ';0,', $normal_weights ) . ';1,' . implode( ';1,', $italic_weights );
				}

				// Add it to the collection.
				$url_parts[] = $url_part;
			}

			// Build the URL for this font-family and add it to the collection.
			$font_families_urls[] = $this->root_url . '?family=' . implode( '&family=', $url_parts ) . '&display=' . $font_display;
		}

		return $font_families_urls;
	}

	/**
	 * Organizes the webfonts by font-display and then font-family.
	 *
	 * To optimizing building the URL for the Google Fonts API request,
	 * this method organizes the webfonts first by font-display and then
	 * by font-family.
	 *
	 * For example, if given the following webfonts:
	 * ```
	 * array(
	 *      array(
	 *          'font-family' => 'Source Serif Pro',
	 *          'font-style'  => 'normal',
	 *          'font-weight' => '200 400',
	 *      ),
	 *      array(
	 *          'font-family' => 'Source Serif Pro',
	 *          'font-style'  => 'italic',
	 *          'font-weight' => '400 600',
	 *      ),
	 * )
	 * ```
	 * then the returned collection would be:
	 * ```
	 * array(
	 *      'fallback' => array(
	 *          'Source Serif Pro' => array(
	 *              array(
	 *                  'font-family' => 'Source Serif Pro',
	 *                  'font-style'  => 'normal',
	 *                  'font-weight' => '200 400',
	 *              ),
	 *              array(
	 *                  'font-family' => 'Source Serif Pro',
	 *                  'font-style'  => 'italic',
	 *                  'font-weight' => '400 600',
	 *              ),
	 *         ),
	 *      ),
	 * )
	 *
	 * @since 5.9.0
	 *
	 * @return array[][] Webfonts organized by font-display and then font-family.
	 */
	private function organize_webfonts() {
		$font_display_groups = array();

		/*
		 * Group by font-display.
		 * Each font-display will need to be a separate request.
		 */
		foreach ( $this->webfonts as $webfont ) {
			if ( ! isset( $font_display_groups[ $webfont['font-display'] ] ) ) {
				$font_display_groups[ $webfont['font-display'] ] = array();
			}
			$font_display_groups[ $webfont['font-display'] ][] = $webfont;
		}

		/*
		 * Iterate over each font-display group and group by font-family.
		 * Multiple font-families can be combined in the same request,
		 * but their params need to be grouped.
		 */
		foreach ( $font_display_groups as $font_display => $font_display_group ) {
			$font_families = array();

			foreach ( $font_display_group as $webfont ) {
				if ( ! isset( $font_families[ $webfont['font-family'] ] ) ) {
					$font_families[ $webfont['font-family'] ] = array();
				}
				$font_families[ $webfont['font-family'] ][] = $webfont;
			}

			$font_display_groups[ $font_display ] = $font_families;
		}

		return $font_display_groups;
	}

	/**
	 * Collects all font-weights grouped by 'normal' and 'italic' font-style.
	 *
	 * For example, if given the following webfonts:
	 * ```
	 * array(
	 *      array(
	 *          'font-family' => 'Source Serif Pro',
	 *          'font-style'  => 'normal',
	 *          'font-weight' => '200 400',
	 *      ),
	 *      array(
	 *          'font-family' => 'Source Serif Pro',
	 *          'font-style'  => 'italic',
	 *          'font-weight' => '400 600',
	 *      ),
	 * )
	 * ```
	 * Then the returned collection would be:
	 * ```
	 * array(
	 *      array( 200, 300, 400 ),
	 *      array( 400, 500, 600 ),
	 * )
	 * ```
	 *
	 * @since 5.9.0
	 *
	 * @param array $webfonts Webfonts to process.
	 * @return array[] {
	 *    The font-weights grouped by font-style.
	 *
	 *    @type array $normal_weights  Individual font-weight values for 'normal' font-style.
	 *    @type array $italic_weights  Individual font-weight values for 'italic' font-style.
	 * }
	 */
	private function collect_font_weights( array $webfonts ) {
		$normal_weights = array();
		$italic_weights = array();

		foreach ( $webfonts as $webfont ) {
			$font_weights = $this->get_font_weights( $webfont['font-weight'] );
			// Skip this webfont if it does not have a font-weight defined.
			if ( empty( $font_weights ) ) {
				continue;
			}

			// Add the individual font-weights to the end of font-style array.
			if ( 'italic' === $webfont['font-style'] ) {
				array_push( $italic_weights, ...$font_weights );
			} else {
				array_push( $normal_weights, ...$font_weights );
			}
		}

		// Remove duplicates.
		$normal_weights = array_unique( $normal_weights );
		$italic_weights = array_unique( $italic_weights );

		return array( $normal_weights, $italic_weights );
	}

	/**
	 * Converts the given string of font-weight into an array of individual weight values.
	 *
	 * When given a single font-weight, the value is wrapped into an array.
	 *
	 * A range of font-weights is specified as '400 600' with the lightest value first,
	 * a space, and then the heaviest value last.
	 *
	 * When given a range of font-weight values, the range is converted into individual
	 * font-weight values. For example, a range of '400 600' is converted into
	 * `array( 400, 500, 600 )`.
	 *
	 * @since 5.9.0
	 *
	 * @param string $font_weights The font-weights string.
	 * @return array The font-weights array.
	 */
	private function get_font_weights( $font_weights ) {
		$font_weights = trim( $font_weights );

		// A single font-weight.
		if ( false === strpos( $font_weights, ' ' ) ) {
			return array( $font_weights );
		}

		// Process a range of font-weight values that are delimited by ' '.
		$font_weights = explode( ' ', $font_weights );

		// If there are 2 values, treat them as a range.
		if ( 2 === count( $font_weights ) ) {
			$font_weights = range( (int) $font_weights[0], (int) $font_weights[1], 100 );
		}

		return $font_weights;
	}
}
