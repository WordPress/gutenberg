<?php

/**
 * @group comment
 */
class Tests_Comment_Submission extends WP_UnitTestCase {

	protected $preprocess_comment_data = array();

	function setUp() {
		parent::setUp();
		require_once ABSPATH . WPINC . '/class-phpass.php';
	}

	public function test_submitting_comment_to_invalid_post_returns_error() {
		$error = 'comment_id_not_found';

		$this->assertSame( 0, did_action( $error ) );

		$data = array(
			'comment_post_ID' => 0,
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertSame( 1, did_action( $error ) );
		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_to_post_with_closed_comments_returns_error() {

		$error = 'comment_closed';

		$this->assertSame( 0, did_action( $error ) );

		$post = self::factory()->post->create_and_get( array(
			'comment_status' => 'closed',
		) );
		$data = array(
			'comment_post_ID' => $post->ID,
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertSame( 1, did_action( $error ) );
		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_to_trashed_post_returns_error() {

		$error = 'comment_on_trash';

		$this->assertSame( 0, did_action( $error ) );

		$post = self::factory()->post->create_and_get();
		wp_trash_post( $post );
		$data = array(
			'comment_post_ID' => $post->ID,
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertSame( 1, did_action( $error ) );
		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_to_draft_post_returns_error() {

		$error = 'comment_on_draft';

		$this->assertSame( 0, did_action( $error ) );

		$post = self::factory()->post->create_and_get( array(
			'post_status' => 'draft',
		) );
		$data = array(
			'comment_post_ID' => $post->ID,
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertSame( 1, did_action( $error ) );
		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_to_scheduled_post_returns_error() {

		// Same error as commenting on a draft
		$error = 'comment_on_draft';

		$this->assertSame( 0, did_action( $error ) );

		$post = self::factory()->post->create_and_get( array(
			'post_date' => date( 'Y-m-d H:i:s', strtotime( '+1 day' ) ),
		) );

		$this->assertSame( 'future', $post->post_status );

		$data = array(
			'comment_post_ID' => $post->ID,
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertSame( 1, did_action( $error ) );
		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_to_password_required_post_returns_error() {

		$error = 'comment_on_password_protected';

		$this->assertSame( 0, did_action( $error ) );

		$post = self::factory()->post->create_and_get( array(
			'post_password' => 'password',
		) );
		$data = array(
			'comment_post_ID' => $post->ID,
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertSame( 1, did_action( $error ) );
		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_to_password_protected_post_succeeds() {

		$password = 'password';
		$hasher   = new PasswordHash( 8, true );

		$_COOKIE['wp-postpass_' . COOKIEHASH] = $hasher->HashPassword( $password );

		$post = self::factory()->post->create_and_get( array(
			'post_password' => $password,
		) );
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment',
			'author'          => 'Comment Author',
			'email'           => 'comment@example.org',
		);
		$comment = wp_handle_comment_submission( $data );

		unset( $_COOKIE['wp-postpass_' . COOKIEHASH] );

		$this->assertNotWPError( $comment );
		$this->assertInstanceOf( 'WP_Comment', $comment );

	}

	public function test_submitting_valid_comment_as_logged_in_user_succeeds() {

		$user = self::factory()->user->create_and_get( array(
			'user_url' => 'http://user.example.org'
		) );

		wp_set_current_user( $user->ID );

		$post = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment',
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertNotWPError( $comment );
		$this->assertInstanceOf( 'WP_Comment', $comment );

		$this->assertSame( 'Comment', $comment->comment_content);
		$this->assertSame( $user->display_name, $comment->comment_author );
		$this->assertSame( $user->user_email, $comment->comment_author_email );
		$this->assertSame( $user->user_url, $comment->comment_author_url );
		$this->assertSame( $user->ID, intval( $comment->user_id ) );

	}

	public function test_submitting_valid_comment_anonymously_succeeds() {

		$post = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment',
			'author'          => 'Comment Author',
			'email'           => 'comment@example.org',
			'url'             => 'user.example.org'
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertNotWPError( $comment );
		$this->assertInstanceOf( 'WP_Comment', $comment );

		$this->assertSame( 'Comment', $comment->comment_content);
		$this->assertSame( 'Comment Author', $comment->comment_author );
		$this->assertSame( 'comment@example.org', $comment->comment_author_email );
		$this->assertSame( 'http://user.example.org', $comment->comment_author_url );
		$this->assertSame( '0', $comment->user_id );

	}

	/**
	 * wp_handle_comment_submission() expects un-slashed data.
	 *
	 * @group slashes
	 */
	public function test_submitting_comment_handles_slashes_correctly_handles_slashes() {

		$post = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment with 1 slash: \\',
			'author'          => 'Comment Author with 1 slash: \\',
			'email'           => 'comment@example.org',
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertNotWPError( $comment );
		$this->assertInstanceOf( 'WP_Comment', $comment );

		$this->assertSame( 'Comment with 1 slash: \\', $comment->comment_content);
		$this->assertSame( 'Comment Author with 1 slash: \\', $comment->comment_author );
		$this->assertSame( 'comment@example.org', $comment->comment_author_email );

	}

	public function test_submitting_comment_anonymously_to_private_post_returns_error() {

		$error = 'comment_id_not_found';

		$post = self::factory()->post->create_and_get( array(
			'post_status' => 'private',
		) );
		$data = array(
			'comment_post_ID' => $post->ID,
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertFalse( is_user_logged_in() );
		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_as_logged_in_user_to_inaccessible_private_post_returns_error() {

		$error  = 'comment_id_not_found';

		$author = self::factory()->user->create_and_get( array(
			'role' => 'author',
		) );
		$user   = self::factory()->user->create_and_get( array(
			'role' => 'author',
		) );

		wp_set_current_user( $user->ID );

		$post = self::factory()->post->create_and_get( array(
			'post_status' => 'private',
			'post_author' => $author->ID,
		) );
		$data = array(
			'comment_post_ID' => $post->ID,
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertFalse( current_user_can( 'read_post', $post->ID ) );
		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_to_private_post_with_closed_comments_returns_correct_error() {

		$error  = 'comment_id_not_found';

		$author = self::factory()->user->create_and_get( array(
			'role' => 'author',
		) );
		$user   = self::factory()->user->create_and_get( array(
			'role' => 'author',
		) );

		wp_set_current_user( $user->ID );

		$post = self::factory()->post->create_and_get( array(
			'post_status'    => 'private',
			'post_author'    => $author->ID,
			'comment_status' => 'closed',
		) );
		$data = array(
			'comment_post_ID' => $post->ID,
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertFalse( current_user_can( 'read_post', $post->ID ) );
		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_to_own_private_post_succeeds() {

		$user = self::factory()->user->create_and_get();

		wp_set_current_user( $user->ID );

		$post = self::factory()->post->create_and_get( array(
			'post_status' => 'private',
			'post_author' => $user->ID,
		) );
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment',
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertTrue( current_user_can( 'read_post', $post->ID ) );
		$this->assertNotWPError( $comment );
		$this->assertInstanceOf( 'WP_Comment', $comment );

	}

	public function test_submitting_comment_to_accessible_private_post_succeeds() {

		$author = self::factory()->user->create_and_get( array(
			'role' => 'author',
		) );
		$user = self::factory()->user->create_and_get( array(
			'role' => 'editor',
		) );

		wp_set_current_user( $user->ID );

		$post = self::factory()->post->create_and_get( array(
			'post_status' => 'private',
			'post_author' => $author->ID,
		) );
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment',
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertTrue( current_user_can( 'read_post', $post->ID ) );
		$this->assertNotWPError( $comment );
		$this->assertInstanceOf( 'WP_Comment', $comment );

	}

	public function test_anonymous_user_cannot_comment_unfiltered_html() {

		$post = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment <script>alert(document.cookie);</script>',
			'author'          => 'Comment Author',
			'email'           => 'comment@example.org',
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertNotWPError( $comment );
		$this->assertInstanceOf( 'WP_Comment', $comment );
		$this->assertNotContains( '<script', $comment->comment_content );

	}

	public function test_unprivileged_user_cannot_comment_unfiltered_html() {

		$user = self::factory()->user->create_and_get( array(
			'role' => 'author',
		) );
		wp_set_current_user( $user->ID );

		$this->assertFalse( current_user_can( 'unfiltered_html' ) );

		$post = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment <script>alert(document.cookie);</script>',
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertNotWPError( $comment );
		$this->assertInstanceOf( 'WP_Comment', $comment );
		$this->assertNotContains( '<script', $comment->comment_content );

	}

	public function test_unprivileged_user_cannot_comment_unfiltered_html_even_with_valid_nonce() {

		$user = self::factory()->user->create_and_get( array(
			'role' => 'author',
		) );
		wp_set_current_user( $user->ID );

		$this->assertFalse( current_user_can( 'unfiltered_html' ) );

		$post   = self::factory()->post->create_and_get();
		$action = 'unfiltered-html-comment_' . $post->ID;
		$nonce  = wp_create_nonce( $action );

		$this->assertNotEmpty( wp_verify_nonce( $nonce, $action ) );

		$data = array(
			'comment_post_ID'             => $post->ID,
			'comment'                     => 'Comment <script>alert(document.cookie);</script>',
			'_wp_unfiltered_html_comment' => $nonce,
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertNotWPError( $comment );
		$this->assertInstanceOf( 'WP_Comment', $comment );
		$this->assertNotContains( '<script', $comment->comment_content );

	}

	public function test_privileged_user_can_comment_unfiltered_html_with_valid_nonce() {

		$this->assertFalse( defined( 'DISALLOW_UNFILTERED_HTML' ) );

		$user = self::factory()->user->create_and_get( array(
			'role' => 'editor',
		) );

		if ( is_multisite() ) {
			// In multisite, only Super Admins can post unfiltered HTML
			$this->assertFalse( user_can( $user->ID, 'unfiltered_html' ) );
			grant_super_admin( $user->ID );
		}

		wp_set_current_user( $user->ID );

		$this->assertTrue( current_user_can( 'unfiltered_html' ) );

		$post   = self::factory()->post->create_and_get();
		$action = 'unfiltered-html-comment_' . $post->ID;
		$nonce  = wp_create_nonce( $action );

		$this->assertNotEmpty( wp_verify_nonce( $nonce, $action ) );

		$data = array(
			'comment_post_ID'             => $post->ID,
			'comment'                     => 'Comment <script>alert(document.cookie);</script>',
			'_wp_unfiltered_html_comment' => $nonce,
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertNotWPError( $comment );
		$this->assertInstanceOf( 'WP_Comment', $comment );
		$this->assertContains( '<script', $comment->comment_content );

	}

	public function test_privileged_user_cannot_comment_unfiltered_html_without_valid_nonce() {

		$user = self::factory()->user->create_and_get( array(
			'role' => 'editor',
		) );

		if ( is_multisite() ) {
			// In multisite, only Super Admins can post unfiltered HTML
			$this->assertFalse( user_can( $user->ID, 'unfiltered_html' ) );
			grant_super_admin( $user->ID );
		}

		wp_set_current_user( $user->ID );

		$this->assertTrue( current_user_can( 'unfiltered_html' ) );

		$post   = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment <script>alert(document.cookie);</script>',
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertNotWPError( $comment );
		$this->assertInstanceOf( 'WP_Comment', $comment );
		$this->assertNotContains( '<script', $comment->comment_content );

	}

	public function test_submitting_comment_as_anonymous_user_when_registration_required_returns_error() {

		$error = 'not_logged_in';

		$_comment_registration = get_option( 'comment_registration' );
		update_option( 'comment_registration', '1' );

		$post = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
		);
		$comment = wp_handle_comment_submission( $data );

		update_option( 'comment_registration', $_comment_registration );

		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_with_no_name_when_name_email_required_returns_error() {

		$error = 'require_name_email';

		$_require_name_email = get_option( 'require_name_email' );
		update_option( 'require_name_email', '1' );

		$post = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment',
			'email'           => 'comment@example.org',
		);
		$comment = wp_handle_comment_submission( $data );

		update_option( 'require_name_email', $_require_name_email );

		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_with_no_email_when_name_email_required_returns_error() {

		$error = 'require_name_email';

		$_require_name_email = get_option( 'require_name_email' );
		update_option( 'require_name_email', '1' );

		$post = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment',
			'author'          => 'Comment Author',
		);
		$comment = wp_handle_comment_submission( $data );

		update_option( 'require_name_email', $_require_name_email );

		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_with_invalid_email_when_name_email_required_returns_error() {

		$error = 'require_valid_email';

		$_require_name_email = get_option( 'require_name_email' );
		update_option( 'require_name_email', '1' );

		$post = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment',
			'author'          => 'Comment Author',
			'email'           => 'not_an_email',
		);
		$comment = wp_handle_comment_submission( $data );

		update_option( 'require_name_email', $_require_name_email );

		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	public function test_submitting_comment_with_no_comment_content_returns_error() {

		$error = 'require_valid_comment';

		$post = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => '',
			'author'          => 'Comment Author',
			'email'           => 'comment@example.org',
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );

	}

	/**
	 * @ticket 10377
	 */
	public function test_submitting_comment_with_content_too_long_returns_error() {
		$error = 'comment_content_column_length';

		$post = self::factory()->post->create_and_get();

		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => rand_long_str( 65536 ),
			'author'          => 'Comment Author',
			'email'           => 'comment@example.org',
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );
	}

	/**
	 * @ticket 10377
	 */
	public function test_submitting_comment_with_author_too_long_returns_error() {
		$error = 'comment_author_column_length';

		$post = self::factory()->post->create_and_get();

		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment',
			'author'          => rand_long_str( 255 ),
			'email'           => 'comment@example.org',
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );
	}

	/**
	 * @ticket 10377
	 */
	public function test_submitting_comment_with_email_too_long_returns_error() {
		$error = 'comment_author_email_column_length';

		$post = self::factory()->post->create_and_get();

		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment',
			'author'          => 'Comment Author',
			'email'           => rand_long_str( 90 ) . '@example.com',
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );
	}

	/**
	 * @ticket 10377
	 */
	public function test_submitting_comment_with_url_too_long_returns_error() {
		$error = 'comment_author_url_column_length';

		$post = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment',
			'author'          => 'Comment Author',
			'email'           => 'comment@example.org',
			'url'             => rand_long_str( 201 ),
		);
		$comment = wp_handle_comment_submission( $data );

		$this->assertWPError( $comment );
		$this->assertSame( $error, $comment->get_error_code() );
	}

	/**
	 * @ticket 34997
	 */
	public function test_comment_submission_sends_all_expected_parameters_to_preprocess_comment_filter() {

		$user = self::factory()->user->create_and_get( array(
			'role' => 'author',
		) );
		wp_set_current_user( $user->ID );

		$post = self::factory()->post->create_and_get();
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Comment',
		);

		add_filter( 'preprocess_comment', array( $this, 'filter_preprocess_comment' ) );

		$comment = wp_handle_comment_submission( $data );

		remove_filter( 'preprocess_comment', array( $this, 'filter_preprocess_comment' ) );

		$this->assertNotWPError( $comment );
		$this->assertEquals( array(
			'comment_post_ID'      => $post->ID,
			'comment_author'       => $user->display_name,
			'comment_author_email' => $user->user_email,
			'comment_author_url'   => $user->user_url,
			'comment_content'      => $data['comment'],
			'comment_type'         => '',
			'comment_parent'       => '0',
			'user_ID'              => $user->ID,
			'user_id'              => $user->ID,
		), $this->preprocess_comment_data );

	}

	public function filter_preprocess_comment( $commentdata ) {
		$this->preprocess_comment_data = $commentdata;
		return $commentdata;
	}

	/**
	 * @ticket 36901
	 */
	public function test_submitting_duplicate_comments() {
		$post = self::factory()->post->create_and_get( array(
			'post_status' => 'publish',
		) );
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Did I say that?',
			'author'          => 'Repeat myself',
			'email'           => 'mail@example.com',
		);
		$first_comment = wp_handle_comment_submission( $data );
		$second_comment = wp_handle_comment_submission( $data );
		$this->assertWPError( $second_comment );
		$this->assertSame( 'comment_duplicate', $second_comment->get_error_code() );
	}

	/**
	 * @ticket 36901
	 */
	public function test_comments_flood() {
		$post = self::factory()->post->create_and_get( array(
			'post_status' => 'publish',
		) );
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Did I say that?',
			'author'          => 'Repeat myself',
			'email'           => 'mail@example.com',
		);
		$first_comment = wp_handle_comment_submission( $data );

		$data['comment'] = 'Wow! I am quick!';
		$second_comment = wp_handle_comment_submission( $data );

		$this->assertWPError( $second_comment );
		$this->assertSame( 'comment_flood', $second_comment->get_error_code() );
	}

	/**
	 * @ticket 36901
	 */
	public function test_comments_flood_user_is_admin() {
		$user = self::factory()->user->create_and_get( array(
			'role' => 'administrator',
		) );
		wp_set_current_user( $user->ID );

		$post = self::factory()->post->create_and_get( array(
			'post_status' => 'publish',
		) );
		$data = array(
			'comment_post_ID' => $post->ID,
			'comment'         => 'Did I say that?',
			'author'          => 'Repeat myself',
			'email'           => 'mail@example.com',
		);
		$first_comment = wp_handle_comment_submission( $data );

		$data['comment'] = 'Wow! I am quick!';
		$second_comment = wp_handle_comment_submission( $data );

		$this->assertNotWPError( $second_comment );
		$this->assertEquals( $post->ID, $second_comment->comment_post_ID );
	}
}
