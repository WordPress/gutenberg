<?php
/**
 * REST API: WP_REST_URL_Details_Controller class
 *
 * @package Gutenberg
 */

/**
 * Controller which provides REST endpoint for retrieving information
 * from a remote site's HTML response.
 *
 * @since 5.?.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_URL_Details_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'url-details';
	}

	/**
	 * Registers the necessary REST API routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'parse_url_details' ),
					'args'                => array(
						'url' => array(
							'required'          => true,
							'description'       => __( 'The URL to process.', 'gutenberg' ),
							'validate_callback' => 'wp_http_validate_url',
							'sanitize_callback' => 'esc_url_raw',
							'type'              => 'string',
							'format'            => 'uri',
						),
					),
					'permission_callback' => array( $this, 'permissions_check' ),
					'schema'              => array( $this, 'get_public_item_schema' ),
				),
			)
		);
	}

	/**
	 * Get the schema for the endpoint.
	 *
	 * @return array the schema.
	 */
	public function get_item_schema() {

		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'url-details',
			'type'       => 'object',
			'properties' => array(
				'title' => array(
					'description' => __( 'The contents of the <title> tag from the URL.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'view', 'edit', 'embed' ),
					'readonly'    => true,
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the contents of the <title> tag from the HTML
	 * response.
	 *
	 * @param WP_REST_REQUEST $request Full details about the request.
	 * @return WP_REST_Response|WP_Error The parsed details as a response object or an error.
	 */
	public function parse_url_details( $request ) {

		$url = untrailingslashit( $request['url'] );

		if ( empty( $url ) ) {
			return new WP_Error( 'rest_invalid_url', __( 'Invalid URL', 'gutenberg' ), array( 'status' => 404 ) );
		}

		// Transient per URL.
		$cache_key = $this->build_cache_key_for_url( $url );

		// Attempt to retrieve cached response.
		$cached_response = $this->get_cache( $cache_key );

		if ( ! empty( $cached_response ) ) {
			$remote_url_response = $cached_response;
		} else {
			$remote_url_response = $this->get_remote_url( $url );

			// Exit if we don't have a valid body or it's empty.
			if ( is_wp_error( $remote_url_response ) || empty( $remote_url_response ) ) {
				return $remote_url_response;
			}

			// Cache the valid response.
			$this->set_cache( $cache_key, $remote_url_response );
		}

		$html_head     = $this->get_document_head( $remote_url_response );
		$meta_elements = $this->get_meta_with_content_elements( $html_head );

		$data = $this->add_additional_fields_to_object(
			array(
				'title'       => $this->get_title( $html_head ),
				'icon'        => $this->get_icon( $html_head, $url ),
				'description' => $this->get_description( $meta_elements ),
				'image'       => $this->get_image( $html_head, $url ),
			),
			$request
		);

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		/**
		 * Filters the URL data for the response.
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param string           $url      The requested URL.
		 * @param WP_REST_Request  $request  Request object.
		 * @param array            $remote_url_response HTTP response body from the remote URL.
		 */
		return apply_filters( 'rest_prepare_url_details', $response, $url, $request, $remote_url_response );
	}



	/**
	 * Checks whether a given request has permission to read remote urls.
	 *
	 * @return WP_Error|bool True if the request has access, WP_Error object otherwise.
	 */
	public function permissions_check() {
		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}

		foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
			if ( current_user_can( $post_type->cap->edit_posts ) ) {
				return true;
			}
		}

		return new WP_Error(
			'rest_cannot_view_url_details',
			__( 'Sorry, you are not allowed to process remote urls.', 'gutenberg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}



	/**
	 * Retrieves the document title from a remote URL.
	 *
	 * @param string $url The website url whose HTML we want to access.
	 * @return array|WP_Error the HTTP response from the remote URL or error.
	 */
	private function get_remote_url( $url ) {

		$args = array(
			'limit_response_size' => 150 * KB_IN_BYTES,
			'user-agent'          => $this->get_random_user_agent(),
		);

		/**
		 * Filters the HTTP request args for URL data retrieval.
		 *
		 * Can be used to adjust response size limit and other WP_Http::request args.
		 *
		 * @param array $args Arguments used for the HTTP request
		 * @param string $url The attempted URL.
		 */
		$args = apply_filters( 'rest_url_details_http_request_args', $args, $url );

		$response = wp_safe_remote_get(
			$url,
			$args
		);

		if ( WP_Http::OK !== wp_remote_retrieve_response_code( $response ) ) {
			// Not saving the error response to cache since the error might be temporary.
			return new WP_Error( 'no_response', __( 'URL not found. Response returned a non-200 status code for this URL.', 'gutenberg' ), array( 'status' => WP_Http::NOT_FOUND ) );
		}

		$remote_body = wp_remote_retrieve_body( $response );

		if ( empty( $remote_body ) ) {
			return new WP_Error( 'no_content', __( 'Unable to retrieve body from response at this URL.', 'gutenberg' ), array( 'status' => WP_Http::NOT_FOUND ) );
		}

		return $remote_body;
	}

	/**
	 * Parses the <title> contents from the provided HTML
	 *
	 * @param string $html The HTML from the remote website at URL.
	 * @return string The title tag contents on success; else empty string.
	 */
	private function get_title( $html ) {
		preg_match( '|<title[^>]*>(.*?)<\s*/\s*title>|is', $html, $match_title );

		$title = isset( $match_title[1] ) && is_string( $match_title[1] ) ? trim( $match_title[1] ) : '';

		return $title;
	}

	/**
	 * Parses the site icon from the provided HTML
	 *
	 * @param string $html The HTML from the remote website at URL.
	 * @param string $url  The target website URL.
	 * @return string The icon URI on success; else empty string.
	 */
	private function get_icon( $html, $url ) {
		// Grab the icon's link element.
		$pattern = '#<link\s[^>]*rel=(?:[\"\']??)\s*(?:icon|shortcut icon|icon shortcut)\s*(?:[\"\']??)[^>]*\/?>#isU';
		preg_match( $pattern, $html, $element );
		$element = ! empty( $element[0] ) && is_string( $element[0] ) ? trim( $element[0] ) : '';
		if ( empty( $element ) ) {
			return '';
		}

		// Get the icon's href value.
		$pattern = '#href=([\"\']??)([^\" >]*?)\\1[^>]*#isU';
		preg_match( $pattern, $element, $icon );
		$icon = ! empty( $icon[2] ) && is_string( $icon[2] ) ? trim( $icon[2] ) : '';
		if ( empty( $icon ) ) {
			return '';
		}

		// Attempt to convert relative URLs to absolute.
		$parsed_url = parse_url( $url );
		$root_url   = $parsed_url['scheme'] . '://' . $parsed_url['host'] . '/';
		$icon       = WP_Http::make_absolute_url( $icon, $root_url );

		return $icon;
	}

	/**
	 * Parses the meta description from the provided HTML.
	 *
	 * @param array $meta_elements {
	 *     A multi-dimensional indexed array on success, or empty array.
	 *
	 *     @type string[] 0 Meta elements with a content attribute.
	 *     @type string[] 1 Content attribute's opening quotation mark.
	 *     @type string[] 2 Content attribute's value for each meta element.
	 * }
	 * @return string The meta description contents on success, else empty string.
	 */
	private function get_description( $meta_elements ) {
		// Bail out if there are no meta elements.
		if ( empty( $meta_elements[0] ) ) {
			return '';
		}

		// Find the description meta element.
		$pattern     = '#name=([\"\']??)\s*\bdescription\b\s*\1[^>]*#isU';
		$description = '';
		foreach ( $meta_elements[0] as $index => $element ) {
			preg_match( $pattern, $element, $match );

			// This meta is not a description. Skip it.
			if ( empty( $match ) ) {
				continue;
			}

			/*
			 * Found the description meta element.
			 * Get the element's description from its matching content array.
			 */
			if ( isset( $meta_elements[2][ $index ] ) && is_string( $meta_elements[2][ $index ] ) ) {
				$description = trim( $meta_elements[2][ $index ] );
			}

			break;
		}

		if ( '' === $description ) {
			return '';
		}

		// @TODO ensure well-formed HTML.

		return $description;
	}

	/**
	 * Parses the Open Graph Image from the provided HTML.
	 *
	 * See: https://ogp.me/.
	 *
	 * @param string $html the HTML from the remote website at URL.
	 * @param string $url the target website URL.
	 * @return string the OG image (maybe empty).
	 */
	private function get_image( $html, $url ) {
		preg_match( '|<meta.*?property="og:image[:url]*?".*?content="(.*?)".*?\/?>|is', $html, $matches );

		$image = isset( $matches[1] ) && is_string( $matches[1] ) ? trim( $matches[1] ) : '';

		// Attempt to convert relative URLs to absolute.
		if ( ! empty( $image ) ) {
			$parsed_url = parse_url( $url );
			$root_url   = $parsed_url['scheme'] . '://' . $parsed_url['host'] . '/';
			$image      = \WP_Http::make_absolute_url( $image, $root_url );
		}

		return $image;
	}

	/**
	 * Utility function to build cache key for a given URL.
	 *
	 * @param string $url the URL for which to build a cache key.
	 * @return string the cache key.
	 */
	private function build_cache_key_for_url( $url ) {
		return 'g_url_details_response_' . md5( $url );
	}

	/**
	 * Utility function to retrieve a value from the cache at a given key.
	 *
	 * @param string $key the cache key.
	 * @return string the value from the cache.
	 */
	private function get_cache( $key ) {
		return get_transient( $key );
	}

	/**
	 * Utility function to cache a given data set at a given cache key.
	 *
	 * @param string $key the cache key under which to store the value.
	 * @param string $data the data to be stored at the given cache key.
	 * @return void
	 */
	private function set_cache( $key, $data = '' ) {
		if ( ! is_array( $data ) ) {
			return;
		}

		$ttl = HOUR_IN_SECONDS;

		/**
		 * Filters the cache expiration.
		 *
		 * Can be used to adjust the time until expiration in seconds for the cache
		 * of the data retrieved for the given URL.
		 *
		 * @param int $ttl the time until cache expiration in seconds.
		 */
		$cache_expiration = apply_filters( 'rest_url_details_cache_expiration', $ttl );

		return set_transient( $key, $data, $cache_expiration );
	}

	/**
	 * Picks a random user agent string from a list of common defaults.
	 * By default WordPress HTTP functions uses a semi-static string and
	 * this maybe rejected by many websites.
	 *
	 * See: https://core.trac.wordpress.org/browser/tags/5.7.1/src/wp-includes/class-http.php#L191.
	 *
	 * @return string the user agent string.
	 */
	private function get_random_user_agent() {

		$agents = array(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246', // Windows 10-based PC using Edge browser.
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9', // Mac OS X-based computer using a Safari browser.
			'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:15.0) Gecko/20100101 Firefox/15.0.1', // Linux-based PC using a Firefox browser.
		);

		$chose = rand( 0, count( $agents ) - 1 );

		return $agents[ $chose ];
	}

	/**
	 * Retrieves the `<head>` section.
	 *
	 * @param string $html The string of HTML to parse.
	 * @return string The `<head>..</head>` section on succes, or original HTML.
	 */
	private function get_document_head( $html ) {
		$head_html = $html;

		// Find the opening `<head>` tag.
		$head_start = strpos( $html, '<head' );
		if ( false === $head_start ) {
			// Didn't find it. Return the original HTML.
			return $html;
		}

		// Find the closing `</head>` tag.
		$head_end = strpos( $head_html, '</head>' );
		if ( false === $head_end ) {
			// Didn't find it. Find the opening `<body>` tag.
			$head_end = strpos( $head_html, '<body' );

			// Didn't find it. Return the original HTML.
			if ( false === $head_end ) {
				return $html;
			}
		}

		// Extract the HTML from opening tag to the closing tag. Then add the closing tag.
		$head_html  = substr( $head_html, $head_start, $head_end );
		$head_html .= '</head>';

		return $head_html;
	}

	/**
	 * Gets all the <meta> elements that have a `content` attribute.
	 *
	 * @param string $html The string of HTML to be parsed.
	 * @return array {
	 *     A multi-dimensional indexed array on success, or empty array.
	 *
	 *     @type string[] 0 Meta elements with a content attribute.
	 *     @type string[] 1 Content attribute's opening quotation mark.
	 *     @type string[] 2 Content attribute's value for each meta element.
	 * }
	 */
	private function get_meta_with_content_elements( $html ) {
		/*
		 * Parse all meta elements with a content attribute.
		 *
		 * Why first search for the content attribute rather than directly searching for name=description element?
		 * tl;dr The content attribute's value will be truncated when it contains a > symbol.
		 *
		 * The content attribute's value (i.e. the description to get) can have HTML in it and be well-formed as
		 * it's a string to the browser. Imagine what happens when attempting to match for the name=description
		 * first. Hmm, if a > or /> symbol is in the content attribute's value, then it terminates the match
		 * as the element's closing symbol. But wait, it's in the content attribute and is not the end of the
		 * element. This is a limitation of using regex. It can't determine "wait a minute this is inside of quotation".
		 * If this happens, what gets matched is not the entire element or all of the content.
		 *
		 * Why not search for the name=description and then content="(.*)"?
		 * The attribute order could be opposite. Plus, additional attributes may exist including being between
		 * the name and content attributes.
		 *
		 * Why not lookahead?
		 * Lookahead is not constrained to stay within the element. The first <meta it finds may not include
		 * the name or content, but rather could be from a different element downstream.
		 */
		$pattern = '#<meta\s' .

			/*
			 * Alows for additional attributes before the content attribute.
			 * Searches for anything other than > symbol.
			 */
			'[^>]*' .

			/*
			 * Find the content attribute. When found, capture its value (.*).
			 *
			 * Allows for (a) single or double quotes and (b) whitespace in the value.
			 *
			 * Why capture the opening quotation mark, i.e. (["\']), and then backreference,
			 * i.e \1, for the closing quotation mark?
			 * To ensure the closing quotation mark matches the opening one. Why? Attribute values
			 * can contain quotation marks, such as an apostrophe in the content.
			 */
			'content=(["\']??)(.*)\1' .

			/*
			 * Alows for additional attributes after the content attribute.
			 * Searches for anything other than > symbol.
			 */
			'[^>]*' .

			/*
			 * \/?> searches for the closing > symbol, which can be in either /> or > format.
			 * # ends the pattern.
			 */
			'\/?>#' .

			/*
			 * These are the options:
			 * - i : case insensitive
			 * - s : allows newline characters for the . match (needed for multiline elements)
			 * - U means non-greedy matching
			 */
			'isU';

		preg_match_all( $pattern, $html, $elements );

		return $elements;
	}
}
