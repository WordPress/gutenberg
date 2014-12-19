<?php

/**
 * @group query
 * @covers ::setup_postdata
 */
class Tests_Query_SetupPostdata extends WP_UnitTestCase {
	protected $global_keys = array( 'id', 'authordata', 'currentday', 'currentmonth', 'page', 'pages', 'multipage', 'more', 'numpages' );

	protected $global_data = array();

	public function setUp() {
		parent::setUp();
		return;

		foreach ( $this->global_keys as $global_key ) {
			if ( isset( $GLOBALS[ $global_key ] ) ) {
				$this->global_data[ $global_key ] = $GLOBALS[ $global_key ];
				unset( $GLOBALS[ $global_key ] );
			} else {
				$this->global_data[ $global_key ] = null;
			}
		}
	}

	public function tearDown() {
		parent::tearDown();
		return;

		foreach ( $this->global_keys as $global_key ) {
			if ( ! is_null( $this->global_data[ $global_key ] ) ) {
				$GLOBALS[ $global_key ] = $this->global_data[ $global_key ];
			} else {
				unset( $GLOBALS[ $global_key ] );
			}
		}

		$this->global_data = array();
	}

	public function test_id() {
		$p = $this->factory->post->create_and_get();
		setup_postdata( $p );

		$this->assertNotEmpty( $p->ID );
		$this->assertSame( $p->ID, $GLOBALS['id'] );
	}

	public function test_authordata() {
		$u = $this->factory->user->create_and_get();
		$p = $this->factory->post->create_and_get( array(
			'post_author' => $u->ID,
		) );
		setup_postdata( $p );

		$this->assertNotEmpty( $GLOBALS['authordata'] );
		$this->assertEquals( $u, $GLOBALS['authordata'] );
	}

	public function test_currentday() {
		$p = $this->factory->post->create_and_get( array(
			'post_date' => '1980-09-09 06:30:00',
		) );
		setup_postdata( $p );

		$this->assertSame( '09.09.80', $GLOBALS['currentday'] );
	}

	public function test_currentmonth() {
		$p = $this->factory->post->create_and_get( array(
			'post_date' => '1980-09-09 06:30:00',
		) );
		setup_postdata( $p );

		$this->assertSame( '09', $GLOBALS['currentmonth'] );
	}

	public function test_secondary_query_post_vars() {
		$users = $this->factory->user->create_many( 2 );

		$post1 = $this->factory->post->create_and_get( array(
			'post_author' => $users[0],
			'post_date' => '2012-02-02 02:00:00',
		) );

		$post2 = $this->factory->post->create_and_get( array(
			'post_author' => $users[1],
			'post_date' => '2013-03-03 03:00:00',
		) );

		$this->go_to( get_permalink( $post1 ) );
		setup_postdata( $post1 );

		// Main loop.
		$this->assertSame( $post1->ID, $GLOBALS['id'] );
		$this->assertEquals( get_userdata( $users[0] ), $GLOBALS['authordata'] );
		$this->assertSame( '02.02.12', $GLOBALS['currentday'] );
		$this->assertSame( '02', $GLOBALS['currentmonth'] );

		// Secondary loop.
		$q = new WP_Query( array(
			'posts_per_page' => 1,
		) );
		if ( $q->have_posts() ) {
			while ( $q->have_posts() ) {
				$q->the_post();

				// Should refer to the current loop.
				$this->assertSame( $post2->ID, $GLOBALS['id'] );
				$this->assertEquals( get_userdata( $users[1] ), $GLOBALS['authordata'] );
				$this->assertSame( '03.03.13', $GLOBALS['currentday'] );
				$this->assertSame( '03', $GLOBALS['currentmonth'] );
			}
		}
		wp_reset_postdata();

		// Should be reset to main loop.
		$this->assertSame( $post1->ID, $GLOBALS['id'] );
		$this->assertEquals( get_userdata( $users[0] ), $GLOBALS['authordata'] );
		$this->assertSame( '02.02.12', $GLOBALS['currentday'] );
		$this->assertSame( '02', $GLOBALS['currentmonth'] );
	}

	public function test_single_page() {
		$post = $this->factory->post->create_and_get( array(
			'post_content' => 'Page 0',
		) );
		setup_postdata( $post );

		$this->assertSame( 0, $GLOBALS['multipage'] );
		$this->assertSame( 1, $GLOBALS['numpages']  );
		$this->assertEquals( array( 'Page 0' ), $GLOBALS['pages'] );
	}

	public function test_multi_page() {
		$post = $this->factory->post->create_and_get( array(
			'post_content' => 'Page 0<!--nextpage-->Page 1<!--nextpage-->Page 2<!--nextpage-->Page 3',
		) );
		setup_postdata( $post );

		$this->assertSame( 1, $GLOBALS['multipage'] );
		$this->assertSame( 4, $GLOBALS['numpages']  );
		$this->assertEquals( array( 'Page 0', 'Page 1', 'Page 2', 'Page 3' ), $GLOBALS['pages'] );
	}

	/**
	 * @ticket 16746
	 */
	public function test_nextpage_at_start_of_content() {
		$post = $this->factory->post->create_and_get( array(
			'post_content' => '<!--nextpage-->Page 1<!--nextpage-->Page 2<!--nextpage-->Page 3',
		) );
		setup_postdata( $post );

		$this->assertSame( 1, $GLOBALS['multipage'] );
		$this->assertSame( 3, $GLOBALS['numpages'] );
		$this->assertEquals( array( 'Page 1', 'Page 2', 'Page 3' ), $GLOBALS['pages'] );
	}

