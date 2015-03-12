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

		set_current_screen( 'front' );

		update_option( 'comments_per_page', 5 );
		update_option( 'posts_per_page', 5 );

		global $wp_rewrite;

		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		create_initial_taxonomies();

		$wp_rewrite->flush_rules();
	}

	function tearDown() {
		global $wp_rewrite;
		$wp_rewrite->init();

		parent::tearDown();
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
		$term_id = $this->factory->term->create( array( 'name' => 'Tag Named A', 'slug' => 'tag-a', 'taxonomy' => 'post_tag' ) );
		$this->go_to('/tag/tag-a/');
		$this->assertQueryTrue('is_archive', 'is_tag');

		$tag = get_term( $term_id, 'post_tag' );

		$this->assertTrue( is_tag() );
		$this->assertTrue( is_tag( $tag->name ) );
		$this->assertTrue( is_tag( $tag->slug ) );
		$this->assertTrue( is_tag( $tag->term_id ) );
		$this->assertTrue( is_tag( array() ) );
		$this->assertTrue( is_tag( array( $tag->name ) ) );
		$this->assertTrue( is_tag( array( $tag->slug ) ) );
		$this->assertTrue( is_tag( array( $tag->term_id ) ) );
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

	/**
	 * @expectedIncorrectUsage WP_Date_Query
	 */
	function test_bad_dates() {
		$this->go_to( '/2013/13/13/' );
		$this->assertQueryTrue( 'is_404' );

		$this->go_to( '/2013/11/41/' );
		$this->assertQueryTrue( 'is_404' );
	}

	function test_post_type_archive_with_tax_query() {
		delete_option( 'rewrite_rules' );

		$cpt_name = 'ptawtq';
		register_post_type( $cpt_name, array(
			'taxonomies' => array( 'post_tag', 'category' ),
			'rewrite' => true,
			'has_archive' => true,
			'public' => true
		) );

		$tag_id = $this->factory->tag->create( array( 'slug' => 'tag-slug' ) );
		$post_id = $this->factory->post->create( array( 'post_type' => $cpt_name ) );
		wp_set_object_terms( $post_id, $tag_id, 'post_tag' );

		$this->go_to( '/ptawtq/' );
		$this->assertQueryTrue( 'is_post_type_archive', 'is_archive' );
		$this->assertEquals( get_queried_object(), get_post_type_object( $cpt_name ) );

		add_action( 'pre_get_posts', array( $this, 'pre_get_posts_with_tax_query' ) );

		$this->go_to( '/ptawtq/' );
		$this->assertQueryTrue( 'is_post_type_archive', 'is_archive' );
		$this->assertEquals( get_queried_object(), get_post_type_object( $cpt_name ) );

		remove_action( 'pre_get_posts', array( $this, 'pre_get_posts_with_tax_query' ) );
	}

	function pre_get_posts_with_tax_query( &$query ) {
		$term = get_term_by( 'slug', 'tag-slug', 'post_tag' );
		$query->set( 'tax_query', array(
			array( 'taxonomy' => 'post_tag', 'field' => 'term_id', 'terms' => $term->term_id )
		) );
	}

	function test_post_type_array() {
		delete_option( 'rewrite_rules' );

		$cpt_name = 'thearray';
		register_post_type( $cpt_name, array(
			'taxonomies' => array( 'post_tag', 'category' ),
			'rewrite' => true,
			'has_archive' => true,
			'public' => true
		) );
		$this->factory->post->create( array( 'post_type' => $cpt_name ) );

		$this->go_to( "/$cpt_name/" );
		$this->assertQueryTrue( 'is_post_type_archive', 'is_archive' );
		$this->assertEquals( get_queried_object(), get_post_type_object( $cpt_name ) );

		add_action( 'pre_get_posts', array( $this, 'pre_get_posts_with_type_array' ) );

		$this->go_to( "/$cpt_name/" );
		$this->assertQueryTrue( 'is_post_type_archive', 'is_archive' );
		$this->assertEquals( get_queried_object(), get_post_type_object( 'post' ) );

		remove_action( 'pre_get_posts', array( $this, 'pre_get_posts_with_type_array' ) );
	}

	function pre_get_posts_with_type_array( &$query ) {
		$query->set( 'post_type', array( 'post', 'thearray' ) );
	}

	function test_is_single() {
		$post_id = $this->factory->post->create();
		$this->go_to( "/?p=$post_id" );

		$post = get_queried_object();
		$q = $GLOBALS['wp_query'];

		$this->assertTrue( is_single() );
		$this->assertTrue( $q->is_single );
		$this->assertFalse( $q->is_page );
		$this->assertFalse( $q->is_attachment );
		$this->assertTrue( is_single( $post ) );
		$this->assertTrue( is_single( $post->ID ) );
		$this->assertTrue( is_single( $post->post_title ) );
		$this->assertTrue( is_single( $post->post_name ) );
	}

	/**
	 * @ticket 16802
	 */
	function test_is_single_with_parent() {
		// Use custom hierarchical post type
		$post_type = 'test_hierarchical';

		register_post_type( $post_type, array(
			'hierarchical' => true,
			'rewrite'      => true,
			'has_archive'  => true,
			'public'       => true
		) );

		// Create parent and child posts
		$parent_id = $this->factory->post->create( array(
			'post_type' => $post_type,
			'post_name' => 'foo'
		) );

		$post_id = $this->factory->post->create( array(
			'post_type'   => $post_type,
			'post_name'   => 'bar',
			'post_parent' => $parent_id
		) );

		// Tests
		$this->go_to( "/?p=$post_id&post_type=$post_type" );

		$post = get_queried_object();
		$q = $GLOBALS['wp_query'];

		$this->assertTrue( is_single() );
		$this->assertFalse( $q->is_page );
		$this->assertTrue( $q->is_single );
		$this->assertFalse( $q->is_attachment );
		$this->assertTrue( is_single( $post ) );
		$this->assertTrue( is_single( $post->ID ) );
		$this->assertTrue( is_single( $post->post_title ) );
		$this->assertTrue( is_single( $post->post_name ) );
		$this->assertTrue( is_single( 'foo/bar' ) );
		$this->assertFalse( is_single( $parent_id ) );
		$this->assertFalse( is_single( 'foo/bar/baz' ) );
		$this->assertFalse( is_single( 'bar/bar' ) );
		$this->assertFalse( is_single( 'foo' ) );
	}

	/**
	 * @ticket 24674
	 */
	public function test_is_single_with_slug_that_begins_with_a_number_that_clashes_with_another_post_id() {
		$p1 = $this->factory->post->create();

		$p2_name = $p1 . '-post';
		$p2 = $this->factory->post->create( array(
			'slug' => $p2_name,
		) );

		$this->go_to( "/?p=$p1" );

		$q = $GLOBALS['wp_query'];

		$this->assertTrue( $q->is_single() );
		$this->assertTrue( $q->is_single( $p1 ) );
		$this->assertFalse( $q->is_single( $p2_name ) );
		$this->assertFalse( $q->is_single( $p2 ) );
	}

	function test_is_page() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$this->go_to( "/?page_id=$post_id" );

		$post = get_queried_object();
		$q = $GLOBALS['wp_query'];

		$this->assertTrue( is_page() );
		$this->assertFalse( $q->is_single );
		$this->assertTrue( $q->is_page );
		$this->assertFalse( $q->is_attachment );
		$this->assertTrue( is_page( $post ) );
		$this->assertTrue( is_page( $post->ID ) );
		$this->assertTrue( is_page( $post->post_title ) );
		$this->assertTrue( is_page( $post->post_name ) );
	}

	/**
	 * @ticket 16802
	 */
	function test_is_page_with_parent() {
		$parent_id = $this->factory->post->create( array(
			'post_type' => 'page',
			'post_name' => 'foo',
		) );
		$post_id = $this->factory->post->create( array(
			'post_type'   => 'page',
			'post_name'   => 'bar',
			'post_parent' => $parent_id,
		) );
		$this->go_to( "/?page_id=$post_id" );

		$post = get_queried_object();
		$q = $GLOBALS['wp_query'];

		$this->assertTrue( is_page() );
		$this->assertFalse( $q->is_single );
		$this->assertTrue( $q->is_page );
		$this->assertFalse( $q->is_attachment );
		$this->assertTrue( is_page( $post ) );
		$this->assertTrue( is_page( $post->ID ) );
		$this->assertTrue( is_page( $post->post_title ) );
		$this->assertTrue( is_page( $post->post_name ) );
		$this->assertTrue( is_page( 'foo/bar' ) );
		$this->assertFalse( is_page( $parent_id ) );
		$this->assertFalse( is_page( 'foo/bar/baz' ) );
		$this->assertFalse( is_page( 'bar/bar' ) );
		$this->assertFalse( is_page( 'foo' ) );
	}

	function test_is_attachment() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'attachment' ) );
		$this->go_to( "/?attachment_id=$post_id" );

		$post = get_queried_object();
		$q = $GLOBALS['wp_query'];

		$this->assertTrue( is_attachment() );
		$this->assertTrue( is_single() );
		$this->assertTrue( $q->is_attachment );
		$this->assertTrue( $q->is_single );
		$this->assertFalse( $q->is_page );
		$this->assertTrue( is_attachment( $post ) );
		$this->assertTrue( is_attachment( $post->ID ) );
		$this->assertTrue( is_attachment( $post->post_title ) );
		$this->assertTrue( is_attachment( $post->post_name ) );
	}

	/**
	 * @ticket 24674
	 */
	public function test_is_attachment_with_slug_that_begins_with_a_number_that_clashes_with_a_page_ID() {
		$p1 = $this->factory->post->create( array( 'post_type' => 'attachment' ) );

		$p2_name = $p1 . '-attachment';
		$p2 = $this->factory->post->create( array(
			'post_type' => 'attachment',
			'post_name' => $p2_name,
		) );

		$this->go_to( "/?attachment_id=$p1" );

		$q = $GLOBALS['wp_query'];

		$this->assertTrue( $q->is_attachment() );
		$this->assertTrue( $q->is_attachment( $p1 ) );
		$this->assertFalse( $q->is_attachment( $p2_name ) );
		$this->assertFalse( $q->is_attachment( $p2 ) );
	}

	/**
	 * @ticket 24674
	 */
	public function test_is_author_with_nicename_that_begins_with_a_number_that_clashes_with_another_author_id() {
		$u1 = $this->factory->user->create();

		$u2_name = $u1 . '_user';
		$u2 = $this->factory->user->create( array(
			'user_nicename' => $u2_name,
		) );

		$this->go_to( "/?author=$u1" );

		$q = $GLOBALS['wp_query'];

		$this->assertTrue( $q->is_author() );
		$this->assertTrue( $q->is_author( $u1 ) );
		$this->assertFalse( $q->is_author( $u2_name ) );
		$this->assertFalse( $q->is_author( $u2 ) );
	}

	/**
	 * @ticket 24674
	 */
	public function test_is_category_with_slug_that_begins_with_a_number_that_clashes_with_another_category_id() {
		$c1 = $this->factory->category->create();

		$c2_name = $c1 . '-category';
		$c2 = $this->factory->category->create( array(
			'slug' => $c2_name,
		) );

		$this->go_to( "/?cat=$c1" );

		$q = $GLOBALS['wp_query'];

		$this->assertTrue( $q->is_category() );
		$this->assertTrue( $q->is_category( $c1 ) );
		$this->assertFalse( $q->is_category( $c2_name ) );
		$this->assertFalse( $q->is_category( $c2 ) );
	}

	/**
	 * @ticket 24674
	 */
	public function test_is_tag_with_slug_that_begins_with_a_number_that_clashes_with_another_tag_id() {
		$t1 = $this->factory->tag->create();

		$t2_name = $t1 . '-tag';
		$t2 = $this->factory->tag->create( array(
			'slug' => $t2_name,
		) );

		$this->go_to( "/?tag_id=$t1" );

		$q = $GLOBALS['wp_query'];

		$this->assertTrue( $q->is_tag() );
		$this->assertTrue( $q->is_tag( $t1 ) );
		$this->assertFalse( $q->is_tag( $t2_name ) );
		$this->assertFalse( $q->is_tag( $t2 ) );
	}

	/**
	 * @ticket 24674
	 */
	public function test_is_page_with_page_id_zero_and_random_page_slug() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$this->go_to( "/?page_id=$post_id" );

		// override post ID to 0 temporarily for testing
		$_id = $GLOBALS['wp_query']->post->ID;
		$GLOBALS['wp_query']->post->ID = 0;

		$post = get_queried_object();
		$q = $GLOBALS['wp_query'];

		$this->assertTrue( $q->is_page() );
		$this->assertFalse( $q->is_page( 'sample-page' ) );
		$this->assertFalse( $q->is_page( 'random-page-slug' ) );

		// revert $wp_query global change
		$GLOBALS['wp_query']->post->ID = $_id;
	}

	/**
	 * @ticket 24674
	 */
	public function test_is_page_with_page_slug_that_begins_with_a_number_that_clashes_with_a_page_ID() {
		$p1 = $this->factory->post->create( array( 'post_type' => 'page' ) );

		$p2_name = $p1 . '-page';
		$p2 = $this->factory->post->create( array(
			'post_type' => 'page',
			'post_name' => $p2_name,
		) );

		$this->go_to( "/?page_id=$p1" );

		$q = $GLOBALS['wp_query'];

		$this->assertTrue( $q->is_page() );
		$this->assertTrue( $q->is_page( $p1 ) );
		$this->assertFalse( $q->is_page( $p2_name ) );
		$this->assertFalse( $q->is_page( $p2 ) );
	}

	function test_is_page_template() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'page' ) );
		update_post_meta($post_id, '_wp_page_template', 'example.php');
		$this->go_to( "/?page_id=$post_id" );
		$this->assertTrue( is_page_template( 'example.php' ) );
	}

	/**
	 * @ticket 31271
	 */
	function test_is_page_template_default() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$this->go_to( "/?page_id=$post_id" );
		$this->assertTrue( is_page_template( 'default' ) );
		$this->assertTrue( is_page_template( array( 'random', 'default' ) ) );
	}

	/**
	 * @ticket 31271
	 */
	function test_is_page_template_array() {
		$post_id = $this->factory->post->create( array( 'post_type' => 'page' ) );
		update_post_meta($post_id, '_wp_page_template', 'example.php');
		$this->go_to( "/?page_id=$post_id" );
		$this->assertFalse( is_page_template( array( 'test.php' ) ) );
		$this->assertTrue( is_page_template( array('test.php', 'example.php') ) );
	}
}
