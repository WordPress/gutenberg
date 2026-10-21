<?php
/**
 * Tests for the integration of the extensible site editor experiment.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_unregister_extensible_site_editor_edit_post_action
 */
class Tests_Extensible_Site_Editor extends WP_UnitTestCase {

	/**
	 * Administrator user id.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Loads the integration, which is only loaded while the experiment is
	 * enabled, without its hooks, so the other tests run without them.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );

		if ( ! function_exists( 'gutenberg_unregister_extensible_site_editor_edit_post_action' ) ) {
			require_once dirname( __DIR__, 2 ) . '/lib/experimental/extensible-site-editor.php';
			remove_action( 'admin_menu', 'gutenberg_redirect_to_extensible_site_editor', 100 );
			remove_action( 'wp_entity_actions_api_init', 'gutenberg_unregister_extensible_site_editor_edit_post_action' );
		}
	}

	/**
	 * Deletes the shared user.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	/**
	 * Resets the registry after each test, so the next read fires
	 * `wp_entity_actions_api_init` again without the hooks of the test.
	 */
	public function tear_down() {
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
	 * Returns the ids of the actions registered for pages, from a registry
	 * built anew, as each request builds it.
	 *
	 * @return string[] The ids of the actions, in registration order.
	 */
	private function get_page_action_ids() {
		self::reset_registry();
		return array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'id' );
	}

	/**
	 * The lists of the extensible site editor open a page on click, and do
	 * not handle the "Edit" action, so the experiment unregisters it and
	 * keeps the other actions of pages.
	 */
	public function test_the_edit_action_of_pages_is_unregistered() {
		// The test case restores the hooks after the test.
		remove_action( 'wp_entity_actions_api_init', 'gutenberg_unregister_extensible_site_editor_edit_post_action' );
		wp_set_current_user( self::$admin_id );
		$ids = $this->get_page_action_ids();
		$this->assertContains( 'edit-post', $ids, 'Core registers the action.' );

		add_action( 'wp_entity_actions_api_init', 'gutenberg_unregister_extensible_site_editor_edit_post_action' );

		$this->assertSame( array_values( array_diff( $ids, array( 'edit-post' ) ) ), $this->get_page_action_ids() );
		$this->assertNotContains(
			'edit-post',
			array_merge( ...array_values( wp_get_registered_entity_action_modules( 'postType', 'page' ) ) ),
			'No script module applies to it.'
		);
	}
}
