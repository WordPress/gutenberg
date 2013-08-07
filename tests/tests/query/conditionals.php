<?php

/**
 * Test the is_*() functions in query.php across the URL structure
 *
 * This exercises both query.php and rewrite.php: urls are fed through the rewrite code,
 * then we test the effects of each url on the wp_query object.
 *
 * @group query
 * @group rewrite
 */
class Tests_Query_Conditionals extends WP_UnitTestCase {

	protected $page_ids;
	protected $post_ids;

	function setUp() {
		parent::setUp();

		update_option( 'comments_per_page', 5 );
		update_option( 'posts_per_page', 5 );

		global $wp_rewrite;
		update_option( 'permalink_structure', '/%year%/%monthnum%/%day%/%postname%/' );
		create_initial_taxonomies();
		$GLOBALS['wp_rewrite']->init();
		flush_rewrite_rules();
	}

	function tearDown() {
		parent::tearDown();
		$GLOBALS['wp_rewrite']->init();
	}

	/**
	 * Check each of the WP_Query is_* functions/properties against expected boolean value.
	 *
	 * Any properties that are listed by name as parameters will be expected to be true; any others are
	 * expected to be false. For example, assertQueryTrue('is_single', 'is_feed') means is_single()
	 * and is_feed() must be true and everything else must be false to pass.
	 *
	 * @param string $prop,... Any number of WP_Query properties that are expected to be true for the current request.
	 */
	function assertQueryTrue(/* ... */) {
		global $wp_query;
		$all = array(
			'is_single', 'is_preview', 'is_page', 'is_archive', 'is_date', 'is_year', 'is_month', 'is_day', 'is_time',
			'is_author', 'is_category', 'is_tag', 'is_tax', 'is_search', 'is_feed', 'is_comment_feed', 'is_trackback',
			'is_home', 'is_404', 'is_comments_popup', 'is_paged', 'is_admin', 'is_attachment', 'is_singular', 'is_robots',
			'is_posts_page', 'is_post_type_archive',
		);
		$true = func_get_args();

		$passed = true;
		$not_false = $not_true = array(); // properties that were not set to expected values

		foreach ( $all as $query_thing ) {
			$result = is_callable( $query_thing ) ? call_user_func( $query_thing ) : $wp_query->$query_thing;

			if ( in_array( $query_thing, $true ) ) {
				if ( ! $result ) {
					array_push( $not_true, $query_thing );
					$passed = false;
				}
			} else if ( $result ) {
				array_push( $not_false, $query_thing );
				$passed = false;
			}
		}

		$message = '';
		if ( count($not_true) )
			$message .= implode( $not_true, ', ' ) . ' should be true. ';
		if ( count($not_false) )
			$message .= implode( $not_false, ', ' ) . ' should be false.';
		$this->assertTrue( $passed, $message );
	}

	function test_home() {
		$this->go_to('/');
		$this->assertQueryTrue('is_home');
	}

	function test_404() {
		$this->go_to('/'.rand_str());
		$this->assertQueryTrue('is_404');
	}

	function test_permalink() {
		$post_id = $this->factory->post->create( array( 'post_title' => 'hello-world' ) );
		$this->go_to( get_permalink( $post_id ) );
		$this->assertQueryTrue('is_single', 'is_singular');
	}

	function test_post_comments_feed() {
		$post_id = $this->factory->post->create( array( 'post_title' => 'hello-world' ) );
		$this->factory->comment->create_post_comments( $post_id, 2 );
		$this->go_to( get_post_comments_feed_link( $post_id ) );
		$this->assertQueryTrue('is_feed', 'is_single', 'is_singular', 'is_comment_feed');
	}


	function test_post_comments_feed_with_no_comments() {
		$post_id = $this->factory->post->create( array( 'post_title' => 'hello-world' ) );
		$this->go_to( get_post_comments_feed_link( $post_id ) );
		$this->assertQueryTrue('is_feed', 'is_single', 'is_singular', 'is_comment_feed');
	}

