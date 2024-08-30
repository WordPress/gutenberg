<?php
/**
 * REST API: Gutenberg_REST_Templates_Controller_6_6 class
 *
 * @package    gutenberg
 */

/**
 * Gutenberg_REST_Templates_Controller_6_6 class
 *
 * Templates and template parts currently only allow access to administrators with the
 * `edit_theme_options` capability. In order to allow other roles to also view the templates,
 * we need to override the permissions check for the REST API endpoints.
 */
class Gutenberg_REST_Templates_Controller_6_6 extends WP_REST_Templates_Controller {

	/**
	 * Checks if a given request has access to read templates.
	 *
	 * @since 6.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}
		foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
			if ( current_user_can( $post_type->cap->edit_posts ) ) {
				return true;
			}
		}

		return new WP_Error(
			'rest_cannot_manage_templates',
			__( 'Sorry, you are not allowed to access the templates on this site.', 'default' ),
			array(
				'status' => rest_authorization_required_code(),
			)
		);
	}

	/**
	 * Returns a list of templates.
	 *
	 * @since 5.8.0
	 *
	 * @param WP_REST_Request $request The request instance.
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		$query = array();
		if ( isset( $request['wp_id'] ) ) {
			$query['wp_id'] = $request['wp_id'];
		}
		if ( isset( $request['area'] ) ) {
			$query['area'] = $request['area'];
		}
		if ( isset( $request['post_type'] ) ) {
			$query['post_type'] = $request['post_type'];
		}

		$templates = array();
		foreach ( gutenberg_get_block_templates( $query, $this->post_type ) as $template ) {
			$data        = $this->prepare_item_for_response( $template, $request );
			$templates[] = $this->prepare_response_for_collection( $data );
		}

		return rest_ensure_response( $templates );
	}

	/**
	 * Checks if a given request has access to read templates.
	 *
	 * @since 6.6.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( current_user_can( 'edit_posts' ) ) {
			return true;
		}
		foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
			if ( current_user_can( $post_type->cap->edit_posts ) ) {
				return true;
			}
		}

		return new WP_Error(
			'rest_cannot_manage_templates',
			__( 'Sorry, you are not allowed to access the templates on this site.', 'default' ),
			array(
				'status' => rest_authorization_required_code(),
			)
		);
	}

	/**
	 * Returns the fallback template for the given slug.
	 *
	 * @since 6.1.0
	 *
	 * @param WP_REST_Request $request The request instance.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_template_fallback( $request ) {
		$hierarchy = gutenberg_get_template_hierarchy( $request['slug'], $request['is_custom'], $request['template_prefix'] );

		do {
			$fallback_template = resolve_block_template( $request['slug'], $hierarchy, '' );
			array_shift( $hierarchy );
		} while ( ! empty( $hierarchy ) && empty( $fallback_template->content ) );

		// To maintain original behavior, return an empty object rather than a 404 error when no template is found.
		$response = $fallback_template ? $this->prepare_item_for_response( $fallback_template, $request ) : new stdClass();

		return rest_ensure_response( $response );
	}

	/**
	 * See WP_REST_Templates_Controller::prepare_item_for_response
	 */
	public function prepare_item_for_response( $item, $request ) {
		$blocks        = parse_blocks( $item->content );
		$blocks        = gutenberg_replace_pattern_blocks( $blocks );
		$item->content = serialize_blocks( $blocks );
		return parent::prepare_item_for_response( $item, $request );
	}
}
