<?php

if ( is_multisite() ) :

/**
 * Test site query functionality in multisite.
 *
 * @group ms-site
 * @group multisite
 */
class Tests_Multisite_Site_Query extends WP_UnitTestCase {
	protected static $network_ids;
	protected static $site_ids;

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
			'wordpress.org/'         => array( 'domain' => 'wordpress.org', 'path' => '/' ),
			'make.wordpress.org/'    => array( 'domain' => 'make.wordpress.org', 'path' => '/' ),
			'www.wordpress.net/'     => array( 'domain' => 'www.wordpress.net', 'path' => '/' ),
		);

		foreach ( self::$network_ids as &$id ) {
			$id = $factory->network->create( $id );
		}
		unset( $id );

		self::$site_ids = array(
			'wordpress.org/'              => array( 'domain' => 'wordpress.org',      'path' => '/',         'site_id' => self::$network_ids['wordpress.org/'] ),
			'wordpress.org/foo/'          => array( 'domain' => 'wordpress.org',      'path' => '/foo/',     'site_id' => self::$network_ids['wordpress.org/'] ),
			'wordpress.org/foo/bar/'      => array( 'domain' => 'wordpress.org',      'path' => '/foo/bar/', 'site_id' => self::$network_ids['wordpress.org/'] ),
			'make.wordpress.org/'         => array( 'domain' => 'make.wordpress.org', 'path' => '/',         'site_id' => self::$network_ids['make.wordpress.org/'] ),
			'make.wordpress.org/foo/'     => array( 'domain' => 'make.wordpress.org', 'path' => '/foo/',     'site_id' => self::$network_ids['make.wordpress.org/'] ),
			'www.w.org/'                  => array( 'domain' => 'www.w.org',          'path' => '/' ),
			'www.w.org/foo/'              => array( 'domain' => 'www.w.org',          'path' => '/foo/' ),
			'www.w.org/foo/bar/'          => array( 'domain' => 'www.w.org',          'path' => '/foo/bar/' ),
			'www.w.org/make/'             => array( 'domain' => 'www.w.org',          'path' => '/make/' ),
		);

		foreach ( self::$site_ids as &$id ) {
			$id = $factory->blog->create( $id );
		}
		unset( $id );
	}

	public static function wpTearDownAfterClass() {
		global $wpdb;

		foreach( self::$site_ids as $id ) {
			wpmu_delete_blog( $id, true );
		}

		foreach( self::$network_ids as $id ) {
			$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->sitemeta} WHERE site_id = %d", $id ) );
			$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->site} WHERE id= %d", $id ) );
		}

		wp_update_network_site_counts();
	}

	public function test_wp_site_query_by_ID() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'ID'     => self::$site_ids['www.w.org/'],
		) );

		$this->assertEqualSets( array( self::$site_ids['www.w.org/'] ), $found );
	}

	public function test_wp_site_query_by_number() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'   => 'ids',
			'number' => 3,
		) );

		$this->assertEquals( 3, count( $found ) );
	}

	public function test_wp_site_query_by_site__in_with_single_id() {
		$expected = array( self::$site_ids['wordpress.org/foo/'] );

		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'   => 'ids',
			'site__in' => $expected,
		) );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_site__in_with_multiple_ids() {
		$expected = array( self::$site_ids['wordpress.org/'], self::$site_ids['wordpress.org/foo/'] );

		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'   => 'ids',
			'site__in' => $expected,
		) );

		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * Test the `count` query var
	 */
	public function test_wp_site_query_by_site__in_and_count_with_multiple_ids() {
		$expected = array( self::$site_ids['wordpress.org/'], self::$site_ids['wordpress.org/foo/'] );

		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'   => 'ids',
			'count' => true,
			'site__in' => $expected,
		) );

		$this->assertEquals( 2, $found );
	}

	public function test_wp_site_query_by_site__not_in_with_single_id() {
		$excluded = array( self::$site_ids['wordpress.org/foo/'] );
		$expected = array_diff( self::$site_ids, $excluded );

		// Exclude main site since we don't have control over it here.
		$excluded[] = 1;

		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'site__not_in' => $excluded,
		) );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_site__not_in_with_multiple_ids() {
		$excluded = array( self::$site_ids['wordpress.org/'], self::$site_ids['wordpress.org/foo/'] );
		$expected = array_diff( self::$site_ids, $excluded );

		// Exclude main site since we don't have control over it here.
		$excluded[] = 1;

		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'site__not_in' => $excluded,
		) );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_network_id_with_existing_sites() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'network_id'   => self::$network_ids['make.wordpress.org/'],
		) );

		$expected = array(
			self::$site_ids['make.wordpress.org/'],
			self::$site_ids['make.wordpress.org/foo/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_network_id_with_no_existing_sites() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'network_id'   => self::$network_ids['www.wordpress.net/'],
		) );

		$this->assertEmpty( $found );
	}

	public function test_wp_site_query_by_domain() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'domain'       => 'www.w.org',
		) );

		$expected = array(
			self::$site_ids['www.w.org/'],
			self::$site_ids['www.w.org/foo/'],
			self::$site_ids['www.w.org/foo/bar/'],
			self::$site_ids['www.w.org/make/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_domain_and_offset() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'domain'       => 'www.w.org',
			'offset'       => 1,
		) );

		$expected = array(
			self::$site_ids['www.w.org/foo/'],
			self::$site_ids['www.w.org/foo/bar/'],
			self::$site_ids['www.w.org/make/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_domain_and_number_and_offset() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'domain'       => 'www.w.org',
			'number'       => 2,
			'offset'       => 1,
		) );

		$expected = array(
			self::$site_ids['www.w.org/foo/'],
			self::$site_ids['www.w.org/foo/bar/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_domain__in_with_single_domain() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'domain__in' => array( 'make.wordpress.org' ),
		));

		$expected = array(
			self::$site_ids['make.wordpress.org/'],
			self::$site_ids['make.wordpress.org/foo/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_domain__in_with_multiple_domains() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'domain__in' => array( 'wordpress.org', 'make.wordpress.org' ),
		));

		$expected = array(
			self::$site_ids['wordpress.org/'],
			self::$site_ids['wordpress.org/foo/'],
			self::$site_ids['wordpress.org/foo/bar/'],
			self::$site_ids['make.wordpress.org/'],
			self::$site_ids['make.wordpress.org/foo/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_domain__not_in_with_single_domain() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'domain__not_in' => array( 'www.w.org' ),
		));

		$expected = array(
			get_current_blog_id(), // Account for the initial site added by the test suite.
			self::$site_ids['wordpress.org/'],
			self::$site_ids['wordpress.org/foo/'],
			self::$site_ids['wordpress.org/foo/bar/'],
			self::$site_ids['make.wordpress.org/'],
			self::$site_ids['make.wordpress.org/foo/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_domain__not_in_with_multiple_domains() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'domain__not_in' => array( 'wordpress.org', 'www.w.org' ),
		));

		$expected = array(
			get_current_blog_id(), // Account for the initial site added by the test suite.
			self::$site_ids['make.wordpress.org/'],
			self::$site_ids['make.wordpress.org/foo/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_path_with_expected_results() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'path'         => '/foo/bar/',
		) );

		$expected = array(
			self::$site_ids['wordpress.org/foo/bar/'],
			self::$site_ids['www.w.org/foo/bar/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_path_with_no_expected_results() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'path'         => '/foo/bar/foo/',
		) );

		$this->assertEmpty( $found );
	}

	// archived, mature, spam, deleted, public

	public function test_wp_site_query_by_archived() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			// Exclude main site since we don't have control over it here.
			'site__not_in' => array( 1 ),
			'archived'     => '0',
		) );

		$this->assertEqualSets( array_values( self::$site_ids ), $found );
	}

	public function test_wp_site_query_by_mature() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			// Exclude main site since we don't have control over it here.
			'site__not_in' => array( 1 ),
			'mature'     => '0',
		) );

		$this->assertEqualSets( array_values( self::$site_ids ), $found );
	}

	public function test_wp_site_query_by_spam() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			// Exclude main site since we don't have control over it here.
			'site__not_in' => array( 1 ),
			'spam'     => '0',
		) );

		$this->assertEqualSets( array_values( self::$site_ids ), $found );
	}

	public function test_wp_site_query_by_deleted() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			// Exclude main site since we don't have control over it here.
			'site__not_in' => array( 1 ),
			'deleted'     => '0',
		) );

		$this->assertEqualSets( array_values( self::$site_ids ), $found );
	}

	public function test_wp_site_query_by_deleted_with_no_results() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'deleted'      => '1',
		) );

		$this->assertEmpty( $found );
	}

	public function test_wp_site_query_by_public() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			// Exclude main site since we don't have control over it here.
			'site__not_in' => array( 1 ),
			'public'     => '1',
		) );

		$this->assertEqualSets( array_values( self::$site_ids ), $found );
	}

	public function test_wp_site_query_by_search_with_text_in_domain() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'search'       => 'ke.wordp',
		) );

		$expected = array(
			self::$site_ids['make.wordpress.org/'],
			self::$site_ids['make.wordpress.org/foo/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_search_with_text_in_path() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'search'       => 'foo',
		) );

		$expected = array(
			self::$site_ids['wordpress.org/foo/'],
			self::$site_ids['wordpress.org/foo/bar/'],
			self::$site_ids['make.wordpress.org/foo/'],
			self::$site_ids['www.w.org/foo/'],
			self::$site_ids['www.w.org/foo/bar/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_search_with_text_in_path_and_domain() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'search'       => 'make',
		) );

		$expected = array(
			self::$site_ids['make.wordpress.org/'],
			self::$site_ids['make.wordpress.org/foo/'],
			self::$site_ids['www.w.org/make/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_search_with_text_in_path_and_domain_order_by_domain_desc() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'search'       => 'make',
			'order'        => 'DESC',
			'orderby'      => 'domain',
		) );

		$expected = array(
			self::$site_ids['www.w.org/make/'],
			self::$site_ids['make.wordpress.org/'],
			self::$site_ids['make.wordpress.org/foo/'],
		);

		$this->assertEquals( $expected, $found );
	}

	public function test_wp_site_query_by_search_with_text_in_path_exclude_domain_from_search() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'search' => 'make',
			'search_columns' => array( 'path' ),
		) );

		$expected = array(
			self::$site_ids['www.w.org/make/'],
		);

		$this->assertEquals( $expected, $found );
	}

	public function test_wp_site_query_by_search_with_text_in_domain_exclude_path_from_search() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'search' => 'make',
			'search_columns' => array( 'domain' ),
		) );

		$expected = array(
			self::$site_ids['make.wordpress.org/'],
			self::$site_ids['make.wordpress.org/foo/'],
		);

		$this->assertEquals( $expected, $found );
	}

	public function test_wp_site_query_by_search_with_wildcard_in_text() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields'       => 'ids',
			'search'       => 'm*ke',
		) );

		$expected = array(
			self::$site_ids['www.w.org/make/'],
			self::$site_ids['make.wordpress.org/'],
			self::$site_ids['make.wordpress.org/foo/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_search_with_wildcard_in_text_exclude_path_from_search() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'search' => 'm*ke',
			'search_columns' => array( 'domain' ),
		) );

		$expected = array(
			self::$site_ids['make.wordpress.org/'],
			self::$site_ids['make.wordpress.org/foo/'],
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_wp_site_query_by_search_with_wildcard_in_text_exclude_domain_from_search() {
		$q = new WP_Site_Query();
		$found = $q->query( array(
			'fields' => 'ids',
			'search' => 'm*ke',
			'search_columns' => array( 'path' ),
		) );

		$expected = array(
			self::$site_ids['www.w.org/make/'],
		);

		$this->assertEqualSets( $expected, $found );
	}
}

endif;
