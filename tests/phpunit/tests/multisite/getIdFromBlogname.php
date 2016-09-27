<?php

if ( is_multisite() ) :
/**
 * Test get_id_from_blogname() in multisite.
 *
 * @group blogname
 * @group ms-site
 * @group multisite
 */
class Tests_Multisite_Get_Id_From_Blogname extends WP_UnitTestCase {
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

	/**
	 * @ticket 34450
	 */
	public function test_get_id_from_blogname_no_www() {
		global $current_site;

		$original_network = $current_site;
		$current_site = get_network( self::$network_ids['wordpress.org/'] );

		if ( is_subdomain_install() ) {
			$expected = self::$site_ids['foo.wordpress.org/'];
		} else {
			$expected = self::$site_ids['wordpress.org/foo/'];
		}

		$result = get_id_from_blogname( 'foo' );
		$current_site = $original_network;

		$this->assertEquals( $expected, $result );
	}

	/**
	 * @ticket 34450
	 */
	public function test_get_id_from_blogname_www() {
		global $current_site;

		$original_network = $current_site;
		$current_site = get_network( self::$network_ids['www.wordpress.net/'] );

		if ( is_subdomain_install() ) {
			$expected = self::$site_ids['foo.wordpress.net/'];
		} else {
			$expected = self::$site_ids['www.wordpress.net/foo/'];
		}

		$result = get_id_from_blogname( 'foo' );
		$current_site = $original_network;

		$this->assertEquals( $expected, $result );
	}

	public function test_get_id_from_blogname_invalid_slug() {
		global $current_site;

		$original_network = $current_site;
		$current_site = get_network( self::$network_ids['wordpress.org/'] );

		$result = get_id_from_blogname( 'bar' );
		$current_site = $original_network;

		$this->assertEquals( null, $result );
	}

}

endif;
