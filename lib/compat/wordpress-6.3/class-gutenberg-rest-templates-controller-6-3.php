<?php
/**
 * REST API: Gutenberg_REST_Templates_Controller_6_2 class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Base Templates REST API Controller.
 */
class Gutenberg_REST_Templates_Controller_6_3 extends WP_REST_Templates_Controller {

	/**
	 * Registers the controllers routes.
	 *
	 * @return void
	 */
	public function register_routes() {

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/lookup',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_template_fallback' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'slug'            => array(
							'description' => __( 'The slug of the template to get the fallback for', 'gutenberg' ),
							'type'        => 'string',
							'required'    => true,
						),
						'is_custom'       => array(
							'description' => __( 'Indicates if a template is custom or part of the template hierarchy', 'gutenberg' ),
							'type'        => 'boolean',
						),
						'template_prefix' => array(
							'description' => __( 'The template prefix for the created template. This is used to extract the main template type ex. in `taxonomy-books` we extract the `taxonomy`', 'gutenberg' ),
							'type'        => 'string',
						),
					),
				),
			)
		);
		parent::register_routes();
		// Get fallback template content.
	}

	/**
	 * Returns the fallback template for a given slug.
	 *
	 * @param WP_REST_Request $request The request instance.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_template_fallback( $request ) {
		$hierarchy         = get_template_hierarchy( $request['slug'], $request['is_custom'], $request['template_prefix'] );
		$fallback_template = null;
		do {
			$fallback_template = resolve_block_template( $request['slug'], $hierarchy, '' );
			array_shift( $hierarchy );
		} while ( ! empty( $hierarchy ) && empty( $fallback_template->content ) );
		$response = $this->prepare_item_for_response( $fallback_template, $request );
		return rest_ensure_response( $response );
	}

	/**
	 * Add revisions to the response.
	 *
	 * @since 6.3.0 Added prepare_revision_links() method to get revision links.
	 *
	 * @param WP_Block_Template $item    Template instance.
	 * @param WP_REST_Request   $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$template = $item;

		$fields = $this->get_fields_for_response( $request );

		$response = parent::prepare_item_for_response( $item, $request );

		if ( rest_is_field_included( '_links', $fields ) || rest_is_field_included( '_embedded', $fields ) ) {
			$links = $this->prepare_revision_links( $template );
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

	/**
	 * Adds revisions to links.
	 *
	 * @since 6.3.0
	 *
	 * @param WP_Block_Template $template  Template instance.
	 * @return array Links for the given post.
	 */
	protected function prepare_revision_links( $template ) {
		$links = array();

		if ( post_type_supports( $this->post_type, 'revisions' ) && (int) $template->wp_id ) {
			$revisions       = wp_get_latest_revision_id_and_total_count( (int) $template->wp_id );
			$revisions_count = ! is_wp_error( $revisions ) ? $revisions['count'] : 0;
			$revisions_base  = sprintf( '/%s/%s/%s/revisions', $this->namespace, $this->rest_base, $template->id );

			$links['version-history'] = array(
				'href'  => rest_url( $revisions_base ),
				'count' => $revisions_count,
			);

			if ( $revisions_count > 0 ) {
				$links['predecessor-version'] = array(
					'href' => rest_url( $revisions_base . '/' . $revisions['latest_id'] ),
					'id'   => $revisions['latest_id'],
				);
			}
		}

		return $links;
	}
}
