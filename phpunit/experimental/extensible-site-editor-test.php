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
	 * Returns the ids of the actions registered for a post type, from a
	 * registry built anew, as each request builds it.
	 *
	 * @param string $post_type The post type.
	 * @return string[] The ids of the actions, in registration order.
	 */
	private function get_action_ids( $post_type ) {
		self::reset_registry();
		return array_column( wp_get_registered_entity_actions( 'postType', $post_type ), 'id' );
	}

	/**
	 * The lists of the extensible site editor open an item on click, and do
	 * not handle the "Edit" action, so the experiment unregisters it and
	 * keeps the other actions.
	 */
	public function test_the_edit_action_is_unregistered() {
		$post_types = array( 'page', 'wp_template', 'wp_template_part', 'wp_block' );
		// The test case restores the hooks after the test.
		remove_action( 'wp_entity_actions_api_init', 'gutenberg_unregister_extensible_site_editor_edit_post_action' );
		wp_set_current_user( self::$admin_id );
		switch_theme( 'block-theme' );
		$ids = array();
		foreach ( $post_types as $post_type ) {
			$ids[ $post_type ] = $this->get_action_ids( $post_type );
			$this->assertContains( 'edit-post', $ids[ $post_type ], "Core registers the action for $post_type." );
		}

		add_action( 'wp_entity_actions_api_init', 'gutenberg_unregister_extensible_site_editor_edit_post_action' );

		foreach ( $post_types as $post_type ) {
			$this->assertSame( array_values( array_diff( $ids[ $post_type ], array( 'edit-post' ) ) ), $this->get_action_ids( $post_type ), "The other actions of $post_type are kept." );
			$this->assertNotContains(
				'edit-post',
				array_merge( ...array_values( wp_get_registered_entity_action_modules( 'postType', $post_type ) ) ),
				'No script module applies to it.'
			);
		}
	}
}
