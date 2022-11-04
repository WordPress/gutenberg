<?php
/**
 * WP_REST_Templates_Controller class
 *
 * When merging into core, prepare_item_for_response() and get_item_schema()
 * should be merged with the parent methods
 *
 * @package gutenberg
 */

class Gutenberg_REST_Template_Revision_Count extends WP_REST_Templates_Controller {
	/**
	 * Add revisions to the response.
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
			$links = $this->prepare_links( $template );
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
	 * Prepares links for the request.
	 *
	 * @since 6.2.0
	 *
	 * @param WP_Block_Template $template    Template instance.
	 * @return array Links for the given post.
	 */
	protected function prepare_links( $template ) {
		$base  = sprintf( '%s/%s', $this->namespace, $this->rest_base );
		$links = array(
			'self'       => array(
				'href' => rest_url( trailingslashit( $base ) . $template->id ),
			),
			'collection' => array(
				'href' => rest_url( rest_get_route_for_post_type_items( $this->post_type ) ),
			),
			'about'      => array(
				'href' => rest_url( 'wp/v2/types/' . $this->post_type ),
			),
		);

		if ( post_type_supports( $this->post_type, 'revisions' ) && (int) $template->wp_id ) {
			$revisions       = wp_get_latest_revision_id_and_total_count( (int) $template->wp_id );
			$revisions_count = ! is_wp_error( $revisions ) ? $revisions['count'] : 0;

			$links['version-history'] = array(
				'count' => $revisions_count,
			);

			if ( $revisions_count > 0 ) {
				$links['predecessor-version'] = array(
					'id'   => $revisions['latest_id'],
				);
			}
		}

		return $links;
	}
}
