<?php
/**
 * REST API: WP_REST_Themes_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 5.0.0
 */

/**
 * Core class used to manage themes via the REST API.
 *
 * @since 5.0.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Themes_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 *
	 * @since 5.0.0
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'themes';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @since 5.0.0
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/active',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'context' => $this->get_context_param( array( 'default' => 'edit' ) ),
					),
				),
				'schema' => array( $this, 'get_item_schema' ),
			)
		);
	}

	/**
	 * Checks if a given request has access to read the theme.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, otherwise WP_Error object.
	 */
	public function get_item_permissions_check( $request ) {
		if ( ! is_user_logged_in() || ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error( 'rest_user_cannot_view', __( 'Sorry, you are not allowed to view themes.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

	/**
	 * Retrieves the active theme.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		$theme = wp_get_theme();

		$response = $this->prepare_item_for_response( $theme, $request );
		$response = rest_ensure_response( $response );

		return $response;
	}

	/**
	 * Prepares a single theme output for response.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_Theme        $theme   Theme object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $theme, $request ) {
		$data   = array();
		$fields = $this->get_fields_for_response( $request );

		if ( in_array( 'name', $fields, true ) ) {
			$data['name'] = $theme->__get( 'name' );
		}

		if ( in_array( 'stylesheet', $fields, true ) ) {
			$data['stylesheet'] = $theme->__get( 'stylesheet' );
		}

		if ( in_array( 'version', $fields, true ) ) {
			$data['version'] = $theme->__get( 'version' );
		}

		if ( in_array( 'template', $fields, true ) ) {
			$data['template'] = $theme->__get( 'template' );
		}

		if ( in_array( 'theme_supports', $fields, true ) ) {
			$formats                           = get_theme_support( 'post-formats' );
			$formats                           = is_array( $formats ) ? array_values( $formats[0] ) : array();
			$formats                           = array_merge( array( 'standard' ), $formats );
			$data['theme_supports']['formats'] = $formats;

			$post_thumbnails = get_theme_support( 'post-thumbnails' );

			if ( $post_thumbnails ) {
				// $post_thumbnails can contain a nested array of post types.
				// e.g. array( array( 'post', 'page' ) ).
				$data['theme_supports']['post-thumbnails'] = is_array( $post_thumbnails ) ? $post_thumbnails[0] : true;
			}
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'edit';

		$data = $this->add_additional_fields_to_object( $data, $request );
		$data = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		$response->add_links( $this->prepare_links( $theme ) );

		/**
		 * Filters theme data returned from the REST API.
		 *
		 * @since 5.0.0
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param WP_Theme         $theme    Theme object used to create response.
		 * @param WP_REST_Request  $request  Request object.
		 */
		return apply_filters( 'rest_prepare_theme', $response, $theme, $request );
	}

	/**
	 * Prepares links for the theme request.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_Theme $theme Theme object.
	 * @return array Links for the given theme.
	 */
	protected function prepare_links( $theme ) {
		$links = array(
			'self' => array(
				'href' => rest_url( sprintf( '%s/%s/active', $this->namespace, $this->rest_base ) ),
			),
		);

		return $links;
	}

	/**
	 * Retrieves the theme's schema, conforming to JSON Schema.
	 *
	 * @since 5.0.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'theme',
			'type'       => 'object',
			'properties' => array(
				'name'           => array(
					'description' => __( 'Theme name', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
				'stylesheet'     => array(
					'description' => __( 'The directory name of the theme.', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
				'version'        => array(
					'description' => __( 'Theme version', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
				'template'       => array(
					'description' => __( 'The theme template', 'gutenberg' ),
					'type'        => 'string',
					'context'     => array( 'edit' ),
					'readonly'    => true,
				),
				'theme_supports' => array(
					'description' => __( 'A list of features this theme supports.', 'gutenberg' ),
					'type'        => 'array',
					'context'     => array( 'edit' ),
					'readonly'    => true,
					'properties'  => array(
						'formats'         => array(
							'description' => __( 'Post formats supported.', 'gutenberg' ),
							'type'        => 'array',
							'context'     => array( 'edit' ),
							'readonly'    => true,
						),
						'post-thumbnails' => array(
							'description' => __( 'Whether the theme supports post thumbnails.', 'gutenberg' ),
							'type'        => array( 'array', 'bool' ),
							'context'     => array( 'edit' ),
							'readonly'    => true,
						),
					),
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}
}
