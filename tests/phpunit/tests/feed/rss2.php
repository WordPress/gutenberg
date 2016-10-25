<?php

/**
 * Test the RSS 2.0 feed by generating a feed, parsing it, and checking that the
 * parsed contents match the contents of the posts stored in the database.  Since
 * we're using a real XML parser, this confirms that the feed is valid, well formed,
 * and contains the right stuff.
 *
 * @group feed
 */
class Tests_Feeds_RSS2 extends WP_UnitTestCase {
	static $user_id;
	static $posts;
	static $category;
	static $post_date;

	/**
	 * Setup a new user and attribute some posts.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		// Create a user
		self::$user_id = $factory->user->create( array(
			'role'         => 'author',
			'user_login'   => 'test_author',
			'display_name' => 'Test A. Uthor',
		) );

		// Create a taxonomy
		self::$category = $factory->category->create_and_get( array(
			'name' => 'Foo Category',
			'slug' => 'foo',
		) );

		// Set a predictable time for testing date archives.
		self::$post_date = '2003-05-27 10:07:53';

		$count = get_option( 'posts_per_rss' ) + 1;

		// Create a few posts
		self::$posts = $factory->post->create_many( $count, array(
			'post_author'  => self::$user_id,
			'post_date'    => self::$post_date,
			'post_content' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec velit massa, ultrices eu est suscipit, mattis posuere est. Donec vitae purus lacus. Cras vitae odio odio.',
			'post_excerpt' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		) );

		// Assign a category to those posts
		foreach ( self::$posts as $post ) {
			wp_set_object_terms( $post, self::$category->slug, 'category' );
		}
	}

	/**
	 * Setup.
	 */
	public function setUp() {
		parent::setUp();

		$this->post_count = (int) get_option( 'posts_per_rss' );
		$this->excerpt_only = get_option( 'rss_use_excerpt' );
		// this seems to break something
		update_option( 'use_smilies', false );

		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		create_initial_taxonomies();
	}

	/**
	 * This is a bit of a hack used to buffer feed content.
	 */
	function do_rss2() {
		ob_start();
		// Nasty hack! In the future it would better to leverage do_feed( 'rss2' ).
		global $post;
		try {
			@require(ABSPATH . 'wp-includes/feed-rss2.php');
			$out = ob_get_clean();
		} catch (Exception $e) {
			$out = ob_get_clean();
			throw($e);
		}
		return $out;
	}

	/**
	 * Test the <rss> element to make sure its present and populated
	 * with the expected child elements and attributes.
	 */
	function test_rss_element() {
		$this->go_to( '/?feed=rss2' );
		$feed = $this->do_rss2();
		$xml = xml_to_array( $feed );

		// Get the <rss> child element of <xml>.
		$rss = xml_find( $xml, 'rss' );

		// There should only be one <rss> child element.
		$this->assertEquals( 1, count( $rss ) );

		$this->assertEquals( '2.0', $rss[0]['attributes']['version'] );
		$this->assertEquals( 'http://purl.org/rss/1.0/modules/content/', $rss[0]['attributes']['xmlns:content'] );
		$this->assertEquals( 'http://wellformedweb.org/CommentAPI/', $rss[0]['attributes']['xmlns:wfw'] );
		$this->assertEquals( 'http://purl.org/dc/elements/1.1/', $rss[0]['attributes']['xmlns:dc'] );

		// rss should have exactly one child element (channel)
		$this->assertEquals( 1, count( $rss[0]['child'] ) );
	}

