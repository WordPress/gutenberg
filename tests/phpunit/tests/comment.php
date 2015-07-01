<?php

/**
 * @group comment
 */
class Tests_Comment extends WP_UnitTestCase {
	function test_wp_update_comment() {
		$post = $this->factory->post->create_and_get( array( 'post_title' => 'some-post', 'post_type' => 'post' ) );
		$post2 = $this->factory->post->create_and_get( array( 'post_title' => 'some-post-2', 'post_type' => 'post' ) );
		$comments = $this->factory->comment->create_post_comments( $post->ID, 5 );
		$result = wp_update_comment( array( 'comment_ID' => $comments[0], 'comment_parent' => $comments[1] ) );
		$this->assertEquals( 1, $result );
		$comment = get_comment( $comments[0] );
		$this->assertEquals( $comments[1], $comment->comment_parent );
		$result = wp_update_comment( array( 'comment_ID' => $comments[0], 'comment_parent' => $comments[1] ) );
		$this->assertEquals( 0, $result );
		$result = wp_update_comment( array( 'comment_ID' => $comments[0], 'comment_post_ID' => $post2->ID ) );
		$comment = get_comment( $comments[0] );
		$this->assertEquals( $post2->ID, $comment->comment_post_ID );
	}

	/**
	 * @ticket 30627
	 */
	function test_wp_update_comment_updates_comment_type() {
		$post_id = $this->factory->post->create();
		$comment_id = $this->factory->comment->create( array( 'comment_post_ID' => $post_id ) );

		wp_update_comment( array( 'comment_ID' => $comment_id, 'comment_type' => 'pingback' ) );

		$comment = get_comment( $comment_id );
		$this->assertEquals( 'pingback', $comment->comment_type );
	}

	/**
	 * @ticket 30307
	 */
	function test_wp_update_comment_updates_user_id() {
		$post_id = $this->factory->post->create();
		$comment_id = $this->factory->comment->create( array( 'comment_post_ID' => $post_id ) );

		wp_update_comment( array( 'comment_ID' => $comment_id, 'user_id' => 1 ) );

		$comment = get_comment( $comment_id );
		$this->assertEquals( 1, $comment->user_id );
	}

