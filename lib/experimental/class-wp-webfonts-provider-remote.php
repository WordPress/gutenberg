<?php
/**
 * Webfonts API: Provider for remote-hosted fonts.
 *
 * @package    WordPress
 * @subpackage WebFonts
 * @since      6.0.0
 */

if ( class_exists( 'WP_Webfonts_Provider_Remote' ) ) {
	return;
}

/**
 * A core bundled provider for providing `@font-face` styles
 * from remote-hosted font files.
 *
 * @since 6.1.0
 */
class WP_Webfonts_Provider_Remote extends WP_Webfonts_Provider {

	/**
	 * The provider's unique ID.
	 *
	 * @since 6.1.0
	 *
	 * @var string
	 */
	protected $id = 'remote';

	/**
	 * Provides the `@font-face` CSS styles for remote-hosted font files.
	 *
	 * This method combines the `@font-face` styles from all src URLs, caches
	 * them and returns them
	 *
	 * For example, when given these webfonts:
	 * <code>
	 * array(
	 *      'bodoni.moda' => array(
	 *          'provider'    => 'remote',
	 *          'font_family' => 'Bodoni Moda',
	 *          'src'         => 'https://example.com/fonts/?family=Bodoni+Moda:ital,wght@0,400..900;1,400..900' ),
	 *      ),
	 * )
	 * </code>
	 *
	 * the styles will be fetched and provided from the given URL
	 *
	 * @since 6.1.0
	 *
	 * @return string The `@font-face` CSS.
	 */
	public function get_css() {
		$css = '';

		foreach ( $this->webfonts as $webfont ) {
			foreach ( $webfont['src'] as $src ) {
				$css .= $this->get_cached_remote_styles( 'remote_fonts_' . md5( $src ), $src );
			}
		}
		return $css;
	}

	/**
	 * Gets cached CSS from a remote URL.
	 *
	 * @param string $id   An ID used to cache the styles.
	 * @param string $url  The URL to fetch.
	 * @return string The styles.
	 */
	protected function get_cached_remote_styles( $id, $url ) {
		$css = \get_site_transient( $id );

		// Get remote response and cache the CSS if it hasn't been cached already.
		if ( false === $css ) {
			$css = $this->get_remote_styles( $url );

			/*
			* Early return if the request failed.
			* Cache an empty string for 60 seconds to avoid bottlenecks.
			*/
			if ( empty( $css ) ) {
				\set_site_transient( $id, '', MINUTE_IN_SECONDS );
				return '';
			}

			// Cache the CSS for a month.
			\set_site_transient( $id, $css, MONTH_IN_SECONDS );
		}

		return $css;
	}

	/**
	 * Gets styles from the remote font service via the given URL.
	 *
	 * @param string $url  The URL to fetch.
	 * @return string The styles on success. Empty string on failure.
	 */
	protected function get_remote_styles( $url ) {
		// Use a modern user-agent, to get woff2 files.
		$args = array( 'user-agent' => 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:73.0) Gecko/20100101 Firefox/73.0' );

		// Get the remote URL contents.
		$response = \wp_safe_remote_get( $url, $args );

		// Early return if the request failed.
		if ( \is_wp_error( $response ) || 200 !== \wp_remote_retrieve_response_code( $response ) ) {
			return '';
		}

		// Get the response body.
		return \wp_remote_retrieve_body( $response );
	}

}
