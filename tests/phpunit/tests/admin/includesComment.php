<?php

/**
 * @group admin
 * @group comment
 */
class Tests_Admin_IncludesComment extends WP_UnitTestCase {
	public function test_must_match_date_and_author() {
		$c1 = $this->factory->comment->create( array(
			'comment_author' => 'foo',
			'comment_date' => '2014-05-06 12:00:00',
		) );

		$c2 = $this->factory->comment->create( array(
			'comment_author' => 'bar',
			'comment_date' => '2004-01-02 12:00:00',
		) );

		$this->assertNull( comment_exists( 'foo', '2004-01-02 12:00:00' ) );
		$this->assertEquals( $c1, comment_exists( 'foo', '2014-05-06 12:00:00' ) );
	}
}
