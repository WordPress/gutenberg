<?php

class Tests_Post_Query extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
	}

	/**
	 * @group taxonomy
	 */
	function test_category__and_var() {
		$q = new WP_Query();

		$term_id = $this->factory->category->create( array( 'slug' => 'woo', 'name' => 'WOO!' ) );
		$term_id2 = $this->factory->category->create( array( 'slug' => 'hoo', 'name' => 'HOO!' ) );
		$post_id = $this->factory->post->create();

		wp_set_post_categories( $post_id, $term_id );

		$posts = $q->query( array( 'category__and' => array( $term_id ) ) );

		$this->assertEmpty( $q->get( 'category__and' ) );
		$this->assertCount( 0, $q->get( 'category__and' ) );
		$this->assertNotEmpty( $q->get( 'category__in' ) );
		$this->assertCount( 1, $q->get( 'category__in' ) );

		$this->assertNotEmpty( $posts );
		$this->assertEquals( array( $post_id ), wp_list_pluck( $posts, 'ID' ) );

		$posts2 = $q->query( array( 'category__and' => array( $term_id, $term_id2 ) ) );
		$this->assertNotEmpty( $q->get( 'category__and' ) );
		$this->assertCount( 2, $q->get( 'category__and' ) );
		$this->assertEmpty( $q->get( 'category__in' ) );
		$this->assertCount( 0, $q->get( 'category__in' ) );

		$this->assertEmpty( $posts2 );
	}

	/**
	 * @ticket 28099
	 * @group taxonomy
	 */
	function test_empty_category__in() {
		$cat_id = $this->factory->category->create();
		$post_id = $this->factory->post->create();
		wp_set_post_categories( $post_id, $cat_id );

		$q1 = get_posts( array( 'category__in' => array( $cat_id ) ) );
		$this->assertNotEmpty( $q1 );
		$q2 = get_posts( array( 'category__in' => array() ) );
		$this->assertNotEmpty( $q2 );

		$tag = wp_insert_term( 'woo', 'post_tag' );
		$tag_id = $tag['term_id'];
		$slug = get_tag( $tag_id )->slug;
		wp_set_post_tags( $post_id, $slug );

		$q3 = get_posts( array( 'tag__in' => array( $tag_id ) ) );
		$this->assertNotEmpty( $q3 );
		$q4 = get_posts( array( 'tag__in' => array() ) );
		$this->assertNotEmpty( $q4 );

		$q5 = get_posts( array( 'tag_slug__in' => array( $slug ) ) );
		$this->assertNotEmpty( $q5 );
		$q6 = get_posts( array( 'tag_slug__in' => array() ) );
		$this->assertNotEmpty( $q6 );
	}

	/**
	 * @ticket 22448
	 */
	function test_the_posts_filter() {
		// Create posts and clear their caches.
		$post_ids = $this->factory->post->create_many( 10 );
		foreach ( $post_ids as $post_id )
			clean_post_cache( $post_id );

		add_filter( 'the_posts', array( $this, 'the_posts_filter' ) );

		$query = new WP_Query( array(
			'post_type' => 'post',
			'posts_per_page' => 5,
		) );

		// Sixth post added in filter
		$this->assertEquals( 6, count( $query->posts ) );
		$this->assertEquals( 6, $query->post_count );

		foreach ( $query->posts as $post ) {

			// posts are WP_Post objects
			$this->assertTrue( is_a( $post, 'WP_Post' ) );

			// filters are raw
			$this->assertEquals( 'raw', $post->filter );

			// custom data added in the_posts filter is preserved
			$this->assertEquals( array( $post->ID, 'custom data' ), $post->custom_data );
		}

		remove_filter( 'the_posts', array( $this, 'the_posts_filter' ) );
	}

	/**
	 * Use with the_posts filter, appends a post and adds some custom data.
	 */
	function the_posts_filter( $posts ) {
		$posts[] = clone $posts[0];

		// Add some custom data to each post.
		foreach ( $posts as $key => $post )
			$posts[ $key ]->custom_data = array( $post->ID, 'custom data' );

		return $posts;
	}

	function test_post__in_ordering() {
		$post_id1 = $this->factory->post->create( array( 'post_type' => 'page', 'menu_order' => rand( 1, 100 ) ) );
		$post_id2 = $this->factory->post->create( array( 'post_type' => 'page', 'menu_order' => rand( 1, 100 ) ) );
		$post_id3 = $this->factory->post->create( array(
			'post_type' => 'page',
			'post_parent' => $post_id2,
			'menu_order' => rand( 1, 100 )
		) );
		$post_id4 = $this->factory->post->create( array(
			'post_type' => 'page',
			'post_parent' => $post_id2,
			'menu_order' => rand( 1, 100 )
		) );
		$post_id5 = $this->factory->post->create( array( 'post_type' => 'page', 'menu_order' => rand( 1, 100 ) ) );

		$ordered = array( $post_id2, $post_id4, $post_id3, $post_id1, $post_id5 );

		$q = new WP_Query( array(
			'post_type' => 'any',
			'post__in' => $ordered,
			'orderby' => 'post__in'
		) );
		$this->assertEqualSets( $ordered, wp_list_pluck( $q->posts, 'ID' ) );
	}

	function test_post__in_attachment_ordering() {
		$post_id = $this->factory->post->create();
		$att_ids = array();
		$file = DIR_TESTDATA . '/images/canola.jpg';
		$att_ids[1] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );
		$att_ids[2] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );
		$att_ids[3] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );
		$att_ids[4] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );
		$att_ids[5] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );

		$ordered = array( $att_ids[5], $att_ids[1], $att_ids[4], $att_ids[3], $att_ids[2] );

		$attached = new WP_Query( array(
			'post__in' => $ordered,
			'post_type' => 'attachment',
			'post_parent' => $post_id,
			'post_mime_type' => 'image',
			'post_status' => 'inherit',
			'posts_per_page' => '-1',
			'orderby' => 'post__in'
		) );
		$this->assertEqualSets( $ordered, wp_list_pluck( $attached->posts, 'ID' ) );
	}

	function test_post_status() {
		$statuses1 = get_post_stati();
		$this->assertContains( 'auto-draft', $statuses1 );

		$statuses2 = get_post_stati( array( 'exclude_from_search' => true ) );
		$this->assertContains( 'auto-draft', $statuses2 );

		$statuses3 = get_post_stati( array( 'exclude_from_search' => false ) );
		$this->assertNotContains( 'auto-draft', $statuses3 );

		$q1 = new WP_Query( array( 'post_status' => 'any' ) );
		$this->assertContains( "post_status <> 'auto-draft'", $q1->request );

		$q2 = new WP_Query( array( 'post_status' => 'any, auto-draft' ) );
		$this->assertNotContains( "post_status <> 'auto-draft'", $q2->request );

		$q3 = new WP_Query( array( 'post_status' => array( 'any', 'auto-draft' ) ) );
		$this->assertNotContains( "post_status <> 'auto-draft'", $q3->request );
	}

	/**
	 *
	 * @ticket 17065
	 */
	function test_orderby_array() {
		global $wpdb;

		$q1 = new WP_Query( array(
			'orderby' => array(
				'type' => 'DESC',
				'name' => 'ASC'
			)
		) );
		$this->assertContains(
			"ORDER BY $wpdb->posts.post_type DESC, $wpdb->posts.post_name ASC",
			$q1->request
		);

		$q2 = new WP_Query( array( 'orderby' => array() ) );
		$this->assertNotContains( 'ORDER BY', $q2->request );
		$this->assertNotContains( 'ORDER', $q2->request );

		$q3 = new WP_Query( array( 'post_type' => 'post' ) );
		$this->assertContains(
			"ORDER BY $wpdb->posts.post_date DESC",
			$q3->request
		);

		$q4 = new WP_Query( array( 'post_type' => 'post' ) );
		$this->assertContains(
			"ORDER BY $wpdb->posts.post_date DESC",
			$q4->request
		);
	}

	/**
	 *
	 * @ticket 17065
	 */
	function test_order() {
		global $wpdb;

		$q1 = new WP_Query( array(
			'orderby' => array(
				'post_type' => 'foo'
			)
		) );
		$this->assertContains(
			"ORDER BY $wpdb->posts.post_type DESC",
			$q1->request
		);

		$q2 = new WP_Query( array(
			'orderby' => 'title',
			'order'   => 'foo'
		) );
		$this->assertContains(
			"ORDER BY $wpdb->posts.post_title DESC",
			$q2->request
		);

		$q3 = new WP_Query( array(
			'order' => 'asc'
		) );
		$this->assertContains(
			"ORDER BY $wpdb->posts.post_date ASC",
			$q3->request
		);
	}

	/**
	 * @ticket 29629
	 */
	function test_orderby() {
		// 'rand' is a valid value
		$q = new WP_Query( array( 'orderby' => 'rand' ) );
		$this->assertContains( 'ORDER BY RAND()', $q->request );
		$this->assertNotContains( 'ASC', $q->request );
		$this->assertNotContains( 'DESC', $q->request );

		// This isn't allowed
		$q2 = new WP_Query( array( 'order' => 'rand' ) );
		$this->assertContains( 'ORDER BY', $q2->request );
		$this->assertNotContains( 'RAND()', $q2->request );
		$this->assertContains( 'DESC', $q2->request );

		// 'none' is a valid value
		$q3 = new WP_Query( array( 'orderby' => 'none' ) );
		$this->assertNotContains( 'ORDER BY', $q3->request );
		$this->assertNotContains( 'DESC', $q3->request );
		$this->assertNotContains( 'ASC', $q3->request );

		// false is a valid value
		$q4 = new WP_Query( array( 'orderby' => false ) );
		$this->assertNotContains( 'ORDER BY', $q4->request );
		$this->assertNotContains( 'DESC', $q4->request );
		$this->assertNotContains( 'ASC', $q4->request );

		// empty array() is a valid value
		$q5 = new WP_Query( array( 'orderby' => array() ) );
		$this->assertNotContains( 'ORDER BY', $q5->request );
		$this->assertNotContains( 'DESC', $q5->request );
		$this->assertNotContains( 'ASC', $q5->request );
	}
}
