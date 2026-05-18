<?php
/**
 * Unit tests covering the deferred rewrite-rules flush triggered by
 * wp_user_post_type and wp_user_taxonomy writes.
 *
 * Registration of user-defined post types and taxonomies runs at `init`
 * priority 20, before any REST request handler. Flushing inline in the
 * REST handler would therefore regenerate rules from the *pre-update*
 * registration. The fix defers flushing to the next request via an
 * option flag, which `init` priority 30 picks up and clears.
 *
 * These tests cover:
 *   - the schedule + maybe-flush helper pair (set/clear semantics),
 *   - the post-type controller's create/update/delete trigger conditions
 *     (slug, has_archive, public, publish ↔ non-publish),
 *   - the taxonomy controller's create/update/delete trigger conditions
 *     (slug, public, publish ↔ non-publish).
 *
 * @package gutenberg
 */

class User_Content_Types_Rewrite_Flush_Test extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	const POST_TYPES_BASE = '/wp/v2/user-post-types';
	const TAXONOMIES_BASE = '/wp/v2/user-taxonomies';

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$admin_id );
		// Each test asserts the flag from a known-clear state.
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );
	}

	public function tear_down() {
		// Don't carry the deferred flush across tests.
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );
		parent::tear_down();
	}

	/**
	 * Helper: insert a wp_user_post_type via REST and return the response data.
	 *
	 * Only `publish` is supported here. Creating a draft via this controller's
	 * REST POST hits an unrelated `WP_REST_Posts_Controller::create_item` PHP
	 * notice on `$prepared_post->id` (lowercase `id` is never set on the
	 * `stdClass` returned by `prepare_item_for_database`), which PHPUnit's
	 * `convertNoticesToExceptions` upgrades into a fatal. Draft seeds in
	 * these tests use {@see seed_post_type_draft} instead.
	 */
	private function create_post_type( $slug, $title, $config ) {
		$request = new WP_REST_Request( 'POST', self::POST_TYPES_BASE );
		$request->set_body_params(
			array(
				'slug'   => $slug,
				'title'  => $title,
				'status' => 'publish',
				'config' => $config,
			)
		);
		return rest_get_server()->dispatch( $request )->get_data();
	}

	/**
	 * Helper: insert a wp_user_taxonomy via REST and return the response data.
	 *
	 * Same `publish`-only constraint as {@see create_post_type}.
	 */
	private function create_taxonomy( $slug, $title, $config ) {
		$request = new WP_REST_Request( 'POST', self::TAXONOMIES_BASE );
		$request->set_body_params(
			array(
				'slug'   => $slug,
				'title'  => $title,
				'status' => 'publish',
				'config' => $config,
			)
		);
		return rest_get_server()->dispatch( $request )->get_data();
	}

	/**
	 * Seeds a wp_user_post_type draft directly via `wp_insert_post`. Bypasses
	 * the controller's `create_item` (so its scheduling logic doesn't fire),
	 * which is exactly what we want when the controller method under test is
	 * `update_item` or `delete_item` and the test needs a draft starting
	 * state. Side-stepping the controller also avoids the WP core notice
	 * documented on {@see create_post_type}.
	 */
	private function seed_post_type_draft( $slug, $title, $config = array() ) {
		return wp_insert_post(
			array(
				'post_type'    => 'wp_user_post_type',
				'post_status'  => 'draft',
				'post_name'    => $slug,
				'post_title'   => $title,
				'post_content' => wp_json_encode( $config ),
			)
		);
	}

	/**
	 * Seeds a wp_user_taxonomy draft directly via `wp_insert_post`.
	 * See {@see seed_post_type_draft} for why we bypass the REST controller.
	 */
	private function seed_taxonomy_draft( $slug, $title, $config = array() ) {
		return wp_insert_post(
			array(
				'post_type'    => 'wp_user_taxonomy',
				'post_status'  => 'draft',
				'post_name'    => $slug,
				'post_title'   => $title,
				'post_content' => wp_json_encode( $config ),
			)
		);
	}

	/**
	 * Asserts the deferred-flush flag is present, then clears it for the
	 * next assertion in the test.
	 */
	private function assert_flush_scheduled( $message = '' ) {
		$this->assertSame( '1', (string) get_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION ), $message );
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );
	}

	private function assert_flush_not_scheduled( $message = '' ) {
		$this->assertFalse( get_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION ), $message );
	}

	/**
	 * Schedule helper sets the option; maybe-flush helper clears it.
	 */
	public function test_schedule_and_maybe_flush_helpers() {
		$this->assertFalse( get_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION ) );

		gutenberg_user_content_types_schedule_flush_rewrite_rules();
		$this->assertSame( '1', (string) get_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION ) );

		gutenberg_user_content_types_maybe_flush_rewrite_rules();
		$this->assertFalse(
			get_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION ),
			'maybe-flush should consume and clear the scheduling flag.'
		);
	}

	/**
	 * No flag → maybe-flush is a no-op and does not call into the rewrite
	 * machinery (no `delete_option_rewrite_rules` action fires).
	 */
	public function test_maybe_flush_is_noop_when_unscheduled() {
		$saw_delete = false;
		$listener   = function () use ( &$saw_delete ) {
			$saw_delete = true;
		};
		add_action( 'delete_option_rewrite_rules', $listener );

		gutenberg_user_content_types_maybe_flush_rewrite_rules();

		remove_action( 'delete_option_rewrite_rules', $listener );

		$this->assertFalse( $saw_delete, 'Without the flag set, maybe-flush must not touch the rewrite_rules option.' );
	}

	/**
	 * `gutenberg_user_content_types_maybe_flush_rewrite_rules` is registered
	 * on `init` priority 30 — after `gutenberg_register_user_defined_*` at
	 * priority 20, so the regenerated rules see the new registration state.
	 */
	public function test_maybe_flush_runs_after_registration_on_init() {
		$this->assertSame(
			30,
			has_action( 'init', 'gutenberg_user_content_types_maybe_flush_rewrite_rules' ),
			'maybe-flush must run on init at priority 30 (after registration at 20).'
		);
	}

	// -----------------------------------------------------------------------
	// Post types
	// -----------------------------------------------------------------------

	/**
	 * Creating a published post type record schedules a flush — the new
	 * registration will activate on the next init.
	 */
	public function test_post_type_create_publish_schedules_flush() {
		$data = $this->create_post_type(
			'rwflush_pt_create',
			'Create Flush',
			array(
				'public'      => true,
				'has_archive' => true,
			)
		);
		$this->assertArrayHasKey( 'id', $data );
		$this->assert_flush_scheduled( 'Publishing a new post type record should schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Updating only labels/description on a published record does not
	 * schedule — those fields don't affect rewrite rules.
	 */
	public function test_post_type_update_irrelevant_field_does_not_schedule() {
		$data = $this->create_post_type(
			'rwflush_pt_lbl',
			'Labels',
			array( 'public' => true )
		);
		// Clear the create-side schedule.
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::POST_TYPES_BASE . '/' . $data['id'] );
		$request->set_body_params(
			array(
				'config' => array(
					'public'      => true,
					'description' => 'Updated description.',
					'labels'      => array( 'singular_name' => 'Label' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_not_scheduled( 'Editing labels/description must not schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Renaming the slug while published schedules a flush — rewrite rules
	 * are tied to the post type slug.
	 */
	public function test_post_type_update_slug_schedules_flush() {
		$data = $this->create_post_type(
			'rwflush_pt_slug',
			'Slug',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::POST_TYPES_BASE . '/' . $data['id'] );
		$request->set_body_params(
			array(
				'slug' => 'rwflush_pt_slug2',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'Renaming a published post type slug must schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Toggling has_archive while published schedules a flush — the archive
	 * URL gets added or removed.
	 */
	public function test_post_type_update_has_archive_schedules_flush() {
		$data = $this->create_post_type(
			'rwflush_pt_arch',
			'Arch',
			array(
				'public'      => true,
				'has_archive' => false,
			)
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::POST_TYPES_BASE . '/' . $data['id'] );
		$request->set_body_params(
			array(
				'config' => array(
					'public'      => true,
					'has_archive' => true,
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'Toggling has_archive on a published post type must schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Toggling public while published schedules a flush — public flips
	 * which rewrite rules `register_post_type()` generates.
	 */
	public function test_post_type_update_public_schedules_flush() {
		$data = $this->create_post_type(
			'rwflush_pt_pub',
			'Pub',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::POST_TYPES_BASE . '/' . $data['id'] );
		$request->set_body_params(
			array(
				'config' => array( 'public' => false ),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'Toggling public on a published post type must schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Toggling hierarchical while published schedules a flush — for post
	 * types `register_post_type()` flips the rewrite-tag regex between
	 * `(.+?)` and `([^/]+)` and the query-var fallback between `pagename=`
	 * and `name=`, so the cached rules need regenerating.
	 */
	public function test_post_type_update_hierarchical_schedules_flush() {
		$data = $this->create_post_type(
			'rwflush_pt_hier',
			'Hier',
			array(
				'public'       => true,
				'hierarchical' => false,
			)
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::POST_TYPES_BASE . '/' . $data['id'] );
		$request->set_body_params(
			array(
				'config' => array(
					'public'       => true,
					'hierarchical' => true,
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'Toggling hierarchical on a published post type must schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Transitioning from publish → draft schedules a flush — the post type
	 * stops being registered next request.
	 */
	public function test_post_type_unpublish_schedules_flush() {
		$data = $this->create_post_type(
			'rwflush_pt_off',
			'Off',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::POST_TYPES_BASE . '/' . $data['id'] );
		$request->set_body_params( array( 'status' => 'draft' ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'publish → draft must schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Transitioning from draft → publish schedules a flush — registration
	 * activates next request.
	 */
	public function test_post_type_publish_from_draft_schedules_flush() {
		$id = $this->seed_post_type_draft(
			'rwflush_pt_on',
			'On',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::POST_TYPES_BASE . '/' . $id );
		$request->set_body_params( array( 'status' => 'publish' ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'draft → publish must schedule a flush.' );

		wp_delete_post( $id, true );
	}

	/**
	 * Editing a draft (unregistered the whole time) does not schedule —
	 * nothing changed in the live registration state.
	 */
	public function test_post_type_update_draft_to_draft_does_not_schedule() {
		$id = $this->seed_post_type_draft(
			'rwflush_pt_drft',
			'Drft',
			array( 'public' => false )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::POST_TYPES_BASE . '/' . $id );
		$request->set_body_params(
			array(
				'slug'   => 'rwflush_pt_drft2',
				'config' => array(
					'public'      => true,
					'has_archive' => true,
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_not_scheduled( 'Edits between two draft states must not schedule a flush.' );

		wp_delete_post( $id, true );
	}

	/**
	 * Force-deleting a published post type schedules a flush — registration
	 * disappears next request.
	 */
	public function test_post_type_force_delete_published_schedules_flush() {
		$data = $this->create_post_type(
			'rwflush_pt_del',
			'Del',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'DELETE', self::POST_TYPES_BASE . '/' . $data['id'] );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'Force-deleting a published post type must schedule a flush.' );
	}

	/**
	 * Trashing a published post type schedules a flush — registration loop
	 * filters on `post_status === 'publish'`, so trash drops the row.
	 */
	public function test_post_type_trash_published_schedules_flush() {
		$data = $this->create_post_type(
			'rwflush_pt_tr',
			'Tr',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request  = new WP_REST_Request( 'DELETE', self::POST_TYPES_BASE . '/' . $data['id'] );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'Trashing a published post type must schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Force-deleting a draft post type does not schedule — it was never
	 * registered.
	 */
	public function test_post_type_force_delete_draft_does_not_schedule() {
		$id = $this->seed_post_type_draft(
			'rwflush_pt_dd',
			'DD',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'DELETE', self::POST_TYPES_BASE . '/' . $id );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_not_scheduled( 'Deleting a draft post type must not schedule a flush.' );
	}

	// -----------------------------------------------------------------------
	// Taxonomies
	// -----------------------------------------------------------------------

	/**
	 * Creating a published taxonomy schedules a flush.
	 */
	public function test_taxonomy_create_publish_schedules_flush() {
		$data = $this->create_taxonomy(
			'rwflush_tx_create',
			'Create Flush Tax',
			array( 'public' => true )
		);
		$this->assertArrayHasKey( 'id', $data );
		$this->assert_flush_scheduled( 'Publishing a new taxonomy record should schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Renaming the slug of a published taxonomy schedules a flush —
	 * taxonomy permalinks are tied to the slug.
	 */
	public function test_taxonomy_update_slug_schedules_flush() {
		$data = $this->create_taxonomy(
			'rwflush_tx_slug',
			'Tax Slug',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::TAXONOMIES_BASE . '/' . $data['id'] );
		$request->set_body_params(
			array(
				'slug' => 'rwflush_tx_slug2',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'Renaming a published taxonomy slug must schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Toggling public on a published taxonomy schedules a flush.
	 */
	public function test_taxonomy_update_public_schedules_flush() {
		$data = $this->create_taxonomy(
			'rwflush_tx_pub',
			'Tax Pub',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::TAXONOMIES_BASE . '/' . $data['id'] );
		$request->set_body_params(
			array(
				'config' => array( 'public' => false ),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'Toggling public on a published taxonomy must schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Toggling publicly_queryable on a published taxonomy schedules a flush.
	 * `publicly_queryable` flips `register_taxonomy()`'s `query_var`, which
	 * swaps the `add_rewrite_tag` query string between `{slug}=` and
	 * `taxonomy={name}&term=` — so the rewrite rules must be regenerated.
	 */
	public function test_taxonomy_update_publicly_queryable_schedules_flush() {
		$data = $this->create_taxonomy(
			'rwflush_tx_pq',
			'Tax PQ',
			array(
				'public'             => true,
				'publicly_queryable' => true,
			)
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::TAXONOMIES_BASE . '/' . $data['id'] );
		$request->set_body_params(
			array(
				'config' => array(
					'public'             => true,
					'publicly_queryable' => false,
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'Toggling publicly_queryable on a published taxonomy must schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * `publicly_queryable` defaults to `public` when omitted from the
	 * stored config. Going from "absent" to "explicitly equal to public"
	 * (or vice-versa) leaves the effective value unchanged and must not
	 * trip a no-op flush.
	 */
	public function test_taxonomy_update_publicly_queryable_redundant_does_not_schedule() {
		$data = $this->create_taxonomy(
			'rwflush_tx_pqr',
			'Tax PQ Redundant',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::TAXONOMIES_BASE . '/' . $data['id'] );
		$request->set_body_params(
			array(
				'config' => array(
					'public'             => true,
					'publicly_queryable' => true,
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_not_scheduled( 'Setting publicly_queryable to its implicit default must not schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Editing labels-only on a published taxonomy does not schedule.
	 */
	public function test_taxonomy_update_irrelevant_field_does_not_schedule() {
		$data = $this->create_taxonomy(
			'rwflush_tx_lbl',
			'Tax Lbl',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::TAXONOMIES_BASE . '/' . $data['id'] );
		$request->set_body_params(
			array(
				'config' => array(
					'public'      => true,
					'description' => 'Updated tax description.',
					'labels'      => array( 'singular_name' => 'Lbl' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_not_scheduled( 'Editing labels/description on a taxonomy must not schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * publish → draft on a taxonomy schedules a flush.
	 */
	public function test_taxonomy_unpublish_schedules_flush() {
		$data = $this->create_taxonomy(
			'rwflush_tx_off',
			'Tax Off',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'PUT', self::TAXONOMIES_BASE . '/' . $data['id'] );
		$request->set_body_params( array( 'status' => 'draft' ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'publish → draft on a taxonomy must schedule a flush.' );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Force-deleting a published taxonomy schedules a flush.
	 */
	public function test_taxonomy_force_delete_published_schedules_flush() {
		$data = $this->create_taxonomy(
			'rwflush_tx_del',
			'Tax Del',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'DELETE', self::TAXONOMIES_BASE . '/' . $data['id'] );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_scheduled( 'Force-deleting a published taxonomy must schedule a flush.' );
	}

	/**
	 * Force-deleting a draft taxonomy does not schedule.
	 */
	public function test_taxonomy_force_delete_draft_does_not_schedule() {
		$id = $this->seed_taxonomy_draft(
			'rwflush_tx_dd',
			'Tax DD',
			array( 'public' => true )
		);
		delete_option( GUTENBERG_USER_CONTENT_TYPES_FLUSH_OPTION );

		$request = new WP_REST_Request( 'DELETE', self::TAXONOMIES_BASE . '/' . $id );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assert_flush_not_scheduled( 'Deleting a draft taxonomy must not schedule a flush.' );
	}
}
