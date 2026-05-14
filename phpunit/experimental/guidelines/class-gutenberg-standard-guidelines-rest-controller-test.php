<?php
/**
 * Tests for the standard Guidelines REST API collection.
 *
 * @package gutenberg
 */
class Gutenberg_Standard_Guidelines_REST_Controller_Test extends WP_UnitTestCase {

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
	const REST_BASE = '/wp/v2/guidelines';

	/**
	 * Set up class fixtures: one user per default role.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		foreach ( array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' ) as $role ) {
			self::$users[ $role ] = $factory->user->create( array( 'role' => $role ) );
		}
	}

	/**
	 * Clean up class fixtures.
	 */
	public static function wpTearDownAfterClass() {
		foreach ( self::$users as $user_id ) {
			self::delete_user( $user_id );
		}
		self::$users = array();
	}

	/**
	 * Clean up guidelines posts and taxonomy terms after each test.
	 */
	public function tear_down() {
		$posts = get_posts(
			array(
				'post_type'      => Gutenberg_Guidelines_Post_Type::POST_TYPE,
				'post_status'    => 'any',
				'posts_per_page' => -1,
			)
		);
		foreach ( $posts as $post ) {
			wp_delete_post( $post->ID, true );
		}

		$terms = get_terms(
			array(
				'taxonomy'   => Gutenberg_Guidelines_Post_Type::TAXONOMY,
				'hide_empty' => false,
			)
		);
		if ( ! is_wp_error( $terms ) ) {
			foreach ( $terms as $term ) {
				wp_delete_term( $term->term_id, Gutenberg_Guidelines_Post_Type::TAXONOMY );
			}
		}

		parent::tear_down();
	}

	/**
	 * Dispatch a create request to the collection as the administrator.
	 *
	 * @param array $args Optional request params merged over the defaults.
	 * @return WP_REST_Response
	 */
	private function create_guideline( array $args = array() ): WP_REST_Response {
		wp_set_current_user( self::$users['administrator'] );

		$defaults = array(
			'status'  => 'draft',
			'title'   => 'Guideline',
			'content' => 'Guideline content.',
			'excerpt' => 'Guideline excerpt.',
		);

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		foreach ( array_merge( $defaults, $args ) as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Insert a guideline post owned by the named role.
	 */
	private function make_post( $owner_role, $status ) {
		return wp_insert_post(
			array(
				'post_type'    => Gutenberg_Guidelines_Post_Type::POST_TYPE,
				'post_status'  => $status,
				'post_title'   => "endpoint test {$owner_role} {$status}",
				'post_content' => 'body',
				'post_author'  => self::$users[ $owner_role ],
			)
		);
	}

	/**
	 * The standard collection and single-item routes are registered.
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::REST_BASE, $routes, 'Collection route not registered.' );
		$this->assertArrayHasKey( self::REST_BASE . '/(?P<id>[\d]+)', $routes, 'Single item route not registered.' );
	}

	/**
	 * A POST to the collection creates the guideline and the save_post
	 * hook assigns the `artifact` fallback type term.
	 */
	public function test_create_guideline() {
		$response = $this->create_guideline( array( 'status' => 'publish' ) );

		$this->assertSame( 201, $response->get_status() );

		$data = $response->get_data();
		$this->assertArrayHasKey( 'id', $data );
		$this->assertArrayHasKey( 'title', $data );
		$this->assertArrayHasKey( 'content', $data );
		$this->assertArrayHasKey( 'excerpt', $data );
		$this->assertSame( 'publish', $data['status'] );
		$this->assertArrayNotHasKey( 'guideline_categories', $data );

		$terms = wp_get_object_terms( $data['id'], Gutenberg_Guidelines_Post_Type::TAXONOMY, array( 'fields' => 'slugs' ) );

		$this->assertSame( array( 'artifact' ), $terms );
	}

	/**
	 * The collection route returns guidelines created via the same route.
	 */
	public function test_get_items_lists_guidelines() {
		$first_response  = $this->create_guideline( array( 'title' => 'First guideline' ) );
		$second_response = $this->create_guideline( array( 'title' => 'Second guideline' ) );

		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'status', 'draft' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$ids = wp_list_pluck( $response->get_data(), 'id' );

		$this->assertContains( $first_response->get_data()['id'], $ids );
		$this->assertContains( $second_response->get_data()['id'], $ids );
	}

	/**
	 * Anonymous reads of the collection are rejected with `rest_forbidden`.
	 */
	public function test_get_items_blocks_anonymous() {
		$this->create_guideline( array( 'status' => 'publish' ) );

		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * Anonymous reads of a single item are rejected with `rest_forbidden`,
	 * even when the row is `publish`.
	 */
	public function test_get_item_blocks_anonymous() {
		$create_response = $this->create_guideline( array( 'status' => 'publish' ) );
		$post_id         = $create_response->get_data()['id'];

		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * An authenticated reader cannot fetch another user's private row.
	 */
	public function test_get_item_blocks_others_private() {
		$create_response = $this->create_guideline( array( 'status' => 'private' ) );
		$post_id         = $create_response->get_data()['id'];

		wp_set_current_user( self::$users['author'] );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * A PATCH to the item route updates title and content without
	 * changing the row's taxonomy assignment.
	 */
	public function test_update_guideline() {
		$create_response = $this->create_guideline();
		$post_id         = $create_response->get_data()['id'];

		$request = new WP_REST_Request( 'PATCH', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'title', 'Updated guideline' );
		$request->set_param( 'content', 'Updated guideline content.' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 'Updated guideline', $data['title']['raw'] );
		$this->assertSame( 'Updated guideline content.', $data['content']['raw'] );
		$this->assertSame( 'draft', $data['status'] );

		$terms = wp_get_object_terms( $post_id, Gutenberg_Guidelines_Post_Type::TAXONOMY, array( 'fields' => 'slugs' ) );

		$this->assertSame( array( 'artifact' ), $terms );
	}

	/**
	 * A DELETE with `force=true` removes the row entirely.
	 */
	public function test_delete_guideline() {
		$create_response = $this->create_guideline();
		$post_id         = $create_response->get_data()['id'];

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
	public function test_create_enforces_status_policy( $role, $requested_status, $expected_status, $expected_error ) {
		wp_set_current_user( self::$users[ $role ] );

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
	public function data_create_enforces_status_policy() {
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
	public function test_update_enforces_per_post_permission( $role, $owner_role, $status, $expected_error ) {
		$post_id = $this->make_post( $owner_role, $status );
		wp_set_current_user( self::$users[ $role ] );

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
	public function data_update_enforces_per_post_permission() {
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
	public function test_delete_enforces_per_post_permission( $role, $owner_role, $status, $expected_error ) {
		$post_id = $this->make_post( $owner_role, $status );
		wp_set_current_user( self::$users[ $role ] );

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
	public function data_delete_enforces_per_post_permission() {
		return array(
			'contributor + own private'    => array( 'contributor', 'contributor', 'private', null ),
			'contributor + others private' => array( 'contributor', 'administrator', 'private', 'rest_cannot_delete' ),
		);
	}
}
