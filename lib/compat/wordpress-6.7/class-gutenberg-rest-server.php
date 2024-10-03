<?php
/**
 * A custom REST server for Gutenberg.
 *
 * @package gutenberg
 * @since   6.7.0
 */

class Gutenberg_REST_Server extends WP_REST_Server {
	/**
	 * Converts a response to data to send.
	 *
	 * @since 4.4.0
	 * @since 5.4.0 The `$embed` parameter can now contain a list of link relations to include.
	 *
	 * @param WP_REST_Response $response Response object.
	 * @param bool|string[]    $embed    Whether to embed all links, a filtered list of link relations, or no links.
	 * @return array {
	 *     Data with sub-requests embedded.
	 *
	 *     @type array $_links    Links.
	 *     @type array $_embedded Embedded objects.
	 * }
	 */
	// @core-merge: Do not merge. The method is copied here to fix the inheritance issue.
	public function response_to_data( $response, $embed ) {
		$data  = $response->get_data();
		$links = static::get_compact_response_links( $response );

		if ( ! empty( $links ) ) {
			// Convert links to part of the data.
			$data['_links'] = $links;
		}

		if ( $embed ) {
			$this->embed_cache = array();
			// Determine if this is a numeric array.
			if ( wp_is_numeric_array( $data ) ) {
				foreach ( $data as $key => $item ) {
					$data[ $key ] = $this->embed_links( $item, $embed );
				}
			} else {
				$data = $this->embed_links( $data, $embed );
			}
			$this->embed_cache = array();
		}

		return $data;
	}

	/**
	 * Retrieves links from a response.
	 *
	 * Extracts the links from a response into a structured hash, suitable for
	 * direct output.
	 *
	 * @since 4.4.0
	 * @since 6.7.0 The `targetHints` property to the `self` link object was added.
	 *
	 * @param WP_REST_Response $response Response to extract links from.
	 * @return array Map of link relation to list of link hashes.
	 */
	public static function get_response_links( $response ) {
		$links = $response->get_links();

		if ( empty( $links ) ) {
			return array();
		}

		$server = rest_get_server();

		// Convert links to part of the data.
		$data = array();
		foreach ( $links as $rel => $items ) {
			$data[ $rel ] = array();

			foreach ( $items as $item ) {
				$attributes         = $item['attributes'];
				$attributes['href'] = $item['href'];

				if ( 'self' !== $rel ) {
					$data[ $rel ][] = $attributes;
					continue;
				}

				// Prefer targetHints that were specifically designated by the developer.
				if ( isset( $attributes['targetHints']['allow'] ) ) {
					$data[ $rel ][] = $attributes;
					continue;
				}

				$request = WP_REST_Request::from_url( $item['href'] );
				if ( ! $request ) {
					$data[ $rel ][] = $attributes;
					continue;
				}

				$matched = $server->match_request_to_handler( $request );

				if ( is_wp_error( $matched ) ) {
					$data[ $rel ][] = $attributes;
					continue;
				}

				if ( is_wp_error( $request->has_valid_params() ) ) {
					$data[ $rel ][] = $attributes;
					continue;
				}

				if ( is_wp_error( $request->sanitize_params() ) ) {
					$data[ $rel ][] = $attributes;
					continue;
				}

				list( $route, $handler ) = $matched;

				$response = new WP_REST_Response();
				$response->set_matched_route( $route );
				$response->set_matched_handler( $handler );
				$headers = rest_send_allow_header( $response, $server, $request )->get_headers();

				foreach ( $headers as $name => $value ) {
					$name                               = WP_REST_Request::canonicalize_header_name( $name );
					$attributes['targetHints'][ $name ] = array_map( 'trim', explode( ',', $value ) );
				}

				$data[ $rel ][] = $attributes;
			}
		}

		return $data;
	}

	/**
	 * Retrieves the CURIEs (compact URIs) used for relations.
	 *
	 * Extracts the links from a response into a structured hash, suitable for
	 * direct output.
	 *
	 * @since 4.5.0
	 *
	 * @param WP_REST_Response $response Response to extract links from.
	 * @return array Map of link relation to list of link hashes.
	 */
	// @core-merge: Do not merge. The method is copied here to fix the inheritance issue.
	public static function get_compact_response_links( $response ) {
		$links = static::get_response_links( $response );

		if ( empty( $links ) ) {
			return array();
		}

		$curies      = $response->get_curies();
		$used_curies = array();

		foreach ( $links as $rel => $items ) {

			// Convert $rel URIs to their compact versions if they exist.
			foreach ( $curies as $curie ) {
				$href_prefix = substr( $curie['href'], 0, strpos( $curie['href'], '{rel}' ) );
				if ( ! str_starts_with( $rel, $href_prefix ) ) {
					continue;
				}

				// Relation now changes from '$uri' to '$curie:$relation'.
				$rel_regex = str_replace( '\{rel\}', '(.+)', preg_quote( $curie['href'], '!' ) );
				preg_match( '!' . $rel_regex . '!', $rel, $matches );
				if ( $matches ) {
					$new_rel                       = $curie['name'] . ':' . $matches[1];
					$used_curies[ $curie['name'] ] = $curie;
					$links[ $new_rel ]             = $items;
					unset( $links[ $rel ] );
					break;
				}
			}
		}

		// Push the curies onto the start of the links array.
		if ( $used_curies ) {
			$links['curies'] = array_values( $used_curies );
		}

		return $links;
	}
}
