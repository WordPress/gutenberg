<?php
/**
 * Reusable blocks REST API: WP_REST_Blocks_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 5.0.0
 */

/**
 * Controller which provides a REST endpoint for the editor to read, create,
 * edit and delete reusable blocks. Blocks are stored as posts with the wp_block
 * post type.
 *
 * @since 5.0.0
 *
 * @see WP_REST_Posts_Controller
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Blocks_Controller_6_4 extends Gutenberg_REST_Blocks_Controller {
	/**
	 * Gets the link relations available for the post and current user.
	 *
	 * @since 6.4.0 Ensures that only users with `edit_terms` capability can add taxonomy terms.
	 *
	 * @param WP_Post         $post    Post object.
	 * @param WP_REST_Request $request Request object.
	 * @return array List of link relations.
	 */
	protected function get_available_actions( $post, $request ) {

		if ( 'edit' !== $request['context'] ) {
			return array();
		}

		$rels = array();

		$post_type = get_post_type_object( $post->post_type );

		if ( 'attachment' !== $this->post_type && current_user_can( $post_type->cap->publish_posts ) ) {
			$rels[] = 'https://api.w.org/action-publish';
		}

		if ( current_user_can( 'unfiltered_html' ) ) {
			$rels[] = 'https://api.w.org/action-unfiltered-html';
		}

		if ( 'post' === $post_type->name ) {
			if ( current_user_can( $post_type->cap->edit_others_posts ) && current_user_can( $post_type->cap->publish_posts ) ) {
				$rels[] = 'https://api.w.org/action-sticky';
			}
		}

		if ( post_type_supports( $post_type->name, 'author' ) ) {
			if ( current_user_can( $post_type->cap->edit_others_posts ) ) {
				$rels[] = 'https://api.w.org/action-assign-author';
			}
		}

		$taxonomies = wp_list_filter( get_object_taxonomies( $this->post_type, 'objects' ), array( 'show_in_rest' => true ) );

		foreach ( $taxonomies as $tax ) {
			$tax_base   = ! empty( $tax->rest_base ) ? $tax->rest_base : $tax->name;

			if ( current_user_can( $tax->cap->edit_terms ) ) {
				$rels[] = 'https://api.w.org/action-create-' . $tax_base;
			}

			if ( current_user_can( $tax->cap->assign_terms ) ) {
				$rels[] = 'https://api.w.org/action-assign-' . $tax_base;
			}
		}

		return $rels;
	}
}
