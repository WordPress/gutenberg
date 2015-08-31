<?php

class Tests_WP_Count_Comments extends WP_UnitTestCase {

	public function test_wp_count_comments() {
		$count = wp_count_comments();

		$this->assertEquals( 0, $count->approved );
		$this->assertEquals( 0, $count->moderated );
		$this->assertEquals( 0, $count->spam );
		$this->assertEquals( 0, $count->trash );
		$this->assertEquals( 0, $count->{'post-trashed'} );
		$this->assertEquals( 0, $count->total_comments );
	}

	public function test_wp_count_comments_approved() {
		$this->factory->comment->create( array(
			'comment_approved' => 1
		) );

		$count = wp_count_comments();

		$this->assertEquals( 1, $count->approved );
		$this->assertEquals( 0, $count->moderated );
		$this->assertEquals( 0, $count->spam );
		$this->assertEquals( 0, $count->trash );
		$this->assertEquals( 0, $count->{'post-trashed'} );
		$this->assertEquals( 1, $count->total_comments );
	}

	public function test_wp_count_comments_awaiting() {
		$this->factory->comment->create( array(
			'comment_approved' => 0
		) );

		$count = wp_count_comments();

		$this->assertEquals( 0, $count->approved );
		$this->assertEquals( 1, $count->moderated );
		$this->assertEquals( 0, $count->spam );
		$this->assertEquals( 0, $count->trash );
		$this->assertEquals( 0, $count->{'post-trashed'} );
		$this->assertEquals( 1, $count->total_comments );
	}

	public function test_wp_count_comments_spam() {
		$this->factory->comment->create( array(
			'comment_approved' => 'spam'
		) );

		$count = wp_count_comments();

		$this->assertEquals( 0, $count->approved );
		$this->assertEquals( 0, $count->moderated );
		$this->assertEquals( 1, $count->spam );
		$this->assertEquals( 0, $count->trash );
		$this->assertEquals( 0, $count->{'post-trashed'} );
		$this->assertEquals( 1, $count->total_comments );
	}

	public function test_wp_count_comments_trash() {
		$this->factory->comment->create( array(
			'comment_approved' => 'trash'
		) );

		$count = wp_count_comments();

		$this->assertEquals( 0, $count->approved );
		$this->assertEquals( 0, $count->moderated );
		$this->assertEquals( 0, $count->spam );
		$this->assertEquals( 1, $count->trash );
		$this->assertEquals( 0, $count->{'post-trashed'} );
		$this->assertEquals( 0, $count->total_comments );
	}

	public function test_wp_count_comments_post_trashed() {
		$this->factory->comment->create( array(
			'comment_approved' => 'post-trashed'
		) );

		$count = wp_count_comments();

		$this->assertEquals( 0, $count->approved );
		$this->assertEquals( 0, $count->moderated );
		$this->assertEquals( 0, $count->spam );
		$this->assertEquals( 0, $count->trash );
		$this->assertEquals( 1, $count->{'post-trashed'} );
		$this->assertEquals( 0, $count->total_comments );
	}
}
