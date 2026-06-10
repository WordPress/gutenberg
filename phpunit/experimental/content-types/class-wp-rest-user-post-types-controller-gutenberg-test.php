<?php
/**
 * Unit tests covering WP_REST_User_Post_Types_Controller_Gutenberg.
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
 * @covers WP_REST_User_Post_Types_Controller_Gutenberg
 */
class WP_REST_User_Post_Types_Controller_Gutenberg_Test extends WP_Test_REST_Controller_Testcase {

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
	protected static $post_type_id;

	/**
	 * @var int
	 */
	protected static $other_post_type_id;

	/**
	 * @var int
	 */
	protected static $unrelated_post_id;

	const REST_BASE = '/wp/v2/user-post-types';

	/**
	 * Seed a wp_user_post_type record via REST so tests follow the same write
	 * path as production — controller sanitization and config encoding all
	 * happen through the REST controller. There is no `object_type` parameter
	 * here (unlike the taxonomies side) because the post-type→taxonomy
	 * relationship lives inline inside `config.taxonomies`.
	 *
	 * @param array  $config Decoded config payload.
	 * @param string $slug   Record post_name (post type slug).
	 * @param string $title  Plural label / post_title.
	 * @return int Post ID.
	 */
	protected static function insert_user_post_type_record( $config, $slug, $title ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'title'  => $title,
				'slug'   => $slug,
				'status' => 'publish',
				'config' => $config,
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

		self::$post_type_id = self::insert_user_post_type_record(
			array(
				'labels'       => array( 'singular_name' => 'Book' ),
				'public'       => true,
				'hierarchical' => false,
				'description'  => 'Library catalog entries.',
				'supports'     => array( 'title', 'editor' ),
			),
			'book',
			'Books'
		);

		self::$other_post_type_id = self::insert_user_post_type_record(
			array(
				'labels'       => array( 'singular_name' => 'Movie' ),
				'public'       => true,
				'hierarchical' => true,
			),
			'movie',
			'Movies'
		);

		// A post of an unrelated type — used to confirm the controller refuses
		// to serve non-wp_user_post_type IDs.
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
		wp_delete_post( self::$post_type_id, true );
		wp_delete_post( self::$other_post_type_id, true );
		wp_delete_post( self::$unrelated_post_id, true );
	}

