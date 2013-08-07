<?php

/**
 *
 * Test various query vars and make sure the WP_Query class selects the correct posts.
 * We're testing against a known data set, so we can check that specific posts are included in the output.
 *
 * @group query
 */
class Tests_Query_Results extends WP_UnitTestCase {
	protected $q;

	function setUp() {
		parent::setUp();

		$cat_a = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'cat-a' ) );
		$cat_b = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'cat-b' ) );
		$cat_c = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'cat-c' ) );

		$this->factory->post->create( array( 'post_title' => 'tag-נ', 'tags_input' => array( 'tag-נ' ), 'post_date' => '2008-11-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'cats-a-b-c', 'post_date' => '2008-12-01 00:00:00', 'post_category' => array( $cat_a, $cat_b, $cat_c ) ) );
		$this->factory->post->create( array( 'post_title' => 'cats-a-and-b', 'post_date' => '2009-01-01 00:00:00', 'post_category' => array( $cat_a, $cat_b ) ) );
		$this->factory->post->create( array( 'post_title' => 'cats-b-and-c', 'post_date' => '2009-02-01 00:00:00', 'post_category' => array( $cat_b, $cat_c ) ) );
		$this->factory->post->create( array( 'post_title' => 'cats-a-and-c', 'post_date' => '2009-03-01 00:00:00', 'post_category' => array( $cat_a, $cat_c ) ) );
		$this->factory->post->create( array( 'post_title' => 'cat-a', 'post_date' => '2009-04-01 00:00:00', 'post_category' => array( $cat_a ) ) );
		$this->factory->post->create( array( 'post_title' => 'cat-b', 'post_date' => '2009-05-01 00:00:00', 'post_category' => array( $cat_b ) ) );
		$this->factory->post->create( array( 'post_title' => 'cat-c', 'post_date' => '2009-06-01 00:00:00', 'post_category' => array( $cat_c ) ) );
		$this->factory->post->create( array( 'post_title' => 'lorem-ipsum', 'post_date' => '2009-07-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'comment-test', 'post_date' => '2009-08-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'one-trackback', 'post_date' => '2009-09-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'many-trackbacks', 'post_date' => '2009-10-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'no-comments', 'post_date' => '2009-10-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'one-comment', 'post_date' => '2009-11-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'contributor-post-approved', 'post_date' => '2009-12-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'embedded-video', 'post_date' => '2010-01-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'simple-markup-test', 'post_date' => '2010-02-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'raw-html-code', 'post_date' => '2010-03-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'tags-a-b-c', 'tags_input' => array( 'tag-a', 'tag-b', 'tag-c' ), 'post_date' => '2010-04-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'tag-a', 'tags_input' => array( 'tag-a' ), 'post_date' => '2010-05-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'tag-b', 'tags_input' => array( 'tag-b' ), 'post_date' => '2010-06-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'tag-c', 'tags_input' => array( 'tag-c' ), 'post_date' => '2010-07-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'tags-a-and-b', 'tags_input' => array( 'tag-a', 'tag-b' ), 'post_date' => '2010-08-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'tags-b-and-c', 'tags_input' => array( 'tag-b', 'tag-c' ), 'post_date' => '2010-09-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'tags-a-and-c', 'tags_input' => array( 'tag-a', 'tag-c' ), 'post_date' => '2010-10-01 00:00:00' ) );

		$this->parent_one = $this->factory->post->create( array( 'post_title' => 'parent-one', 'post_date' => '2007-01-01 00:00:00' ) );
		$this->parent_two = $this->factory->post->create( array( 'post_title' => 'parent-two', 'post_date' => '2007-01-01 00:00:00' ) );
		$this->parent_three = $this->factory->post->create( array( 'post_title' => 'parent-three', 'post_date' => '2007-01-01 00:00:00' ) );
		$this->factory->post->create( array( 'post_title' => 'child-one', 'post_parent' => $this->parent_one, 'post_date' => '2007-01-01 00:00:01' ) );
		$this->factory->post->create( array( 'post_title' => 'child-two', 'post_parent' => $this->parent_one, 'post_date' => '2007-01-01 00:00:02' ) );
		$this->factory->post->create( array( 'post_title' => 'child-three', 'post_parent' => $this->parent_two, 'post_date' => '2007-01-01 00:00:03' ) );
		$this->factory->post->create( array( 'post_title' => 'child-four', 'post_parent' => $this->parent_two, 'post_date' => '2007-01-01 00:00:04' ) );

		unset( $this->q );
		$this->q = new WP_Query();
	}

	function test_query_default() {
		$posts = $this->q->query('');

		// the output should be the most recent 10 posts as listed here
		$expected = array(
			0 => 'tags-a-and-c',
			1 => 'tags-b-and-c',
			2 => 'tags-a-and-b',
			3 => 'tag-c',
			4 => 'tag-b',
			5 => 'tag-a',
			6 => 'tags-a-b-c',
			7 => 'raw-html-code',
			8 => 'simple-markup-test',
			9 => 'embedded-video',
		);

		$this->assertEquals( $expected, wp_list_pluck( $posts, 'post_name' ) );
	}

	function test_query_tag_a() {
		$posts = $this->q->query('tag=tag-a');

		// there are 4 posts with Tag A
		$this->assertCount( 4, $posts );
		$this->assertEquals( 'tags-a-and-c', $posts[0]->post_name );
		$this->assertEquals( 'tags-a-and-b', $posts[1]->post_name );
		$this->assertEquals( 'tag-a', $posts[2]->post_name );
		$this->assertEquals( 'tags-a-b-c', $posts[3]->post_name );
	}

	function test_query_tag_b() {
		$posts = $this->q->query('tag=tag-b');

		// there are 4 posts with Tag A
		$this->assertCount( 4, $posts );
		$this->assertEquals( 'tags-b-and-c', $posts[0]->post_name );
		$this->assertEquals( 'tags-a-and-b', $posts[1]->post_name );
		$this->assertEquals( 'tag-b', $posts[2]->post_name );
		$this->assertEquals( 'tags-a-b-c', $posts[3]->post_name );
	}

	/**
	 * @ticket 21779
	 */
	function test_query_tag_nun() {
		$posts = $this->q->query('tag=tag-נ');

		// there is 1 post with Tag נ
		$this->assertCount( 1, $posts );
		$this->assertEquals( 'tag-%d7%a0', $posts[0]->post_name );
	}

	function test_query_tag_id() {
		$tag = tag_exists('tag-a');
		$posts = $this->q->query("tag_id={$tag[term_id]}");

		// there are 4 posts with Tag A
		$this->assertCount( 4, $posts );
		$this->assertEquals( 'tags-a-and-c', $posts[0]->post_name );
		$this->assertEquals( 'tags-a-and-b', $posts[1]->post_name );
		$this->assertEquals( 'tag-a', $posts[2]->post_name );
		$this->assertEquals( 'tags-a-b-c', $posts[3]->post_name );
	}

	function test_query_tag_slug__in() {
		$posts = $this->q->query("tag_slug__in[]=tag-b&tag_slug__in[]=tag-c");

		// there are 4 posts with either Tag B or Tag C
		$this->assertCount( 6, $posts );
		$this->assertEquals( 'tags-a-and-c', $posts[0]->post_name );
		$this->assertEquals( 'tags-b-and-c', $posts[1]->post_name );
		$this->assertEquals( 'tags-a-and-b', $posts[2]->post_name );
		$this->assertEquals( 'tag-c', $posts[3]->post_name );
		$this->assertEquals( 'tag-b', $posts[4]->post_name );
		$this->assertEquals( 'tags-a-b-c', $posts[5]->post_name );
	}


	function test_query_tag__in() {
		$tag_a = tag_exists('tag-a');
		$tag_b = tag_exists('tag-b');
		$posts = $this->q->query("tag__in[]={$tag_a[term_id]}&tag__in[]={$tag_b[term_id]}");

		// there are 6 posts with either Tag A or Tag B
		$this->assertCount( 6, $posts );
		$this->assertEquals( 'tags-a-and-c', $posts[0]->post_name );
		$this->assertEquals( 'tags-b-and-c', $posts[1]->post_name );
		$this->assertEquals( 'tags-a-and-b', $posts[2]->post_name );
		$this->assertEquals( 'tag-b', $posts[3]->post_name );
		$this->assertEquals( 'tag-a', $posts[4]->post_name );
		$this->assertEquals( 'tags-a-b-c', $posts[5]->post_name );
	}

	function test_query_tag__not_in() {
		$tag_a = tag_exists('tag-a');
		$posts = $this->q->query("tag__not_in[]={$tag_a[term_id]}");

		// the most recent 10 posts with Tag A excluded
		// (note the different between this and test_query_default)
		$expected = array (
			0 => 'tags-b-and-c',
			1 => 'tag-c',
			2 => 'tag-b',
			3 => 'raw-html-code',
			4 => 'simple-markup-test',
			5 => 'embedded-video',
			6 => 'contributor-post-approved',
			7 => 'one-comment',
			8 => 'no-comments',
			9 => 'many-trackbacks',
		);

		$this->assertEquals( $expected, wp_list_pluck( $posts, 'post_name' ) );
	}

	function test_query_tag__in_but__not_in() {
		$tag_a = tag_exists('tag-a');
		$tag_b = tag_exists('tag-b');
		$posts = $this->q->query("tag__in[]={$tag_a[term_id]}&tag__not_in[]={$tag_b[term_id]}");

		// there are 4 posts with Tag A, only 2 when we exclude Tag B
		$this->assertCount( 2, $posts );
		$this->assertEquals( 'tags-a-and-c', $posts[0]->post_name );
		$this->assertEquals( 'tag-a', $posts[1]->post_name );
	}



	function test_query_category_name() {
		$posts = $this->q->query('category_name=cat-a');

		// there are 4 posts with Cat A, we'll check for them by name
		$this->assertCount( 4, $posts );
		$this->assertEquals( 'cat-a', $posts[0]->post_name );
		$this->assertEquals( 'cats-a-and-c', $posts[1]->post_name );
		$this->assertEquals( 'cats-a-and-b', $posts[2]->post_name );
		$this->assertEquals( 'cats-a-b-c', $posts[3]->post_name );
	}

	function test_query_cat() {
		$cat = category_exists('cat-b');
		$posts = $this->q->query("cat=$cat");

		// there are 4 posts with Cat B
		$this->assertCount( 4, $posts );
		$this->assertEquals( 'cat-b', $posts[0]->post_name );
		$this->assertEquals( 'cats-b-and-c', $posts[1]->post_name );
		$this->assertEquals( 'cats-a-and-b', $posts[2]->post_name );
		$this->assertEquals( 'cats-a-b-c', $posts[3]->post_name );
	}

	function test_query_posts_per_page() {
		$posts = $this->q->query('posts_per_page=5');

		$expected = array (
			0 => 'tags-a-and-c',
			1 => 'tags-b-and-c',
			2 => 'tags-a-and-b',
			3 => 'tag-c',
			4 => 'tag-b',
		);

		$this->assertCount( 5, $posts );
		$this->assertEquals( $expected, wp_list_pluck( $posts, 'post_name' ) );
	}

	function test_query_offset() {
		$posts = $this->q->query('offset=2');

		$expected = array (
			0 => 'tags-a-and-b',
			1 => 'tag-c',
			2 => 'tag-b',
			3 => 'tag-a',
			4 => 'tags-a-b-c',
			5 => 'raw-html-code',
			6 => 'simple-markup-test',
			7 => 'embedded-video',
			8 => 'contributor-post-approved',
			9 => 'one-comment',
		);

		$this->assertCount( 10, $posts );
		$this->assertEquals( $expected, wp_list_pluck( $posts, 'post_name' ) );
	}

	function test_query_paged() {
		$posts = $this->q->query('paged=2');

		$expected = array (
			0 => 'contributor-post-approved',
			1 => 'one-comment',
			2 => 'no-comments',
			3 => 'many-trackbacks',
			4 => 'one-trackback',
			5 => 'comment-test',
			6 => 'lorem-ipsum',
			7 => 'cat-c',
			8 => 'cat-b',
			9 => 'cat-a',
		);

		$this->assertCount( 10, $posts );
		$this->assertTrue( $this->q->is_paged() );
		$this->assertEquals( $expected, wp_list_pluck( $posts, 'post_name' ) );
	}

	function test_query_paged_and_posts_per_page() {
		$posts = $this->q->query('paged=4&posts_per_page=4');

		$expected = array (
			0 => 'no-comments',
			1 => 'many-trackbacks',
			2 => 'one-trackback',
			3 => 'comment-test',
		);

		$this->assertCount( 4, $posts );
		$this->assertTrue( $this->q->is_paged() );
		$this->assertEquals( $expected, wp_list_pluck( $posts, 'post_name' ) );
	}

	/**
	 * @ticket 18897
	 */
	function test_query_offset_and_paged() {
		$posts = $this->q->query('paged=2&offset=3');

		$expected = array (
			0 => 'many-trackbacks',
			1 => 'one-trackback',
			2 => 'comment-test',
			3 => 'lorem-ipsum',
			4 => 'cat-c',
			5 => 'cat-b',
			6 => 'cat-a',
			7 => 'cats-a-and-c',
			8 => 'cats-b-and-c',
			9 => 'cats-a-and-b',
		);

		$this->assertCount( 10, $posts );
		$this->assertTrue( $this->q->is_paged() );
		$this->assertEquals( $expected, wp_list_pluck( $posts, 'post_name' ) );
	}

	/**
	 * @ticket 11056
	 */
	function test_query_post_parent__in() {
		// Query for first parent's children
		$posts = $this->q->query( array(
			'post_parent__in' => array( $this->parent_one ),
			'orderby' => 'date',
			'order' => 'asc',
		) );

		$this->assertEquals( array(
			'child-one',
			'child-two',
		), wp_list_pluck( $posts, 'post_title' ) );

		// Second parent's children
		$posts = $this->q->query( array(
			'post_parent__in' => array( $this->parent_two ),
			'orderby' => 'date',
			'order' => 'asc',
		) );

		$this->assertEquals( array(
			'child-three',
			'child-four',
		), wp_list_pluck( $posts, 'post_title' ) );

		// Both first and second parent's children
		$posts = $this->q->query( array(
			'post_parent__in' => array( $this->parent_one, $this->parent_two ),
			'orderby' => 'date',
			'order' => 'asc',
		) );

		$this->assertEquals( array(
			'child-one',
			'child-two',
			'child-three',
			'child-four',
		), wp_list_pluck( $posts, 'post_title' ) );

		// Third parent's children
		$posts = $this->q->query( array(
			'post_parent__in' => array( $this->parent_three ),
		) );

		$this->assertEquals( array(), wp_list_pluck( $posts, 'post_title' ) );
	}

	/**
	 * @ticket 11056
	 */
	function test_query_orderby_post_parent__in() {
		$posts = $this->q->query( array(
			'post_parent__in' => array( $this->parent_two, $this->parent_one ),
			'orderby' => 'post_parent__in',
			'order' => 'asc',
		) );

		$this->assertEquals( array(
			'child-three',
			'child-four',
			'child-one',
			'child-two',
		), wp_list_pluck( $posts, 'post_title' ) );
	}
}
