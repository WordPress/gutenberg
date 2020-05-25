<?php
/**
 * REST API: WP_REST_Post_Format_Search_Handler class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 5.5.0
 */

/**
 * Core class representing a search handler for post formats in the REST API.
 *
 * @since 5.5.0
 *
 * @see WP_REST_Search_Handler
 */
class WP_REST_Post_Format_Search_Handler extends WP_REST_Search_Handler {

	/**
	 * Constructor.
	 *
	 * @since 5.0.0
	 */
	public function __construct() {
		$this->type = 'post-format';
	}

	/**
	 * Searches the object type content for a given search request.
	 *
	 * @since 5.0.0
	 *
	 * @param WP_REST_Request $request Full REST request.
	 * @return array Associative array containing an `WP_REST_Search_Handler::RESULT_IDS` containing
	 *               an array of found IDs and `WP_REST_Search_Handler::RESULT_TOTAL` containing the
	 *               total count for the matching search results.
	 */
	public function search_items( WP_REST_Request $request ) {

		$formats         = get_post_format_strings();
		$format_fake_ids = array_keys( $formats );

		if ( ! empty( $request['search'] ) ) {
			$format_search = $request['search'];
		}

		$format_search = apply_filters( 'rest_post_format_search_query', $format_search, $request );

		$found_ids = [];
		foreach ( $format_fake_ids as $format_fake_id => $format_slug ) {
			$format_title       = $formats[ $format_slug ];
			$format_slug_match  = stripos( $format_slug, $format_search ) !== false;
			$format_title_match = stripos( $format_title, $format_search ) !== false;
			if ( $format_slug_match || $format_title_match ) {
				$found_ids[] = $format_fake_id;
			}
		}

		return array(
			self::RESULT_IDS   => $found_ids,
			self::RESULT_TOTAL => count( $found_ids ),
		);
	}

	/**
	 * Prepares the search result for a given ID.
	 *
	 * @since 5.0.0
	 *
	 * @param int   $id     Item ID.
	 * @param array $fields Fields to include for the item.
	 * @return array Associative array containing all fields for the item.
	 */
	public function prepare_item( $id, array $fields ) {
		$formats         = get_post_format_strings();
		$format_fake_ids = array_keys( $formats );
		$format          = $formats[ $format_fake_ids[ $id ] ];

		$data = array();

		if ( in_array( WP_REST_Search_Controller::PROP_ID, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_ID ] = $id;
		}

		if ( in_array( WP_REST_Search_Controller::PROP_TITLE, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_TITLE ] = $format;
		}

		if ( in_array( WP_REST_Search_Controller::PROP_URL, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_URL ] = get_post_format_link( $format_fake_ids[ $id ] );
		}

		if ( in_array( WP_REST_Search_Controller::PROP_TYPE, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_TYPE ] = $this->type;
		}

		return $data;
	}

	public function prepare_item_links( $id ) {
		return [];
	}

}
