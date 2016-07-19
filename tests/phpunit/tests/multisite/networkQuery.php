<?php

if ( is_multisite() ) :

/**
 * Test network query functionality in multisite.
 *
 * @group ms-network
 * @group ms-network-query
 * @group multisite
 */
class Tests_Multisite_Network_Query extends WP_UnitTestCase {
	protected static $network_ids;

	protected $suppress = false;

	function setUp() {
		global $wpdb;
		parent::setUp();
		$this->suppress = $wpdb->suppress_errors();
	}

	function tearDown() {
		global $wpdb;
		$wpdb->suppress_errors( $this->suppress );
		parent::tearDown();
	}

	public static function wpSetUpBeforeClass( $factory ) {
		self::$network_ids = array(
			'wordpress.org/'         => array( 'domain' => 'wordpress.org',      'path' => '/' ),
			'make.wordpress.org/'    => array( 'domain' => 'make.wordpress.org', 'path' => '/' ),
			'www.wordpress.net/'     => array( 'domain' => 'www.wordpress.net',  'path' => '/' ),
			'www.w.org/foo/'         => array( 'domain' => 'www.w.org',          'path' => '/foo/' ),
		);

		foreach ( self::$network_ids as &$id ) {
			$id = $factory->network->create( $id );
		}
		unset( $id );
	}

