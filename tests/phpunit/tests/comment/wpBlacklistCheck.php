<?php

/**
 * @group comment
 */
class Tests_WP_Blacklist_Check extends WP_UnitTestCase {

	public function test_should_return_true_when_content_matches_blacklist_keys() {
		$author       = 'Sting';
		$author_email = 'sting@example.com';
		$author_url   = 'http://example.com';
		$comment      = "There's a hole in my heart. As deep as a well. For that poor little boy. Who's stuck halfway to Hell.";
		$author_ip    = '192.168.0.1';
		$user_agent   = '';

		update_option( 'blacklist_keys',"well\nfoo" );

		$result = wp_blacklist_check( $author, $author_email, $author_url, $comment, $author_ip, $user_agent );

		$this->assertTrue( $result );
	}

	public function test_should_return_true_when_content_with_html_matches_blacklist_keys() {
		$author       = 'Sting';
		$author_email = 'sting@example.com';
		$author_url   = 'http://example.com';
		$comment      = "There's a hole in my heart. As deep as a well. For that poor little boy. Who's stuck <b>half</b>way to Hell.";
		$author_ip    = '192.168.0.1';
		$user_agent   = '';

		update_option( 'blacklist_keys',"halfway\nfoo" );

		$result = wp_blacklist_check( $author, $author_email, $author_url, $comment, $author_ip, $user_agent );

		$this->assertTrue( $result );
	}

	public function test_should_return_true_when_author_matches_blacklist_keys() {
		$author       = 'Sideshow Mel';
		$author_email = 'mel@example.com';
		$author_url   = 'http://example.com';
		$comment      = "Though we can't get him out. We'll do the next best thing.";
		$author_ip    = '192.168.0.1';
		$user_agent   = '';

		update_option( 'blacklist_keys',"sideshow\nfoo" );

		$result = wp_blacklist_check( $author, $author_email, $author_url, $comment, $author_ip, $user_agent );

		$this->assertTrue( $result );
	}

	public function test_should_return_true_when_url_matches_blacklist_keys() {
		$author       = 'Rainier Wolfcastle';
		$author_email = 'rainier@wolfcastle.com';
		$author_url   = 'http://example.com';
		$comment      = 'We go on TV and sing, sing, sing.';
		$author_ip    = '192.168.0.1';
		$user_agent   = '';

		update_option( 'blacklist_keys',"example\nfoo" );

		$result = wp_blacklist_check( $author, $author_email, $author_url, $comment, $author_ip, $user_agent );

		$this->assertTrue( $result );
	}

	public function test_should_return_false_when_no_match() {
		$author       = 'Krusty the Clown';
		$author_email = 'krusty@example.com';
		$author_url   = 'http://example.com';
		$comment      = "And we're sending our love down the well.";
		$author_ip    = '192.168.0.1';
		$user_agent   = '';

		update_option( 'blacklist_keys',"sideshow\nfoobar" );

		$result = wp_blacklist_check( $author, $author_email, $author_url, $comment, $author_ip, $user_agent );

		$this->assertFalse( $result );
	}
}
