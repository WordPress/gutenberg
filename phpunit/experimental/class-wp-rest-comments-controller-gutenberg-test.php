<?php
/**
 * Tests for the Gutenberg REST comment controller subclass that backs block
 * notes and suggestions.
 *
 * Coverage areas:
 *   - **Permissions**: that post editors can create/read/update note comments
 *     under the `edit_post` shortcut; that suggestion-lifecycle updates
 *     (`status`, `meta._wp_suggestion_status`) are accepted while attempts
 *     to rewrite content/author/date fall back to the core `edit_comment`
 *     check; that contributors and subscribers are gated as expected.
 *   - **Suggestion meta round-trip**: that `_wp_suggestion` and
 *     `_wp_suggestion_status` survive create + read + update, and that the
 *     payload-size cap (`GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES`) is
 *     enforced with a 413 before the meta sanitize_callback can silently
 *     truncate the JSON.
 *   - **Note vs. regular comment divergence**: that `note`-typed comments
 *     follow the new permission model while plain `comment`-type traffic
 *     stays on core's defaults.
 *   - **Meta registration setup**: every test re-registers
 *     `gutenberg_register_block_comment_metadata()` because
 *     `WP_UnitTestCase_Base` wipes `$wp_meta_keys` between tests; without
 *     this hook REST sees `_wp_suggestion` as unregistered and silently
 *     no-ops on writes, masking real failures.
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
	 * Re-register the note/suggestion comment meta before each test.
	 *
	 * `WP_UnitTestCase_Base::tear_down()` wipes the global `$wp_meta_keys`
	 * registry between tests, but `gutenberg_register_block_comment_metadata`
	 * only fires once on `init`. Without this hook, REST writes to
	 * `_wp_suggestion` (and friends) silently no-op for any test after the
	 * first because the meta isn't recognized as a registered REST field.
	 */
	public function set_up() {
		parent::set_up();
		gutenberg_register_block_comment_metadata();
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
	 * Test that a suggestion payload can be stored and retrieved via meta.
	 */
	public function test_create_note_with_suggestion_meta() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );

		$payload = wp_json_encode(
			array(
				'schemaVersion' => 1,
				'blockName'     => 'core/paragraph',
				'baseRevision'  => '2026-04-15T00:00:00',
				'operations'    => array(
					array(
						'type'      => 'attribute-set',
						'attribute' => 'content',
						'before'    => 'Hello',
						'after'     => 'Hello world',
					),
				),
			)
		);

		$params = array(
			'post'    => $post_id,
			'content' => '',
			'type'    => 'note',
			'author'  => self::$editor_id,
			'meta'    => array(
				'_wp_suggestion' => $payload,
			),
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status() );

		$data       = $response->get_data();
		$comment_id = $data['id'] ?? null;
		$this->assertIsInt( $comment_id );

		// Bypass REST schema variability across WP versions and check the
		// stored meta directly. The sanitize_callback is in scope of this
		// test; the REST layer assembles schemas at runtime in a way that
		// isn't always available in the experimental phpunit harness.
		$stored = get_comment_meta( $comment_id, '_wp_suggestion', true );
		$this->assertNotEmpty( $stored, 'Suggestion meta should round-trip into storage.' );
		$decoded = json_decode( $stored, true );
		$this->assertSame( 'core/paragraph', $decoded['blockName'] ?? null );
		$this->assertSame( 1, $decoded['schemaVersion'] ?? null );
		$this->assertCount( 1, $decoded['operations'] ?? array() );
	}

	/**
	 * Test that an editor can update a note they did not author (edit_post check).
	 */
	public function test_editor_can_update_note_on_own_post() {
		wp_set_current_user( self::$admin_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );

		// Admin creates a note on editor's post.
		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => 1,
				'user_id'          => self::$admin_id,
				'comment_content'  => 'suggestion note',
			)
		);

		// Editor (post author) updates the note they did not author.
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $comment_id );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'status' => 'approved',
					'meta'   => array(
						'_wp_suggestion_status' => 'applied',
					),
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		// The suggestion-lifecycle override passed because the editor owns
		// the parent post; the update succeeds with a 200 status.
		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * Test that a subscriber cannot update a note on someone else's post.
	 */
	public function test_subscriber_cannot_update_note() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );

		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'comment_type'    => 'note',
				'user_id'         => self::$editor_id,
				'comment_content' => 'a suggestion',
			)
		);

		// Subscriber tries to update the note.
		wp_set_current_user( self::$subscriber_id );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $comment_id );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'meta' => array(
						'_wp_suggestion_status' => 'rejected',
					),
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/**
	 * Test that _wp_suggestion_status does not persist invalid enum values.
	 */
	public function test_suggestion_status_ignores_invalid_value() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );

		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => 1,
				'user_id'          => self::$editor_id,
			)
		);

		// First set a valid value.
		update_comment_meta( $comment_id, '_wp_suggestion_status', 'pending' );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $comment_id );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'meta' => array(
						'_wp_suggestion_status' => 'invalid_value',
					),
				)
			)
		);

		rest_get_server()->dispatch( $request );
		// Even if the request succeeds, the invalid value should not
		// overwrite the existing valid value.
		$stored = get_comment_meta( $comment_id, '_wp_suggestion_status', true );
		$this->assertSame( 'pending', $stored );
	}

	/**
	 * Test that a subscriber cannot apply a suggestion even if the request
	 * only touches the suggestion-lifecycle fields.
	 */
	public function test_subscriber_cannot_apply_suggestion() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );

		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => 1,
				'user_id'          => self::$editor_id,
				'comment_content'  => '',
			)
		);

		wp_set_current_user( self::$subscriber_id );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $comment_id );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'status' => 'approved',
					'meta'   => array(
						'_wp_suggestion_status' => 'applied',
					),
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_edit', $response, 403 );
	}

	/**
	 * Test that creating a note with an oversized suggestion payload is
	 * rejected with a clear 413 error rather than silently truncated.
	 */
	public function test_create_rejects_oversized_suggestion_payload() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );

		$oversized = str_repeat( 'a', GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES + 1 );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'content' => '',
					'type'    => 'note',
					'meta'    => array(
						'_wp_suggestion' => $oversized,
					),
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_suggestion_too_large', $response, 413 );
	}

	/**
	 * Test that updating a note with an oversized suggestion payload is
	 * rejected with a clear 413 error.
	 */
	public function test_update_rejects_oversized_suggestion_payload() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );

		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => 1,
				'user_id'          => self::$editor_id,
				'comment_content'  => 'a suggestion',
			)
		);

		$oversized = str_repeat( 'a', GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES + 1 );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $comment_id );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'meta' => array(
						'_wp_suggestion' => $oversized,
					),
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_suggestion_too_large', $response, 413 );
	}

	/**
	 * Test that the sanitize_callback rejects rather than truncates an
	 * oversized payload reaching the meta layer through a non-REST path.
	 * Truncating mid-string would corrupt the JSON.
	 */
	public function test_sanitize_callback_rejects_oversized_value() {
		$post_id    = self::factory()->post->create();
		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'comment_type'    => 'note',
			)
		);

		$oversized = str_repeat( 'a', GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES + 1 );
		update_comment_meta( $comment_id, '_wp_suggestion', $oversized );

		$stored = get_comment_meta( $comment_id, '_wp_suggestion', true );
		$this->assertSame( '', $stored, 'Oversized payload should be rejected, not truncated.' );
	}

	/**
	 * Test that `is_suggestion_lifecycle_update` correctly rejects
	 * request bodies that touch fields outside the suggestion-lifecycle
	 * allowlist. We assert against the private helper via a request
	 * probe rather than through the full REST dispatch because actual
	 * permission behavior for `edit_comment` on a foreign note on a
	 * post the current user authored is governed by core's
	 * `map_meta_cap` for `edit_comment` (which delegates to `edit_post`
	 * on the comment's parent post) — outside the scope of this override.
	 */
	public function test_lifecycle_update_rejects_non_allowlisted_fields() {
		$cases = array(
			'content field blocks shortcut'        => array(
				'body'     => array(
					'status'  => 'approved',
					'content' => 'rewritten',
				),
				'expected' => false,
			),
			'only id/status/meta passes shortcut'  => array(
				'body'     => array(
					'status' => 'approved',
					'meta'   => array(
						'_wp_suggestion_status' => 'applied',
					),
				),
				'expected' => true,
			),
			'non-approved status blocks shortcut'  => array(
				'body'     => array(
					'status' => 'spam',
				),
				'expected' => false,
			),
			'non-allowlisted meta blocks shortcut' => array(
				'body'     => array(
					'meta' => array(
						'_wp_note_status' => 'resolved',
					),
				),
				'expected' => false,
			),
		);

		foreach ( $cases as $label => $case ) {
			$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/1' );
			$request->add_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $case['body'] ) );

			$reflection = new ReflectionMethod(
				'Gutenberg_REST_Comment_Suggestions_Controller',
				'is_suggestion_lifecycle_update'
			);
			// PHP < 8.1 requires explicit accessibility to invoke a private
			// method; from 8.1 it is automatic and setAccessible() is a no-op
			// that 8.5 deprecates, so only call it on older versions.
			if ( PHP_VERSION_ID < 80100 ) {
				$reflection->setAccessible( true );
			}

			$this->assertSame(
				$case['expected'],
				$reflection->invoke( null, $request ),
				"Lifecycle shortcut expectation mismatched for: {$label}"
			);
		}
	}

	/**
	 * Test that the lifecycle helper also accepts form-encoded request
	 * bodies, not only JSON. Custom integrations may issue updates with
	 * `application/x-www-form-urlencoded` and should benefit from the
	 * same `edit_post` shortcut as the JSON path.
	 */
	public function test_lifecycle_update_accepts_form_encoded_bodies() {
		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/1' );
		$request->add_header( 'Content-Type', 'application/x-www-form-urlencoded' );
		$request->set_body_params(
			array(
				'status' => 'approved',
				'meta'   => array(
					'_wp_suggestion_status' => 'applied',
				),
			)
		);

		$reflection = new ReflectionMethod(
			'Gutenberg_REST_Comment_Suggestions_Controller',
			'is_suggestion_lifecycle_update'
		);
		// PHP < 8.1 requires explicit accessibility to invoke a private
		// method; from 8.1 it is automatic and setAccessible() is a no-op
		// that 8.5 deprecates, so only call it on older versions.
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$this->assertTrue( $reflection->invoke( null, $request ) );
	}
}
