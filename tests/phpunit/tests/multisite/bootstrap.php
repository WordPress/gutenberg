<?php

if ( is_multisite() ) :

/**
 * Tests specific to the bootstrap process of Multisite.
 *
 * @group ms-bootstrap
 * @group multisite
 */
class Tests_Multisite_Bootstrap extends WP_UnitTestCase {
	protected $suppress = false;

	function setUp() {
		global $wpdb;
		parent::setUp();
		$this->suppress = $wpdb->suppress_errors();

		$_SERVER[ 'REMOTE_ADDR' ] = '';
	}

	function tearDown() {
		global $wpdb;
		$wpdb->suppress_errors( $this->suppress );
		parent::tearDown();
	}


	/**
	 * @ticket 27003
	 */
	function test_get_network_by_path() {
		global $wpdb;

		$ids = array(
			'wordpress.org/'         => array( 'domain' => 'wordpress.org', 'path' => '/' ),
			'wordpress.org/one/'     => array( 'domain' => 'wordpress.org', 'path' => '/one/' ),
			'wordpress.net/'         => array( 'domain' => 'wordpress.net', 'path' => '/' ),
			'www.wordpress.net/'     => array( 'domain' => 'www.wordpress.net', 'path' => '/' ),
			'www.wordpress.net/two/' => array( 'domain' => 'www.wordpress.net', 'path' => '/two/' ),
			'wordpress.net/three/'   => array( 'domain' => 'wordpress.net', 'path' => '/three/' ),
		);

		foreach ( $ids as &$id ) {
			$id = $this->factory->network->create( $id );
		}
		unset( $id );

		$this->assertEquals( $ids['www.wordpress.net/'],
			get_network_by_path( 'www.wordpress.net', '/notapath/' )->id );

		$this->assertEquals( $ids['www.wordpress.net/two/'],
			get_network_by_path( 'www.wordpress.net', '/two/' )->id );

		// This should find /one/ despite the www.
		$this->assertEquals( $ids['wordpress.org/one/'],
			get_network_by_path( 'www.wordpress.org', '/one/' )->id );

		// This should not find /one/ because the domains don't match.
		$this->assertEquals( $ids['wordpress.org/'],
			get_network_by_path( 'site1.wordpress.org', '/one/' )->id );

		$this->assertEquals( $ids['wordpress.net/three/'],
			get_network_by_path( 'wordpress.net', '/three/' )->id );

		$this->assertEquals( $ids['wordpress.net/'],
			get_network_by_path( 'wordpress.net', '/notapath/' )->id );

		$this->assertEquals( $ids['wordpress.net/'],
			get_network_by_path( 'site1.wordpress.net', '/notapath/' )->id );

		$this->assertEquals( $ids['wordpress.net/'],
			get_network_by_path( 'site1.wordpress.net', '/three/' )->id );
	}

