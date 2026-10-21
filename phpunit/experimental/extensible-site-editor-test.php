<?php
/**
 * Tests for the integration of the extensible site editor experiment.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_unregister_extensible_site_editor_entity_actions
 */
class Tests_Extensible_Site_Editor extends WP_UnitTestCase {

	/**
	 * The priority the experiment hooks the unregistering of the actions at,
	 * or false when it does not hook it.
	 *
	 * @var int|false
	 */
	private static $priority;

	/**
	 * Administrator user id.
	 *
	 * @var int
	 */
	private static $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );

		// The experiment is only loaded while it is enabled. When the test
		// loads it, it unhooks it so the other tests see the core actions,
		// and each test hooks it again: the test case restores the hooks
		// after each test.
		if ( function_exists( 'gutenberg_unregister_extensible_site_editor_entity_actions' ) ) {
			self::$priority = has_action( 'wp_entity_actions_api_init', 'gutenberg_unregister_extensible_site_editor_entity_actions' );
			return;
		}
		require_once dirname( __DIR__, 2 ) . '/lib/experimental/extensible-site-editor.php';
		self::$priority = has_action( 'wp_entity_actions_api_init', 'gutenberg_unregister_extensible_site_editor_entity_actions' );
		remove_action( 'admin_menu', 'gutenberg_redirect_to_extensible_site_editor', 100 );
		remove_action( 'wp_entity_actions_api_init', 'gutenberg_unregister_extensible_site_editor_entity_actions', self::$priority );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function tear_down() {
		self::reset_registry();
		parent::tear_down();
	}

	/**
	 * Resets the entity actions registry, so its next read fires
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
	 * Returns the ids of the actions registered for pages, from a registry
	 * built anew.
	 *
	 * @return string[] The ids of the actions.
	 */
	private function get_page_action_ids() {
		self::reset_registry();
		return array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'id' );
	}

	/**
	 * The extensible site editor sets no entity navigator, so it removes the
	 * "Edit" action of pages, after core registers it at priority 0.
	 */
	public function test_the_edit_action_of_pages_is_unregistered() {
		$this->assertSame( 10, self::$priority, 'The actions are unregistered at the default priority.' );

		wp_set_current_user( self::$admin_id );
		remove_action( 'wp_entity_actions_api_init', 'gutenberg_unregister_extensible_site_editor_entity_actions', self::$priority );
		$without_experiment = $this->get_page_action_ids();
		$this->assertContains( 'edit-post', $without_experiment, 'Core registers the action.' );

		add_action( 'wp_entity_actions_api_init', 'gutenberg_unregister_extensible_site_editor_entity_actions', self::$priority );
		$this->assertSame(
			array_values( array_diff( $without_experiment, array( 'edit-post' ) ) ),
			$this->get_page_action_ids(),
			'The experiment only removes the edit action.'
		);
	}
}
