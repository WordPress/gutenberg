<?php
/**
 * REST API: WP_REST_Dummy_Search_Handler class
 *
 * @package gutenberg
 */

/**
 * Test class extending WP_REST_Search_Handler
 */
class WP_REST_Dummy_Search_Handler extends WP_REST_Search_Handler {

	protected $items = array();

	public function __construct( $amount = 10 ) {
		$this->type = 'dummy';

		$this->subtypes = array( 'dummy_first_type', 'dummy_second_type' );

		$this->items = array();
		for ( $i = 1; $i <= $amount; $i++ ) {
			$subtype = $i > $amount / 2 ? 'dummy_second_type' : 'dummy_first_type';

			$this->items[ $i ] = (object) array(
				'dummy_id'    => $i,
				'dummy_title' => sprintf( 'Title %d', $i ),
				'dummy_url'   => sprintf( home_url( '/dummies/%d' ), $i ),
				'dummy_type'  => $subtype,
			);
		}
	}

	public function search_items( WP_REST_Request $request ) {
		$subtypes = $request[ WP_REST_Search_Controller::PROP_SUBTYPE ];
		if ( in_array( WP_REST_Search_Controller::TYPE_ANY, $subtypes, true ) ) {
			$subtypes = $this->subtypes;
		}

		$results = array();
		foreach ( $subtypes as $subtype ) {
			$results = array_merge( $results, wp_list_filter( array_values( $this->items ), array( 'dummy_type' => $subtype ) ) );
		}

		$results = wp_list_sort( $results, 'dummy_id', 'DESC' );

		$number = (int) $request['per_page'];
		$offset = (int) $request['per_page'] * ( (int) $request['page'] - 1 );

		$total = count( $results );

		$results = array_slice( $results, $offset, $number );

		return array(
			self::RESULT_IDS   => wp_list_pluck( $results, 'dummy_id' ),
			self::RESULT_TOTAL => $total,
		);
	}

	public function prepare_item( $id, array $fields ) {
		$dummy = $this->items[ $id ];

		$data = array();

		if ( in_array( WP_REST_Search_Controller::PROP_ID, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_ID ] = (int) $dummy->dummy_id;
		}

		if ( in_array( WP_REST_Search_Controller::PROP_TITLE, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_TITLE ] = $dummy->dummy_title;
		}

		if ( in_array( WP_REST_Search_Controller::PROP_URL, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_URL ] = $dummy->dummy_url;
		}

		if ( in_array( WP_REST_Search_Controller::PROP_TYPE, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_TYPE ] = $this->type;
		}

		if ( in_array( WP_REST_Search_Controller::PROP_SUBTYPE, $fields, true ) ) {
			$data[ WP_REST_Search_Controller::PROP_SUBTYPE ] = $dummy->dummy_type;
		}

		return $data;
	}

	public function prepare_item_links( $id ) {
		return array();
	}
}
