<?php
/**
 * Tests for the actions WordPress core registers through the entity actions API.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_register_core_entity_actions
 */
class Tests_Core_Actions extends WP_UnitTestCase {

	/**
	 * The script module of the actions of every post type.
	 */
	const POST_TYPE_SUPPORTS = '@wordpress/core-actions/post_type_supports';

	/**
	 * The script module of the actions of pages.
	 */
	const PAGE = '@wordpress/core-actions/page';

	/**
	 * The script module of the actions of patterns.
	 */
	const WP_BLOCK = '@wordpress/core-actions/wp_block';

	/**
	 * The script module of the actions of template parts.
	 */
	const WP_TEMPLATE_PART = '@wordpress/core-actions/wp_template_part';

	/**
	 * The actions every post type has, each checking which posts it applies
	 * to, in the order they are shown.
	 */
	const EVERY_POST_TYPE = array( 'restore', 'reset-post', 'delete-post', 'move-to-trash', 'permanently-delete' );

	/**
	 * The actions of the `page` module, for the users who can manage the
	 * site options, shown after the others.
	 */
	const PAGE_ACTIONS = array( 'set-as-homepage', 'set-as-posts-page' );

	/**
	 * Administrator user id.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Editor user id (lacks `edit_theme_options`).
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * Contributor user id (lacks `publish_posts` and `edit_pages`).
	 *
	 * @var int
	 */
	protected static $contributor_id;

	/**
	 * The post types a test registered, unregistered on tear down.
	 *
	 * @var string[]
	 */
	private $post_types = array();

	/**
	 * Creates shared users.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id       = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$editor_id      = $factory->user->create( array( 'role' => 'editor' ) );
		self::$contributor_id = $factory->user->create( array( 'role' => 'contributor' ) );
	}

	/**
	 * Deletes shared users.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
		self::delete_user( self::$contributor_id );
	}

	/**
	 * Tears down each test.
	 *
	 * Resetting the registry drops the actions registered for the user and
	 * theme of the test; the next read fires `wp_entity_actions_api_init` again.
	 * The test case removes the callbacks the test hooked, but only resets
	 * the post types when running the tests of WordPress itself.
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
	 * Returns the ids of the actions registered for a post type, from a
	 * registry built anew for the current user and theme, as each request
	 * builds it.
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
		register_post_type( $post_type, $args );
		$this->post_types[] = $post_type;
	}

	/**
	 * The core actions are registered at priority 0, so a plugin hooking the
	 * action at the default priority sees them.
	 */
	public function test_the_core_actions_are_registered_at_priority_0() {
		$this->assertSame( 0, has_action( 'wp_entity_actions_api_init', 'gutenberg_register_core_entity_actions' ) );
	}

