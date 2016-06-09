<?php

if ( is_multisite() ) :

/**
 * @group wp-get-site
 * @group ms-site
 * @group multisite
 */
class Tests_Multisite_WP_Get_Sites extends WP_UnitTestCase {
	protected static $site_ids;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$site_ids = array(
			'w.org/'      => array( 'domain' => 'w.org',  'path' => '/',     'site_id' => 2 ),
			'wp.org/'     => array( 'domain' => 'wp.org', 'path' => '/',     'site_id' => 2, 'meta' => array( 'public' => 0 ) ),
			'wp.org/foo/' => array( 'domain' => 'wp.org', 'path' => '/foo/', 'site_id' => 1, 'meta' => array( 'public' => 0 ) ),
			'wp.org/oof/' => array( 'domain' => 'wp.org', 'path' => '/oof/' ),
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

	/**
	 * @expectedDeprecated wp_get_sites
	 */
	public function test_wp_get_sites_site_is_expected_array() {

		$keys = array(
			'blog_id',
			'site_id',
			'domain',
			'path',
			'registered',
			'last_updated',
			'public',
			'archived',
			'mature',
			'spam',
			'deleted',
			'lang_id'
		);
		$sites = wp_get_sites();

		$missing_keys = array_diff_key( array_flip( $keys ), $sites[0] );

		$this->assertEquals( array(), $missing_keys, 'Keys are missing from site arrays.' );
	}

	/**
	 * @expectedDeprecated wp_get_sites
	 * @dataProvider data_wp_get_sites
	 *
	 * @param $expected
	 * @param $args
	 * @param $error
	 */
	public function test_wp_get_sites( $expected, $args, $error ) {
		$this->assertCount( $expected, wp_get_sites( $args ), $error );
	}

	/**
	 * @return array
	 */
	public function data_wp_get_sites() {
		return array(
			array( 3, array(), 'Default arguments should return all sites from the current network.' ),
			array( 0, array( 'network_id' => 999 ), 'No sites should match a query with an invalid network ID.' ),
			array( 5, array( 'network_id' => null ), 'A network ID of null should return all sites on all networks.' ),
			array( 2, array( 'network_id' => 2 ), 'Only sites on a specified network ID should be returned.' ),
			array( 5, array( 'network_id' => array( 1, 2 ) ), 'If multiple network IDs are specified, sites from both should be returned.' ),
			array( 3, array( 'public' => 1, 'network_id' => null ), 'Public sites on all networks.' ),
			array( 2, array( 'public' => 0, 'network_id' => null ), 'Non public sites on all networks.' ),
			array( 2, array( 'public' => 1, 'network_id' => 1 ), 'Public sites on a single network.' ),
			array( 1, array( 'public' => 1, 'network_id' => 2 ), 'Public sites on a second network.' ),
			array( 2, array( 'limit' => 2 ), 'Provide only a limit argument.' ),
			array( 1, array( 'limit' => 2, 'offset' => 2 ), 'Provide both limit and offset arguments.' ),
			array( 2, array( 'offset' => 1 ), 'Provide only an offset argument.' ),
			array( 0, array( 'offset' => 20 ), 'Expect 0 sites when using an offset larger than the total number of sites.' ),
		);
	}
}

endif;
