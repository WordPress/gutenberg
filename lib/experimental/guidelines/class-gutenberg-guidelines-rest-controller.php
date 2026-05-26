<?php
/**
 * Guidelines REST API Controller.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST API controller for guideline posts.
 */
class Gutenberg_Guidelines_REST_Controller extends WP_REST_Posts_Controller {

	/**
	 * Gate the guidelines collection on the post-type read capability.
	 *
	 * The default `WP_REST_Posts_Controller` allows unauthenticated reads of
	 * `publish` posts; guidelines store private data and require an
	 * authenticated user with read access.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		$post_type = get_post_type_object( $this->post_type );
		if ( ! current_user_can( $post_type->cap->read ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to view guidelines.', 'gutenberg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return parent::get_items_permissions_check( $request );
	}

	/**
	 * Scope collection queries to rows readable by the current user.
	 *
	 * The parent controller filters unreadable posts after the query runs, but
	 * collection totals and pagination headers are based on the unfiltered
	 * query. Setting `perm` lets WP_Query apply private-post visibility before
	 * totals are calculated.
	 *
	 * @param array                $prepared_args Prepared WP_Query arguments.
	 * @param WP_REST_Request|null $request       Full details about the request.
	 * @return array Updated WP_Query arguments.
	 */
	protected function prepare_items_query( $prepared_args = array(), $request = null ) {
		$query_args         = parent::prepare_items_query( $prepared_args, $request );
		$query_args['perm'] = 'readable';

		return $query_args;
	}

	/**
	 * Gate per-item reads on the user-specific read capability.
	 *
	 * The default treats every `publish` post as universally readable;
	 * guidelines reach the parent's checks only after `read_post` passes,
	 * which factors in ownership and status.
	 *
	 * @param WP_Post $post Post object.
	 * @return bool Whether the post can be read.
	 */
	public function check_read_permission( $post ) {
		if ( ! current_user_can( 'read_post', $post->ID ) ) {
			return false;
		}

		return parent::check_read_permission( $post );
	}

	/**
	 * Restrict the status surface for callers without publish capability
	 * to `private`. Administrators retain the parent's full status surface.
	 *
	 * @param string       $post_status Requested post status.
	 * @param WP_Post_Type $post_type   Post type object.
	 * @return string|WP_Error Status, or WP_Error if not permitted.
	 */
	protected function handle_status_param( $post_status, $post_type ) {
		if ( ! current_user_can( $post_type->cap->publish_posts ) ) {
			if ( 'private' !== $post_status ) {
				return new WP_Error(
					'rest_cannot_publish',
					__( 'Sorry, you are only allowed to set status to private for guidelines.', 'gutenberg' ),
					array( 'status' => rest_authorization_required_code() )
				);
			}
			return $post_status;
		}

		return parent::handle_status_param( $post_status, $post_type );
	}

	/**
	 * Default the status to `private` on create when none is supplied
	 * (the parent would fall back to `draft`). Updates pass through so a
	 * partial PATCH preserves the existing status.
	 *
	 * `wp_guideline_type` is optional on create. When omitted, the post
	 * falls back to the default guideline taxonomy term `artifact`.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return stdClass|WP_Error Prepared post object or error.
	 */
	protected function prepare_item_for_database( $request ) {
		if ( ! isset( $request['id'] ) && null === $request['status'] ) {
			$request->set_param( 'status', 'private' );
		}
		return parent::prepare_item_for_database( $request );
	}
}
