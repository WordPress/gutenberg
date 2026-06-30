<?php
/**
 * Tests for the standard Knowledge REST API collection.
 *
 * @package gutenberg
 *
 * @group knowledge
 */
class Gutenberg_Knowledge_REST_Controller_Test extends WP_UnitTestCase {

	/**
	 * Map of role => user ID. Populated once per test class.
	 *
	 * @var array<string,int>
	 */
	protected static $users = array();

	/**
	 * REST API route base.
	 *
	 * @var string
	 */
	const REST_BASE = '/wp/v2/knowledge';

	/**
	 * Set up class fixtures: one user per default role.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		foreach ( array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' ) as $role ) {
			self::$users[ $role ] = $factory->user->create( array( 'role' => $role ) );
		}
	}

	/**
	 * Clean up class fixtures.
	 */
	public static function wpTearDownAfterClass(): void {
		foreach ( self::$users as $user_id ) {
			self::delete_user( $user_id );
		}
		self::$users = array();
	}

	/**
	 * Creates a knowledge post fixture owned by the named role and saved with
	 * the given post status.
	 *
	 * @param string $owner_role Role key from the self::$users fixture map.
	 * @param string $status     Post status for the knowledge post fixture.
	 * @return int Inserted knowledge post ID.
	 */
	private function create_knowledge_post( string $owner_role, string $status ): int {
		return self::factory()->post->create(
			array(
				'post_type'    => Gutenberg_Knowledge_Post_Type::POST_TYPE,
				'post_status'  => $status,
				'post_title'   => "{$status} knowledge post owned by {$owner_role}",
				'post_content' => "Knowledge fixture content for {$owner_role} with {$status} status.",
				'post_author'  => self::$users[ $owner_role ],
			)
		);
	}

	/**
	 * Switches the current user to a fixture user with the named role.
	 *
	 * @param string $role Role key from the self::$users fixture map.
	 * @return void
	 */
	private function switch_to_user_role( string $role ): void {
		wp_set_current_user( self::$users[ $role ] );
	}

	/**
	 * The standard collection and single-item routes are registered, along with
	 * the revisions routes. Autosave support is removed, so the autosaves routes
	 * are not registered.
	 */
	public function test_register_routes(): void {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::REST_BASE, $routes, 'Collection route not registered.' );
		$this->assertArrayHasKey( self::REST_BASE . '/(?P<id>[\d]+)', $routes, 'Single item route not registered.' );

		// Revisions are supported.
		$this->assertArrayHasKey( self::REST_BASE . '/(?P<parent>[\d]+)/revisions', $routes, 'Revisions collection route not registered.' );
		$this->assertArrayHasKey( self::REST_BASE . '/(?P<parent>[\d]+)/revisions/(?P<id>[\d]+)', $routes, 'Revision single item route not registered.' );

