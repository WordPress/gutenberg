<?php
/**
 * REST API: Gutenberg_REST_Global_Styles_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Global Styles REST API Controller.
 */
class Gutenberg_REST_Global_Styles_Controller_6_3 extends Gutenberg_REST_Global_Styles_Controller_6_2 {

	/**
	 * Revision controller.
	 *
	 * @since 6.3.0
	 * @var WP_REST_Revisions_Controller
	 */
	private $revisions_controller;

	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		parent::register_routes();

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_site_item' ),
					'permission_callback' => array( $this, 'get_theme_items_permissions_check' ),
				),
			)
		);

	}

	/**
	 * Return the global styles config for the site origin.
	 *
	 * @since 6.3.0
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_site_item() {
		$active_global_styles_site_id = WP_Theme_JSON_Resolver_Gutenberg::get_site_global_styles_post_id();
		$active_global_styles_site    = get_post( $active_global_styles_site_id );
		$active_global_styles_site    = $this->prepare_item_for_response( $active_global_styles_site, new WP_REST_Request() );
		return $active_global_styles_site;
	}

	/**
	 * Prepares links for the request.
	 *
	 * @since 5.9.0
	 * @since 6.3 Adds revisions to version-history.
	 *
	 * @param integer $id ID.
	 * @return array Links for the given post.
	 */
	protected function prepare_links( $id ) {
		$base = sprintf( '%s/%s', $this->namespace, $this->rest_base );

		$links = array(
			'self' => array(
				'href' => rest_url( trailingslashit( $base ) . $id ),
			),
		);

		if ( post_type_supports( $this->post_type, 'revisions' ) ) {
			$revisions                = wp_get_latest_revision_id_and_total_count( $id );
			$revisions_count          = ! is_wp_error( $revisions ) ? $revisions['count'] : 0;
			$revisions_base           = sprintf( '/%s/%s/%d/revisions', $this->namespace, $this->rest_base, $id );
			$links['version-history'] = array(
				'href'  => rest_url( $revisions_base ),
				'count' => $revisions_count,
			);
		}

		return $links;
	}

	/**
	 * Prepare a global styles config output for response.
	 *
	 * @since 5.9.0
	 * @since 6.2 Handling of style.css was added to WP_Theme_JSON.
	 * @since 6.3 Added support for site origin in global styles.
	 *
	 * @param WP_Post         $post Global Styles post object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $post, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$raw_config                       = json_decode( $post->post_content, true );
		$is_global_styles_user_theme_json = isset( $raw_config['isGlobalStylesUserThemeJSON'] ) && true === $raw_config['isGlobalStylesUserThemeJSON'];
		$config                           = array();
		if ( $is_global_styles_user_theme_json ) {
			$origin = ( isset( $post->post_name ) && 'wp-global-styles-site' === $post->post_name ) ? 'site' : 'custom';
			$config = ( new WP_Theme_JSON_Gutenberg( $raw_config, $origin ) )->get_raw_data();
		}

		// Base fields for every post.
		$data   = array();
		$fields = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = $post->ID;
		}

		if ( rest_is_field_included( 'title', $fields ) ) {
			$data['title'] = array();
		}
		if ( rest_is_field_included( 'title.raw', $fields ) ) {
			$data['title']['raw'] = $post->post_title;
		}
		if ( rest_is_field_included( 'title.rendered', $fields ) ) {
			add_filter( 'protected_title_format', array( $this, 'protected_title_format' ) );

			$data['title']['rendered'] = get_the_title( $post->ID );

			remove_filter( 'protected_title_format', array( $this, 'protected_title_format' ) );
		}

		if ( rest_is_field_included( 'settings', $fields ) ) {
			$data['settings'] = ! empty( $config['settings'] ) && $is_global_styles_user_theme_json ? $config['settings'] : new stdClass();
		}

		if ( rest_is_field_included( 'styles', $fields ) ) {
			$data['styles'] = ! empty( $config['styles'] ) && $is_global_styles_user_theme_json ? $config['styles'] : new stdClass();
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		// Wrap the data in a response object.
		$response = rest_ensure_response( $data );

		if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
			$links = $this->prepare_links( $post->ID );
			$response->add_links( $links );
			if ( ! empty( $links['self']['href'] ) ) {
				$actions = $this->get_available_actions();
				$self    = $links['self']['href'];
				foreach ( $actions as $rel ) {
					$response->add_link( $rel, $self );
				}
			}
		}

		return $response;
	}
}
