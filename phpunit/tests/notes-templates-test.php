<?php
/**
 * Tests for Notes support on templates and template parts.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_notes_add_template_post_type_support
 */
class Tests_Notes_Templates extends WP_Test_REST_TestCase {
	/**
	 * Administrator user ID. Has `edit_theme_options`.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Editor user ID. Has `edit_posts` but not `edit_theme_options`.
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	protected static $subscriber_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$editor_id     = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 * Creates a template post of the given type, scoped to the active theme.
	 *
	 * @param string $post_type Either `wp_template` or `wp_template_part`.
	 * @return int Template post ID.
	 */
	protected function create_template_post( $post_type = 'wp_template' ) {
		$template_id = self::factory()->post->create(
			array(
				'post_type'    => $post_type,
				'post_name'    => 'notes-test-template',
				'post_title'   => 'Notes Test Template',
				'post_content' => '<!-- wp:paragraph --><p>Content</p><!-- /wp:paragraph -->',
				'post_status'  => 'publish',
			)
		);
		wp_set_post_terms( $template_id, get_stylesheet(), 'wp_theme' );

		return $template_id;
	}

	/**
	 * Dispatches a note creation request for the given post.
	 *
	 * @param int $post_id Post to attach the note to.
	 * @return WP_REST_Response
	 */
	protected function dispatch_create_note( $post_id ) {
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $post_id,
					'content' => 'A note on a template.',
					'type'    => 'note',
					'status'  => 'hold',
				)
			)
		);

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Both template post types should report notes support in the shape the
	 * REST controller and the editor's PostTypeSupportCheck consume.
	 *
	 * @dataProvider data_template_post_types
	 *
	 * @param string $post_type Template post type.
	 */
	public function test_template_post_types_support_notes( $post_type ) {
		$supports = get_all_post_type_supports( $post_type );

		$this->assertArrayHasKey( 'editor', $supports, 'The editor feature should be registered.' );
		$this->assertIsArray( $supports['editor'], 'The editor feature should carry arguments.' );
		$this->assertTrue(
			array_any( $supports['editor'], fn( $item ) => ! empty( $item['notes'] ) ),
			'The editor feature should declare notes support.'
		);
	}

	/**
	 * Declaring notes support must not break the plain editor support check.
	 *
	 * @dataProvider data_template_post_types
	 *
	 * @param string $post_type Template post type.
	 */
	public function test_editor_support_remains_truthy( $post_type ) {
		$this->assertTrue( post_type_supports( $post_type, 'editor' ) );
	}

	/**
	 * A user who can edit templates can create notes on them.
	 *
	 * @dataProvider data_template_post_types
	 *
	 * @param string $post_type Template post type.
	 */
	public function test_create_note_allowed_for_template_editor( $post_type ) {
		wp_set_current_user( self::$admin_id );

		$template_id = $this->create_template_post( $post_type );
		$response    = $this->dispatch_create_note( $template_id );

		$this->assertSame( 201, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 'note', $data['type'] );
		$this->assertSame( $template_id, $data['post'] );
	}

	/**
	 * Notes on templates are gated on `edit_theme_options`, so `edit_posts`
	 * alone is not enough.
	 *
	 * @dataProvider data_template_post_types
	 *
	 * @param string $post_type Template post type.
	 */
	public function test_create_note_denied_without_theme_caps( $post_type ) {
		wp_set_current_user( self::$editor_id );

		$template_id = $this->create_template_post( $post_type );
		$response    = $this->dispatch_create_note( $template_id );

		$this->assertErrorResponse( 'rest_cannot_create_note', $response, 403 );
	}

	/**
	 * Subscribers cannot create notes on templates.
	 */
	public function test_create_note_denied_for_subscriber() {
		wp_set_current_user( self::$subscriber_id );

		$template_id = $this->create_template_post();
		$response    = $this->dispatch_create_note( $template_id );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Template editors can read a template's notes in edit context.
	 */
	public function test_read_notes_allowed_for_template_editor() {
		$template_id = $this->create_template_post();
		self::factory()->comment->create(
			array(
				'comment_post_ID' => $template_id,
				'comment_type'    => 'note',
			)
		);

		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', $template_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );
		$request->set_param( 'context', 'edit' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 1, $response->get_data() );
	}

	/**
	 * Users without template capabilities cannot read template notes.
	 */
	public function test_read_notes_denied_without_theme_caps() {
		$template_id = $this->create_template_post();
		self::factory()->comment->create(
			array(
				'comment_post_ID' => $template_id,
				'comment_type'    => 'note',
			)
		);

		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', $template_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );
		$request->set_param( 'context', 'edit' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Template notes must not leak into ordinary comment queries.
	 */
	public function test_template_notes_excluded_from_default_comment_queries() {
		$template_id = $this->create_template_post();
		$note_id     = self::factory()->comment->create(
			array(
				'comment_post_ID' => $template_id,
				'comment_type'    => 'note',
			)
		);

		$this->assertNotEmpty( $note_id );
		$this->assertSame(
			array(),
			get_comments( array( 'post_id' => $template_id ) ),
			'Default comment queries should not return notes.'
		);

		$query = new WP_Comment_Query( array( 'post_id' => $template_id ) );
		$this->assertSame( array(), $query->comments );
	}

	/**
	 * Template notes must not appear in an unauthenticated REST comment list.
	 */
	public function test_template_notes_excluded_from_public_rest_listing() {
		$template_id = $this->create_template_post();
		self::factory()->comment->create(
			array(
				'comment_post_ID'  => $template_id,
				'comment_type'     => 'note',
				'comment_approved' => 1,
			)
		);

		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		foreach ( $response->get_data() as $comment ) {
			$this->assertNotSame(
				$template_id,
				$comment['post'],
				'Template notes should not be publicly listed.'
			);
		}
	}

	/**
	 * Only notes are newly permitted: regular comments on templates still fail
	 * because templates have no open discussion.
	 */
	public function test_regular_comment_on_template_still_rejected() {
		wp_set_current_user( self::$admin_id );

		$template_id = $this->create_template_post();

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->add_header( 'Content-Type', 'application/json' );
		$request->set_body(
			wp_json_encode(
				array(
					'post'    => $template_id,
					'content' => 'A regular comment.',
					'type'    => 'comment',
				)
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Deleting a template deletes its notes. This documents what happens when a
	 * customized template is reverted to its theme version.
	 */
	public function test_deleting_template_deletes_its_notes() {
		$template_id = $this->create_template_post();
		$note_id     = self::factory()->comment->create(
			array(
				'comment_post_ID' => $template_id,
				'comment_type'    => 'note',
			)
		);

		$this->assertInstanceOf( WP_Comment::class, get_comment( $note_id ) );

		wp_delete_post( $template_id, true );

		$this->assertNull( get_comment( $note_id ) );
	}

	/**
	 * Inline note markers saved into template content must not reach the front
	 * end. Template content renders through blocks, so the `render_block`
	 * filter that unwraps the markers covers it.
	 */
	public function test_inline_note_markers_stripped_from_rendered_template_content() {
		$content = '<!-- wp:paragraph --><p>Visible <mark class="wp-note" data-id="7">marked text</mark></p><!-- /wp:paragraph -->';

		$template_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => 'notes-test-inline',
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);
		wp_set_post_terms( $template_id, get_stylesheet(), 'wp_theme' );

		$rendered = do_blocks( get_post( $template_id )->post_content );

		$this->assertStringNotContainsString( 'wp-note', $rendered, 'The note marker should not be rendered.' );
		$this->assertStringNotContainsString( '<mark', $rendered, 'The mark wrapper should be removed.' );
		$this->assertStringContainsString( 'marked text', $rendered, 'The marked text itself should be preserved.' );
	}

	/**
	 * Data provider covering both template post types.
	 *
	 * @return array[]
	 */
	public function data_template_post_types() {
		return array(
			'template'      => array( 'wp_template' ),
			'template part' => array( 'wp_template_part' ),
		);
	}
}
