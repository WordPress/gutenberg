<?php
/**
 * REST API: Gutenberg_REST_Themes_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Core class used to manage themes via the REST API.
 *
 * @since 5.0.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Themes_Controller_6_2 extends WP_REST_Themes_Controller {
	/**
	 * Prepares links for the request.
	 *
	 * @since 5.7.0
	 *
	 * @param WP_Theme $theme Theme data.
	 * @return array Links for the given block type.
	 */
	protected function prepare_links( $theme ) {
		$links = array(
			'self'       => array(
				'href' => rest_url( sprintf( '%s/%s/%s', $this->namespace, $this->rest_base, $theme->get_stylesheet() ) ),
			),
			'collection' => array(
				'href' => rest_url( sprintf( '%s/%s', $this->namespace, $this->rest_base ) ),
			),
		);

		if ( $this->is_same_theme( $theme, wp_get_theme() ) ) {
			// This creates a record for the active theme if not existent.
			$id = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();
		} else {
			$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
			$id       = isset( $user_cpt['ID'] ) ? $user_cpt['ID'] : null;
		}

		if ( $id ) {
			$links['https://api.w.org/user-global-styles'] = array(
				'href' => rest_url( 'wp/v2/global-styles/' . $id ),
			);
		}

		return $links;
	}
}
