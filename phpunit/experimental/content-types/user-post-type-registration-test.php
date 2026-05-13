<?php
/**
 * Unit tests for the user-post-type registration flow in
 * `lib/experimental/content-types/post-types.php` —
 * `gutenberg_register_user_defined_post_types()` and
 * `gutenberg_build_user_post_type_args()`.
 *
 * @package gutenberg
 */

class User_Post_Type_Registration_Test extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	/**
	 * Seed a wp_user_post_type record via REST so tests follow the same write
	 * path users do — controller sanitization and config encoding all happen
	 * via the REST controller rather than ad-hoc `wp_insert_post` plumbing.
	 *
	 * Always creates with `publish` because draft creation via REST triggers
	 * an upstream `wp_unique_post_slug` warning on new posts; tests that
	 * need a draft transition the status with `wp_update_post` after.
	 */
	protected static function create_user_post_type( $config, $slug, $title ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/user-post-types' );
		$request->set_body_params(
			array(
				'title'  => $title,
				'slug'   => $slug,
				'status' => 'publish',
				'config' => $config,
			)
		);
		return rest_get_server()->dispatch( $request )->get_data();
	}

	/**
	 * `gutenberg_register_user_defined_post_types()` only registers records
	 * with `post_status === 'publish'`; drafts are skipped so the Edit
	 * "Active" toggle effectively gates registration.
	 */
	public function test_drafts_are_skipped_by_registration() {
		$created = self::create_user_post_type(
			array( 'labels' => array( 'singular_name' => 'Draft' ) ),
			'draft_pt',
			'Drafts'
		);
		wp_update_post(
			array(
				'ID'          => $created['id'],
				'post_status' => 'draft',
			)
		);

		gutenberg_register_user_defined_post_types();

		$this->assertFalse( post_type_exists( 'draft_pt' ) );
		wp_delete_post( $created['id'], true );
	}

	/**
	 * Every config value the user sets is forwarded to `register_post_type()`
	 * so the resulting WP_Post_Type reflects the user's choice. Pins the
	 * contract of `gutenberg_build_user_post_type_args()`.
	 */
	public function test_config_forwarded_to_register_post_type() {
		$created = self::create_user_post_type(
			array(
				'labels'       => array(
					'singular_name' => 'Item',
					'menu_name'     => 'Items menu',
					'add_new_item'  => 'Add a new item',
				),
				'public'       => false,
				'hierarchical' => true,
				'has_archive'  => true,
				'show_in_rest' => false,
				'description'  => 'A test desc.',
				'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
			),
			'flagged_pt',
			'Items'
		);

		gutenberg_register_user_defined_post_types();

		$post_type = get_post_type_object( 'flagged_pt' );
		$this->assertNotNull( $post_type );
		$this->assertFalse( $post_type->public );
		$this->assertTrue( $post_type->hierarchical );
		$this->assertTrue( $post_type->has_archive );
		$this->assertFalse( $post_type->show_in_rest );
		$this->assertSame( 'A test desc.', $post_type->description );
		$this->assertSame( 'Item', $post_type->labels->singular_name );
		$this->assertSame( 'Items menu', $post_type->labels->menu_name );
		$this->assertSame( 'Add a new item', $post_type->labels->add_new_item );

		$this->assertTrue( post_type_supports( 'flagged_pt', 'title' ) );
		$this->assertTrue( post_type_supports( 'flagged_pt', 'editor' ) );
		$this->assertTrue( post_type_supports( 'flagged_pt', 'thumbnail' ) );
		$this->assertTrue( post_type_supports( 'flagged_pt', 'excerpt' ) );

		unregister_post_type( 'flagged_pt' );
		wp_delete_post( $created['id'], true );
	}

	/**
	 * `hierarchical: true` implies `page-attributes` support so the parent
	 * picker renders in the block editor — without this the `hierarchical`
	 * toggle would flip a registry flag with no UI surface. Verifies the
	 * implicit add in `gutenberg_build_user_post_type_args()` even when the
	 * user didn't list it themselves.
	 */
	public function test_hierarchical_implies_page_attributes_support() {
		$created = self::create_user_post_type(
			array(
				'labels'       => array( 'singular_name' => 'Hier' ),
				'hierarchical' => true,
				'supports'     => array( 'title' ),
			),
			'hier_pt',
			'Hiers'
		);

		gutenberg_register_user_defined_post_types();

		$this->assertTrue( post_type_supports( 'hier_pt', 'page-attributes' ) );
		$this->assertTrue( post_type_supports( 'hier_pt', 'title' ) );

		unregister_post_type( 'hier_pt' );
		wp_delete_post( $created['id'], true );
	}

	/**
	 * Empty `supports` falls back to title+editor so a record without any
	 * features doesn't accidentally disable everything. Mirrors WordPress
	 * core's `register_post_type()` default when supports is omitted.
	 */
	public function test_empty_supports_defaults_to_title_editor() {
		$created = self::create_user_post_type(
			array(
				'labels'   => array( 'singular_name' => 'Default' ),
				'supports' => array(),
			),
			'default_pt',
			'Defaults'
		);

		gutenberg_register_user_defined_post_types();

		$this->assertTrue( post_type_supports( 'default_pt', 'title' ) );
		$this->assertTrue( post_type_supports( 'default_pt', 'editor' ) );

		unregister_post_type( 'default_pt' );
		wp_delete_post( $created['id'], true );
	}

	/**
	 * Taxonomy slugs in `config.taxonomies` that don't correspond to any
	 * registered taxonomy are dropped at materialization time so we never
	 * pass unregistered slugs to `register_post_type()`.
	 */
	public function test_unknown_taxonomy_slugs_dropped_at_registration() {
		$created = self::create_user_post_type(
			array(
				'labels'     => array( 'singular_name' => 'Tagged' ),
				'taxonomies' => array( 'category', 'definitely_not_a_real_tax' ),
			),
			'tagged_reg_pt',
			'Tagged'
		);

		gutenberg_register_user_defined_post_types();

		$attached = get_object_taxonomies( 'tagged_reg_pt' );
		$this->assertContains( 'category', $attached );
		$this->assertNotContains( 'definitely_not_a_real_tax', $attached );

		unregister_post_type( 'tagged_reg_pt' );
		wp_delete_post( $created['id'], true );
	}

	/**
	 * A record with a slug outside the post-type pattern (over the 20-char
	 * cap, in this case) is skipped by the materializer — the pattern guard
	 * in `gutenberg_build_user_post_type_args()` prevents us from forwarding
	 * a malformed slug to `register_post_type()`. We use length here because
	 * `wp_insert_post` runs `sanitize_title` on `post_name` and would
	 * normalize most other shape violations away; length isn't truncated, so
	 * it survives storage and reaches the materializer.
	 */
	public function test_invalid_slug_record_skipped_by_materializer() {
		$slug    = str_repeat( 'a', 22 );
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'wp_user_post_type',
				'post_status'  => 'publish',
				'post_name'    => $slug,
				'post_title'   => 'Bad',
				'post_content' => wp_json_encode(
					array( 'labels' => array( 'singular_name' => 'Bad' ) )
				),
			)
		);

		// Materializer must not fatal and must not register the over-length slug.
		gutenberg_register_user_defined_post_types();

		$this->assertFalse( post_type_exists( $slug ) );

		wp_delete_post( $post_id, true );
	}
}
