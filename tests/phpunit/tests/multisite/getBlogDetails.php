<?php

if ( is_multisite() ) :

/**
 * @group ms-site
 * @group multisite
 */
class Tests_Multisite_Get_Blog_Details extends WP_UnitTestCase {
	/**
	 * @ticket 29845
	 */
	public function test_get_blog_details() {
		$network_ids = array(
			'wordpress.org/'         => array( 'domain' => 'wordpress.org', 'path' => '/' ),
			'make.wordpress.org/'    => array( 'domain' => 'make.wordpress.org', 'path' => '/' ),
		);

		foreach ( $network_ids as &$id ) {
			$id = self::factory()->network->create( $id );
		}
		unset( $id );

		$ids = array(
			'wordpress.org/'              => array( 'domain' => 'wordpress.org',      'path' => '/',         'title' => 'Test 1', 'site_id' => $network_ids['wordpress.org/'] ),
			'wordpress.org/foo/'          => array( 'domain' => 'wordpress.org',      'path' => '/foo/',     'title' => 'Test 2', 'site_id' => $network_ids['wordpress.org/'] ),
			'wordpress.org/foo/bar/'      => array( 'domain' => 'wordpress.org',      'path' => '/foo/bar/', 'title' => 'Test 3', 'site_id' => $network_ids['wordpress.org/'] ),
			'make.wordpress.org/'         => array( 'domain' => 'make.wordpress.org', 'path' => '/',         'title' => 'Test 4', 'site_id' => $network_ids['make.wordpress.org/'] ),
			'make.wordpress.org/foo/'     => array( 'domain' => 'make.wordpress.org', 'path' => '/foo/',     'title' => 'Test 5', 'site_id' => $network_ids['make.wordpress.org/'] ),
		);

		foreach ( $ids as &$id ) {
			$id = self::factory()->blog->create( $id );
		}
		unset( $id );

		// Retrieve site details by passing only a blog ID.
		$site = get_blog_details( $ids['wordpress.org/'] );
		$this->assertEquals( $ids['wordpress.org/'], $site->blog_id );
		$this->assertEquals( 'Test 1', $site->blogname );

		$site = get_blog_details( $ids['wordpress.org/foo/'] );
		$this->assertEquals( $ids['wordpress.org/foo/'], $site->blog_id );
		$this->assertEquals( 'Test 2', $site->blogname );

		$site = get_blog_details( 999 );
		$this->assertFalse( $site );

		// Retrieve site details by passing an array containing blog_id.
		$site = get_blog_details( array( 'blog_id' => $ids['wordpress.org/foo/bar/'] ) );
		$this->assertEquals( $ids['wordpress.org/foo/bar/'], $site->blog_id );
		$this->assertEquals( 'Test 3', $site->blogname );

		$site = get_blog_details( array( 'blog_id' => $ids['make.wordpress.org/'] ) );
		$this->assertEquals( $ids['make.wordpress.org/'], $site->blog_id );
		$this->assertEquals( 'Test 4', $site->blogname );

		$site = get_blog_details( array( 'blog_id' => 999 ) );
		$this->assertFalse( $site );

		// Retrieve site details by passing an array containing domain and path.
		$site = get_blog_details( array( 'domain' => 'wordpress.org', 'path' => '/' ) );
		$this->assertEquals( $ids['wordpress.org/'], $site->blog_id );
		$this->assertEquals( 'Test 1', $site->blogname );

		$site = get_blog_details( array( 'domain' => 'wordpress.org', 'path' => '/foo/' ) );
		$this->assertEquals( $ids['wordpress.org/foo/'], $site->blog_id );
		$this->assertEquals( 'Test 2', $site->blogname );

		$site = get_blog_details( array( 'domain' => 'wordpress.org', 'path' => '/foo/bar/' ) );
		$this->assertEquals( $ids['wordpress.org/foo/bar/'], $site->blog_id );
		$this->assertEquals( 'Test 3', $site->blogname );

		$site = get_blog_details( array( 'domain' => 'make.wordpress.org', 'path' => '/' ) );
		$this->assertEquals( $ids['make.wordpress.org/'], $site->blog_id );
		$this->assertEquals( 'Test 4', $site->blogname );

		$site = get_blog_details( array( 'domain' => 'make.wordpress.org', 'path' => '/foo/' ) );
		$this->assertEquals( $ids['make.wordpress.org/foo/'], $site->blog_id );
		$this->assertEquals( 'Test 5', $site->blogname );

		$site = get_blog_details( array( 'domain' => 'wordpress.org', 'path' => '/zxy/' ) );
		$this->assertFalse( $site );
	}
}

endif;
