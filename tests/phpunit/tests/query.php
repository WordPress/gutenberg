<?php

class Tests_Query extends WP_UnitTestCase {

	function setUp() {
		global $wp_rewrite;
		parent::setUp();

		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		create_initial_taxonomies();

		$wp_rewrite->flush_rules();
	}

	/**
	 * @ticket 24785
	 *
	 */
	function test_nested_loop_reset_postdata() {
		$post_id = $this->factory->post->create();
		$nested_post_id = $this->factory->post->create();

		$first_query = new WP_Query( array( 'post__in' => array( $post_id ) ) );
		while ( $first_query->have_posts() ) { $first_query->the_post();
			$second_query = new WP_Query( array( 'post__in' => array( $nested_post_id ) ) );
			while ( $second_query->have_posts() ) {
				$second_query->the_post();
				$this->assertEquals( get_the_ID(), $nested_post_id );
			}
			$first_query->reset_postdata();
			$this->assertEquals( get_the_ID(), $post_id );
		}
	}

	/**
	 * @ticket 16471
	 */
	function test_default_query_var() {
		$query = new WP_Query;
		$this->assertEquals( '', $query->get( 'nonexistent' ) );
		$this->assertFalse( $query->get( 'nonexistent', false ) );
		$this->assertTrue( $query->get( 'nonexistent', true ) );
	}

	/**
	 * @ticket 25380
	 */
	function test_pre_posts_per_page() {
		$this->factory->post->create_many( 10 );

		add_action( 'pre_get_posts', array( $this, 'filter_posts_per_page' ) );

		$this->go_to( get_feed_link() );

		$this->assertEquals( 30, get_query_var( 'posts_per_page' ) );
	}

	function filter_posts_per_page( &$query ) {
		$query->set( 'posts_per_rss', 30 );
	}

	/**
	 * @ticket 26627
	 */
	function test_tag_queried_object() {
		$slug = 'tag-slug-26627';
		$this->factory->tag->create( array( 'slug' => $slug ) );
		$tag = get_term_by( 'slug', $slug, 'post_tag' );

		add_action( 'pre_get_posts', array( $this, '_tag_queried_object' ), 11 );

		$this->go_to( get_term_link( $tag ) );

		$this->assertQueryTrue( 'is_tag', 'is_archive' );
		$this->assertNotEmpty( get_query_var( 'tag_id' ) );
		$this->assertNotEmpty( get_query_var( 'tag' ) );
		$this->assertEmpty( get_query_var( 'tax_query' ) );
		$this->assertCount( 1, get_query_var( 'tag_slug__in' ) );
		$this->assertEquals( get_queried_object(), $tag );

		remove_action( 'pre_get_posts', array( $this, '_tag_queried_object' ), 11 );
	}

	function _tag_queried_object( &$query ) {
		$tag = get_term_by( 'slug', 'tag-slug-26627', 'post_tag' );
		$this->assertTrue( $query->is_tag() );
		$this->assertTrue( $query->is_archive() );
		$this->assertNotEmpty( $query->get( 'tag' ) );
		$this->assertCount( 1, $query->get( 'tag_slug__in' ) );
		$this->assertEquals( $query->get_queried_object(), $tag );
	}

	/**
	 * @ticket 31246
	 */
	public function test_get_queried_object_should_return_null_when_is_tax_is_true_but_the_taxonomy_args_have_been_removed_in_a_parse_query_callback() {
		// Don't override the args provided below.
		remove_action( 'pre_get_posts', array( $this, 'pre_get_posts_tax_category_tax_query' ) );
		register_taxonomy( 'wptests_tax', 'post' );
		$terms = $this->factory->term->create_many( 2, array(
			'taxonomy' => 'wptests_tax',
		) );

		$posts = $this->factory->post->create_many( 2 );

		wp_set_object_terms( $posts[0], array( $terms[0] ), 'wptests_tax' );
		wp_set_object_terms( $posts[1], array( $terms[1] ), 'wptests_tax' );

		add_action( 'parse_query', array( $this, 'filter_parse_query_to_remove_tax' ) );
		$q = new WP_Query( array(
			'fields' => 'ids',
			'wptests_tax' => $terms[1],
		) );

		remove_action( 'parse_query', array( $this, 'filter_parse_query_to_remove_tax' ) );

		$this->assertNull( $q->get_queried_object() );
	}

