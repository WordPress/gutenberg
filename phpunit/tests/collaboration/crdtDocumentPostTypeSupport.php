<?php
/**
 * Tests for `custom-fields` support on post types that persist a CRDT document.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 * @group restapi
 */
class Tests_Collaboration_CrdtDocumentPostTypeSupport extends WP_UnitTestCase {

	/**
	 * This string must match POST_META_KEY_FOR_CRDT_DOC_PERSISTENCE in @wordpress/core-data.
	 */
	private const CRDT_DOCUMENT_META_KEY = '_crdt_document';

	private const TEST_DOCUMENT = 'AQEBAAA=';

	private const TEST_POST_TYPE = 'collab_test_cpt';

	protected static int $admin_id;

	/**
	 * Post type support registered before the test ran.
	 *
	 * @var array
	 */
	private $post_type_features;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function set_up() {
		parent::set_up();

		/*
		 * Post type support lives in a global that the test suite does not reset,
		 * and the function under test adds support to every eligible post type.
		 */
		$this->post_type_features = $GLOBALS['_wp_post_type_features'];

		update_option( 'wp_collaboration_enabled', 1 );
		wp_set_current_user( self::$admin_id );
	}

	public function tear_down() {
		if ( post_type_exists( self::TEST_POST_TYPE ) ) {
			unregister_post_type( self::TEST_POST_TYPE );
		}

		$GLOBALS['_wp_post_type_features'] = $this->post_type_features;
		delete_option( 'wp_collaboration_enabled' );
		$this->reset_rest_server();

		parent::tear_down();
	}

	/**
	 * Rebuilds the REST server so its routes reflect the current post type support.
	 *
	 * `WP_REST_Posts_Controller` caches its schema while registering routes, and
	 * the `meta` property is only part of that schema when the post type supports
	 * `custom-fields` at that moment.
	 *
	 * @return WP_REST_Server The rebuilt REST server.
	 */
	private function reset_rest_server() {
		global $wp_rest_server;

		$wp_rest_server = null;

		return rest_get_server();
	}

	/**
	 * Registers a post type that has no `custom-fields` support of its own.
	 *
	 * @param array $args Optional. Arguments to override the defaults.
	 */
	private function register_test_post_type( $args = array() ) {
		register_post_type(
			self::TEST_POST_TYPE,
			array_merge(
				array(
					'public'       => true,
					'show_in_rest' => true,
					'supports'     => array( 'title', 'editor' ),
				),
				$args
			)
		);
	}

	/**
	 * Sends the CRDT document meta the editor sends alongside a navigation save.
	 *
	 * @param int $navigation_id Navigation post ID.
	 * @return WP_REST_Response The REST response.
	 */
	private function save_navigation_crdt_document( $navigation_id ) {
		$request = new WP_REST_Request( 'PUT', '/wp/v2/navigation/' . $navigation_id );
		$request->set_body_params(
			array(
				'meta' => array( self::CRDT_DOCUMENT_META_KEY => self::TEST_DOCUMENT ),
			)
		);

		return $this->reset_rest_server()->dispatch( $request );
	}

	public function test_adds_support_to_a_post_type_that_does_not_declare_it() {
		$this->register_test_post_type();

		gutenberg_add_crdt_document_post_type_support();

		$this->assertTrue( post_type_supports( self::TEST_POST_TYPE, 'custom-fields' ) );
	}

	public function test_adds_support_to_navigation_menus() {
		gutenberg_add_crdt_document_post_type_support();

		$this->assertTrue( post_type_supports( 'wp_navigation', 'custom-fields' ) );
	}

	public function test_does_not_add_support_when_collaboration_is_disabled() {
		$this->register_test_post_type();
		update_option( 'wp_collaboration_enabled', 0 );

		gutenberg_add_crdt_document_post_type_support();

		$this->assertFalse( post_type_supports( self::TEST_POST_TYPE, 'custom-fields' ) );
	}

	public function test_does_not_add_support_when_collaboration_is_disabled_for_the_post_type() {
		$this->register_test_post_type();

		$disable_test_post_type = static function ( $disabled, $post_type ) {
			return self::TEST_POST_TYPE === $post_type ? true : $disabled;
		};
		add_filter( 'wp_is_post_type_collaboration_disabled', $disable_test_post_type, 10, 2 );

		gutenberg_add_crdt_document_post_type_support();

		remove_filter( 'wp_is_post_type_collaboration_disabled', $disable_test_post_type );

		$this->assertFalse( post_type_supports( self::TEST_POST_TYPE, 'custom-fields' ) );
	}

	/**
	 * No controller other than `WP_REST_Posts_Controller` reads or writes the
	 * `meta` property, so the support would be inert for those post types.
	 * `WP_REST_Templates_Controller` is the controller `wp_template` and
	 * `wp_template_part` use by default.
	 */
	public function test_does_not_add_support_to_a_post_type_served_by_another_controller() {
		$this->register_test_post_type(
			array( 'rest_controller_class' => 'WP_REST_Templates_Controller' )
		);

		gutenberg_add_crdt_document_post_type_support();

		$this->assertFalse( post_type_supports( self::TEST_POST_TYPE, 'custom-fields' ) );
	}

	public function test_does_not_add_support_to_a_post_type_hidden_from_the_rest_api() {
		$this->register_test_post_type( array( 'show_in_rest' => false ) );

		gutenberg_add_crdt_document_post_type_support();

		$this->assertFalse( post_type_supports( self::TEST_POST_TYPE, 'custom-fields' ) );
	}

	/**
	 * The support is what puts `meta` in the schema, which is in turn what allows
	 * `WP_REST_Posts_Controller` to write the meta at all.
	 */
	public function test_exposes_the_crdt_document_meta_in_the_post_type_schema() {
		$this->register_test_post_type();

		gutenberg_add_crdt_document_post_type_support();

		$controller = new WP_REST_Posts_Controller( self::TEST_POST_TYPE );
		$schema     = $controller->get_item_schema();

		$this->assertArrayHasKey( 'meta', $schema['properties'] );
		$this->assertArrayHasKey(
			self::CRDT_DOCUMENT_META_KEY,
			$schema['properties']['meta']['properties']
		);
	}

	public function test_persists_the_crdt_document_of_a_navigation_menu() {
		gutenberg_add_crdt_document_post_type_support();

		$navigation_id = self::factory()->post->create( array( 'post_type' => 'wp_navigation' ) );
		$response      = $this->save_navigation_crdt_document( $navigation_id );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			self::TEST_DOCUMENT,
			get_post_meta( $navigation_id, self::CRDT_DOCUMENT_META_KEY, true )
		);
	}

	/**
	 * Without the support the meta is dropped silently: the save still succeeds,
	 * which is why the reverted changes were only visible after a reload.
	 */
	public function test_drops_the_crdt_document_of_a_navigation_menu_without_the_support() {
		$navigation_id = self::factory()->post->create( array( 'post_type' => 'wp_navigation' ) );
		$response      = $this->save_navigation_crdt_document( $navigation_id );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '', get_post_meta( $navigation_id, self::CRDT_DOCUMENT_META_KEY, true ) );
	}
}
