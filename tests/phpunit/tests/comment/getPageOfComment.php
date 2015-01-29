<?php

/**
 * @group comment
 * @covers ::get_page_of_comment
 */
class Tests_Comment_GetPageOfComment extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();
	}

	public function test_last_comment() {
		$p = $this->factory->post->create();

		// page 4
		$comment_last = $this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-24 00:00:00' ) );
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-23 00:00:00' ) );

		// page 3
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-22 00:00:00' ) );
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-21 00:00:00' ) );
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-20 00:00:00' ) );

		// page 2
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-19 00:00:00' ) );
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-18 00:00:00' ) );
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-17 00:00:00' ) );

		// page 1
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-16 00:00:00' ) );
		$this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-15 00:00:00' ) );
		$comment_first = $this->factory->comment->create_post_comments( $p, 1, array( 'comment_date' => '2013-09-14 00:00:00' ) );

		$this->assertEquals( 4, get_page_of_comment( $comment_last[0],  array( 'per_page' =>  3 ) ) );
		$this->assertEquals( 2, get_page_of_comment( $comment_last[0],  array( 'per_page' => 10 ) ) );

		$this->assertEquals( 1, get_page_of_comment( $comment_first[0], array( 'per_page' =>  3 ) ) );
		$this->assertEquals( 1, get_page_of_comment( $comment_first[0], array( 'per_page' => 10 ) ) );
	}
}
