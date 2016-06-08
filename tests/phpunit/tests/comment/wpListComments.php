<?php

/**
 * @group comment
 */
class Tests_Comment_WpListComments extends WP_UnitTestCase {
	/**
	 * @ticket 35175
	 */
	public function test_should_respect_page_param() {
		$p = self::factory()->post->create();

		$comments = array();
		$now = time();
		for ( $i = 0; $i <= 5; $i++ ) {
			$comments[] = self::factory()->comment->create( array(
				'comment_post_ID' => $p,
				'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - $i ),
				'comment_author' => 'Commenter ' . $i,
			) );
		}

		update_option( 'page_comments', true );
		update_option( 'comments_per_page', 2 );

		$this->go_to( get_permalink( $p ) );

		// comments_template() populates $wp_query->comments
		get_echo( 'comments_template' );

		$found = wp_list_comments( array(
			'page' => 2,
			'echo' => false,
		) );

		preg_match_all( '|id="comment\-([0-9]+)"|', $found, $matches );

		$this->assertEqualSets( array( $comments[2], $comments[3] ), $matches[1] );
	}

	/**
	 * @ticket 35175
	 */
	public function test_should_respect_per_page_param() {
		$p = self::factory()->post->create();

		$comments = array();
		$now = time();
		for ( $i = 0; $i <= 5; $i++ ) {
			$comments[] = self::factory()->comment->create( array(
				'comment_post_ID' => $p,
				'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - $i ),
				'comment_author' => 'Commenter ' . $i,
			) );
		}

		update_option( 'page_comments', true );
		update_option( 'comments_per_page', 2 );

		$this->go_to( get_permalink( $p ) );

		// comments_template() populates $wp_query->comments
		get_echo( 'comments_template' );

		$found = wp_list_comments( array(
			'per_page' => 3,
			'echo' => false,
		) );

		preg_match_all( '|id="comment\-([0-9]+)"|', $found, $matches );

		$this->assertEqualSets( array( $comments[0], $comments[1], $comments[2] ), $matches[1] );
	}

	/**
	 * @ticket 35175
	 */
	public function test_should_respect_reverse_top_level_param() {
		$p = self::factory()->post->create();

		$comments = array();
		$now = time();
		for ( $i = 0; $i <= 5; $i++ ) {
			$comments[] = self::factory()->comment->create( array(
				'comment_post_ID' => $p,
				'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - $i ),
				'comment_author' => 'Commenter ' . $i,
			) );
		}

		update_option( 'page_comments', true );
		update_option( 'comments_per_page', 2 );

		$this->go_to( get_permalink( $p ) );

		// comments_template() populates $wp_query->comments
		get_echo( 'comments_template' );

		$found1 = wp_list_comments( array(
			'reverse_top_level' => true,
			'echo' => false,
		) );
		preg_match_all( '|id="comment\-([0-9]+)"|', $found1, $matches );
		$this->assertSame( array( $comments[0], $comments[1] ), array_map( 'intval', $matches[1] ) );

		$found2 = wp_list_comments( array(
			'reverse_top_level' => false,
			'echo' => false,
		) );
		preg_match_all( '|id="comment\-([0-9]+)"|', $found2, $matches );
		$this->assertSame( array( $comments[1], $comments[0] ), array_map( 'intval', $matches[1] ) );
	}

	/**
	 * @ticket 35356
	 * @ticket 35175
	 */
	public function test_comments_param_should_be_respected_when_custom_pagination_params_are_passed() {
		$p = self::factory()->post->create();

		$comments = array();
		$now = time();
		for ( $i = 0; $i <= 5; $i++ ) {
			$comments[] = self::factory()->comment->create( array(
				'comment_post_ID' => $p,
				'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - $i ),
				'comment_author' => 'Commenter ' . $i,
			) );
		}

		update_option( 'page_comments', true );
		update_option( 'comments_per_page', 2 );

		$_comments = array( get_comment( $comments[1] ), get_comment( $comments[3] ) );

		// Populate `$wp_query->comments` in order to show that it doesn't override `$_comments`.
		$this->go_to( get_permalink( $p ) );
		get_echo( 'comments_template' );

		$found = wp_list_comments( array(
			'echo' => false,
			'per_page' => 1,
			'page' => 2,
		), $_comments );

		preg_match_all( '|id="comment\-([0-9]+)"|', $found, $matches );
		$this->assertSame( array( $comments[3] ), array_map( 'intval', $matches[1] ) );
	}

	/**
	 * @ticket 37048
	 */
	public function test_custom_pagination_should_not_result_in_unapproved_comments_being_shown() {
		$p = self::factory()->post->create();

		$comments = array();
		$now = time();
		for ( $i = 0; $i <= 5; $i++ ) {
			$comments[] = self::factory()->comment->create( array(
				'comment_post_ID' => $p,
				'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - $i ),
				'comment_author' => 'Commenter ' . $i,
			) );
		}

		// Only 2 and 5 are approved.
		wp_set_comment_status( $comments[0], '0' );
		wp_set_comment_status( $comments[1], '0' );
		wp_set_comment_status( $comments[3], '0' );
		wp_set_comment_status( $comments[4], '0' );

		update_option( 'page_comments', true );
		update_option( 'comments_per_page', 2 );

		$this->go_to( get_permalink( $p ) );

		// comments_template() populates $wp_query->comments
		get_echo( 'comments_template' );

		$found = wp_list_comments( array(
			'echo' => false,
			'per_page' => 1,
			'page' => 2,
		) );

		preg_match_all( '|id="comment\-([0-9]+)"|', $found, $matches );
		$this->assertSame( array( $comments[2] ), array_map( 'intval', $matches[1] ) );
	}

	/**
	 * @ticket 37048
	 */
	public function test_custom_pagination_should_allow_ones_own_unapproved_comments() {
		$p = self::factory()->post->create();
		$u = self::factory()->user->create();

		$comments = array();
		$now = time();
		for ( $i = 0; $i <= 5; $i++ ) {
			$comments[] = self::factory()->comment->create( array(
				'comment_post_ID' => $p,
				'comment_date_gmt' => date( 'Y-m-d H:i:s', $now - $i ),
				'comment_author' => 'Commenter ' . $i,
				'user_id' => $u,
			) );
		}

		// Only 2 and 5 are approved.
		wp_set_comment_status( $comments[0], '0' );
		wp_set_comment_status( $comments[1], '0' );
		wp_set_comment_status( $comments[3], '0' );
		wp_set_comment_status( $comments[4], '0' );

		update_option( 'page_comments', true );
		update_option( 'comments_per_page', 2 );

		wp_set_current_user( $u );

		$this->go_to( get_permalink( $p ) );

		// comments_template() populates $wp_query->comments
		get_echo( 'comments_template' );

		$found = wp_list_comments( array(
			'echo' => false,
			'per_page' => 1,
			'page' => 2,
		) );

		preg_match_all( '|id="comment\-([0-9]+)"|', $found, $matches );
		$this->assertSame( array( $comments[4] ), array_map( 'intval', $matches[1] ) );
	}
}
