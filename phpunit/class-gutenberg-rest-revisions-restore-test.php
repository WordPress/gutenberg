<?php
/**
 * Unit tests covering the route to restore a revision.
 *
 * @package gutenberg
 *
 * @group rest-api
 */
class Gutenberg_REST_Revisions_Restore_Test extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $contributor_id;

	/**
	 * @var int
	 */
	protected static $post_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id       = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$contributor_id = $factory->user->create( array( 'role' => 'contributor' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$contributor_id );
	}

	public function set_up() {
		parent::set_up();

		register_post_meta(
			'post',
			'gutenberg_test_revisioned_meta',
			array(
				'type'              => 'string',
				'single'            => true,
				'revisions_enabled' => true,
			)
		);

		wp_set_current_user( self::$admin_id );

		self::$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$admin_id,
				'post_content' => 'Original content',
				'post_title'   => 'Original title',
			)
		);
		update_post_meta( self::$post_id, 'gutenberg_test_revisioned_meta', 'Original meta' );
		// The meta is copied to a revision when the post is saved again.
		wp_update_post(
			array(
				'ID'           => self::$post_id,
				'post_content' => 'Original content',
			)
		);

		wp_update_post(
			array(
				'ID'           => self::$post_id,
				'post_content' => 'Updated content',
				'post_title'   => 'Updated title',
			)
		);
		update_post_meta( self::$post_id, 'gutenberg_test_revisioned_meta', 'Updated meta' );
		wp_update_post(
			array(
				'ID'           => self::$post_id,
				'post_content' => 'Updated content',
			)
		);
	}

	public function tear_down() {
		unregister_post_meta( 'post', 'gutenberg_test_revisioned_meta' );
		wp_delete_post( self::$post_id, true );

		parent::tear_down();
	}

	/**
	 * Returns the oldest revision holding the original content and meta.
	 *
	 * @return WP_Post The revision.
	 */
	private function get_original_revision() {
		$revisions = wp_get_post_revisions( self::$post_id );

		foreach ( $revisions as $revision ) {
			if (
				'Original content' === $revision->post_content &&
				'Original meta' === get_post_meta( $revision->ID, 'gutenberg_test_revisioned_meta', true )
			) {
				return $revision;
			}
		}

		$this->fail( 'No revision holds the original content and meta.' );
	}

	private function restore_request( $revision_id, $post_id = null ) {
		return new WP_REST_Request(
			'POST',
			'/wp/v2/posts/' . ( null === $post_id ? self::$post_id : $post_id ) . '/revisions/' . $revision_id . '/restore'
		);
	}

	public function test_the_route_is_registered() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey(
			'/wp/v2/posts/(?P<parent>[\d]+)/revisions/(?P<id>[\d]+)/restore',
			$routes
		);
	}

	public function test_it_restores_post_fields_and_revisioned_meta() {
		$revision = $this->get_original_revision();

		$response = rest_get_server()->dispatch( $this->restore_request( $revision->ID ) );
		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();
		$this->assertSame( self::$post_id, $data['parent'] );
		$this->assertSame( (int) $revision->ID, $data['revision'] );
		$this->assertSame( mysql_to_rfc3339( $revision->post_date ), $data['date'] );

		$post = get_post( self::$post_id );
		$this->assertSame( 'Original content', $post->post_content );
		$this->assertSame( 'Original title', $post->post_title );
		$this->assertSame(
			'Original meta',
			get_post_meta( self::$post_id, 'gutenberg_test_revisioned_meta', true )
		);
	}

	public function test_it_requires_permission_to_edit_the_post() {
		$revision = $this->get_original_revision();

		wp_set_current_user( self::$contributor_id );
		$response = rest_get_server()->dispatch( $this->restore_request( $revision->ID ) );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame(
			'Updated content',
			get_post( self::$post_id )->post_content
		);
	}

	public function test_it_rejects_a_revision_of_another_post() {
		$revision   = $this->get_original_revision();
		$other_post = self::factory()->post->create( array( 'post_author' => self::$admin_id ) );

		$response = rest_get_server()->dispatch( $this->restore_request( $revision->ID, $other_post ) );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'rest_revision_parent_id_mismatch', $response->get_data()['code'] );

		wp_delete_post( $other_post, true );
	}

	public function test_it_rejects_an_unknown_revision() {
		$response = rest_get_server()->dispatch( $this->restore_request( 999999 ) );

		$this->assertSame( 404, $response->get_status() );
		$this->assertSame( 'rest_post_invalid_id', $response->get_data()['code'] );
	}
}