	function test_page() {
		$page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'about' ) );
		$this->go_to( get_permalink( $page_id ) );
		$this->assertQueryTrue('is_page','is_singular');
	}

	function test_parent_page() {
		$page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'parent-page' ) );
		$this->go_to( get_permalink( $page_id ) );

		$this->assertQueryTrue('is_page','is_singular');
	}

	function test_child_page_1() {
		$page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'parent-page' ) );
		$page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'child-page-1', 'post_parent' => $page_id ) );
		$this->go_to( get_permalink( $page_id ) );

		$this->assertQueryTrue('is_page','is_singular');
	}

	function test_child_page_2() {
		$page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'parent-page' ) );
		$page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'child-page-1', 'post_parent' => $page_id ) );
		$page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'child-page-2', 'post_parent' => $page_id ) );
		$this->go_to( get_permalink( $page_id ) );

		$this->assertQueryTrue('is_page','is_singular');
	}

	// '(about)/trackback/?$' => 'index.php?pagename=$matches[1]&tb=1'
	function test_page_trackback() {
		$page_ids = array();
		$page_ids[] = $page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'parent-page' ) );
		$page_ids[] = $page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'child-page-1', 'post_parent' => $page_id ) );
		$page_ids[] = $page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'child-page-2', 'post_parent' => $page_id ) );
		foreach ( $page_ids as $page_id ) {
			$url = get_permalink( $page_id );
			$this->go_to("{$url}trackback/");

			// make sure the correct wp_query flags are set
			$this->assertQueryTrue('is_page','is_singular','is_trackback');

			// make sure the correct page was fetched
			global $wp_query;
			$this->assertEquals( $page_id, $wp_query->get_queried_object()->ID );
		}
	}

	//'(about)/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?pagename=$matches[1]&feed=$matches[2]'
	function test_page_feed() {
		$page_ids = array();
		$page_ids[] = $page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'parent-page' ) );
		$page_ids[] = $page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'child-page-1', 'post_parent' => $page_id ) );
		$page_ids[] = $page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'child-page-2', 'post_parent' => $page_id ) );
		foreach ( $page_ids as $page_id ) {
			$this->factory->comment->create_post_comments( $page_id, 2 );
			$url = get_permalink( $page_id );
			$this->go_to("{$url}feed/");

			// make sure the correct wp_query flags are set
			$this->assertQueryTrue('is_page', 'is_singular', 'is_feed', 'is_comment_feed');

			// make sure the correct page was fetched
			global $wp_query;
			$this->assertEquals( $page_id, $wp_query->get_queried_object()->ID );
		}
	}

	function test_page_feed_with_no_comments() {
		$page_ids = array();
		$page_ids[] = $page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'parent-page' ) );
		$page_ids[] = $page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'child-page-1', 'post_parent' => $page_id ) );
		$page_ids[] = $page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'child-page-2', 'post_parent' => $page_id ) );
		foreach ( $page_ids as $page_id ) {
			$url = get_permalink( $page_id );
			$this->go_to("{$url}feed/");

			// make sure the correct wp_query flags are set
			$this->assertQueryTrue('is_page', 'is_singular', 'is_feed', 'is_comment_feed');

			// make sure the correct page was fetched
			global $wp_query;
			$this->assertEquals( $page_id, $wp_query->get_queried_object()->ID );
		}
	}

	// '(about)/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?pagename=$matches[1]&feed=$matches[2]'
	function test_page_feed_atom() {
		$page_ids = array();
		$page_ids[] = $page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'parent-page' ) );
		$page_ids[] = $page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'child-page-1', 'post_parent' => $page_id ) );
		$page_ids[] = $page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'child-page-2', 'post_parent' => $page_id ) );
		foreach ( $page_ids as $page_id ) {
			$this->factory->comment->create_post_comments( $page_id, 2 );

			$url = get_permalink( $page_id );
			$this->go_to("{$url}feed/atom/");

			// make sure the correct wp_query flags are set
			$this->assertQueryTrue('is_page', 'is_singular', 'is_feed', 'is_comment_feed');

			// make sure the correct page was fetched
			global $wp_query;
			$this->assertEquals( $page_id, $wp_query->get_queried_object()->ID );
		}
	}

	// '(about)/page/?([0-9]{1,})/?$' => 'index.php?pagename=$matches[1]&paged=$matches[2]'
	function test_page_page_2() {
		$page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'about', 'post_content' => 'Page 1 <!--nextpage--> Page 2' ) );
		$this->go_to("/about/page/2/");

		// make sure the correct wp_query flags are set
		$this->assertQueryTrue('is_page', 'is_singular', 'is_paged');

		// make sure the correct page was fetched
		global $wp_query;
		$this->assertEquals( $page_id, $wp_query->get_queried_object()->ID );
	}

	// '(about)/page/?([0-9]{1,})/?$' => 'index.php?pagename=$matches[1]&paged=$matches[2]'
	function test_page_page_2_no_slash() {
		$page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'about', 'post_content' => 'Page 1 <!--nextpage--> Page 2' ) );
		$this->go_to("/about/page2/");

		// make sure the correct wp_query flags are set
		$this->assertQueryTrue('is_page', 'is_singular', 'is_paged');

		// make sure the correct page was fetched
		global $wp_query;
		$this->assertEquals( $page_id, $wp_query->get_queried_object()->ID );
	}

	// FIXME: what is this for?
	// '(about)(/[0-9]+)?/?$' => 'index.php?pagename=$matches[1]&page=$matches[2]'
	function test_pagination_of_posts_page() {
		$page_id = $this->factory->post->create( array( 'post_type' => 'page', 'post_title' => 'about', 'post_content' => 'Page 1 <!--nextpage--> Page 2' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_for_posts', $page_id );

		$this->go_to('/about/2/');

		$this->assertQueryTrue( 'is_home', 'is_posts_page' );

		// make sure the correct page was fetched
		global $wp_query;
		$this->assertEquals( $page_id, $wp_query->get_queried_object()->ID );
	}

	// FIXME: no tests for these yet
	// 'about/attachment/([^/]+)/?$' => 'index.php?attachment=$matches[1]',
	// 'about/attachment/([^/]+)/trackback/?$' => 'index.php?attachment=$matches[1]&tb=1',
	// 'about/attachment/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?attachment=$matches[1]&feed=$matches[2]',
	// 'about/attachment/([^/]+)/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?attachment=$matches[1]&feed=$matches[2]',

	// 'feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?&feed=$matches[1]',
	// '(feed|rdf|rss|rss2|atom)/?$' => 'index.php?&feed=$matches[1]',
	function test_main_feed_2() {
		$this->factory->post->create(); // @test_404
		$feeds = array('feed', 'rdf', 'rss', 'rss2', 'atom');

		// long version
		foreach ($feeds as $feed) {
			$this->go_to("/feed/{$feed}/");
			$this->assertQueryTrue('is_feed');
		}

		// short version
		foreach ($feeds as $feed) {
			$this->go_to("/{$feed}/");
			$this->assertQueryTrue('is_feed');
		}

	}

	function test_main_feed() {
		$this->factory->post->create(); // @test_404
		$types = array('rss2', 'rss', 'atom');
		foreach ($types as $type) {
			$this->go_to(get_feed_link($type));
			$this->assertQueryTrue('is_feed');
		}
	}

	// 'page/?([0-9]{1,})/?$' => 'index.php?&paged=$matches[1]',
	function test_paged() {
		$this->factory->post->create_many( 15 );
		for ( $i = 2; $i <= 3; $i++ ) {
			$this->go_to("/page/{$i}/");
			$this->assertQueryTrue('is_home', 'is_paged');
		}
	}

	// 'comments/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?&feed=$matches[1]&withcomments=1',
	// 'comments/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?&feed=$matches[1]&withcomments=1',
	function test_main_comments_feed() {
		$post_id = $this->factory->post->create( array( 'post_title' => 'hello-world' ) );
		$this->factory->comment->create_post_comments( $post_id, 2 );

		// check the url as generated by get_post_comments_feed_link()
		$this->go_to( get_post_comments_feed_link( $post_id ) );
		$this->assertQueryTrue('is_feed', 'is_single', 'is_singular', 'is_comment_feed');

		// check the long form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/comments/feed/{$type}");
				$this->assertQueryTrue('is_feed', 'is_comment_feed');
		}

		// check the short form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/comments/{$type}");
				$this->assertQueryTrue('is_feed', 'is_comment_feed');
		}

	}

	// 'search/(.+)/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?s=$matches[1]&feed=$matches[2]',
	// 'search/(.+)/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?s=$matches[1]&feed=$matches[2]',
	function test_search_feed() {
		// check the long form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/search/test/feed/{$type}");
				$this->assertQueryTrue('is_feed', 'is_search');
		}

		// check the short form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/search/test/{$type}");
				$this->assertQueryTrue('is_feed', 'is_search');
		}
	}

	// 'search/(.+)/page/?([0-9]{1,})/?$' => 'index.php?s=$matches[1]&paged=$matches[2]',
	function test_search_paged() {
		$this->factory->post->create_many( 10, array( 'post_title' => 'test' ) );
		$this->go_to('/search/test/page/2/');
		$this->assertQueryTrue('is_search', 'is_paged');
	}

	// 'search/(.+)/?$' => 'index.php?s=$matches[1]',
	function test_search() {
		$this->go_to('/search/test/');
		$this->assertQueryTrue('is_search');
	}

	/**
	 * @ticket 13961
	 */
	function test_search_encoded_chars() {
		$this->go_to('/search/F%C3%BCnf%2Bbar/');
		$this->assertEquals( get_query_var( 's' ), 'Fünf+bar' );
	}

	// 'category/(.+?)/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?category_name=$matches[1]&feed=$matches[2]',
	// 'category/(.+?)/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?category_name=$matches[1]&feed=$matches[2]',
	function test_category_feed() {
		$this->factory->term->create( array( 'name' => 'cat-a', 'taxonomy' => 'category' ) );
		// check the long form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/category/cat-a/feed/{$type}");
				$this->assertQueryTrue('is_archive', 'is_feed', 'is_category');
		}

		// check the short form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/category/cat-a/{$type}");
				$this->assertQueryTrue('is_archive', 'is_feed', 'is_category');
		}
	}

	// 'category/(.+?)/page/?([0-9]{1,})/?$' => 'index.php?category_name=$matches[1]&paged=$matches[2]',
	function test_category_paged() {
		$this->factory->post->create_many( 10 );
		$this->go_to('/category/uncategorized/page/2/');
		$this->assertQueryTrue('is_archive', 'is_category', 'is_paged');
	}

	// 'category/(.+?)/?$' => 'index.php?category_name=$matches[1]',
	function test_category() {
		$this->factory->term->create( array( 'name' => 'cat-a', 'taxonomy' => 'category' ) );
		$this->go_to('/category/cat-a/');
		$this->assertQueryTrue('is_archive', 'is_category');
	}

	// 'tag/(.+?)/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?tag=$matches[1]&feed=$matches[2]',
	// 'tag/(.+?)/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?tag=$matches[1]&feed=$matches[2]',
	function test_tag_feed() {
		$this->factory->term->create( array( 'name' => 'tag-a', 'taxonomy' => 'post_tag' ) );
		// check the long form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/tag/tag-a/feed/{$type}");
				$this->assertQueryTrue('is_archive', 'is_feed', 'is_tag');
		}

		// check the short form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/tag/tag-a/{$type}");
				$this->assertQueryTrue('is_archive', 'is_feed', 'is_tag');
		}
	}

	// 'tag/(.+?)/page/?([0-9]{1,})/?$' => 'index.php?tag=$matches[1]&paged=$matches[2]',
	function test_tag_paged() {
		$post_ids = $this->factory->post->create_many( 10 );
		foreach ( $post_ids as $post_id )
			$this->factory->term->add_post_terms( $post_id, 'tag-a', 'post_tag' );
		$this->go_to('/tag/tag-a/page/2/');
		$this->assertQueryTrue('is_archive', 'is_tag', 'is_paged');
	}

	// 'tag/(.+?)/?$' => 'index.php?tag=$matches[1]',
	function test_tag() {
		$this->factory->term->create( array( 'name' => 'tag-a', 'taxonomy' => 'post_tag' ) );
		$this->go_to('/tag/tag-a/');
		$this->assertQueryTrue('is_archive', 'is_tag');
	}

	// 'author/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?author_name=$matches[1]&feed=$matches[2]',
	// 'author/([^/]+)/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?author_name=$matches[1]&feed=$matches[2]',
	function test_author_feed() {
		$this->factory->user->create( array( 'user_login' => 'user-a' ) );
		// check the long form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/author/user-a/feed/{$type}");
				$this->assertQueryTrue('is_archive', 'is_feed', 'is_author');
		}

		// check the short form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/author/user-a/{$type}");
				$this->assertQueryTrue('is_archive', 'is_feed', 'is_author');
		}
	}

	// 'author/([^/]+)/page/?([0-9]{1,})/?$' => 'index.php?author_name=$matches[1]&paged=$matches[2]',
	function test_author_paged() {
		$user_id = $this->factory->user->create( array( 'user_login' => 'user-a' ) );
		$this->factory->post->create_many( 10, array( 'post_author' => $user_id ) );
		$this->go_to('/author/user-a/page/2/');
		$this->assertQueryTrue('is_archive', 'is_author', 'is_paged');
	}

	// 'author/([^/]+)/?$' => 'index.php?author_name=$matches[1]',
	function test_author() {
		$user_id = $this->factory->user->create( array( 'user_login' => 'user-a' ) );
		$this->factory->post->create( array( 'post_author' => $user_id ) );
		$this->go_to('/author/user-a/');
		$this->assertQueryTrue('is_archive', 'is_author');
	}

	function test_author_with_no_posts() {
		$user_id = $this->factory->user->create( array( 'user_login' => 'user-a' ) );
		$this->go_to('/author/user-a/');
		$this->assertQueryTrue('is_archive', 'is_author');
	}

	// '([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&feed=$matches[4]',
	// '([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&feed=$matches[4]',
	function test_ymd_feed() {
		$this->factory->post->create( array( 'post_date' => '2007-09-04 00:00:00' ) );
		// check the long form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/2007/09/04/feed/{$type}");
				$this->assertQueryTrue('is_archive', 'is_feed', 'is_day', 'is_date');
		}

		// check the short form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/2007/09/04/{$type}");
				$this->assertQueryTrue('is_archive', 'is_feed', 'is_day', 'is_date');
		}
	}

	// '([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/page/?([0-9]{1,})/?$' => 'index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&paged=$matches[4]',
	function test_ymd_paged() {
		$this->factory->post->create_many( 10, array( 'post_date' => '2007-09-04 00:00:00' ) );
		$this->go_to('/2007/09/04/page/2/');
		$this->assertQueryTrue('is_archive', 'is_day', 'is_date', 'is_paged');
	}

	// '([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/?$' => 'index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]',
	function test_ymd() {
		$this->factory->post->create( array( 'post_date' => '2007-09-04 00:00:00' ) );
		$this->go_to('/2007/09/04/');
		$this->assertQueryTrue('is_archive', 'is_day', 'is_date');
	}

	// '([0-9]{4})/([0-9]{1,2})/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?year=$matches[1]&monthnum=$matches[2]&feed=$matches[3]',
	// '([0-9]{4})/([0-9]{1,2})/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?year=$matches[1]&monthnum=$matches[2]&feed=$matches[3]',
	function test_ym_feed() {
		$this->factory->post->create( array( 'post_date' => '2007-09-04 00:00:00' ) );
		// check the long form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/2007/09/feed/{$type}");
				$this->assertQueryTrue('is_archive', 'is_feed', 'is_month', 'is_date');
		}

		// check the short form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/2007/09/{$type}");
				$this->assertQueryTrue('is_archive', 'is_feed', 'is_month', 'is_date');
		}
	}

	// '([0-9]{4})/([0-9]{1,2})/page/?([0-9]{1,})/?$' => 'index.php?year=$matches[1]&monthnum=$matches[2]&paged=$matches[3]',
	function test_ym_paged() {
		$this->factory->post->create_many( 10, array( 'post_date' => '2007-09-04 00:00:00' ) );
		$this->go_to('/2007/09/page/2/');
		$this->assertQueryTrue('is_archive', 'is_date', 'is_month', 'is_paged');
	}

	// '([0-9]{4})/([0-9]{1,2})/?$' => 'index.php?year=$matches[1]&monthnum=$matches[2]',
	function test_ym() {
		$this->factory->post->create( array( 'post_date' => '2007-09-04 00:00:00' ) );
		$this->go_to('/2007/09/');
		$this->assertQueryTrue('is_archive', 'is_date', 'is_month');
	}

	// '([0-9]{4})/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?year=$matches[1]&feed=$matches[2]',
	// '([0-9]{4})/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?year=$matches[1]&feed=$matches[2]',
	function test_y_feed() {
		$this->factory->post->create( array( 'post_date' => '2007-09-04 00:00:00' ) );
		// check the long form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/2007/feed/{$type}");
				$this->assertQueryTrue('is_archive', 'is_feed', 'is_year', 'is_date');
		}

		// check the short form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("/2007/{$type}");
				$this->assertQueryTrue('is_archive', 'is_feed', 'is_year', 'is_date');
		}
	}

	// '([0-9]{4})/page/?([0-9]{1,})/?$' => 'index.php?year=$matches[1]&paged=$matches[2]',
	function test_y_paged() {
		$this->factory->post->create_many( 10, array( 'post_date' => '2007-09-04 00:00:00' ) );
		$this->go_to('/2007/page/2/');
		$this->assertQueryTrue('is_archive', 'is_date', 'is_year', 'is_paged');
	}

	// '([0-9]{4})/?$' => 'index.php?year=$matches[1]',
	function test_y() {
		$this->factory->post->create( array( 'post_date' => '2007-09-04 00:00:00' ) );
		$this->go_to('/2007/');
		$this->assertQueryTrue('is_archive', 'is_date', 'is_year');
	}

	// '([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/([^/]+)/trackback/?$' => 'index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&name=$matches[4]&tb=1',
	function test_post_trackback() {
		$post_id = $this->factory->post->create();
		$permalink = get_permalink( $post_id );
		$this->go_to("{$permalink}trackback/");
		$this->assertQueryTrue('is_single', 'is_singular', 'is_trackback');
	}

	// '([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&name=$matches[4]&feed=$matches[5]',
	// '([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/([^/]+)/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&name=$matches[4]&feed=$matches[5]',
	function test_post_comment_feed() {
		$post_id = $this->factory->post->create();
		$permalink = get_permalink( $post_id );

		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("{$permalink}feed/{$type}");
				$this->assertQueryTrue('is_single', 'is_singular', 'is_feed', 'is_comment_feed');
		}

		// check the short form
		$types = array('feed', 'rdf', 'rss', 'rss2', 'atom');
		foreach ($types as $type) {
				$this->go_to("{$permalink}{$type}");
				$this->assertQueryTrue('is_single', 'is_singular', 'is_feed', 'is_comment_feed');
		}
	}

	// '([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/([^/]+)(/[0-9]+)?/?$' => 'index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]&name=$matches[4]&page=$matches[5]',
	function test_post_paged_short() {
		$post_id = $this->factory->post->create( array(
			'post_date' => '2007-09-04 00:00:00',
			'post_title' => 'a-post-with-multiple-pages',
			'post_content' => 'Page 1 <!--nextpage--> Page 2'
		) );
		$this->go_to( get_permalink( $post_id ) . '2/' );
		// should is_paged be true also?
		$this->assertQueryTrue('is_single', 'is_singular');

	}

	// '[0-9]{4}/[0-9]{1,2}/[0-9]{1,2}/[^/]+/([^/]+)/?$' => 'index.php?attachment=$matches[1]',
	function test_post_attachment() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'attachment' ) );
		$permalink = get_attachment_link( $post_id );
		$this->go_to($permalink);
		$this->assertQueryTrue('is_single', 'is_attachment', 'is_singular');
	}

	// '[0-9]{4}/[0-9]{1,2}/[0-9]{1,2}/[^/]+/([^/]+)/trackback/?$' => 'index.php?attachment=$matches[1]&tb=1',
	// '[0-9]{4}/[0-9]{1,2}/[0-9]{1,2}/[^/]+/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?attachment=$matches[1]&feed=$matches[2]',
	// '[0-9]{4}/[0-9]{1,2}/[0-9]{1,2}/[^/]+/([^/]+)/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?attachment=$matches[1]&feed=$matches[2]',
	// '[0-9]{4}/[0-9]{1,2}/[0-9]{1,2}/[^/]+/attachment/([^/]+)/?$' => 'index.php?attachment=$matches[1]',
	// '[0-9]{4}/[0-9]{1,2}/[0-9]{1,2}/[^/]+/attachment/([^/]+)/trackback/?$' => 'index.php?attachment=$matches[1]&tb=1',
	// '[0-9]{4}/[0-9]{1,2}/[0-9]{1,2}/[^/]+/attachment/([^/]+)/feed/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?attachment=$matches[1]&feed=$matches[2]',
	// '[0-9]{4}/[0-9]{1,2}/[0-9]{1,2}/[^/]+/attachment/([^/]+)/(feed|rdf|rss|rss2|atom)/?$' => 'index.php?attachment=$matches[1]&feed=$matches[2]',
}
