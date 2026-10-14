<?php
/**
 * Tests for the entity actions API.
 *
 * @package gutenberg
 *
 * @covers ::_wp_add_entity_action_modules_to_editor_script
 * @covers ::_wp_preload_entity_actions
 * @covers ::wp_register_entity_actions
 * @covers ::wp_unregister_entity_actions
 * @covers ::gutenberg_override_wp_entity_actions_registry
 * @covers WP_Entity_Actions_Registry::initialize
 * @covers WP_Entity_Actions_Registry::register
 * @covers WP_Entity_Actions_Registry::unregister
 * @covers WP_Entity_Actions_Registry_Gutenberg::get_instance
 */
class Tests_Entity_Actions_API extends WP_UnitTestCase {

	/**
	 * Sets up each test: the default actions of the tests are registered at
	 * priority 0, so every test runs against a registry holding actions
	 * registered before the callbacks hooked at the default priority run.
	 */
	public function set_up() {
		parent::set_up();
		add_action( 'wp_entity_actions_api_init', array( __CLASS__, 'register_default_actions' ), 0 );
	}

	/**
	 * Tears down each test.
	 *
	 * Resetting the registry drops the actions a test registered along with
	 * the defaults; the next read fires `wp_entity_actions_api_init` again and
	 * registers the defaults anew. The test case removes the callbacks the
	 * test hooked, the defaults included.
	 */
	public function tear_down() {
		self::reset_registry();

		parent::tear_down();
	}

	/**
	 * Registers the default actions of the tests, with the `core` origin: the
	 * rename and trash actions of pages, with a script module.
	 */
	public static function register_default_actions() {
		wp_register_entity_actions(
			'core',
			'postType',
			'page',
			array(
				array(
					'id'    => 'rename-post',
					'label' => 'Rename…',
				),
				array(
					'id'        => 'move-to-trash',
					'label'     => 'Trash…',
					'isPrimary' => true,
				),
			),
			'core/defaults'
		);
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
	 * Hooks a callback to `wp_entity_actions_api_init` for the duration of the test
	 * and fires the action anew, so the registry reflects it right away.
	 *
	 * Registering and unregistering only run on the action, so this is how a
	 * test alters the registry, as a plugin does. The registry is reset and
	 * read, which fires the action: the defaults are registered again and
	 * the callbacks hooked so far replay, in order.
	 *
	 * @param callable $callback The callback.
	 * @param int      $priority The priority. Default 10, after the defaults.
	 */
	private function on_entity_actions_api_init( $callback, $priority = 10 ) {
		add_action( 'wp_entity_actions_api_init', $callback, $priority );

		self::reset_registry();
		WP_Entity_Actions_Registry::get_instance()->get_all_registered();
	}

	/**
	 * Unregisters the actions of every entity with a script module, so a
	 * test can start from a registry without modules. The registry is reset
	 * on tear down.
	 */
	private function unregister_all_action_modules() {
		$this->on_entity_actions_api_init(
			static function () {
				foreach ( wp_get_all_registered_entity_action_modules() as $kind => $entities ) {
					foreach ( array_keys( $entities ) as $name ) {
						wp_unregister_entity_actions( $kind, $name );
					}
				}
			}
		);
	}

	/**
	 * Returns the module ids among the module dependencies of a script.
	 *
	 * @param WP_Scripts $scripts The scripts registry.
	 * @param string     $handle  The script handle.
	 * @return string[] The module ids, in order.
	 */
	private function get_module_dependency_ids( WP_Scripts $scripts, $handle ) {
		$dependencies = $scripts->get_data( $handle, 'module_dependencies' );
		return array_map(
			static function ( $dependency ) {
				return is_array( $dependency ) ? $dependency['id'] : $dependency;
			},
			is_array( $dependencies ) ? $dependencies : array()
		);
	}

	/**
	 * Registers actions on `wp_entity_actions_api_init` for the duration of the test,
	 * with the `test-plugin` origin: the registry is reset on tear down.
	 *
	 * @param string      $kind    The entity kind.
	 * @param string      $name    The entity name.
	 * @param array[]     $actions The action definitions.
	 * @param string|null $module  The script module id, if any.
	 * @return string[] The ids of the actions registered.
	 */
	private function register_actions( $kind, $name, $actions, $module = null ) {
		$registered = array();
		$this->on_entity_actions_api_init(
			static function () use ( &$registered, $kind, $name, $actions, $module ) {
				$registered = wp_register_entity_actions( 'test-plugin', $kind, $name, $actions, $module );
			}
		);
		return $registered;
	}

	/**
	 * Builds a minimal action definition.
	 *
	 * @param string $id The action id.
	 * @return array The action definition.
	 */
	private function action( $id ) {
		return array(
			'id'    => $id,
			'label' => $id,
		);
	}

	/**
	 * Records the messages of the notices a method reports with
	 * _doing_it_wrong(), for the rest of the test.
	 *
	 * @param string $method The method, e.g. `WP_Entity_Actions_Registry::register`.
	 * @return string[] The messages, filled as the notices are reported.
	 */
	private function &record_notices( $method ) {
		$reported = array();
		add_action(
			'doing_it_wrong_run',
			static function ( $function_name, $message ) use ( &$reported, $method ) {
				if ( $method === $function_name ) {
					$reported[] = $message;
				}
			},
			10,
			2
		);

		return $reported;
	}

	/**
	 * The modules are added on `admin_footer`, which fires before the import
	 * map is printed, both in the admin template and in the pages rendered
	 * outside it.
	 */
	public function test_the_modules_are_added_on_admin_footer() {
		$this->assertSame( 10, has_action( 'admin_footer', '_wp_add_entity_action_modules_to_editor_script' ) );
	}

	/**
	 * A page that registers the editor script without loading it is left
	 * untouched, and the registry is not read.
	 */
	public function test_nothing_happens_when_the_editor_script_is_not_enqueued() {
		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );

		$fired = did_action( 'wp_entity_actions_api_init' );
		self::reset_registry();
		_wp_add_entity_action_modules_to_editor_script( $scripts );

		$this->assertSame( array(), $scripts->get_data( 'wp-editor', 'module_dependencies' ) );
		$this->assertSame( $fired, did_action( 'wp_entity_actions_api_init' ), 'The registry is not read.' );
	}

