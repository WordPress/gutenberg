<?php

/**
 * test the RSS 2.0 feed by generating a feed, parsing it, and checking that the
 * parsed contents match the contents of the posts stored in the database.  Since
 * we're using a real XML parser, this confirms that the feed is valid, well formed,
 * and contains the right stuff.
 *
 * @group feed
 */
class Tests_Feed_RSS2 extends WP_UnitTestCase {
	private $permalink_structure = '';

	static $user;
	static $posts;

	public static function setUpBeforeClass() {
		$factory = new WP_UnitTest_Factory();

		self::$user = $factory->user->create();
		self::$posts = $factory->post->create_many( 25, array(
			'post_author' => self::$user,
		) );

		self::commit_transaction();
	}

	public static function tearDownAfterClass() {
		if ( is_multisite() ) {
			wpmu_delete_user( self::$user );
		} else {
			wp_delete_user( self::$user );
		}

		foreach ( self::$posts as $post ) {
			wp_delete_post( $post, true );
		}

		self::commit_transaction();
	}

	public function setUp() {
		global $wp_rewrite;
		$this->permalink_structure = get_option( 'permalink_structure' );
		$wp_rewrite->set_permalink_structure( '' );
		$wp_rewrite->flush_rules();

		parent::setUp();

		$this->post_count = get_option('posts_per_rss');
		$this->excerpt_only = get_option('rss_use_excerpt');
		// this seems to break something
		update_option('use_smilies', false);
	}

	public function tearDown() {
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( $this->permalink_structure );
		$wp_rewrite->flush_rules();
	}

	function do_rss2() {
		ob_start();
		// nasty hack
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

	function test_rss() {
		$this->go_to( '/?feed=rss2' );
		$feed = $this->do_rss2();
		$xml = xml_to_array($feed);

		// get the rss element
		$rss = xml_find($xml, 'rss');

		// there should only be one rss element
		$this->assertEquals(1, count($rss));

		$this->assertEquals('2.0', $rss[0]['attributes']['version']);
		$this->assertEquals('http://purl.org/rss/1.0/modules/content/', $rss[0]['attributes']['xmlns:content']);
		$this->assertEquals('http://wellformedweb.org/CommentAPI/', $rss[0]['attributes']['xmlns:wfw']);
		$this->assertEquals('http://purl.org/dc/elements/1.1/', $rss[0]['attributes']['xmlns:dc']);

		// rss should have exactly one child element (channel)
		$this->assertEquals(1, count($rss[0]['child']));
	}

	function test_channel() {
		$this->go_to( '/?feed=rss2' );
		$feed = $this->do_rss2();
		$xml = xml_to_array($feed);

		// get the rss -> channel element
		$channel = xml_find($xml, 'rss', 'channel');

		$this->assertTrue(empty($channel[0]['attributes']));

		$title = xml_find($xml, 'rss', 'channel', 'title');
		$this->assertEquals(get_option('blogname'), $title[0]['content']);

		$desc = xml_find($xml, 'rss', 'channel', 'description');
		$this->assertEquals(get_option('blogdescription'), $desc[0]['content']);

		$link = xml_find($xml, 'rss', 'channel', 'link');
		$this->assertEquals(get_option('siteurl'), $link[0]['content']);

		$pubdate = xml_find($xml, 'rss', 'channel', 'lastBuildDate');
		$this->assertEquals(strtotime(get_lastpostmodified()), strtotime($pubdate[0]['content']));
	}

	/**
	 * @ticket UT32
	 */
	function test_items() {
		$this->go_to( '/?feed=rss2' );
		$feed = $this->do_rss2();
		$xml = xml_to_array($feed);

		// get all the rss -> channel -> item elements
		$items = xml_find($xml, 'rss', 'channel', 'item');
		$posts = get_posts('numberposts='.$this->post_count);

		// check each of the items against the known post data
		foreach ( $items as $key => $item ) {

			// Get post for comparison
			$guid = xml_find( $items[$key]['child'], 'guid' );
			preg_match( '/\?p=(\d+)/', $guid[0]['content'], $matches );
			$post = get_post( $matches[1] );

			// title
			$title = xml_find( $items[$key]['child'], 'title' );
			$this->assertEquals( $post->post_title, $title[0]['content'] );

			// link
			$link = xml_find( $items[$key]['child'], 'link' );
			$this->assertEquals( get_permalink( $post ), $link[0]['content'] );

			// comment link
			$comments_link = xml_find( $items[$key]['child'], 'comments' );
			$this->assertEquals( get_permalink( $post) . '#comments', $comments_link[0]['content'] );

			// pub date
			$pubdate = xml_find( $items[$key]['child'], 'pubDate' );
			$this->assertEquals( strtotime( $post->post_date_gmt ), strtotime( $pubdate[0]['content'] ) );

			// author
			$creator = xml_find( $items[$key]['child'], 'dc:creator' );
			$user = new WP_User( $post->post_author );
			$this->assertEquals( $user->user_login, $creator[0]['content'] );

			// categories (perhaps multiple)
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
			// should be the same number of categories
			$this->assertEquals( count( $cats ), count( $categories ) );

			// ..with the same names
			foreach ( $cats as $id => $cat ) {
				$this->assertEquals( $cat, $categories[$id]['content']);
			}

			// GUID
			$guid = xml_find( $items[$key]['child'], 'guid' );
			$this->assertEquals('false', $guid[0]['attributes']['isPermaLink'] );
			$this->assertEquals( $post->guid, $guid[0]['content'] );

			// description/excerpt
			if ( !empty( $post->post_excerpt ) ) {
				$description = xml_find( $items[$key]['child'], 'description' );
				$this->assertEquals( trim( $post->post_excerpt ), trim( $description[0]['content'] ) );
			}

			// post content
			if ( !$this->excerpt_only ) {
				$content = xml_find( $items[$key]['child'], 'content:encoded' );
				$this->assertEquals( trim( apply_filters( 'the_content', $post->post_content ) ), trim( $content[0]['content'] ) );
			}

			// comment rss
			$comment_rss = xml_find( $items[$key]['child'], 'wfw:commentRss' );
			$this->assertEquals( html_entity_decode( get_post_comments_feed_link( $post->ID) ), $comment_rss[0]['content'] );
		}
	}
}
