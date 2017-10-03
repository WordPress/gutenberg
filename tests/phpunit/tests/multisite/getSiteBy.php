<?php

if ( is_multisite() ) :
/**
 * Test get_site_by() in multisite.
 *
 * @ticket 40180
 * @group ms-site
 * @group multisite
 */
class Tests_Multisite_Get_Site_By extends WP_UnitTestCase {
	protected static $network_ids;
	protected static $site_ids;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$network_ids = array(
			'wordpress.org/'         => array( 'domain' => 'wordpress.org',     'path' => '/' ),
			'www.wordpress.net/'     => array( 'domain' => 'www.wordpress.net', 'path' => '/' ),
		);

		foreach ( self::$network_ids as &$id ) {
			$id = $factory->network->create( $id );
		}
		unset( $id );

		self::$site_ids = array(
			'wordpress.org/'              => array( 'domain' => 'wordpress.org',     'path' => '/',     'site_id' => self::$network_ids['wordpress.org/'] ),
			'foo.wordpress.org/'          => array( 'domain' => 'foo.wordpress.org', 'path' => '/',     'site_id' => self::$network_ids['wordpress.org/'] ),
			'wordpress.org/foo/'          => array( 'domain' => 'wordpress.org',     'path' => '/foo/', 'site_id' => self::$network_ids['wordpress.org/'] ),
			'www.wordpress.org/'          => array( 'domain' => 'www.wordpress.org', 'path' => '/',     'site_id' => self::$network_ids['wordpress.org/'] ),
			'www.wordpress.net/'          => array( 'domain' => 'www.wordpress.net', 'path' => '/',     'site_id' => self::$network_ids['www.wordpress.net/'] ),
			'foo.wordpress.net/'          => array( 'domain' => 'foo.wordpress.net', 'path' => '/',     'site_id' => self::$network_ids['www.wordpress.net/'] ),
			'www.wordpress.net/foo/'      => array( 'domain' => 'www.wordpress.net', 'path' => '/foo/', 'site_id' => self::$network_ids['www.wordpress.net/'] ),
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

	public function test_get_site_by_id_with_valid_id() {
		$result = get_site_by( 'id', self::$site_ids['wordpress.org/'] );

		$this->assertEquals( self::$site_ids['wordpress.org/'], $result->id );
	}

	public function test_get_site_by_id_with_invalid_id() {
		$result = get_site_by( 'id', 'wp.org' );

		$this->assertNull( $result );
	}

	public function test_get_site_by_slug_subdomain() {
		if ( ! is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdomain configuration.' );
		}

		$result = get_site_by( 'slug', 'foo', self::$network_ids['wordpress.org/'] );

		$this->assertEquals( self::$site_ids['foo.wordpress.org/'], $result->id );
	}

	public function test_get_site_by_slug_with_www_subdomain() {
		if ( ! is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdomain configuration.' );
		}

		$result = get_site_by( 'slug', 'foo', self::$network_ids['www.wordpress.net/'] );

		$this->assertEquals( self::$site_ids['foo.wordpress.net/'], $result->id );
	}

	public function test_get_site_by_slug_subdirectory() {
		if ( is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdirectory configuration.' );
		}

		$result = get_site_by( 'slug', 'foo', self::$network_ids['wordpress.org/'] );

		$this->assertEquals( self::$site_ids['wordpress.org/foo/'], $result->id );
	}

	public function test_get_site_by_slug_with_www_subdirectory() {
		if ( is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdirectory configuration.' );
		}

		$result = get_site_by( 'slug', 'foo', self::$network_ids['www.wordpress.net/'] );

		$this->assertEquals( self::$site_ids['www.wordpress.net/foo/'], $result->id );
	}

	public function test_get_site_by_slug_with_first_network() {
		$result = get_site_by( 'slug', 'foo', self::$network_ids['wordpress.org/'] );

		if ( is_subdomain_install() ) {
			$this->assertEquals( self::$site_ids['foo.wordpress.org/'], $result->id );
		} else {
			$this->assertEquals( self::$site_ids['wordpress.org/foo/'], $result->id );
		}
	}

	public function test_get_site_by_slug_with_second_network() {
		$result = get_site_by( 'slug', 'foo', self::$network_ids['www.wordpress.net/'] );

		if ( is_subdomain_install() ) {
			$this->assertEquals( self::$site_ids['foo.wordpress.net/'], $result->id );
		} else {
			$this->assertEquals( self::$site_ids['www.wordpress.net/foo/'], $result->id );
		}
	}

	public function test_get_site_by_slug_with_invalid_network() {
		$result = get_site_by( 'slug', 'foo', 444 );

		$this->assertNull( $result );
	}

	public function test_get_site_by_slug_with_empty_string_returns_null() {
		$result = get_site_by( 'slug', '' );

		$this->assertNull( $result );
	}

	/**
	 * @dataProvider data_get_site_by_url
	 */
	public function test_get_site_by_url( $url, $expected ) {
		$result = get_site_by( 'url', $url );

		$this->assertEquals( self::$site_ids[ $expected ], $result->id );
	}

	public function data_get_site_by_url() {
		return array(
			array(
				'wordpress.org/foo/',
				'wordpress.org/foo/',
			),
			array(
				'wordpress.org/foo',
				'wordpress.org/foo/',
			),
			array(
				'foo.wordpress.org/',
				'foo.wordpress.org/',
			),
			array(
				'foo.wordpress.org',
				'foo.wordpress.org/',
			),
			array(
				'www.wordpress.net/',
				'www.wordpress.net/',
			),
			array(
				'www.wordpress.org/',
				'www.wordpress.org/',
			),
		);
	}

	public function test_get_site_by_url_with_empty_string_returns_null() {
		$result = get_site_by( 'url', '' );

		$this->assertNull( $result );
	}

	public function test_get_site_by_url_with_invalid_url() {
		$result = get_site_by( 'url', 'not a url' );

		$this->assertNull( $result );
	}

	public function test_get_site_by_domain_subdomain() {
		if ( ! is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdomain configuration.' );
		}

		$result = get_site_by( 'domain', 'foo.wordpress.org' );

		$this->assertEquals( self::$site_ids['foo.wordpress.org/'], $result->id );
	}

	public function test_get_site_by_domain_subdirectory() {
		if ( is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdirectory configuration.' );
		}

		$result = get_site_by( 'domain', 'foo.wordpress.org' );

		$this->assertNull( $result );
	}

	public function test_get_site_by_domain_with_empty_string_returns_null() {
		if ( ! is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdomain configuration.' );
		}

		$result = get_site_by( 'domain', '' );

		$this->assertNull( $result );
	}

	public function test_get_site_by_path_subdomain() {
		if ( ! is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdomain configuration.' );
		}

		$result = get_site_by( 'path', '/foo/' );

		$this->assertNull( $result );
	}

	public function test_get_site_by_path_subdirectory() {
		if ( is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdirectory configuration.' );
		}

		$result = get_site_by( 'path', '/foo/' );

		$this->assertEquals( self::$site_ids['wordpress.org/foo/'], $result->id );
	}

	public function test_get_site_by_path_with_empty_string_returns_null() {
		if ( is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdirectory configuration.' );
		}

		$result = get_site_by( 'path', '' );

		$this->assertNull( $result );
	}
}

endif;