	/**
	 * The modules are added when the editor script is only a dependency of
	 * the scripts the page enqueues, as on the pages booted by
	 * `@wordpress/boot`.
	 */
	public function test_the_modules_are_added_when_the_editor_script_is_a_dependency() {
		$this->unregister_all_action_modules();
		$this->register_actions( 'postType', 'page', array( $this->action( 'feature' ) ), 'plugin/feature' );

		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );
		$scripts->add( 'boot', '/boot.js', array( 'wp-editor' ) );
		$scripts->enqueue( 'boot' );
		_wp_add_entity_action_modules_to_editor_script( $scripts );

		$this->assertSame( array( 'plugin/feature' ), $this->get_module_dependency_ids( $scripts, 'wp-editor' ) );
	}

	/**
	 * A scripts registry without the editor script is left untouched, even
	 * when action script modules are registered.
	 */
	public function test_nothing_happens_without_the_editor_script() {
		$this->register_actions( 'postType', 'page', array( $this->action( 'feature' ) ), 'plugin/feature' );

		$scripts = new WP_Scripts();
		// The default scripts register the real editor script.
		$scripts->remove( 'wp-editor' );
		_wp_add_entity_action_modules_to_editor_script( $scripts );

		$this->assertFalse( $scripts->query( 'wp-editor', 'registered' ) );
		$this->assertFalse( $scripts->get_data( 'wp-editor', 'module_dependencies' ) );
	}

	/**
	 * The dependencies of the editor script stay untouched when no entity has
	 * a script module registered.
	 */
	public function test_nothing_happens_without_registered_action_modules() {
		$this->unregister_all_action_modules();
		$this->assertSame( array(), wp_get_all_registered_entity_action_modules(), 'No action script module is registered.' );

		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->enqueue( 'wp-editor' );
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );
		_wp_add_entity_action_modules_to_editor_script( $scripts );

		$this->assertSame( array(), $scripts->get_data( 'wp-editor', 'module_dependencies' ) );
	}

	/**
	 * The script module of an action becomes a dynamic dependency of the
	 * editor script.
	 */
	public function test_action_script_modules_become_dynamic_dependencies_of_the_editor_script() {
		$this->unregister_all_action_modules();
		$this->register_actions( 'postType', 'page', array( $this->action( 'feature' ) ), 'plugin/feature' );

		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->enqueue( 'wp-editor' );
		// Only the dependencies added by the function are of interest.
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );
		_wp_add_entity_action_modules_to_editor_script( $scripts );

		$this->assertSame(
			array(
				array(
					'id'     => 'plugin/feature',
					'import' => 'dynamic',
				),
			),
			$scripts->get_data( 'wp-editor', 'module_dependencies' )
		);
	}

	/**
	 * The dependencies already declared are kept, and the modules are added
	 * once: a second run adds nothing.
	 */
	public function test_declared_dependencies_are_kept_and_modules_are_added_once() {
		$this->register_actions( 'postType', 'page', array( $this->action( 'feature' ) ), 'plugin/feature' );

		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->enqueue( 'wp-editor' );
		$scripts->add_data( 'wp-editor', 'module_dependencies', array( '@wordpress/existing' ) );

		_wp_add_entity_action_modules_to_editor_script( $scripts );
		$dependencies = $scripts->get_data( 'wp-editor', 'module_dependencies' );
		_wp_add_entity_action_modules_to_editor_script( $scripts );

		$this->assertSame( $dependencies, $scripts->get_data( 'wp-editor', 'module_dependencies' ), 'A second run adds nothing.' );
		$ids = $this->get_module_dependency_ids( $scripts, 'wp-editor' );
		$this->assertSame( '@wordpress/existing', $ids[0], 'The declared dependency is kept first.' );
		$this->assertSame( 1, count( array_keys( $ids, 'plugin/feature', true ) ), 'The module is declared once.' );
		$this->assertContains(
			array(
				'id'     => 'plugin/feature',
				'import' => 'dynamic',
			),
			$dependencies
		);
	}

	/**
	 * A module registered for several entities is declared once.
	 */
	public function test_a_module_shared_by_several_entities_is_declared_once() {
		$this->register_actions( 'postType', 'page', array( $this->action( 'feature' ) ), 'plugin/actions' );
		$this->register_actions( 'postType', 'post', array( $this->action( 'feature' ) ), 'plugin/actions' );

		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->enqueue( 'wp-editor' );
		// Only the dependencies added by the function are of interest.
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );
		_wp_add_entity_action_modules_to_editor_script( $scripts );

		$ids = $this->get_module_dependency_ids( $scripts, 'wp-editor' );
		$this->assertSame( array( 'plugin/actions' ), array_values( array_intersect( $ids, array( 'plugin/actions' ) ) ) );
	}

	/**
	 * The script modules of the actions reach the import map of a page that
	 * loads the editor script.
	 */
	public function test_action_script_modules_reach_the_import_map() {
		global $wp_scripts;
		$original_scripts = $wp_scripts;
		$wp_scripts       = new WP_Scripts();

		try {
			// Only the test module is of interest: the built modules may not be
			// registered in the test environment.
			$this->unregister_all_action_modules();
			$this->register_actions( 'postType', 'page', array( $this->action( 'feature' ) ), 'plugin/feature' );
			$wp_scripts->add( 'wp-editor', '/editor.js' );
			wp_register_script_module( 'plugin/feature', '/feature.js' );

			$wp_scripts->enqueue( 'wp-editor' );
			_wp_add_entity_action_modules_to_editor_script( $wp_scripts );

			$processor = new WP_HTML_Tag_Processor( get_echo( array( wp_script_modules(), 'print_import_map' ) ) );
			$this->assertTrue( $processor->next_tag( 'SCRIPT' ), 'An import map is printed.' );
			$this->assertSame( 'importmap', $processor->get_attribute( 'type' ) );
			$import_map = json_decode( $processor->get_modifiable_text(), true );
		} finally {
			$wp_scripts = $original_scripts;
			wp_deregister_script_module( 'plugin/feature' );
		}

		$this->assertArrayHasKey( 'plugin/feature', $import_map['imports'] );
	}

	/**
	 * The post editor preloads the actions of the post type it edits, with
	 * the path the `getEntityActionsConfig` resolver of core data requests.
	 */
	public function test_the_post_editor_preloads_the_actions_of_the_post_type() {
		$context = new WP_Block_Editor_Context( array( 'post' => self::factory()->post->create_and_get( array( 'post_type' => 'page' ) ) ) );

		$paths = apply_filters( 'block_editor_rest_api_preload_paths', array(), $context );

		$this->assertContains( '/wp/v2/entity-actions?kind=postType&name=page', $paths );
	}

	/**
	 * The preloaded path serves the actions of the post type.
	 */
	public function test_the_preloaded_actions_path_serves_the_actions() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$context = new WP_Block_Editor_Context( array( 'post' => self::factory()->post->create_and_get( array( 'post_type' => 'page' ) ) ) );

		$paths     = _wp_preload_entity_actions( array(), $context );
		$preloaded = array_reduce( $paths, 'rest_preload_api_request', array() );

		$this->assertSame(
			array( 'rename-post', 'move-to-trash' ),
			array_column( $preloaded['/wp/v2/entity-actions?kind=postType&name=page']['body']['actions'], 'id' )
		);
	}

	/**
	 * Only the post editor preloads the actions: the other editors have no
	 * post type of their own.
	 */
	public function test_other_editors_do_not_preload_the_actions() {
		$context = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );

		$this->assertSame( array( '/wp/v2/types' ), _wp_preload_entity_actions( array( '/wp/v2/types' ), $context ) );
	}

	/**
	 * Reading the registry fires `wp_entity_actions_api_init` once, whichever
	 * getter is read first and however many times it is read.
	 */
	public function test_reading_the_registry_fires_the_action_once() {
		self::reset_registry();
		$registry = WP_Entity_Actions_Registry::get_instance();
		$fired    = did_action( 'wp_entity_actions_api_init' );

		wp_get_registered_entity_actions( 'postType', 'page' );
		$this->assertSame( $fired + 1, did_action( 'wp_entity_actions_api_init' ), 'The first read fires the action.' );

		wp_get_registered_entity_actions( 'postType', 'post' );
		wp_get_registered_entity_action_modules( 'postType', 'page' );
		wp_get_all_registered_entity_action_modules();
		$registry->get_all_registered();
		$this->assertSame( $fired + 1, did_action( 'wp_entity_actions_api_init' ), 'Further reads do not fire it again.' );
	}

	/**
	 * Firing the action again once the registry has been read does not reopen
	 * it: the registrations made then are refused.
	 */
	public function test_firing_the_action_again_does_not_reopen_the_registry() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::register' );
		$actions = wp_get_registered_entity_actions( 'postType', 'page' );
		add_action(
			'wp_entity_actions_api_init',
			function () {
				wp_register_entity_actions( 'test-plugin', 'postType', 'page', array( $this->action( 'late' ) ) );
			}
		);

		do_action( 'wp_entity_actions_api_init' );

		$this->assertSame( $actions, wp_get_registered_entity_actions( 'postType', 'page' ) );
	}

	/**
	 * The plugin registry replaces the core one on `init`, so every reader
	 * of `WP_Entity_Actions_Registry::get_instance()`, the functions included, gets
	 * the plugin one, holding whatever the core one held.
	 */
	public function test_the_plugin_registry_replaces_the_core_one() {
		$this->assertSame( 1, has_action( 'init', 'gutenberg_override_wp_entity_actions_registry' ) );

		$instance = new ReflectionProperty( WP_Entity_Actions_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
		$core_registry = WP_Entity_Actions_Registry::get_instance();
		$this->assertNotInstanceOf( WP_Entity_Actions_Registry_Gutenberg::class, $core_registry, 'Until the plugin replaces it, core creates its own registry.' );
		$actions = wp_get_registered_entity_actions( 'postType', 'page' );
		$modules = wp_get_registered_entity_action_modules( 'postType', 'page' );
		$fired   = did_action( 'wp_entity_actions_api_init' );
		$this->assertNotEmpty( $actions, 'The defaults are registered on the core registry.' );

		gutenberg_override_wp_entity_actions_registry();

		$registry = WP_Entity_Actions_Registry::get_instance();
		$this->assertInstanceOf( WP_Entity_Actions_Registry_Gutenberg::class, $registry );
		$this->assertSame( $registry, WP_Entity_Actions_Registry_Gutenberg::get_instance(), 'Both getters share the instance.' );
		$this->assertSame( $actions, wp_get_registered_entity_actions( 'postType', 'page' ), 'The actions of the core registry are handed over.' );
		$this->assertSame( $modules, wp_get_registered_entity_action_modules( 'postType', 'page' ), 'So are their script modules.' );
		$this->assertSame( $fired, did_action( 'wp_entity_actions_api_init' ), 'The action does not fire again.' );
	}

	/**
	 * A plugin hooking the action at the default priority sees the defaults:
	 * it can remove a default action, or replace it by unregistering it and
	 * registering it again with the script module of the default, which keeps
	 * its JavaScript parts.
	 */
	public function test_a_callback_at_the_default_priority_alters_the_defaults() {
		$callback = static function () {
			wp_unregister_entity_actions( 'postType', 'page', array( 'rename-post' ) );
			wp_unregister_entity_actions( 'postType', 'page', array( 'move-to-trash' ) );
			wp_register_entity_actions(
				'test-plugin',
				'postType',
				'page',
				array(
					array(
						'id'        => 'move-to-trash',
						'label'     => 'Trash…',
						'isPrimary' => false,
					),
				),
				'core/defaults'
			);
		};
		add_action( 'wp_entity_actions_api_init', $callback );

		self::reset_registry();
		$actions = wp_get_registered_entity_actions( 'postType', 'page' );
		$modules = wp_get_registered_entity_action_modules( 'postType', 'page' );

		$this->assertSame(
			array(
				array(
					'id'        => 'move-to-trash',
					'label'     => 'Trash…',
					'isPrimary' => false,
					'origin'    => array( 'registeredBy' => 'test-plugin' ),
				),
			),
			$actions,
			'The removed action is gone, and the replaced one has the new definition and origin.'
		);
		$this->assertSame( array( 'core/defaults' => array( 'move-to-trash' ) ), $modules, 'The replaced action keeps the script module of the default.' );
	}

	/**
	 * The origin an action is registered with is stored on its definition,
	 * over any `origin` the definition sets; the default actions come from
	 * `core`.
	 */
	public function test_actions_carry_the_origin_they_are_registered_with() {
		$this->register_actions( 'postType', 'page', array( $this->action( 'feature' ) + array( 'origin' => 'spoofed' ) ) );

		$actions = array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'origin', 'id' );
		$this->assertSame( array( 'registeredBy' => 'test-plugin' ), $actions['feature'] );
		$this->assertSame( array( 'registeredBy' => 'core' ), $actions['rename-post'] );
	}

	/**
	 * An action can only be registered once: an action with the id of a
	 * registered action is skipped and leaves it untouched, and the rest of
	 * the actions of the call are registered.
	 */
	public function test_registering_a_registered_action_is_skipped() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::register' );
		$reported   = &$this->record_notices( 'WP_Entity_Actions_Registry::register' );
		$registered = $this->register_actions(
			'postType',
			'page',
			array(
				$this->action( 'feature' ),
				array(
					'id'    => 'rename-post',
					'label' => 'Retitle…',
				),
			),
			'plugin/actions'
		);

		$this->assertSame( array( 'feature' ), $registered, 'The ids of the actions registered are returned.' );
		$actions = array_column( wp_get_registered_entity_actions( 'postType', 'page' ), null, 'id' );
		$this->assertArrayHasKey( 'feature', $actions, 'The rest of the actions of the call are registered.' );
		$this->assertSame( 'Rename…', $actions['rename-post']['label'], 'The registered action is left untouched.' );
		$this->assertSame( 'core', $actions['rename-post']['origin']['registeredBy'] );
		$this->assertSame( array( 'feature' ), wp_get_registered_entity_action_modules( 'postType', 'page' )['plugin/actions'], 'The script module only applies to the actions registered.' );
		$this->assertCount( 1, $reported );
		$this->assertStringContainsString( 'postType "page"', $reported[0], 'The notice names the entity.' );
		$this->assertStringContainsString( 'already registered: rename-post', $reported[0], 'The notice names the action that is already registered, not the others of the call.' );
	}

	/**
	 * A `context` or `modalSize` DataViews does not support is reported, and
	 * registered anyway. A property only a script module can provide is
	 * reported and removed. The other actions of the call are not reported.
	 */
	public function test_registering_an_action_with_invalid_values_is_reported() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::register' );
		$reported   = &$this->record_notices( 'WP_Entity_Actions_Registry::register' );
		$registered = $this->register_actions(
			'postType',
			'page',
			array(
				$this->action( 'feature' ),
				array(
					'id'         => 'archive',
					'label'      => 'Archive',
					'context'    => 'lists',
					'isEligible' => true,
				),
				array(
					'id'        => 'export',
					'label'     => 'Export',
					'modalSize' => 'huge',
				),
			)
		);

		$this->assertSame( array( 'feature', 'archive', 'export' ), $registered, 'The actions are registered anyway.' );
		$actions = array_column( wp_get_registered_entity_actions( 'postType', 'page' ), null, 'id' );
		$this->assertSame( 'lists', $actions['archive']['context'], 'A value DataViews does not support is kept.' );
		$this->assertSame( 'huge', $actions['export']['modalSize'], 'A value DataViews does not support is kept.' );
		$this->assertArrayNotHasKey( 'isEligible', $actions['archive'], 'A property only a script module can provide is removed.' );
		$this->assertCount( 1, $reported );
		$this->assertStringContainsString( 'postType "page"', $reported[0], 'The notice names the entity.' );
		$this->assertStringContainsString( ': archive (context is not one of list and single.)', $reported[0], 'The notice names the action and its value DataViews does not support.' );
		$this->assertStringContainsString( 'archive (isEligible can only come from a script module', $reported[0], 'The notice names the property that is removed.' );
		$this->assertStringContainsString( 'export (modalSize is not one of small, medium, large, and fill.)', $reported[0], 'The notice names every value DataViews does not support.' );
		$this->assertStringNotContainsString( 'feature', $reported[0], 'The other actions of the call are not reported.' );
	}

	/**
	 * An id that appears more than once in a call is registered once, with
	 * its first definition, and the rest of the actions of the call are
	 * registered.
	 */
	public function test_registering_the_same_action_twice_keeps_the_first_definition() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::register' );
		$reported   = &$this->record_notices( 'WP_Entity_Actions_Registry::register' );
		$registered = $this->register_actions(
			'postType',
			'page',
			array(
				$this->action( 'feature' ),
				array(
					'id'    => 'feature',
					'label' => 'Highlight',
				),
				$this->action( 'archive' ),
			)
		);

		$this->assertSame( array( 'feature', 'archive' ), $registered );
		$actions = array_column( wp_get_registered_entity_actions( 'postType', 'page' ), null, 'id' );
		$this->assertSame( 'feature', $actions['feature']['label'], 'The first definition is kept.' );
		$this->assertArrayHasKey( 'archive', $actions, 'The rest of the actions of the call are registered.' );
		$this->assertCount( 1, $reported );
		$this->assertStringContainsString( 'postType "page"', $reported[0], 'The notice names the entity.' );
		$this->assertStringContainsString( 'more than once in the same call: feature', $reported[0], 'The notice names the duplicated action.' );
	}

	/**
	 * The actions of an entity keep their registration order: the order the
	 * client shows them in.
	 */
	public function test_actions_keep_their_registration_order() {
		$this->register_actions( 'postType', 'page', array( $this->action( 'feature' ), $this->action( 'archive' ) ), 'plugin/actions' );
		$this->register_actions( 'postType', 'page', array( $this->action( 'share' ) ), 'other-plugin/actions' );

		$this->assertSame(
			array( 'rename-post', 'move-to-trash', 'feature', 'archive', 'share' ),
			array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'id' )
		);
		$this->assertSame(
			array(
				'core/defaults'        => array( 'rename-post', 'move-to-trash' ),
				'plugin/actions'       => array( 'feature', 'archive' ),
				'other-plugin/actions' => array( 'share' ),
			),
			wp_get_registered_entity_action_modules( 'postType', 'page' ),
			'Each module applies to the actions it was registered with, in registration order.'
		);
	}

	/**
	 * Entities are told apart by their kind and name, not by a key joining
	 * them: `a/b` + `c` and `a` + `b/c` are two entities, whose actions and
	 * script modules do not mix.
	 */
	public function test_entities_whose_kind_and_name_join_alike_are_kept_apart() {
		$result = array();
		$this->on_entity_actions_api_init(
			function () use ( &$result ) {
				$result['first']        = wp_register_entity_actions( 'test-plugin', 'a/b', 'c', array( $this->action( 'feature' ) ), 'plugin/first' );
				$result['second']       = wp_register_entity_actions( 'test-plugin', 'a', 'b/c', array( $this->action( 'feature' ), $this->action( 'archive' ) ), 'plugin/second' );
				$result['unregistered'] = wp_unregister_entity_actions( 'a/b', 'c' );
			}
		);

		$this->assertSame( array( 'feature' ), $result['first'], 'The first entity registers its action.' );
		$this->assertSame( array( 'feature', 'archive' ), $result['second'], 'The second entity registers an action with the same id.' );
		$this->assertSame( array( 'feature' ), array_column( $result['unregistered'], 'id' ), 'Unregistering the first entity only removes its own action.' );
		$this->assertSame( array(), wp_get_registered_entity_actions( 'a/b', 'c' ) );
		$this->assertSame( array( 'feature', 'archive' ), array_column( wp_get_registered_entity_actions( 'a', 'b/c' ), 'id' ), 'The second entity keeps its actions.' );
		$this->assertSame( array( 'plugin/second' => array( 'feature', 'archive' ) ), wp_get_registered_entity_action_modules( 'a', 'b/c' ), 'The second entity keeps only its own module.' );
		$this->assertSame( array( 'b/c' => array( 'plugin/second' ) ), wp_get_all_registered_entity_action_modules()['a'], 'Only the second entity has modules under its kind.' );
		$this->assertArrayNotHasKey( 'a/b', wp_get_all_registered_entity_action_modules(), 'The kind of the first entity, emptied, is forgotten.' );
	}

	/**
	 * Unregistering returns the definitions it removes, in registration
	 * order and with their origin, whatever the order of the ids asked for;
	 * ids not registered are ignored, and nothing is returned when none is.
	 * A module left without actions is forgotten.
	 */
	public function test_unregistering_returns_the_unregistered_actions() {
		$unregistered = array();
		$modules      = array();
		$this->on_entity_actions_api_init(
			function () use ( &$unregistered, &$modules ) {
				wp_register_entity_actions( 'test-plugin', 'test', 'entity', array( $this->action( 'a' ), $this->action( 'b' ) ), 'plugin/first' );
				wp_register_entity_actions( 'test-plugin', 'test', 'entity', array( $this->action( 'c' ) ), 'plugin/second' );
				$unregistered['by_id']   = wp_unregister_entity_actions( 'test', 'entity', array( 'c', 'missing', 'a' ) );
				$modules['by_id']        = wp_get_registered_entity_action_modules( 'test', 'entity' );
				$unregistered['missing'] = wp_unregister_entity_actions( 'test', 'entity', array( 'a' ) );
				$unregistered['every']   = wp_unregister_entity_actions( 'test', 'entity' );
				$unregistered['empty']   = wp_unregister_entity_actions( 'test', 'entity' );
			}
		);

		$origin = array( 'registeredBy' => 'test-plugin' );
		$this->assertSame(
			array(
				array_merge( $this->action( 'a' ), array( 'origin' => $origin ) ),
				array_merge( $this->action( 'c' ), array( 'origin' => $origin ) ),
			),
			$unregistered['by_id'],
			'The actions unregistered by id are returned in registration order.'
		);
		$this->assertSame( array( 'plugin/first' => array( 'b' ) ), $modules['by_id'], 'The unregistered actions leave their modules, and an emptied module is forgotten.' );
		$this->assertSame( array(), $unregistered['missing'], 'Nothing is returned when no action is registered.' );
		$this->assertSame(
			array( array_merge( $this->action( 'b' ), array( 'origin' => $origin ) ) ),
			$unregistered['every'],
			'Unregistering every action returns them all.'
		);
		$this->assertSame( array(), $unregistered['empty'], 'Nothing is returned for an entity without actions.' );
		$this->assertSame( array(), wp_get_registered_entity_actions( 'test', 'entity' ), 'The entity has no actions left.' );
		$this->assertArrayNotHasKey( 'test', wp_get_all_registered_entity_action_modules(), 'The entity has no script module left.' );
	}

	/**
	 * A definition that is not an array with a non-empty string `id` is
	 * reported by its position and skipped, like a duplicated action: the
	 * rest of the actions of the call are registered.
	 */
	public function test_an_invalid_definition_is_skipped() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::register' );
		$reported   = &$this->record_notices( 'WP_Entity_Actions_Registry::register' );
		$registered = $this->register_actions(
			'postType',
			'page',
			array(
				$this->action( 'feature' ),
				'archive',
				array( 'label' => 'No id' ),
				array(
					'id'    => 7,
					'label' => 'Numeric id',
				),
				$this->action( 'share' ),
				$this->action( '0' ),
			)
		);

		$this->assertSame( array( 'feature', 'share', '0' ), $registered, 'The valid definitions are registered, `0` included.' );
		$this->assertCount( 1, $reported );
		$this->assertStringContainsString( 'postType "page"', $reported[0], 'The notice names the entity.' );
		$this->assertStringContainsString( 'skipped: #2, #3, #4.', $reported[0], 'The notice names the positions of the invalid definitions.' );
		$this->assertStringContainsString( 'The rest of the actions of the call are stored.', $reported[0] );
	}

	/**
	 * A call whose definitions are all invalid registers nothing, and its
	 * notice does not mention the rest of the call.
	 */
	public function test_a_call_with_only_invalid_definitions_registers_nothing() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::register' );
		$reported   = &$this->record_notices( 'WP_Entity_Actions_Registry::register' );
		$registered = $this->register_actions( 'postType', 'page', array( array( 'label' => 'No id' ) ) );

		$this->assertSame( array(), $registered );
		$this->assertCount( 1, $reported );
		$this->assertStringNotContainsString( 'The rest of the actions', $reported[0] );
	}

	/**
	 * An origin that is not a non-empty string is refused.
	 */
	public function test_registering_with_an_invalid_origin_is_refused() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::register' );
		$registered = null;
		$this->on_entity_actions_api_init(
			static function () use ( &$registered ) {
				$registered = wp_register_entity_actions( '', 'postType', 'page', array( array( 'id' => 'feature' ) ) );
			}
		);

		$this->assertSame( array(), $registered );
		$this->assertNotContains( 'feature', array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'id' ) );
	}

	/**
	 * Actions that are not a list, such as actions keyed by id, are refused,
	 * and so is an empty list or a script module that is not an id.
	 */
	public function test_registering_actions_that_are_not_a_list_is_refused() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::register' );
		$reported = &$this->record_notices( 'WP_Entity_Actions_Registry::register' );
		$results  = array();
		$this->on_entity_actions_api_init(
			static function () use ( &$results ) {
				$results['keyed']  = wp_register_entity_actions( 'test-plugin', 'postType', 'page', array( 'feature' => array( 'id' => 'feature' ) ) );
				$results['empty']  = wp_register_entity_actions( 'test-plugin', 'postType', 'page', array(), 'plugin/actions' );
				$results['module'] = wp_register_entity_actions( 'test-plugin', 'postType', 'page', array( array( 'id' => 'feature' ) ), 7 );
			}
		);

		$this->assertSame(
			array(
				'keyed'  => array(),
				'empty'  => array(),
				'module' => array(),
			),
			$results
		);
		$this->assertCount( 3, $reported );
		$this->assertNotContains( 'feature', array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'id' ) );
		$this->assertArrayNotHasKey( 'plugin/actions', wp_get_registered_entity_action_modules( 'postType', 'page' ) );
	}

	/**
	 * Unregistering with an entity kind or name that is not a non-empty
	 * string is refused with a notice rather than a fatal error, and the
	 * registry is left untouched.
	 */
	public function test_unregistering_with_an_invalid_entity_is_refused() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::unregister' );
		$results = array();
		$this->on_entity_actions_api_init(
			static function () use ( &$results ) {
				$results['no name']    = wp_unregister_entity_actions( 'postType', array( 'rename-post' ) );
				$results['empty kind'] = wp_unregister_entity_actions( '', 'page', array( 'rename-post' ) );
			}
		);

		$this->assertSame(
			array(
				'no name'    => array(),
				'empty kind' => array(),
			),
			$results
		);
		$this->assertContains( 'rename-post', array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'id' ), 'The default action is kept.' );
	}

	/**
	 * An id that is not a non-empty string is reported and skipped: the
	 * other ids of the call are unregistered.
	 */
	public function test_unregistering_with_an_invalid_id_skips_it() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::unregister' );
		$unregistered = null;
		$this->on_entity_actions_api_init(
			static function () use ( &$unregistered ) {
				$unregistered = wp_unregister_entity_actions( 'postType', 'page', array( array( 'id' => 'rename-post' ), '', 'move-to-trash' ) );
			}
		);

		$this->assertSame( array( 'move-to-trash' ), array_column( $unregistered, 'id' ) );
		$ids = array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'id' );
		$this->assertContains( 'rename-post', $ids, 'A definition in place of an id is skipped, not matched.' );
		$this->assertNotContains( 'move-to-trash', $ids );
	}

	/**
	 * A call whose ids are all invalid unregisters nothing, and its notice
	 * does not mention the rest of the call.
	 */
	public function test_unregistering_only_invalid_ids_unregisters_nothing() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::unregister' );
		$reported     = &$this->record_notices( 'WP_Entity_Actions_Registry::unregister' );
		$unregistered = null;
		$this->on_entity_actions_api_init(
			static function () use ( &$unregistered ) {
				$unregistered = wp_unregister_entity_actions( 'postType', 'page', array( '' ) );
			}
		);

		$this->assertSame( array(), $unregistered );
		$this->assertCount( 2, wp_get_registered_entity_actions( 'postType', 'page' ) );
		$this->assertCount( 1, $reported );
		$this->assertStringNotContainsString( 'The rest of the actions', $reported[0] );
	}

	/**
	 * Reading the actions or the script modules of an entity whose kind or
	 * name is not a non-empty string is reported, and returns nothing.
	 */
	public function test_reading_an_invalid_entity_is_reported() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::get_registered' );
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::get_registered_action_modules' );

		$this->assertSame( array(), wp_get_registered_entity_actions( 'postType', array( 'page' ) ) );
		$this->assertSame( array(), wp_get_registered_entity_action_modules( '', 'page' ) );
	}

	/**
	 * A numeric script module id is read back as a string, like any other.
	 */
	public function test_a_numeric_module_id_is_read_as_a_string() {
		$this->register_actions( 'postType', 'page', array( $this->action( 'feature' ) ), '123' );

		$this->assertSame( array( 'core/defaults', '123' ), wp_get_all_registered_entity_action_modules()['postType']['page'] );
	}

	/**
	 * Registering only runs on the action: elsewhere it is refused and the
	 * registry is left untouched. Before the action a registration would
	 * keep the defaults from being registered; after it the actions have been
	 * read and the import map of the editor script built from them.
	 */
	public function test_registering_outside_the_action_is_refused() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::register' );
		self::reset_registry();
		$fired = did_action( 'wp_entity_actions_api_init' );

		$this->assertSame( array(), wp_register_entity_actions( 'test-plugin', 'postType', 'page', array( $this->action( 'feature' ) ), 'plugin/feature' ) );
		$this->assertSame( $fired, did_action( 'wp_entity_actions_api_init' ), 'Refusing does not fire the action.' );
		$this->assertNotContains( 'feature', array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'id' ) );
		$this->assertArrayNotHasKey( 'plugin/feature', wp_get_registered_entity_action_modules( 'postType', 'page' ) );
	}

	/**
	 * Unregistering only runs on the action: elsewhere it is refused before
	 * reading the registry, so a stray call, from an `init` callback say,
	 * neither drops a default action nor fires the action early against
	 * post types still being registered.
	 */
	public function test_unregistering_outside_the_action_is_refused() {
		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::unregister' );
		self::reset_registry();
		$fired = did_action( 'wp_entity_actions_api_init' );

		$this->assertSame( array(), wp_unregister_entity_actions( 'postType', 'page', array( 'rename-post' ) ), 'Unregistering actions by id is refused.' );
		$this->assertSame( array(), wp_unregister_entity_actions( 'postType', 'page' ), 'Unregistering every action is refused.' );
		$this->assertSame( $fired, did_action( 'wp_entity_actions_api_init' ), 'Refusing does not fire the action.' );
		$this->assertContains( 'rename-post', array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'id' ), 'The default action is kept.' );
	}

	/**
	 * A read before `init` is refused and returns nothing, without firing
	 * the action: the post types the defaults derive from are registered on
	 * `init`, and the action fires once. The next read after `init` fires it.
	 */
	public function test_reading_before_init_does_not_fire_the_action() {
		global $wp_actions;

		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::initialize' );
		self::reset_registry();
		$fired = did_action( 'wp_entity_actions_api_init' );

		// did_action() counts the times a hook fired: forget `init` fired, as
		// before it runs.
		$did_init = $wp_actions['init'];
		unset( $wp_actions['init'] );
		try {
			$this->assertFalse( (bool) did_action( 'init' ) );
			$this->assertSame( array(), wp_get_registered_entity_actions( 'postType', 'page' ) );
			$this->assertSame( array(), wp_get_all_registered_entity_action_modules() );
			$this->assertSame( $fired, did_action( 'wp_entity_actions_api_init' ), 'A read before `init` does not fire the action.' );
		} finally {
			$wp_actions['init'] = $did_init;
		}

		$this->assertContains( 'rename-post', array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'id' ), 'The next read fires the action and registers the defaults.' );
		$this->assertSame( $fired + 1, did_action( 'wp_entity_actions_api_init' ) );
	}

	/**
	 * A read during `init` is refused too: did_action() is true from the
	 * first `init` callback on, while the post types are still being
	 * registered. The next read after `init` fires the action.
	 */
	public function test_reading_during_init_does_not_fire_the_action() {
		global $wp_current_filter;

		$this->setExpectedIncorrectUsage( 'WP_Entity_Actions_Registry::initialize' );
		self::reset_registry();
		$fired = did_action( 'wp_entity_actions_api_init' );

		// doing_action() reads the stack of hooks being run: put `init` on it,
		// as when an `init` callback runs.
		$wp_current_filter[] = 'init';
		try {
			$this->assertTrue( doing_action( 'init' ) );
			$this->assertSame( array(), wp_get_registered_entity_actions( 'postType', 'page' ) );
			$this->assertSame( array(), wp_get_all_registered_entity_action_modules() );
			$this->assertSame( $fired, did_action( 'wp_entity_actions_api_init' ), 'A read during `init` does not fire the action.' );
		} finally {
			array_pop( $wp_current_filter );
		}

		$this->assertContains( 'rename-post', array_column( wp_get_registered_entity_actions( 'postType', 'page' ), 'id' ), 'The next read fires the action and registers the defaults.' );
		$this->assertSame( $fired + 1, did_action( 'wp_entity_actions_api_init' ) );
	}
}
