<?php
/**
 * REST API: Gutenberg_REST_Pattern_Directory_Controller_6_0 class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Controller which provides REST endpoint for block patterns from wordpress.org/patterns.
 */
class Gutenberg_REST_Pattern_Directory_Controller_6_0 extends WP_REST_Pattern_Directory_Controller {
	/**
	 * Include a hash of the query args, so that different requests are stored in
	 * separate caches.
	 *
	 * MD5 is chosen for its speed, low-collision rate, universal availability, and to stay
	 * under the character limit for `_site_transient_timeout_{...}` keys.
	 *
	 * @link https://stackoverflow.com/questions/3665247/fastest-hash-for-non-cryptographic-uses
	 *
	 * @since 6.0.0
	 * @todo This should be removed when the minimum required WordPress version is >= 6.0.
	 *
	 * @param array $query_args Query arguments to generate a transient key from.
	 * @return string Transient key.
	 */
	protected function get_transient_key( $query_args ) {
		if ( method_exists( get_parent_class( $this ), __FUNCTION__ ) ) {
			return parent::get_transient_key( $query_args );
		}

		if ( isset( $query_args['slug'] ) ) {
			// This is an additional precaution because the "sort" function expects an array.
			$query_args['slug'] = wp_parse_list( $query_args['slug'] );

			// Empty arrays should not affect the transient key.
			if ( empty( $query_args['slug'] ) ) {
				unset( $query_args['slug'] );
			} else {
				// Sort the array so that the transient key doesn't depend on the order of slugs.
				sort( $query_args['slug'] );
			}
		}

		return 'wp_remote_block_patterns_' . md5( serialize( $query_args ) );
	}
}