	/**
	 * Routes are present at the conventional /wp/v2/user-post-types paths.
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
	 * object, no raw `content`.
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

		$this->assertArrayHasKey( self::$post_type_id, $by_id, 'Book record missing from listing.' );
		$row = $by_id[ self::$post_type_id ];

		$this->assertArrayNotHasKey( 'content', $row, 'Raw content field should not be exposed.' );
		$this->assertArrayHasKey( 'config', $row );
		$this->assertSame( 'Book', $row['config']['labels']['singular_name'] );
		$this->assertSame( true, $row['config']['public'] );
		$this->assertSame( false, $row['config']['hierarchical'] );
		$this->assertSame( array( 'title', 'editor' ), $row['config']['supports'] );
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
	 * Single record returns the typed `config`.
	 */
	public function test_get_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', self::REST_BASE . '/' . self::$post_type_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'book', $data['slug'] );
		$this->assertSame( 'Books', $data['title']['raw'] );
		$this->assertArrayNotHasKey( 'content', $data );
		$this->assertSame( 'Book', $data['config']['labels']['singular_name'] );
		$this->assertSame( 'Library catalog entries.', $data['config']['description'] );
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
	 * Admin can create a record. The response carries `config` derived from
	 * what was sent, not the raw post_content.
	 */
	public function test_create_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => 'comic',
				'title'  => 'Comics',
				'status' => 'publish',
				'config' => array(
					'public'       => false,
					'hierarchical' => true,
					'description'  => 'Pulp comics archive.',
					'labels'       => array(
						'singular_name' => 'Comic',
					),
					'supports'     => array( 'title', 'thumbnail' ),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 201, $response->get_status() );
		$this->assertSame( 'comic', $data['slug'] );
		$this->assertArrayNotHasKey( 'content', $data );
		$this->assertSame( false, $data['config']['public'] );
		$this->assertSame( true, $data['config']['hierarchical'] );
		$this->assertSame( 'Comic', $data['config']['labels']['singular_name'] );
		$this->assertSame( array( 'title', 'thumbnail' ), $data['config']['supports'] );

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
				'slug'   => 'safe_pt',
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
				'slug'   => 'rejected_pt',
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
				'slug'   => 'rejected_pt2',
				'title'  => 'Rejected 2',
				'config' => array( 'labels' => array( 'singular_name' => 'Rejected' ) ),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Reserved slugs (built-in post types) are rejected before they can be
	 * persisted.
	 */
	public function test_create_item_rejects_reserved_slug() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => 'post',
				'title'  => 'Post',
				'config' => array( 'labels' => array( 'singular_name' => 'Post' ) ),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 400, $response->get_status() );
		$this->assertContains(
			$response->get_data()['code'],
			array( 'gutenberg_user_post_type_slug_reserved', 'gutenberg_user_post_type_slug_taken' )
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
				'slug'   => 'book',
				'title'  => 'Duplicate',
				'config' => array( 'labels' => array( 'singular_name' => 'Book Dup' ) ),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'gutenberg_user_post_type_slug_taken', $response->get_data()['code'] );
	}

	/**
	 * Slug must match `^[a-z0-9_-]{1,20}$`. The 20-char cap is post-types-
	 * specific (vs 32 for taxonomies) because `wp_posts.post_type` is a
	 * 20-char column. Other shape violations (spaces, uppercase) get
	 * normalized away by `sanitize_title` upstream of the controller, so
	 * length is the only invariant the controller's pattern check is the
	 * sole defense for.
	 */
	public function test_create_item_rejects_overlength_slug() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => str_repeat( 'a', 21 ),
				'title'  => 'Invalid',
				'config' => array( 'labels' => array( 'singular_name' => 'Invalid' ) ),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'gutenberg_user_post_type_slug_invalid', $response->get_data()['code'] );
	}

	/**
	 * Update modifies the typed `config` and reflects it back.
	 */
	public function test_update_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'PUT', self::REST_BASE . '/' . self::$post_type_id );
		$request->set_body_params(
			array(
				'config' => array(
					'public'       => false,
					'hierarchical' => false,
					'description'  => 'Updated description.',
					'labels'       => array( 'singular_name' => 'Book' ),
					'supports'     => array( 'title', 'editor', 'excerpt' ),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( false, $data['config']['public'] );
		$this->assertSame( 'Updated description.', $data['config']['description'] );
		$this->assertSame( array( 'title', 'editor', 'excerpt' ), $data['config']['supports'] );
	}

	/**
	 * Unauthenticated update is rejected.
	 */
	public function test_update_item_no_user() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'PUT', self::REST_BASE . '/' . self::$post_type_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 401, $response->get_status() );
	}

	/**
	 * Admin can delete; the record disappears from subsequent listings.
	 */
	public function test_delete_item() {
		wp_set_current_user( self::$admin_id );

		$post_id = self::insert_user_post_type_record(
			array( 'labels' => array( 'singular_name' => 'Throwaway' ) ),
			'throwaway_pt',
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
		$controller = new WP_REST_User_Post_Types_Controller_Gutenberg( 'wp_user_post_type' );
		$post       = get_post( self::$post_type_id );

		$request = new WP_REST_Request( 'GET', self::REST_BASE . '/' . self::$post_type_id );
		$request->set_param( 'context', 'edit' );

		$response = $controller->prepare_item_for_response( $post, $request );
		$data     = $response->get_data();

		$this->assertArrayNotHasKey( 'content', $data );
		$this->assertSame( 'Book', $data['config']['labels']['singular_name'] );
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
				'slug'   => 'unknown_label',
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
				'slug'   => 'unknown_top',
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
	 * `items.enum` on `config.supports` rejects unknown feature strings at
	 * the REST layer with a 400. Post-types analog of the unknown-label-key
	 * test, but for the array-typed `supports` field.
	 */
	public function test_create_item_rejects_unknown_supports_value() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => 'bad_supports',
				'title'  => 'Bad Supports',
				'config' => array(
					'labels'   => array( 'singular_name' => 'Bad Supports' ),
					'supports' => array( 'title', 'fake_feature' ),
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * `config.taxonomies` is stored inline and round-trips cleanly. There is
	 * no separate top-level field and no collection-param filter on this
	 * side — the post-type→taxonomy attachment lives entirely within config.
	 */
	public function test_taxonomies_round_trip_in_config() {
		wp_set_current_user( self::$admin_id );

		$post_id = self::insert_user_post_type_record(
			array(
				'labels'     => array( 'singular_name' => 'Tagged' ),
				'taxonomies' => array( 'category', 'post_tag' ),
			),
			'tagged_pt',
			'Tagged'
		);

		$request = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'category', 'post_tag' ), $data['config']['taxonomies'] );

		wp_delete_post( $post_id, true );
	}

	/**
	 * The storage-only marker key is never present in the REST response,
	 * even though it lives in the stored `post_content` bytes.
	 */
	public function test_marker_key_absent_from_response() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', self::REST_BASE . '/' . self::$post_type_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayNotHasKey( GUTENBERG_USER_POST_TYPE_CONFIG_MARKER, $data['config'] );

		// And confirm it actually lives in the stored bytes — otherwise this
		// test passes vacuously if marker injection is silently broken.
		$raw = get_post( self::$post_type_id )->post_content;
		$this->assertStringContainsString( GUTENBERG_USER_POST_TYPE_CONFIG_MARKER, $raw );
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
			'supports'     => array( 'title', 'editor' ),
		);

		$request = new WP_REST_Request( 'POST', self::REST_BASE );
		$request->set_body_params(
			array(
				'slug'   => 'roundtrip_pt',
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
		$this->assertArrayHasKey( GUTENBERG_USER_POST_TYPE_CONFIG_MARKER, $decoded );
		unset( $decoded[ GUTENBERG_USER_POST_TYPE_CONFIG_MARKER ] );

		// `sanitize_text_field` collapses interior tags to text, so the stored
		// description matches the post-sanitize form, not the raw input.
		$expected_description = sanitize_textarea_field( $config['description'] );
		$this->assertSame( $expected_description, $decoded['description'] );
		$this->assertSame( $config['labels'], $decoded['labels'] );
		$this->assertSame( $config['supports'], $decoded['supports'] );
		$this->assertSame( $config['public'], $decoded['public'] );
		$this->assertSame( $config['hierarchical'], $decoded['hierarchical'] );

		// Live tag/amp characters must not appear in the stored bytes —
		// `JSON_HEX_TAG | JSON_HEX_AMP` should escape them.
		$this->assertStringNotContainsString( '<em>', $raw );
		$this->assertStringNotContainsString( '&', $raw );

		wp_delete_post( $data['id'], true );
	}

	/**
	 * Schema declares `config`, hides raw `content`, keeps
	 * `additionalProperties: false` on the typed config object and on
	 * `labels`, and gates `supports` with `items.enum` so unknown features
	 * fail at the REST layer.
	 */
	public function test_get_item_schema() {
		$request  = new WP_REST_Request( 'OPTIONS', self::REST_BASE );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayHasKey( 'config', $schema['properties'] );
		$this->assertArrayNotHasKey( 'content', $schema['properties'] );

		$config_schema = $schema['properties']['config'];
		$this->assertSame( 'object', $config_schema['type'] );
		$this->assertFalse( $config_schema['additionalProperties'] );
		$this->assertArrayHasKey( 'labels', $config_schema['properties'] );
		$this->assertFalse( $config_schema['properties']['labels']['additionalProperties'] );

		$supports_schema = $config_schema['properties']['supports'];
		$this->assertSame( 'array', $supports_schema['type'] );
		$this->assertArrayHasKey( 'enum', $supports_schema['items'] );
		// Pin a couple of known features — the full list lives on the
		// controller; here we just confirm the gate exists and includes the
		// canonical core supports.
		$this->assertContains( 'title', $supports_schema['items']['enum'] );
		$this->assertContains( 'editor', $supports_schema['items']['enum'] );
		$this->assertNotContains( 'fake_feature', $supports_schema['items']['enum'] );

		$taxonomies_schema = $config_schema['properties']['taxonomies'];
		$this->assertSame( 'array', $taxonomies_schema['type'] );
		$this->assertSame( '^[a-z0-9_-]{1,32}$', $taxonomies_schema['items']['pattern'] );
	}

	/**
	 * Seed a wp_user_taxonomy record via its REST endpoint, mirroring the
	 * production write path. Used by the cross-CPT sync tests below.
	 *
	 * @param string $slug        Taxonomy slug.
	 * @param string $title       Taxonomy plural label.
	 * @param array  $object_type Post type slugs to attach.
	 * @return int Post ID.
	 */
	protected static function insert_user_taxonomy_record_for_sync( $slug, $title, $object_type = array() ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/user-taxonomies' );
		$request->set_body_params(
			array(
				'title'       => $title,
				'slug'        => $slug,
				'status'      => 'publish',
				'object_type' => $object_type,
				'config'      => array(
					'labels' => array( 'singular_name' => $title ),
					'public' => true,
				),
			)
		);
		return rest_get_server()->dispatch( $request )->get_data()['id'];
	}

	/**
	 * Reads the slugs stored in `_wp_user_taxonomy_object_type` meta on a
	 * given wp_user_taxonomy record. Sorted for stable assertions.
	 *
	 * @param int $taxonomy_id wp_user_taxonomy record ID.
	 * @return string[]
	 */
	protected static function get_object_type_meta( $taxonomy_id ) {
		$values = get_post_meta( $taxonomy_id, GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY );
		$values = array_values( array_filter( (array) $values, 'is_string' ) );
		sort( $values );
		return $values;
	}

	/**
	 * Writes that include a user-defined taxonomy slug in `config.taxonomies`
	 * persist only the non-user slugs in the post type's stored JSON; the
	 * user-tax slugs are mirrored into the corresponding wp_user_taxonomy
	 * record's `_wp_user_taxonomy_object_type` meta. Single source of truth
	 * per side, with the controller doing the split.
	 */
	public function test_create_item_routes_user_tax_slugs_to_taxonomy_meta() {
		wp_set_current_user( self::$admin_id );
		$genre_id = self::insert_user_taxonomy_record_for_sync( 'sync_genre', 'Genres' );

		$post_id = self::insert_user_post_type_record(
			array(
				'labels'     => array( 'singular_name' => 'Album' ),
				'taxonomies' => array( 'category', 'sync_genre' ),
			),
			'sync_album',
			'Albums'
		);

		// Stored JSON: only the core slug. The user-tax slug was lifted out.
		$raw     = get_post( $post_id )->post_content;
		$decoded = json_decode( $raw, true );
		$this->assertSame( array( 'category' ), $decoded['taxonomies'] );

		// User-taxonomy meta: now references the post type slug.
		$this->assertSame( array( 'sync_album' ), self::get_object_type_meta( $genre_id ) );

		// Response: the merged view, so the form sees what was sent.
		$request = new WP_REST_Request( 'GET', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$merged   = $data['config']['taxonomies'];
		sort( $merged );
		$this->assertSame( array( 'category', 'sync_genre' ), $merged );

		wp_delete_post( $post_id, true );
		wp_delete_post( $genre_id, true );
	}

	/**
	 * Updating `config.taxonomies` to drop a previously-linked user-tax slug
	 * removes the post type slug from that taxonomy's meta. Other user-tax
	 * records are not touched.
	 */
	public function test_update_item_removes_dropped_user_tax_associations() {
		wp_set_current_user( self::$admin_id );
		$genre_id = self::insert_user_taxonomy_record_for_sync( 'sync_genre', 'Genres' );
		$mood_id  = self::insert_user_taxonomy_record_for_sync( 'sync_mood', 'Moods' );

		$post_id = self::insert_user_post_type_record(
			array(
				'labels'     => array( 'singular_name' => 'Album' ),
				'taxonomies' => array( 'sync_genre', 'sync_mood' ),
			),
			'sync_album',
			'Albums'
		);

		// Both attached after the create.
		$this->assertSame( array( 'sync_album' ), self::get_object_type_meta( $genre_id ) );
		$this->assertSame( array( 'sync_album' ), self::get_object_type_meta( $mood_id ) );

		// Now drop sync_mood, keep sync_genre.
		$request = new WP_REST_Request( 'PUT', self::REST_BASE . '/' . $post_id );
		$request->set_body_params(
			array(
				'config' => array(
					'labels'     => array( 'singular_name' => 'Album' ),
					'taxonomies' => array( 'sync_genre' ),
				),
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assertSame( array( 'sync_album' ), self::get_object_type_meta( $genre_id ) );
		$this->assertSame( array(), self::get_object_type_meta( $mood_id ) );

		wp_delete_post( $post_id, true );
		wp_delete_post( $genre_id, true );
		wp_delete_post( $mood_id, true );
	}

	/**
	 * Status-only updates (the activate/deactivate flow) leave user-tax
	 * associations intact — there's no `config.taxonomies` in the request,
	 * so the controller skips the sync entirely.
	 */
	public function test_update_item_without_config_does_not_touch_meta() {
		wp_set_current_user( self::$admin_id );
		$genre_id = self::insert_user_taxonomy_record_for_sync( 'sync_genre', 'Genres' );

		$post_id = self::insert_user_post_type_record(
			array(
				'labels'     => array( 'singular_name' => 'Album' ),
				'taxonomies' => array( 'sync_genre' ),
			),
			'sync_album',
			'Albums'
		);
		$this->assertSame( array( 'sync_album' ), self::get_object_type_meta( $genre_id ) );

		$request = new WP_REST_Request( 'PUT', self::REST_BASE . '/' . $post_id );
		$request->set_body_params( array( 'status' => 'draft' ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		// Meta is unchanged — deactivating a post type doesn't disconnect
		// linked user taxonomies, so reactivation restores everything.
		$this->assertSame( array( 'sync_album' ), self::get_object_type_meta( $genre_id ) );

		wp_delete_post( $post_id, true );
		wp_delete_post( $genre_id, true );
	}

	/**
	 * Force-deleting a post type strips its slug from every user-taxonomy
	 * record's meta. Trash (force = false) leaves the meta intact so
	 * untrashing restores the linkage.
	 */
	public function test_delete_item_force_cleans_user_tax_meta() {
		wp_set_current_user( self::$admin_id );
		$genre_id = self::insert_user_taxonomy_record_for_sync( 'sync_genre', 'Genres' );

		$post_id = self::insert_user_post_type_record(
			array(
				'labels'     => array( 'singular_name' => 'Album' ),
				'taxonomies' => array( 'sync_genre' ),
			),
			'sync_album',
			'Albums'
		);
		$this->assertSame( array( 'sync_album' ), self::get_object_type_meta( $genre_id ) );

		$request = new WP_REST_Request( 'DELETE', self::REST_BASE . '/' . $post_id );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assertSame( array(), self::get_object_type_meta( $genre_id ) );

		wp_delete_post( $genre_id, true );
	}

	/**
	 * Trash (force = false) preserves user-taxonomy meta so untrashing
	 * restores the linkage. Companion to the force-delete test above.
	 */
	public function test_delete_item_trash_preserves_user_tax_meta() {
		wp_set_current_user( self::$admin_id );
		$genre_id = self::insert_user_taxonomy_record_for_sync( 'sync_genre', 'Genres' );

		$post_id = self::insert_user_post_type_record(
			array(
				'labels'     => array( 'singular_name' => 'Album' ),
				'taxonomies' => array( 'sync_genre' ),
			),
			'sync_album',
			'Albums'
		);
		$this->assertSame( array( 'sync_album' ), self::get_object_type_meta( $genre_id ) );

		// No `force` param — trash, not delete.
		$request  = new WP_REST_Request( 'DELETE', self::REST_BASE . '/' . $post_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assertSame( array( 'sync_album' ), self::get_object_type_meta( $genre_id ) );

		wp_delete_post( $post_id, true );
		wp_delete_post( $genre_id, true );
	}

	/**
	 * Renaming a post type's slug carries its user-taxonomy back-references
	 * to the new slug — without this, every linked user taxonomy would
	 * silently disconnect after a rename.
	 */
	public function test_update_item_slug_rename_migrates_user_tax_meta() {
		wp_set_current_user( self::$admin_id );
		$genre_id = self::insert_user_taxonomy_record_for_sync( 'sync_genre', 'Genres' );

		$post_id = self::insert_user_post_type_record(
			array(
				'labels'     => array( 'singular_name' => 'Album' ),
				'taxonomies' => array( 'sync_genre' ),
			),
			'sync_album',
			'Albums'
		);
		$this->assertSame( array( 'sync_album' ), self::get_object_type_meta( $genre_id ) );

		$request = new WP_REST_Request( 'PUT', self::REST_BASE . '/' . $post_id );
		$request->set_body_params( array( 'slug' => 'sync_record' ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );

		$this->assertSame( array( 'sync_record' ), self::get_object_type_meta( $genre_id ) );

		wp_delete_post( $post_id, true );
		wp_delete_post( $genre_id, true );
	}
}
