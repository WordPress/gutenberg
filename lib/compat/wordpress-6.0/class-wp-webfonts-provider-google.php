<?php
/**
 * Webfonts API: Provider for webfonts hosted on google-fonts.
 *
 * @package    WordPress
 * @subpackage WebFonts
 * @since      6.0
 */

/**
 * A core bundled provider for generating `@font-face` styles
 * from google-fonts.
 *
 * This provider will get the font-files from the Google-Fonts API,
 * and then store them locally so that they can then be used from the local provider.
 *
 * All know-how (business logic) for how to interact with and
 * generate styles from google-hosted font files is contained
 * in this provider.
 *
 * @since 6.0
 */
class WP_Webfonts_Provider_Google extends WP_Webfonts_Provider_Local {

	/**
	 * Sets this provider's webfonts property.
	 *
	 * The API's Controller passes this provider's webfonts
	 * for processing here in the provider.
	 *
	 * @since 6.0
	 *
	 * @param array[] $webfonts Registered webfonts.
	 */
	public function set_webfonts( array $webfonts ) {

		// Set the initial fonts array from the API.
		$this->webfonts = $webfonts;

		// Build an array of URLs to fetch the font files from.
		$urls = $this->build_collection_api_urls();

		// Build the collection of local webfonts.
		$local_webfonts = array();
		foreach ( $urls as $url ) {
			$local_webfonts = array_merge( $local_webfonts, $this->get_local_webfonts_from_url( $url ) );
		}

		// Replace the API webfonts with the local webfonts.
		$this->webfonts = $local_webfonts;
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
	 * @since 6.0
	 *
	 * @return array Collection of font-family urls.
	 */
	protected function build_collection_api_urls() {
		$font_families_urls = array();

		/*
		 * Iterate over each font-family group to build the Google Fonts API URL
		 * for that specific family. Each is added to the collection of URLs to be
		 * returned to the `get_local_webfonts_from_url()` method for the remote request.
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
			$font_families_urls[] = 'https://fonts.googleapis.com/css2?family=' . implode( '&family=', $url_parts ) . '&display=' . $font_display;
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
	 * @since 6.0
	 *
	 * @return array[][] Webfonts organized by font-display and then font-family.
	 */
	protected function organize_webfonts() {
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
	 * @since 6.0
	 *
	 * @param array $webfonts Webfonts to process.
	 * @return array[] {
	 *    The font-weights grouped by font-style.
	 *
	 *    @type array $normal_weights  Individual font-weight values for 'normal' font-style.
	 *    @type array $italic_weights  Individual font-weight values for 'italic' font-style.
	 * }
	 */
	protected function collect_font_weights( array $webfonts ) {
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
	 * @since 6.0
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

	/**
	 * Get the local webfonts array from a remote URL.
	 *
	 * @since 6.0
	 *
	 * @param string $remote_url The remote URL.
	 *
	 * @return array Returns an array of webfonts which can then be passed-on to the local provider.
	 */
	private function get_local_webfonts_from_url( $remote_url = '' ) {

		// Try to get the cached result.
		$cache_key = 'google_fonts_' . md5( $remote_url );
		$cached    = get_site_transient( $cache_key );

		// If the result was cached, return it.
		if ( false !== $cached ) {
			return $cached;
		}

		// Get the remote URL contents.
		$response = wp_remote_get(
			$remote_url,
			array(
				// Use a modern user-agent, to get woff2 files.
				'user-agent' => 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:73.0) Gecko/20100101 Firefox/73.0',
			)
		);

		// Bail if there was an error.
		if ( is_wp_error( $response ) ) {
			// Cache for an hour to prevent repeated requests.
			set_site_transient( $cache_key, array(), HOUR_IN_SECONDS );
			return array();
		}

		// Get the CSS from the response.
		$remote_styles = wp_remote_retrieve_body( $response );

		// Bail if the remote response was not a CSS file.
		if ( false === strpos( wp_remote_retrieve_header( $response, 'content-type' ), 'text/css' ) ) {
			// Cache for an hour to prevent repeated requests.
			set_site_transient( $cache_key, array(), HOUR_IN_SECONDS );
			return array();
		}

		// Get an array of all files from the CSS.
		$font_faces       = explode( '@font-face', $remote_styles );
		$local_font_faces = array();

		// Loop all font-face declarations.
		foreach ( $font_faces as $font_face ) {
			// Make sure to only process styles inside this declaration.
			$style = explode( '}', $font_face )[0];

			// Create an array of key => value pairs from the CSS.
			$properties = explode( ';', $style );

			$font_props = array();
			foreach ( $properties as $property ) {

				// Cleanup the property.
				$property = str_replace( '{', '', $property );
				$property = trim( $property );

				// Get an array of font-files.
				preg_match_all( '/url\(.*?\)/i', $style, $matched_font_files );

				// Sanity check.
				if ( empty( $property ) || ! strpos( $property, ':' ) ) {
					continue;
				}

				// Get the property name and value.
				$property = explode( ':', $property );
				$property = array_map( 'trim', $property );

				// For "src", use the value from the regex.
				if ( 'src' === $property[0] ) {
					$property[1] = $matched_font_files[0][0];
				}

				// Unquote the font-family.
				if ( 'font-family' === $property[0] ) {
					$property[1] = str_replace( array( '"', "'" ), '', $property[1] );
				}

				$font_props[ $property[0] ] = $property[1];
			}

			// Sanity check.
			if ( empty( $font_props['font-family'] ) || empty( $font_props['src'] ) ) {
				continue;
			}

			// Get the local file URL.
			$local_file_url = $this->get_local_file_url(
				rtrim( ltrim( $font_props['src'], 'url(' ), ')' ),
				$font_props['font-family']
			);

			// Skip if the local file URL is false.
			if ( ! $local_file_url ) {
				continue;
			}

			$font_props['src'] = array( $local_file_url );

			// Add the font to the array of fonts that need to be passed-on to the local provider.
			$local_font_faces[] = $font_props;
		}

		// Cache for a month.
		set_site_transient( $cache_key, $local_font_faces, MONTH_IN_SECONDS );
		return $local_font_faces;
	}

	/**
	 * Get the local file URL for a given remote font-file.
	 *
	 * @since 6.0
	 *
	 * @param string $url  The remote URL.
	 * @param string $font_family The font family.
	 *
	 * @return string|false The local file URL on success, false on failure.
	 */
	protected function get_local_file_url( $url, $font_family ) {

		$font_family_slug = trim( str_replace( array( '"', "'", ';' ), '', $font_family ) );
		$font_family_slug = sanitize_key( strtolower( str_replace( ' ', '-', $font_family ) ) );

		// The folder path for this font-family.
		$folder_path = WP_CONTENT_DIR . "/fonts/$font_family_slug";

		// Get the filename.
		$filename = basename( wp_parse_url( $url, PHP_URL_PATH ) );

		// Check if the file already exists.
		if ( file_exists( "$folder_path/$filename" ) ) {
			return str_replace( WP_CONTENT_DIR, WP_CONTENT_URL, "$folder_path/$filename" );
		}

		// Get the filesystem.
		// This will be needed to perform all the file operations required to create the local files.
		global $wp_filesystem;
		if ( ! $wp_filesystem ) {
			if ( ! function_exists( 'WP_Filesystem' ) ) {
				require_once wp_normalize_path( ABSPATH . '/wp-includes/pluggable.php' );
				require_once wp_normalize_path( ABSPATH . '/wp-admin/includes/file.php' );
			}
			WP_Filesystem();
		}

		// If the required folders do not exist, create them.
		$fs_chmod_dir = defined( 'FS_CHMOD_DIR' ) ? FS_CHMOD_DIR : ( 0755 & ~ umask() );
		if ( ! file_exists( WP_CONTENT_DIR . '/fonts' ) ) {
			$wp_filesystem->mkdir( WP_CONTENT_DIR . '/fonts', $fs_chmod_dir );
		}
		if ( ! file_exists( $folder_path ) ) {
			$wp_filesystem->mkdir( $folder_path, $fs_chmod_dir );
		}

		// Download file to temporary location.
		$tmp_path = download_url( $url );

		// Make sure there were no errors.
		if ( is_wp_error( $tmp_path ) ) {
			return false;
		}

		// Move temp file to final destination.
		$success = $wp_filesystem->move( $tmp_path, "$folder_path/$filename", true );

		// If for some reason the file could not be moved, return false.
		if ( ! $success ) {
			return false;
		}

		return str_replace( WP_CONTENT_DIR, WP_CONTENT_URL, "$folder_path/$filename" );
	}
}
