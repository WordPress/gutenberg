<?php
/**
 * Tests for Style Book notes support on the wp_global_styles post type.
 *
 * @package gutenberg
 */
class Tests_Global_Styles_Notes extends WP_Test_REST_TestCase {

	/**
	 * The comments REST route.
	 */
	const ROUTE = '/wp/v2/comments';

	/**
	 * The Style Book note anchor meta key.
	 */
	const ANCHOR_META = '_wp_note_anchor';

	/**
	 * Administrator user id; has `edit_theme_options`.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Author user id; has `edit_posts` but not `edit_theme_options`.
	 *
	 * @var int
	 */
	protected static $author_id;

	/**
	 * Creates shared users.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$author_id = $factory->user->create( array( 'role' => 'author' ) );
	}

	/**
	 * Deletes shared users.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$author_id );
	}

	/**
	 * Re-applies the registrations the test case tears down.
	 *
	 * `WP_UnitTestCase_Base` unregisters every meta key after each test and
	 * re-runs `create_initial_post_types()` before each one, which between
	 * them drop the anchor meta and reset `wp_global_styles` to its stock
	 * supports. Both are normally applied on `init`, which does not fire again
	 * here, so only the first test would see them.
	 */
	public function set_up() {
		parent::set_up();

		wp_create_initial_comment_meta();
		gutenberg_register_note_anchor_meta();
		gutenberg_add_global_styles_notes_support();
	}

	/**
	 * Returns the current theme's user global styles post id, creating the
	 * record if the theme has not been customized yet.
	 *
	 * The resolver caches per theme across tests, so the cache is reset first
	 * to keep each test independent of the order it runs in.
	 *
	 * @return int Post id.
	 */
	private function get_global_styles_post_id() {
		WP_Theme_JSON_Resolver::clean_cached_data();

		$post = WP_Theme_JSON_Resolver::get_user_data_from_wp_global_styles( wp_get_theme(), true );

		return isset( $post['ID'] ) ? (int) $post['ID'] : 0;
	}

	/**
	 * Builds a note creation request.
	 *
	 * @param int    $post_id Post to attach the note to.
	 * @param string $anchor  Style Book example name.
	 * @return WP_REST_Request Prepared request.
	 */
	private function note_request( $post_id, $anchor = 'core/button' ) {
		$request = new WP_REST_Request( 'POST', self::ROUTE );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'hold' );
		$request->set_param( 'content', 'Make this button rounder.' );
		$request->set_param( 'meta', array( self::ANCHOR_META => $anchor ) );

