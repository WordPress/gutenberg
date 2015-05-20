<?php

class Tests_Comment_CheckComment extends WP_UnitTestCase {
	public function test_should_return_true_when_comment_whitelist_is_disabled() {
		$author       = 'BobtheBuilder';
		$author_email = 'bob@example.com';
		$author_url   = 'http://example.com';
		$comment      = 'Can we fix it? Yes, we can (thanks to Wendy).';
		$author_ip    = '192.168.0.1';
		$user_agent   = '';
		$comment_type = '';

		update_option( 'comment_whitelist', 0 );
		$results = check_comment( $author, $author_email, $author_url, $comment, $author_ip, $user_agent, $comment_type );
		$this->assertTrue( $results );
	}

	public function test_should_return_false_when_comment_whitelist_is_enabled_and_author_does_not_have_approved_comment() {
		$author       = 'BobtheBuilder';
		$author_email = 'bob@example.com';
		$author_url   = 'http://example.com';
		$comment      = 'Can we fix it? Yes, we can (thanks to Wendy).';
		$author_ip    = '192.168.0.1';
		$user_agent   = '';
		$comment_type = '';

		update_option( 'comment_whitelist', 1 );
		$results = check_comment( $author, $author_email, $author_url, $comment, $author_ip, $user_agent, $comment_type );
		$this->assertFalse( $results );

	}

	public function test_should_return_true_when_comment_whitelist_is_enabled_and_author_has_approved_comment() {
		$post_id = $this->factory->post->create();
		$prev_args = array(
			'comment_post_ID'      => $post_id,
			'comment_content'      => 'Can we build it?',
			'comment_approved'     => 0,
			'comment_author_email' => 'bob@example.com',
			'comment_author'       => 'BobtheBuilder',
		);
		$prev_comment_id = $this->factory->comment->create( $prev_args );

		update_option( 'comment_whitelist', 1 );

		$author       = 'BobtheBuilder';
		$author_email = 'bob@example.com';
		$author_url   = 'http://example.com';
		$comment      = 'Can we fix it? Yes, we can (thanks to Wendy).';
		$author_ip    = '192.168.0.1';
		$user_agent   = '';
		$comment_type = '';

		$results = check_comment( $author, $author_email, $author_url, $comment, $author_ip, $user_agent, $comment_type );
		$this->assertFalse( $results );

		// Approve the previous comment.
		wp_update_comment( array(
			'comment_ID'       => $prev_comment_id,
			'comment_approved' => 1,
		) );
		$results = check_comment( $author, $author_email, $author_url, $comment, $author_ip, $user_agent, $comment_type );
		$this->assertTrue( $results );
	}

	public function test_should_return_false_when_content_matches_moderation_key() {
		update_option( 'comment_whitelist', 0 );

		$author       = 'WendytheBuilder';
		$author_email = 'wendy@example.com';
		$author_url   = 'http://example.com';
		$comment      = 'Has anyone seen Scoop?';
		$author_ip    = '192.168.0.1';
		$user_agent   = '';
		$comment_type = '';

		update_option( 'moderation_keys',"foo\nbar\nscoop" );
		$results = check_comment( $author, $author_email, $author_url, $comment, $author_ip, $user_agent, $comment_type );
		$this->assertFalse( $results );
	}

	public function test_should_return_true_when_content_does_not_match_moderation_keys() {
		$author       = 'WendytheBuilder';
		$author_email = 'wendy@example.com';
		$author_url   = 'http://example.com';
		$comment      = 'Has anyone seen Scoop?';
		$author_ip    = '192.168.0.1';
		$user_agent   = '';
		$comment_type = '';

		update_option( 'moderation_keys',"foo\nbar" );
		$results = check_comment( $author, $author_email, $author_url, $comment, $author_ip, $user_agent, $comment_type );
		$this->assertFalse( $results );
	}

	public function test_should_return_false_when_link_count_exceeds_comment_max_length_setting() {
		update_option( 'comment_whitelist', 0 );

		$author       = 'BobtheBuilder';
		$author_email = 'bob@example.com';
		$author_url   = 'http://example.com';
		$comment      = 'This is a comment with <a href="http://example.com">multiple</a> <a href="http://bob.example.com">links</a>.';
		$author_ip    = '192.168.0.1';
		$user_agent   = '';
		$comment_type = '';

		update_option( 'comment_max_links', 2 );
		$results = check_comment( $author, $author_email, $author_url, $comment, $author_ip, $user_agent, $comment_type );
		$this->assertFalse( $results );
	}

	public function test_should_return_true_when_link_count_does_not_exceed_comment_max_length_setting() {
		update_option( 'comment_whitelist', 0 );

		$author       = 'BobtheBuilder';
		$author_email = 'bob@example.com';
		$author_url   = 'http://example.com';
		$comment      = 'This is a comment with <a href="http://example.com">multiple</a> <a href="http://bob.example.com">links</a>.';
		$author_ip    = '192.168.0.1';
		$user_agent   = '';
		$comment_type = '';

		update_option( 'comment_max_links', 3 );
		$results = check_comment( $author, $author_email, $author_url, $comment, $author_ip, $user_agent, $comment_type );
		$this->assertTrue( $results );
	}
}
