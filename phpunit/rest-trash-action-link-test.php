<?php
/**
 * Tests for the `action-trash` link on post and comment REST responses.
 *
 * @package gutenberg
 */

/**
 * @group restapi
 */
class Gutenberg_REST_Trash_Action_Link_Test extends WP_Test_REST_TestCase {

	const REL = 'https://api.w.org/action-trash';

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Post ID.
	 *
	 * @var int
	 */
	protected static $post_id;

	/**
	 * Comment ID.
	 *
	 * @var int
	 */
	protected static $comment_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id   = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$post_id    = $factory->post->create();
		self::$comment_id = $factory->comment->create( array( 'comment_post_ID' => self::$post_id ) );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$admin_id );
	}

	/**
	 * Returns the response links for a GET request.
	 *
	 * @param string $route  REST route.
	 * @param array  $params Query parameters.
	 * @return array Response links.
	 */
	private function get_links( $route, $params = array( 'context' => 'edit' ) ) {
		$request = new WP_REST_Request( 'GET', $route );
		$request->set_query_params( $params );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status(), 'The request should succeed.' );

		$links = $response->get_links();
		$this->assertArrayHasKey( 'self', $links, 'The response should have a self link.' );

		return $links;
	}

	/**
	 * @covers ::gutenberg_add_post_trash_action_link
	 */
	public function test_post_has_no_link_in_view_context() {
		$links = $this->get_links( '/wp/v2/posts/' . self::$post_id, array( 'context' => 'view' ) );

		$this->assertArrayNotHasKey( self::REL, $links, 'The link should be absent.' );
	}

	/**
	 * @covers ::gutenberg_add_post_trash_action_link
	 */
	public function test_post_has_no_link_when_not_trashable() {
		add_filter( 'rest_post_trashable', '__return_false' );

		$links = $this->get_links( '/wp/v2/posts/' . self::$post_id );

		$this->assertArrayNotHasKey( self::REL, $links, 'The link should be absent.' );
	}

	/**
	 * @covers ::gutenberg_add_post_trash_action_link
	 */
	public function test_post_has_no_link_when_already_trashed() {
		$post_id = self::factory()->post->create( array( 'post_status' => 'trash' ) );

		$links = $this->get_links( '/wp/v2/posts/' . $post_id );

		$this->assertArrayNotHasKey( self::REL, $links, 'The link should be absent.' );
	}

	/**
	 * @covers ::gutenberg_add_post_trash_action_link
	 */
	public function test_post_has_no_link_when_user_cannot_delete() {
		add_filter(
			'map_meta_cap',
			static function ( $caps, $cap ) {
				return 'delete_post' === $cap ? array( 'do_not_allow' ) : $caps;
			},
			10,
			2
		);

		$links = $this->get_links( '/wp/v2/posts/' . self::$post_id );

		$this->assertArrayNotHasKey( self::REL, $links, 'The link should be absent.' );
	}

	/**
	 * @covers ::gutenberg_add_post_trash_action_link
	 */
	public function test_attachment_has_no_link_without_media_trash() {
		$this->assertFalse( MEDIA_TRASH, 'The test expects the default MEDIA_TRASH value.' );
		$attachment_id = self::factory()->attachment->create();

		$links = $this->get_links( '/wp/v2/media/' . $attachment_id );

		$this->assertArrayNotHasKey( self::REL, $links, 'The link should be absent.' );
	}

	/**
	 * @covers ::gutenberg_add_post_trash_action_link
	 */
	public function test_attachment_has_one_link_when_trashable() {
		add_filter( 'rest_attachment_trashable', '__return_true' );
		$attachment_id = self::factory()->attachment->create();

		$links = $this->get_links( '/wp/v2/media/' . $attachment_id );

		$this->assertArrayHasKey( self::REL, $links, 'The link should be present.' );
		$this->assertCount( 1, $links[ self::REL ], 'The link should be added once.' );
	}

	/**
	 * @covers ::gutenberg_register_post_trash_action_link
	 */
	public function test_menu_item_has_no_link() {
		$menu_id      = wp_create_nav_menu( 'Trash link' );
		$menu_item_id = wp_update_nav_menu_item(
			$menu_id,
			0,
			array(
				'menu-item-title'  => 'Home',
				'menu-item-url'    => home_url(),
				'menu-item-status' => 'publish',
			)
		);

		$links = $this->get_links( '/wp/v2/menu-items/' . $menu_item_id );

		$this->assertArrayNotHasKey( self::REL, $links, 'The link should be absent.' );
	}

	/**
	 * @covers ::gutenberg_add_post_trash_action_link
	 */
	public function test_post_has_no_links_when_fields_exclude_them() {
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$post_id );
		$request->set_query_params(
			array(
				'context' => 'edit',
				'_fields' => 'id',
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( array(), $response->get_links() );
	}

	/**
	 * @covers ::gutenberg_add_comment_trash_action_link
	 */
	public function test_comment_has_link_for_moderator() {
		$links = $this->get_links( '/wp/v2/comments/' . self::$comment_id );

		$this->assertArrayHasKey( self::REL, $links, 'The link should be present.' );
	}

	/**
	 * @covers ::gutenberg_add_comment_trash_action_link
	 */
	public function test_note_has_link_for_post_author() {
		$author_id = self::factory()->user->create( array( 'role' => 'author' ) );
		$post_id   = self::factory()->post->create( array( 'post_author' => $author_id ) );
		$note_id   = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'comment_type'    => 'note',
				'user_id'         => $author_id,
			)
		);
		wp_set_current_user( $author_id );

		$links = $this->get_links( '/wp/v2/comments/' . $note_id );

		$this->assertArrayHasKey( self::REL, $links, 'The link should be present.' );
	}

	/**
	 * @covers ::gutenberg_add_comment_trash_action_link
	 */
	public function test_comment_has_no_link_in_view_context() {
		$links = $this->get_links( '/wp/v2/comments/' . self::$comment_id, array( 'context' => 'view' ) );

		$this->assertArrayNotHasKey( self::REL, $links, 'The link should be absent.' );
	}

	/**
	 * @covers ::gutenberg_add_comment_trash_action_link
	 */
	public function test_note_has_no_link_when_user_cannot_edit_it() {
		$author_id = self::factory()->user->create( array( 'role' => 'author' ) );
		$post_id   = self::factory()->post->create( array( 'post_author' => $author_id ) );
		$note_id   = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'comment_type'    => 'note',
				'user_id'         => $author_id,
			)
		);
		wp_set_current_user( $author_id );
		add_filter(
			'map_meta_cap',
			static function ( $caps, $cap, $user_id, $args ) use ( $note_id ) {
				return 'edit_comment' === $cap && (int) $args[0] === $note_id ? array( 'do_not_allow' ) : $caps;
			},
			10,
			4
		);

		// Listing a post's notes checks `edit_post`, and authors can read their own notes.
		$request = new WP_REST_Request( 'GET', '/wp/v2/comments' );
		$request->set_query_params(
			array(
				'post'    => $post_id,
				'type'    => 'note',
				'context' => 'edit',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status(), 'The request should succeed.' );
		$this->assertSame( $note_id, $data[0]['id'], 'The note should be listed.' );
		$this->assertArrayHasKey( 'self', $data[0]['_links'], 'The note should have a self link.' );
		// Collections compact link relations to curies.
		$this->assertArrayNotHasKey( 'wp:action-trash', $data[0]['_links'], 'The link should be absent.' );
	}

	/**
	 * @covers ::gutenberg_add_comment_trash_action_link
	 */
	public function test_comment_has_no_link_when_not_trashable() {
		add_filter( 'rest_comment_trashable', '__return_false' );

		$links = $this->get_links( '/wp/v2/comments/' . self::$comment_id );

		$this->assertArrayNotHasKey( self::REL, $links, 'The link should be absent.' );
	}

	/**
	 * @covers ::gutenberg_add_comment_trash_action_link
	 */
	public function test_comment_has_no_link_when_already_trashed() {
		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_approved' => 'trash',
			)
		);

		$links = $this->get_links( '/wp/v2/comments/' . $comment_id );

		$this->assertArrayNotHasKey( self::REL, $links, 'The link should be absent.' );
	}
}
