<?php

class Tests_Query extends WP_UnitTestCase {

	function setUp() {
		parent::setUp();

		create_initial_taxonomies();
		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
	}

	/**
	 * @ticket 24785
	 *
	 */
	function test_nested_loop_reset_postdata() {
		$post_id = self::factory()->post->create();
		$nested_post_id = self::factory()->post->create();

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
		self::factory()->post->create_many( 10 );

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
		self::factory()->tag->create( array( 'slug' => $slug ) );
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
		$terms = self::factory()->term->create_many( 2, array(
			'taxonomy' => 'wptests_tax',
		) );

		$posts = self::factory()->post->create_many( 2 );

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

	/**
	 * @ticket 37962
	 */
	public function test_get_queried_object_should_return_null_for_not_exists_tax_query() {
		register_taxonomy( 'wptests_tax', 'post' );

		$q = new WP_Query( array(
			'tax_query' => array(
				array(
					'taxonomy' => 'wptests_tax',
					'operator' => 'NOT EXISTS',
				),
			),
		) );

		$queried_object = $q->get_queried_object();
		$this->assertNull( $queried_object );
	}

	public function test_orderby_space_separated() {
		global $wpdb;

		$q = new WP_Query( array(
			'orderby' => 'title date',
			'order' => 'DESC',
		) );

		$this->assertContains( "ORDER BY $wpdb->posts.post_title DESC, $wpdb->posts.post_date DESC", $q->request );
	}

	public function test_cat_querystring_single_term() {
		$c1 = self::factory()->category->create( array(
			'name' => 'Test Category 1',
			'slug' => 'test1',
		) );
		$c2 = self::factory()->category->create( array(
			'name' => 'Test Category 2',
			'slug' => 'test2',
		) );

		$p1 = self::factory()->post->create();
		$p2 = self::factory()->post->create();
		$p3 = self::factory()->post->create();

		wp_set_object_terms( $p1, $c1, 'category' );
		wp_set_object_terms( $p2, array( $c1, $c2 ), 'category' );
		wp_set_object_terms( $p3, $c2, 'category' );

		$url = add_query_arg( array(
			'cat' => $c1,
		), '/' );

		$this->go_to( $url );

		$matching_posts = wp_list_pluck( $GLOBALS['wp_query']->posts, 'ID' );

		$this->assertEqualSets( array( $p1, $p2 ), $matching_posts );
	}

	public function test_category_querystring_multiple_terms_comma_separated() {
		$c1 = self::factory()->category->create( array(
			'name' => 'Test Category 1',
			'slug' => 'test1',
		) );
		$c2 = self::factory()->category->create( array(
			'name' => 'Test Category 2',
			'slug' => 'test2',
		) );
		$c3 = self::factory()->category->create( array(
			'name' => 'Test Category 3',
			'slug' => 'test3',
		) );

		$p1 = self::factory()->post->create();
		$p2 = self::factory()->post->create();
		$p3 = self::factory()->post->create();
		$p4 = self::factory()->post->create();

		wp_set_object_terms( $p1, $c1, 'category' );
		wp_set_object_terms( $p2, array( $c1, $c2 ), 'category' );
		wp_set_object_terms( $p3, $c2, 'category' );
		wp_set_object_terms( $p4, $c3, 'category' );

		$url = add_query_arg( array(
			'cat' => implode( ',',array( $c1,$c2 ) ),
		), '/' );

		$this->go_to( $url );

		$matching_posts = wp_list_pluck( $GLOBALS['wp_query']->posts, 'ID' );

		$this->assertEqualSets( array( $p1, $p2, $p3 ), $matching_posts );
	}

	/**
	 * @ticket 33532
	 */
	public function test_category_querystring_multiple_terms_formatted_as_array() {
		$c1 = self::factory()->category->create( array(
			'name' => 'Test Category 1',
			'slug' => 'test1',
		) );
		$c2 = self::factory()->category->create( array(
			'name' => 'Test Category 2',
			'slug' => 'test2',
		) );
		$c3 = self::factory()->category->create( array(
			'name' => 'Test Category 3',
			'slug' => 'test3',
		) );

		$p1 = self::factory()->post->create();
		$p2 = self::factory()->post->create();
		$p3 = self::factory()->post->create();
		$p4 = self::factory()->post->create();

		wp_set_object_terms( $p1, $c1, 'category' );
		wp_set_object_terms( $p2, array( $c1, $c2 ), 'category' );
		wp_set_object_terms( $p3, $c2, 'category' );
		wp_set_object_terms( $p4, $c3, 'category' );

		$url = add_query_arg( array(
			'cat' => array( $c1, $c2 ),
		), '/' );

		$this->go_to( $url );

		$matching_posts = wp_list_pluck( $GLOBALS['wp_query']->posts, 'ID' );

		$this->assertEqualSets( array( $p1, $p2, $p3 ), $matching_posts );
	}


	public function test_tag_querystring_single_term() {
		$t1 = self::factory()->tag->create_and_get( array(
			'name' => 'Test Tag 1',
			'slug' => 'test1',
		) );
		$t2 = self::factory()->tag->create_and_get( array(
			'name' => 'Test Tag 2',
			'slug' => 'test2',
		) );

		$p1 = self::factory()->post->create();
		$p2 = self::factory()->post->create();
		$p3 = self::factory()->post->create();

		wp_set_object_terms( $p1, $t1->slug, 'post_tag' );
		wp_set_object_terms( $p2, array( $t1->slug, $t2->slug ), 'post_tag' );
		wp_set_object_terms( $p3, $t2->slug, 'post_tag' );

		$url = add_query_arg( array(
			'tag' => $t1->slug,
		), '/' );

		$this->go_to( $url );

		$matching_posts = wp_list_pluck( $GLOBALS['wp_query']->posts, 'ID' );

		$this->assertEqualSets( array( $p1, $p2 ), $matching_posts );
	}

	public function test_tag_querystring_multiple_terms_comma_separated() {
		$c1 = self::factory()->tag->create_and_get( array(
			'name' => 'Test Tag 1',
			'slug' => 'test1',
		) );
		$c2 = self::factory()->tag->create_and_get( array(
			'name' => 'Test Tag 2',
			'slug' => 'test2',
		) );
		$c3 = self::factory()->tag->create_and_get( array(
			'name' => 'Test Tag 3',
			'slug' => 'test3',
		) );

		$p1 = self::factory()->post->create();
		$p2 = self::factory()->post->create();
		$p3 = self::factory()->post->create();
		$p4 = self::factory()->post->create();

		wp_set_object_terms( $p1, $c1->slug, 'post_tag' );
		wp_set_object_terms( $p2, array( $c1->slug, $c2->slug ), 'post_tag' );
		wp_set_object_terms( $p3, $c2->slug, 'post_tag' );
		wp_set_object_terms( $p4, $c3->slug, 'post_tag' );

		$url = add_query_arg( array(
			'tag' => implode( ',',array( $c1->slug,$c2->slug ) ),
		), '/' );

		$this->go_to( $url );

		$matching_posts = wp_list_pluck( $GLOBALS['wp_query']->posts, 'ID' );

		$this->assertEqualSets( array( $p1, $p2, $p3 ), $matching_posts );
	}

	/**
	 * @ticket 33532
	 */
	public function test_tag_querystring_multiple_terms_formatted_as_array() {
		$c1 = self::factory()->tag->create_and_get( array(
			'name' => 'Test Tag 1',
			'slug' => 'test1',
		) );
		$c2 = self::factory()->tag->create_and_get( array(
			'name' => 'Test Tag 2',
			'slug' => 'test2',
		) );
		$c3 = self::factory()->tag->create_and_get( array(
			'name' => 'Test Tag 3',
			'slug' => 'test3',
		) );

		$p1 = self::factory()->post->create();
		$p2 = self::factory()->post->create();
		$p3 = self::factory()->post->create();
		$p4 = self::factory()->post->create();

		wp_set_object_terms( $p1, $c1->slug, 'post_tag' );
		wp_set_object_terms( $p2, array( $c1->slug, $c2->slug ), 'post_tag' );
		wp_set_object_terms( $p3, $c2->slug, 'post_tag' );
		wp_set_object_terms( $p4, $c3->slug, 'post_tag' );

		$url = add_query_arg( array(
			'tag' => array($c1->slug,$c2->slug),
		), '/' );

		$this->go_to( $url );

		$matching_posts = wp_list_pluck( $GLOBALS['wp_query']->posts, 'ID' );

		$this->assertEqualSets( array( $p1, $p2, $p3 ), $matching_posts );
	}

	public function test_custom_taxonomy_querystring_single_term() {
		register_taxonomy( 'test_tax_cat', 'post' );

		wp_insert_term( 'test1', 'test_tax_cat' );
		wp_insert_term( 'test2', 'test_tax_cat' );
		wp_insert_term( 'test3', 'test_tax_cat' );

		$p1 = self::factory()->post->create();
		$p2 = self::factory()->post->create();
		$p3 = self::factory()->post->create();

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

		$p1 = self::factory()->post->create();
		$p2 = self::factory()->post->create();
		$p3 = self::factory()->post->create();
		$p4 = self::factory()->post->create();

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

		$p1 = self::factory()->post->create();
		$p2 = self::factory()->post->create();
		$p3 = self::factory()->post->create();
		$p4 = self::factory()->post->create();

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

	/**
	 * @ticket 31355
	 */
	public function test_pages_dont_404_when_queried_post_id_is_modified() {
		$post_id = self::factory()->post->create( array( 'post_title' => 'A Test Page', 'post_type' => 'page' ) );

		add_action( 'parse_query', array( $this, 'filter_parse_query_to_modify_queried_post_id' ) );

		$url = get_permalink( $post_id );
		$this->go_to( $url );

		remove_action( 'parse_query', array( $this, 'filter_parse_query_to_modify_queried_post_id' ) );

		$this->assertFalse( $GLOBALS['wp_query']->is_404() );
		$this->assertEquals( $post_id, $GLOBALS['wp_query']->post->ID );
	}

	/**
	 * @ticket 31355
	 */
	public function test_custom_hierarchical_post_types_404_when_queried_post_id_is_modified() {
		global $wp_rewrite;

		register_post_type( 'guide', array( 'name' => 'Guide', 'public' => true, 'hierarchical' => true ) );
		$wp_rewrite->flush_rules();
		$post_id = self::factory()->post->create( array( 'post_title' => 'A Test Guide', 'post_type' => 'guide' ) );

		add_action( 'parse_query', array( $this, 'filter_parse_query_to_modify_queried_post_id' ) );

		$url = get_permalink( $post_id );
		$this->go_to( $url );

		remove_action( 'parse_query', array( $this, 'filter_parse_query_to_modify_queried_post_id' ) );

		$this->assertFalse( $GLOBALS['wp_query']->is_404() );
		$this->assertEquals( $post_id, $GLOBALS['wp_query']->post->ID );
	}

	public function filter_parse_query_to_modify_queried_post_id( $query ) {
		$post = get_queried_object();
	}

	/**
	 * @ticket 34060
	 */
	public function test_offset_0_should_override_page() {
		$q = new WP_Query( array(
			'paged' => 2,
			'posts_per_page' => 5,
			'offset' => 0,
		) );

		$this->assertContains( 'LIMIT 0, 5', $q->request );
	}

	/**
	 * @ticket 34060
	 */
	public function test_offset_should_be_ignored_when_not_set() {
		$q = new WP_Query( array(
			'paged' => 2,
			'posts_per_page' => 5,
		) );

		$this->assertContains( 'LIMIT 5, 5', $q->request );
	}

	/**
	 * @ticket 34060
	 */
	public function test_offset_should_be_ignored_when_passed_a_non_numeric_value() {
		$q = new WP_Query( array(
			'paged' => 2,
			'posts_per_page' => 5,
			'offset' => '',
		) );

		$this->assertContains( 'LIMIT 5, 5', $q->request );
	}

	/**
	 * @ticket 35601
	 */
	public function test_comment_status() {
		$p1 = self::factory()->post->create( array( 'comment_status' => 'open' ) );
		$p2 = self::factory()->post->create( array( 'comment_status' => 'closed' ) );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'comment_status' => 'closed',
		) );

		$this->assertSame( array( $p2 ), $q->posts );
	}

