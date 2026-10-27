<?php
/**
 * Tests for the Gutenberg REST comment controller subclass that backs block
 * notes and suggestions.
 *
 * Coverage areas:
 *   - **Permissions**: that post editors can create/read/update note comments
 *     and apply suggestions through core's `edit_comment` check (mapped to
 *     `edit_post` on the parent post); that contributors and subscribers are
 *     gated as expected.
 *   - **Suggestion meta round-trip**: that `_wp_suggestion` and
 *     `_wp_suggestion_status` survive create + read + update, and that the
 *     payload-size cap (`GUTENBERG_SUGGESTION_PAYLOAD_MAX_BYTES`) is
 *     enforced with a 413 before the meta sanitize_callback can silently
 *     truncate the JSON.
 *   - **Note vs. regular comment divergence**: that `note`-typed comments
 *     follow the new permission model while plain `comment`-type traffic
 *     stays on core's defaults.
 *   - **Meta registration setup**: every test re-registers the note meta
 *     (`wp_create_initial_comment_meta()`, core) and the suggestion meta
 *     (`gutenberg_register_suggestion_meta()`, Gutenberg 7.1) because
 *     `WP_UnitTestCase_Base` wipes `$wp_meta_keys` between tests; without
 *     this REST sees `_wp_suggestion` as unregistered and silently
 *     no-ops on writes, masking real failures.
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
	 * Re-register the note/suggestion comment meta before each test.
	 *
	 * `WP_UnitTestCase_Base::tear_down()` wipes the global `$wp_meta_keys`
	 * registry between tests, but the meta is only registered once on `init`.
	 * Without re-registering, REST writes to `_wp_note_status` /
	 * `_wp_suggestion` (and friends) silently no-op for any test after the
	 * first because the meta isn't recognized as a registered REST field.
	 *
	 * `_wp_note_status` graduated to WordPress 6.9 core
	 * (`wp_create_initial_comment_meta()`); the suggestion meta is the
	 * Gutenberg 7.1 addition (`gutenberg_register_suggestion_meta()`).
	 */
	public function set_up() {
		parent::set_up();
		wp_create_initial_comment_meta();
		gutenberg_register_suggestion_meta();
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
	 * Dispatch a note carrying one post-level suggestion operation.
	 *
	 * @param int   $post_id   Post ID.
	 * @param array $operation The `post-attribute-set` operation.
	 * @return WP_REST_Response The response.
	 */
	protected function create_post_field_suggestion( $post_id, $operation ) {
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'content' => '',
					'type'    => 'note',
					'author'  => get_current_user_id(),
					'meta'    => array(
						'_wp_suggestion' => wp_json_encode(
							array(
								'schemaVersion' => 2,
								'blockName'     => '',
								'baseRevision'  => null,
								'operations'    => array(
									array_merge(
										array( 'type' => 'post-attribute-set' ),
										$operation
									),
								),
							)
						),
					),
				)
			)
		);
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Test that the post fields Suggestion mode proposes are accepted.
	 *
	 * @dataProvider data_suggestable_post_fields
	 *
	 * @param array $operation The operation, without its type.
	 */
	public function test_create_note_with_suggestable_post_field( $operation ) {
		wp_set_current_user( self::$editor_id );
		register_post_meta(
			'post',
			'gutenberg_test_suggestable',
			array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'string',
			)
		);
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );

		$response = $this->create_post_field_suggestion( $post_id, $operation );

		$this->assertSame( 201, $response->get_status() );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_suggestable_post_fields() {
		return array(
			'excerpt'         => array(
				array(
					'attribute' => 'excerpt',
					'before'    => '',
					'after'     => 'x',
				),
			),
			'featured image'  => array(
				array(
					'attribute' => 'featured_media',
					'before'    => 5,
					'after'     => 0,
				),
			),
			'categories'      => array(
				array(
					'attribute' => 'categories',
					'before'    => array(),
					'after'     => array( 1 ),
				),
			),
			'registered meta' => array(
				array(
					'attribute' => 'meta',
					'key'       => 'gutenberg_test_suggestable',
					'before'    => '',
					'after'     => 'x',
				),
			),
			'new tag'         => array(
				array(
					'attribute' => 'tags',
					'before'    => array(),
					'after'     => array( array( 'name' => 'Fresh' ) ),
				),
			),
			'new subcategory' => array(
				array(
					'attribute' => 'categories',
					'before'    => array( 1 ),
					'after'     => array(
						1,
						array(
							'name'   => 'Fresh',
							'parent' => 1,
						),
					),
				),
			),
		);
	}

	/**
	 * Test that a suggestion for a post field Suggestion mode cannot
	 * propose, or for a meta key the suggester could not edit, is refused.
	 *
	 * @dataProvider data_unsuggestable_post_fields
	 *
	 * @param array $operation The operation, without its type.
	 */
	public function test_cannot_create_note_with_unsuggestable_post_field( $operation ) {
		wp_set_current_user( self::$editor_id );
		register_post_meta(
			'post',
			'gutenberg_test_hidden',
			array(
				'show_in_rest' => false,
				'single'       => true,
				'type'         => 'string',
			)
		);
		register_post_meta(
			'post',
			'_gutenberg_test_protected',
			array(
				'show_in_rest'  => true,
				'single'        => true,
				'type'          => 'string',
				'auth_callback' => '__return_false',
			)
		);
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );

		$response = $this->create_post_field_suggestion( $post_id, $operation );

		$this->assertErrorResponse( 'rest_invalid_suggestion', $response, 400 );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_unsuggestable_post_fields() {
		return array(
			'status'             => array(
				array(
					'attribute' => 'status',
					'before'    => 'draft',
					'after'     => 'publish',
				),
			),
			'author'             => array(
				array(
					'attribute' => 'author',
					'before'    => 1,
					'after'     => 2,
				),
			),
			'unregistered meta'  => array(
				array(
					'attribute' => 'meta',
					'key'       => 'gutenberg_test_unregistered',
					'before'    => '',
					'after'     => 'x',
				),
			),
			'meta not in REST'   => array(
				array(
					'attribute' => 'meta',
					'key'       => 'gutenberg_test_hidden',
					'before'    => '',
					'after'     => 'x',
				),
			),
			'meta not editable'  => array(
				array(
					'attribute' => 'meta',
					'key'       => '_gutenberg_test_protected',
					'before'    => '',
					'after'     => 'x',
				),
			),
			'meta without a key' => array(
				array(
					'attribute' => 'meta',
					'before'    => '',
					'after'     => 'x',
				),
			),
			'term not an id'     => array(
				array(
					'attribute' => 'tags',
					'before'    => array(),
					'after'     => array( 'Fresh' ),
				),
			),
			'terms not a list'   => array(
				array(
					'attribute' => 'tags',
					'before'    => array(),
					'after'     => 'Fresh',
				),
			),
			'new term unnamed'   => array(
				array(
					'attribute' => 'tags',
					'before'    => array(),
					'after'     => array( array( 'name' => '  ' ) ),
				),
			),
			'flat term parent'   => array(
				array(
					'attribute' => 'tags',
					'before'    => array(),
					'after'     => array(
						array(
							'name'   => 'Fresh',
							'parent' => 1,
						),
					),
				),
			),
			'unknown parent'     => array(
				array(
					'attribute' => 'categories',
					'before'    => array(),
					'after'     => array(
						array(
							'name'   => 'Fresh',
							'parent' => 999999,
						),
					),
				),
			),
		);
	}

	/**
	 * Creates a post field suggestion and returns the stored operation.
	 *
	 * @param int   $post_id   Post ID.
	 * @param array $operation The operation, without its type.
	 * @return array The stored operation.
	 */
	protected function store_post_field_suggestion( $post_id, $operation ) {
		$response = $this->create_post_field_suggestion( $post_id, $operation );
		$this->assertSame( 201, $response->get_status() );
		$payload = json_decode(
			get_comment_meta( $response->get_data()['id'], '_wp_suggestion', true ),
			true
		);
		return $payload['operations'][0];
	}

	/**
	 * Test that a suggested title or excerpt gets the filtering core applies
	 * to that field for a user without `unfiltered_html`: the title is
	 * limited to the tags allowed in comments, the excerpt to post markup.
	 *
	 * @dataProvider data_filtered_text_post_fields
	 *
	 * @param string $attribute Post field.
	 * @param string $expected  Stored value.
	 */
	public function test_suggested_text_post_field_is_filtered_like_the_field( $attribute, $expected ) {
		wp_set_current_user( self::$author_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$author_id ) );

		$operation = $this->store_post_field_suggestion(
			$post_id,
			array(
				'attribute' => $attribute,
				'before'    => '',
				'after'     => '<img src="x.png"><div class="c" onclick="x()">Hello</div> <b>there</b><script>y</script>',
			)
		);

		$this->assertSame( $expected, $operation['after'] );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_filtered_text_post_fields() {
		return array(
			'title'   => array( 'title', 'Hello <b>there</b>' ),
			'excerpt' => array( 'excerpt', '<img src="x.png"><div class="c">Hello</div> <b>there</b>' ),
		);
	}

	/**
	 * Test that a user with `unfiltered_html` keeps markup in a suggested
	 * title or excerpt, as when editing the field directly.
	 *
	 * @dataProvider data_text_post_fields
	 *
	 * @param string $attribute Post field.
	 */
	public function test_suggested_text_post_field_keeps_markup_for_user_with_unfiltered_html( $attribute ) {
		wp_set_current_user( self::$admin_id );
		if ( is_multisite() ) {
			grant_super_admin( self::$admin_id );
		}
		$post_id = self::factory()->post->create( array( 'post_author' => self::$admin_id ) );

		$operation = $this->store_post_field_suggestion(
			$post_id,
			array(
				'attribute' => $attribute,
				'before'    => '',
				'after'     => '<div class="c">Hello</div>',
			)
		);

		$this->assertSame( '<div class="c">Hello</div>', $operation['after'] );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_text_post_fields() {
		return array(
			'title'   => array( 'title' ),
			'excerpt' => array( 'excerpt' ),
		);
	}

	/**
	 * Test that a suggested slug is stored as a slug.
	 */
	public function test_suggested_slug_is_sanitized_as_a_slug() {
		wp_set_current_user( self::$author_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$author_id ) );

		$operation = $this->store_post_field_suggestion(
			$post_id,
			array(
				'attribute' => 'slug',
				'before'    => 'old',
				'after'     => 'Hello <b>World</b>!',
			)
		);

		$this->assertSame( 'hello-world', $operation['after'] );
	}

	/**
	 * Test that a suggested featured image is stored as an attachment id.
	 */
	public function test_suggested_featured_media_is_stored_as_an_id() {
		wp_set_current_user( self::$author_id );
		$post_id       = self::factory()->post->create( array( 'post_author' => self::$author_id ) );
		$attachment_id = self::factory()->attachment->create(
			array(
				'post_author'    => self::$author_id,
				'post_mime_type' => 'image/jpeg',
			)
		);

		$operation = $this->store_post_field_suggestion(
			$post_id,
			array(
				'attribute' => 'featured_media',
				'before'    => '0',
				'after'     => (string) $attachment_id,
			)
		);

		$this->assertSame( $attachment_id, $operation['after'] );
		$this->assertSame( 0, $operation['before'] );
	}

	/**
	 * Test that a featured image suggestion is refused for anything but an
	 * attachment the suggester can read.
	 *
	 * @dataProvider data_invalid_featured_media
	 *
	 * @param string $target What the suggestion points at.
	 */
	public function test_cannot_suggest_featured_media_that_is_not_a_readable_attachment( $target ) {
		wp_set_current_user( self::$author_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$author_id ) );
		switch ( $target ) {
			case 'post':
				$after = self::factory()->post->create();
				break;
			case 'private attachment':
				$parent = self::factory()->post->create(
					array(
						'post_author' => self::$editor_id,
						'post_status' => 'private',
					)
				);
				$after  = self::factory()->attachment->create(
					array(
						'post_author'    => self::$editor_id,
						'post_parent'    => $parent,
						'post_mime_type' => 'image/jpeg',
					)
				);
				break;
			case 'missing':
				$after = 999999;
				break;
			default:
				$after = 'image';
		}

		$response = $this->create_post_field_suggestion(
			$post_id,
			array(
				'attribute' => 'featured_media',
				'before'    => 0,
				'after'     => $after,
			)
		);

		$this->assertErrorResponse( 'rest_invalid_suggestion', $response, 400 );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_invalid_featured_media() {
		return array(
			'a post'               => array( 'post' ),
			'a private attachment' => array( 'private attachment' ),
			'a missing attachment' => array( 'missing' ),
			'not an id'            => array( 'not an id' ),
		);
	}

	/**
	 * Test that a text post field suggestion must carry text.
	 *
	 * @dataProvider data_non_text_post_field_values
	 *
	 * @param string $key   Operation key, `before` or `after`.
	 * @param mixed  $value Value.
	 */
	public function test_cannot_suggest_a_non_text_title( $key, $value ) {
		wp_set_current_user( self::$author_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$author_id ) );

		$operation         = array(
			'attribute' => 'title',
			'before'    => '',
			'after'     => 'x',
		);
		$operation[ $key ] = $value;
		$response          = $this->create_post_field_suggestion( $post_id, $operation );

		$this->assertErrorResponse( 'rest_invalid_suggestion', $response, 400 );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_non_text_post_field_values() {
		return array(
			'array after'  => array( 'after', array( 'x' ) ),
			'array before' => array( 'before', array( 'x' ) ),
		);
	}

	/**
	 * Test that a suggested new term is stored with a sanitized name, and
	 * that suggesting it creates nothing: a suggester who cannot create
	 * terms may still propose one, for a reviewer to create on accept.
	 */
	public function test_suggested_new_term_is_sanitized_and_not_created() {
		wp_set_current_user( self::$author_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$author_id ) );
		$this->assertFalse( current_user_can( 'manage_categories' ) );

		$response = $this->create_post_field_suggestion(
			$post_id,
			array(
				'attribute' => 'categories',
				'before'    => array(),
				'after'     => array( array( 'name' => ' <b>Fresh</b> news ' ) ),
			)
		);

		$this->assertSame( 201, $response->get_status() );
		$payload = json_decode(
			get_comment_meta( $response->get_data()['id'], '_wp_suggestion', true ),
			true
		);
		$this->assertSame(
			array( array( 'name' => 'Fresh news' ) ),
			$payload['operations'][0]['after']
		);
		$this->assertEmpty( term_exists( 'Fresh news', 'category' ) );
	}

	/**
	 * Test that a user without `unfiltered_html` has script markup stripped
	 * from the applied fields of a suggestion payload at write time. The
	 * `after` value is what a reviewer's accept writes into block attributes,
	 * so it must be limited to what the suggester could publish directly.
	 */
	public function test_suggestion_payload_is_ksesed_for_user_without_unfiltered_html() {
		wp_set_current_user( self::$author_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$author_id ) );

		$payload = wp_json_encode(
			array(
				'schemaVersion' => 2,
				'blockName'     => 'core/paragraph',
				'baseRevision'  => null,
				'operations'    => array(
					array(
						'type'      => 'attribute-set',
						'attribute' => 'content',
						'before'    => 'Hello',
						'after'     => 'Hello <script>alert(1)</script><em>world</em>',
					),
				),
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'content' => '',
					'type'    => 'note',
					'author'  => self::$author_id,
					'meta'    => array(
						'_wp_suggestion' => $payload,
					),
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status() );

		$data    = $response->get_data();
		$stored  = get_comment_meta( $data['id'], '_wp_suggestion', true );
		$decoded = json_decode( $stored, true );
		$after   = $decoded['operations'][0]['after'] ?? '';

		$this->assertStringNotContainsString( '<script>', $after, 'Script markup must be stripped from `after`.' );
		$this->assertStringContainsString( '<em>world</em>', $after, 'Allowed markup must survive KSES.' );
	}

	/**
	 * Test that structured `after` values (a table's `body` rows, for example)
	 * are filtered down to every string leaf, as are the attributes of a block
	 * snapshot, for a user without `unfiltered_html`.
	 */
	public function test_suggestion_payload_kses_reaches_nested_values() {
		wp_set_current_user( self::$author_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$author_id ) );

		$payload = wp_json_encode(
			array(
				'schemaVersion' => 2,
				'blockName'     => 'core/table',
				'baseRevision'  => null,
				'operations'    => array(
					array(
						'type'      => 'attribute-set',
						'attribute' => 'body',
						'before'    => array(),
						'after'     => array(
							array(
								'cells' => array(
									array(
										'content' => '<script>alert(1)</script><strong>cell</strong>',
										'tag'     => 'td',
									),
								),
							),
						),
					),
					array(
						'type'      => 'block-insert-after',
						'clientId'  => 'abc',
						'blockName' => 'core/paragraph',
						'block'     => array(
							'name'        => 'core/paragraph',
							'attributes'  => array(
								'content' => '<img src=x onerror=alert(1)>text',
							),
							'innerBlocks' => array(
								array(
									'name'       => 'core/paragraph',
									'attributes' => array( 'content' => '<script>alert(2)</script>inner' ),
								),
							),
						),
					),
				),
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'content' => '',
					'type'    => 'note',
					'author'  => self::$author_id,
					'meta'    => array(
						'_wp_suggestion' => $payload,
					),
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status() );

		$data       = $response->get_data();
		$decoded    = json_decode( get_comment_meta( $data['id'], '_wp_suggestion', true ), true );
		$cell       = $decoded['operations'][0]['after'][0]['cells'][0];
		$snapshot   = $decoded['operations'][1]['block'];
		$inner_text = $snapshot['innerBlocks'][0]['attributes']['content'];

		$this->assertStringNotContainsString( '<script>', $cell['content'], 'Nested `after` strings must be filtered.' );
		$this->assertStringContainsString( '<strong>cell</strong>', $cell['content'], 'Allowed markup must survive KSES.' );
		$this->assertSame( 'td', $cell['tag'], 'Plain string leaves must survive unchanged.' );
		$this->assertStringNotContainsString( 'onerror', $snapshot['attributes']['content'], 'Snapshot attributes must be filtered.' );
		$this->assertStringNotContainsString( '<script>', $inner_text, 'Inner block snapshot attributes must be filtered.' );
	}

	/**
	 * Test that a user WITH `unfiltered_html` keeps their markup verbatim —
	 * the same freedom they have in post content.
	 */
	public function test_suggestion_payload_keeps_markup_for_user_with_unfiltered_html() {
		if ( is_multisite() ) {
			grant_super_admin( self::$admin_id );
		}
		wp_set_current_user( self::$admin_id );
		$this->assertTrue(
			current_user_can( 'unfiltered_html' ),
			'Precondition: the acting user must have unfiltered_html.'
		);

		$post_id = self::factory()->post->create( array( 'post_author' => self::$admin_id ) );

		$payload = wp_json_encode(
			array(
				'schemaVersion' => 2,
				'blockName'     => 'core/html',
				'baseRevision'  => null,
				'operations'    => array(
					array(
						'type'      => 'attribute-set',
						'attribute' => 'content',
						'before'    => '',
						'after'     => '<script>console.log("intentional");</script>',
					),
				),
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'content' => '',
					'type'    => 'note',
					'author'  => self::$admin_id,
					'meta'    => array(
						'_wp_suggestion' => $payload,
					),
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status() );

		$data    = $response->get_data();
		$stored  = get_comment_meta( $data['id'], '_wp_suggestion', true );
		$decoded = json_decode( $stored, true );

		$this->assertStringContainsString(
			'<script>',
			$decoded['operations'][0]['after'] ?? '',
			'Users with unfiltered_html keep their markup as-is.'
		);

		if ( is_multisite() ) {
			revoke_super_admin( self::$admin_id );
		}
	}

	/**
	 * Test that the `before` field is left untouched by the KSES pass. It is
	 * only compared for conflict detection, never applied — filtering it would
	 * cause false staleness warnings when the live content is unfiltered.
	 */
	public function test_suggestion_payload_before_field_is_not_ksesed() {
		wp_set_current_user( self::$author_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$author_id ) );

		// Deliberately contains markup KSES would strip: `before` is a
		// comparison baseline that must round-trip byte-for-byte.
		$before_value = 'Existing <script>window.baseline</script> content';
		$payload      = wp_json_encode(
			array(
				'schemaVersion' => 2,
				'blockName'     => 'core/paragraph',
				'baseRevision'  => null,
				'operations'    => array(
					array(
						'type'      => 'attribute-set',
						'attribute' => 'content',
						'before'    => $before_value,
						'after'     => 'Plain replacement',
					),
				),
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'content' => '',
					'type'    => 'note',
					'author'  => self::$author_id,
					'meta'    => array(
						'_wp_suggestion' => $payload,
					),
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $response->get_status() );

		$data    = $response->get_data();
		$stored  = get_comment_meta( $data['id'], '_wp_suggestion', true );
		$decoded = json_decode( $stored, true );

		$this->assertSame(
			$before_value,
			$decoded['operations'][0]['before'] ?? null,
			'The `before` baseline must be stored verbatim for conflict detection.'
		);
	}

	/**
	 * Test that a payload that isn't valid JSON is rejected with a 400 rather
	 * than stored as garbage the client would silently null out.
	 */
	public function test_create_rejects_invalid_json_suggestion_payload() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'content' => '',
					'type'    => 'note',
					'meta'    => array(
						'_wp_suggestion' => 'this is {not valid json',
					),
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_suggestion_invalid_json', $response, 400 );
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
		// Core maps `edit_comment` to `edit_post` on the parent post, which
		// the editor holds; the update succeeds with a 200 status.
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
			// Open, like the editor creates it: an approved note is resolved.
			'status'  => 'hold',
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
			'content' => '2764',
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
		$this->assertSame( '2764', $new_comment->comment_content );
		$this->assertSame( (string) $note_id, $new_comment->comment_parent );
		$this->assertSame( '1', $new_comment->comment_approved );
	}

	/**
	 * The comments API accepts `content` as a string or as `{ raw }`, so a
	 * reaction submitted either way must validate and store the same key.
	 *
	 * @dataProvider data_reaction_raw_content_slugs
	 *
	 * @param string $slug The reaction slug to submit as `content.raw`.
	 */
	public function test_create_reaction_with_raw_content( $slug ) {
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
					'content' => array( 'raw' => $slug ),
					'author'  => self::$editor_id,
				)
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 201, $response->get_status() );
		$reaction = get_comment( $response->get_data()['id'] );
		$this->assertSame( $slug, $reaction->comment_content );
	}

	public function data_reaction_raw_content_slugs() {
		return array(
			'curated emoji' => array( '2764' ),
		);
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
				'comment_content'  => '2764',
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
			'content' => '2764',
			'author'  => self::$editor_id,
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $params ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_comment_invalid_parent', $response, 400 );
	}

	/**
	 * A user who can only edit their own post gets the same error for a note
	 * on another post whatever that note's status, so its status doesn't leak.
	 *
	 * @dataProvider data_other_post_note_statuses
	 *
	 * @param string $status Status to move the other post's note to.
	 */
	public function test_reaction_on_note_from_other_post_does_not_leak_note_status( $status ) {
		$own_post_id = self::factory()->post->create(
			array(
				'post_author' => self::$contributor_id,
				'post_status' => 'draft',
			)
		);
		$other_post  = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$note_id     = $this->create_note( $other_post, self::$editor_id );
		wp_set_comment_status( $note_id, $status );

		wp_set_current_user( self::$contributor_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $own_post_id,
					'type'    => 'reaction',
					'parent'  => $note_id,
					'content' => '2764',
				)
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_comment_invalid_parent', $response, 400 );
		$this->assertSame( 'A reaction must be attached to a note on the same post.', $response->as_error()->get_error_message() );
	}

	/**
	 * Data provider for test_reaction_on_note_from_other_post_does_not_leak_note_status().
	 *
	 * @return array[]
	 */
	public function data_other_post_note_statuses() {
		return array(
			'open'     => array( 'hold' ),
			'resolved' => array( 'approve' ),
			'trashed'  => array( 'trash' ),
		);
	}

	/**
	 * A reaction created under a hidden note would never be reached by the
	 * trash cascade, so the note must be live.
	 *
	 * @dataProvider data_hidden_note_statuses
	 *
	 * @param string $status Status to move the parent note to.
	 */
	public function test_cannot_create_reaction_on_hidden_note( $status ) {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$note_id = $this->create_note( $post_id, self::$editor_id );
		wp_set_comment_status( $note_id, $status );

		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'type'    => 'reaction',
					'parent'  => $note_id,
					'content' => '2764',
					'author'  => self::$editor_id,
				)
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_comment_invalid_parent', $response, 400 );
	}

	/**
	 * Data provider for test_cannot_create_reaction_on_hidden_note().
	 *
	 * @return array[]
	 */
	public function data_hidden_note_statuses() {
		return array(
			'trash' => array( 'trash' ),
			'spam'  => array( 'spam' ),
		);
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
	 * @param string $parent_kind  One of 'none', 'note', or 'comment' - what the
	 *                             reaction's `parent` field references.
	 * @param string|array $content The reaction storage key to submit,
	 *                              as a string or as `{ raw }`.
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
			'no parent'                     => array( 'none', '2764', true, 'rest_comment_invalid_parent', 400 ),
			'parent is a regular comment'   => array( 'comment', '2764', true, 'rest_comment_invalid_parent', 400 ),
			'content is not in emoji list'  => array( 'note', 'invalid_emoji', true, 'rest_comment_invalid_reaction', 400 ),
			'emoji outside the curated set' => array( 'note', '1f44d', true, 'rest_comment_invalid_reaction', 400 ),
			'uppercase hex key'             => array( 'note', '1F680', true, 'rest_comment_invalid_reaction', 400 ),
			'emoji name instead of hex'     => array( 'note', 'heart', true, 'rest_comment_invalid_reaction', 400 ),
			'anonymous user'                => array( 'none', '2764', false, 'rest_comment_login_required', 401 ),
			'raw content not a key'         => array( 'note', array( 'raw' => 'invalid_emoji' ), true, 'rest_comment_invalid_reaction', 400 ),
			'content without raw'           => array( 'note', array( 'rendered' => '2764' ), true, 'rest_comment_invalid_reaction', 400 ),
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
			'content' => '1f680',
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

		/*
		 * Insert a competing reaction while the request is mid-flight (after
		 * its pre-insert check, before its own insert).
		 */
		$injected = false;
		$inject   = function ( $prepared ) use ( $note_id, $post_id, &$injected ) {
			if ( ! $injected && isset( $prepared['comment_type'] ) && 'reaction' === $prepared['comment_type'] ) {
				$injected = true;
				wp_insert_comment(
					array(
						'comment_post_ID'  => $post_id,
						'comment_parent'   => $note_id,
						'comment_type'     => 'reaction',
						'comment_content'  => '2764',
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
				'content' => '2764',
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
					return '2764' === wp_strip_all_tags( $comment->comment_content );
				}
			)
		);
		$this->assertCount( 1, $hearts, 'Concurrent duplicate reactions should converge to a single row.' );

		// The response must reference the surviving (earliest) row.
		$this->assertSame( (int) $hearts[0]->comment_ID, $response->get_data()['id'] );
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
		$this->assertSame( $emoji, get_comment( $response->get_data()['id'] )->comment_content );
	}

	public function data_valid_reaction_emojis() {
		// The five quick reactions: heart, celebration, smile, eyes, rocket.
		return array(
			'heart'       => array( '2764' ),
			'celebration' => array( '1f389' ),
			'smile'       => array( '1f604' ),
			'eyes'        => array( '1f440' ),
			'rocket'      => array( '1f680' ),
		);
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
			'content' => '2764',
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
		$this->assertArrayHasKey( '2764', $data['reaction_summary'] );
		$this->assertSame( 1, $data['reaction_summary']['2764']['count'] );
		$this->assertSame( $reaction_id, $data['reaction_summary']['2764']['current_user_reaction'] );
		$this->assertArrayNotHasKey( 'reacted', $data['reaction_summary']['2764'] );
		$this->assertArrayNotHasKey( 'my_reaction_id', $data['reaction_summary']['2764'] );
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
			'content' => '2764',
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
		$this->assertSame( 1, $data['reaction_summary']['2764']['count'] );
		$this->assertSame( 0, $data['reaction_summary']['2764']['current_user_reaction'] );
	}

	/**
	 * The batch prefetch must cover the notes on the requested page, not the
	 * first page, or every note falls back to its own summary queries.
	 */
	public function test_second_page_of_notes_keeps_reaction_summary_queries_bounded() {
		wp_set_current_user( self::$editor_id );
		$post_id  = self::factory()->post->create();
		$note_ids = array();
		for ( $i = 0; $i < 4; $i++ ) {
			$note_ids[] = $this->create_note( $post_id, self::$editor_id );
		}
		foreach ( $note_ids as $note_id ) {
			$this->create_reaction( $post_id, $note_id, self::$editor_id );
		}

		$summary_queries = 0;
		$count_queries   = static function ( $query ) use ( &$summary_queries ) {
			if ( str_contains( $query, "comment_type = 'reaction'" ) ) {
				++$summary_queries;
			}
			return $query;
		};
		add_filter( 'query', $count_queries );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );
		$request->set_param( 'context', 'edit' );
		$request->set_param( 'per_page', 2 );
		$request->set_param( 'page', 2 );
		$response = rest_get_server()->dispatch( $request );

		remove_filter( 'query', $count_queries );

		$data = $response->get_data();
		$this->assertCount( 2, $data );
		foreach ( $data as $note ) {
			$this->assertSame( 1, $note['reaction_summary']['2764']['count'] );
			$this->assertGreaterThan( 0, $note['reaction_summary']['2764']['current_user_reaction'] );
		}
		// One counts query and one current-user query for the whole page.
		$this->assertSame( 2, $summary_queries );
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
				'comment_content'  => '2764',
				'comment_approved' => 1,
				'user_id'          => self::$editor_id,
			)
		);

		/*
		 * Recount from the database so the assertion exercises the
		 * filtered `wp_update_comment_count_now()` query directly rather
		 * than the incremental adjustments comment creation applied.
		 */
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
	protected function create_reaction( $post_id, $note_id, $user_id, $slug = '2764' ) {
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
		$request->set_body( wp_json_encode( array( 'content' => '1f680' ) ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_comment_update_not_allowed', $response, 403 );
		$this->assertSame( '2764', get_comment( $reaction_id )->comment_content );
	}

	/**
	 * Resolving approves the thread's root note and the editor disables
	 * reactions from then on, so the server rejects them too, on the root
	 * note and on its replies.
	 *
	 * @dataProvider data_resolved_thread_targets
	 *
	 * @param bool $on_reply Whether to react to a reply rather than the root note.
	 */
	public function test_cannot_create_reaction_on_resolved_thread( $on_reply ) {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$note_id = $this->create_note( $post_id, self::$editor_id );
		$target  = $note_id;
		if ( $on_reply ) {
			$target = self::factory()->comment->create(
				array(
					'comment_post_ID'  => $post_id,
					'comment_parent'   => $note_id,
					'comment_type'     => 'note',
					'comment_approved' => 0,
					'user_id'          => self::$editor_id,
				)
			);
		}
		wp_set_comment_status( $note_id, 'approve' );

		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'type'    => 'reaction',
					'parent'  => $target,
					'content' => '2764',
				)
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_comment_invalid_parent', $response, 400 );
	}

	/**
	 * Data provider for test_cannot_create_reaction_on_resolved_thread().
	 *
	 * @return array[]
	 */
	public function data_resolved_thread_targets() {
		return array(
			'root note' => array( false ),
			'reply'     => array( true ),
		);
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
		$other_id    = $this->create_reaction( $post_id, $note_id, self::$author_id, '1f680' );

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
	 * Core cascades a trashed note to its `note` children only, so
	 * reactions need their own trash cascade.
	 */
	public function test_trashing_note_trashes_its_reactions() {
		if ( ! EMPTY_TRASH_DAYS ) {
			$this->markTestSkipped( 'Trash is disabled; trashing force-deletes.' );
		}

		wp_set_current_user( self::$editor_id );
		$post_id     = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$note_id     = $this->create_note( $post_id, self::$editor_id );
		$reaction_id = $this->create_reaction( $post_id, $note_id, self::$editor_id );

		wp_trash_comment( $note_id );
		$this->assertSame( 'trash', wp_get_comment_status( $reaction_id ), 'Reaction stayed approved under a trashed note.' );
	}

	/**
	 * Trashing a note trashes its reactions, so permanently deleting it
	 * afterwards must still find and delete them.
	 */
	public function test_permanently_deleting_trashed_note_deletes_its_reactions() {
		if ( ! EMPTY_TRASH_DAYS ) {
			$this->markTestSkipped( 'Trash is disabled; trashing force-deletes.' );
		}

		wp_set_current_user( self::$editor_id );
		$post_id     = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$note_id     = $this->create_note( $post_id, self::$editor_id );
		$reaction_id = $this->create_reaction( $post_id, $note_id, self::$editor_id );
		$removed_id  = $this->create_reaction( $post_id, $note_id, self::$author_id, '1f680' );
		wp_trash_comment( $removed_id );

		wp_trash_comment( $note_id );
		wp_delete_comment( $note_id, true );

		$this->assertNull( get_comment( $reaction_id ), 'A reaction trashed with its note outlived it.' );
		$this->assertNull( get_comment( $removed_id ), 'A previously removed reaction outlived its note.' );
	}

	/**
	 * A reaction may only be added on the current user's own behalf, even by
	 * a moderator.
	 */
	public function test_cannot_create_reaction_for_another_user() {
		wp_set_current_user( self::$admin_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'parent'  => $note_id,
					'content' => '2764',
					'type'    => 'reaction',
					'author'  => self::$editor_id,
				)
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_comment_invalid_author', $response, 403 );
		$this->assertEmpty(
			get_comments(
				array(
					'parent' => $note_id,
					'type'   => 'reaction',
					'status' => 'all',
				)
			),
			'No reaction should have been stored.'
		);
	}

	/**
	 * Author fields in the request must not detach a reaction from its user,
	 * which would hide it from the uniqueness check and the summary.
	 */
	public function test_create_reaction_ignores_request_author_fields() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		$body = wp_json_encode(
			array(
				'post'         => $post_id,
				'parent'       => $note_id,
				'content'      => '2764',
				'type'         => 'reaction',
				'author_name'  => 'Someone Else',
				'author_email' => 'someone@example.com',
			)
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body( $body );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 201, $response->get_status() );
		$reaction = get_comment( $response->get_data()['id'] );
		$this->assertSame( (string) self::$editor_id, $reaction->user_id, 'The reaction should belong to the current user.' );
		$this->assertNotSame( 'someone@example.com', $reaction->comment_author_email );

		$duplicate = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$duplicate->add_header( 'Content-Type', 'application/json' );
		$duplicate->set_body( $body );

		$this->assertErrorResponse( 'rest_comment_duplicate_reaction', rest_get_server()->dispatch( $duplicate ), 409 );
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

		/*
		 * Stand in for the competing request's cleanup: it keeps the earliest
		 * row and deletes this request's later one, which lands first.
		 */
		$race = function ( $comment_id, $comment ) use ( &$survivor_id, &$deleted ) {
			if ( ! $deleted && 'reaction' === $comment->comment_type && (int) $comment_id !== $survivor_id ) {
				$deleted = true;
				wp_delete_comment( $comment_id, true );
			}
		};

		/*
		 * Insert the competing row after this request's pre-insert uniqueness
		 * check has passed, so it takes the earlier ID. Arm the cleanup only
		 * once that row exists, so its own insert does not trigger it.
		 */
		$inject = function ( $prepared ) use ( $note_id, $post_id, $race, &$survivor_id ) {
			if ( ! $survivor_id && isset( $prepared['comment_type'] ) && 'reaction' === $prepared['comment_type'] ) {
				$survivor_id = wp_insert_comment(
					array(
						'comment_post_ID'  => $post_id,
						'comment_parent'   => $note_id,
						'comment_type'     => 'reaction',
						'comment_content'  => '2764',
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
				'content' => '2764',
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

	/**
	 * Whitespace around the reaction key is trimmed before it is validated
	 * and stored.
	 */
	public function test_create_reaction_trims_key() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'type'    => 'reaction',
					'parent'  => $note_id,
					'content' => " 2764\n",
				)
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( '2764', get_comment( $response->get_data()['id'] )->comment_content );
	}

	/**
	 * A reaction can only be created approved.
	 *
	 * Held, spammed or trashed reactions are invisible to the uniqueness check
	 * and the reaction summary, so repeated requests could pile them up.
	 *
	 * @dataProvider data_create_reaction_status
	 *
	 * @param string $status          Requested status.
	 * @param int    $expected_status Expected HTTP status.
	 */
	public function test_create_reaction_only_allows_approved_status( $status, $expected_status ) {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'type'    => 'reaction',
					'parent'  => $note_id,
					'content' => '2764',
					'status'  => $status,
				)
			)
		);
		$response = rest_get_server()->dispatch( $request );

		if ( 201 === $expected_status ) {
			$this->assertSame( 201, $response->get_status() );
			$this->assertSame( '1', get_comment( $response->get_data()['id'] )->comment_approved );
			return;
		}

		$this->assertErrorResponse( 'rest_comment_invalid_status', $response, $expected_status );
		$this->assertSame(
			array(),
			get_comments(
				array(
					'parent' => $note_id,
					'type'   => 'reaction',
					'status' => 'any',
					'fields' => 'ids',
				)
			),
			'No reaction should have been stored.'
		);
	}

	public function data_create_reaction_status() {
		return array(
			'approve' => array( 'approve', 201 ),
			'hold'    => array( 'hold', 400 ),
			'spam'    => array( 'spam', 400 ),
			'trash'   => array( 'trash', 400 ),
		);
	}

	/**
	 * A note's `children` link keeps targeting its reply notes once reactions
	 * exist, and a note with only reactions does not advertise one.
	 */
	public function test_note_children_link_ignores_reactions() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$note_id = $this->create_note( $post_id, self::$editor_id );

		self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'reaction',
				'comment_parent'   => $note_id,
				'comment_approved' => 1,
				'user_id'          => self::$editor_id,
				'comment_content'  => '2764',
			)
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments/' . $note_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertArrayNotHasKey( 'children', $response->get_links(), 'A note with only reactions should not advertise children.' );

		self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_parent'   => $note_id,
				'comment_approved' => 1,
				'user_id'          => self::$editor_id,
				'comment_content'  => 'Reply note',
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$links    = $response->get_links();

		$this->assertArrayHasKey( 'children', $links, 'A note with a reply should advertise children.' );
		$href = $links['children'][0]['href'];
		$this->assertStringContainsString( 'type=note', $href );
		$this->assertStringNotContainsString( 'type=reaction', $href );
	}
}
