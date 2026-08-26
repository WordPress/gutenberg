<?php
/**
 * Unit tests covering WP_Test_REST_Comments_Controller_Gutenberg functionality.
 *
 * @package gutenberg
 */
class WP_Test_REST_Comments_Controller_Gutenberg extends WP_Test_REST_TestCase {
	protected static $admin_id;
	protected static $editor_id;
	protected static $contributor_id;
	protected static $subscriber_id;
	protected static $author_id;
	protected static $user_ids = array();
	protected static $post_id;
	protected static $num_notes = 10;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id       = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$editor_id      = $factory->user->create(
			array(
				'role' => 'editor',
			)
		);
		self::$contributor_id = $factory->user->create(
			array(
				'role' => 'contributor',
			)
		);
		self::$subscriber_id  = $factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);
		self::$author_id      = $factory->user->create(
			array(
				'role' => 'author',
			)
		);

		self::$user_ids = array(
			'administrator' => self::$admin_id,
			'editor'        => self::$editor_id,
			'contributor'   => self::$contributor_id,
			'subscriber'    => self::$subscriber_id,
			'author'        => self::$author_id,
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
		self::delete_user( self::$contributor_id );
		self::delete_user( self::$subscriber_id );
		self::delete_user( self::$author_id );
	}

	/**
	 * Create a test post with note.
	 *
	 * @param int $user_id Post author's user ID.
	 * @return int Post ID.
	 */
	protected function create_test_post_with_note( $role ) {
		$user_id = self::$user_ids[ $role ];
		$post_id = self::factory()->post->create(
			array(
				'post_title'   => 'Test Post for Notes',
				'post_content' => 'This is a test post to check note permissions.',
				'post_status'  => 'contributor' === $role ? 'draft' : 'publish',
				'post_author'  => $user_id,
			)
		);

		for ( $i = 0; $i < self::$num_notes; $i++ ) {
			self::factory()->comment->create(
				array(
					'comment_post_ID'  => $post_id,
					'comment_type'     => 'note',
					'comment_approved' => 0 === $i % 2 ? 1 : 0,
				)
			);
		}

		return $post_id;
	}

	public function test_cannot_read_note_without_post_type_support() {
		register_post_type(
			'no-notes',
			array(
				'label'        => 'No Notes',
				'supports'     => array( 'title', 'editor', 'author', 'comments' ),
				'show_in_rest' => true,
				'public'       => true,
			)
		);

		// Core calls this method but it fails for gutenberg tests.
		// See: https://github.com/WordPress/wordpress-develop/blob/8c2ec298ad82d32f6bd66fae5ec567d287bd6bbf/tests/phpunit/tests/rest-api/rest-comments-controller.php#L3461-L3470.
		// create_initial_rest_routes();

		wp_set_current_user( self::$admin_id );

		$post_id = self::factory()->post->create( array( 'post_type' => 'no-notes' ) );
		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'context', 'edit' );

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_comment_not_supported_post_type', $response, 403 );

		_unregister_post_type( 'no-notes' );
	}

	public function test_create_note_require_login() {
		wp_set_current_user( 0 );

		$post_id = self::factory()->post->create();
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'type', 'note' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_comment_login_required', $response, 401 );
	}

	public function test_cannot_create_note_without_post_type_support() {
		register_post_type(
			'no-note',
			array(
				'label'        => 'No Notes',
				'supports'     => array( 'title', 'editor', 'author', 'comments' ),
				'show_in_rest' => true,
				'public'       => true,
			)
		);

		wp_set_current_user( self::$admin_id );
		$post_id = self::factory()->post->create( array( 'post_type' => 'no-note' ) );
		$params  = array(
			'post'         => $post_id,
			'author_name'  => 'Ishmael',
			'author_email' => 'herman-melville@earthlink.net',
			'author_url'   => 'https://en.wikipedia.org/wiki/Herman_Melville',
			'content'      => 'Call me Ishmael.',
			'author'       => self::$admin_id,
			'type'         => 'note',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_comment_not_supported_post_type', $response, 403 );

		_unregister_post_type( 'no-note' );
	}

	public function test_create_note_draft_post() {
		wp_set_current_user( self::$editor_id );
		$draft_id = self::factory()->post->create(
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
			'author'       => self::$editor_id,
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

	public function test_create_note_status() {
		wp_set_current_user( self::$author_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$author_id ) );

		$params = array(
			'post'         => $post_id,
			'author_name'  => 'Ishmael',
			'author_email' => 'herman-melville@earthlink.net',
			'author_url'   => 'https://en.wikipedia.org/wiki/Herman_Melville',
			'content'      => 'Comic Book Guy',
			'author'       => self::$author_id,
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
		wp_set_current_user( self::$admin_id );
		$post_id = self::factory()->post->create();

		$params = array(
			'post'         => $post_id,
			'author_name'  => 'Ishmael',
			'author_email' => 'herman-melville@earthlink.net',
			'author_url'   => 'https://en.wikipedia.org/wiki/Herman_Melville',
			'content'      => 'Comic Book Guy',
			'author'       => self::$admin_id,
			'type'         => 'review',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_comment_type', $response, 400 );
	}

	public function test_create_assigns_default_type() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();

		$params = array(
			'post'         => $post_id,
			'author_name'  => 'Ishmael',
			'author_email' => 'herman-melville@earthlink.net',
			'author_url'   => 'https://en.wikipedia.org/wiki/Herman_Melville',
			'content'      => 'Comic Book Guy',
			'author'       => self::$editor_id,
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
	 * @dataProvider data_note_status_provider
	 */
	public function test_create_empty_note_with_resolution_meta( $status ) {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$params  = array(
			'post'         => $post_id,
			'author_name'  => 'Editor',
			'author_email' => 'editor@example.com',
			'author_url'   => 'https://example.com',
			'author'       => self::$editor_id,
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

	public function test_cannot_create_empty_note_without_resolution_meta() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$params  = array(
			'post'         => $post_id,
			'author_name'  => 'Editor',
			'author_email' => 'editor@example.com',
			'author_url'   => 'https://example.com',
			'author'       => self::$editor_id,
			'type'         => 'note',
			'content'      => '',
		);
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_comment_content_invalid', $response, 400 );
	}

	public function test_cannot_create_empty_note_with_invalid_resolution_meta() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$params  = array(
			'post'         => $post_id,
			'author_name'  => 'Editor',
			'author_email' => 'editor@example.com',
			'author_url'   => 'https://example.com',
			'author'       => self::$editor_id,
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

	public function test_create_duplicate_note() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();

		for ( $i = 0; $i < 2; $i++ ) {
			$params  = array(
				'post'         => $post_id,
				'author_name'  => 'Editor',
				'author_email' => 'editor@example.com',
				'author_url'   => 'https://example.com',
				'author'       => self::$editor_id,
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
	 * @dataProvider data_note_get_items_permissions_data_provider
	 */
	public function test_note_get_items_permissions_edit_context( $role, $post_author_role, $can_read ) {
		wp_set_current_user( self::$user_ids[ $role ] );
		$post_id = $this->create_test_post_with_note( $post_author_role );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );
		$request->set_param( 'per_page', 100 );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );

		if ( $can_read ) {
			$comments = $response->get_data();
			$this->assertEquals( self::$num_notes, count( $comments ) );

		} else {
			$this->assertErrorResponse( 'rest_forbidden_context', $response, 403 );
		}

		wp_delete_post( $post_id, true );
	}

	public function test_note_get_items_permissions_mixed_post_authors() {
		$author_post_id = $this->create_test_post_with_note( 'author' );
		$editor_post_id = $this->create_test_post_with_note( 'editor' );

		wp_set_current_user( self::$author_id );

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
	 * @dataProvider data_note_get_items_permissions_data_provider
	 */
	public function test_note_get_item_permissions_edit_context( $role, $post_author_role, $can_read ) {
		wp_set_current_user( self::$user_ids[ $role ] );

		$post_id = self::factory()->post->create(
			array(
				'post_title'   => 'Test Post for Block Comments',
				'post_content' => 'This is a test post to check block comment permissions.',
				'post_status'  => 'contributor' === $post_author_role ? 'draft' : 'publish',
				'post_author'  => self::$user_ids[ $post_author_role ],
			)
		);

		$comment_id = self::factory()->comment->create(
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

	public function data_note_get_items_permissions_data_provider() {
		return array(
			'Administrator can see note on other posts'  => array( 'administrator', 'author', true ),
			'Editor can see note on other posts'         => array( 'editor', 'contributor', true ),
			'Author cannot see note on other posts'      => array( 'author', 'editor', false ),
			'Contributor cannot see note on other posts' => array( 'contributor', 'author', false ),
			'Subscriber cannot see note'                 => array( 'subscriber', 'author', false ),
			'Author can see note on own post'            => array( 'author', 'author', true ),
			'Contributor can see note on own post'       => array( 'contributor', 'contributor', true ),
		);
	}

	public function data_note_status_provider() {
		return array(
			'resolved' => array( 'resolved' ),
			'reopen'   => array( 'reopen' ),
		);
	}

	/**
	 * Helper to create a note on a post.
	 *
	 * @param int $post_id Post ID.
	 * @param int $user_id User ID.
	 * @return int Note comment ID.
	 */
	protected function create_note( $post_id, $user_id ) {
		wp_set_current_user( $user_id );
		$params  = array(
			'post'    => $post_id,
			'content' => 'Test note for reactions',
			'author'  => $user_id,
			'type'    => 'note',
		);
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status(), 'Failed to create note for test setup.' );
		$data = $response->get_data();
		return $data['id'];
	}

	public function test_create_reaction() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		$params = array(
			'post'    => $post_id,
			'type'    => 'reaction',
			'parent'  => $note_id,
			'content' => 'heart',
			'author'  => self::$editor_id,
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 201, $response->get_status() );

		$data        = $response->get_data();
		$new_comment = get_comment( $data['id'] );
		$this->assertSame( 'reaction', $new_comment->comment_type );
		$this->assertSame( 'heart', $new_comment->comment_content );
		$this->assertSame( (string) $note_id, $new_comment->comment_parent );
		$this->assertSame( '1', $new_comment->comment_approved );
	}

	/**
	 * Reactions are an internal comment type and must not be world-readable,
	 * even when approved on a public post. Only the reacting user or a user who
	 * can edit the comment may read a reaction via GET /wp/v2/comments/{id}.
	 */
	public function test_reaction_not_publicly_readable() {
		$post_id     = self::factory()->post->create(
			array(
				'post_status' => 'publish',
				'post_author' => self::$editor_id,
			)
		);
		$note_id     = $this->create_note( $post_id, self::$editor_id );
		$reaction_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'reaction',
				'comment_approved' => 1,
				'comment_parent'   => $note_id,
				'comment_content'  => 'heart',
				'user_id'          => self::$editor_id,
			)
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments/' . $reaction_id );

		// Logged-out users cannot read the reaction.
		wp_set_current_user( 0 );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 401 );

		// A subscriber without edit access cannot read the reaction.
		wp_set_current_user( self::$subscriber_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_read', $response, 403 );

		// The reacting user can read their own reaction.
		wp_set_current_user( self::$editor_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $reaction_id, $response->get_data()['id'] );

		// An administrator who can edit the comment can read the reaction.
		wp_set_current_user( self::$admin_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		wp_delete_post( $post_id, true );
	}

	/**
	 * A reaction whose parent note belongs to a different post is rejected.
	 */
	public function test_cannot_create_reaction_on_note_from_different_post() {
		wp_set_current_user( self::$editor_id );
		$post_id       = self::factory()->post->create();
		$other_post_id = self::factory()->post->create();
		$note_id       = $this->create_note( $other_post_id, self::$editor_id );

		// `create_note()` flips the current user; reset for the reaction request.
		wp_set_current_user( self::$editor_id );

		$params = array(
			'post'    => $post_id,
			'type'    => 'reaction',
			'parent'  => $note_id,
			'content' => 'heart',
			'author'  => self::$editor_id,
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_comment_invalid_parent', $response, 400 );
	}

	/**
	 * Creating a note requires edit access to the target post.
	 */
	public function test_cannot_create_note_without_edit_post_capability() {
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );

		wp_set_current_user( self::$subscriber_id );

		$params = array(
			'post'    => $post_id,
			'content' => 'Subscriber note attempt',
			'type'    => 'note',
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_create_note', $response, rest_authorization_required_code() );
	}

	/**
	 * @dataProvider data_invalid_reaction_inputs
	 *
	 * @param string $parent_kind  One of 'none', 'note', or 'comment' — what the
	 *                             reaction's `parent` field references.
	 * @param string $content      The reaction storage key (slug) to submit.
	 * @param bool   $authenticate Whether to set the current user before posting.
	 * @param string $error_code   Expected WP_Error code on the REST response.
	 * @param int    $status       Expected HTTP status code.
	 */
	public function test_cannot_create_reaction_with_invalid_input( $parent_kind, $content, $authenticate, $error_code, $status ) {
		if ( $authenticate ) {
			wp_set_current_user( self::$editor_id );
		} else {
			wp_set_current_user( 0 );
		}

		$post_id = self::factory()->post->create();

		$params = array(
			'post'    => $post_id,
			'type'    => 'reaction',
			'content' => $content,
		);
		if ( $authenticate ) {
			$params['author'] = self::$editor_id;
		}

		if ( 'note' === $parent_kind ) {
			$params['parent'] = $this->create_note( $post_id, self::$editor_id );
		} elseif ( 'comment' === $parent_kind ) {
			$params['parent'] = self::factory()->comment->create(
				array(
					'comment_post_ID' => $post_id,
					'comment_type'    => 'comment',
				)
			);
		}

		// `create_note()` flips the current user; reset for the actual reaction request.
		if ( $authenticate ) {
			wp_set_current_user( self::$editor_id );
		}

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( $error_code, $response, $status );
	}

	public function data_invalid_reaction_inputs() {
		return array(
			'no parent'                    => array( 'none', 'heart', true, 'rest_comment_invalid_parent', 400 ),
			'parent is a regular comment'  => array( 'comment', 'heart', true, 'rest_comment_invalid_parent', 400 ),
			'content is not in emoji list' => array( 'note', 'invalid_emoji', true, 'rest_comment_invalid_reaction', 400 ),
			// Hex storage keys are accepted (see
			// `test_can_create_reaction_with_hex_key()`), but only when every
			// segment is an assignable Unicode code point.
			'hex above U+10FFFF'           => array( 'note', '110000', true, 'rest_comment_invalid_reaction', 400 ),
			'hex in surrogate range'       => array( 'note', 'd800', true, 'rest_comment_invalid_reaction', 400 ),
			'hex with a bad segment'       => array( 'note', '1f468-200d-dfff', true, 'rest_comment_invalid_reaction', 400 ),
			'uppercase hex key'            => array( 'note', '1F44D', true, 'rest_comment_invalid_reaction', 400 ),
			'anonymous user'               => array( 'none', 'heart', false, 'rest_comment_login_required', 401 ),
		);
	}

	/**
	 * A pick from the full emoji picker that is not in the curated list is
	 * submitted as a lowercase hex code-point sequence, which the picker
	 * decodes back into the emoji. Those keys must round-trip through create.
	 *
	 * @dataProvider data_valid_reaction_hex_keys
	 *
	 * @param string $slug The hex storage key to submit.
	 */
	public function test_can_create_reaction_with_hex_key( $slug ) {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'type'    => 'reaction',
					'parent'  => $note_id,
					'content' => $slug,
					'author'  => self::$editor_id,
				)
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 201, $response->get_status() );
		$reaction = get_comment( $response->get_data()['id'] );
		$this->assertSame( $slug, $reaction->comment_content );
	}

	public function data_valid_reaction_hex_keys() {
		return array(
			'single code point' => array( '1f44d' ),
			'ZWJ sequence'      => array( '1f468-200d-1f4bb' ),
			'two-digit key'     => array( 'a9' ),
		);
	}

	public function test_cannot_create_duplicate_reaction() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		$params = array(
			'post'    => $post_id,
			'type'    => 'reaction',
			'parent'  => $note_id,
			'content' => 'rocket',
			'author'  => self::$editor_id,
		);

		// First reaction should succeed.
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status() );

		// Duplicate reaction should fail.
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_comment_duplicate_reaction', $response, 409 );
	}

	/**
	 * The pre-insert uniqueness check is not atomic. Simulate a concurrent
	 * request winning the race - inserting the same reaction after this
	 * request's check but before its own insert - and assert the post-insert
	 * cleanup converges on a single surviving row.
	 */
	public function test_concurrent_duplicate_reaction_converges_to_single_row() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		// Insert a competing reaction while the request is mid-flight (after
		// its pre-insert check, before its own insert).
		$injected = false;
		$inject   = function ( $prepared ) use ( $note_id, $post_id, &$injected ) {
			if ( ! $injected && isset( $prepared['comment_type'] ) && 'reaction' === $prepared['comment_type'] ) {
				$injected = true;
				wp_insert_comment(
					array(
						'comment_post_ID'  => $post_id,
						'comment_parent'   => $note_id,
						'comment_type'     => 'reaction',
						'comment_content'  => 'heart',
						'comment_approved' => 1,
						'user_id'          => self::$editor_id,
					)
				);
			}
			return $prepared;
		};
		add_filter( 'rest_pre_insert_comment', $inject );

		try {
			$params  = array(
				'post'    => $post_id,
				'type'    => 'reaction',
				'parent'  => $note_id,
				'content' => 'heart',
				'author'  => self::$editor_id,
			);
			$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
			$request->add_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $params ) );
			$response = rest_get_server()->dispatch( $request );
			$this->assertSame( 201, $response->get_status() );
		} finally {
			remove_filter( 'rest_pre_insert_comment', $inject );
		}

		// Exactly one approved heart reaction should remain for this user/note.
		$remaining = get_comments(
			array(
				'parent'  => $note_id,
				'user_id' => self::$editor_id,
				'type'    => 'reaction',
				'status'  => 'approve',
			)
		);
		$hearts    = array_values(
			array_filter(
				$remaining,
				function ( $comment ) {
					return 'heart' === wp_strip_all_tags( $comment->comment_content );
				}
			)
		);
		$this->assertCount( 1, $hearts, 'Concurrent duplicate reactions should converge to a single row.' );

		// The response must reference the surviving (earliest) row.
		$this->assertSame( (int) $hearts[0]->comment_ID, $response->get_data()['id'] );
	}

	public function test_can_create_different_reactions_on_same_note() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		$emojis = array( 'heart', 'rocket', 'smile' );
		foreach ( $emojis as $emoji ) {
			$params  = array(
				'post'    => $post_id,
				'type'    => 'reaction',
				'parent'  => $note_id,
				'content' => $emoji,
				'author'  => self::$editor_id,
			);
			$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
			$request->add_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $params ) );
			$response = rest_get_server()->dispatch( $request );
			$this->assertSame( 201, $response->get_status() );
		}
	}

	/**
	 * @dataProvider data_valid_reaction_emojis
	 */
	public function test_create_reaction_valid_emojis( $emoji ) {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		$params = array(
			'post'    => $post_id,
			'type'    => 'reaction',
			'parent'  => $note_id,
			'content' => $emoji,
			'author'  => self::$editor_id,
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 201, $response->get_status() );
	}

	public function data_valid_reaction_emojis() {
		$emojis = gutenberg_get_note_reaction_emojis();
		$data   = array();
		foreach ( $emojis as $emoji ) {
			$data[ $emoji['value'] ] = array( $emoji['value'] );
		}
		return $data;
	}

	public function test_reaction_emojis_filter_affects_validation() {
		$custom_emoji = array(
			array(
				'emoji' => '👍',
				'label' => 'Thumbs Up',
				'value' => 'thumbsup',
			),
		);

		$filter = function () use ( $custom_emoji ) {
			return $custom_emoji;
		};
		add_filter( 'gutenberg_note_reaction_emojis', $filter );

		try {
			wp_set_current_user( self::$editor_id );
			$post_id = self::factory()->post->create();
			$note_id = $this->create_note( $post_id, self::$editor_id );

			// The custom emoji should be accepted.
			$params  = array(
				'post'    => $post_id,
				'type'    => 'reaction',
				'parent'  => $note_id,
				'content' => 'thumbsup',
				'author'  => self::$editor_id,
			);
			$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
			$request->add_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $params ) );
			$response = rest_get_server()->dispatch( $request );
			$this->assertSame( 201, $response->get_status() );

			// A previously-default emoji should now be rejected.
			$params['content'] = 'heart';
			$request           = new WP_REST_Request( 'POST', '/wp/v2/comments' );
			$request->add_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $params ) );
			$response = rest_get_server()->dispatch( $request );
			$this->assertErrorResponse( 'rest_comment_invalid_reaction', $response, 400 );
		} finally {
			// Always remove the filter so a failed assertion above does not
			// leak it into the rest of the suite.
			remove_filter( 'gutenberg_note_reaction_emojis', $filter );
		}
	}

	public function test_schema_includes_reaction_summary() {
		$controller = new Gutenberg_REST_Comment_Controller_7_1();
		$schema     = $controller->get_item_schema();

		$this->assertArrayHasKey( 'reaction_summary', $schema['properties'] );

		$reaction_summary_schema = $schema['properties']['reaction_summary'];
		$this->assertTrue( $reaction_summary_schema['readonly'] );
		$this->assertSame( 'object', $reaction_summary_schema['type'] );
		$this->assertContains( 'view', $reaction_summary_schema['context'] );
		$this->assertContains( 'edit', $reaction_summary_schema['context'] );

		// Verify additionalProperties structure.
		$this->assertArrayHasKey( 'additionalProperties', $reaction_summary_schema );
		$additional = $reaction_summary_schema['additionalProperties'];
		$this->assertArrayHasKey( 'count', $additional['properties'] );
		$this->assertArrayHasKey( 'reacted', $additional['properties'] );
		$this->assertArrayHasKey( 'my_reaction_id', $additional['properties'] );
	}

	public function test_note_response_includes_reaction_summary() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		// Add a reaction from the current user.
		$params  = array(
			'post'    => $post_id,
			'type'    => 'reaction',
			'parent'  => $note_id,
			'content' => 'heart',
			'author'  => self::$editor_id,
		);
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response    = rest_get_server()->dispatch( $request );
		$reaction_id = $response->get_data()['id'];

		// Fetch the note and verify reaction_summary is included.
		$request = new WP_REST_Request( 'GET', '/wp/v2/comments/' . $note_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'reaction_summary', $data );
		$this->assertArrayHasKey( 'heart', $data['reaction_summary'] );
		$this->assertSame( 1, $data['reaction_summary']['heart']['count'] );
		$this->assertTrue( $data['reaction_summary']['heart']['reacted'] );
		$this->assertSame( $reaction_id, $data['reaction_summary']['heart']['my_reaction_id'] );
	}

	public function test_reaction_summary_shows_not_reacted_for_other_user() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		// Add a reaction from the editor.
		$params  = array(
			'post'    => $post_id,
			'type'    => 'reaction',
			'parent'  => $note_id,
			'content' => 'heart',
			'author'  => self::$editor_id,
		);
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		rest_get_server()->dispatch( $request );

		// Switch to admin user and fetch the note.
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/comments/' . $note_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'reaction_summary', $data );
		$this->assertSame( 1, $data['reaction_summary']['heart']['count'] );
		$this->assertFalse( $data['reaction_summary']['heart']['reacted'] );
		$this->assertSame( 0, $data['reaction_summary']['heart']['my_reaction_id'] );
	}

	public function test_reaction_summary_empty_when_no_reactions() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments/' . $note_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'reaction_summary', $data );
		$this->assertEmpty( $data['reaction_summary'] );
	}

	public function test_notes_and_reactions_excluded_from_comment_count() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();

		self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_approved' => 1,
			)
		);
		$note_id = $this->create_note( $post_id, self::$editor_id );
		self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'reaction',
				'comment_parent'   => $note_id,
				'comment_content'  => 'heart',
				'comment_approved' => 1,
				'user_id'          => self::$editor_id,
			)
		);

		// Recount from the database so the assertion exercises the
		// filtered `wp_update_comment_count_now()` query directly rather
		// than the incremental adjustments comment creation applied.
		wp_update_comment_count_now( $post_id );
		clean_post_cache( $post_id );

		$this->assertSame(
			'1',
			get_post( $post_id )->comment_count,
			'Only the regular comment should be counted; notes and reactions must be excluded.'
		);
	}

	/**
	 * Creates an approved reaction row directly, bypassing REST validation.
	 *
	 * @param int    $post_id Post the parent note belongs to.
	 * @param int    $note_id Parent note comment ID.
	 * @param int    $user_id Reacting user ID.
	 * @param string $slug    Reaction storage slug.
	 * @return int Reaction comment ID.
	 */
	protected function create_reaction( $post_id, $note_id, $user_id, $slug = 'heart' ) {
		return wp_insert_comment(
			array(
				'comment_post_ID'  => $post_id,
				'comment_parent'   => $note_id,
				'comment_type'     => 'reaction',
				'comment_content'  => $slug,
				'comment_approved' => 1,
				'user_id'          => $user_id,
			)
		);
	}

	/**
	 * Reactions are validated as a set on create and the generic update route
	 * re-validates none of it, so updating one is not allowed at all.
	 */
	public function test_cannot_update_reaction() {
		wp_set_current_user( self::$editor_id );
		$post_id     = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$note_id     = $this->create_note( $post_id, self::$editor_id );
		$reaction_id = $this->create_reaction( $post_id, $note_id, self::$editor_id );

		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $reaction_id );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'content' => 'rocket' ) ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_comment_update_not_allowed', $response, 403 );
		$this->assertSame( 'heart', get_comment( $reaction_id )->comment_content );
	}

	/**
	 * The reactor's identity must not be reassignable through the update route.
	 */
	public function test_cannot_update_reaction_author() {
		$post_id     = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$note_id     = $this->create_note( $post_id, self::$editor_id );
		$reaction_id = $this->create_reaction( $post_id, $note_id, self::$author_id );

		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $reaction_id );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'author' => self::$editor_id ) ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_comment_update_not_allowed', $response, 403 );
		$this->assertSame( (string) self::$author_id, get_comment( $reaction_id )->user_id );
	}

	/**
	 * A reaction must not be movable onto a note on a post the user cannot edit.
	 */
	public function test_cannot_move_reaction_to_note_on_other_post() {
		$editable_post = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$other_post    = self::factory()->post->create( array( 'post_author' => self::$admin_id ) );
		$note_id       = $this->create_note( $editable_post, self::$editor_id );
		$other_note_id = $this->create_note( $other_post, self::$admin_id );
		$reaction_id   = $this->create_reaction( $editable_post, $note_id, self::$editor_id );

		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $reaction_id );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'parent' => $other_note_id,
					'post'   => $other_post,
				)
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_comment_update_not_allowed', $response, 403 );
		$reaction = get_comment( $reaction_id );
		$this->assertSame( (string) $note_id, $reaction->comment_parent );
		$this->assertSame( (string) $editable_post, $reaction->comment_post_ID );
	}

	/**
	 * Notes remain editable - only reactions are locked down.
	 */
	public function test_can_still_update_note() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$note_id = $this->create_note( $post_id, self::$editor_id );

		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $note_id );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'content' => 'Edited note' ) ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * `wp_delete_comment()` reparents children rather than deleting them, so
	 * without a cascade the reactions would outlive their note as orphan rows.
	 */
	public function test_permanently_deleting_note_deletes_its_reactions() {
		wp_set_current_user( self::$editor_id );
		$post_id     = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$note_id     = $this->create_note( $post_id, self::$editor_id );
		$reaction_id = $this->create_reaction( $post_id, $note_id, self::$editor_id );
		$other_id    = $this->create_reaction( $post_id, $note_id, self::$author_id, 'rocket' );

		wp_delete_comment( $note_id, true );

		$this->assertNull( get_comment( $reaction_id ), 'Reaction outlived its note.' );
		$this->assertNull( get_comment( $other_id ), 'Reaction outlived its note.' );
		$this->assertEmpty(
			get_comments(
				array(
					'post_id' => $post_id,
					'type'    => 'reaction',
					'status'  => 'all',
				)
			),
			'Reaction rows remained after permanent cleanup.'
		);
	}

	/**
	 * Deleting a reply must take that reply's own reactions with it.
	 */
	public function test_permanently_deleting_note_reply_deletes_its_reactions() {
		wp_set_current_user( self::$editor_id );
		$post_id  = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$note_id  = $this->create_note( $post_id, self::$editor_id );
		$reply_id = wp_insert_comment(
			array(
				'comment_post_ID'  => $post_id,
				'comment_parent'   => $note_id,
				'comment_type'     => 'note',
				'comment_content'  => 'A reply',
				'comment_approved' => 0,
				'user_id'          => self::$editor_id,
			)
		);

		$note_reaction_id  = $this->create_reaction( $post_id, $note_id, self::$editor_id );
		$reply_reaction_id = $this->create_reaction( $post_id, $reply_id, self::$editor_id );

		wp_delete_comment( $reply_id, true );

		$this->assertNull( get_comment( $reply_reaction_id ), 'Reply reaction outlived its reply.' );
		$this->assertNotNull( get_comment( $note_reaction_id ), 'Root note reaction should be untouched.' );
	}

	/**
	 * Core cascades a trashed note to its `note` children only.
	 */
	public function test_trashing_note_trashes_and_restores_its_reactions() {
		if ( ! EMPTY_TRASH_DAYS ) {
			$this->markTestSkipped( 'Trash is disabled; trashing force-deletes.' );
		}

		wp_set_current_user( self::$editor_id );
		$post_id     = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$note_id     = $this->create_note( $post_id, self::$editor_id );
		$reaction_id = $this->create_reaction( $post_id, $note_id, self::$editor_id );

		wp_trash_comment( $note_id );
		$this->assertSame( 'trash', wp_get_comment_status( $reaction_id ), 'Reaction stayed approved under a trashed note.' );

		wp_untrash_comment( $note_id );
		$this->assertSame( 'approved', wp_get_comment_status( $reaction_id ), 'Reaction was not restored with its note.' );
	}

	/**
	 * The cleanup in create_item() must repoint to the surviving row even when
	 * a competing request has already deleted this request's own row - the
	 * losing side of the same race the sibling test covers from the winner.
	 */
	public function test_concurrent_cleanup_deleting_own_row_still_returns_survivor() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		$survivor_id = 0;
		$deleted     = false;

		// Stand in for the competing request's cleanup: it keeps the earliest
		// row and deletes this request's later one, which lands first.
		$race = function ( $comment_id, $comment ) use ( &$survivor_id, &$deleted ) {
			if ( ! $deleted && 'reaction' === $comment->comment_type && (int) $comment_id !== $survivor_id ) {
				$deleted = true;
				wp_delete_comment( $comment_id, true );
			}
		};

		// Insert the competing row after this request's pre-insert uniqueness
		// check has passed, so it takes the earlier ID. Arm the cleanup only
		// once that row exists, so its own insert does not trigger it.
		$inject = function ( $prepared ) use ( $note_id, $post_id, $race, &$survivor_id ) {
			if ( ! $survivor_id && isset( $prepared['comment_type'] ) && 'reaction' === $prepared['comment_type'] ) {
				$survivor_id = wp_insert_comment(
					array(
						'comment_post_ID'  => $post_id,
						'comment_parent'   => $note_id,
						'comment_type'     => 'reaction',
						'comment_content'  => 'heart',
						'comment_approved' => 1,
						'user_id'          => self::$editor_id,
					)
				);
				add_action( 'wp_insert_comment', $race, 10, 2 );
			}
			return $prepared;
		};
		add_filter( 'rest_pre_insert_comment', $inject );

		try {
			$params  = array(
				'post'    => $post_id,
				'type'    => 'reaction',
				'parent'  => $note_id,
				'content' => 'heart',
				'author'  => self::$editor_id,
			);
			$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
			$request->add_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $params ) );
			$response = rest_get_server()->dispatch( $request );
		} finally {
			remove_filter( 'rest_pre_insert_comment', $inject );
			remove_action( 'wp_insert_comment', $race, 10 );
		}

		$this->assertTrue( $deleted, 'The race injection did not delete this request\'s row.' );
		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( $survivor_id, $response->get_data()['id'], 'Response did not repoint to the surviving row.' );
	}
}