	public function filter_parse_query_to_remove_tax( $q ) {
		unset( $q->query_vars['wptests_tax'] );
	}

	public function test_orderby_space_separated() {
		global $wpdb;

		$q = new WP_Query( array(
			'orderby' => 'title date',
			'order' => 'DESC',
		) );

		$this->assertContains( "ORDER BY $wpdb->posts.post_title DESC, $wpdb->posts.post_date DESC", $q->request );
	}

	public function test_custom_taxonomy_querystring_single_term() {
		register_taxonomy( 'test_tax_cat', 'post' );

		wp_insert_term( 'test1', 'test_tax_cat' );
		wp_insert_term( 'test2', 'test_tax_cat' );
		wp_insert_term( 'test3', 'test_tax_cat' );

		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_object_terms( $p1, 'test1', 'test_tax_cat' );
		wp_set_object_terms( $p2, array( 'test1', 'test2' ), 'test_tax_cat' );
		wp_set_object_terms( $p3, 'test2', 'test_tax_cat' );

		$url = add_query_arg( array(
			'test_tax_cat' => 'test1',
		), '/' );

		$this->go_to( $url );

		$this->assertEqualSets( array( $p1, $p2 ), wp_list_pluck( $GLOBALS['wp_query']->posts, 'ID' ) );
	}

	public function test_custom_taxonomy_querystring_multiple_terms_comma_separated() {
		register_taxonomy( 'test_tax_cat', 'post' );

		wp_insert_term( 'test1', 'test_tax_cat' );
		wp_insert_term( 'test2', 'test_tax_cat' );
		wp_insert_term( 'test3', 'test_tax_cat' );

		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();
		$p4 = $this->factory->post->create();

		wp_set_object_terms( $p1, 'test1', 'test_tax_cat' );
		wp_set_object_terms( $p2, array( 'test1', 'test2' ), 'test_tax_cat' );
		wp_set_object_terms( $p3, 'test2', 'test_tax_cat' );
		wp_set_object_terms( $p4, "test3", 'test_tax_cat' );

		$url = add_query_arg( array(
			'test_tax_cat' => 'test1,test2',
		), '/' );

		$this->go_to( $url );

		$this->assertEqualSets( array( $p1, $p2, $p3 ), wp_list_pluck( $GLOBALS['wp_query']->posts, 'ID' ) );
	}

	/**
	 * @ticket 32454
	 */
	public function test_custom_taxonomy_querystring_multiple_terms_formatted_as_array() {
		register_taxonomy( 'test_tax_cat', 'post' );

		wp_insert_term( 'test1', 'test_tax_cat' );
		wp_insert_term( 'test2', 'test_tax_cat' );
		wp_insert_term( 'test3', 'test_tax_cat' );

		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();
		$p4 = $this->factory->post->create();

		wp_set_object_terms( $p1, 'test1', 'test_tax_cat' );
		wp_set_object_terms( $p2, array( 'test1', 'test2' ), 'test_tax_cat' );
		wp_set_object_terms( $p3, 'test2', 'test_tax_cat' );
		wp_set_object_terms( $p4, "test3", 'test_tax_cat' );

		$url = add_query_arg( array(
			'test_tax_cat' => array( 'test1', 'test2' ),
		), '/' );

		$this->go_to( $url );

		$this->assertEqualSets( array( $p1, $p2, $p3 ), wp_list_pluck( $GLOBALS['wp_query']->posts, 'ID' ) );
	}
}
