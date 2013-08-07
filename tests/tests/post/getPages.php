<?php

/**
 * @group post
 */

class Tests_Post_getPages extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
	}

	/**
	 * @ticket 23167
	 */
	function test_get_pages_cache() {
		global $wpdb;

		$this->factory->post->create_many( 15, array( 'post_type' => 'page' ) );
		wp_cache_delete( 'last_changed', 'posts' );
		$this->assertFalse( wp_cache_get( 'last_changed', 'posts' ) );

		$pages = get_pages();
		$this->assertEquals( 15, count( $pages ) );
		$this->assertNotEmpty( $time1 = wp_cache_get( 'last_changed', 'posts' ) );
		$num_queries = $wpdb->num_queries;
		foreach ( $pages as $page )
			$this->assertInstanceOf( 'WP_Post', $page );

		// Again. num_queries and last_changed should remain the same.
		$pages = get_pages();
		$this->assertEquals( 15, count( $pages ) );
		$this->assertEquals( $time1, wp_cache_get( 'last_changed', 'posts' ) );
		$this->assertEquals( $num_queries, $wpdb->num_queries );
		foreach ( $pages as $page )
			$this->assertInstanceOf( 'WP_Post', $page );

		// Again with different args. last_changed should not increment because of
		// different args to get_pages(). num_queries should bump by 1.
		$pages = get_pages( array( 'number' => 10 ) );
		$this->assertEquals( 10, count( $pages ) );
		$this->assertEquals( $time1, wp_cache_get( 'last_changed', 'posts' ) );
		$this->assertEquals( $num_queries + 1, $wpdb->num_queries );
		foreach ( $pages as $page )
			$this->assertInstanceOf( 'WP_Post', $page );

		$num_queries = $wpdb->num_queries;

		// Again. num_queries and last_changed should remain the same.
		$pages = get_pages( array( 'number' => 10 ) );
		$this->assertEquals( 10, count( $pages ) );
		$this->assertEquals( $time1, wp_cache_get( 'last_changed', 'posts' ) );
		$this->assertEquals( $num_queries, $wpdb->num_queries );
		foreach ( $pages as $page )
			$this->assertInstanceOf( 'WP_Post', $page );

		// Do the first query again. The interim queries should not affect it.
		$pages = get_pages();
		$this->assertEquals( 15, count( $pages ) );
		$this->assertEquals( $time1, wp_cache_get( 'last_changed', 'posts' ) );
		$this->assertEquals( $num_queries, $wpdb->num_queries );
		foreach ( $pages as $page )
			$this->assertInstanceOf( 'WP_Post', $page );

		// Force last_changed to increment.
		clean_post_cache( $pages[0]->ID );
		$this->assertNotEquals( $time1, $time2 = wp_cache_get( 'last_changed', 'posts' ) );

		$num_queries = $wpdb->num_queries;

		// last_changed bumped so num_queries should increment.
		$pages = get_pages( array( 'number' => 10 ) );
		$this->assertEquals( 10, count( $pages ) );
		$this->assertEquals( $time2, wp_cache_get( 'last_changed', 'posts' ) );
		$this->assertEquals( $num_queries + 1, $wpdb->num_queries );
		foreach ( $pages as $page )
			$this->assertInstanceOf( 'WP_Post', $page );

		$last_changed = wp_cache_get( 'last_changed', 'posts' );

		// This should bump last_changed.
		wp_delete_post( $pages[0]->ID );
		$this->assertGreaterThan( $last_changed, wp_cache_get( 'last_changed', 'posts' ) );

		$num_queries = $wpdb->num_queries;
		$last_changed = wp_cache_get( 'last_changed', 'posts' );

		// num_queries should bump after wp_delete_post() bumps last_changed.
		$pages = get_pages();
		$this->assertEquals( 14, count( $pages ) );
		$this->assertEquals( $last_changed, wp_cache_get( 'last_changed', 'posts' ) );
		$this->assertEquals( $num_queries + 1, $wpdb->num_queries );
		foreach ( $pages as $page )
			$this->assertInstanceOf( 'WP_Post', $page );
	}

	/**
	 * @ticket 20376
	 */
	function test_get_pages_meta() {
		$posts = $this->factory->post->create_many( 3, array( 'post_type' => 'page' ) );
		add_post_meta( $posts[0], 'some-meta-key', '0' );
		add_post_meta( $posts[1], 'some-meta-key', '' );
		add_post_meta( $posts[2], 'some-meta-key', '1' );

		$this->assertEquals( 1, count( get_pages( array( 'meta_key' => 'some-meta-key', 'meta_value' => '0' ) ) ) );
		$this->assertEquals( 1, count( get_pages( array( 'meta_key' => 'some-meta-key', 'meta_value' => '1' ) ) ) );
		$this->assertEquals( 3, count( get_pages( array( 'meta_key' => 'some-meta-key' ) ) ) );
	}

	/**
	 * @ticket 22389
	 */
	function test_wp_dropdown_pages() {
		$posts = $this->factory->post->create_many( 5, array( 'post_type' => 'page' ) );

		preg_match_all( '#<option#', wp_dropdown_pages( 'echo=0' ), $matches );

		$this->assertEquals( 5, count( $matches[0] ) );
	}
}