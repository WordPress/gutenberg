<?php
/**
 * Tests for only including revisioned meta in revision and autosave responses.
 *
 * @package gutenberg
 */

/**
 * @group restapi
 *
 * @covers ::gutenberg_rest_only_include_revisioned_meta
 */
class Gutenberg_REST_Only_Include_Revisioned_Meta_Test extends WP_Test_REST_TestCase {

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	protected static $editor_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
	}

	public function set_up() {
		parent::set_up();

		register_post_meta(
			'post',
			'revisioned_meta',
			array(
				'show_in_rest'      => true,
				'single'            => true,
				'type'              => 'string',
				'revisions_enabled' => true,
			)
		);
		register_post_meta(
			'post',
			'non_revisioned_meta',
			array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'string',
			)
		);

		wp_set_current_user( self::$editor_id );
	}

	public function test_revision_only_includes_revisioned_meta() {
		list( $post_id, $revision_id ) = $this->create_post_with_revision();

		$meta = $this->get_revision_meta( $post_id, $revision_id );

		$this->assertSame( 'revisioned value', $meta['revisioned_meta'], 'Revisioned meta should be read from the revision.' );
		$this->assertArrayNotHasKey( 'non_revisioned_meta', $meta, 'Meta that is not revisioned should not be included.' );
	}

	public function test_revisions_collection_only_includes_revisioned_meta() {
		list( $post_id ) = $this->create_post_with_revision();
		$this->create_revision( $post_id );

		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', rest_get_route_for_post( $post_id ) . '/revisions' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertCount( 2, $response->get_data() );
		foreach ( $response->get_data() as $revision ) {
			$this->assertArrayHasKey( 'revisioned_meta', $revision['meta'] );
			$this->assertArrayNotHasKey( 'non_revisioned_meta', $revision['meta'] );
		}
	}

	public function test_autosave_only_includes_revisioned_meta() {
		$post_id = self::factory()->post->create();
		update_post_meta( $post_id, 'revisioned_meta', 'revisioned value' );
		update_post_meta( $post_id, 'non_revisioned_meta', 'non-revisioned value' );

		$data = $this->autosave( $post_id );

		$this->assertNotSame( $post_id, $data['id'], 'Autosaving a published post should create an autosave.' );
		$this->assertSame( 'revisioned value', $data['meta']['revisioned_meta'], 'Revisioned meta should be read from the autosave.' );
		$this->assertArrayNotHasKey( 'non_revisioned_meta', $data['meta'] );
	}

	public function test_own_draft_autosave_includes_meta_that_is_not_revisioned() {
		// Both the Core autosaves controller and the real-time collaboration one update
		// an author's own auto-draft in place and return the post itself.
		$draft_id = self::factory()->post->create(
			array(
				'post_status' => 'auto-draft',
				'post_author' => self::$editor_id,
			)
		);
		update_post_meta( $draft_id, 'non_revisioned_meta', 'non-revisioned value' );

		$data = $this->autosave( $draft_id );

		$this->assertSame( $draft_id, $data['id'], 'Autosaving your own draft should update the post itself.' );
		$this->assertSame( 'non-revisioned value', $data['meta']['non_revisioned_meta'], 'The post itself should include meta that is not revisioned.' );
	}

	public function test_own_draft_autosave_with_collaboration_only_includes_revisioned_meta() {
		// The test bootstrap enables real-time collaboration, whose autosaves controller
		// stores an author's own draft autosave as a revision instead of updating the post.
		$draft_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::$editor_id,
			)
		);
		update_post_meta( $draft_id, 'revisioned_meta', 'revisioned value' );
		update_post_meta( $draft_id, 'non_revisioned_meta', 'non-revisioned value' );

		$data = $this->autosave( $draft_id );

		$this->assertNotSame( $draft_id, $data['id'], 'Autosaving your own draft with collaboration enabled should create an autosave.' );
		$this->assertSame( 'revisioned value', $data['meta']['revisioned_meta'], 'Revisioned meta should be read from the autosave.' );
		$this->assertArrayNotHasKey( 'non_revisioned_meta', $data['meta'] );
	}

	public function test_autosave_of_another_users_draft_only_includes_revisioned_meta() {
		$draft_id = self::factory()->post->create(
			array(
				'post_status' => 'draft',
				'post_author' => self::factory()->user->create( array( 'role' => 'author' ) ),
			)
		);
		update_post_meta( $draft_id, 'revisioned_meta', 'revisioned value' );
		update_post_meta( $draft_id, 'non_revisioned_meta', 'non-revisioned value' );

		$data = $this->autosave( $draft_id );

		$this->assertNotSame( $draft_id, $data['id'], "Autosaving another user's draft should create an autosave." );
		$this->assertSame( 'revisioned value', $data['meta']['revisioned_meta'], 'Revisioned meta should be read from the autosave.' );
		$this->assertArrayNotHasKey( 'non_revisioned_meta', $data['meta'] );
	}

	public function test_revision_without_a_parent_post_is_unchanged() {
		$revision = new WP_Post(
			(object) array(
				'ID'          => PHP_INT_MAX,
				'post_type'   => 'revision',
				'post_parent' => PHP_INT_MAX - 1,
			)
		);
		$response = new WP_REST_Response( array( 'meta' => array( 'revisioned_meta' => 'revisioned value' ) ) );

		$response = gutenberg_rest_only_include_revisioned_meta( $response, $revision );

		$this->assertSame( array( 'revisioned_meta' => 'revisioned value' ), $response->get_data()['meta'] );
	}

	public function test_meta_keys_from_revision_meta_keys_filter_are_included() {
		add_filter(
			'wp_post_revision_meta_keys',
			static function ( $keys ) {
				$keys[] = 'non_revisioned_meta';
				return $keys;
			}
		);

		list( $post_id, $revision_id ) = $this->create_post_with_revision();

		$meta = $this->get_revision_meta( $post_id, $revision_id );

		$this->assertSame( 'non-revisioned value', $meta['non_revisioned_meta'] );
	}

	public function test_revisioned_meta_uses_its_rest_name() {
		register_post_meta(
			'post',
			'aliased_meta',
			array(
				'show_in_rest'      => array( 'name' => 'aliased_rest_name' ),
				'single'            => true,
				'type'              => 'string',
				'revisions_enabled' => true,
			)
		);

		list( $post_id, $revision_id ) = $this->create_post_with_revision();

		$meta = $this->get_revision_meta( $post_id, $revision_id );

		$this->assertSame( 'aliased value', $meta['aliased_rest_name'] );
		$this->assertArrayNotHasKey( 'aliased_meta', $meta );
	}

	public function test_non_array_revision_meta_keys_filter_does_not_break_responses() {
		list( $post_id, $revision_id ) = $this->create_post_with_revision();

		add_filter( 'wp_post_revision_meta_keys', '__return_false' );

		$this->assertSame( array(), $this->get_revision_meta( $post_id, $revision_id ) );
	}

	public function test_pattern_revision_does_not_include_sync_status() {
		// The test case unregisters all meta keys between tests, so register `wp_pattern_sync_status` again.
		wp_create_initial_post_meta();

		$pattern_id = self::factory()->post->create( array( 'post_type' => 'wp_block' ) );
		update_post_meta( $pattern_id, 'wp_pattern_sync_status', 'unsynced' );
		$revision_id = $this->create_revision( $pattern_id );

		$meta = $this->get_revision_meta( $pattern_id, $revision_id );

		$this->assertArrayNotHasKey( 'wp_pattern_sync_status', $meta, 'The sync status is not revisioned, so restoring the revision should not change it.' );
	}

	/**
	 * Creates a post with meta values and a revision of it.
	 *
	 * @return int[] Post ID and revision ID.
	 */
	private function create_post_with_revision() {
		$post_id = self::factory()->post->create();

		update_post_meta( $post_id, 'revisioned_meta', 'revisioned value' );
		update_post_meta( $post_id, 'non_revisioned_meta', 'non-revisioned value' );
		update_post_meta( $post_id, 'aliased_meta', 'aliased value' );

		return array( $post_id, $this->create_revision( $post_id ) );
	}

	/**
	 * Creates a revision of a post, copying its revisioned meta.
	 *
	 * Uses `_wp_put_post_revision()` because `wp_save_post_revision()` does
	 * nothing once an autosave request in the same test run has defined
	 * `DOING_AUTOSAVE`.
	 *
	 * @param int $post_id Post ID.
	 * @return int Revision ID.
	 */
	private function create_revision( $post_id ) {
		return _wp_put_post_revision( $post_id );
	}

	/**
	 * Gets a revision's meta from the REST API, the way the editor reads it to restore it.
	 *
	 * @param int $post_id     Parent post ID.
	 * @param int $revision_id Revision ID.
	 * @return array The revision's meta.
	 */
	private function get_revision_meta( $post_id, $revision_id ) {
		$request = new WP_REST_Request( 'GET', rest_get_route_for_post( $post_id ) . '/revisions/' . $revision_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		return $response->get_data()['meta'];
	}

	/**
	 * Autosaves a post as the current user.
	 *
	 * @param int $post_id Post ID.
	 * @return array The autosave response data.
	 */
	private function autosave( $post_id ) {
		$request = new WP_REST_Request( 'POST', rest_get_route_for_post( $post_id ) . '/autosaves' );
		$request->add_header( 'Content-Type', 'application/x-www-form-urlencoded' );
		$request->set_body_params( array( 'content' => 'Autosaved content.' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		return $response->get_data();
	}
}