	public function test_trim_nextpage_linebreaks() {
		$post = $this->factory->post->create_and_get( array(
			'post_content' => "Page 0\n<!--nextpage-->\nPage 1\nhas a line break\n<!--nextpage-->Page 2<!--nextpage-->\n\nPage 3",
		) );
		setup_postdata( $post );

		$this->assertEquals( array( 'Page 0', "Page 1\nhas a line break", 'Page 2', "\nPage 3" ), $GLOBALS['pages'] );
	}

	/**
	 * @ticket 25349
	 */
	public function test_secondary_query_nextpage() {
		$post1 = $this->factory->post->create( array(
			'post_content' => 'Post 1 Page 1<!--nextpage-->Post 1 Page 2',
		) );
		$post2 = $this->factory->post->create( array(
			'post_content' => 'Post 2 Page 1<!--nextpage-->Post 2 Page 2',
		) );

		$this->go_to( '/?p=' . $post1 );
		setup_postdata( get_post( $post1 ) );

		// Main loop.
		$this->assertSame( array( 'Post 1 Page 1', 'Post 1 Page 2' ), $GLOBALS['pages'] );

		// Secondary loop.
		$q = new WP_Query( array(
			'post__in' => array( $post2 ),
		) );
		if ( $q->have_posts() ) {
			while ( $q->have_posts() ) {
				$q->the_post();

				// Should refer to the current loop.
				$this->assertSame( array( 'Post 2 Page 1', 'Post 2 Page 2' ), $GLOBALS['pages'] );
			}
		}
		wp_reset_postdata();

		// Should be reset to main loop.
		$this->assertSame( array( 'Post 1 Page 1', 'Post 1 Page 2' ), $GLOBALS['pages'] );
	}

	public function test_page_from_wp_query() {
		$page = $this->factory->post->create_and_get( array(
			'post_type' => 'page',
		) );

		$this->go_to( '/?page=78' );

		$GLOBALS['wp_query']->query_vars['page'] = 78;
		setup_postdata( $page );

		$this->assertSame( 78, $GLOBALS['page'] );
	}

	public function test_page_when_on_page() {
		$page = $this->factory->post->create_and_get( array(
			'post_type' => 'page',
		) );
		$this->go_to( get_permalink( $page ) );
		setup_postdata( $page );

		$this->assertSame( 1, $GLOBALS['page'] );
	}

	/**
	 * @ticket 20904
	 */
	public function test_secondary_query_page() {
		$post = $this->factory->post->create_and_get();
		$this->go_to( '/?page=3' );
		setup_postdata( $post );

		// Main loop.
		$this->assertSame( 3, $GLOBALS['page'] );

		// Secondary loop.
		$posts = $this->factory->post->create_many( 5 );
		$q = new WP_Query( array(
			'page' => 4,
			'posts_per_page' => 1,
		) );
		if ( $q->have_posts() ) {
			while ( $q->have_posts() ) {
				$q->the_post();

				// $page should refer to the current loop.
				$this->assertSame( 4, $GLOBALS['page'] );
			}
		}
		wp_reset_postdata();

		// $page should be reset to main loop.
		$this->assertSame( 3, $GLOBALS['page'] );
	}

	/**
	 * @ticket 20904
	 */
	public function test_more_when_on_setup_post() {
		$post = $this->factory->post->create_and_get();
		$this->go_to( get_permalink( $post ) );
		setup_postdata( $post );

		$this->assertSame( 1, $GLOBALS['more'] );
	}

	/**
	 * @ticket 20904
	 *
	 * $more should not be true when the set-up post is not the same as the current post.
	 */
	public function test_more_when_on_single() {
		$post1 = $this->factory->post->create_and_get();
		$post2 = $this->factory->post->create_and_get();
		$this->go_to( get_permalink( $post1 ) );
		setup_postdata( $post2 );

		$this->assertTrue( empty( $GLOBALS['more'] ) );
	}

	/**
	 * @ticket 20904
	 *
	 * $more should not be true when the set-up post is not the same as the current page.
	 */
	public function test_more_when_on_page() {
		$post = $this->factory->post->create_and_get();
		$page = $this->factory->post->create_and_get( array(
			'post_type' => 'page',
		) );
		$this->go_to( get_permalink( $page ) );
		setup_postdata( $post );

		$this->assertTrue( empty( $GLOBALS['more'] ) );
	}

	/**
	 * @ticket 20904
	 */
	public function test_more_when_on_feed() {
		$post = $this->factory->post->create_and_get();
		$this->go_to( '/?feed=rss' );
		setup_postdata( $post );

		$this->assertSame( 1, $GLOBALS['more'] );
	}

	/**
	 * @ticket 20904
	 * @ticket 25349
	 */
	public function test_secondary_query_more() {
		$post = $this->factory->post->create_and_get();
		$this->go_to( get_permalink( $post ) );
		setup_postdata( $post );

		// Main loop.
		$this->assertSame( 1, $GLOBALS['more'] );

		// Secondary loop.
		$q = new WP_Query( array(
			'posts_per_page' => 1,
		) );
		if ( $q->have_posts() ) {
			while ( $q->have_posts() ) {
				$q->the_post();

				// $more should refer to the current loop.
				$this->assertTrue( empty( $GLOBALS['more'] ) );
			}
		}
		wp_reset_postdata();

		// $page should be reset to main loop.
		$this->assertSame( 1, $GLOBALS['more'] );
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

}
