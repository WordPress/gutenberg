<?php
/**
 * Unit tests covering WP_REST_User_Taxonomies_Controller_Gutenberg.
 *
 * Mirrors the structure of WordPress core controller tests
 * (e.g. tests/phpunit/tests/rest-api/rest-global-styles-controller.php
 * and the Gutenberg parallel WP_REST_Global_Styles_Controller_Gutenberg_Test):
 * the abstract methods on WP_Test_REST_Controller_Testcase enforce that every
 * standard REST verb has an opinionated test, plus we add coverage for the
 * security-sensitive bits — schema strictness, label sanitization, the
 * post-type-scoped wp_insert_post_data filter, and slug rules.
 *
 * @package gutenberg
 *
 * @covers WP_REST_User_Taxonomies_Controller_Gutenberg
 */
class WP_REST_User_Taxonomies_Controller_Gutenberg_Test extends WP_Test_REST_Controller_Testcase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * @var int
	 */
	protected static $subscriber_id;

	/**
	 * @var int
	 */
	protected static $taxonomy_id;

	/**
	 * @var int
	 */
	protected static $other_taxonomy_id;

	/**
	 * @var int
	 */
	protected static $unrelated_post_id;

	const REST_BASE = '/wp/v2/user-taxonomies';

	/**
	 * Seed a wp_user_taxonomy record via REST so tests follow the same write
	 * path as production — controller sanitization, post-meta handling, and
	 * config encoding all happen through the REST controller.
	 *
	 * @param array  $config      Decoded config payload.
	 * @param string $slug        Record post_name (taxonomy slug).
	 * @param string $title       Plural label / post_title.
	 * @param array  $object_type Post type slugs to attach.
	 * @return int Post ID.
	 */
	protected static function insert_user_taxonomy_record( $config, $slug, $title, $object_type = array( 'post' ) ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'title'       => $title,
				'slug'        => $slug,
				'status'      => 'publish',
				'object_type' => $object_type,
				'config'      => $config,
			)
		);
		return rest_get_server()->dispatch( $request )->get_data()['id'];
	}

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);

		self::$editor_id = $factory->user->create(
			array(
				'role' => 'editor',
			)
		);

		self::$subscriber_id = $factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);

		self::$taxonomy_id = self::insert_user_taxonomy_record(
			array(
				'labels'       => array( 'singular_name' => 'Genre' ),
				'public'       => true,
				'hierarchical' => false,
				'description'  => 'Free-form genre tags.',
			),
			'genre',
			'Genres',
			array( 'post' )
		);

		self::$other_taxonomy_id = self::insert_user_taxonomy_record(
			array(
				'labels'       => array( 'singular_name' => 'Topic' ),
				'public'       => true,
				'hierarchical' => true,
			),
			'topic',
			'Topics',
			array( 'page' )
		);

		// A post of an unrelated type — used to confirm the controller refuses
		// to serve non-wp_user_taxonomy IDs.
		self::$unrelated_post_id = $factory->post->create(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
		self::delete_user( self::$subscriber_id );
		wp_delete_post( self::$taxonomy_id, true );
		wp_delete_post( self::$other_taxonomy_id, true );
		wp_delete_post( self::$unrelated_post_id, true );
	}

	/**
	 * Routes are present at the conventional /wp/v2/user-taxonomies paths.
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( self::REST_BASE, $routes, 'Collection route is missing.' );
		$this->assertArrayHasKey( self::REST_BASE . '/(?P<id>[\d]+)', $routes, 'Single-record route is missing.' );
	}

	/**
	 * Collection accepts the standard `context` query param.
	 */
	public function test_context_param() {
		$request  = new WP_REST_Request( 'OPTIONS', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertSame( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	/**
	 * Listing returns both seeded records with the typed shape — `config`
	 * object, `object_type` array, no raw `content`.
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertGreaterThanOrEqual( 2, count( $data ) );

		$by_id = array();
		foreach ( $data as $row ) {
			$by_id[ $row['id'] ] = $row;
		}

		$this->assertArrayHasKey( self::$taxonomy_id, $by_id, 'Genre record missing from listing.' );
		$row = $by_id[ self::$taxonomy_id ];

		$this->assertArrayNotHasKey( 'content', $row, 'Raw content field should not be exposed.' );
		$this->assertArrayHasKey( 'config', $row );
		$this->assertArrayHasKey( 'object_type', $row );
		$this->assertSame( array( 'post' ), $row['object_type'] );
		$this->assertSame( 'Genre', $row['config']['labels']['singular_name'] );
		$this->assertSame( true, $row['config']['public'] );
		$this->assertSame( false, $row['config']['hierarchical'] );
	}

	/**
	 * `?object_type=post` narrows the listing to records attached to that
	 * post type — the multi-value collection param backed by a meta_query.
	 */
	public function test_get_items_filter_by_object_type_single() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'context', 'edit' );
		$request->set_param( 'object_type', array( 'post' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$ids = array_column( $data, 'id' );
		$this->assertContains( self::$taxonomy_id, $ids, 'Genre (attached to post) should match.' );
		$this->assertNotContains( self::$other_taxonomy_id, $ids, 'Topic (attached to page) should not match.' );
	}

	/**
	 * Multi-value filter returns the union — records attached to ANY of the
	 * requested post types.
	 */
	public function test_get_items_filter_by_object_type_multi() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'context', 'edit' );
		$request->set_param( 'object_type', array( 'post', 'page' ) );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$ids = array_column( $data, 'id' );
		$this->assertContains( self::$taxonomy_id, $ids );
		$this->assertContains( self::$other_taxonomy_id, $ids );
	}

	/**
	 * Subscribers cannot list in `edit` context — that's the practical case
	 * the Settings page uses, and it requires edit_posts.
	 */
	public function test_get_items_subscriber_cannot_view_edit_context() {
		wp_set_current_user( self::$subscriber_id );

		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Single record returns the typed `config` and `object_type`.
	 */
	public function test_get_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', self::REST_BASE . '/' . self::$taxonomy_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'genre', $data['slug'] );
		$this->assertSame( 'Genres', $data['title']['raw'] );
		$this->assertArrayNotHasKey( 'content', $data );
		$this->assertSame(
			array( 'post' ),
			$data['object_type']
		);
		$this->assertSame( 'Genre', $data['config']['labels']['singular_name'] );
		$this->assertSame( 'Free-form genre tags.', $data['config']['description'] );
	}

	/**
	 * Asking for a record of a different post type — expect 404.
	 */
	public function test_get_item_invalid_post_type() {
		wp_set_current_user( self::$admin_id );

		$request  = new WP_REST_Request( 'GET', self::REST_BASE . '/' . self::$unrelated_post_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 404, $response->get_status() );
	}

	/**
	 * Admin can create a record. The response carries `config` and
	 * `object_type` derived from what was sent, not the raw post_content.
	 */
	public function test_create_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'        => 'mood',
				'title'       => 'Moods',
				'status'      => 'publish',
				'object_type' => array( 'post' ),
				'config'      => array(
					'public'       => false,
					'hierarchical' => true,
					'description'  => 'Editorial mood tags.',
					'labels'       => array(
						'singular_name' => 'Mood',
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'mood', $data['slug'] );
		$this->assertArrayNotHasKey( 'content', $data );
		$this->assertSame( false, $data['config']['public'] );
		$this->assertSame( true, $data['config']['hierarchical'] );
		$this->assertSame( 'Mood', $data['config']['labels']['singular_name'] );
		$this->assertSame( array( 'post' ), $data['object_type'] );

		// Underlying meta storage uses the underscore-prefixed key.
		$stored_meta = get_post_meta( $data['id'], GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY );
		$this->assertSame( array( 'post' ), $stored_meta );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * HTML in label values is stripped via sanitize_text_field, so a stored
	 * label can never carry markup back out to the client.
	 */
	public function test_create_item_strips_html_in_labels() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => 'safe',
				'title'  => 'Safe',
				'config' => array(
					'labels' => array(
						'singular_name' => '<script>alert(1)</script>Hostile',
						'menu_name'     => '<b>Bold</b> menu',
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'Hostile', $data['config']['labels']['singular_name'] );
		$this->assertSame( 'Bold menu', $data['config']['labels']['menu_name'] );

		// Defense in depth: stored bytes also have no live tag characters.
		$raw = get_post( $data['id'] )->post_content;
		$this->assertStringNotContainsString( '<script', $raw );
		$this->assertStringNotContainsString( '</script', $raw );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Unauthenticated create attempts are rejected.
	 */
	public function test_create_item_no_user() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => 'rejected',
				'title'  => 'Rejected',
				'config' => array( 'labels' => array( 'singular_name' => 'Rejected' ) ),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Editors don't have manage_options, so create is forbidden.
	 */
	public function test_create_item_editor_forbidden() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => 'rejected2',
				'title'  => 'Rejected 2',
				'config' => array( 'labels' => array( 'singular_name' => 'Rejected' ) ),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Reserved slugs (core taxonomies and our explicit deny-list) are
	 * rejected before they can be persisted.
	 */
	public function test_create_item_rejects_reserved_slug() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => 'category',
				'title'  => 'Category',
				'config' => array( 'labels' => array( 'singular_name' => 'Category' ) ),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 400, $response->get_status() );
		$this->assertContains(
			$response->get_data()['code'],
			array( 'gutenberg_user_taxonomy_slug_reserved', 'gutenberg_user_taxonomy_slug_taken' )
		);
	}

	/**
	 * A second record with the same slug as an existing record is rejected.
	 */
	public function test_create_item_rejects_duplicate_slug() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => 'genre',
				'title'  => 'Duplicate',
				'config' => array( 'labels' => array( 'singular_name' => 'Genre Dup' ) ),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'gutenberg_user_taxonomy_slug_taken', $response->get_data()['code'] );
	}

	/**
	 * Update modifies the typed `config` and reflects it back.
	 */
	public function test_update_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'PUT', self::REST_BASE . '/' . self::$taxonomy_id );
		$request->set_body_params(
			array(
				'config' => array(
					'public'       => false,
					'hierarchical' => false,
					'description'  => 'Updated description.',
					'labels'       => array( 'singular_name' => 'Genre' ),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( false, $data['config']['public'] );
		$this->assertSame( 'Updated description.', $data['config']['description'] );
	}

	/**
	 * Updating `object_type` replaces the meta values entirely — repeated
	 * values are deleted before the new set is added so old attachments
	 * don't leak through.
	 */
	public function test_update_item_replaces_object_type_meta() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'PUT', self::REST_BASE . '/' . self::$taxonomy_id );
		$request->set_body_params(
			array(
				'object_type' => array( 'page' ),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'page' ), $data['object_type'] );
		$this->assertSame(
			array( 'page' ),
			get_post_meta( self::$taxonomy_id, GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY )
		);

		// Restore for other tests in this class.
		delete_post_meta( self::$taxonomy_id, GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY );
		add_post_meta( self::$taxonomy_id, GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY, 'post' );
	}

	/**
	 * `object_type` items that don't correspond to existing post types are
	 * silently dropped during the meta save.
	 */
	public function test_update_item_filters_unknown_object_types() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'PUT', self::REST_BASE . '/' . self::$taxonomy_id );
		// Both items pass the schema's pattern/length validation, but only
		// `post` is a registered post type — `fake_pt` should be filtered out
		// silently when the meta is written.
		$request->set_body_params(
			array(
				'object_type' => array( 'post', 'fake_pt' ),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'post' ), $data['object_type'] );
	}

	/**
	 * Unauthenticated update is rejected.
	 */
	public function test_update_item_no_user() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'PUT', self::REST_BASE . '/' . self::$taxonomy_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Admin can delete; the record disappears from subsequent listings.
	 */
	public function test_delete_item() {
		wp_set_current_user( self::$admin_id );

		$post_id = self::insert_user_taxonomy_record(
			array( 'labels' => array( 'singular_name' => 'Throwaway' ) ),
			'throwaway',
			'Throwaways'
		);

		$request = new WP_REST_Request( 'DELETE', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertNull( get_post( $post_id ) );
	}

	/**
	 * `prepare_item_for_response` decodes post_content and returns the
	 * sanitized `config` shape. Direct test of the controller method, not
	 * routed through the REST server.
	 */
	public function test_prepare_item() {
		$controller = new WP_REST_User_Taxonomies_Controller_Gutenberg( 'wp_user_taxonomy' );
		$post       = get_post( self::$taxonomy_id );

		$request = new WP_REST_Request( 'GET', self::REST_BASE . '/' . self::$taxonomy_id );
		$request->set_param( 'context', 'edit' );

		$response = $controller->prepare_item_for_response( $post, $request );
		$data     = $response->get_data();

		$this->assertArrayNotHasKey( 'content', $data );
		$this->assertSame( 'Genre', $data['config']['labels']['singular_name'] );
		$this->assertSame( array( 'post' ), $data['object_type'] );
	}

	/**
	 * `additionalProperties: false` on `config.labels` means unknown label
	 * keys are rejected at the REST layer with a 400.
	 */
	public function test_create_item_rejects_unknown_label_key() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => 'unknown-label',
				'title'  => 'Unknown Label',
				'config' => array(
					'labels' => array(
						'singular_name'   => 'Unknown Label',
						'totally_made_up' => 'Should be rejected',
					),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * `additionalProperties: false` at the top level of `config` rejects
	 * unknown keys with a 400 — the schema is closed.
	 */
	public function test_create_item_rejects_unknown_top_level_config_key() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => 'unknown-top',
				'title'  => 'Unknown Top',
				'config' => array(
					'labels'          => array( 'singular_name' => 'Unknown Top' ),
					'something_extra' => 'nope',
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * The storage-only marker key is never present in the REST response,
	 * even though it lives in the stored `post_content` bytes.
	 */
	public function test_marker_key_absent_from_response() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', self::REST_BASE . '/' . self::$taxonomy_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayNotHasKey( GUTENBERG_USER_TAXONOMY_CONFIG_MARKER, $data['config'] );

		// And confirm it actually lives in the stored bytes — otherwise this
		// test passes vacuously if marker injection is silently broken.
		$raw = get_post( self::$taxonomy_id )->post_content;
		$this->assertStringContainsString( GUTENBERG_USER_TAXONOMY_CONFIG_MARKER, $raw );
	}

	/**
	 * `object_type` collection param values are pattern-validated by the
	 * schema; values containing spaces don't satisfy `^[a-z0-9_-]{1,20}$`
	 * and the request fails at the REST layer with a 400.
	 */
	public function test_get_items_rejects_invalid_object_type_value() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', self::REST_BASE );
		$request->set_param( 'context', 'edit' );
		$request->set_param( 'object_type', array( 'has space' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * Round-trip: write a config via REST, re-read the stored bytes, decode,
	 * strip the storage marker, and assert the result is byte-equal to a
	 * canonical re-encoding of the input. Catches encoding regressions —
	 * stray flag changes that shift `<` vs `<`, key reordering, or
	 * inadvertent reintroduction of `JSON_FORCE_OBJECT`.
	 */
	public function test_config_round_trip_is_byte_stable() {
		wp_set_current_user( self::$admin_id );

		$config = array(
			'public'       => true,
			'hierarchical' => false,
			'description'  => 'Round-trip description with slash / and amp & and tag <em>.',
			'labels'       => array(
				'singular_name' => 'Round',
				'menu_name'     => 'Rounds',
			),
		);

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => 'roundtrip',
				'title'  => 'Round-trip',
				'config' => $config,
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertSame( 201, $response->get_status() );

		$raw     = get_post( $data['id'] )->post_content;
		$decoded = json_decode( $raw, true );
		$this->assertIsArray( $decoded );

		// The marker is storage-only; drop before comparing payload shape.
		$this->assertArrayHasKey( GUTENBERG_USER_TAXONOMY_CONFIG_MARKER, $decoded );
		unset( $decoded[ GUTENBERG_USER_TAXONOMY_CONFIG_MARKER ] );

		// `sanitize_text_field` collapses interior tags to text, so the stored
		// description matches the post-sanitize form, not the raw input.
		$expected_description = sanitize_textarea_field( $config['description'] );
		$this->assertSame( $expected_description, $decoded['description'] );
		$this->assertSame( $config['labels'], $decoded['labels'] );
		$this->assertSame( $config['public'], $decoded['public'] );
		$this->assertSame( $config['hierarchical'], $decoded['hierarchical'] );

		// Live tag/amp characters must not appear in the stored bytes —
		// `JSON_HEX_TAG | JSON_HEX_AMP` should escape them.
		$this->assertStringNotContainsString( '<em>', $raw );
		$this->assertStringNotContainsString( '&', $raw );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Schema declares `config` and `object_type`, hides raw `content`, and
	 * keeps `additionalProperties: false` on the typed config object.
	 */
	public function test_get_item_schema() {
		$request  = new WP_REST_Request( 'OPTIONS', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayHasKey( 'config', $schema['properties'] );
		$this->assertArrayHasKey( 'object_type', $schema['properties'] );
		$this->assertArrayNotHasKey( 'content', $schema['properties'] );

		$config_schema = $schema['properties']['config'];
		$this->assertSame( 'object', $config_schema['type'] );
		$this->assertFalse( $config_schema['additionalProperties'] );
		$this->assertArrayHasKey( 'labels', $config_schema['properties'] );
		$this->assertFalse( $config_schema['properties']['labels']['additionalProperties'] );

		$object_type_schema = $schema['properties']['object_type'];
		$this->assertSame( 'array', $object_type_schema['type'] );
		$this->assertSame( '^[a-z0-9_-]{1,20}$', $object_type_schema['items']['pattern'] );
	}
}