		// Autosave support is removed, so the autosaves routes are not registered.
		$this->assertArrayNotHasKey( self::REST_BASE . '/(?P<id>[\d]+)/autosaves', $routes, 'Autosaves collection route should not be registered.' );
		$this->assertArrayNotHasKey( self::REST_BASE . '/(?P<parent>[\d]+)/autosaves/(?P<id>[\d]+)', $routes, 'Autosave single item route should not be registered.' );
	}

	/**
	 * A POST to the collection creates the knowledge post and the save_post
	 * hook assigns the `note` fallback type term.
	 */
	public function test_create_knowledge_post(): void {
		$this->switch_to_user_role( 'administrator' );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_param( 'status', 'publish' );
		$request->set_param( 'title', 'Knowledge post' );
		$request->set_param( 'content', 'Knowledge post content.' );
		$request->set_param( 'excerpt', 'Knowledge post excerpt.' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 201, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'id', $data );
		$this->assertArrayHasKey( 'title', $data );
		$this->assertArrayHasKey( 'content', $data );
		$this->assertArrayHasKey( 'excerpt', $data );
		$this->assertSame( 'publish', $data['status'] );
		$this->assertArrayNotHasKey( 'guideline_categories', $data );

		$terms = wp_get_object_terms( $data['id'], Gutenberg_Knowledge_Post_Type::TAXONOMY, array( 'fields' => 'slugs' ) );

		$this->assertSame( array( 'note' ), $terms );
	}

	/**
	 * A POST that explicitly supplies a `wp_knowledge_type` term keeps that
	 * term; the `note` fallback only applies when no term is given.
	 */
	public function test_create_knowledge_post_preserves_explicit_type(): void {
		$memory_term_id = self::factory()->term->create(
			array(
				'taxonomy' => Gutenberg_Knowledge_Post_Type::TAXONOMY,
				'name'     => 'Memory',
				'slug'     => 'memory',
			)
		);

		$this->switch_to_user_role( 'administrator' );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_param( 'status', 'private' );
		$request->set_param( 'title', 'Typed knowledge post' );
		$request->set_param( Gutenberg_Knowledge_Post_Type::TAXONOMY, array( $memory_term_id ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 201, $response->get_status() );

		$terms = wp_get_object_terms(
			$response->get_data()['id'],
			Gutenberg_Knowledge_Post_Type::TAXONOMY,
			array( 'fields' => 'slugs' )
		);

		$this->assertSame( array( 'memory' ), $terms );
	}

	/**
	 * The collection route returns matching knowledge posts and totals.
	 */
	public function test_get_items_lists_knowledge_posts(): void {
		$first_post_id  = $this->create_knowledge_post( 'administrator', 'draft' );
		$second_post_id = $this->create_knowledge_post( 'administrator', 'draft' );

		$this->switch_to_user_role( 'administrator' );

		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'status', 'draft' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$ids     = wp_list_pluck( $response->get_data(), 'id' );
		$headers = $response->get_headers();

		$this->assertContains( $first_post_id, $ids );
		$this->assertContains( $second_post_id, $ids );
		$this->assertSame( 2, (int) $headers['X-WP-Total'] );
	}

	/**
	 * With no `status` param the collection follows the WordPress default and
	 * lists `publish` knowledge rows. This is the happy path for
	 * `GET /wp/v2/knowledge`.
	 */
	public function test_get_items_default_status_returns_publish(): void {
		$publish_post_id = $this->create_knowledge_post( 'administrator', 'publish' );

		$this->switch_to_user_role( 'administrator' );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();

		$this->assertContains( $publish_post_id, wp_list_pluck( $data, 'id' ), 'Publish row should be listed by default.' );
		$this->assertSame( 1, (int) $response->get_headers()['X-WP-Total'] );
		$this->assertSame( 'publish', $data[0]['status'] );
	}

	/**
	 * A collection GET with no `status` param excludes `draft` and `private`
	 * rows. Knowledge rows created through the normal flows are `draft` (the
	 * content-guidelines singleton) or `private` (`POST /wp/v2/knowledge`), so a
	 * bare `GET /wp/v2/knowledge` does not return them even though the caller can
	 * read them. Callers must pass an explicit `?status` to see their own draft
	 * or private rows.
	 *
	 * Characterization coverage for the report in
	 * https://github.com/WordPress/gutenberg/pull/79149#issuecomment-4800953255.
	 */
	public function test_get_items_default_status_excludes_draft_and_private(): void {
		$draft_post_id   = $this->create_knowledge_post( 'administrator', 'draft' );
		$private_post_id = $this->create_knowledge_post( 'administrator', 'private' );

		$this->switch_to_user_role( 'administrator' );

		// No `status` param: the parent controller defaults to `publish`.
		$default_request  = new WP_REST_Request( 'GET', self::REST_BASE );
		$default_response = rest_get_server()->dispatch( $default_request );

		$this->assertSame( 200, $default_response->get_status() );

		$default_ids = wp_list_pluck( $default_response->get_data(), 'id' );

		$this->assertNotContains( $draft_post_id, $default_ids, 'Draft row should be excluded without an explicit status.' );
		$this->assertNotContains( $private_post_id, $default_ids, 'Private row should be excluded without an explicit status.' );
		$this->assertSame( 0, (int) $default_response->get_headers()['X-WP-Total'] );
	}

	/**
	 * Collection totals are scoped to the private rows readable by the caller.
	 */
	public function test_get_items_private_totals_are_scoped_to_current_user(): void {
		$own_private_post_id   = $this->create_knowledge_post( 'contributor', 'private' );
		$other_private_post_id = $this->create_knowledge_post( 'author', 'private' );

		$this->switch_to_user_role( 'contributor' );

		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'status', 'private' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$ids     = wp_list_pluck( $response->get_data(), 'id' );
		$headers = $response->get_headers();

		$this->assertContains( $own_private_post_id, $ids );
		$this->assertNotContains( $other_private_post_id, $ids );
		$this->assertSame( 1, (int) $headers['X-WP-Total'] );
	}

	/**
	 * Anonymous reads of the collection are rejected with `rest_cannot_read`.
	 */
	public function test_get_items_blocks_anonymous(): void {
		$this->create_knowledge_post( 'administrator', 'publish' );

		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'rest_cannot_read', $response->get_data()['code'] );
	}

	/**
	 * Anonymous reads of a single item are rejected with `rest_forbidden`,
	 * even when the row is `publish`.
	 */
	public function test_get_item_blocks_anonymous(): void {
		$post_id = $this->create_knowledge_post( 'administrator', 'publish' );

		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * An authenticated reader cannot fetch another user's private row.
	 */
	public function test_get_item_blocks_others_private(): void {
		$post_id = $this->create_knowledge_post( 'administrator', 'private' );

		$this->switch_to_user_role( 'author' );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * A PATCH to the item route updates title and content without
	 * changing the row's taxonomy assignment.
	 */
	public function test_update_knowledge_post(): void {
		$post_id = $this->create_knowledge_post( 'administrator', 'draft' );

		$this->switch_to_user_role( 'administrator' );

		$request = new WP_REST_Request( 'PATCH', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'title', 'Updated knowledge post' );
		$request->set_param( 'content', 'Updated knowledge post content.' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 'Updated knowledge post', $data['title']['raw'] );
		$this->assertSame( 'Updated knowledge post content.', $data['content']['raw'] );
		$this->assertSame( 'draft', $data['status'] );

		$terms = wp_get_object_terms( $post_id, Gutenberg_Knowledge_Post_Type::TAXONOMY, array( 'fields' => 'slugs' ) );

		$this->assertSame( array( 'note' ), $terms );
	}

	/**
	 * A DELETE with `force=true` removes the row entirely.
	 */
	public function test_delete_knowledge_post(): void {
		$post_id = $this->create_knowledge_post( 'administrator', 'draft' );

		$this->switch_to_user_role( 'administrator' );

		$request = new WP_REST_Request( 'DELETE', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNull( get_post( $post_id ) );
	}

	/**
	 * Non-publishers may only create rows with `status: private` (or
	 * omit the param, in which case the controller defaults to
	 * `private`); Administrators may use any status the parent accepts.
	 *
	 * @dataProvider data_create_enforces_status_policy
	 */
	public function test_create_enforces_status_policy(
		string $role,
		?string $requested_status,
		?string $expected_status,
		?string $expected_error
	): void {
		$this->switch_to_user_role( $role );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		if ( null !== $requested_status ) {
			$request->set_param( 'status', $requested_status );
		}
		$request->set_param( 'title', "{$role} requesting " . ( null === $requested_status ? '(omitted)' : $requested_status ) );
		$request->set_param( 'content', 'body' );
		$response = rest_get_server()->dispatch( $request );

		if ( null === $expected_error ) {
			$this->assertSame( 201, $response->get_status() );
			$this->assertSame( $expected_status, $response->get_data()['status'] );
			return;
		}

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( $expected_error, $response->get_data()['code'] );
	}

	/**
	 * @return array Rows: [role, requested_status, expected_status, expected_error].
	 */
	public function data_create_enforces_status_policy(): array {
		return array(
			// Status omitted: controller defaults to `private`.
			'contributor + omitted'   => array( 'contributor', null, 'private', null ),
			'administrator + omitted' => array( 'administrator', null, 'private', null ),

			// Explicit `private` honored for any role above Subscriber.
			'contributor + private'   => array( 'contributor', 'private', 'private', null ),

			// Administrator may use any status the parent accepts.
			'administrator + publish' => array( 'administrator', 'publish', 'publish', null ),
			'administrator + draft'   => array( 'administrator', 'draft', 'draft', null ),

			// Non-publishers limited to `private` — any other status is rejected.
			'contributor + publish'   => array( 'contributor', 'publish', null, 'rest_cannot_publish' ),
			'contributor + draft'     => array( 'contributor', 'draft', null, 'rest_cannot_publish' ),

			// Subscriber fails the parent's `create_posts` floor.
			'subscriber + private'    => array( 'subscriber', 'private', null, 'rest_cannot_create' ),
		);
	}

	/**
	 * Owners may update their own private rows; updates to other users'
	 * rows are denied with `rest_cannot_edit`.
	 *
	 * @dataProvider data_update_enforces_per_post_permission
	 */
	public function test_update_enforces_per_post_permission(
		string $role,
		string $owner_role,
		string $status,
		?string $expected_error
	): void {
		$post_id = $this->create_knowledge_post( $owner_role, $status );
		$this->switch_to_user_role( $role );

		$request = new WP_REST_Request( 'PATCH', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'title', "{$role} updating {$owner_role}'s {$status}" );
		$response = rest_get_server()->dispatch( $request );

		if ( null === $expected_error ) {
			$this->assertSame( 200, $response->get_status() );
			return;
		}

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( $expected_error, $response->get_data()['code'] );
	}

	/**
	 * @return array Rows: [role, owner_role, status, expected_error].
	 */
	public function data_update_enforces_per_post_permission(): array {
		return array(
			'contributor + own private'    => array( 'contributor', 'contributor', 'private', null ),
			'contributor + others private' => array( 'contributor', 'administrator', 'private', 'rest_cannot_edit' ),
		);
	}

	/**
	 * Owners may delete their own private rows; deletes of other users'
	 * rows are denied with `rest_cannot_delete` and the row remains in
	 * place.
	 *
	 * @dataProvider data_delete_enforces_per_post_permission
	 */
	public function test_delete_enforces_per_post_permission(
		string $role,
		string $owner_role,
		string $status,
		?string $expected_error
	): void {
		$post_id = $this->create_knowledge_post( $owner_role, $status );
		$this->switch_to_user_role( $role );

		$request = new WP_REST_Request( 'DELETE', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );

		if ( null === $expected_error ) {
			$this->assertSame( 200, $response->get_status() );
			$this->assertNull( get_post( $post_id ) );
			return;
		}

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( $expected_error, $response->get_data()['code'] );
		$this->assertInstanceOf( WP_Post::class, get_post( $post_id ) );
	}

	/**
	 * @return array Rows: [role, owner_role, status, expected_error].
	 */
	public function data_delete_enforces_per_post_permission(): array {
		return array(
			'contributor + own private'    => array( 'contributor', 'contributor', 'private', null ),
			'contributor + others private' => array( 'contributor', 'administrator', 'private', 'rest_cannot_delete' ),
		);
	}
}
