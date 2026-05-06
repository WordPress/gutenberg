<?php
/**
 * Tests for the standard Guidelines REST API collection.
 *
 * @package gutenberg
 */
class Gutenberg_Standard_Guidelines_REST_Controller_Test extends WP_UnitTestCase {

	/**
	 * @var int Administrator user ID.
	 */
	protected static $admin_id;

	/**
	 * REST API route base.
	 *
	 * @var string
	 */
	const REST_BASE = '/wp/v2/guidelines';

	/**
	 * Set up class fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Clean up class fixtures.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
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
	 * Creates an artifact guideline through the standard REST collection.
	 *
	 * @param array $args Optional request params to merge.
	 * @return WP_REST_Response
	 */
	private function create_artifact_guideline( array $args = array() ): WP_REST_Response {
		wp_set_current_user( self::$admin_id );

		$defaults = array(
			'status'  => 'draft',
			'title'   => 'Artifact guideline',
			'content' => 'Artifact guideline content.',
			'excerpt' => 'Artifact guideline excerpt.',
		);

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		foreach ( array_merge( $defaults, $args ) as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * The standard collection route is registered independently from the
	 * content-guidelines singleton route.
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::REST_BASE, $routes, 'Collection route not registered.' );
		$this->assertArrayHasKey( self::REST_BASE . '/(?P<id>[\d]+)', $routes, 'Single item route not registered.' );
	}

	/**
	 * Artifact guidelines can be created through the standard collection and
	 * receive the requested publish status and fallback artifact type term.
	 */
	public function test_create_artifact_guideline() {
		$response = $this->create_artifact_guideline( array( 'status' => 'publish' ) );

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
	 * Artifact guidelines are listed by the standard collection route.
	 */
	public function test_get_items_lists_artifact_guidelines() {
		$first_response  = $this->create_artifact_guideline( array( 'title' => 'First artifact' ) );
		$second_response = $this->create_artifact_guideline( array( 'title' => 'Second artifact' ) );

		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'status', 'draft' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$ids = wp_list_pluck( $response->get_data(), 'id' );

		$this->assertContains( $first_response->get_data()['id'], $ids );
		$this->assertContains( $second_response->get_data()['id'], $ids );
	}

	/**
	 * Unauthenticated users cannot list published artifact guidelines.
	 */
	public function test_get_items_unauthenticated_cannot_read_published_artifacts() {
		$this->create_artifact_guideline( array( 'status' => 'publish' ) );

		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * Unauthenticated users cannot read a published artifact guideline by ID.
	 */
	public function test_get_item_unauthenticated_cannot_read_published_artifact() {
		$create_response = $this->create_artifact_guideline( array( 'status' => 'publish' ) );
		$post_id         = $create_response->get_data()['id'];

		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 401, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * Authors can pass the post type read capability but must still satisfy
	 * the per-post check for non-public statuses.
	 */
	public function test_get_item_author_cannot_read_other_users_private_guideline() {
		$create_response = $this->create_artifact_guideline( array( 'status' => 'private' ) );
		$post_id         = $create_response->get_data()['id'];

		$author_id = self::factory()->user->create( array( 'role' => 'author' ) );
		wp_set_current_user( $author_id );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id );
		$response = rest_get_server()->dispatch( $request );

		$status = $response->get_status();
		$code   = $response->get_data()['code'] ?? null;

		self::delete_user( $author_id );

		$this->assertSame( 403, $status );
		$this->assertSame( 'rest_forbidden', $code );
	}

	/**
	 * Artifact guidelines can be updated through the standard item route.
	 */
	public function test_update_artifact_guideline() {
		$create_response = $this->create_artifact_guideline();
		$post_id         = $create_response->get_data()['id'];

		$request = new WP_REST_Request( 'PATCH', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'title', 'Updated artifact guideline' );
		$request->set_param( 'content', 'Updated artifact content.' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( 'Updated artifact guideline', $data['title']['raw'] );
		$this->assertSame( 'Updated artifact content.', $data['content']['raw'] );
		$this->assertSame( 'draft', $data['status'] );

		$terms = wp_get_object_terms( $post_id, Gutenberg_Guidelines_Post_Type::TAXONOMY, array( 'fields' => 'slugs' ) );

		$this->assertSame( array( 'artifact' ), $terms );
	}

	/**
	 * Artifact guidelines can be deleted through the standard item route.
	 */
	public function test_delete_artifact_guideline() {
		$create_response = $this->create_artifact_guideline();
		$post_id         = $create_response->get_data()['id'];

		$request = new WP_REST_Request( 'DELETE', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNull( get_post( $post_id ) );
	}
}
