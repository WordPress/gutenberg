<?php
/**
 * REST API: Gutenberg_REST_Revisions_Controller class
 *
 * @package gutenberg
 */

/**
 * Controller which provides REST endpoint for revisions.
 *
 * This overrides the core WP_REST_Revisions_Controller to use
 * rest_is_field_included() instead of in_array() for content, title, excerpt,
 * and guid fields. This allows clients to request individual sub-fields
 * (e.g. content.raw without content.rendered) via the _fields parameter,
 * avoiding expensive rendering when only raw data is needed.
 *
 * @see WP_REST_Revisions_Controller
 */
class Gutenberg_REST_Revisions_Controller extends WP_REST_Revisions_Controller {

	/**
	 * Prepares the revision for the REST response.
	 *
	 * @param WP_Post         $item    Post revision object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		// Restores the more descriptive, specific name for use within this method.
		$post = $item;

		$GLOBALS['post'] = $post;

		setup_postdata( $post );

		// Don't prepare the response body for HEAD requests.
		if ( $request->is_method( 'HEAD' ) ) {
			/** This filter is documented in wp-includes/rest-api/endpoints/class-wp-rest-revisions-controller.php */
			return apply_filters( 'rest_prepare_revision', new WP_REST_Response( array() ), $post, $request );
		}

		$fields = $this->get_fields_for_response( $request );
		$data   = array();

		if ( in_array( 'author', $fields, true ) ) {
			$data['author'] = (int) $post->post_author;
		}

		if ( in_array( 'date', $fields, true ) ) {
			$data['date'] = $this->prepare_date_response( $post->post_date_gmt, $post->post_date );
		}

		if ( in_array( 'date_gmt', $fields, true ) ) {
			$data['date_gmt'] = $this->prepare_date_response( $post->post_date_gmt );
		}

		if ( in_array( 'id', $fields, true ) ) {
			$data['id'] = $post->ID;
		}

		if ( in_array( 'modified', $fields, true ) ) {
			$data['modified'] = $this->prepare_date_response( $post->post_modified_gmt, $post->post_modified );
		}

		if ( in_array( 'modified_gmt', $fields, true ) ) {
			$data['modified_gmt'] = $this->prepare_date_response( $post->post_modified_gmt );
		}

		if ( in_array( 'parent', $fields, true ) ) {
			$data['parent'] = (int) $post->post_parent;
		}

		if ( in_array( 'slug', $fields, true ) ) {
			$data['slug'] = $post->post_name;
		}

		if ( rest_is_field_included( 'guid', $fields ) ) {
			$data['guid'] = array();
		}
		if ( rest_is_field_included( 'guid.rendered', $fields ) ) {
			/** This filter is documented in wp-includes/post-template.php */
			$data['guid']['rendered'] = apply_filters( 'get_the_guid', $post->guid, $post->ID );
		}
		if ( rest_is_field_included( 'guid.raw', $fields ) ) {
			$data['guid']['raw'] = $post->guid;
		}

		if ( rest_is_field_included( 'title', $fields ) ) {
			$data['title'] = array();
		}
		if ( rest_is_field_included( 'title.raw', $fields ) ) {
			$data['title']['raw'] = $post->post_title;
		}
		if ( rest_is_field_included( 'title.rendered', $fields ) ) {
			$data['title']['rendered'] = get_the_title( $post->ID );
		}

		if ( rest_is_field_included( 'content', $fields ) ) {
			$data['content'] = array();
		}
		if ( rest_is_field_included( 'content.raw', $fields ) ) {
			$data['content']['raw'] = $post->post_content;
		}
		if ( rest_is_field_included( 'content.rendered', $fields ) ) {
			/** This filter is documented in wp-includes/post-template.php */
			$data['content']['rendered'] = apply_filters( 'the_content', $post->post_content );
		}

		if ( rest_is_field_included( 'excerpt', $fields ) ) {
			$data['excerpt'] = array();
		}
		if ( rest_is_field_included( 'excerpt.raw', $fields ) ) {
			$data['excerpt']['raw'] = $post->post_excerpt;
		}
		if ( rest_is_field_included( 'excerpt.rendered', $fields ) ) {
			$data['excerpt']['rendered'] = $this->prepare_excerpt_response( $post->post_excerpt, $post );
		}

		if ( rest_is_field_included( 'meta', $fields ) ) {
			$data['meta'] = $this->meta->get_value( $post->ID, $request );
		}

		$context  = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data     = $this->add_additional_fields_to_object( $data, $request );
		$data     = $this->filter_response_by_context( $data, $context );
		$response = rest_ensure_response( $data );

		if ( ! empty( $data['parent'] ) ) {
			$response->add_link( 'parent', rest_url( rest_get_route_for_post( $data['parent'] ) ) );
		}

		/**
		 * Filters a revision returned from the REST API.
		 *
		 * Allows modification of the revision right before it is returned.
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param WP_Post          $post     The original revision object.
		 * @param WP_REST_Request  $request  Request used to generate the response.
		 */
		return apply_filters( 'rest_prepare_revision', $response, $post, $request );
	}
}