	/**
	 * [test_channel_element description]
	 * @return [type] [description]
	 */
	function test_channel_element() {
		$this->go_to( '/?feed=rss2' );
		$feed = $this->do_rss2();
		$xml = xml_to_array( $feed );

		// get the rss -> channel element
		$channel = xml_find( $xml, 'rss', 'channel' );

		// The channel should be free of attributes
		$this->assertTrue( empty( $channel[0]['attributes'] ) );

		// Verify the channel is present and contains a title child element
		$title = xml_find( $xml, 'rss', 'channel', 'title' );
		$this->assertEquals( get_option( 'blogname' ), $title[0]['content'] );

		$desc = xml_find( $xml, 'rss', 'channel', 'description' );
		$this->assertEquals( get_option( 'blogdescription' ), $desc[0]['content'] );

		$link = xml_find( $xml, 'rss', 'channel', 'link' );
		$this->assertEquals( get_option( 'siteurl' ), $link[0]['content'] );

		$pubdate = xml_find( $xml, 'rss', 'channel', 'lastBuildDate' );
		$this->assertEquals( strtotime( get_lastpostmodified() ), strtotime( $pubdate[0]['content'] ) );
	}

	/**
	 * @ticket UT32
	 */
	function test_item_elements() {
		$this->go_to( '/?feed=rss2' );
		$feed = $this->do_rss2();
		$xml = xml_to_array( $feed );

		// Get all the <item> child elements of the <channel> element
		$items = xml_find( $xml, 'rss', 'channel', 'item' );

		// Verify we are displaying the correct number of posts.
		$this->assertCount( $this->post_count, $items );

		// We Really only need to test X number of items unless the content is different
		$items = array_slice( $items, 1 );

		// Check each of the desired entries against the known post data
		foreach ( $items as $key => $item ) {

			// Get post for comparison
			$guid = xml_find( $items[$key]['child'], 'guid' );
			preg_match( '/\?p=(\d+)/', $guid[0]['content'], $matches );
			$post = get_post( $matches[1] );

			// Title
			$title = xml_find( $items[$key]['child'], 'title' );
			$this->assertEquals( $post->post_title, $title[0]['content'] );

			// Link
			$link = xml_find( $items[$key]['child'], 'link' );
			$this->assertEquals( get_permalink( $post ), $link[0]['content'] );

			// Comment link
			$comments_link = xml_find( $items[$key]['child'], 'comments' );
			$this->assertEquals( get_permalink( $post ) . '#respond', $comments_link[0]['content'] );

			// Pub date
			$pubdate = xml_find( $items[$key]['child'], 'pubDate' );
			$this->assertEquals( strtotime( $post->post_date_gmt ), strtotime( $pubdate[0]['content'] ) );

			// Author
			$creator = xml_find( $items[$key]['child'], 'dc:creator' );
			$user = new WP_User( $post->post_author );
			$this->assertEquals( $user->display_name, $creator[0]['content'] );

			// Categories (perhaps multiple)
			$categories = xml_find( $items[$key]['child'], 'category' );
			$cats = array();
			foreach ( get_the_category( $post->ID ) as $term ) {
				$cats[] = $term->name;
			}

			$tags = get_the_tags( $post->ID );
			if ( $tags ) {
				foreach ( get_the_tags( $post->ID ) as $term ) {
					$cats[] = $term->name;
				}
			}
			$cats = array_filter( $cats );
			// Should be the same number of categories
			$this->assertEquals( count( $cats ), count( $categories ) );

			// ..with the same names
			foreach ( $cats as $id => $cat ) {
				$this->assertEquals( $cat, $categories[$id]['content'] );
			}

			// GUID
			$guid = xml_find( $items[$key]['child'], 'guid' );
			$this->assertEquals( 'false', $guid[0]['attributes']['isPermaLink'] );
			$this->assertEquals( $post->guid, $guid[0]['content'] );

			// Description / Excerpt
			if ( ! empty( $post->post_excerpt ) ) {
				$description = xml_find( $items[$key]['child'], 'description' );
				$this->assertEquals( trim( $post->post_excerpt ), trim( $description[0]['content'] ) );
			}

			// Post content
			if ( ! $this->excerpt_only ) {
				$content = xml_find( $items[$key]['child'], 'content:encoded' );
				$this->assertEquals( trim( apply_filters( 'the_content', $post->post_content ) ), trim( $content[0]['content'] ) );
			}

			// Comment rss
			$comment_rss = xml_find( $items[$key]['child'], 'wfw:commentRss' );
			$this->assertEquals( html_entity_decode( get_post_comments_feed_link( $post->ID ) ), $comment_rss[0]['content'] );
		}
	}

