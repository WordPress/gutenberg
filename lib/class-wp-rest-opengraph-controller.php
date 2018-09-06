<?php
/**
 * OpenGraph REST API: WP_REST_Block_OpenGraph_Controller class
 *
 * @package gutenberg
 * @since 3.x
 */

/**
 * Controller which provides REST endpoint for rendering a block.
 *
 * @since 3.x
 *
 * @see WP_REST_Controller
 */
class WP_REST_OpenGraph_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 */
	public function __construct() {
		$this->api_namespace    = 'gutenberg/v1';
		$this->rest_base        = 'opengraph';
		$this->min_resolution   = 128;
		$this->thumb_resolution = 200;
		$this->request_args     = array(
			'user-agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
		);
	}

	/**
	 * Registers the necessary REST API routes.
	 */
	public function register_routes() {

		register_rest_route( $this->api_namespace, '/' . $this->rest_base, array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_preview' ),
				'permission_callback' => array( $this, 'get_preview_permissions_check' ),
				'args'                => array(
					'url' => array(
						'description'       => __( 'The URL of the resource for which to fetch OpenGraph data.', 'gutenberg' ),
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'esc_url_raw',
					),
				),
			),
		) );
	}

	/**
	 * Checks if current user can make an OpenGraph request.
	 *
	 * @since 3.x
	 *
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_preview_permissions_check() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to make OpenGraph requests.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		return true;
	}

	/**
	 * Callback for the OpenGraph API endpoint.
	 *
	 * Returns the JSON object for the item .
	 *
	 * @since 3.x
	 *
	 * @see WP_REST_OpenGraph_Controller#generate_preview
	 * @param WP_REST_Request $request Full data about the request.
	 * @return object|WP_Error response data or WP_Error on failure.
	 */
	public function get_preview( $request ) {
		$args = $request->get_params();

		// Insert the blog id, because when we fetch the preview's images into the
		// media library, the cached preview will reference their URLs and we'll need
		// to cache this preview per blog.
		$args['blog_id'] = get_current_blog_id();

		// Serve data from cache if set.
		unset( $args['_wpnonce'] );
		$cache_key = 'gutenberg_opengraph_' . md5( serialize( $args ) );
		$data      = get_transient( $cache_key );
		$url       = $request['url'];

		if ( ! empty( $data ) ) {
			return $data;
		}

		$data = $this->generate_preview( $args );
		if ( is_wp_error( $data ) ) {
			return new WP_Error( 'opengraph_invalid_url', get_status_header_desc( 404 ), array( 'status' => 404 ) );
		}

		/**
		 * Filters the OpenGraph TTL value (time to live).
		 *
		 * @since 3.x
		 *
		 * @param int    $time    Time to live (in seconds).
		 * @param string $url     The attempted URL.
		 */
		$ttl = apply_filters( 'rest_opengraph_ttl', DAY_IN_SECONDS, $url );

		set_transient( $cache_key, $data, $ttl );

		return $data;
	}

	/**
	 * Sideloads the remote image if all conditions are met and the image can be fetched.
	 *
	 * Returns the local URL of the uploaded image.
	 *
	 * @since 3.x
	 *
	 * @param string $url URL of the image.
	 * @return string|WP_Error Local URL or WP_Error on failure.
	 */
	private function maybe_sideload_remote_image( $url ) {
		// Need to require these files to get access to media_handle_sideload.
		if ( ! function_exists( 'media_handle_upload' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/image.php' );
			require_once( ABSPATH . 'wp-admin/includes/file.php' );
			require_once( ABSPATH . 'wp-admin/includes/media.php' );
		}

		$tmp_filename = tempnam( sys_get_temp_dir(), basename( $url ) );
		$response     = wp_remote_get( $url, $this->request_args );
		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'opengraph_cant_fetch_image', __( 'Could not fetch image.', 'gutenberg' ) );
		}

		file_put_contents( $tmp_filename, $response['body'] );
		$image = wp_get_image_editor( $tmp_filename );
		if ( is_wp_error( $image ) ) {
			unlink( $tmp_filename );
			return new WP_Error( 'opengraph_cant_get_image_editor', __( 'Could not get an image editor.', 'gutenberg' ) );
		}

		$img_size = $image->get_size();
		if ( $img_size['width'] < $this->min_resolution && $img_size['height'] < $this->min_resolution ) {
			unlink( $tmp_filename );
			return new WP_Error( 'opengraph_image_too_small', __( 'Fetched image was too small.', 'gutenberg' ) );
		}

		$resize = $image->resize( $this->thumb_resolution, $this->thumb_resolution );
		if ( is_wp_error( $resize ) ) {
			unlink( $tmp_filename );
			return new WP_Error( 'opengraph_image_resize_fail', __( 'Failed to resize the image.', 'gutenberg' ) );
		}

		$saved = $image->save();
		unlink( $tmp_filename );
		if ( is_wp_error( $saved ) ) {
			return new WP_Error( 'opengraph_image_save_fail', __( 'Failed to save the image.', 'gutenberg' ) );
		}

		$mime_type = $response['headers']->offsetGet( 'content-type' );
		$file      = array(
			// Get rid of any query parameters, leaving just the file name, so we don't get
			// security warnings when uploading images that look like 'screenshot.jpg?3'.
			'name'     => preg_replace( '/\?.*/', '', basename( $url ) ),
			'type'     => $mime_type,
			'tmp_name' => $saved['path'],
			'error'    => 0,
			'size'     => filesize( $saved['path'] ),
		);

		$attachment_id = media_handle_sideload( $file, 0 );
		if ( is_wp_error( $attachment_id ) ) {
			return $attachment_id;
		}

		return wp_get_attachment_url( $attachment_id );
	}

	/**
	 * Makes sure a string is free from tags and escaped, so it's safe for embedding.
	 *
	 * @since 3.x
	 *
	 * @param string $content Content to sanitize.
	 * @return string Safe content.
	 */
	private function sanitize_content( $content ) {
		return esc_html( strip_tags( $content ) );
	}

	/**
	 * Generates preview data.
	 *
	 * Returns an array of preview data.
	 *
	 * @since 3.x
	 *
	 * @param array $args Information about the URL, 'url' and 'blog_id' are required.
	 * @return array|bool Array of preview data, or false on failure.
	 */
	private function generate_preview( $args ) {
		$url     = $args['url'];
		$blog_id = $args['blog_id'];

		$response = wp_remote_get( $url, $this->request_args );
		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'opengraph_fetch_fail', __( 'Failed to fetch the URL.', 'gutenberg' ) );
		}

		$response_obj = $response['http_response']->get_response_object();
		if ( ! $response_obj->success ) {
			return new WP_Error( 'opengraph_fetch_fail', __( 'Failed to fetch the URL.', 'gutenberg' ) );
		}

		// Get the URL from the response object, so we deal with the actual URL
		// that we ended up on.
		$url  = $response_obj->url;
		$body = $response['body'];
		$data = array(
			'url' => $url,
		);

		// Extract any data from meta tags.
		preg_match_all( '/<meta .*(name|property)="([a-z]+)" content="([^"]+)"/', $body, $matches );
		foreach ( $matches[2] as $index => $property ) {
			$data[ $property ] = $matches[3][ $index ];
		}

		// Extract any OpenGraph data.
		$matches = array( 'image' => array() );
		preg_match_all( '/<meta .*property="og:([a-z]+)" content="([^"]+)"/', $body, $matches );
		foreach ( $matches[1] as $index => $property ) {
			if ( 'image' === $property ) {
				$data['image'][] = $matches[2][ $index ];
			} else {
				$data[ $property ] = $matches[2][ $index ];
			}
		}

		if ( ! isset( $data['title'] ) || empty( $data['title'] ) ) {
			$match = array();
			preg_match( '|<title>(.+?)</title>|', $body, $match );
			if ( $match ) {
				$data['title'] = $match[1];
			} else {
				$data['title'] = $url;
			}
		}

		if ( ! isset( $data['description'] ) || empty( $data['description'] ) ) {
			$match = array();
			preg_match( '|<p.*>.+?</p>|', $body, $match );
			if ( $match ) {
				// First bunch of words in the first paragraph.
				$content             = $this->sanitize_content( $match[0] );
				$extract             = substr( $content, 0, 500 );
				$words               = str_word_count( $extract, 1 );
				$data['description'] = join( ' ', array_slice( $words, 0, -1 ) ) . '...';
			}
		}

		foreach ( $data as $index => $value ) {
			if ( 'image' !== $index ) {
				$data[ $index ] = $this->sanitize_content( $value );
			}
		}

		if ( ! isset( $data['image'] ) || empty( $data['image'] ) ) {
			$matches = array();
			preg_match_all( '|<img [^>]*src=["\']([^"\']+)["\']|', $body, $matches );
			if ( $matches ) {
				$parsed_url    = parse_url( $url );
				$path_segments = explode( '/', $parsed_url['path'] );
				$base_path     = $parsed_url['scheme'] . '://' . $parsed_url['host'] . join( '/', array_slice( $path_segments, 0, -1 ) ) . '/';
				$images        = array();
				$imgsrcs       = array_slice( $matches[1], 0, 3 );
				foreach ( $imgsrcs as $imgsrc ) {
					// Make full urls out of the image src.
					if ( '//' === substr( $imgsrc, 0, 2 ) ) {
						$full_img_url = 'https:' . $imgsrc;
					} elseif ( '/' === substr( $imgsrc, 0, 1 ) ) {
						$full_img_url = $parsed_url['scheme'] . '://' . $parsed_url['host'] . $imgsrc;
					} elseif ( preg_match( '|^https?://.+|', $imgsrc ) ) {
						$full_img_url = $imgsrc;
					} else {
						$full_img_url = $base_path . $imgsrc;
					}
					$local_url = $this->maybe_sideload_remote_image( $full_img_url );
					if ( ! is_wp_error( $local_url ) ) {
						$images[] = array( 'src' => $local_url );
					}
				}
				$data['images'] = $images;
			}
		} else {
			$data['images'] = array();
			foreach ( $data['image'] as $imgsrc ) {
				$local_url = $this->maybe_sideload_remote_image( $imgsrc );
				if ( ! is_wp_error( $local_url ) ) {
					$data['images'][] = array( 'src' => $local_url );
				}
			}
			unset( $data['image'] );
		}
		return $data;
	}
}