	public static function wpTearDownAfterClass() {
		global $wpdb;

		foreach( self::$network_ids as $id ) {
			$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->sitemeta} WHERE site_id = %d", $id ) );
			$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->site} WHERE id= %d", $id ) );
		}
	}

	public function test_wp_network_query_by_number() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'   => 'ids',
			'number'   => 3,
		) );

		$this->assertEquals( 3, count( $found ) );
	}

	public function test_wp_network_query_by_network__in_with_order() {
		$expected = array( self::$network_ids['wordpress.org/'], self::$network_ids['make.wordpress.org/'] );

		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'      => 'ids',
			'network__in' => $expected,
			'order'       => 'ASC',
		) );

		$this->assertEquals( $expected, $found );

		$found = $q->query( array(
			'fields'      => 'ids',
			'network__in' => $expected,
			'order'       => 'DESC',
		) );

		$this->assertEquals( array_reverse( $expected ), $found );
	}

	public function test_wp_network_query_by_network__in_with_single_id() {
		$expected = array( self::$network_ids['wordpress.org/'] );

		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'      => 'ids',
			'network__in' => $expected,
		) );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_network__in_with_multiple_ids() {
		$expected = array( self::$network_ids['wordpress.org/'], self::$network_ids['www.wordpress.net/'] );

		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'      => 'ids',
			'network__in' => $expected,
		) );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_network__in_and_count_with_multiple_ids() {
		$expected = array( self::$network_ids['wordpress.org/'], self::$network_ids['make.wordpress.org/'] );

		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'      => 'ids',
			'count'       => true,
			'network__in' => $expected,
		) );

		$this->assertEquals( 2, $found );
	}

	public function test_wp_network_query_by_network__not_in_with_single_id() {
		$excluded = array( self::$network_ids['wordpress.org/'] );
		$expected = array_diff( self::$network_ids, $excluded );

		// Exclude main network since we don't have control over it here.
		$excluded[] = 1;

		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'          => 'ids',
			'network__not_in' => $excluded,
		) );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_network__not_in_with_multiple_ids() {
		$excluded = array( self::$network_ids['wordpress.org/'], self::$network_ids['www.w.org/foo/'] );
		$expected = array_diff( self::$network_ids, $excluded );

		// Exclude main network since we don't have control over it here.
		$excluded[] = 1;

		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'          => 'ids',
			'network__not_in' => $excluded,
		) );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_domain() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'domain'       => 'www.w.org',
		) );

		$expected = array(
			self::$network_ids['www.w.org/foo/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_domain__in_with_single_domain() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'     => 'ids',
			'domain__in' => array( 'make.wordpress.org' ),
		));

		$expected = array(
			self::$network_ids['make.wordpress.org/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_domain__in_with_multiple_domains() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'     => 'ids',
			'domain__in' => array( 'wordpress.org', 'make.wordpress.org' ),
		));

		$expected = array(
			self::$network_ids['wordpress.org/'],
			self::$network_ids['make.wordpress.org/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_domain__in_with_multiple_domains_and_number() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'     => 'ids',
			'number'     => 1,
			'domain__in' => array( 'wordpress.org', 'make.wordpress.org' ),
		));

		$expected = array(
			self::$network_ids['wordpress.org/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_domain__in_with_multiple_domains_and_number_and_offset() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'     => 'ids',
			'number'     => 1,
			'offset'     => 1,
			'domain__in' => array( 'wordpress.org', 'make.wordpress.org' ),
		));

		$expected = array(
			self::$network_ids['make.wordpress.org/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_domain__not_in_with_single_domain() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'         => 'ids',
			'domain__not_in' => array( 'www.w.org' ),
		));

		$expected = array(
			get_current_site()->id, // Account for the initial network added by the test suite.
			self::$network_ids['wordpress.org/'],
			self::$network_ids['make.wordpress.org/'],
			self::$network_ids['www.wordpress.net/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_domain__not_in_with_multiple_domains() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'         => 'ids',
			'domain__not_in' => array( 'wordpress.org', 'www.w.org' ),
		));

		$expected = array(
			get_current_site()->id, // Account for the initial network added by the test suite.
			self::$network_ids['make.wordpress.org/'],
			self::$network_ids['www.wordpress.net/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_domain__not_in_with_multiple_domains_and_number() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'         => 'ids',
			'number'         => 2,
			'domain__not_in' => array( 'wordpress.org', 'www.w.org' ),
		));

		$expected = array(
			get_current_site()->id, // Account for the initial network added by the test suite.
			self::$network_ids['make.wordpress.org/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_domain__not_in_with_multiple_domains_and_number_and_offset() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'         => 'ids',
			'number'         => 2,
			'offset'         => 1,
			'domain__not_in' => array( 'wordpress.org', 'www.w.org' ),
		));

		$expected = array(
			self::$network_ids['make.wordpress.org/'],
			self::$network_ids['www.wordpress.net/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_path_with_expected_results() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'          => 'ids',
			'path'            => '/',
			'network__not_in' => get_current_site()->id, // Exclude the initial network added by the test suite.
		) );

		$expected = array(
			self::$network_ids['wordpress.org/'],
			self::$network_ids['make.wordpress.org/'],
			self::$network_ids['www.wordpress.net/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_path_and_number_and_offset_with_expected_results() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'          => 'ids',
			'number'          => 1,
			'offset'          => 2,
			'path'            => '/',
			'network__not_in' => get_current_site()->id, // Exclude the initial network added by the test suite.
		) );

		$expected = array(
			self::$network_ids['www.wordpress.net/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_path_with_no_expected_results() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'path'         => '/bar/',
		) );

		$this->assertEmpty( $found );
	}

	public function test_wp_network_query_by_search_with_text_in_domain() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'search'       => 'ww.word',
		) );

		$expected = array(
			self::$network_ids['www.wordpress.net/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_search_with_text_in_path() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'search'       => 'foo',
		) );

		$expected = array(
			self::$network_ids['www.w.org/foo/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_network_query_by_path_order_by_domain_desc() {
		$q = new WP_Network_Query();
		$found = $q->query( array(
			'fields'          => 'ids',
			'path'            => '/',
			'network__not_in' => get_current_site()->id, // Exclude the initial network added by the test suite.
			'order'           => 'DESC',
			'orderby'         => 'domain',
		) );

		$expected = array(
			self::$network_ids['www.wordpress.net/'],
			self::$network_ids['wordpress.org/'],
			self::$network_ids['make.wordpress.org/'],
		);

		$this->assertEquals( $expected, $found );
	}
}

endif;