	/**
	 * @ticket 27003
	 * @ticket 27927
	 */
	function test_get_site_by_path() {
		$ids = array(
			'wordpress.org/'              => array( 'domain' => 'wordpress.org',      'path' => '/' ),
			'wordpress.org/foo/'          => array( 'domain' => 'wordpress.org',      'path' => '/foo/' ),
			'wordpress.org/foo/bar/'      => array( 'domain' => 'wordpress.org',      'path' => '/foo/bar/' ),
			'make.wordpress.org/'         => array( 'domain' => 'make.wordpress.org', 'path' => '/' ),
			'make.wordpress.org/foo/'     => array( 'domain' => 'make.wordpress.org', 'path' => '/foo/' ),
			'www.w.org/'                  => array( 'domain' => 'www.w.org',          'path' => '/' ),
			'www.w.org/foo/'              => array( 'domain' => 'www.w.org',          'path' => '/foo/' ),
			'www.w.org/foo/bar/'          => array( 'domain' => 'www.w.org',          'path' => '/foo/bar/' ),
		);

		foreach ( $ids as &$id ) {
			$id = $this->factory->blog->create( $id );
		}
		unset( $id );

		$this->assertEquals( $ids['wordpress.org/'],
			get_site_by_path( 'wordpress.org', '/notapath/' )->blog_id );

		$this->assertEquals( $ids['wordpress.org/'],
			get_site_by_path( 'www.wordpress.org', '/notapath/' )->blog_id );

		$this->assertEquals( $ids['wordpress.org/foo/bar/'],
			get_site_by_path( 'wordpress.org', '/foo/bar/baz/' )->blog_id );

		$this->assertEquals( $ids['wordpress.org/foo/bar/'],
			get_site_by_path( 'www.wordpress.org', '/foo/bar/baz/' )->blog_id );

		$this->assertEquals( $ids['wordpress.org/foo/bar/'],
			get_site_by_path( 'wordpress.org', '/foo/bar/baz/', 3 )->blog_id );

		$this->assertEquals( $ids['wordpress.org/foo/bar/'],
			get_site_by_path( 'www.wordpress.org', '/foo/bar/baz/', 3 )->blog_id );

		$this->assertEquals( $ids['wordpress.org/foo/bar/'],
			get_site_by_path( 'wordpress.org', '/foo/bar/baz/', 2 )->blog_id );

		$this->assertEquals( $ids['wordpress.org/foo/bar/'],
			get_site_by_path( 'www.wordpress.org', '/foo/bar/baz/', 2 )->blog_id );

		$this->assertEquals( $ids['wordpress.org/foo/'],
			get_site_by_path( 'wordpress.org', '/foo/bar/baz/', 1 )->blog_id );

		$this->assertEquals( $ids['wordpress.org/foo/'],
			get_site_by_path( 'www.wordpress.org', '/foo/bar/baz/', 1 )->blog_id );

		$this->assertEquals( $ids['wordpress.org/'],
			get_site_by_path( 'wordpress.org', '/', 0 )->blog_id );

		$this->assertEquals( $ids['wordpress.org/'],
			get_site_by_path( 'www.wordpress.org', '/', 0 )->blog_id );

		$this->assertEquals( $ids['make.wordpress.org/foo/'],
			get_site_by_path( 'make.wordpress.org', '/foo/bar/baz/qux/', 4 )->blog_id );

		$this->assertEquals( $ids['make.wordpress.org/foo/'],
			get_site_by_path( 'www.make.wordpress.org', '/foo/bar/baz/qux/', 4 )->blog_id );

		$this->assertEquals( $ids['www.w.org/'],
			get_site_by_path( 'www.w.org', '/', 0 )->blog_id );

		$this->assertEquals( $ids['www.w.org/'],
			get_site_by_path( 'www.w.org', '/notapath/' )->blog_id );

		$this->assertEquals( $ids['www.w.org/foo/bar/'],
			get_site_by_path( 'www.w.org', '/foo/bar/baz/' )->blog_id );

		$this->assertEquals( $ids['www.w.org/foo/'],
			get_site_by_path( 'www.w.org', '/foo/bar/baz/', 1 )->blog_id );

		// A site installed with www will not be found by the root domain.
		$this->assertFalse( get_site_by_path( 'w.org', '/' ) );
		$this->assertFalse( get_site_by_path( 'w.org', '/notapath/' ) );
		$this->assertFalse( get_site_by_path( 'w.org', '/foo/bar/baz/' ) );
		$this->assertFalse( get_site_by_path( 'w.org', '/foo/bar/baz/', 1 ) );

		// A site will not be found by its root domain when an invalid subdomain is requested.
		$this->assertFalse( get_site_by_path( 'invalid.wordpress.org', '/' ) );
		$this->assertFalse( get_site_by_path( 'invalid.wordpress.org', '/foo/bar/' ) );
	}

