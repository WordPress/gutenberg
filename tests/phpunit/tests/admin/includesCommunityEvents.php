<?php
/**
 * Unit tests for methods in WP_Community_Events.
 *
 * @package WordPress
 * @subpackage UnitTests
 * @since 4.8.0
 */

/**
 * Class Test_WP_Community_Events.
 *
 * @group admin
 * @group community-events
 *
 * @since 4.8.0
 */
class Test_WP_Community_Events extends WP_UnitTestCase {
	/**
	 * An instance of the class to test.
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @var WP_Community_Events
	 */
	private $instance;

	/**
	 * Performs setup tasks for every test.
	 *
	 * @since 4.8.0
	 */
	public function setUp() {
		parent::setUp();

		require_once( ABSPATH . 'wp-admin/includes/class-wp-community-events.php' );

		$this->instance = new WP_Community_Events( 1, $this->get_user_location() );
	}

	/**
	 * Simulates a stored user location.
	 *
	 * @access private
	 * @since 4.8.0
	 *
	 * @return array The mock location.
	 */
	private function get_user_location() {
		return array(
			'description' => 'San Francisco',
			'latitude'    => '37.7749300',
			'longitude'   => '-122.4194200',
			'country'     => 'US',
		);
	}

	/**
	 * Test: get_events() should return an instance of WP_Error if the response code is not 200.
	 *
	 * @since 4.8.0
	 */
	public function test_get_events_bad_response_code() {
		add_filter( 'pre_http_request', array( $this, '_http_request_bad_response_code' ) );

		$this->assertWPError( $this->instance->get_events() );

		remove_filter( 'pre_http_request', array( $this, '_http_request_bad_response_code' ) );
	}

	/**
	 * Test: The response body should not be cached if the response code is not 200.
	 *
	 * @since 4.8.0
	 */
	public function test_get_cached_events_bad_response_code() {
		add_filter( 'pre_http_request', array( $this, '_http_request_bad_response_code' ) );

		$this->instance->get_events();

		$this->assertFalse( $this->instance->get_cached_events() );

		remove_filter( 'pre_http_request', array( $this, '_http_request_bad_response_code' ) );
	}

	/**
	 * Simulates an HTTP response with a non-200 response code.
	 *
	 * @since 4.8.0
	 *
	 * @return array A mock response with a 404 HTTP status code
	 */
	public function _http_request_bad_response_code() {
		return array(
			'headers'  => '',
			'body'     => '',
			'response' => array(
				'code' => 404,
			),
			'cookies'  => '',
			'filename' => '',
		);
	}

	/**
	 * Test: get_events() should return an instance of WP_Error if the response body does not have
	 * the required properties.
	 *
	 * @since 4.8.0
	 */
	public function test_get_events_invalid_response() {
		add_filter( 'pre_http_request', array( $this, '_http_request_invalid_response' ) );

		$this->assertWPError( $this->instance->get_events() );

		remove_filter( 'pre_http_request', array( $this, '_http_request_invalid_response' ) );
	}

	/**
	 * Test: The response body should not be cached if it does not have the required properties.
	 *
	 * @since 4.8.0
	 */
	public function test_get_cached_events_invalid_response() {
		add_filter( 'pre_http_request', array( $this, '_http_request_invalid_response' ) );

		$this->instance->get_events();

		$this->assertFalse( $this->instance->get_cached_events() );

		remove_filter( 'pre_http_request', array( $this, '_http_request_invalid_response' ) );
	}

	/**
	 * Simulates an HTTP response with a body that does not have the required properties.
	 *
	 * @since 4.8.0
	 *
	 * @return array A mock response that's missing required properties.
	 */
	public function _http_request_invalid_response() {
		return array(
			'headers'  => '',
			'body'     => wp_json_encode( array() ),
			'response' => array(
				'code' => 200,
			),
			'cookies'  => '',
			'filename' => '',
		);
	}

	/**
	 * Test: With a valid response, get_events() should return an associated array containing a location array and
	 * an events array with individual events that have formatted time and date.
	 *
	 * @since 4.8.0
	 */
	public function test_get_events_valid_response() {
		add_filter( 'pre_http_request', array( $this, '_http_request_valid_response' ) );

		$response = $this->instance->get_events();

		$this->assertNotWPError( $response );
		$this->assertEqualSetsWithIndex( $this->get_user_location(), $response['location'] );
		$this->assertEquals( date( 'l, M j, Y', strtotime( 'next Sunday 1pm' ) ), $response['events'][0]['formatted_date'] );
		$this->assertEquals( '1:00 pm', $response['events'][0]['formatted_time'] );

		remove_filter( 'pre_http_request', array( $this, '_http_request_valid_response' ) );
	}

