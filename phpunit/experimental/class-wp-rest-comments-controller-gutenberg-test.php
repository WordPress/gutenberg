<?php
/**
 * Unit tests covering WP_Test_REST_Comments_Controller_Gutenberg functionality.
 *
 * @package Gutenberg
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
			'anonymous user'               => array( 'none', 'heart', false, 'rest_comment_login_required', 401 ),
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

	public function test_schema_includes_reaction_emojis() {
		$controller = new Gutenberg_REST_Comment_Controller_7_1();
		$schema     = $controller->get_item_schema();

		$this->assertArrayHasKey( 'reaction_emojis', $schema['properties'] );

		$reaction_emojis_schema = $schema['properties']['reaction_emojis'];
		$this->assertTrue( $reaction_emojis_schema['readonly'] );
		$this->assertSame( 'array', $reaction_emojis_schema['type'] );
		$this->assertContains( 'view', $reaction_emojis_schema['context'] );
		$this->assertContains( 'edit', $reaction_emojis_schema['context'] );

		// Verify the default matches the helper function output.
		$expected = gutenberg_get_note_reaction_emojis();
		$this->assertSame( $expected, $reaction_emojis_schema['default'] );
	}

	public function test_reaction_emojis_filter_modifies_schema() {
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

		// Re-instantiate the controller so the schema picks up the filtered value.
		$controller = new Gutenberg_REST_Comment_Controller_7_1();
		$schema     = $controller->get_item_schema();

		$this->assertSame(
			$custom_emoji,
			$schema['properties']['reaction_emojis']['default']
		);

		remove_filter( 'gutenberg_note_reaction_emojis', $filter );
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

		remove_filter( 'gutenberg_note_reaction_emojis', $filter );
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
}
