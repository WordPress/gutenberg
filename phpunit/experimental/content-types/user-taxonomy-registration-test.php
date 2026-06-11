<?php
/**
 * Unit tests for the user-taxonomy registration flow in
 * `lib/experimental/content-types/index.php` —
 * `gutenberg_register_user_defined_taxonomies()` and
 * `gutenberg_build_user_taxonomy_args()`.
 *
 * @package gutenberg
 */

class User_Taxonomy_Registration_Test extends WP_UnitTestCase {

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
	 * Seed a wp_user_taxonomy record via REST so tests follow the same write
	 * path users do — controller sanitization, post-meta handling, and
	 * config encoding all happen via the REST controller rather than ad-hoc
	 * `wp_insert_post` plumbing.
	 *
	 * Always creates with `publish` because draft creation via REST triggers
	 * an upstream `wp_unique_post_slug` warning on new posts; tests that
	 * need a draft transition the status with `wp_update_post` after.
	 */
	protected static function create_user_taxonomy( $config, $slug, $title, $object_type = array( 'post' ) ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/user-taxonomies' );
		$request->set_body_params(
			array(
				'title'       => $title,
				'slug'        => $slug,
				'status'      => 'publish',
				'object_type' => $object_type,
				'config'      => $config,
			)
		);
		return rest_get_server()->dispatch( $request )->get_data();
	}

	/**
	 * `gutenberg_register_user_defined_taxonomies()` only registers records
	 * with `post_status === 'publish'`; drafts are skipped so the Edit
	 * "Active" toggle effectively gates registration.
	 */
	public function test_drafts_are_skipped_by_registration() {
		$created = self::create_user_taxonomy(
			array( 'labels' => array( 'singular_name' => 'Draft' ) ),
			'draft_tax',
			'Drafts'
		);
		wp_update_post(
			array(
				'ID'          => $created['id'],
				'post_status' => 'draft',
			)
		);

		gutenberg_register_user_defined_taxonomies();

		$this->assertFalse( taxonomy_exists( 'draft_tax' ) );
		wp_delete_post( $created['id'], true );
	}

	/**
	 * Every config value the user sets is forwarded to `register_taxonomy()`
	 * so the resulting WP_Taxonomy reflects the user's choice. Pins the
	 * contract of `gutenberg_build_user_taxonomy_args()` and the
	 * `$bool_keys` loop in particular.
	 */
	public function test_config_forwarded_to_register_taxonomy() {
		$created = self::create_user_taxonomy(
			array(
				'labels'             => array( 'singular_name' => 'Flagged' ),
				'public'             => false,
				'hierarchical'       => true,
				'publicly_queryable' => false,
				'show_ui'            => false,
				'show_in_menu'       => false,
				'show_in_nav_menus'  => false,
				'show_tagcloud'      => false,
				'show_in_quick_edit' => false,
				'show_admin_column'  => true,
				'show_in_rest'       => false,
				'sort'               => true,
			),
			'flagged_tax',
			'Flagged'
		);

		gutenberg_register_user_defined_taxonomies();

		$tax = get_taxonomy( 'flagged_tax' );
		$this->assertNotFalse( $tax );
		$this->assertFalse( $tax->public );
		$this->assertTrue( $tax->hierarchical );
		$this->assertFalse( $tax->publicly_queryable );
		$this->assertFalse( $tax->show_ui );
		$this->assertFalse( $tax->show_in_menu );
		$this->assertFalse( $tax->show_in_nav_menus );
		$this->assertFalse( $tax->show_tagcloud );
		$this->assertFalse( $tax->show_in_quick_edit );
		$this->assertTrue( $tax->show_admin_column );
		$this->assertFalse( $tax->show_in_rest );
		$this->assertTrue( $tax->sort );

		unregister_taxonomy( 'flagged_tax' );
		wp_delete_post( $created['id'], true );
	}

	/**
	 * `default_term` flows through as a `[ 'name' => ... ]` array on the
	 * registered WP_Taxonomy.
	 */
	public function test_default_term_forwarded_to_register_taxonomy() {
		$created = self::create_user_taxonomy(
			array(
				'labels'       => array( 'singular_name' => 'Topic' ),
				'default_term' => array( 'name' => 'Uncategorized Topic' ),
			),
			'topic_tax',
			'Topics'
		);

		gutenberg_register_user_defined_taxonomies();

		$tax = get_taxonomy( 'topic_tax' );
		$this->assertNotFalse( $tax );
		$this->assertSame( 'Uncategorized Topic', $tax->default_term['name'] );

		// WP core auto-creates the default term during register_taxonomy();
		// clean up so the test doesn't leak rows.
		$term_id = (int) get_option( 'default_term_topic_tax' );
		if ( $term_id > 0 ) {
			wp_delete_term( $term_id, 'topic_tax' );
		}
		delete_option( 'default_term_topic_tax' );
		unregister_taxonomy( 'topic_tax' );
		wp_delete_post( $created['id'], true );
	}

	/**
	 * An empty `default_term.name` must not call `wp_insert_term()` (which
	 * would error on an empty name) and must not set the option.
	 */
	public function test_default_term_with_empty_name_is_omitted() {
		$created = self::create_user_taxonomy(
			array(
				'labels'       => array( 'singular_name' => 'Empty' ),
				'default_term' => array( 'name' => '' ),
			),
			'empty_default_tax',
			'Empties'
		);

		gutenberg_register_user_defined_taxonomies();

		$tax = get_taxonomy( 'empty_default_tax' );
		$this->assertNotFalse( $tax );
		$this->assertEmpty( $tax->default_term );
		$this->assertFalse( get_option( 'default_term_empty_default_tax' ) );

		unregister_taxonomy( 'empty_default_tax' );
		wp_delete_post( $created['id'], true );
	}
}