		return $request;
	}

	/**
	 * The post type declares notes support in the shape the comments
	 * controller reads.
	 *
	 * `WP_REST_Comments_Controller::check_post_type_supports_notes()` looks for
	 * a truthy `notes` key inside the `editor` support arguments, so replicate
	 * that read rather than asserting on the raw array shape.
	 */
	public function test_global_styles_supports_notes() {
		$supports = get_all_post_type_supports( 'wp_global_styles' );

		$this->assertArrayHasKey( 'editor', $supports, 'wp_global_styles should still declare editor support.' );
		$this->assertIsArray( $supports['editor'], 'Editor support should carry arguments.' );
		$this->assertTrue(
			array_any( $supports['editor'], static fn( $item ) => ! empty( $item['notes'] ) ),
			'wp_global_styles should declare notes support.'
		);
	}

	/**
	 * Adding support arguments must not break plain `editor` support, which
	 * only tests for the key's presence.
	 */
	public function test_global_styles_still_supports_editor() {
		$this->assertTrue( post_type_supports( 'wp_global_styles', 'editor' ) );
	}

	/**
	 * The anchor meta is registered for comments and exposed over REST.
	 */
	public function test_anchor_meta_is_registered() {
		$this->assertTrue( registered_meta_key_exists( 'comment', self::ANCHOR_META ) );

		$registered = get_registered_meta_keys( 'comment' );

		$this->assertArrayHasKey( self::ANCHOR_META, $registered );
		$this->assertTrue( $registered[ self::ANCHOR_META ]['single'] );
		$this->assertNotEmpty( $registered[ self::ANCHOR_META ]['show_in_rest'] );
	}

	/**
	 * Registering a second time is a no-op rather than a fatal, so the plugin
	 * defers cleanly to core once the meta ships there.
	 */
	public function test_anchor_meta_registration_is_idempotent() {
		$before = get_registered_meta_keys( 'comment' )[ self::ANCHOR_META ];

		gutenberg_register_note_anchor_meta();

		$this->assertSame( $before, get_registered_meta_keys( 'comment' )[ self::ANCHOR_META ] );
	}

	/**
	 * Re-running the support helper leaves an existing registration alone.
	 */
	public function test_notes_support_registration_is_idempotent() {
		$before = get_all_post_type_supports( 'wp_global_styles' );

		gutenberg_add_global_styles_notes_support();

		$this->assertSame( $before, get_all_post_type_supports( 'wp_global_styles' ) );
	}

	/**
	 * An administrator can create a Style Book note, and the anchor round-trips
	 * through the response.
	 */
	public function test_administrator_can_create_note_with_anchor() {
		wp_set_current_user( self::$admin_id );

		$post_id  = $this->get_global_styles_post_id();
		$response = rest_get_server()->dispatch( $this->note_request( $post_id ) );

		$this->assertSame( 201, $response->get_status() );

		$data = $response->get_data();

		$this->assertSame( $post_id, $data['post'] );
		$this->assertSame( 'note', $data['type'] );
		$this->assertSame( 'core/button', $data['meta'][ self::ANCHOR_META ] );
		$this->assertSame( 'core/button', get_comment_meta( $data['id'], self::ANCHOR_META, true ) );
	}

	/**
	 * The anchor is an opaque string, so block names from any source - not just
	 * core - and the synthetic Style Book section names are all valid.
	 *
	 * @dataProvider data_valid_anchors
	 *
	 * @param string $anchor Style Book example name.
	 */
	public function test_anchor_accepts_style_book_example_names( $anchor ) {
		wp_set_current_user( self::$admin_id );

		$response = rest_get_server()->dispatch(
			$this->note_request( $this->get_global_styles_post_id(), $anchor )
		);

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( $anchor, $response->get_data()['meta'][ self::ANCHOR_META ] );
	}

	/**
	 * Data provider for anchor names.
	 *
	 * @return array<string, string[]> Test parameters.
	 */
	public function data_valid_anchors() {
		return array(
			'core block'    => array( 'core/button' ),
			'third-party'   => array( 'my-plugin/testimonial' ),
			'typography'    => array( 'typography' ),
			'color group'   => array( 'theme-colors' ),
			'duotone group' => array( 'duotones' ),
		);
	}

	/**
	 * A user without `edit_theme_options` cannot create Style Book notes. An
	 * author has `edit_posts`, so this exercises the controller's per-post
	 * `edit_post` check rather than a blanket capability gate.
	 */
	public function test_author_cannot_create_note() {
		wp_set_current_user( self::$author_id );

		$response = rest_get_server()->dispatch(
			$this->note_request( $this->get_global_styles_post_id() )
		);

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_cannot_create_note', $response->get_data()['code'] );
	}

	/**
	 * Logged-out requests cannot create Style Book notes.
	 */
	public function test_anonymous_cannot_create_note() {
		$post_id = $this->get_global_styles_post_id();

		wp_set_current_user( 0 );

		$response = rest_get_server()->dispatch( $this->note_request( $post_id ) );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * An administrator can list Style Book notes in edit context.
	 */
	public function test_administrator_can_list_notes() {
		wp_set_current_user( self::$admin_id );

		$post_id = $this->get_global_styles_post_id();
		rest_get_server()->dispatch( $this->note_request( $post_id, 'typography' ) );

		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );
		$request->set_param( 'context', 'edit' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$anchors = wp_list_pluck( wp_list_pluck( $response->get_data(), 'meta' ), self::ANCHOR_META );

		$this->assertContains( 'typography', $anchors );
	}

	/**
	 * Listing notes requires `edit_theme_options`; an author with `edit_posts`
	 * is still refused.
	 */
	public function test_author_cannot_list_notes() {
		$post_id = $this->get_global_styles_post_id();

		wp_set_current_user( self::$author_id );

		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );
		$request->set_param( 'context', 'edit' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden_context', $response, 403 );
	}

	/**
	 * Logged-out requests cannot list Style Book notes.
	 */
	public function test_anonymous_cannot_list_notes() {
		$post_id = $this->get_global_styles_post_id();

		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'post', $post_id );
		$request->set_param( 'type', 'note' );
		$request->set_param( 'status', 'all' );

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * The anchor is sanitized, so markup in the value cannot survive to the
	 * client.
	 */
	public function test_anchor_is_sanitized() {
		wp_set_current_user( self::$admin_id );

		$response = rest_get_server()->dispatch(
			$this->note_request( $this->get_global_styles_post_id(), '<script>alert(1)</script>core/button' )
		);

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'core/button', $response->get_data()['meta'][ self::ANCHOR_META ] );
	}

	/**
	 * Anchors longer than the schema's `maxLength` are rejected rather than
	 * silently truncated.
	 */
	public function test_overlong_anchor_is_rejected() {
		wp_set_current_user( self::$admin_id );

		$response = rest_get_server()->dispatch(
			$this->note_request( $this->get_global_styles_post_id(), str_repeat( 'a', 101 ) )
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_too_long', $response->get_data()['code'] );
	}

	/**
	 * Notes are still refused on post types that do not declare notes support,
	 * so enabling them for global styles did not widen the gate.
	 */
	public function test_unsupported_post_type_still_rejects_notes() {
		wp_set_current_user( self::$admin_id );

		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		remove_post_type_support( 'page', 'editor' );

		$response = rest_get_server()->dispatch( $this->note_request( $page_id ) );

		add_post_type_support( 'page', 'editor' );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_comment_not_supported_post_type', $response->get_data()['code'] );
	}
}
