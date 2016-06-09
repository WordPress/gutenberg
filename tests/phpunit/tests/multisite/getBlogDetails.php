<?php

if ( is_multisite() ) :

/**
 * @ticket 29845
 * @group ms-site
 * @group multisite
 */
class Tests_Multisite_Get_Blog_Details extends WP_UnitTestCase {
	protected static $network_ids;
	protected static $site_ids;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$site_ids = array(
			WP_TESTS_DOMAIN . '/foo/'      => array( 'domain' => WP_TESTS_DOMAIN,          'path' => '/foo/'),
			'foo.' . WP_TESTS_DOMAIN . '/' => array( 'domain' => 'foo.' . WP_TESTS_DOMAIN, 'path' => '/' ),
			'wordpress.org/'               => array( 'domain' => 'wordpress.org',          'path' => '/' ),
		);

		foreach ( self::$site_ids as &$id ) {
			$id = $factory->blog->create( $id );
		}
		unset( $id );
	}

	public static function wpTearDownAfterClass() {
		foreach( self::$site_ids as $id ) {
			wpmu_delete_blog( $id, true );
		}

		wp_update_network_site_counts();
	}

	public function test_get_blog_details_with_no_arguments_returns_current_site() {
		$site = get_blog_details();
		$this->assertEquals( get_current_blog_id(), $site->blog_id );
	}

	public function test_get_blog_details_with_site_name_string_subdirectory() {
		if ( is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdirectory configuration.' );
		}

		$site = get_blog_details( 'foo' );
		$this->assertEquals( self::$site_ids[ WP_TESTS_DOMAIN . '/foo/'], $site->blog_id );
	}

	public function test_get_blog_details_with_site_name_string_subdomain() {
		if ( ! is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdomain configuration.' );
		}

		$site = get_blog_details( 'foo' );
		$this->assertEquals( self::$site_ids[ 'foo.' . WP_TESTS_DOMAIN . '/' ], $site->blog_id );
	}

	public function test_get_blog_details_with_invalid_site_name_string() {
		$site = get_blog_details( 'invalid' );
		$this->assertFalse( $site );
	}

	public function test_get_blog_details_with_site_id_int() {
		$site = get_blog_details( self::$site_ids['wordpress.org/'] );
		$this->assertEquals( self::$site_ids['wordpress.org/'], $site->blog_id );
	}

	public function test_get_blog_details_with_invalid_site_id_int() {
		$site = get_blog_details( 99999 );
		$this->assertFalse( $site );
	}

	public function test_get_blog_details_with_blog_id_in_fields() {
		$site = get_blog_details( array( 'blog_id' => self::$site_ids['wordpress.org/'] ) );
		$this->assertEquals( self::$site_ids['wordpress.org/'], $site->blog_id );
	}

	public function test_get_blog_details_with_invalid_blog_id_in_fields() {
		$site = get_blog_details( array( 'blog_id' => 88888 ) );
		$this->assertFalse( $site );
	}

	public function test_get_blog_details_with_domain_and_path_in_fields() {
		$site = get_blog_details( array( 'domain' => 'wordpress.org', 'path' => '/' ) );
		$this->assertEquals( self::$site_ids['wordpress.org/'], $site->blog_id );
	}

	public function test_get_blog_details_with_domain_and_invalid_path_in_fields() {
		$site = get_blog_details( array( 'domain' => 'wordpress.org', 'path' => '/zxy/' ) );
		$this->assertFalse( $site );
	}

	public function test_get_blog_details_with_path_and_invalid_domain_in_fields() {
		$site = get_blog_details( array( 'domain' => 'invalid.org', 'path' => '/foo/' ) );
		$this->assertFalse( $site );
	}

	public function test_get_blog_details_with_only_domain_in_fields_subdomain() {
		if ( ! is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdomain configuration.' );
		}

		$site = get_blog_details( array( 'domain' => 'wordpress.org' ) );
		$this->assertEquals( self::$site_ids['wordpress.org/'], $site->blog_id );
	}

	public function test_get_blog_details_with_only_domain_in_fields_subdirectory() {
		if ( is_subdomain_install() ) {
			$this->markTestSkipped( 'This test is only valid in a subdirectory configuration.' );
		}

		$site = get_blog_details( array( 'domain' => 'wordpress.org' ) );
		$this->assertFalse( $site );
	}

	public function test_get_blog_details_with_only_path_in_fields() {
		$site = get_blog_details( array( 'path' => '/foo/' ) );
		$this->assertFalse( $site );
	}
}

endif;
