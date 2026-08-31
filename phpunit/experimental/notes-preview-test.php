<?php
/**
 * Tests for the notes-on-previews experiment.
 *
 * @package gutenberg
 */

require_once __DIR__ . '/../../lib/experimental/notes-preview.php';

/**
 * @group notes
 * @group notes-preview
 */
class Gutenberg_Notes_Preview_Test extends WP_Test_REST_TestCase {

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Subscriber user ID, used as the reviewer throughout.
	 *
	 * @var int
	 */
	protected static $reviewer_id;

	/**
	 * A second subscriber, never granted anything.
	 *
	 * @var int
	 */
	protected static $outsider_id;

	/**
	 * Draft post under review.
	 *
	 * @var int
	 */
	protected static $post_id;

	/**
	 * A second draft the reviewer is never granted access to.
	 *
	 * @var int
	 */
	protected static $other_post_id;

	/**
	 * Top-level note on the post under review.
	 *
	 * @var int
	 */
	protected static $note_id;

	/**
	 * Top-level note on the other post.
	 *
	 * @var int
	 */
	protected static $other_note_id;

	/**
	 * Capability filters added by a test, removed on tear down.
	 *
	 * @var callable[]
	 */
	protected $granted = array();

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id    = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$reviewer_id = $factory->user->create( array( 'role' => 'subscriber' ) );
		self::$outsider_id = $factory->user->create( array( 'role' => 'subscriber' ) );

		self::$post_id = $factory->post->create(
			array(
				'post_title'   => 'Draft under review',
				'post_content' => '<!-- wp:paragraph {"metadata":{"noteId":[1]}} --><p>Reviewed paragraph.</p><!-- /wp:paragraph -->',
				'post_status'  => 'draft',
				'post_author'  => self::$admin_id,
			)
		);

