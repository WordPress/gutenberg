<?php
/**
 * Tests for the actions WordPress core registers through the entity actions
 * API, from packages/core-actions.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_get_core_action_definitions
 * @covers ::gutenberg_register_core_actions
 */
class Tests_Core_Actions extends WP_UnitTestCase {

	/**
	 * The script module of the default actions.
	 *
	 * @var string
	 */
	const DEFAULTS_MODULE = '@wordpress/core-actions/post_type_supports';

	/**
	 * The actions every post type gets, whatever it supports, in order.
	 *
	 * @var string[]
	 */
	const EVERY_POST_TYPE_ACTIONS = array( 'restore', 'reset-post', 'delete-post', 'move-to-trash', 'permanently-delete' );

	/**
	 * A user who can create posts of every post type.
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * A user who can create no post.
	 *
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * The post types a test registered, unregistered on tear down.
	 *
	 * @var string[]
	 */
	private $post_types = array();

	/**
	 * Creates the users.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	/**
	 * Deletes the users.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 * Sets up each test, as an administrator.
	 */
	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$admin_id );
	}

	/**
	 * Tears down each test.
	 *
	 * Resetting the registry drops the actions registered for the user and
	 * the post types of the test; the next read fires
	 * `wp_entity_actions_api_init` again.
	 */
	public function tear_down() {
		foreach ( $this->post_types as $post_type ) {
			unregister_post_type( $post_type );
		}
		$this->post_types = array();
		self::reset_registry();

		parent::tear_down();
	}

	/**
	 * Resets the registry: drops the singleton instance and puts an empty
	 * plugin registry in its place, as `init` does, so its first read fires
	 * `wp_entity_actions_api_init` again.
	 */
	private static function reset_registry() {
		$instance = new ReflectionProperty( WP_Entity_Actions_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
		WP_Entity_Actions_Registry_Gutenberg::get_instance();
	}

	/**
	 * Returns the ids of the actions of a post type, registered anew for the
	 * current user, the current theme, and the post types registered so far.
	 *
	 * @param string $post_type The post type.
	 * @return string[] The ids of the actions, in registration order.
	 */
	private function get_action_ids( $post_type ) {
		self::reset_registry();
		return array_column( wp_get_registered_entity_actions( 'postType', $post_type ), 'id' );
	}

	/**
	 * Registers a post type for the duration of the test.
	 *
	 * @param string $post_type The post type.
	 * @param array  $args      The arguments of the post type.
	 */
	private function register_post_type( $post_type, $args ) {
		register_post_type( $post_type, $args + array( 'show_in_rest' => true ) );
		$this->post_types[] = $post_type;
	}

	/**
	 * The core actions are registered at priority 0, under the name the
	 * Gutenberg build gives the function.
	 */
	public function test_the_core_actions_are_registered_at_priority_zero() {
		$this->assertSame( 0, has_action( 'wp_entity_actions_api_init', 'gutenberg_register_core_actions' ) );
		$this->assertFalse( function_exists( 'wp_register_core_actions' ), 'The Gutenberg build prefixes the function.' );
		$this->assertFalse( function_exists( 'wp_get_core_action_definitions' ), 'The Gutenberg build prefixes the function.' );
	}

	/**
	 * The build prefixes the functions the core-actions loader defines, and
	 * their calls.
	 */
	public function test_the_build_prefixes_the_functions_of_the_core_actions_loader() {
		$built = file_get_contents( __DIR__ . '/../build/scripts/core-actions/index.php' );

		$this->assertStringContainsString( 'function gutenberg_get_core_action_definitions()', $built );
		$this->assertStringContainsString( 'function gutenberg_register_core_actions()', $built );
		$this->assertStringContainsString( '$definitions = gutenberg_get_core_action_definitions();', $built );
		$this->assertStringContainsString( "add_action( 'wp_entity_actions_api_init', 'gutenberg_register_core_actions', 0 );", $built );
	}

	/**
	 * Posts get the default actions of what they support, all from the
	 * default module, in order.
	 */
	public function test_posts_get_the_default_actions_in_order() {
		$this->assertSame(
			array_merge( array( 'view-post', 'view-post-revisions', 'duplicate-post', 'rename-post' ), self::EVERY_POST_TYPE_ACTIONS ),
			$this->get_action_ids( 'post' )
		);
		$this->assertSame(
			array( self::DEFAULTS_MODULE ),
			array_keys( wp_get_registered_entity_action_modules( 'postType', 'post' ) )
		);
	}

	/**
	 * Pages support `page-attributes`, so they can be ordered.
	 */
	public function test_pages_get_the_order_action() {
		$this->assertSame(
			array_merge( array( 'view-post', 'view-post-revisions', 'duplicate-post', 'rename-post', 'order-pages' ), self::EVERY_POST_TYPE_ACTIONS ),
			$this->get_action_ids( 'page' )
		);
	}

	/**
	 * The actions carry their data and the `core` origin, and leave the parts
	 * only a script module can provide to it.
	 */
	public function test_an_action_has_its_data_and_the_core_origin() {
		self::reset_registry();
		$actions = array_column( wp_get_registered_entity_actions( 'postType', 'post' ), null, 'id' );

		$this->assertSame(
			array(
				'id'                => 'move-to-trash',
				'label'             => 'Trash…',
				'isPrimary'         => true,
				'supportsBulk'      => true,
				'hideModalHeader'   => true,
				'modalFocusOnMount' => 'firstContentElement',
				'origin'            => array( 'registeredBy' => 'core' ),
			),
			$actions['move-to-trash']
		);
		$this->assertArrayNotHasKey( 'label', $actions['view-post-revisions'], 'The label depends on the items, so the script module provides it.' );
		$this->assertSame( 'list', $actions['view-post-revisions']['context'] );
	}

	/**
	 * Patterns get their own actions, from their own module, in between the
	 * default ones, and are not duplicated as posts are.
	 */
	public function test_patterns_get_their_own_actions_in_order() {
		$this->assertSame(
			array_merge( array( 'view-post-revisions', 'duplicate-pattern', 'rename-post', 'export-pattern' ), self::EVERY_POST_TYPE_ACTIONS ),
			$this->get_action_ids( 'wp_block' )
		);

		$modules = wp_get_registered_entity_action_modules( 'postType', 'wp_block' );
		$this->assertSame( array( 'duplicate-pattern', 'export-pattern' ), $modules['@wordpress/core-actions/wp_block'] );
		$this->assertNotContains( 'duplicate-post', $modules[ self::DEFAULTS_MODULE ] );
	}

	/**
	 * Template parts can be duplicated with a block theme only.
	 */
	public function test_template_parts_are_duplicated_with_a_block_theme() {
		switch_theme( 'block-theme' );
		$ids = $this->get_action_ids( 'wp_template_part' );
		$this->assertContains( 'duplicate-template-part', $ids );
		$this->assertNotContains( 'duplicate-post', $ids );
		$this->assertSame(
			array( 'duplicate-template-part' ),
			wp_get_registered_entity_action_modules( 'postType', 'wp_template_part' )['@wordpress/core-actions/wp_template_part']
		);

		switch_theme( 'default' );
		$this->assertNotContains( 'duplicate-template-part', $this->get_action_ids( 'wp_template_part' ) );
	}

	/**
	 * Templates are never duplicated as posts are.
	 */
	public function test_templates_are_not_duplicated() {
		$this->assertNotContains( 'duplicate-post', $this->get_action_ids( 'wp_template' ) );
	}

	/**
	 * A user who cannot create posts of a post type cannot duplicate them.
	 */
	public function test_a_user_who_cannot_create_posts_cannot_duplicate_them() {
		switch_theme( 'block-theme' );
		wp_set_current_user( self::$subscriber_id );

		$this->assertNotContains( 'duplicate-post', $this->get_action_ids( 'post' ) );
		$this->assertNotContains( 'duplicate-pattern', $this->get_action_ids( 'wp_block' ) );
		$this->assertNotContains( 'duplicate-template-part', $this->get_action_ids( 'wp_template_part' ) );
	}

	/**
	 * A custom post type gets the actions of what it supports, and the actions
	 * of every post type.
	 */
	public function test_a_custom_post_type_gets_the_actions_of_its_supports() {
		$this->register_post_type(
			'book',
			array(
				'public'   => false,
				'supports' => array( 'page-attributes' ),
			)
		);

		$this->assertSame(
			array_merge( array( 'duplicate-post', 'order-pages' ), self::EVERY_POST_TYPE_ACTIONS ),
			$this->get_action_ids( 'book' )
		);
	}

	/**
	 * A post type hidden from the REST API gets no action.
	 */
	public function test_a_post_type_hidden_from_the_rest_api_gets_no_action() {
		$this->register_post_type( 'secret', array( 'show_in_rest' => false ) );

		$this->assertSame( array(), $this->get_action_ids( 'secret' ) );
	}
}
