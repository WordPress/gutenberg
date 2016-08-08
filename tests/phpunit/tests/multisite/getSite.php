<?php

if ( is_multisite() ) :
/**
 * Test get_site() wrapper of WP_Site in multisite.
 *
 * @group ms-site
 * @group multisite
 */
class Tests_Multisite_Get_Site extends WP_UnitTestCase {
	protected static $site_ids;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$site_ids = array(
			'wordpress.org/'              => array( 'domain' => 'wordpress.org',      'path' => '/' ),
			'wordpress.org/foo/'          => array( 'domain' => 'wordpress.org',      'path' => '/foo/' ),
			'wordpress.org/foo/bar/'      => array( 'domain' => 'wordpress.org',      'path' => '/foo/bar/' ),
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

	public function test_get_site_in_switched_state_returns_switched_site() {
		switch_to_blog( self::$site_ids[ 'wordpress.org/foo/' ] );
		$site = get_site();
		restore_current_blog();

		$this->assertEquals( self::$site_ids[ 'wordpress.org/foo/'], $site->id );
	}

}

endif;