		self::$other_post_id = $factory->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$admin_id,
			)
		);

		self::$note_id = $factory->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_type'     => 'note',
				'comment_approved' => 0,
			)
		);

		self::$other_note_id = $factory->comment->create(
			array(
				'comment_post_ID'  => self::$other_post_id,
				'comment_type'     => 'note',
				'comment_approved' => 0,
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$reviewer_id );
		self::delete_user( self::$outsider_id );

		wp_delete_post( self::$post_id, true );
		wp_delete_post( self::$other_post_id, true );
	}

	public function tear_down() {
		foreach ( $this->granted as $filter ) {
			remove_filter( 'map_meta_cap', $filter, 20 );
		}
		$this->granted = array();

		// Put the render filters back the way the rest of the suite expects.
		remove_filter( 'render_block', 'gutenberg_notes_preview_add_block_anchor', 20 );

		if ( ! has_filter( 'render_block', 'wp_strip_inline_note_markers' ) ) {
			add_filter( 'render_block', 'wp_strip_inline_note_markers' );
		}

		if ( ! has_filter( 'render_block', 'gutenberg_strip_inline_note_markers' ) ) {
			add_filter( 'render_block', 'gutenberg_strip_inline_note_markers' );
		}

		parent::tear_down();
	}

	/**
	 * Grants note capabilities on a post, the way a site plugin would.
	 *
	 * @param int      $post_id Post to grant on.
	 * @param string[] $caps    Capabilities to grant.
	 */
	protected function grant( $post_id, $caps ) {
		$post_id = (int) $post_id;
		$filter  = static function ( $required, $cap, $user_id, $args ) use ( $post_id, $caps ) {
			if ( in_array( $cap, $caps, true ) && isset( $args[0] ) && (int) $args[0] === $post_id ) {
				return array( 'read' );
			}

			return $required;
		};

		add_filter( 'map_meta_cap', $filter, 20, 4 );
		$this->granted[] = $filter;
	}

	/**
	 * Builds the preview URL for a post.
	 *
	 * @param int $post_id Post ID.
	 * @return string Preview URL.
	 */
	protected function preview_url( $post_id ) {
		return add_query_arg(
			array(
				'p'       => $post_id,
				'preview' => 'true',
			),
			home_url( '/' )
		);
	}

	/*
	 * Capability mapping.
	 */

	public function test_note_caps_map_to_edit_post_by_default() {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( current_user_can( 'read_post_notes', self::$post_id ) );
		$this->assertTrue( current_user_can( 'create_post_notes', self::$post_id ) );

		wp_set_current_user( self::$reviewer_id );
		$this->assertFalse( current_user_can( 'read_post_notes', self::$post_id ) );
		$this->assertFalse( current_user_can( 'create_post_notes', self::$post_id ) );
	}

	public function test_note_caps_are_granted_independently() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$this->assertTrue( current_user_can( 'read_post_notes', self::$post_id ) );
		$this->assertFalse( current_user_can( 'create_post_notes', self::$post_id ) );

		// The grant is per post, and never leaks into post editing.
		$this->assertFalse( current_user_can( 'read_post_notes', self::$other_post_id ) );
		$this->assertFalse( current_user_can( 'edit_post', self::$post_id ) );
	}

	public function test_note_caps_denied_for_missing_post() {
		wp_set_current_user( self::$admin_id );
		$this->assertFalse( current_user_can( 'read_post_notes', 999999 ) );
		$this->assertFalse( current_user_can( 'create_post_notes', 999999 ) );
	}

	/*
	 * Reading notes over REST.
	 */

	public function test_reviewer_can_list_notes() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$ids = wp_list_pluck( $response->get_data(), 'id' );
		$this->assertContains( self::$note_id, $ids );
	}

	public function test_reviewer_without_grant_cannot_list_notes() {
		wp_set_current_user( self::$outsider_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}

	public function test_reviewer_cannot_list_notes_for_ungranted_post() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', self::$other_post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}

	public function test_reviewer_cannot_list_notes_in_edit_context() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );
		$request->set_param( 'context', 'edit' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden_context', $response, 403 );
	}

	public function test_reviewer_cannot_list_notes_without_a_post() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden_param', $response, 403 );
	}

	public function test_reviewer_cannot_filter_notes_by_author() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );
		$request->set_param( 'author', array( self::$admin_id ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden_param', $response, 403 );
	}

	public function test_logged_out_cannot_list_notes() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}

	public function test_reviewer_can_read_single_note() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/comments/' . self::$note_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( self::$note_id, $response->get_data()['id'] );
	}

	/*
	 * Writing notes over REST.
	 */

	public function test_reviewer_can_reply_to_a_note() {
		$this->grant( self::$post_id, array( 'read_post_notes', 'create_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'parent', self::$note_id );
		$request->set_param( 'status', 'hold' );
		$request->set_param( 'content', 'Looks good to legal.' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( self::$note_id, $response->get_data()['parent'] );
	}

	public function test_reviewer_cannot_start_a_new_thread() {
		$this->grant( self::$post_id, array( 'read_post_notes', 'create_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'hold' );
		$request->set_param( 'content', 'A brand new thread.' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_create_note', $response, 403 );
	}

	public function test_read_only_reviewer_cannot_reply() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'parent', self::$note_id );
		$request->set_param( 'status', 'hold' );
		$request->set_param( 'content', 'Should not be allowed.' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_create_note', $response, 403 );
	}

	public function test_reviewer_cannot_reply_with_a_moderation_status() {
		$this->grant( self::$post_id, array( 'read_post_notes', 'create_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'parent', self::$note_id );
		$request->set_param( 'status', 'approved' );
		$request->set_param( 'content', 'Resolving on the sly.' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}

	public function test_reviewer_cannot_resolve_a_thread() {
		$this->grant( self::$post_id, array( 'read_post_notes', 'create_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'parent', self::$note_id );
		$request->set_param( 'status', 'hold' );
		$request->set_param( 'content', '' );
		$request->set_param( 'meta', array( '_wp_note_status' => 'resolved' ) );

		$response = rest_get_server()->dispatch( $request );

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}

	public function test_reviewer_cannot_reply_to_a_note_on_another_post() {
		$this->grant( self::$post_id, array( 'read_post_notes', 'create_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_param( 'post', self::$post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'parent', self::$other_note_id );
		$request->set_param( 'status', 'hold' );
		$request->set_param( 'content', 'Wrong post.' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}

	public function test_reviewer_cannot_delete_a_note() {
		$this->grant( self::$post_id, array( 'read_post_notes', 'create_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/comments/' . self::$note_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}

	public function test_reviewer_cannot_edit_a_note() {
		$this->grant( self::$post_id, array( 'read_post_notes', 'create_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . self::$note_id );
		$request->set_param( 'content', 'Rewritten by a reviewer.' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertGreaterThanOrEqual( 400, $response->get_status() );
	}

	/*
	 * Preview access.
	 */

	public function test_reviewer_can_load_the_preview() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$this->go_to( $this->preview_url( self::$post_id ) );

		$this->assertTrue( is_preview() );
		$this->assertCount( 1, $GLOBALS['wp_query']->posts );
		$this->assertSame( self::$post_id, $GLOBALS['wp_query']->posts[0]->ID );
	}

	public function test_preview_restores_the_real_post_status() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$this->go_to( $this->preview_url( self::$post_id ) );

		$this->assertSame( 'draft', $GLOBALS['wp_query']->posts[0]->post_status );
		$this->assertSame( 'draft', get_post_status( self::$post_id ) );
	}

	public function test_user_without_grant_cannot_load_the_preview() {
		wp_set_current_user( self::$outsider_id );

		$this->go_to( $this->preview_url( self::$post_id ) );

		$this->assertEmpty( $GLOBALS['wp_query']->posts );
	}

	public function test_logged_out_visitor_cannot_load_the_preview() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( 0 );

		$this->go_to( $this->preview_url( self::$post_id ) );

		$this->assertEmpty( $GLOBALS['wp_query']->posts );
	}

	public function test_password_protected_post_is_not_previewable() {
		$post_id = self::factory()->post->create(
			array(
				'post_status'   => 'draft',
				'post_author'   => self::$admin_id,
				'post_password' => 'hunter2',
			)
		);

		$this->grant( $post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$this->go_to( $this->preview_url( $post_id ) );

		$this->assertEmpty( $GLOBALS['wp_query']->posts );

		wp_delete_post( $post_id, true );
	}

	public function test_non_preview_request_is_untouched() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$this->go_to( add_query_arg( 'p', self::$post_id, home_url( '/' ) ) );

		$this->assertEmpty( $GLOBALS['wp_query']->posts );
	}

	/*
	 * Rendering note anchors.
	 */

	public function test_note_ids_are_normalised() {
		$this->assertSame( array( 3 ), gutenberg_notes_preview_note_ids( 3 ) );
		$this->assertSame( array( 3 ), gutenberg_notes_preview_note_ids( '3' ) );
		$this->assertSame( array( 3, 5 ), gutenberg_notes_preview_note_ids( array( 3, 5, 3 ) ) );
		$this->assertSame( array(), gutenberg_notes_preview_note_ids( array( 0, -1, 'abc', null ) ) );
	}

	public function test_anchor_is_added_to_the_outermost_tag() {
		$rendered = gutenberg_notes_preview_add_block_anchor(
			'<p>Reviewed <em>paragraph</em>.</p>',
			array( 'attrs' => array( 'metadata' => array( 'noteId' => array( 7, 9 ) ) ) )
		);

		$this->assertStringContainsString( 'data-wp-note-id="7,9"', $rendered );
		$this->assertStringContainsString( '<p data-wp-note-id="7,9">', $rendered );
	}

	public function test_anchor_is_skipped_for_blocks_without_notes_or_tags() {
		$this->assertSame(
			'<p>No note here.</p>',
			gutenberg_notes_preview_add_block_anchor( '<p>No note here.</p>', array( 'attrs' => array() ) )
		);

		$this->assertSame(
			'Just text.',
			gutenberg_notes_preview_add_block_anchor(
				'Just text.',
				array( 'attrs' => array( 'metadata' => array( 'noteId' => 7 ) ) )
			)
		);
	}

	public function test_anchor_filters_are_armed_on_an_active_preview() {
		$this->grant( self::$post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$this->go_to( $this->preview_url( self::$post_id ) );
		gutenberg_notes_preview_maybe_enable_anchors();

		$this->assertNotFalse( has_filter( 'render_block', 'gutenberg_notes_preview_add_block_anchor' ) );

		// Inline markers carry information the reviewer is entitled to read.
		$this->assertFalse( has_filter( 'render_block', 'wp_strip_inline_note_markers' ) );
		$this->assertFalse( has_filter( 'render_block', 'gutenberg_strip_inline_note_markers' ) );
	}

	public function test_anchor_filters_are_not_armed_without_the_capability() {
		wp_set_current_user( self::$outsider_id );

		$this->go_to( $this->preview_url( self::$post_id ) );
		gutenberg_notes_preview_maybe_enable_anchors();

		$this->assertFalse( has_filter( 'render_block', 'gutenberg_notes_preview_add_block_anchor' ) );
		$this->assertNotFalse( has_filter( 'render_block', 'wp_strip_inline_note_markers' ) );
	}

	public function test_anchor_filters_are_not_armed_on_a_published_view() {
		$post_id = self::factory()->post->create(
			array(
				'post_status' => 'publish',
				'post_author' => self::$admin_id,
			)
		);

		$this->grant( $post_id, array( 'read_post_notes' ) );
		wp_set_current_user( self::$reviewer_id );

		$this->go_to( get_permalink( $post_id ) );
		gutenberg_notes_preview_maybe_enable_anchors();

		$this->assertFalse( has_filter( 'render_block', 'gutenberg_notes_preview_add_block_anchor' ) );
		$this->assertNotFalse( has_filter( 'render_block', 'wp_strip_inline_note_markers' ) );

		wp_delete_post( $post_id, true );
	}
}