	/**
	 * @ticket 9134
	 */
	function test_items_comments_closed() {
		add_filter( 'comments_open', '__return_false' );

		$this->go_to( '/?feed=rss2' );
		$feed = $this->do_rss2();
		$xml = xml_to_array( $feed );

		// get all the rss -> channel -> item elements
		$items = xml_find( $xml, 'rss', 'channel', 'item' );

		// check each of the items against the known post data
		foreach ( $items as $key => $item ) {
			// Get post for comparison
			$guid = xml_find( $items[$key]['child'], 'guid' );
			preg_match( '/\?p=(\d+)/', $guid[0]['content'], $matches );
			$post = get_post( $matches[1] );

			// comment link
			$comments_link = xml_find( $items[ $key ]['child'], 'comments' );
			$this->assertEmpty( $comments_link );

			// comment rss
			$comment_rss = xml_find( $items[ $key ]['child'], 'wfw:commentRss' );
			$this->assertEmpty( $comment_rss );
		}

		remove_filter( 'comments_open', '__return_false' );
	}

	/*
	 * Check to make sure we are rendering feed templates for the home feed.
	 * e.g. https://example.com/feed/
	 *
	 * @ticket 30210
	 */
	function test_valid_home_feed_endpoint() {
		// An example of a valid home feed endpoint.
		$this->go_to( 'feed/' );

		// Verify the query object is a feed.
		$this->assertQueryTrue( 'is_feed' );

		// Queries performed on valid feed endpoints should contain posts.
		$this->assertTrue( have_posts() );

		// Check to see if we have the expected XML output from the feed template.
		$feed = $this->do_rss2();

		$xml = xml_to_array( $feed );

		// Get the <rss> child element of <xml>.
		$rss = xml_find( $xml, 'rss' );

		// There should only be one <rss> child element.
		$this->assertEquals( 1, count( $rss ) );
	}

	/*
	 * Check to make sure we are rendering feed templates for the taxonomy feeds.
	 * e.g. https://example.com/category/foo/feed/
	 *
	 * @ticket 30210
	 */
	function test_valid_taxonomy_feed_endpoint() {
		// An example of an valid taxonomy feed endpoint.
		$this->go_to( 'category/foo/feed/' );

		// Verify the query object is a feed.
		$this->assertQueryTrue( 'is_feed', 'is_archive', 'is_category' );

		// Queries performed on valid feed endpoints should contain posts.
		$this->assertTrue( have_posts() );

		// Check to see if we have the expected XML output from the feed template.
		$feed = $this->do_rss2();

		$xml = xml_to_array( $feed );

		// Get the <rss> child element of <xml>.
		$rss = xml_find( $xml, 'rss' );

		// There should only be one <rss> child element.
		$this->assertEquals( 1, count( $rss ) );
	}

	/*
	 * Check to make sure we are rendering feed templates for the main comment feed.
	 * e.g. https://example.com/comments/feed/
	 *
	 * @ticket 30210
	 */
	function test_valid_main_comment_feed_endpoint() {
		// Generate a bunch of comments
		foreach ( self::$posts as $post ) {
			self::factory()->comment->create_post_comments( $post, 3 );
		}

		// An example of an valid main comment feed endpoint.
		$this->go_to( 'comments/feed/' );

		// Verify the query object is a feed.
		$this->assertQueryTrue( 'is_feed', 'is_comment_feed' );

		// Queries performed on valid feed endpoints should contain comments.
		$this->assertTrue( have_comments() );

		// Check to see if we have the expected XML output from the feed template.
		$feed = $this->do_rss2();

		$xml = xml_to_array( $feed );

		// Get the <rss> child element of <xml>.
		$rss = xml_find( $xml, 'rss' );

		// There should only be one <rss> child element.
		$this->assertEquals( 1, count( $rss ) );
	}

