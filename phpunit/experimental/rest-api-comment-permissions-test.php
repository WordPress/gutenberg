<?php
/**
 * REST API test for block_comment permissions.
 *
 * Test that permissions are adjusted successfully for block comments.
 * The block comments feature should be available for any user who can edit the post.
 *
 * @package Gutenberg
 * @group block-comments
 */
class WP_Test_REST_Block_Comment_Permissions extends WP_Test_REST_TestCase {

	/**
	 * @var int The number of comments to create for testing.
	 */
	protected static $num_comments = 10;

	/**
	 * User IDs for various roles.
	 *
	 * @var array<string, int> Associative array mapping role names to user IDs.
	 */
	protected static $user_ids = array();

	/**
	 * Test post to add comments to.
	 *
	 * @var int The post ID.
	 */
	protected static $post_id;

	/**
	 * Setup helper, create test users of admin, editor, author, contributor, and subscriber roles.
	 */
	public function set_up() {
		parent::set_up();

		$roles = array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' );
		foreach ( $roles as $role ) {
			self::$user_ids[ $role ] = $this->factory->user->create( array( 'role' => $role ) );
		}
	}

	public function tear_down() {
		foreach ( self::$user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		parent::tear_down();
	}

	/**
	 * Create a test post with standard comments and block comments.
	 *
	 * @return string $role The role of the user creating the post.
	 */
	public function create_test_post_with_block_comment( $role ) {
		$user_id = self::$user_ids[ $role ];
		$post_id = $this->factory->post->create(
			array(
				'post_title'   => 'Test Post for Block Comments',
				'post_content' => 'This is a test post to check block comment permissions.',
				'post_status'  => 'contributor' === $role ? 'draft' : 'publish',
				'post_author'  => $user_id,
			)
		);

		for ( $i = 0; $i < self::$num_comments; $i++ ) {
			$this->factory->comment->create(
				array(
					'comment_post_ID'  => $post_id,
					'comment_type'     => 'note',
					'comment_approved' => 0 === $i % 2 ? 1 : 0,
				)
			);
		}

		return $post_id;
	}

	public function test_cannot_read_comments_without_post_type_support() {
		register_post_type(
			'no-block-comments',
			array(
				'label'        => 'No Block Comments',
				'supports'     => array( 'title', 'editor', 'author', 'comments' ),
				'show_in_rest' => true,
				'public'       => true,
			)
		);

		// Core calls this method but it fails for gutenberg tests.
		// See: https://github.com/WordPress/wordpress-develop/blob/8c2ec298ad82d32f6bd66fae5ec567d287bd6bbf/tests/phpunit/tests/rest-api/rest-comments-controller.php#L3461-L3470.
		// create_initial_rest_routes();

		wp_set_current_user( self::$user_ids['administrator'] );

		$post_id = self::factory()->post->create( array( 'post_type' => 'no-block-comments' ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'context', 'edit' );

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_comment_not_supported_post_type', $response, 403 );
	}

	public function test_create_block_comment_require_login() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', 'note' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_comment_login_required', $response, 401 );
	}

