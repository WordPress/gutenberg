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
		$this->assertEquals( 0, $count->all );
	}

	public function test_wp_count_comments_approved() {
		self::factory()->comment->create( array(
			'comment_approved' => 1
		) );

		$count = wp_count_comments();

		$this->assertEquals( 1, $count->approved );
		$this->assertEquals( 0, $count->moderated );
		$this->assertEquals( 0, $count->spam );
		$this->assertEquals( 0, $count->trash );
		$this->assertEquals( 0, $count->{'post-trashed'} );
		$this->assertEquals( 1, $count->total_comments );
		$this->assertEquals( 1, $count->all );
	}

	public function test_wp_count_comments_awaiting() {
		self::factory()->comment->create( array(
			'comment_approved' => 0
		) );

		$count = wp_count_comments();

		$this->assertEquals( 0, $count->approved );
		$this->assertEquals( 1, $count->moderated );
		$this->assertEquals( 0, $count->spam );
		$this->assertEquals( 0, $count->trash );
		$this->assertEquals( 0, $count->{'post-trashed'} );
		$this->assertEquals( 1, $count->total_comments );
		$this->assertEquals( 1, $count->all );
	}

	public function test_wp_count_comments_spam() {
		self::factory()->comment->create( array(
			'comment_approved' => 'spam'
		) );

		$count = wp_count_comments();

		$this->assertEquals( 0, $count->approved );
		$this->assertEquals( 0, $count->moderated );
		$this->assertEquals( 1, $count->spam );
		$this->assertEquals( 0, $count->trash );
		$this->assertEquals( 0, $count->{'post-trashed'} );
		$this->assertEquals( 1, $count->total_comments );
		$this->assertEquals( 0, $count->all );
	}

	public function test_wp_count_comments_trash() {
		self::factory()->comment->create( array(
			'comment_approved' => 'trash'
		) );

		$count = wp_count_comments();

		$this->assertEquals( 0, $count->approved );
		$this->assertEquals( 0, $count->moderated );
		$this->assertEquals( 0, $count->spam );
		$this->assertEquals( 1, $count->trash );
		$this->assertEquals( 0, $count->{'post-trashed'} );
		$this->assertEquals( 0, $count->total_comments );
		$this->assertEquals( 0, $count->all );
	}

	public function test_wp_count_comments_post_trashed() {
		self::factory()->comment->create( array(
			'comment_approved' => 'post-trashed'
		) );

		$count = wp_count_comments();

		$this->assertEquals( 0, $count->approved );
		$this->assertEquals( 0, $count->moderated );
		$this->assertEquals( 0, $count->spam );
		$this->assertEquals( 0, $count->trash );
		$this->assertEquals( 1, $count->{'post-trashed'} );
		$this->assertEquals( 0, $count->total_comments );
		$this->assertEquals( 0, $count->all );
	}

	public function test_wp_count_comments_cache() {
		$post_id = self::factory()->post->create( array(
			'post_status' => 'publish'
		) );
		$comment_id = self::factory()->comment->create( array(
			'comment_approved' => '1',
			'comment_post_ID' => $post_id
		) );

		$count1 = wp_count_comments( $post_id );

		$this->assertEquals( 1, $count1->approved );
		$this->assertEquals( 0, $count1->moderated );
		$this->assertEquals( 0, $count1->spam );
		$this->assertEquals( 0, $count1->trash );
		$this->assertEquals( 0, $count1->{'post-trashed'} );
		$this->assertEquals( 1, $count1->total_comments );
		$this->assertEquals( 1, $count1->all );

		$all_count1 = wp_count_comments();

		$this->assertEquals( 1, $all_count1->approved );
		$this->assertEquals( 0, $all_count1->moderated );
		$this->assertEquals( 0, $all_count1->spam );
		$this->assertEquals( 0, $all_count1->trash );
		$this->assertEquals( 0, $all_count1->{'post-trashed'} );
		$this->assertEquals( 1, $all_count1->total_comments );
		$this->assertEquals( 1, $all_count1->all );

		wp_spam_comment( $comment_id );

		$count2 = wp_count_comments( $post_id );

		$this->assertEquals( 0, $count2->approved );
		$this->assertEquals( 0, $count2->moderated );
		$this->assertEquals( 1, $count2->spam );
		$this->assertEquals( 0, $count2->trash );
		$this->assertEquals( 0, $count2->{'post-trashed'} );
		$this->assertEquals( 1, $count2->total_comments );
		$this->assertEquals( 0, $count2->all );

		$all_count2 = wp_count_comments();

		$this->assertEquals( 0, $all_count2->approved );
		$this->assertEquals( 0, $all_count2->moderated );
		$this->assertEquals( 1, $all_count2->spam );
		$this->assertEquals( 0, $all_count2->trash );
		$this->assertEquals( 0, $all_count2->{'post-trashed'} );
		$this->assertEquals( 1, $all_count2->total_comments );
		$this->assertEquals( 0, $all_count2->all );

		wp_trash_comment( $comment_id );

		$count3 = wp_count_comments( $post_id );

		$this->assertEquals( 0, $count3->approved );
		$this->assertEquals( 0, $count3->moderated );
		$this->assertEquals( 0, $count3->spam );
		$this->assertEquals( 1, $count3->trash );
		$this->assertEquals( 0, $count3->{'post-trashed'} );
		$this->assertEquals( 0, $count3->total_comments );
		$this->assertEquals( 0, $count3->all );

		$all_count3 = wp_count_comments();

		$this->assertEquals( 0, $all_count3->approved );
		$this->assertEquals( 0, $all_count3->moderated );
		$this->assertEquals( 0, $all_count3->spam );
		$this->assertEquals( 1, $all_count3->trash );
		$this->assertEquals( 0, $all_count3->{'post-trashed'} );
		$this->assertEquals( 0, $all_count3->total_comments );
		$this->assertEquals( 0, $all_count3->all );

		wp_untrash_comment( $comment_id );

		$count4 = wp_count_comments( $post_id );

		$this->assertEquals( 0, $count4->approved );
		$this->assertEquals( 0, $count4->moderated );
		$this->assertEquals( 1, $count4->spam );
		$this->assertEquals( 0, $count4->trash );
		$this->assertEquals( 0, $count4->{'post-trashed'} );
		$this->assertEquals( 1, $count4->total_comments );
		$this->assertEquals( 0, $count4->all );

		$all_count4 = wp_count_comments();

		$this->assertEquals( 0, $all_count4->approved );
		$this->assertEquals( 0, $all_count4->moderated );
		$this->assertEquals( 1, $all_count4->spam );
		$this->assertEquals( 0, $all_count4->trash );
		$this->assertEquals( 0, $all_count4->{'post-trashed'} );
		$this->assertEquals( 1, $all_count4->total_comments );
		$this->assertEquals( 0, $all_count4->all );
	}
}
