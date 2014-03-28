<?php
/**
 * @group link
 */
class Tests_Link extends WP_UnitTestCase {

	function _get_pagenum_link_cb( $url ) {
		return $url . '/WooHoo';
	}

	/**
	 * @ticket 8847
	 */
	function test_get_pagenum_link_case_insensitivity() {
		$old_req_uri = $_SERVER['REQUEST_URI'];

		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure('/%year%/%monthnum%/%day%/%postname%/');
		$wp_rewrite->flush_rules();

		add_filter( 'home_url', array( $this, '_get_pagenum_link_cb' ) );
		$_SERVER['REQUEST_URI'] = '/woohoo';
		$paged = get_pagenum_link( 2 );

		remove_filter( 'home_url', array( $this, '_get_pagenum_link_cb' ) );
		$this->assertEquals( $paged, home_url( '/WooHoo/page/2/' ) );

		$_SERVER['REQUEST_URI'] = $old_req_uri;
	}

	function test_wp_get_shortlink() {
		$post_id = $this->factory->post->create();
		$post_id2 = $this->factory->post->create();

		// Basic case
		$this->assertEquals( get_permalink( $post_id ), wp_get_shortlink( $post_id, 'post' ) );

		unset( $GLOBALS['post'] );

		// Global post is not set
		$this->assertEquals( '', wp_get_shortlink( 0, 'post' ) );
		$this->assertEquals( '', wp_get_shortlink( 0 ) );
		$this->assertEquals( '', wp_get_shortlink() );

		$GLOBALS['post'] = get_post( $post_id );

		// Global post is set
		$this->assertEquals( get_permalink( $post_id ), wp_get_shortlink( 0, 'post' ) );
		$this->assertEquals( get_permalink( $post_id ), wp_get_shortlink( 0 ) );
		$this->assertEquals( get_permalink( $post_id ), wp_get_shortlink() );

		// Not the global post
		$this->assertEquals( get_permalink( $post_id2 ), wp_get_shortlink( $post_id2, 'post' ) );

		unset( $GLOBALS['post'] );

		// Global post is not set, once again
		$this->assertEquals( '', wp_get_shortlink( 0, 'post' ) );
		$this->assertEquals( '', wp_get_shortlink( 0 ) );
		$this->assertEquals( '', wp_get_shortlink() );

		global $wp_rewrite;
		$wp_rewrite->permalink_structure = '';
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		$wp_rewrite->flush_rules();

		// With a permalink structure set, get_permalink() will no longer match.
		$this->assertNotEquals( get_permalink( $post_id ), wp_get_shortlink( $post_id, 'post' ) );
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( $post_id, 'post' ) );

