<?php
/**
 * Unit tests covering Gutenberg_REST_Notes_Controller functionality.
 *
 * @package gutenberg
 *
 * @coversDefaultClass Gutenberg_REST_Notes_Controller
 */
class Tests_REST_Notes_Controller extends WP_Test_REST_TestCase {

	/**
	 * The REST route the controller registers.
	 */
	const ROUTE = '/wp/v2/notes';

	/**
	 * Editor user id. Can edit the test post, so can read its notes.
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * A second editor, used to prove notes are shared across everyone who can
	 * edit the post rather than scoped to their author.
	 *
	 * @var int
	 */
	protected static $other_editor_id;

	/**
	 * Subscriber user id. Cannot edit the test post.
	 *
	 * @var int
	 */
	protected static $subscriber_id;

	/**
	 * Post the notes hang off.
	 *
	 * @var int
	 */
	protected static $post_id;

	/**
	 * Creates shared fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id       = $factory->user->create( array( 'role' => 'editor' ) );
		self::$other_editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_id   = $factory->user->create( array( 'role' => 'subscriber' ) );

		self::$post_id = $factory->post->create(
			array(
				'post_author' => self::$editor_id,
				'post_status' => 'publish',
			)
		);
	}

	/**
	 * Deletes shared fixtures.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		self::delete_user( self::$other_editor_id );
		self::delete_user( self::$subscriber_id );

		wp_delete_post( self::$post_id, true );
	}

	/**
	 * Creates a note.
	 *
	 * @param array $args Optional. Overrides for the comment fields.
	 * @return int Comment ID.
	 */
	protected function create_note( $args = array() ) {
		return self::factory()->comment->create(
			array_merge(
				array(
					'comment_post_ID'  => self::$post_id,
					'comment_type'     => 'note',
					'comment_approved' => '0',
					'user_id'          => self::$editor_id,
					'comment_content'  => 'A note.',
				),
				$args
			)
		);
	}

