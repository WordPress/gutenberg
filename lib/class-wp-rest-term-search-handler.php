<?php
/**
 * REST API: WP_REST_Terms_Search_Handler class
 *
 * @package Gutenberg
 */

/**
 * Core class representing a search handler for term in the REST API.
 *
 * @see WP_REST_Search_Handler
 */
class WP_REST_Term_Search_Handler extends WP_REST_Search_Handler {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->type = 'term';

		$this->subtypes = array_values(
			get_taxonomies(
				array(
					'public'       => true,
					'show_in_rest' => true,
				),
				'names'
			)
		);
	}

	/**
	 * Searches the object type content for a given search request.
	 *
	 * @param WP_REST_Request $request Full REST request.
	 * @return array Associative array containing an `WP_REST_Search_Handler::RESULT_IDS` containing
	 *               an array of found IDs and `WP_REST_Search_Handler::RESULT_TOTAL` containing the
	 *               total count for the matching search results.
	 */
	public function search_items( WP_REST_Request $request ) {
		$taxonomies = $request[ WP_REST_Search_Controller::PROP_SUBTYPE ];
		if ( in_array( WP_REST_Search_Controller::TYPE_ANY, $taxonomies, true ) ) {
			$taxonomies = $this->subtypes;
		}

		$page     = (int) $request['page'];
		$per_page = (int) $request['per_page'];

		$query_args = array(
			'taxonomy'   => $taxonomies,
			'hide_empty' => false,
			'offset'     => ( $page - 1 ) * $per_page,
			'number'     => $per_page,
			'fields'     => 'ids',
		);

		if ( ! empty( $request['search'] ) ) {
			$query_args['search'] = $request['search'];
		}

		/**
		 * Filters the query arguments for a search request.
		 *
		 * Enables adding extra arguments or setting defaults for a term search request.
		 *
		 * @param array           $query_args Key value array of query var to query value.
		 * @param WP_REST_Request $request    The request used.
		 */
		$query_args = apply_filters( 'rest_term_search_query', $query_args, $request );

		$query = new WP_Term_Query();

		$found_ids = $query->query( $query_args );

		unset( $query_args['offset'], $query_args['number'] );
		$query_args['fields'] = 'count';

		$total = (int) $query->query( $query_args );

		return array(
			self::RESULT_IDS   => $found_ids,
			self::RESULT_TOTAL => $total,
		);
	}

	/**
	 * Prepares the search result for a given ID.
	 *
	 * @param int   $id     Item ID.
	 * @param array $fields Fields to include for the item.
	 * @return array Associative array containing all fields for the item.
	 */
	public function prepare_item( $id, array $fields ) {
		$term = get_term( $id );

		$data = array();

		if ( in_array( WP_REST_Search_Controller::PROP_ID, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_ID ] = (int) $id;
		}
		if ( in_array( WP_REST_Search_Controller::PROP_TITLE, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_TITLE ] = $term->name;
		}
		if ( in_array( WP_REST_Search_Controller::PROP_URL, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_URL ] = get_term_link( $id );
		}
		if ( in_array( WP_REST_Search_Controller::PROP_TYPE, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_TYPE ] = $term->taxonomy;
		}

		return $data;
	}

	/**
	 * Prepares links for the search result of a given ID.
	 *
	 * @param int $id Item ID.
	 * @return array Links for the given item.
	 */
	public function prepare_item_links( $id ) {
		$term = get_term( $id );

		$links = array();

		$item_route = $this->detect_rest_item_route( $term );
		if ( $item_route ) {
			$links['self'] = array(
				'href'       => rest_url( $item_route ),
				'embeddable' => true,
			);
		}

		$links['about'] = array(
			'href' => rest_url( sprintf( 'wp/v2/taxonomies/%s', $term->taxonomy ) ),
		);

		return $links;
	}

	/**
	 * Attempts to detect the route to access a single item.
	 *
	 * @param WP_Term $term Term object.
	 * @return string|null REST route relative to the REST base URI, or null if unknown.
	 */
	protected function detect_rest_item_route( $term ) {
		$taxonomy = get_taxonomy( $term->taxonomy );
		if ( ! $taxonomy ) {
			return null;
		}

		// It's currently impossible to detect the REST URL from a custom controller.
		if ( ! empty( $taxonomy->rest_controller_class ) && 'WP_REST_Terms_Controller' !== $taxonomy->rest_controller_class ) {
			return null;
		}

		$rest_base = ! empty( $taxonomy->rest_base ) ? $taxonomy->rest_base : $taxonomy->name;

		return sprintf( 'wp/v2/%s/%d', $rest_base, $term->term_id );
	}

}