		// Global post and permalink structure are set
		$GLOBALS['post'] = get_post( $post_id );
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( 0, 'post' ) );
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( 0 ) );
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink() );

		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules();
	}

	function test_wp_get_shortlink_with_page() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'page' ) );

		// Basic case
		// Don't test against get_permalink() since it uses ?page_id= for pages.
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( $post_id, 'post' ) );

		global $wp_rewrite;
		$wp_rewrite->permalink_structure = '';
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		$wp_rewrite->flush_rules();

		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( $post_id, 'post' ) );

		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules();
	}

	/**
	 * @ticket 26871
	 */
	function test_wp_get_shortlink_with_home_page() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $post_id );

		$this->assertEquals( home_url( '/' ), wp_get_shortlink( $post_id, 'post' ) );

		global $wp_rewrite;
		$wp_rewrite->permalink_structure = '';
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		$wp_rewrite->flush_rules();

		$this->assertEquals( home_url( '/' ), wp_get_shortlink( $post_id, 'post' ) );

		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules();
	}

	/**
	 * @ticket 17807
	 */
	function test_get_adjacent_post() {
		// Need some sample posts to test adjacency
		$post_one = $this->factory->post->create_and_get( array(
			'post_title' => 'First',
			'post_date' => '2012-01-01 12:00:00'
		) );

		$post_two = $this->factory->post->create_and_get( array(
			'post_title' => 'Second',
			'post_date' => '2012-02-01 12:00:00'
		) );

		$post_three = $this->factory->post->create_and_get( array(
			'post_title' => 'Third',
			'post_date' => '2012-03-01 12:00:00'
		) );

		$post_four = $this->factory->post->create_and_get( array(
			'post_title' => 'Fourth',
			'post_date' => '2012-04-01 12:00:00'
		) );

		// Assign some terms
		wp_set_object_terms( $post_one->ID, 'wordpress', 'category', false );
		wp_set_object_terms( $post_three->ID, 'wordpress', 'category', false );

		wp_set_object_terms( $post_two->ID, 'plugins', 'post_tag', false );
		wp_set_object_terms( $post_four->ID, 'plugins', 'post_tag', false );

		// Test normal post adjacency
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( $post_one, get_adjacent_post( false, '', true ) );
		$this->assertEquals( $post_three, get_adjacent_post( false, '', false ) );

		$this->assertNotEquals( $post_two, get_adjacent_post( false, '', true ) );
		$this->assertNotEquals( $post_two, get_adjacent_post( false, '', false ) );

		// Test category adjacency
		$this->go_to( get_permalink( $post_one->ID ) );

		$this->assertEquals( '', get_adjacent_post( true, '', true, 'category' ) );
		$this->assertEquals( $post_three, get_adjacent_post( true, '', false, 'category' ) );

		// Test tag adjacency
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( '', get_adjacent_post( true, '', true, 'post_tag' ) );
		$this->assertEquals( $post_four, get_adjacent_post( true, '', false, 'post_tag' ) );

		// Test normal boundary post
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( array( $post_one ), get_boundary_post( false, '', true ) );
		$this->assertEquals( array( $post_four ), get_boundary_post( false, '', false ) );

		// Test category boundary post
		$this->go_to( get_permalink( $post_one->ID ) );

		$this->assertEquals( array( $post_one ), get_boundary_post( true, '', true, 'category' ) );
		$this->assertEquals( array( $post_three ), get_boundary_post( true, '', false, 'category' ) );

		// Test tag boundary post
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( array( $post_two ), get_boundary_post( true, '', true, 'post_tag' ) );
		$this->assertEquals( array( $post_four ), get_boundary_post( true, '', false, 'post_tag' ) );
	}

	/**
	 * @ticket 26937
	 */
	function test_legacy_get_adjacent_post_filters() {
		// Need some sample posts to test adjacency
		$post_one = $this->factory->post->create_and_get( array(
			'post_title' => 'First',
			'post_date'  => '2012-01-01 12:00:00',
		) );

		$post_two = $this->factory->post->create_and_get( array(
			'post_title' => 'Second',
			'post_date'  => '2012-02-01 12:00:00',
		) );

		$post_three = $this->factory->post->create_and_get( array(
			'post_title' => 'Third',
			'post_date'  => '2012-03-01 12:00:00',
		) );

		$post_four = $this->factory->post->create_and_get( array(
			'post_title' => 'Fourth',
			'post_date'  => '2012-04-01 12:00:00',
		) );

		// Use pages to test post-type adjacency
		$page_one = $this->factory->post->create_and_get( array(
			'post_title' => 'First Page',
			'post_date'  => '2013-01-01 12:00:00',
			'post_type'  => 'page',
		) );

		$page_two = $this->factory->post->create_and_get( array(
			'post_title' => 'Second Page',
			'post_date'  => '2013-02-01 12:00:00',
			'post_type'  => 'page',
		) );

		// Add some meta so we can join the postmeta table and query
		add_post_meta( $post_three->ID, 'unit_test_meta', 'waffle' );

		// Test "where" filter for a previous post
		add_filter( 'get_previous_post_where', array( $this, 'filter_previous_post_where' ) );
		$this->go_to( get_permalink( $post_three->ID ) );
		$this->assertEquals( $post_one, get_adjacent_post( false, null, true ) );
		remove_filter( 'get_previous_post_where', array( $this, 'filter_previous_post_where' ) );

		// Test "where" filter for a next post
		add_filter( 'get_next_post_where', array( $this, 'filter_next_post_where' ) );
		$this->go_to( get_permalink( $post_two->ID ) );
		$this->assertEquals( $post_four, get_adjacent_post( false, null, false ) );
		remove_filter( 'get_next_post_where', array( $this, 'filter_next_post_where' ) );

		// Test "where" filter that writes its own query
		add_filter( 'get_previous_post_where', array( $this, 'override_previous_post_where_clause' ) );
		$this->go_to( get_permalink( $post_four->ID ) );
		$this->assertEquals( $post_two, get_adjacent_post( false, null, true ) );
		remove_filter( 'get_previous_post_where', array( $this, 'override_previous_post_where_clause' ) );

		// Test "join" filter by joining the postmeta table and restricting by meta key
		add_filter( 'get_next_post_join', array( $this, 'filter_next_post_join' ) );
		add_filter( 'get_next_post_where', array( $this, 'filter_next_post_where_with_join' ) );
		$this->go_to( get_permalink( $post_one->ID ) );
		$this->assertEquals( $post_three, get_adjacent_post( false, null, false ) );
		remove_filter( 'get_next_post_join', array( $this, 'filter_next_post_join' ) );
		remove_filter( 'get_next_post_where', array( $this, 'filter_next_post_where_with_join' ) );

		// Test "sort" filter when modifying ORDER BY clause
		add_filter( 'get_next_post_sort', array( $this, 'filter_next_post_sort' ) );
		$this->go_to( get_permalink( $post_one->ID ) );
		$this->assertEquals( $post_four, get_adjacent_post( false, null, false ) );
		remove_filter( 'get_next_post_sort', array( $this, 'filter_next_post_sort' ) );

		// Test "sort" filter when modifying LIMIT clause
		add_filter( 'get_next_post_sort', array( $this, 'filter_next_post_sort_limit' ) );
		$this->go_to( get_permalink( $post_one->ID ) );
		$this->assertEquals( $post_three, get_adjacent_post( false, null, false ) );
		remove_filter( 'get_next_post_sort', array( $this, 'filter_next_post_sort_limit' ) );

		// Test post-type specificity
		$this->go_to( get_permalink( $page_one ) );
		$this->assertEquals( $page_two, get_adjacent_post( false, null, false ) );

		$this->go_to( get_permalink( $page_two ) );
		$this->assertEquals( $page_one, get_adjacent_post( false, null, true ) );
	}

	/**
	 * Filter callback for `test_legacy_get_adjacent_post_filters()`
	 */
	function filter_previous_post_where( $where ) {
		$where .= " AND post_title !='Second'";
		return $where;
	}

	/**
	 * Filter callback for `test_legacy_get_adjacent_post_filters()`
	 */
	function filter_next_post_where( $where ) {
		$where .= " AND post_title !='Third'";
		return $where;
	}

	/**
	 * Filter callback for `test_legacy_get_adjacent_post_filters()`
	 */
	function override_previous_post_where_clause( $where ) {
		$where = "WHERE p.post_date < '2012-02-28'";
		return $where;
	}

	/**
	 * Filter callback for `test_legacy_get_adjacent_post_filters()`
	 */
	function filter_next_post_join( $join ) {
		global $wpdb;

		$join .= " INNER JOIN {$wpdb->postmeta} ON p.ID = {$wpdb->postmeta}.post_id";
		return $join;
	}

	/**
	 * Filter callback for `test_legacy_get_adjacent_post_filters()`
	 */
	function filter_next_post_where_with_join( $where ) {
		global $wpdb;

		$where .= " AND {$wpdb->postmeta}.meta_key = 'unit_test_meta'";
		return $where;
	}

	/**
	 * Filter callback for `test_legacy_get_adjacent_post_filters()`
	 */
	function filter_next_post_sort( $sort ) {
		return str_replace( 'p.post_date', 'p.post_title', $sort );
	}

	/**
	 * Filter callback for `test_legacy_get_adjacent_post_filters()`
	 */
	function filter_next_post_sort_limit( $sort ) {
		$sort = str_replace( 'LIMIT 0, 1', 'LIMIT 1, 2', $sort );
		return $sort;
	}
}