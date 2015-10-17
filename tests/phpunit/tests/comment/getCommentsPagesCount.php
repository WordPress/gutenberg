<?php
/**
 * Validate the logic of get_comments_pages_count
 * @group comment
 */
class Tests_Comment_GetCommentsPagesCount extends WP_UnitTestCase {
	protected $option_page_comments;
	protected $option_comments_per_page;
	protected $option_thread_comments;
	protected $option_posts_per_rss;

	/**
	 * setUp options
	 */
	function setUp() {
		parent::setUp();
		$this->option_page_comments = get_option( 'page_comments' );
		$this->option_page_comments = get_option( 'comments_per_page' );
		$this->option_page_comments = get_option( 'thread_comments' );
		$this->option_posts_per_rss = get_option( 'posts_per_rss' );

		update_option( 'page_comments', true );
	}

	/**
	 * tearDown options
	 */
	function tearDown() {
		update_option( 'page_comments', $this->option_page_comments );
		update_option( 'comments_per_page', $this->option_page_comments );
		update_option( 'thread_comments', $this->option_page_comments );
		update_option( 'posts_per_rss', $this->option_posts_per_rss );
		parent::tearDown();
	}

	/**
	 * Validate get_comments_pages_count for empty comments
	 */
	function test_empty() {
		//setup post and comments
		$post_id = self::factory()->post->create( array( 'post_title' => 'comment--post', 'post_type' => 'post' ) );
		$this->go_to( '/?p=' . $post_id );

		global $wp_query;
		unset( $wp_query->comments );

		$comments = get_comments( array( 'post_id' => $post_id ) );

		$this->assertEquals( 0, get_comment_pages_count( $comments, 10, false ) );
		$this->assertEquals( 0, get_comment_pages_count( $comments, 1, false ) );
		$this->assertEquals( 0, get_comment_pages_count( $comments, 0, false ) );
		$this->assertEquals( 0, get_comment_pages_count( $comments, 10, true ) );
		$this->assertEquals( 0, get_comment_pages_count( $comments, 5 ) );
		$this->assertEquals( 0, get_comment_pages_count( $comments ) );
		$this->assertequals( 0, get_comment_pages_count( null, 1 ) );
	}

	/**
	 * Validate get_comments_pages_count for treaded comments
	 */
	function test_threaded_comments( ) {
		//setup post and comments
		$post = self::factory()->post->create_and_get( array( 'post_title' => 'comment--post', 'post_type' => 'post' ) );
		$comments = self::factory()->comment->create_post_comments( $post->ID, 15 );
		self::factory()->comment->create_post_comments( $post->ID, 6, array( 'comment_parent' => $comments[0] ) );
		$comments = get_comments( array( 'post_id' => $post->ID ) );

		$this->assertEquals( 3, get_comment_pages_count( $comments, 10, false ) );
		$this->assertEquals( 2, get_comment_pages_count( $comments, 10, true ) );
		$this->assertEquals( 4, get_comment_pages_count( $comments, 4, true ) );
	}

	/**
	 * Validate get_comments_pages_count for option tread_comments
	 */
	function test_option_thread_comments() {

		//setup post and comments
		$post = self::factory()->post->create_and_get( array( 'post_title' => 'comment--post', 'post_type' => 'post' ) );
		$comments = self::factory()->comment->create_post_comments( $post->ID, 15 );
		self::factory()->comment->create_post_comments( $post->ID, 6, array('comment_parent' => $comments[0] ) );
		$comments = get_comments( array( 'post_id' => $post->ID ) );

		update_option( 'thread_comments', false );

		$this->assertEquals( 3, get_comment_pages_count( $comments, 10, false ) );
		$this->assertEquals( 2, get_comment_pages_count( $comments, 10, true ) );
		$this->assertEquals( 3, get_comment_pages_count( $comments, 10, null ) );
		$this->assertEquals( 3, get_comment_pages_count( $comments, 10 ) );

		update_option( 'thread_comments', true );

		$this->assertEquals( 3, get_comment_pages_count( $comments, 10, false ) );
		$this->assertEquals( 2, get_comment_pages_count( $comments, 10, true ) );
		$this->assertEquals( 2, get_comment_pages_count( $comments, 10, null ) );
		$this->assertEquals( 2, get_comment_pages_count( $comments, 10 ) );
	}

	/**
	 * Validate $wp_query logic of get_comment_pages_count
	 */
	function test_wp_query_comments_per_page() {
		global $wp_query;

		update_option( 'posts_per_rss', 100 );

		$post = self::factory()->post->create_and_get( array( 'post_title' => 'comment-post', 'post_type' => 'post' ) );
		$comments = self::factory()->comment->create_post_comments( $post->ID, 25 );

		$wp_query = new WP_Query( array( 'p' => $post->ID, 'comments_per_page' => 10, 'feed' =>'comments-' ) );

		update_option( 'comments_per_page', 25 );

		$this->assertEquals( 3, get_comment_pages_count() );
		$this->assertEquals( 2, get_comment_pages_count( null, 20 ) );

		$wp_query = new WP_Query( array( 'p' => $post->ID,'comments_per_page' => null, 'feed' =>'comments-' ) );

		$this->assertEquals( 1, get_comment_pages_count() );
		$this->assertEquals( 5, get_comment_pages_count( null, 5 ) );

		$wp_query->query_vars['comments_per_page'] = null;

		update_option( 'comments_per_page', 5 );

		$this->assertEquals( 5, get_comment_pages_count() );
		$this->assertEquals( 3, get_comment_pages_count( null, 11 ) );
		$this->assertEquals( 5, get_comment_pages_count( null, 0 ) );
	}

	/**
	 * Validate max_num_comment_pages logic of get_comment_pages_count
	 */
	 function test_max_num_comment_pages() {
		global $wp_query;
		$wp_query = new WP_Query();

		$org_max_num_comment_pages = $wp_query->max_num_comment_pages;

		$wp_query->max_num_comment_pages = 7;

		$this->assertEquals( 7, get_comment_pages_count() );
		$this->assertEquals( 7, get_comment_pages_count( null, null, null ) );
		$this->assertEquals( 0, get_comment_pages_count( array(), null, null ) );

		$wp_query->max_num_comment_pages = $org_max_num_comment_pages;
	 }
}