	/**
	 * Test: get_cached_events() should return the same data as get_events(), including formatted time
	 * and date values for each event.
	 *
	 * @since 4.8.0
	 */
	public function test_get_cached_events_valid_response() {
		add_filter( 'pre_http_request', array( $this, '_http_request_valid_response' ) );

		$this->instance->get_events();

		$cached_events = $this->instance->get_cached_events();

		$this->assertNotWPError( $cached_events );
		$this->assertEqualSetsWithIndex( $this->get_user_location(), $cached_events['location'] );
		$this->assertEquals( date( 'l, M j, Y', strtotime( 'next Sunday 1pm' ) ), $cached_events['events'][0]['formatted_date'] );
		$this->assertEquals( '1:00 pm', $cached_events['events'][0]['formatted_time'] );

		remove_filter( 'pre_http_request', array( $this, '_http_request_valid_response' ) );
	}

	/**
	 * Simulates an HTTP response with valid location and event data.
	 *
	 * @since 4.8.0
	 *
	 * @return array A mock HTTP response with valid data.
	 */
	public function _http_request_valid_response() {
		return array(
			'headers'  => '',
			'body'     => wp_json_encode( array(
				'location' => $this->get_user_location(),
				'events'   => array(
					array(
						'type'           => 'meetup',
						'title'          => 'Flexbox + CSS Grid: Magic for Responsive Layouts',
						'url'            => 'https://www.meetup.com/Eastbay-WordPress-Meetup/events/236031233/',
						'meetup'         => 'The East Bay WordPress Meetup Group',
						'meetup_url'     => 'https://www.meetup.com/Eastbay-WordPress-Meetup/',
						'date'           => date( 'Y-m-d H:i:s', strtotime( 'next Sunday 1pm' ) ),
						'location'       => array(
							'location'  => 'Oakland, CA, USA',
							'country'   => 'us',
							'latitude'  => 37.808453,
							'longitude' => -122.26593,
						),
					),
					array(
						'type'           => 'meetup',
						'title'          => 'Part 3- Site Maintenance - Tools to Make It Easy',
						'url'            => 'https://www.meetup.com/Wordpress-Bay-Area-CA-Foothills/events/237706839/',
						'meetup'         => 'WordPress Bay Area Foothills Group',
						'meetup_url'     => 'https://www.meetup.com/Wordpress-Bay-Area-CA-Foothills/',
						'date'           => date( 'Y-m-d H:i:s', strtotime( 'next Wednesday 1:30pm' ) ),
						'location'       => array(
							'location'  => 'Milpitas, CA, USA',
							'country'   => 'us',
							'latitude'  => 37.432813,
							'longitude' => -121.907095,
						),
					),
					array(
						'type'           => 'wordcamp',
						'title'          => 'WordCamp Kansas City',
						'url'            => 'https://2017.kansascity.wordcamp.org',
						'meetup'         => null,
						'meetup_url'     => null,
						'date'           => date( 'Y-m-d H:i:s', strtotime( 'next Saturday' ) ),
						'location'       => array(
							'location'  => 'Kansas City, MO',
							'country'   => 'US',
							'latitude'  => 39.0392325,
							'longitude' => -94.577076,
						),
					),
				),
			) ),
			'response' => array(
				'code' => 200,
			),
			'cookies'  => '',
			'filename' => '',
		);
	}

	/**
	 * Test: get_events() should return the events with the WordCamp pinned in the prepared list.
	 *
	 * @since 4.9.7
	 */
	public function test_get_events_pin_wordcamp() {
		add_filter( 'pre_http_request', array( $this, '_http_request_valid_response_unpinned_wordcamp' ) );

		$response_body = $this->instance->get_events();

		/*
		 * San Diego was at position 3 in the mock API response, but pinning puts it at position 2,
		 * so that it remains in the list. The other events should remain unchanged.
		 */
		$this->assertCount( 3, $response_body['events'] );
		$this->assertEquals( $response_body['events'][0]['title'], 'Flexbox + CSS Grid: Magic for Responsive Layouts' );
		$this->assertEquals( $response_body['events'][1]['title'], 'Part 3- Site Maintenance - Tools to Make It Easy' );
		$this->assertEquals( $response_body['events'][2]['title'], 'WordCamp San Diego' );

		remove_filter( 'pre_http_request', array( $this, '_http_request_valid_response_unpinned_wordcamp' ) );
	}

