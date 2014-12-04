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
		$old_changed_float = $this->_microtime_to_float( $last_changed );
		$new_changed_float = $this->_microtime_to_float( wp_cache_get( 'last_changed', 'posts' ) );
		$this->assertGreaterThan( $old_changed_float, $new_changed_float );

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
	 * @ticket 22074
	 */
	function test_get_pages_include_exclude() {
		$page_ids = array();

		foreach ( range( 1, 20 ) as $i )
			$page_ids[] = $this->factory->post->create( array( 'post_type' => 'page' ) );

		$inc = array_slice( $page_ids, 0, 10 );
		sort( $inc );
		$exc = array_slice( $page_ids, 10 );
		sort( $exc );

		$include = get_pages( array( 'include' => $inc ) );
		$inc_result = wp_list_pluck( $include, 'ID' );
		sort( $inc_result );
		$this->assertEquals( $inc, $inc_result );

		$exclude = get_pages( array( 'exclude' => $exc ) );
		$exc_result = wp_list_pluck( $exclude, 'ID' );
		sort( $exc_result );
		$this->assertEquals( $inc, $exc_result );
	}

	/**
	 * @ticket 9470
	 */
	function test_get_pages_parent() {
		$page_id1 = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$page_id2 = $this->factory->post->create( array( 'post_type' => 'page', 'post_parent' => $page_id1 ) );
		$page_id3 = $this->factory->post->create( array( 'post_type' => 'page', 'post_parent' => $page_id2 ) );
		$page_id4 = $this->factory->post->create( array( 'post_type' => 'page', 'post_parent' => $page_id1 ) );

		$pages = get_pages( array( 'parent' => 0, 'hierarchical' => false ) );
		$this->assertEqualSets( array( $page_id1 ), wp_list_pluck( $pages, 'ID' ) );

		$pages = get_pages( array( 'parent' => $page_id1, 'hierarchical' => false ) );
		$this->assertEqualSets( array( $page_id2, $page_id4 ), wp_list_pluck( $pages, 'ID' ) );

		$pages = get_pages( array( 'parent' => array( $page_id1, $page_id2 ), 'hierarchical' => false ) );
		$this->assertEqualSets( array( $page_id2, $page_id3, $page_id4 ), wp_list_pluck( $pages, 'ID' ) );

		$pages = get_pages( array( 'parent' => 0 ) );
		$this->assertEqualSets( array( $page_id1 ), wp_list_pluck( $pages, 'ID' ) );

		$pages = get_pages( array( 'parent' => $page_id1 ) );
		$this->assertEqualSets( array( $page_id2, $page_id4 ), wp_list_pluck( $pages, 'ID' ) );

		$pages = get_pages( array( 'parent' => array( $page_id1, $page_id2 ) ) );
		$this->assertEqualSets( array( $page_id2, $page_id3, $page_id4 ), wp_list_pluck( $pages, 'ID' ) );
	}

	/**
	 * @ticket 22389
	 */
	function test_wp_dropdown_pages() {
		$this->factory->post->create_many( 5, array( 'post_type' => 'page' ) );

		preg_match_all( '#<option#', wp_dropdown_pages( 'echo=0' ), $matches );

		$this->assertEquals( 5, count( $matches[0] ) );
	}

	/**
	 * @ticket 22208
	 */
	function test_get_chidren_fields_ids() {
		$post_id = $this->factory->post->create();
		$child_ids = $this->factory->post->create_many( 5, array( 'post_parent' => $post_id ) );

		$post_ids = get_children( array( 'fields' => 'ids', 'post_parent' => $post_id ) );
		$this->assertEqualSets( $child_ids, $post_ids );
	}

	/**
	 * @ticket 25750
	 */
	function test_get_pages_hierarchical_and_no_parent() {
		global $wpdb;
		$page_1 = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$page_2 = $this->factory->post->create( array( 'post_type' => 'page', 'post_parent' => $page_1 ) );
		$page_3 = $this->factory->post->create( array( 'post_type' => 'page', 'post_parent' => $page_1 ) );
		$page_4 = $this->factory->post->create( array( 'post_type' => 'page', 'post_parent' => $page_2 ) );

		$pages = get_pages(); // Defaults: hierarchical = true, parent = -1
		$pages_default_args = get_pages( array( 'hierarchical' => true, 'parent' => -1 ) );
		// Confirm the defaults.
		$this->assertEquals( $pages, $pages_default_args );

		/*
		 * Here's the tree we are testing:
		 *
		 * page 1
		 * - page 2
		 * -- page 4
		 * - page 3
		 *
		 * If hierarchical => true works, the order will be 1,2,4,3.
		 * If it doesn't, they will be in the creation order, 1,2,3,4.
		 */

		$this->assertEqualSets( array( $page_1, $page_2, $page_4, $page_3 ), wp_list_pluck( $pages, 'ID' ) );
	}

	function test_wp_list_pages_classes() {
		$type = 'taco';
		register_post_type( $type, array( 'hierarchical' => true, 'public' => true ) );

		$posts = $this->factory->post->create_many( 2, array( 'post_type' => $type ) );
		$post_id = reset( $posts );

		$this->go_to( "/?p=$post_id&post_type=$type" );

		$this->assertEquals( $post_id, get_queried_object_id() );

		$output = wp_list_pages( array(
			'echo' => false,
			'title_li' => '',
			'post_type' => $type
		) );

		$this->assertNotEmpty( $output );
		$this->assertEquals( 2, substr_count( $output, 'class="page_item ' ) );
		$this->assertContains( 'current_page_item', $output );
		$this->assertEquals( 1, substr_count( $output, 'current_page_item' ) );

		_unregister_post_type( $type );
	}

	function test_exclude_tree() {
		$post_id1 = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$post_id2 = $this->factory->post->create( array( 'post_type' => 'page', 'post_parent' => $post_id1 ) );
		$post_id3 = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$post_id4 = $this->factory->post->create( array( 'post_type' => 'page', 'post_parent' => $post_id3 ) );

		$all = get_pages();

		$this->assertCount( 4, $all );

		$exclude1 = get_pages( "exclude_tree=$post_id1" );
		$this->assertCount( 2, $exclude1 );

		$exclude2 = get_pages( array( 'exclude_tree' => $post_id1 ) );
		$this->assertCount( 2, $exclude2 );

		$exclude3 = get_pages( array( 'exclude_tree' => array( $post_id1 ) ) );
		$this->assertCount( 2, $exclude3 );

		$exclude4 = get_pages( array( 'exclude_tree' => array( $post_id1, $post_id2 ) ) );
		$this->assertCount( 2, $exclude4 );

		$exclude5 = get_pages( array( 'exclude_tree' => array( $post_id1, $post_id3 ) ) );
		$this->assertCount( 0, $exclude5 );

		$post_id5 = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$post_id6 = $this->factory->post->create( array( 'post_type' => 'page', 'post_parent' => $post_id5 ) );

		$exclude6 = get_pages( array( 'exclude_tree' => array( $post_id1, $post_id3 ) ) );
		$this->assertCount( 2, $exclude6 );
	}
}