	/**
	 * Dispatches a GET request to the notes collection.
	 *
	 * @param array $params Optional. Query parameters.
	 * @return WP_REST_Response Response object.
	 */
	protected function get_notes( $params = array() ) {
		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_query_params( array_merge( array( 'post' => self::$post_id ), $params ) );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * The routes are registered.
	 *
	 * @covers ::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE, $routes );
		$this->assertArrayHasKey( self::ROUTE . '/(?P<id>[\d]+)', $routes );
	}

	/**
	 * The collection returns top-level notes only, with replies nested.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items_returns_threads_with_nested_replies() {
		$thread    = $this->create_note();
		$reply_one = $this->create_note(
			array(
				'comment_parent'   => $thread,
				'comment_content'  => 'First reply.',
				'comment_date_gmt' => '2026-01-01 00:00:00',
				'comment_date'     => '2026-01-01 00:00:00',
			)
		);
		$reply_two = $this->create_note(
			array(
				'comment_parent'   => $thread,
				'comment_content'  => 'Second reply.',
				'comment_date_gmt' => '2026-01-02 00:00:00',
				'comment_date'     => '2026-01-02 00:00:00',
			)
		);

		wp_set_current_user( self::$editor_id );

		$response = $this->get_notes();
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 1, $data, 'Replies should not appear as their own records.' );
		$this->assertSame( $thread, $data[0]['id'] );

		$reply_ids = wp_list_pluck( $data[0]['replies'], 'id' );
		$this->assertSame(
			array( $reply_one, $reply_two ),
			$reply_ids,
			'Replies should be nested under the thread, oldest first.'
		);
		$this->assertSame( 2, $data[0]['reply_count'] );
	}

	/**
	 * Replies are prepared in the same context as their thread.
	 *
	 * This is the behaviour `_embed` on the comments collection cannot provide:
	 * embedded children are always prepared in `view` context, so `content.raw`
	 * - the value the editor writes back - never reaches the client.
	 *
	 * @covers ::get_items
	 */
	public function test_replies_are_prepared_in_edit_context() {
		$thread = $this->create_note();
		$this->create_note(
			array(
				'comment_parent'  => $thread,
				'comment_content' => 'Raw reply body.',
			)
		);

		wp_set_current_user( self::$editor_id );

		$data = $this->get_notes( array( 'context' => 'edit' ) )->get_data();

		$this->assertArrayHasKey( 'raw', $data[0]['content'] );
		$this->assertArrayHasKey( 'raw', $data[0]['replies'][0]['content'] );
		$this->assertSame( 'Raw reply body.', $data[0]['replies'][0]['content']['raw'] );
	}

	/**
	 * Both open and resolved notes come back without asking for a status.
	 *
	 * @covers ::get_collection_params
	 */
	public function test_get_items_defaults_to_all_statuses() {
		$open     = $this->create_note( array( 'comment_approved' => '0' ) );
		$resolved = $this->create_note( array( 'comment_approved' => '1' ) );

		wp_set_current_user( self::$editor_id );

		$data     = $this->get_notes()->get_data();
		$statuses = array();

		foreach ( $data as $note ) {
			$statuses[ $note['id'] ] = $note['status'];
		}

		$this->assertSame( 'hold', $statuses[ $open ] );
		$this->assertSame( 'approved', $statuses[ $resolved ] );
	}

	/**
	 * Pagination counts and cuts between threads, never inside one.
	 *
	 * @covers ::get_items
	 */
	public function test_pagination_counts_threads_not_replies() {
		$first  = $this->create_note( array( 'comment_date_gmt' => '2026-01-01 00:00:00' ) );
		$second = $this->create_note( array( 'comment_date_gmt' => '2026-01-02 00:00:00' ) );

		$this->create_note( array( 'comment_parent' => $first ) );
		$this->create_note( array( 'comment_parent' => $second ) );

		wp_set_current_user( self::$editor_id );

		$response = $this->get_notes( array( 'per_page' => 1 ) );
		$data     = $response->get_data();
		$headers  = $response->get_headers();

		$this->assertSame( '2', (string) $headers['X-WP-Total'], 'Only threads should be counted.' );
		$this->assertSame( '2', (string) $headers['X-WP-TotalPages'] );
		$this->assertCount( 1, $data );
		$this->assertCount( 1, $data[0]['replies'], 'A page break must not strip a thread of its replies.' );
	}

	/**
	 * `_fields` can trim the response down to a per-post tally.
	 *
	 * @covers ::attach_replies
	 */
	public function test_reply_count_is_available_without_the_replies() {
		$thread = $this->create_note();
		$this->create_note( array( 'comment_parent' => $thread ) );

		wp_set_current_user( self::$editor_id );

		$data = $this->get_notes( array( '_fields' => 'id,post,reply_count' ) )->get_data();

		$this->assertSame(
			array( 'id', 'post', 'reply_count' ),
			array_keys( $data[0] )
		);
		$this->assertSame( 1, $data[0]['reply_count'] );
	}

	/**
	 * Resolving and reopening a thread each record a reply of their own, and
	 * neither counts as a reply someone wrote.
	 *
	 * @covers ::attach_replies
	 */
	public function test_reply_count_ignores_resolution_entries() {
		$thread = $this->create_note();
		$this->create_note(
			array(
				'comment_parent'  => $thread,
				'comment_content' => 'A written reply.',
			)
		);

		$resolved = $this->create_note( array( 'comment_parent' => $thread ) );
		update_comment_meta( $resolved, '_wp_note_status', 'resolved' );

		$reopened = $this->create_note( array( 'comment_parent' => $thread ) );
		update_comment_meta( $reopened, '_wp_note_status', 'reopen' );

		wp_set_current_user( self::$editor_id );

		$data = $this->get_notes()->get_data();

		$this->assertSame( 1, $data[0]['reply_count'], 'Only the written reply should be counted.' );
		$this->assertCount(
			3,
			$data[0]['replies'],
			'The thread still needs the resolution entries to render its history.'
		);
	}

	/**
	 * The collection is scoped to a post.
	 *
	 * @covers ::get_items_permissions_check
	 */
	public function test_get_items_requires_a_post() {
		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', self::ROUTE );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * Anyone who can edit the post can read its notes, not just their author.
	 *
	 * @covers ::get_items_permissions_check
	 */
	public function test_notes_are_readable_by_every_editor_of_the_post() {
		$this->create_note( array( 'user_id' => self::$editor_id ) );

		wp_set_current_user( self::$other_editor_id );

		$response = $this->get_notes();

		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 1, $response->get_data() );
	}

	/**
	 * Users who cannot edit the post cannot read its notes.
	 *
	 * @covers ::get_items_permissions_check
	 */
	public function test_get_items_denied_without_edit_post() {
		$this->create_note();

		wp_set_current_user( self::$subscriber_id );

		$this->assertErrorResponse( 'rest_cannot_read_notes', $this->get_notes(), 403 );
	}

	/**
	 * Logged-out requests are rejected outright.
	 *
	 * @covers ::get_items_permissions_check
	 */
	public function test_get_items_denied_when_logged_out() {
		$this->create_note();

		wp_set_current_user( 0 );

		$this->assertErrorResponse( 'rest_notes_not_logged_in', $this->get_notes(), 401 );
	}

	/**
	 * The single-note routes do not expose ordinary comments.
	 *
	 * @covers ::get_comment
	 */
	public function test_single_route_rejects_a_regular_comment() {
		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_approved' => '1',
			)
		);

		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', self::ROUTE . '/' . $comment_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_note_invalid_id', $response, 404 );
	}

	/**
	 * A single note is returned with its replies.
	 *
	 * @covers ::get_item
	 */
	public function test_get_item_returns_the_thread_replies() {
		$thread = $this->create_note();
		$reply  = $this->create_note( array( 'comment_parent' => $thread ) );

		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', self::ROUTE . '/' . $thread );
		$request->set_param( 'context', 'edit' );

		$data = rest_get_server()->dispatch( $request )->get_data();

		$this->assertSame( $thread, $data['id'] );
		$this->assertSame( array( $reply ), wp_list_pluck( $data['replies'], 'id' ) );
	}

	/**
	 * Creating a note does not require the client to name the comment type.
	 *
	 * @covers ::create_item
	 */
	public function test_create_item_forces_the_note_type() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_body_params(
			array(
				'post'    => self::$post_id,
				'content' => 'Created through the notes route.',
				'status'  => 'hold',
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'note', $data['type'] );
		$this->assertSame( 'hold', $data['status'] );
		$this->assertSame( 'note', get_comment( $data['id'] )->comment_type );
	}

	/**
	 * A reply created through the route shows up nested in the thread.
	 *
	 * @covers ::create_item
	 */
	public function test_created_reply_is_nested_in_its_thread() {
		$thread = $this->create_note();

		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_body_params(
			array(
				'post'    => self::$post_id,
				'parent'  => $thread,
				'content' => 'A reply.',
				'status'  => 'hold',
			)
		);

		$created = rest_get_server()->dispatch( $request );
		$this->assertSame( 201, $created->get_status() );

		$data = $this->get_notes()->get_data();

		$this->assertCount( 1, $data, 'The reply should not surface as its own thread.' );
		$this->assertSame(
			array( $created->get_data()['id'] ),
			wp_list_pluck( $data[0]['replies'], 'id' )
		);
	}

	/**
	 * Fields that only make sense for anonymous commenters are not exposed.
	 *
	 * @covers ::get_item_schema
	 */
	public function test_schema_drops_the_anonymous_commenter_fields() {
		$controller = new Gutenberg_REST_Notes_Controller();
		$props      = $controller->get_item_schema()['properties'];

		foreach ( array( 'author_email', 'author_ip', 'author_url', 'author_user_agent', 'link' ) as $removed ) {
			$this->assertArrayNotHasKey( $removed, $props );
		}

		$this->assertArrayHasKey( 'replies', $props );
		$this->assertArrayHasKey( 'reply_count', $props );
	}
}