	/**
	 * @ticket 27884
	 */
	function test_multisite_bootstrap() {
		global $current_blog;

		$network_ids = array(
			'wordpress.org/'         => array( 'domain' => 'wordpress.org', 'path' => '/' ),
			'make.wordpress.org/'    => array( 'domain' => 'make.wordpress.org', 'path' => '/' ),
		);

		foreach ( $network_ids as &$id ) {
			$id = $this->factory->network->create( $id );
		}
		unset( $id );

		$ids = array(
			'wordpress.org/'              => array( 'domain' => 'wordpress.org',      'path' => '/',         'site_id' => $network_ids['wordpress.org/'] ),
			'wordpress.org/foo/'          => array( 'domain' => 'wordpress.org',      'path' => '/foo/',     'site_id' => $network_ids['wordpress.org/'] ),
			'wordpress.org/foo/bar/'      => array( 'domain' => 'wordpress.org',      'path' => '/foo/bar/', 'site_id' => $network_ids['wordpress.org/'] ),
			'make.wordpress.org/'         => array( 'domain' => 'make.wordpress.org', 'path' => '/',         'site_id' => $network_ids['make.wordpress.org/'] ),
			'make.wordpress.org/foo/'     => array( 'domain' => 'make.wordpress.org', 'path' => '/foo/',     'site_id' => $network_ids['make.wordpress.org/'] ),
		);

		foreach ( $ids as &$id ) {
			$id = $this->factory->blog->create( $id );
		}
		unset( $id );

		$this->_setup_host_request( 'wordpress.org', '/' );
		$this->assertEquals( $ids['wordpress.org/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['wordpress.org/'], $current_blog->site_id );

		$this->_setup_host_request( 'wordpress.org', '/2014/04/23/hello-world/' );
		$this->assertEquals( $ids['wordpress.org/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['wordpress.org/'], $current_blog->site_id );

		$this->_setup_host_request( 'wordpress.org', '/sample-page/' );
		$this->assertEquals( $ids['wordpress.org/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['wordpress.org/'], $current_blog->site_id );

		$this->_setup_host_request( 'wordpress.org', '/?p=1' );
		$this->assertEquals( $ids['wordpress.org/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['wordpress.org/'], $current_blog->site_id );

		$this->_setup_host_request( 'wordpress.org', '/wp-admin/' );
		$this->assertEquals( $ids['wordpress.org/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['wordpress.org/'], $current_blog->site_id );

		$this->_setup_host_request( 'wordpress.org', '/foo/' );
		$this->assertEquals( $ids['wordpress.org/foo/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['wordpress.org/'], $current_blog->site_id );

		$this->_setup_host_request( 'wordpress.org', '/FOO/' );
		$this->assertEquals( $ids['wordpress.org/foo/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['wordpress.org/'], $current_blog->site_id );

		$this->_setup_host_request( 'wordpress.org', '/foo/2014/04/23/hello-world/' );
		$this->assertEquals( $ids['wordpress.org/foo/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['wordpress.org/'], $current_blog->site_id );

		$this->_setup_host_request( 'wordpress.org', '/foo/sample-page/' );
		$this->assertEquals( $ids['wordpress.org/foo/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['wordpress.org/'], $current_blog->site_id );

		$this->_setup_host_request( 'wordpress.org', '/foo/?p=1' );
		$this->assertEquals( $ids['wordpress.org/foo/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['wordpress.org/'], $current_blog->site_id );

		$this->_setup_host_request( 'wordpress.org', '/foo/wp-admin/' );
		$this->assertEquals( $ids['wordpress.org/foo/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['wordpress.org/'], $current_blog->site_id );

		// @todo not currently passing.
		//$this->_setup_host_request( 'wordpress.org', '/foo/bar/' );
		//$this->assertEquals( $ids['wordpress.org/foo/bar/'], $current_blog->blog_id );
		//$this->assertEquals( $network_ids['wordpress.org/'], $current_blog->site_id );

		$this->_setup_host_request( 'make.wordpress.org', '/' );
		$this->assertEquals( $ids['make.wordpress.org/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['make.wordpress.org/'], $current_blog->site_id );

		$this->_setup_host_request( 'make.wordpress.org', '/foo/' );
		$this->assertEquals( $ids['make.wordpress.org/foo/'], $current_blog->blog_id );
		$this->assertEquals( $network_ids['make.wordpress.org/'], $current_blog->site_id );

		// Request the original tests domain and path to unpollute the stack.
		$this->_setup_host_request( WP_TESTS_DOMAIN, '/' );
	}

	/**
	 * Reset various globals required for a 'clean' multisite boot.
	 *
	 * The $wpdb and $table_prefix globals are required for ms-settings.php to
	 * load properly.
	 *
	 * @param string $domain HTTP_HOST of the bootstrap request.
	 * @param string $path   REQUEST_URI of the boot strap request.
	 */
	function _setup_host_request( $domain, $path ) {
		global $current_site, $current_blog, $table_prefix, $wpdb;

		$table_prefix = WP_TESTS_TABLE_PREFIX;
		$current_site = $current_blog = null;
		$_SERVER['HTTP_HOST'] = $domain;
		$_SERVER['REQUEST_URI'] = $path;

		include ABSPATH . '/wp-includes/ms-settings.php';
	}
}

endif;
