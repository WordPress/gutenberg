<?php

/**
 * Test the Atom feed by generating a feed, parsing it, and checking that the
 * parsed contents match the contents of the posts stored in the database.  Since
 * we're using a real XML parser, this confirms that the feed is valid, well formed,
 * and contains the right stuff.
 *
 * @group feed
 */
class Tests_Feeds_Atom extends WP_UnitTestCase {
	static $user_id;
	static $posts;
	static $category;

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
		self::$category = self::factory()->category->create_and_get( array(
			'name' => 'Test Category',
			'slug' => 'test-cat',
		) );

		$count = get_option( 'posts_per_rss' ) + 1;

		// Create a few posts
		self::$posts = $factory->post->create_many( $count, array(
			'post_author'  => self::$user_id,
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
	}

	/**
	 * This is a bit of a hack used to buffer feed content.
	 */
	function do_atom() {
		ob_start();
		// Nasty hack! In the future it would better to leverage do_feed( 'atom' ).
		global $post;
		try {
			@require( ABSPATH . 'wp-includes/feed-atom.php' );
			$out = ob_get_clean();
		} catch ( Exception $e ) {
			$out = ob_get_clean();
			throw( $e );
		}
		return $out;
	}

	/**
	 * Test the <feed> element to make sure its present and populated
	 * with the expected child elements and attributes.
	 */
	function test_feed_element() {
		$this->go_to( '/?feed=atom' );
		$feed = $this->do_atom();
		$xml = xml_to_array( $feed );

		// Get the <feed> child element of <xml>.
		$atom = xml_find( $xml, 'feed' );

		// There should only be one <feed> child element.
		$this->assertCount( 1, $atom );

		// Verify attributes.
		$this->assertEquals( 'http://www.w3.org/2005/Atom', $atom[0]['attributes']['xmlns'] );
		$this->assertEquals( 'http://purl.org/syndication/thread/1.0', $atom[0]['attributes']['xmlns:thr'] );
		$this->assertEquals( site_url( '/wp-atom.php' ) , $atom[0]['attributes']['xml:base'] );

		// Verify the <feed> element is present and contains a <title> child element.
		$title = xml_find( $xml, 'feed', 'title' );
		$this->assertEquals( get_option( 'blogname' ), $title[0]['content'] );

		// Verify the <feed> element is present and contains a <updated> child element.
		$updated = xml_find( $xml, 'feed', 'updated' );
		$this->assertEquals( strtotime( get_lastpostmodified() ), strtotime( $updated[0]['content'] ) );

		// Verify the <feed> element is present and contains a <subtitle> child element.
		$subtitle = xml_find( $xml, 'feed', 'subtitle' );
		$this->assertEquals( get_option( 'blogdescription' ), $subtitle[0]['content'] );

		// Verify the <feed> element is present and contains two <link> child elements.
		$link = xml_find( $xml, 'feed', 'link' );
		$this->assertCount( 2, $link );

		// Verify the <feed> element is present and contains a <link rel="alternate"> child element.
		$this->assertEquals( 'alternate', $link[0]['attributes']['rel'] );
		$this->assertEquals( home_url(), $link[0]['attributes']['href'] );

		// Verify the <feed> element is present and contains a <link rel="href"> child element.
		$this->assertEquals( 'self', $link[1]['attributes']['rel'] );
		$this->assertEquals( home_url( '/?feed=atom' ), $link[1]['attributes']['href'] );
	}

	/**
	 * Validate <entry> child elements.
	 */
	function test_entry_elements() {
		$this->go_to( '/?feed=atom' );
		$feed = $this->do_atom();
		$xml = xml_to_array( $feed );

		// Get all the <entry> child elements of the <feed> element.
		$entries = xml_find( $xml, 'feed', 'entry' );

		// Verify we are displaying the correct number of posts.
		$this->assertCount( $this->post_count, $entries );

		// We Really only need to test X number of entries unless the content is different
		$entries = array_slice( $entries, 1 );

		// Check each of the desired entries against the known post data.
		foreach ( $entries as $key => $entry ) {

			// Get post for comparison
			$id = xml_find( $entries[$key]['child'], 'id' );
			preg_match( '/\?p=(\d+)/', $id[0]['content'], $matches );
			$post = get_post( $matches[1] );

			// Author
			$author = xml_find( $entries[$key]['child'], 'author', 'name' );
			$user = new WP_User( $post->post_author );
			$this->assertEquals( $user->display_name, $author[0]['content'] );

			// Title
			$title = xml_find( $entries[$key]['child'], 'title' );
			$this->assertEquals( $post->post_title, $title[0]['content'] );

			// Link rel="alternate"
			$link_alts = xml_find( $entries[$key]['child'], 'link' );
			foreach ( $link_alts as $link_alt ) {
				if ( 'alternate' == $link_alt['attributes']['rel'] ) {
					$this->assertEquals( get_permalink( $post ), $link_alt['attributes']['href'] );
				}
			}

			// Id
			$guid = xml_find( $entries[$key]['child'], 'id' );
			$this->assertEquals( $post->guid, $id[0]['content'] );

			// Updated
			$updated = xml_find( $entries[$key]['child'], 'updated' );
			$this->assertEquals( strtotime( $post->post_modified_gmt ), strtotime( $updated[0]['content'] ) );

			// Published
			$published = xml_find( $entries[$key]['child'], 'published' );
			$this->assertEquals( strtotime( $post->post_date_gmt ), strtotime( $published[0]['content'] ) );

			// Category
			foreach ( get_the_category( $post->ID ) as $term ) {
				$terms[] = $term->name;
			}
			$categories = xml_find( $entries[$key]['child'], 'category' );
			foreach ( $categories as $category ) {
				$this->assertTrue( in_array( $category['attributes']['term'], $terms ) );
			}
			unset( $terms );

			// Content
			if ( ! $this->excerpt_only ) {
				$content = xml_find( $entries[$key]['child'], 'content' );
				$this->assertEquals( trim( apply_filters( 'the_content', $post->post_content ) ), trim( $content[0]['content'] ) );
			}

			// Link rel="replies"
			$link_replies = xml_find( $entries[$key]['child'], 'link' );
			foreach ( $link_replies as $link_reply ) {
				if ( 'replies' == $link_reply['attributes']['rel'] && 'application/atom+xml' == $link_reply['attributes']['type'] ) {
					$this->assertEquals( get_post_comments_feed_link( $post->ID, 'atom' ), $link_reply['attributes']['href'] );
				}
			}
		}
	}
}
