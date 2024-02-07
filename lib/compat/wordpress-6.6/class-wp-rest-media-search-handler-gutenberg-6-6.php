<?php
/**
 * REST API: WP_REST_Media_Search_Handler class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.6.0
 * */

if ( class_exists( 'WP_REST_Media_Search_Handler' ) ) {
	return;
}

/**
 * Core class representing a search handler for attachments in the REST API.
 *
 * @since 6.6.0
 *
 * @see WP_REST_Search_Handler
 */
class WP_REST_Media_Search_Handler_Gutenberg extends WP_REST_Post_Search_Handler {

	/**
	 * Constructor.
	 *
	 * @since 6.6.0
	 */
	public function __construct() {
		parent::__construct();
		$this->type     = 'media';
		$this->subtypes = array();
	}

	/**
	 * Searches the object type content for a given search request.
	 *
	 * @since 6.6.0
	 *
	 * @param WP_REST_Request $request Full REST request.
	 * @return array Associative array containing an `WP_REST_Search_Handler::RESULT_IDS` containing
	 *               an array of found IDs and `WP_REST_Search_Handler::RESULT_TOTAL` containing the
	 *               total count for the matching search results.
	 */
	public function search_items( WP_REST_Request $request ) {

		$query_args = array(
			'post_type'      => 'attachment',
			'post_status'    => 'inherit',
			'paged'          => (int) $request['page'],
			'posts_per_page' => (int) $request['per_page'],
		);

		if ( ! empty( $request['search'] ) ) {
			$query_args['s'] = $request['search'];

			// Filter query clauses to include filenames.
			add_filter( 'wp_allow_query_attachment_by_filename', '__return_true' );
		}

		if ( ! empty( $request['exclude'] ) ) {
			$query_args['post__not_in'] = $request['exclude'];
		}

		if ( ! empty( $request['include'] ) ) {
			$query_args['post__in'] = $request['include'];
		}

		/**
		 * Filters the query arguments for a REST API search request.
		 *
		 * Enables adding extra arguments or setting defaults for a media search request.
		 *
		 * @since 6.6.0
		 *
		 * @param array           $query_args Key value array of query var to query value.
		 * @param WP_REST_Request $request    The request used.
		 */
		$query_args = apply_filters( 'rest_media_search_query', $query_args, $request );

		$query = new WP_Query();
		$posts = $query->query( $query_args );
		// Querying the whole post object will warm the object cache, avoiding an extra query per result.
		$found_ids = wp_list_pluck( $posts, 'ID' );
		$total     = $query->found_posts;

		return array(
			self::RESULT_IDS   => $found_ids,
			self::RESULT_TOTAL => $total,
		);
	}

	/**
	 * Prepares the search result for a given ID.
	 *
	 * @since 6.6.0
	 *
	 * @param int   $id     Item ID.
	 * @param array $fields Fields to include for the item.
	 * @return array Associative array containing all fields for the item.
	 */
	public function prepare_item( $id, array $fields ) {
		$data = parent::prepare_item( $id, $fields );

		if ( isset( $data[ WP_REST_Search_Controller::PROP_SUBTYPE ] ) ) {
			unset( $data[ WP_REST_Search_Controller::PROP_SUBTYPE ] );
		}

		return $data;
	}
}