<?php
/**
 * REST API: Gutenberg_REST_Template_Revision_Count class
 *
 * @package    gutenberg
 */

/**
 * Gutenberg_REST_Template_Revision_Count class
 *
 * Template revision changes are waiting on a core change to be merged.
 * See: https://github.com/WordPress/gutenberg/pull/45215#issuecomment-1592704026
 * When merging into core, prepare_revision_links() should be merged with
 * WP_REST_Templates_Controller::prepare_links().
 */
class Gutenberg_REST_Template_Revision_Count extends Gutenberg_REST_Templates_Controller_6_3 {
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
