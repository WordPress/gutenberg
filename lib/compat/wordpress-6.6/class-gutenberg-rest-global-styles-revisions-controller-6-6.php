<?php
/**
 * REST API: Gutenberg_REST_Global_Styles_Revisions_Controller class, inspired by WP_REST_Revisions_Controller.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.3.0
 */

/**
 * Core class used to access global styles revisions via the REST API.
 *
 * @since 6.3.0
 * @since 6.6.0 Added custom relative theme file URIs to `_links`.
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Global_Styles_Revisions_Controller_6_6 extends WP_REST_Global_Styles_Revisions_Controller {
	/**
	 * Prepares the revision for the REST response.
	 *
	 * @since 6.3.0
	 * @since 6.6.0 Added resolved URI links to the response.
	 *
	 * @param WP_Post         $post    Post revision object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object.
	 */
	public function prepare_item_for_response( $post, $request ) {
		$parent               = $this->get_parent( $request['parent'] );
		$global_styles_config = $this->get_decoded_global_styles_json( $post->post_content );

		if ( is_wp_error( $global_styles_config ) ) {
			return $global_styles_config;
		}

		$fields     = $this->get_fields_for_response( $request );
		$data       = array();
		$theme_json = array();

		if ( ! empty( $global_styles_config['styles'] ) || ! empty( $global_styles_config['settings'] ) ) {
			$theme_json           = new WP_Theme_JSON_Gutenberg( $global_styles_config, 'custom' );
			$global_styles_config = ( $theme_json )->get_raw_data();

			if ( rest_is_field_included( 'settings', $fields ) ) {
				$data['settings'] = ! empty( $global_styles_config['settings'] ) ? $global_styles_config['settings'] : new stdClass();
			}
			if ( rest_is_field_included( 'styles', $fields ) ) {
				$data['styles'] = ! empty( $global_styles_config['styles'] ) ? $global_styles_config['styles'] : new stdClass();
			}
		}

		if ( rest_is_field_included( 'author', $fields ) ) {
			$data['author'] = (int) $post->post_author;
		}

		if ( rest_is_field_included( 'date', $fields ) ) {
			$data['date'] = $this->prepare_date_response( $post->post_date_gmt, $post->post_date );
		}

		if ( rest_is_field_included( 'date_gmt', $fields ) ) {
			$data['date_gmt'] = $this->prepare_date_response( $post->post_date_gmt );
		}

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = (int) $post->ID;
		}

		if ( rest_is_field_included( 'modified', $fields ) ) {
			$data['modified'] = $this->prepare_date_response( $post->post_modified_gmt, $post->post_modified );
		}

		if ( rest_is_field_included( 'modified_gmt', $fields ) ) {
			$data['modified_gmt'] = $this->prepare_date_response( $post->post_modified_gmt );
		}

		if ( rest_is_field_included( 'parent', $fields ) ) {
			$data['parent'] = (int) $parent->ID;
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		$response = rest_ensure_response( $data );

		// Add resolved URIs to the response.
		$links               = array();
		$resolved_theme_uris = WP_Theme_JSON_Resolver_Gutenberg::get_resolved_theme_uris( $theme_json );
		if ( ! empty( $resolved_theme_uris ) ) {
			$links['https://api.w.org/theme-file'] = $resolved_theme_uris;
		}
		$response->add_links( $links );

		return $response;
	}
}
