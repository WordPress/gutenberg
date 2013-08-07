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

	function setUp() {
		parent::setUp();

		$this->factory->post->create_many( 25 );

		$this->post_count = get_option('posts_per_rss');
		$this->excerpt_only = get_option('rss_use_excerpt');
		// this seems to break something
		update_option('use_smilies', false);
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
		$this->go_to('/feed/');
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
		$this->go_to('/feed/');
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
		$this->go_to('/feed/');
		$feed = $this->do_rss2();
		$xml = xml_to_array($feed);

		// get all the rss -> channel -> item elements
		$items = xml_find($xml, 'rss', 'channel', 'item');
		$posts = get_posts('numberposts='.$this->post_count);

		// check each of the items against the known post data
		for ($i=0; $i < $this->post_count; $i++) {

			// title
			$title = xml_find($items[$i]['child'], 'title');
			$this->assertEquals($posts[$i]->post_title, $title[0]['content']);

			// link
			$link = xml_find($items[$i]['child'], 'link');
			$this->assertEquals(get_permalink($posts[$i]->ID), $link[0]['content']);

			// comment link
			$comments_link = xml_find($items[$i]['child'], 'comments');
			$this->assertEquals(get_permalink($posts[$i]->ID) . '#comments', $comments_link[0]['content']);

			// pub date
			$pubdate = xml_find($items[$i]['child'], 'pubDate');
			$this->assertEquals(strtotime($posts[$i]->post_date), strtotime($pubdate[0]['content']));

			// author
			$creator = xml_find($items[$i]['child'], 'dc:creator');
			$this->assertEquals($this->author->user_nicename, $creator[0]['content']);

			// categories (perhaps multiple)
			$categories = xml_find($items[$i]['child'], 'category');
			$cat_ids = wp_get_post_categories($post->ID);
			if (empty($cat_ids))	$cat_ids = array(1);
			// should be the same number of categories
			$this->assertEquals(count($cat_ids), count($categories));
			// ..with the same names
			for ($j=0; $j < count($cat_ids); $j++)
				$this->assertEquals(get_cat_name($cat_ids[$j]), $categories[$j]['content']);

			// GUID
			$guid = xml_find($items[$i]['child'], 'guid');
			$this->assertEquals('false', $guid[0]['attributes']['isPermaLink']);
			$this->assertEquals($posts[$i]->guid, $guid[0]['content']);

			// description/excerpt
			$description = xml_find($items[$i]['child'], 'description');
			$this->assertEquals(trim($posts[$i]->post_excerpt), trim($description[0]['content']));

			// post content
			if (!$this->excerpt_only) {
				$content = xml_find($items[$i]['child'], 'content:encoded');
				$this->assertEquals(trim(apply_filters('the_content', $posts[$i]->post_content)), trim($content[0]['content']));
			}

			// comment rss
			$comment_rss = xml_find($items[$i]['child'], 'wfw:commentRss');
			$this->assertEquals(html_entity_decode(get_post_comments_feed_link($posts[$i]->ID)), $comment_rss[0]['content']);
		}

	}
}