	/**
	 * @ticket 35601
	 */
	public function test_ping_status() {
		$p1 = self::factory()->post->create( array( 'ping_status' => 'open' ) );
		$p2 = self::factory()->post->create( array( 'ping_status' => 'closed' ) );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'ping_status' => 'closed',
		) );

		$this->assertSame( array( $p2 ), $q->posts );
	}

	/**
	 * @ticket 35619
	 */
	public function test_get_queried_object_should_return_first_of_multiple_terms() {
		register_taxonomy( 'tax1', 'post' );
		register_taxonomy( 'tax2', 'post' );

		$term1 = $this->factory->term->create( array( 'taxonomy' => 'tax1', 'name' => 'term1' ) );
		$term2 = $this->factory->term->create( array( 'taxonomy' => 'tax2', 'name' => 'term2' ) );
		$post_id = $this->factory->post->create();
		wp_set_object_terms( $post_id, 'term1', 'tax1' );
		wp_set_object_terms( $post_id, 'term2', 'tax2' );

		$this->go_to( home_url( '?tax1=term1&tax2=term2' ) );
		$queried_object = get_queried_object();

		$this->assertSame( 'tax1', $queried_object->taxonomy );
		$this->assertSame( 'term1', $queried_object->slug );
	}

	/**
	 * @ticket 35619
	 */
	public function test_query_vars_should_match_first_of_multiple_terms() {
		register_taxonomy( 'tax1', 'post' );
		register_taxonomy( 'tax2', 'post' );

		$term1 = $this->factory->term->create( array( 'taxonomy' => 'tax1', 'name' => 'term1' ) );
		$term2 = $this->factory->term->create( array( 'taxonomy' => 'tax2', 'name' => 'term2' ) );
		$post_id = $this->factory->post->create();
		wp_set_object_terms( $post_id, 'term1', 'tax1' );
		wp_set_object_terms( $post_id, 'term2', 'tax2' );

		$this->go_to( home_url( '?tax1=term1&tax2=term2' ) );
		$queried_object = get_queried_object();

		$this->assertSame( 'tax1', get_query_var( 'taxonomy' ) );
		$this->assertSame( 'term1', get_query_var( 'term' ) );
	}
}
