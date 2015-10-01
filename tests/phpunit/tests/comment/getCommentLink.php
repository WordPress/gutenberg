<?php

/**
 * @group comment
 */
class Tests_Comment_GetCommentLink extends WP_UnitTestCase {
	protected $p;
	protected $comments = array();

	public function setUp() {
		parent::setUp();

		$now = time();
		$this->p = $this->factory->post->create();
		$this->comments[] = $this->factory->comment->create( array(
			'comment_post_ID' => $this->p,
			'comment_content' => '1',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 100 ),
		) );
		$this->comments[] = $this->factory->comment->create( array(
			'comment_post_ID' => $this->p,
			'comment_content' => '2',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 200 ),
		) );
		$this->comments[] = $this->factory->comment->create( array(
			'comment_post_ID' => $this->p,
			'comment_content' => '3',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 300 ),
		) );
		$this->comments[] = $this->factory->comment->create( array(
			'comment_post_ID' => $this->p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 400 ),
		) );
		$this->comments[] = $this->factory->comment->create( array(
			'comment_post_ID' => $this->p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 500 ),
		) );
		$this->comments[] = $this->factory->comment->create( array(
			'comment_post_ID' => $this->p,
			'comment_content' => '4',
			'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - 600 ),
		) );
	}

	/**
	 * @ticket 34068
	 */
	public function test_default_comments_page_newest_default_page_should_have_cpage() {
		update_option( 'default_comments_page', 'newest' );
		update_option( 'comments_per_page', 2 );

		$found = get_comment_link( $this->comments[1] );

		$this->assertContains( 'cpage=3', $found );
	}

	/**
	 * @ticket 34068
	 */
	public function test_default_comments_page_newest_middle_page_should_have_cpage() {
		update_option( 'default_comments_page', 'newest' );
		update_option( 'comments_per_page', 2 );

		$found = get_comment_link( $this->comments[3] );

		$this->assertContains( 'cpage=2', $found );
	}

	/**
	 * @ticket 34068
	 */
	public function test_default_comments_page_newest_last_page_should_have_cpage() {
		update_option( 'default_comments_page', 'newest' );
		update_option( 'comments_per_page', 2 );

		$found = get_comment_link( $this->comments[5] );

		$this->assertContains( 'cpage=1', $found );
	}

	/**
	 * @ticket 34068
	 */
	public function test_default_comments_page_oldest_default_page_should_not_have_cpage() {
		update_option( 'default_comments_page', 'oldest' );
		update_option( 'comments_per_page', 2 );

		$found = get_comment_link( $this->comments[5] );

		$this->assertNotContains( 'cpage', $found );
	}

	/**
	 * @ticket 34068
	 */
	public function test_default_comments_page_oldest_middle_page_should_have_cpage() {
		update_option( 'default_comments_page', 'oldest' );
		update_option( 'comments_per_page', 2 );

		$found = get_comment_link( $this->comments[3] );

		$this->assertContains( 'cpage=2', $found );
	}

	/**
	 * @ticket 34068
	 */
	public function test_default_comments_page_oldest_last_page_should_have_cpage() {
		update_option( 'default_comments_page', 'oldest' );
		update_option( 'comments_per_page', 2 );

		$found = get_comment_link( $this->comments[1] );

		$this->assertContains( 'cpage=3', $found );
	}
}