	/**
	 * Pages are viewable and support revisions, titles, and page attributes,
	 * and the user can create them and manage the site options: they have
	 * every action of the `post_type_supports` module, then the actions of
	 * the `page` module, in the order the actions are shown.
	 */
	public function test_the_actions_of_pages() {
		wp_set_current_user( self::$admin_id );

		$ids = array_merge( array( 'view-post', 'view-post-revisions', 'duplicate-post', 'rename-post', 'order-pages' ), self::EVERY_POST_TYPE );
		$this->assertSame( array_merge( $ids, self::PAGE_ACTIONS ), $this->get_action_ids( 'page' ) );
		$this->assertSame(
			array(
				self::POST_TYPE_SUPPORTS => $ids,
				self::PAGE               => self::PAGE_ACTIONS,
			),
			array_column( wp_get_registered_entity_action_modules( 'postType', 'page' ), 'actions', 'id' )
		);
		$this->assertSame( array( 'core' ), array_unique( array_column( array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'origin' ), 'registeredBy' ) ), 'Every action is registered by core.' );
	}

	/**
	 * Posts do not support page attributes, so they cannot be ordered.
	 */
	public function test_the_actions_of_posts() {
		wp_set_current_user( self::$admin_id );

		$this->assertSame(
			array_merge( array( 'view-post', 'view-post-revisions', 'duplicate-post', 'rename-post' ), self::EVERY_POST_TYPE ),
			$this->get_action_ids( 'post' )
		);
	}

	/**
	 * Patterns are not viewable and are duplicated and exported by the
	 * actions of the `wp_block` module, placed among the others in the order
	 * the actions are shown.
	 */
	public function test_the_actions_of_patterns() {
		wp_set_current_user( self::$admin_id );

		$this->assertSame(
			array_merge( array( 'view-post-revisions', 'duplicate-pattern', 'rename-post', 'export-pattern' ), self::EVERY_POST_TYPE ),
			$this->get_action_ids( 'wp_block' )
		);
		$this->assertSame(
			array(
				self::POST_TYPE_SUPPORTS => array_merge( array( 'view-post-revisions', 'rename-post' ), self::EVERY_POST_TYPE ),
				self::WP_BLOCK           => array( 'duplicate-pattern', 'export-pattern' ),
			),
			array_column( wp_get_registered_entity_action_modules( 'postType', 'wp_block' ), 'actions', 'id' )
		);
	}

	/**
	 * Templates are not duplicated: the editor creates them from the theme.
	 */
	public function test_the_actions_of_templates() {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );

		$this->assertSame(
			array_merge( array( 'view-post-revisions', 'rename-post' ), self::EVERY_POST_TYPE ),
			$this->get_action_ids( 'wp_template' )
		);
	}

	/**
	 * Template parts are duplicated by the action of the `wp_template_part`
	 * module, with a block theme only.
	 */
	public function test_template_parts_are_only_duplicated_with_a_block_theme() {
		wp_set_current_user( self::$admin_id );

		switch_theme( 'block-theme' );
		$this->assertSame(
			array_merge( array( 'view-post-revisions', 'duplicate-template-part', 'rename-post' ), self::EVERY_POST_TYPE ),
			$this->get_action_ids( 'wp_template_part' ),
			'A block theme can duplicate template parts.'
		);
		$this->assertSame( array( 'duplicate-template-part' ), array_column( wp_get_registered_entity_action_modules( 'postType', 'wp_template_part' ), 'actions', 'id' )[ self::WP_TEMPLATE_PART ] );

		switch_theme( 'default' );
		$this->assertNotContains( 'duplicate-template-part', $this->get_action_ids( 'wp_template_part' ), 'A classic theme cannot.' );
	}

	/**
	 * The duplicate actions are only registered for the users who can create
	 * the posts they duplicate into: the registry is built for the current
	 * user.
	 */
	public function test_the_duplicate_actions_depend_on_the_current_user() {
		switch_theme( 'block-theme' );

		wp_set_current_user( self::$admin_id );
		$this->assertContains( 'duplicate-post', $this->get_action_ids( 'page' ) );
		$this->assertContains( 'duplicate-pattern', $this->get_action_ids( 'wp_block' ) );
		$this->assertContains( 'duplicate-template-part', $this->get_action_ids( 'wp_template_part' ) );

		wp_set_current_user( self::$editor_id );
		$this->assertContains( 'duplicate-post', $this->get_action_ids( 'page' ), 'Editors can create pages.' );
		$this->assertContains( 'duplicate-pattern', $this->get_action_ids( 'wp_block' ), 'Editors can create patterns.' );
		$this->assertNotContains( 'duplicate-template-part', $this->get_action_ids( 'wp_template_part' ), 'Editors cannot create template parts.' );

		wp_set_current_user( self::$contributor_id );
		$this->assertNotContains( 'duplicate-post', $this->get_action_ids( 'page' ), 'Contributors cannot create pages.' );
		$this->assertContains( 'duplicate-post', $this->get_action_ids( 'post' ), 'Contributors can create posts.' );
		$this->assertNotContains( 'duplicate-pattern', $this->get_action_ids( 'wp_block' ), 'Contributors cannot create patterns.' );
		$this->assertContains( 'export-pattern', $this->get_action_ids( 'wp_block' ), 'Contributors can export them.' );
	}

	/**
	 * The actions of a custom post type follow what it supports.
	 */
	public function test_the_actions_of_a_custom_post_type_follow_its_supports() {
		$this->register_post_type(
			'gutenberg_book',
			array(
				'public'       => true,
				'show_in_rest' => true,
				'supports'     => array( 'title', 'revisions' ),
			)
		);
		$this->register_post_type(
			'gutenberg_note',
			array(
				'show_ui'      => true,
				'show_in_rest' => true,
				'supports'     => array( 'editor' ),
			)
		);
		$this->register_post_type(
			'gutenberg_hidden',
			array(
				'public'       => true,
				'show_in_rest' => false,
			)
		);
		wp_set_current_user( self::$admin_id );

		$this->assertSame(
			array_merge( array( 'view-post', 'view-post-revisions', 'duplicate-post', 'rename-post' ), self::EVERY_POST_TYPE ),
			$this->get_action_ids( 'gutenberg_book' ),
			'A viewable post type with titles and revisions.'
		);
		$this->assertSame(
			array_merge( array( 'duplicate-post' ), self::EVERY_POST_TYPE ),
			$this->get_action_ids( 'gutenberg_note' ),
			'A post type that is not viewable, without titles or revisions.'
		);
		$this->assertSame( array(), $this->get_action_ids( 'gutenberg_hidden' ), 'A post type not exposed in the REST API has no action.' );
	}

	/**
	 * Setting the homepage or the posts page changes the site settings, so
	 * the actions of the `page` module are only registered for the users who
	 * can manage the site options.
	 */
	public function test_the_homepage_actions_depend_on_the_current_user() {
		wp_set_current_user( self::$admin_id );
		$this->assertSame( self::PAGE_ACTIONS, array_values( array_intersect( $this->get_action_ids( 'page' ), self::PAGE_ACTIONS ) ) );

		wp_set_current_user( self::$editor_id );
		$this->assertSame( array(), array_intersect( $this->get_action_ids( 'page' ), self::PAGE_ACTIONS ), 'Editors cannot manage the site options.' );
	}

	/**
	 * A `front-page` template shows on the front page whatever the site
	 * settings say, so the actions of the `page` module are not registered
	 * when the theme has one.
	 */
	public function test_the_homepage_actions_are_not_registered_with_a_front_page_template() {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );
		$this->assertContains( 'set-as-homepage', $this->get_action_ids( 'page' ), 'The theme has no `front-page` template.' );

		$template_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => 'front-page',
				'post_title'   => 'Front Page',
				'post_content' => '<!-- wp:paragraph --><p>Front page</p><!-- /wp:paragraph -->',
			)
		);
		wp_set_post_terms( $template_id, get_stylesheet(), 'wp_theme' );

		$this->assertSame( array(), array_intersect( $this->get_action_ids( 'page' ), self::PAGE_ACTIONS ) );
	}

	/**
	 * The definitions are the ones of the `action.php` files, with the id
	 * first.
	 */
	public function test_the_definitions_come_from_the_action_files() {
		wp_set_current_user( self::$admin_id );
		self::reset_registry();

		$actions = array_column( wp_get_registered_entity_actions( 'postType', 'page' ), null, 'id' );
		$this->assertSame(
			array(
				'id'                => 'move-to-trash',
				'label'             => 'Trash',
				'isPrimary'         => true,
				'supportsBulk'      => true,
				'hideModalHeader'   => true,
				'modalFocusOnMount' => 'firstContentElement',
				'origin'            => array( 'registeredBy' => 'core' ),
			),
			$actions['move-to-trash']
		);
		$this->assertSame(
			array(
				'id'      => 'view-post-revisions',
				'label'   => 'View revisions',
				'context' => 'list',
				'origin'  => array( 'registeredBy' => 'core' ),
			),
			$actions['view-post-revisions']
		);
	}

	/**
	 * The REST route serves the core actions of each post type, with their
	 * script modules, in a response that validates against its schema.
	 */
	public function test_the_rest_route_serves_the_core_actions() {
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );
		$schema = ( new Gutenberg_REST_Entity_Actions_Controller_7_2() )->get_item_schema();

		$modules = array(
			'page'             => array( self::POST_TYPE_SUPPORTS, self::PAGE ),
			'wp_block'         => array( self::POST_TYPE_SUPPORTS, self::WP_BLOCK ),
			'wp_template_part' => array( self::POST_TYPE_SUPPORTS, self::WP_TEMPLATE_PART ),
		);
		foreach ( $modules as $post_type => $module_ids ) {
			self::reset_registry();
			$request = new WP_REST_Request( 'GET', '/wp/v2/entity-actions' );
			$request->set_query_params(
				array(
					'kind' => 'postType',
					'name' => $post_type,
				)
			);
			$data = rest_get_server()->dispatch( $request )->get_data();

			$this->assertSame( array_column( wp_get_registered_entity_actions( 'postType', $post_type ), 'id' ), array_column( $data['actions'], 'id' ), "The actions of $post_type are served." );
			$this->assertSame( $module_ids, array_column( $data['script_modules'], 'id' ), 'So are their script modules.' );
			$this->assertTrue( rest_validate_value_from_schema( $data, $schema ), "The response for $post_type matches the schema." );
		}
	}

	/**
	 * A plugin hooking the action at the default priority can remove a core
	 * action, and replace one: it unregisters the action and registers its
	 * own definition with the script module of the core action, which keeps
	 * its JavaScript parts. The replaced action moves after the others.
	 */
	public function test_a_plugin_can_remove_and_replace_core_actions() {
		$callback = static function () {
			wp_unregister_entity_actions( 'postType', 'page', array( 'duplicate-post' ) );
			$trash = wp_unregister_entity_actions( 'postType', 'page', array( 'move-to-trash' ) );
			wp_register_entity_actions(
				'test-plugin',
				'postType',
				'page',
				array( array_merge( $trash[0], array( 'label' => 'Bin…' ) ) ),
				'@wordpress/core-actions/post_type_supports'
			);
		};
		add_action( 'wp_entity_actions_api_init', $callback );
		wp_set_current_user( self::$admin_id );

		$ids = array( 'view-post', 'view-post-revisions', 'rename-post', 'order-pages', 'restore', 'reset-post', 'delete-post', 'permanently-delete' );
		$this->assertSame( array_merge( $ids, self::PAGE_ACTIONS, array( 'move-to-trash' ) ), $this->get_action_ids( 'page' ) );
		$this->assertSame(
			array(
				self::POST_TYPE_SUPPORTS => array_merge( $ids, array( 'move-to-trash' ) ),
				self::PAGE               => self::PAGE_ACTIONS,
			),
			array_column( wp_get_registered_entity_action_modules( 'postType', 'page' ), 'actions', 'id' )
		);

		$actions = array_column( wp_get_registered_entity_actions( 'postType', 'page' ), null, 'id' );
		$this->assertSame( 'Bin…', $actions['move-to-trash']['label'] );
		$this->assertSame( 'test-plugin', $actions['move-to-trash']['origin']['registeredBy'] );
		$this->assertTrue( $actions['move-to-trash']['isPrimary'], 'The rest of the core definition is kept.' );
	}
}