	/**
	 * Simulates a valid HTTP response where a WordCamp needs to be pinned higher than it's default position.
	 *
	 * @since 4.9.7
	 *
	 * @return array A mock HTTP response.
	 */
	public function _http_request_valid_response_unpinned_wordcamp() {
		return array(
			'headers'  => '',
			'response' => array( 'code' => 200 ),
			'cookies'  => '',
			'filename' => '',
			'body'     => wp_json_encode(
				array(
					'location' => $this->get_user_location(),
					'events'   => array(
						array(
							'type'       => 'meetup',
							'title'      => 'Flexbox + CSS Grid: Magic for Responsive Layouts',
							'url'        => 'https://www.meetup.com/Eastbay-WordPress-Meetup/events/236031233/',
							'meetup'     => 'The East Bay WordPress Meetup Group',
							'meetup_url' => 'https://www.meetup.com/Eastbay-WordPress-Meetup/',
							'date'       => date( 'Y-m-d H:i:s', strtotime( 'next Monday 1pm' ) ),
							'location'   => array(
								'location'  => 'Oakland, CA, USA',
								'country'   => 'us',
								'latitude'  => 37.808453,
								'longitude' => -122.26593,
							),
						),
						array(
							'type'       => 'meetup',
							'title'      => 'Part 3- Site Maintenance - Tools to Make It Easy',
							'url'        => 'https://www.meetup.com/Wordpress-Bay-Area-CA-Foothills/events/237706839/',
							'meetup'     => 'WordPress Bay Area Foothills Group',
							'meetup_url' => 'https://www.meetup.com/Wordpress-Bay-Area-CA-Foothills/',
							'date'       => date( 'Y-m-d H:i:s', strtotime( 'next Tuesday 1:30pm' ) ),
							'location'   => array(
								'location'  => 'Milpitas, CA, USA',
								'country'   => 'us',
								'latitude'  => 37.432813,
								'longitude' => -121.907095,
							),
						),
						array(
							'type'       => 'meetup',
							'title'      => 'WordPress Q&A',
							'url'        => 'https://www.meetup.com/sanjosewp/events/245419844/',
							'meetup'     => 'The San Jose WordPress Meetup',
							'meetup_url' => 'https://www.meetup.com/sanjosewp/',
							'date'       => date( 'Y-m-d H:i:s', strtotime( 'next Wednesday 5:30pm' ) ),
							'location'   => array(
								'location'  => 'Milpitas, CA, USA',
								'country'   => 'us',
								'latitude'  => 37.244194,
								'longitude' => -121.889313,
							),
						),
						array(
							'type'       => 'wordcamp',
							'title'      => 'WordCamp San Diego',
							'url'        => 'https://2018.sandiego.wordcamp.org',
							'meetup'     => null,
							'meetup_url' => null,
							'date'       => date( 'Y-m-d H:i:s', strtotime( 'next Thursday 9am' ) ),
							'location'   => array(
								'location'  => 'San Diego, CA',
								'country'   => 'US',
								'latitude'  => 32.7220419,
								'longitude' => -117.1534513,
							),
						),
					),
				)
			),
		);
	}

	/**
	 * Test: get_events() shouldn't stick an extra WordCamp when there's already one that naturally
	 * falls into the list.
	 *
	 * @since 4.9.7
	 */
	public function test_get_events_dont_pin_multiple_wordcamps() {
		add_filter( 'pre_http_request', array( $this, '_http_request_valid_response_multiple_wordcamps' ) );

		$response_body = $this->instance->get_events();

		/*
		 * The first meetup should be removed because it's expired, while the next 3 events are selected.
		 * WordCamp LA should not be stuck to the list, because San Diego already appears naturally.
		 */
		$this->assertCount( 3, $response_body['events'] );
		$this->assertEquals( $response_body['events'][0]['title'], 'WordCamp San Diego' );
		$this->assertEquals( $response_body['events'][1]['title'], 'Part 3- Site Maintenance - Tools to Make It Easy' );
		$this->assertEquals( $response_body['events'][2]['title'], 'WordPress Q&A' );

		remove_filter( 'pre_http_request', array( $this, '_http_request_valid_response_multiple_wordcamps' ) );
	}

