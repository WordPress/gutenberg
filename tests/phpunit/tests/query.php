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
	 * @ticket 16746
	 */
	function test_nextpage_at_start_of_content() {
		$post = $this->factory->post->create_and_get( array( 'post_content' => '<!--nextpage-->Page 1<!--nextpage-->Page 2<!--nextpage-->Page 3' ) );
		setup_postdata( $post );

		$this->assertEquals( 1, $GLOBALS['multipage'] );
		$this->assertCount(  3, $GLOBALS['pages']     );
		$this->assertEquals( 3, $GLOBALS['numpages']  );
		$this->assertEquals( array( 'Page 1', 'Page 2', 'Page 3' ), $GLOBALS['pages'] );
	}

	function test_setup_postdata_single_page() {
		$post = $this->factory->post->create_and_get( array( 'post_content' => 'Page 0' ) );
		setup_postdata( $post );

		$this->assertEquals( 0, $GLOBALS['multipage'] );
		$this->assertCount(  1, $GLOBALS['pages']     );
		$this->assertEquals( 1, $GLOBALS['numpages']  );
		$this->assertEquals( array( 'Page 0' ), $GLOBALS['pages'] );
	}

	function test_setup_postdata_multi_page() {
		$post = $this->factory->post->create_and_get( array( 'post_content' => 'Page 0<!--nextpage-->Page 1<!--nextpage-->Page 2<!--nextpage-->Page 3' ) );
		setup_postdata( $post );

		$this->assertEquals( 1, $GLOBALS['multipage'] );
		$this->assertCount(  4, $GLOBALS['pages']     );
		$this->assertEquals( 4, $GLOBALS['numpages']  );
		$this->assertEquals( array( 'Page 0', 'Page 1', 'Page 2', 'Page 3' ), $GLOBALS['pages'] );
	}

	/**
	 * @ticket 24330
	 *
	 * setup_postdata( $a_post ) followed by the_content() in a loop that does not update
	 * global $post should use the content of $a_post rather then the global post.
	 */
	function test_setup_postdata_loop() {
		$post_id = $this->factory->post->create( array( 'post_content' => 'global post' ) );
		$GLOBALS['wp_query']->post = $GLOBALS['post'] = get_post( $post_id );

		$ids = $this->factory->post->create_many(5);
		foreach ( $ids as $id ) {
			$page = get_post( $id );
			if ( $page ) {
				setup_postdata( $page );
				$content = get_echo( 'the_content', array() );
				$this->assertEquals( $post_id, $GLOBALS['post']->ID );
				$this->assertNotEquals( '<p>global post</p>', strip_ws( $content ) );
				wp_reset_postdata();
			}
		}
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
}