<?php

if ( is_multisite() ) :

/**
 * Tests specific to the bootstrap process of Multisite.
 *
 * @group ms-bootstrap
 * @group multisite
 */
class Tests_Multisite_Bootstrap extends WP_UnitTestCase {
	protected static $network_ids;
	protected static $site_ids;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$network_ids = array(
			'wordpress.org/'         => array( 'domain' => 'wordpress.org', 'path' => '/' ),
			'make.wordpress.org/'    => array( 'domain' => 'make.wordpress.org', 'path' => '/' ),
			'wordpress.org/one/'     => array( 'domain' => 'wordpress.org', 'path' => '/one/' ),
			'wordpress.org/one/b/'   => array( 'domain' => 'wordpress.org', 'path' => '/one/b/' ),
			'wordpress.net/'         => array( 'domain' => 'wordpress.net', 'path' => '/' ),
			'www.wordpress.net/'     => array( 'domain' => 'www.wordpress.net', 'path' => '/' ),
			'www.wordpress.net/two/' => array( 'domain' => 'www.wordpress.net', 'path' => '/two/' ),
			'wordpress.net/three/'   => array( 'domain' => 'wordpress.net', 'path' => '/three/' ),
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

	/**
	 * @ticket 27003
	 * @dataProvider data_get_network_by_path
	 *
	 * @param string $expected_key The array key associated with expected data for the test.
	 * @param string $domain       The requested domain.
	 * @param string $path         The requested path.
	 * @param string $message      The message to pass for failed tests.
	 */
	function test_get_network_by_path( $expected_key, $domain, $path, $message ) {
		$network = get_network_by_path( $domain, $path );
		$this->assertEquals( self::$network_ids[ $expected_key ], $network->id, $message );
	}

	public function data_get_network_by_path() {
		return array(
			array( 'wordpress.org/',         'wordpress.org',       '/',          'A standard domain and path request should work.' ),
			array( 'wordpress.net/',         'wordpress.net',       '/notapath/', 'A missing path on a top level domain should find the correct network.' ),
			array( 'www.wordpress.net/',     'www.wordpress.net',   '/notapath/', 'A missing path should find the correct network.' ),
			array( 'wordpress.org/one/',     'www.wordpress.org',   '/one/',      'Should find the path despite the www.' ),
			array( 'wordpress.org/one/',     'wordpress.org',       '/one/page/', 'A request with two path segments should find the correct network.' ),
			array( 'wordpress.org/one/b/',   'wordpress.org',       '/one/b/',    'A request with two valid path segments should find the correct network.' ),
			array( 'wordpress.org/',         'site1.wordpress.org', '/one/',      'Should not find path because domains do not match.' ),
			array( 'wordpress.net/three/',   'wordpress.net',       '/three/',    'A network can have a path.' ),
			array( 'www.wordpress.net/two/', 'www.wordpress.net',   '/two/',      'A www network with a path can coexist with a non-www network.' ),
			array( 'wordpress.net/',         'site1.wordpress.net', '/notapath/', 'An invalid subdomain should find the top level network domain.' ),
			array( 'wordpress.net/',         'site1.wordpress.net', '/three/',    'An invalid subdomain and path should find the top level network domain.' ),
			array( 'wordpress.net/',         'x.y.wordpress.net',   '/',          'An invalid two level subdomain should find the top level network domain.' ),
		);
	}

	/**
	 * @ticket 37217
	 * @dataProvider data_get_network_by_path_not_using_paths
	 *
	 * @param string $expected_key The array key associated with expected data for the test.
	 * @param string $domain       The requested domain.
	 * @param string $path         The requested path.
	 * @param string $message      The message to pass for failed tests.
	 */
	public function test_get_network_by_path_not_using_paths( $expected_key, $domain, $path, $message ) {
		if ( ! wp_using_ext_object_cache() ) {
			$this->markTestSkipped( 'Only testable with an external object cache.' );
		}

		// Temporarily store original object cache and using paths values.
		$using_paths_orig = wp_cache_get( 'networks_have_paths', 'site-options' );

		wp_cache_set( 'networks_have_paths', 0, 'site-options'  );

		$network = get_network_by_path( $domain, $path );

		// Restore original object cache and using paths values.
		wp_cache_set( 'networks_have_paths', $using_paths_orig, 'site-options' );

		$this->assertEquals( self::$network_ids[ $expected_key ], $network->id, $message );
	}

	public function data_get_network_by_path_not_using_paths() {
		return array(
			array( 'wordpress.org/',         'wordpress.org',       '/',          'A standard domain and path request should work.' ),
			array( 'wordpress.net/',         'wordpress.net',       '/notapath/', 'A network matching a top level domain should be found regardless of path.' ),
			array( 'www.wordpress.net/',     'www.wordpress.net',   '/notapath/', 'A network matching a domain should be found regardless of path.' ),
			array( 'wordpress.org/',         'www.wordpress.org',   '/one/',      'Should find the network despite the www and regardless of path.' ),
			array( 'wordpress.org/',         'site1.wordpress.org', '/one/',      'Should find the network with the corresponding top level domain regardless of path.' ),
			array( 'www.wordpress.net/',     'www.wordpress.net',   '/two/',      'A www network can coexist with a non-www network.' ),
			array( 'make.wordpress.org/',    'make.wordpress.org',  '/notapath/', 'A subdomain network should be found regardless of path.' ),
			array( 'wordpress.net/',         'x.y.wordpress.net',   '/',          'An invalid two level subdomain should find the top level network domain.' ),
		);
	}

	/**
	 * Even if a matching network is available, it should not match if the the filtered
	 * value for network path segments is fewer than the number of paths passed.
	 */
	public function test_get_network_by_path_with_forced_single_path_segment_returns_single_path_network() {
		add_filter( 'network_by_path_segments_count', array( $this, 'filter_network_path_segments' ) );
		$network = get_network_by_path( 'wordpress.org', '/one/b/' );
		remove_filter( 'network_by_path_segments_count', array( $this, 'filter_network_path_segments' ) );

		$this->assertEquals( self::$network_ids[ 'wordpress.org/one/' ], $network->id );
	}

	public function filter_network_path_segments() {
		return 1;
	}

	/**
	 * @ticket 27003
	 * @ticket 27927
	 * @dataProvider data_get_site_by_path
	 *
	 * @param string $expected_key The array key associated with expected data for the test.
	 * @param string $domain       The requested domain.
	 * @param string $path         The requested path.
	 * @param int    $segments     Optional. Number of segments to use in `get_site_by_path()`.
	 */
	public function test_get_site_by_path( $expected_key, $domain, $path, $segments = null ) {
		$site = get_site_by_path( $domain, $path, $segments );

		if ( $expected_key ) {
			$this->assertEquals( self::$site_ids[ $expected_key ], $site->blog_id );
		} else {
			$this->assertFalse( $site );
		}
	}

	public function data_get_site_by_path() {
		return array(
			array( 'wordpress.org/',          'wordpress.org',          '/notapath/' ),
			array( 'wordpress.org/',          'www.wordpress.org',      '/notapath/' ),
			array( 'wordpress.org/foo/bar/',  'wordpress.org',          '/foo/bar/baz/' ),
			array( 'wordpress.org/foo/bar/',  'www.wordpress.org',      '/foo/bar/baz/' ),
			array( 'wordpress.org/foo/bar/',  'wordpress.org',          '/foo/bar/baz/',     3 ),
			array( 'wordpress.org/foo/bar/',  'www.wordpress.org',      '/foo/bar/baz/',     3 ),
			array( 'wordpress.org/foo/bar/',  'wordpress.org',          '/foo/bar/baz/',     2 ),
			array( 'wordpress.org/foo/bar/',  'www.wordpress.org',      '/foo/bar/baz/',     2 ),
			array( 'wordpress.org/foo/',      'wordpress.org',          '/foo/bar/baz/',     1 ),
			array( 'wordpress.org/foo/',      'www.wordpress.org',      '/foo/bar/baz/',     1 ),
			array( 'wordpress.org/',          'wordpress.org',          '/',                 0 ),
			array( 'wordpress.org/',          'www.wordpress.org',      '/',                 0 ),
			array( 'make.wordpress.org/foo/', 'make.wordpress.org',     '/foo/bar/baz/quz/', 4 ),
			array( 'make.wordpress.org/foo/', 'www.make.wordpress.org', '/foo/bar/baz/quz/', 4 ),
			array( 'www.w.org/',              'www.w.org',              '/',                 0 ),
			array( 'www.w.org/',              'www.w.org',              '/notapath' ),
			array( 'www.w.org/foo/bar/',      'www.w.org',              '/foo/bar/baz/' ),
			array( 'www.w.org/foo/',          'www.w.org',              '/foo/bar/baz/',     1 ),

			// A site installed with www will not be found by the root domain.
			array( false, 'w.org', '/' ),
			array( false, 'w.org', '/notapath/' ),
			array( false, 'w.org', '/foo/bar/baz/' ),
			array( false, 'w.org', '/foo/bar/baz/', 1 ),

			// A site will not be found by its root domain when an invalid subdomain is requested.
			array( false, 'invalid.wordpress.org', '/' ),
			array( false, 'invalid.wordpress.org', '/foo/bar/' ),
		);
	}

	/**
	 * @ticket 27884
	 * @dataProvider data_multisite_bootstrap
	 *
	 * @param string $site_key    The array key associated with the expected site for the test.
	 * @param string $network_key The array key associated with the expected network for the test.
	 * @param string $domain      The requested domain.
	 * @param string $path        The requested path.
	 */
	function test_multisite_bootstrap( $site_key, $network_key, $domain, $path ) {
		global $current_blog;

		$expected = array(
			'network_id' => self::$network_ids[ $network_key ],
			'site_id' => self::$site_ids[ $site_key ],
		);

		ms_load_current_site_and_network( $domain, $path );
		$actual = array(
			'network_id' => $current_blog->site_id,
			'site_id' => $current_blog->blog_id,
		);
		ms_load_current_site_and_network( WP_TESTS_DOMAIN, '/' );

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	public function data_multisite_bootstrap() {
		return array(
			array( 'wordpress.org/',          'wordpress.org/',      'wordpress.org',      '/' ),
			array( 'wordpress.org/',          'wordpress.org/',      'wordpress.org',      '/2014/04/23/hello-world/' ),
			array( 'wordpress.org/',          'wordpress.org/',      'wordpress.org',      '/sample-page/' ),
			array( 'wordpress.org/',          'wordpress.org/',      'wordpress.org',      '/?p=1' ),
			array( 'wordpress.org/',          'wordpress.org/',      'wordpress.org',      '/wp-admin/' ),
			array( 'wordpress.org/foo/',      'wordpress.org/',      'wordpress.org',      '/foo/' ),
			array( 'wordpress.org/foo/',      'wordpress.org/',      'wordpress.org',      '/FOO/' ),
			array( 'wordpress.org/foo/',      'wordpress.org/',      'wordpress.org',      '/foo/2014/04/23/hello-world/' ),
			array( 'wordpress.org/foo/',      'wordpress.org/',      'wordpress.org',      '/foo/sample-page/' ),
			array( 'wordpress.org/foo/',      'wordpress.org/',      'wordpress.org',      '/foo/?p=1' ),
			array( 'wordpress.org/foo/',      'wordpress.org/',      'wordpress.org',      '/foo/wp-admin/' ),
			array( 'make.wordpress.org/',     'make.wordpress.org/', 'make.wordpress.org', '/' ),
			array( 'make.wordpress.org/foo/', 'make.wordpress.org/', 'make.wordpress.org', '/foo/' ),
		);
	}

	/**
	 * @ticket 27884
	 */
	public function test_multisite_bootstrap_additional_path_segments() {
		global $current_blog;

		$expected = array(
			'network_id' => self::$network_ids['wordpress.org/'],
			'site_id'    => self::$site_ids['wordpress.org/foo/bar/'],
		);
		add_filter( 'site_by_path_segments_count', array( $this, 'filter_path_segments_to_two' ) );
		ms_load_current_site_and_network( 'wordpress.org', '/foo/bar/' );
		$actual = array(
			'network_id' => $current_blog->site_id,
			'site_id' => $current_blog->blog_id,
		);
		remove_filter( 'site_by_path_segments_count', array( $this, 'filter_path_segments_to_two' ) );
		ms_load_current_site_and_network( WP_TESTS_DOMAIN, '/' );

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	/**
	 * @ticket 37053
	 */
	public function test_get_site_by_path_returns_wp_site() {
		add_filter( 'pre_get_site_by_path', array( $this, 'filter_pre_get_site_by_path' ), 10, 3 );

		$site = get_site_by_path( 'example.com', '/foo/' );

		remove_filter( 'pre_get_site_by_path', array( $this, 'filter_pre_get_site_by_path' ), 10 );

		$this->assertInstanceOf( 'WP_Site', $site );
	}

	public function filter_path_segments_to_two() {
		return 2;
	}

	public function filter_pre_get_site_by_path( $site, $domain, $path ) {
		$site = new stdClass();
		$site->blog_id = 100;
		$site->domain = $domain;
		$site->path = $path;
		$site->site_id = 1;

		return $site;
	}
}

endif;