	/**
	 * Simulates a valid HTTP response where a WordCamp needs to be pinned higher than it's default position.
	 * no need to pin extra camp b/c one already exists in response
	 *
	 * @since 4.9.7
	 *
	 * @return array A mock HTTP response.
	 */
	public function _http_request_valid_response_multiple_wordcamps() {
		return array(
			'headers'  => '',
			'response' => array( 'code' => 200 ),
			'cookies'  => '',
			'filename' => '',
			'body'     => wp_json_encode(
				array(
					'location' => $this->get_user_location(),
					'events'   => array(
						array(
							'type'       => 'meetup',
							'title'      => 'Flexbox + CSS Grid: Magic for Responsive Layouts',
							'url'        => 'https://www.meetup.com/Eastbay-WordPress-Meetup/events/236031233/',
							'meetup'     => 'The East Bay WordPress Meetup Group',
							'meetup_url' => 'https://www.meetup.com/Eastbay-WordPress-Meetup/',
							'date'       => date( 'Y-m-d H:i:s', strtotime( '2 days ago' ) ),
							'location'   => array(
								'location'  => 'Oakland, CA, USA',
								'country'   => 'us',
								'latitude'  => 37.808453,
								'longitude' => -122.26593,
							),
						),
						array(
							'type'       => 'wordcamp',
							'title'      => 'WordCamp San Diego',
							'url'        => 'https://2018.sandiego.wordcamp.org',
							'meetup'     => null,
							'meetup_url' => null,
							'date'       => date( 'Y-m-d H:i:s', strtotime( 'next Tuesday 9am' ) ),
							'location'   => array(
								'location'  => 'San Diego, CA',
								'country'   => 'US',
								'latitude'  => 32.7220419,
								'longitude' => -117.1534513,
							),
						),
						array(
							'type'       => 'meetup',
							'title'      => 'Part 3- Site Maintenance - Tools to Make It Easy',
							'url'        => 'https://www.meetup.com/Wordpress-Bay-Area-CA-Foothills/events/237706839/',
							'meetup'     => 'WordPress Bay Area Foothills Group',
							'meetup_url' => 'https://www.meetup.com/Wordpress-Bay-Area-CA-Foothills/',
							'date'       => date( 'Y-m-d H:i:s', strtotime( 'next Wednesday 1:30pm' ) ),
							'location'   => array(
								'location'  => 'Milpitas, CA, USA',
								'country'   => 'us',
								'latitude'  => 37.432813,
								'longitude' => -121.907095,
							),
						),
						array(
							'type'       => 'meetup',
							'title'      => 'WordPress Q&A',
							'url'        => 'https://www.meetup.com/sanjosewp/events/245419844/',
							'meetup'     => 'The San Jose WordPress Meetup',
							'meetup_url' => 'https://www.meetup.com/sanjosewp/',
							'date'       => date( 'Y-m-d H:i:s', strtotime( 'next Thursday 5:30pm' ) ),
							'location'   => array(
								'location'  => 'Milpitas, CA, USA',
								'country'   => 'us',
								'latitude'  => 37.244194,
								'longitude' => -121.889313,
							),
						),
						array(
							'type'       => 'wordcamp',
							'title'      => 'WordCamp Los Angeles',
							'url'        => 'https://2018.la.wordcamp.org',
							'meetup'     => null,
							'meetup_url' => null,
							'date'       => date( 'Y-m-d H:i:s', strtotime( 'next Friday 9am' ) ),
							'location'   => array(
								'location'  => 'Los Angeles, CA',
								'country'   => 'US',
								'latitude'  => 34.050888,
								'longitude' => -118.285426,
							),
						),
					),
				)
			),
		);
	}

	/**
	 * Test that get_unsafe_client_ip() properly anonymizes all possible address formats
	 *
	 * @dataProvider data_get_unsafe_client_ip
	 *
	 * @ticket 41083
	 */
	public function test_get_unsafe_client_ip( $raw_ip, $expected_result ) {
		$_SERVER['REMOTE_ADDR']    = 'this should not be used';
		$_SERVER['HTTP_CLIENT_IP'] = $raw_ip;
		$actual_result             = WP_Community_Events::get_unsafe_client_ip();

		$this->assertEquals( $expected_result, $actual_result );
	}

	/**
	 * Provide test cases for `test_get_unsafe_client_ip()`.
	 *
	 * @return array
	 */
	public function data_get_unsafe_client_ip() {
		return array(
			// Handle '::' returned from `wp_privacy_anonymize_ip()`.
			array(
				'or=\"[1000:0000:0000:0000:0000:0000:0000:0001',
				false,
			),

			// Handle '0.0.0.0' returned from `wp_privacy_anonymize_ip()`.
			array(
				'unknown',
				false,
			),

			// Valid IPv4.
			array(
				'198.143.164.252',
				'198.143.164.0',
			),

			// Valid IPv6.
			array(
				'2a03:2880:2110:df07:face:b00c::1',
				'2a03:2880:2110:df07::',
			),
		);
	}
}
