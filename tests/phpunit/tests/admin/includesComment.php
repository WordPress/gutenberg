<?php

/**
 * @group admin
 * @group comment
 */
class Tests_Admin_IncludesComment extends WP_UnitTestCase {
	public function test_must_match_date_and_author() {
		$p1 = $this->factory->post->create();
		$c1 = $this->factory->comment->create( array(
			'comment_author' => 1,
			'comment_date' => '2014-05-06 12:00:00',
			'comment_post_ID' => $p1,
		) );

		$p2 = $this->factory->post->create();
		$c2 = $this->factory->comment->create( array(
			'comment_author' => 2,
			'comment_date' => '2004-01-02 12:00:00',
			'comment_post_ID' => $p2,
		) );

		$this->assertNull( comment_exists( 1, '2004-01-02 12:00:00' ) );
		$this->assertEquals( $p1, comment_exists( 1, '2014-05-06 12:00:00' ) );
	}
}