	public function test_get_approved_comments() {
		$p = $this->factory->post->create();
		$ca1 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1' ) );
		$ca2 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1' ) );
		$ca3 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '0' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1', 'comment_type' => 'mario' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1', 'comment_type' => 'luigi' ) );

		$found = get_approved_comments( $p );

		// all comments types will be returned
		$this->assertEquals( array( $ca1, $ca2, $c2, $c3, $c4, $c5 ), wp_list_pluck( $found, 'comment_ID' ) );
	}

	/**
	 * @ticket 30412
	 */
	public function test_get_approved_comments_with_post_id_0_should_return_empty_array() {
		$p = $this->factory->post->create();
		$ca1 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1' ) );

		$found = get_approved_comments( 0 );

		$this->assertSame( array(), $found );
	}

	/**
	 * @ticket 14279
	 */
	public function test_wp_new_comment_respects_dates() {
		// `wp_new_comment()` checks REMOTE_ADDR, so we fake it to avoid PHP notices.
		if ( isset( $_SERVER['REMOTE_ADDR'] ) ) {
			$remote_addr = $_SERVER['REMOTE_ADDR'];
		} else {
			$_SERVER['REMOTE_ADDR'] = '';
		}

		$u = $this->factory->user->create();
		$post_id = $this->factory->post->create( array( 'post_author' => $u ) );

		$data = array(
			'comment_post_ID' => $post_id,
			'comment_author' => rand_str(),
			'comment_author_url' => '',
			'comment_author_email' => '',
			'comment_type' => '',
			'comment_content' => rand_str(),
			'comment_date' => '2011-01-01 10:00:00',
			'comment_date_gmt' => '2011-01-01 10:00:00',
		);

		$id = wp_new_comment( $data );

		$comment = get_comment( $id );

		$this->assertEquals( $data['comment_date'], $comment->comment_date );
		$this->assertEquals( $data['comment_date_gmt'], $comment->comment_date_gmt );

		// Cleanup.
		if ( isset( $remote_addr ) ) {
			$_SERVER['REMOTE_ADDR'] = $remote_addr;
		} else {
			unset( $_SERVER['REMOTE_ADDR'] );
		}
	}

	/**
	 * @ticket 14601
	 */
	public function test_wp_new_comment_respects_author_ip() {
		$u = $this->factory->user->create();
		$post_id = $this->factory->post->create( array( 'post_author' => $u ) );

		$data = array(
			'comment_post_ID'      => $post_id,
			'comment_author'       => rand_str(),
			'comment_author_IP'    => '192.168.1.1',
			'comment_author_url'   => '',
			'comment_author_email' => '',
			'comment_type'         => '',
			'comment_content'      => rand_str(),
		);

		$id = wp_new_comment( $data );

		$comment = get_comment( $id );

		$this->assertEquals( $data['comment_author_IP'], $comment->comment_author_IP );
	}

	/**
	 * @ticket 14601
	 */
	public function test_wp_new_comment_respects_author_ip_empty_string() {
		$u = $this->factory->user->create();
		$post_id = $this->factory->post->create( array( 'post_author' => $u ) );

		$data = array(
			'comment_post_ID'      => $post_id,
			'comment_author'       => rand_str(),
			'comment_author_IP'    => '',
			'comment_author_url'   => '',
			'comment_author_email' => '',
			'comment_type'         => '',
			'comment_content'      => rand_str(),
		);

		$id = wp_new_comment( $data );

		$comment = get_comment( $id );

		$this->assertEquals( $data['comment_author_IP'], $comment->comment_author_IP );
	}

	/**
	 * @ticket 14601
	 */
	public function test_wp_new_comment_respects_comment_agent() {
		$u = $this->factory->user->create();
		$post_id = $this->factory->post->create( array( 'post_author' => $u ) );

		$data = array(
			'comment_post_ID'      => $post_id,
			'comment_author'       => rand_str(),
			'comment_author_IP'    => '',
			'comment_author_url'   => '',
			'comment_author_email' => '',
			'comment_agent'        => 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53',
			'comment_type'         => '',
			'comment_content'      => rand_str(),
		);

		$id = wp_new_comment( $data );

		$comment = get_comment( $id );

		$this->assertEquals( $data['comment_agent'], $comment->comment_agent );
	}

	/**
	 * @ticket 14601
	 */
	public function test_wp_new_comment_should_trim_provided_comment_agent_to_254_chars() {
		$u = $this->factory->user->create();
		$post_id = $this->factory->post->create( array( 'post_author' => $u ) );

		$data = array(
			'comment_post_ID'      => $post_id,
			'comment_author'       => rand_str(),
			'comment_author_IP'    => '',
			'comment_author_url'   => '',
			'comment_author_email' => '',
			'comment_agent'        => 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16 Mozilla/5.0 (Macintosh; U; PPC Mac OS X Mach-O; en; rv:1.8.1.4pre) Gecko/20070511 Camino/1.6pre',
			'comment_type'         => '',
			'comment_content'      => rand_str(),
		);

		$id = wp_new_comment( $data );

		$comment = get_comment( $id );

		$this->assertEquals( 'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16 Mozilla/5.0 (Macintosh; U; PPC Mac OS ', $comment->comment_agent );
	}

	/**
	 * @ticket 14601
	 */
	public function test_wp_new_comment_respects_comment_agent_empty_string() {
		$u = $this->factory->user->create();
		$post_id = $this->factory->post->create( array( 'post_author' => $u ) );

		$data = array(
			'comment_post_ID'      => $post_id,
			'comment_author'       => rand_str(),
			'comment_author_IP'    => '',
			'comment_author_url'   => '',
			'comment_author_email' => '',
			'comment_agent'        => '',
			'comment_type'         => '',
			'comment_content'      => rand_str(),
		);

		$id = wp_new_comment( $data );

		$comment = get_comment( $id );

		$this->assertEquals( $data['comment_agent'], $comment->comment_agent );
	}


	public function test_comment_field_lengths() {
		// `wp_new_comment()` checks REMOTE_ADDR, so we fake it to avoid PHP notices.
		if ( isset( $_SERVER['REMOTE_ADDR'] ) ) {
			$remote_addr = $_SERVER['REMOTE_ADDR'];
		} else {
			$_SERVER['REMOTE_ADDR'] = '';
		}

		$u = $this->factory->user->create();
		$post_id = $this->factory->post->create( array( 'post_author' => $u ) );

		$data = array(
			'comment_post_ID' => $post_id,
			'comment_author' => rand_str(),
			'comment_author_url' => '',
			'comment_author_email' => '',
			'comment_type' => '',
			'comment_content' => str_repeat( 'A', 65536 ),
			'comment_date' => '2011-01-01 10:00:00',
			'comment_date_gmt' => '2011-01-01 10:00:00',
		);

		$id = wp_new_comment( $data );

		$comment = get_comment( $id );

		$this->assertEquals( strlen( $comment->comment_content ), 65535 );

		// Cleanup.
		if ( isset( $remote_addr ) ) {
			$_SERVER['REMOTE_ADDR'] = $remote_addr;
		} else {
			unset( $_SERVER['REMOTE_ADDR'] );
		}
	}

	/**
	 * @ticket 32566
	 */
	public function test_wp_notify_moderator_should_not_throw_notice_when_post_author_is_0() {
		$p = $this->factory->post->create( array(
			'post_author' => 0,
		) );

		$c = $this->factory->comment->create( array(
			'comment_post_ID' => $p,
		) );

		$this->assertTrue( wp_notify_moderator( $c ) );
	}
}
