<?php

/**
 * @group comment
 * @group slashes
 * @ticket 21767
 */
class Tests_Comment_Slashes extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
		// we need an admin user to bypass comment flood protection
		$this->author_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$this->old_current_user = get_current_user_id();
		wp_set_current_user( $this->author_id );

		// it is important to test with both even and odd numbered slashes as
		// kses does a strip-then-add slashes in some of its function calls
		$this->slash_1 = 'String with 1 slash \\';
		$this->slash_2 = 'String with 2 slashes \\\\';
		$this->slash_3 = 'String with 3 slashes \\\\\\';
		$this->slash_4 = 'String with 4 slashes \\\\\\\\';
		$this->slash_5 = 'String with 5 slashes \\\\\\\\\\';
		$this->slash_6 = 'String with 6 slashes \\\\\\\\\\\\';
		$this->slash_7 = 'String with 7 slashes \\\\\\\\\\\\\\';

		$_SERVER['REMOTE_ADDR'] = null;
	}

	function tearDown() {
		wp_set_current_user( $this->old_current_user );
		parent::tearDown();
	}

	/**
	 * Tests the extended model function that expects slashed data
	 *
	 */
	function test_wp_new_comment() {
		$post_id = $this->factory->post->create();

		// not testing comment_author_email or comment_author_url
		// as slashes are not permitted in that data
		$data = array(
			'comment_post_ID' => $post_id,
			'comment_author' => $this->slash_1,
			'comment_author_url' => '',
			'comment_author_email' => '',
			'comment_type' => '',
			'comment_content' => $this->slash_7,
		);
		$id = wp_new_comment( $data );

		$comment = get_comment($id);

		$this->assertEquals( wp_unslash( $this->slash_1 ), $comment->comment_author );
		$this->assertEquals( wp_unslash( $this->slash_7 ), $comment->comment_content );

		$data = array(
			'comment_post_ID' => $post_id,
			'comment_author' => $this->slash_2,
			'comment_author_url' => '',
			'comment_author_email' => '',
			'comment_type' => '',
			'comment_content' => $this->slash_4,
		);
		$id = wp_new_comment( $data );

		$comment = get_comment($id);

		$this->assertEquals( wp_unslash( $this->slash_2 ), $comment->comment_author );
		$this->assertEquals( wp_unslash( $this->slash_4 ), $comment->comment_content );
	}

	/**
	 * Tests the controller function that expects slashed data
	 *
	 */
	function test_edit_comment() {
		$post_id = $this->factory->post->create();
		$comment_id = $this->factory->comment->create(array(
			'comment_post_ID' => $post_id
		));

		// not testing comment_author_email or comment_author_url
		// as slashes are not permitted in that data
		$_POST = array();
		$_POST['comment_ID'] = $comment_id;
		$_POST['comment_status'] = '';
		$_POST['newcomment_author'] = $this->slash_1;
		$_POST['newcomment_author_url'] = '';
		$_POST['newcomment_author_email'] = '';
		$_POST['content'] = $this->slash_7;
		$_POST = add_magic_quotes( $_POST );

		edit_comment();
		$comment = get_comment( $comment_id );

		$this->assertEquals( $this->slash_1, $comment->comment_author );
		$this->assertEquals( $this->slash_7, $comment->comment_content );

		$_POST = array();
		$_POST['comment_ID'] = $comment_id;
		$_POST['comment_status'] = '';
		$_POST['newcomment_author'] = $this->slash_2;
		$_POST['newcomment_author_url'] = '';
		$_POST['newcomment_author_email'] = '';
		$_POST['content'] = $this->slash_4;
		$_POST = add_magic_quotes( $_POST );

		edit_comment();
		$comment = get_comment( $comment_id );

		$this->assertEquals( $this->slash_2, $comment->comment_author );
		$this->assertEquals( $this->slash_4, $comment->comment_content );
	}

	/**
	 * Tests the model function that expects slashed data
	 *
	 */
	function test_wp_insert_comment() {
		$post_id = $this->factory->post->create();

		$comment_id = wp_insert_comment(array(
			'comment_post_ID' => $post_id,
			'comment_author' => $this->slash_1,
			'comment_content' => $this->slash_7,
		));
		$comment = get_comment( $comment_id );

		$this->assertEquals( wp_unslash( $this->slash_1 ), $comment->comment_author );
		$this->assertEquals( wp_unslash( $this->slash_7 ), $comment->comment_content );

		$comment_id = wp_insert_comment(array(
			'comment_post_ID' => $post_id,
			'comment_author' => $this->slash_2,
			'comment_content' => $this->slash_4,
		));
		$comment = get_comment( $comment_id );

		$this->assertEquals( wp_unslash( $this->slash_2 ), $comment->comment_author );
		$this->assertEquals( wp_unslash( $this->slash_4 ), $comment->comment_content );
	}

	/**
	 * Tests the model function that expects slashed data
	 *
	 */
	function test_wp_update_comment() {
		$post_id = $this->factory->post->create();
		$comment_id = $this->factory->comment->create(array(
			'comment_post_ID' => $post_id
		));

		wp_update_comment(array(
			'comment_ID' => $comment_id,
			'comment_author' => $this->slash_1,
			'comment_content' => $this->slash_7,
		));
		$comment = get_comment( $comment_id );

		$this->assertEquals( wp_unslash( $this->slash_1 ), $comment->comment_author );
		$this->assertEquals( wp_unslash( $this->slash_7 ), $comment->comment_content );

		wp_update_comment(array(
			'comment_ID' => $comment_id,
			'comment_author' => $this->slash_2,
			'comment_content' => $this->slash_4,
		));
		$comment = get_comment( $comment_id );

		$this->assertEquals( wp_unslash( $this->slash_2 ), $comment->comment_author );
		$this->assertEquals( wp_unslash( $this->slash_4 ), $comment->comment_content );
	}

}