	/*
	 * Check to make sure we are rendering feed templates for the date archive feeds.
	 * e.g. https://example.com/2003/05/27/feed/
	 *
	 * @ticket 30210
	 */
	function test_valid_archive_feed_endpoint() {
		// An example of an valid date archive feed endpoint.
		$this->go_to( '2003/05/27/feed/' );

		// Verify the query object is a feed.
		$this->assertQueryTrue( 'is_feed', 'is_archive', 'is_day', 'is_date' );

		// Queries performed on valid feed endpoints should contain posts.
		$this->assertTrue( have_posts() );

		// Check to see if we have the expected XML output from the feed template.
		$feed = $this->do_rss2();

		$xml = xml_to_array( $feed );

		// Get the <rss> child element of <xml>.
		$rss = xml_find( $xml, 'rss' );

		// There should only be one <rss> child element.
		$this->assertEquals( 1, count( $rss ) );
	}

	/*
	 * Check to make sure we are rendering feed templates for single post comment feeds.
	 * e.g. https://example.com/2003/05/27/post-name/feed/
	 *
	 * @ticket 30210
	 */
	function test_valid_single_post_comment_feed_endpoint() {
		// An example of an valid date archive feed endpoint.
		$this->go_to( get_post_comments_feed_link( self::$posts[0] ) );

		// Verify the query object is a feed.
		$this->assertQueryTrue( 'is_feed', 'is_comment_feed', 'is_single', 'is_singular' );

		// Queries performed on valid feed endpoints should contain posts.
		$this->assertTrue( have_posts() );

		// Check to see if we have the expected XML output from the feed template.
		$feed = $this->do_rss2();

		$xml = xml_to_array( $feed );

		// Get the <rss> child element of <xml>.
		$rss = xml_find( $xml, 'rss' );

		// There should only be one <rss> child element.
		$this->assertEquals( 1, count( $rss ) );
	}

	/*
	 * Check to make sure we are rendering feed templates for the search archive feeds.
	 * e.g. https://example.com/?s=Lorem&feed=rss
	 *
	 * @ticket 30210
	 */
	function test_valid_search_feed_endpoint() {
		// An example of an valid search feed endpoint
		$this->go_to( '?s=Lorem&feed=rss' );

		// Verify the query object is a feed.
		$this->assertQueryTrue( 'is_feed', 'is_search' );

		// Queries performed on valid feed endpoints should contain posts.
		$this->assertTrue( have_posts() );

		// Check to see if we have the expected XML output from the feed template.
		$feed = $this->do_rss2();

		$xml = xml_to_array( $feed );

		// Get the <rss> child element of <xml>.
		$rss = xml_find( $xml, 'rss' );

		// There should only be one <rss> child element.
		$this->assertEquals( 1, count( $rss ) );
	}

	/*
	 * Check to make sure we are not rendering feed templates for invalid feed endpoints.
	 * e.g. https://example.com/wp-content/feed/
	 *
	 * @ticket 30210
	 */
	function test_invalid_feed_endpoint() {
		// An example of an invalid feed endpoint
		$this->go_to( 'wp-content/feed/' );

		// Queries performed on invalid feed endpoints should never contain posts.
		$this->assertFalse( have_posts() );

		// This is the assertion. Once the exception is thrown in do_feed, execution stops, preventing futher assertions.
		$this->setExpectedException( 'WPDieException', 'ERROR: This is not a valid feed.' );
		do_feed();
	}

	/*
	 * Make sure the requested feed is registered before rendering the requested template.
	 *
	 * @ticket 30210
	 */
	function test_nonexistent_feeds() {
		global $wp_rewrite;
		$badfeed = 'badfeed';

		$this->assertNotContains( $badfeed, $wp_rewrite->feeds );

		$this->go_to( '/?feed=' . $badfeed );

		// This is the assertion. Once the exception is thrown in do_feed, execution stops, preventing futher assertions.
		$this->setExpectedException( 'WPDieException', 'ERROR: This is not a valid feed template.' );
		do_feed();
	}

}