	public function test_cannot_create_block_comment_without_post_type_support() {
		register_post_type(
			'no-block-comments',
			array(
				'label'        => 'No Block Comments',
				'supports'     => array( 'title', 'editor', 'author', 'comments' ),
				'show_in_rest' => true,
				'public'       => true,
			)
		);

		wp_set_current_user( self::$user_ids['administrator'] );
		$post_id = self::factory()->post->create( array( 'post_type' => 'no-block-comments' ) );
		$params  = array(
			'post'         => $post_id,
			'author_name'  => 'Ishmael',
			'author_email' => 'herman-melville@earthlink.net',
			'author_url'   => 'https://en.wikipedia.org/wiki/Herman_Melville',
			'content'      => 'Call me Ishmael.',
			'author'       => self::$user_ids['administrator'],
			'type'         => 'note',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_comment_not_supported_post_type', $response, 403 );
	}

	public function test_create_block_comment_draft_post() {
		wp_set_current_user( self::$user_ids['editor'] );
		$draft_id = $this->factory->post->create(
			array(
				'post_status' => 'draft',
			)
		);
		$params   = array(
			'post'         => $draft_id,
			'author_name'  => 'Ishmael',
			'author_email' => 'herman-melville@earthlink.net',
			'author_url'   => 'https://en.wikipedia.org/wiki/Herman_Melville',
			'content'      => 'Call me Ishmael.',
			'author'       => self::$user_ids['editor'],
			'type'         => 'note',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );

		$response    = rest_get_server()->dispatch( $request );
		$data        = $response->get_data();
		$new_comment = get_comment( $data['id'] );
		$this->assertSame( 'Call me Ishmael.', $new_comment->comment_content );
		$this->assertSame( 'note', $new_comment->comment_type );
	}

	public function test_create_block_comment_status() {
		wp_set_current_user( self::$user_ids['author'] );
		$post_id = $this->factory->post->create( array( 'post_author' => self::$user_ids['author'] ) );

		$params = array(
			'post'         => $post_id,
			'author_name'  => 'Ishmael',
			'author_email' => 'herman-melville@earthlink.net',
			'author_url'   => 'https://en.wikipedia.org/wiki/Herman_Melville',
			'content'      => 'Comic Book Guy',
			'author'       => self::$user_ids['author'],
			'type'         => 'note',
			'status'       => 'hold',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );

		$response    = rest_get_server()->dispatch( $request );
		$data        = $response->get_data();
		$new_comment = get_comment( $data['id'] );

		$this->assertSame( '0', $new_comment->comment_approved );
		$this->assertSame( 'note', $new_comment->comment_type );
	}

	public function test_cannot_create_with_non_valid_comment_type() {
		wp_set_current_user( self::$user_ids['administrator'] );
		$post_id = $this->factory->post->create();

		$params = array(
			'post'         => $post_id,
			'author_name'  => 'Ishmael',
			'author_email' => 'herman-melville@earthlink.net',
			'author_url'   => 'https://en.wikipedia.org/wiki/Herman_Melville',
			'content'      => 'Comic Book Guy',
			'author'       => self::$user_ids['administrator'],
			'type'         => 'review',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_comment_type', $response, 400 );
	}

	public function test_create_assigns_default_type() {
		wp_set_current_user( self::$user_ids['editor'] );
		$post_id = $this->factory->post->create();

		$params = array(
			'post'         => $post_id,
			'author_name'  => 'Ishmael',
			'author_email' => 'herman-melville@earthlink.net',
			'author_url'   => 'https://en.wikipedia.org/wiki/Herman_Melville',
			'content'      => 'Comic Book Guy',
			'author'       => self::$user_ids['editor'],
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );

		$response    = rest_get_server()->dispatch( $request );
		$data        = $response->get_data();
		$new_comment = get_comment( $data['id'] );

		$this->assertSame( 'comment', $new_comment->comment_type );
	}

	/**
	 * Test that empty block comments with resolution metadata are allowed.
	 *
	 * @param string $status The status of the block comment.
	 *
	 * @dataProvider data_note_status_provider
	 */
	public function test_create_empty_block_comment_with_resolution_meta( $status ) {
		wp_set_current_user( self::$user_ids['editor'] );
		$post_id = $this->factory->post->create();
		$params  = array(
			'post'         => $post_id,
			'author_name'  => 'Editor',
			'author_email' => 'editor@example.com',
			'author_url'   => 'https://example.com',
			'author'       => self::$user_ids['editor'],
			'type'         => 'note',
			'content'      => '',
			'meta'         => array(
				'_wp_note_status' => $status,
			),
		);
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status() );
	}

	/**
	 * Test that empty block comments without resolution metadata are not allowed.
	 */
	public function test_cannot_create_empty_block_comment_without_resolution_meta() {
		wp_set_current_user( self::$user_ids['editor'] );
		$post_id = $this->factory->post->create();
		$params  = array(
			'post'         => $post_id,
			'author_name'  => 'Editor',
			'author_email' => 'editor@example.com',
			'author_url'   => 'https://example.com',
			'author'       => self::$user_ids['editor'],
			'type'         => 'note',
			'content'      => '',
		);
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_comment_content_invalid', $response, 400 );
	}

	/**
	 * Test that empty block comments with invalid resolution metadata are not allowed.
	 */
	public function test_cannot_create_empty_block_comment_with_invalid_resolution_meta() {
		wp_set_current_user( self::$user_ids['editor'] );
		$post_id = $this->factory->post->create();
		$params  = array(
			'post'         => $post_id,
			'author_name'  => 'Editor',
			'author_email' => 'editor@example.com',
			'author_url'   => 'https://example.com',
			'author'       => self::$user_ids['editor'],
			'type'         => 'note',
			'content'      => '',
			'meta'         => array(
				'_wp_note_status' => 'invalid',
			),
		);
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_comment_content_invalid', $response, 400 );
	}

	/**
	 * Test that duplicate block comments with resolution metadata are allowed.
	 */
	public function test_create_duplicate_block_comment() {
		wp_set_current_user( self::$user_ids['editor'] );
		$post_id = $this->factory->post->create();

		for ( $i = 0; $i < 2; $i++ ) {
			$params  = array(
				'post'         => $post_id,
				'author_name'  => 'Editor',
				'author_email' => 'editor@example.com',
				'author_url'   => 'https://example.com',
				'author'       => self::$user_ids['editor'],
				'type'         => 'note',
				'content'      => 'Doplicated comment',
			);
			$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
			$request->add_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $params ) );
			$response = rest_get_server()->dispatch( $request );
			$this->assertSame( 201, $response->get_status() );
		}
	}

	/**
	 * Test that for each user role, the permissions are correct when accessing comments.
	 *
	 * @param string $role The user role to test.
	 * @param string $post_author_role The role of the post author.
	 * @param bool $can_read The expected permission result.
	 *
	 * @dataProvider data_block_comment_get_items_permissions_data_provider
	 */
	public function test_block_comment_get_items_permissions_edit_context( $role, $post_author_role, $can_read ) {
		wp_set_current_user( self::$user_ids[ $role ] );
		$post_id = $this->create_test_post_with_block_comment( $post_author_role );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );
		$request->set_param( 'per_page', 100 );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );

		if ( $can_read ) {
			$comments = $response->get_data();
			$this->assertEquals( self::$num_comments, count( $comments ) );

		} else {
			$this->assertErrorResponse( 'rest_forbidden_context', $response, 403 );
		}

		wp_delete_post( $post_id, true );
	}

	/**
	 * Verify that when querying block comments for multiple posts, if the user does not have
	 * permission to read comments on all of the posts, a 403 is returned.
	 */
	public function test_block_comment_get_items_permissions_mixed_post_authors() {
		$author_post_id = $this->create_test_post_with_block_comment( 'author' );
		$editor_post_id = $this->create_test_post_with_block_comment( 'editor' );

		wp_set_current_user( self::$user_ids['author'] );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', array( $author_post_id, $editor_post_id ) );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );
		$request->set_param( 'per_page', 100 );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden_context', $response, 403 );

		wp_delete_post( $author_post_id, true );
		wp_delete_post( $editor_post_id, true );
	}

	/**
	 * Test that for each user role, the permissions are correct when accessing a comment.
	 *
	 * @param string $role The user role to test.
	 * @param string $post_author_role The role of the post author.
	 * @param bool $can_read The expected permission result.
	 *
	 * @dataProvider data_block_comment_get_items_permissions_data_provider
	 */
	public function test_block_comment_get_item_permissions_edit_context( $role, $post_author_role, $can_read ) {
		wp_set_current_user( self::$user_ids[ $role ] );

		$post_id = $this->factory->post->create(
			array(
				'post_title'   => 'Test Post for Block Comments',
				'post_content' => 'This is a test post to check block comment permissions.',
				'post_status'  => 'contributor' === $post_author_role ? 'draft' : 'publish',
				'post_author'  => self::$user_ids[ $post_author_role ],
			)
		);

		$comment_id = $this->factory->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				// Test with unapproved comment, which is more restrictive.
				'comment_approved' => 0,
				'user_id'          => self::$user_ids[ $post_author_role ],
			)
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments/' . $comment_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );

		if ( $can_read ) {
			$comment = $response->get_data();
			$this->assertEquals( $comment_id, $comment['id'] );

		} else {
			$this->assertErrorResponse( 'rest_forbidden_context', $response, 403 );
		}

		wp_delete_post( $post_id, true );
	}

	public function data_block_comment_get_items_permissions_data_provider() {
		return array(
			'Administrator can see block comments on other posts' => array( 'administrator', 'author', true ),
			'Editor can see block comments on other posts' => array( 'editor', 'contributor', true ),
			'Author cannot see block comments on other posts' => array( 'author', 'editor', false ),
			'Contributor cannot see block comments on other posts' => array( 'contributor', 'author', false ),
			'Subscriber cannot see block comments'         => array( 'subscriber', 'author', false ),
			'Author can see block comments on own post'    => array( 'author', 'author', true ),
			'Contributor can see block comments on own post' => array( 'contributor', 'contributor', true ),
		);
	}

	public function data_note_status_provider() {
		return array(
			'resolved' => array( 'resolved' ),
			'reopen'   => array( 'reopen' ),
		);
	}
}
