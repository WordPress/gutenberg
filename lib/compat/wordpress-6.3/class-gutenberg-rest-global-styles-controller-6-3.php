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

	public function get_site_item () {
		$active_global_styles_site_id = WP_Theme_JSON_Resolver_Gutenberg::get_site_global_styles_post_id();
		$active_global_styles_site = get_post( $active_global_styles_site_id );
		$active_global_styles_site = $this->prepare_item_for_response( $active_global_styles_site, new WP_REST_Request() );
		return $active_global_styles_site;
	}

	/**
	 * Revision controller.
	 *
	 * @since 6.3.0
	 * @var WP_REST_Revisions_Controller
	 */
	private $revisions_controller;

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
}
