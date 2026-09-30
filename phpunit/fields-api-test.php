<?php
/**
 * Tests for the entity fields API.
 *
 * @package gutenberg
 *
 * @covers ::_gutenberg_add_field_modules_to_editor_script
 * @covers ::gutenberg_get_field_collection_fields
 * @covers ::_gutenberg_get_field_collection
 * @covers ::_gutenberg_is_field_id_list_or_true
 * @covers ::gutenberg_register_field_collection
 * @covers ::gutenberg_register_core_post_supports_fields
 * @covers ::gutenberg_register_core_field_collections
 * @covers Gutenberg_Fields_Registry::initialize
 * @covers Gutenberg_Fields_Registry::register
 * @covers Gutenberg_Fields_Registry::unregister
 */
class Tests_Fields_API extends WP_UnitTestCase {

	/**
	 * The callbacks a test hooked to `fields_api_init`, as callback and
	 * priority pairs, removed on tear down.
	 *
	 * @var array[]
	 */
	private $callbacks = array();

	/**
	 * Whether a test unhooked the loader of the core collections, hooked
	 * back on tear down.
	 *
	 * @var bool
	 */
	private $core_collections_unhooked = false;

	/**
	 * The post types a test registered, unregistered on tear down.
	 *
	 * @var string[]
	 */
	private $post_types = array();

	/**
	 * Tears down each test.
	 *
	 * Resetting the registry drops the fields a test registered along with
	 * the defaults; the next read fires `fields_api_init` again and
	 * registers the defaults anew.
	 */
	public function tear_down() {
		foreach ( $this->callbacks as list( $callback, $priority ) ) {
			remove_action( 'fields_api_init', $callback, $priority );
		}
		$this->callbacks = array();
		if ( $this->core_collections_unhooked ) {
			add_action( 'fields_api_init', 'gutenberg_register_core_field_collections', 0 );
			$this->core_collections_unhooked = false;
		}
		foreach ( $this->post_types as $post_type ) {
			unregister_post_type( $post_type );
		}
		$this->post_types = array();
		self::reset_registry();

		parent::tear_down();
	}

	/**
	 * Resets the registry: drops the singleton instance, so the next
	 * get_instance() creates an empty registry and its first read fires
	 * `fields_api_init` again.
	 */
	private static function reset_registry() {
		$instance = new ReflectionProperty( Gutenberg_Fields_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
	}

	/**
	 * Hooks a callback to `fields_api_init` for the duration of the test
	 * and fires the action anew, so the registry reflects it right away.
	 *
	 * Registering and unregistering only run on the action, so this is how a
	 * test alters the registry, as a plugin does. The registry is reset and
	 * read, which fires the action: the defaults are registered again and
	 * the callbacks hooked so far replay, in order. The callbacks are
	 * removed on tear down.
	 *
	 * @param callable $callback The callback, receiving the registry.
	 * @param int      $priority The priority. Default 10, after the defaults.
	 */
	private function on_fields_api_init( $callback, $priority = 10 ) {
		add_action( 'fields_api_init', $callback, $priority );
		$this->callbacks[] = array( $callback, $priority );

		self::reset_registry();
		$registry = Gutenberg_Fields_Registry::get_instance();
		$registry->get_all_registered();
	}

	/**
	 * Unregisters the fields of every entity with a script module, so a
	 * test can start from a registry without modules. The registry is reset
	 * on tear down.
	 */
	private function unregister_all_field_modules() {
		$this->on_fields_api_init(
			static function ( $registry ) {
				foreach ( $registry->get_all_registered_field_modules() as $kind => $entities ) {
					foreach ( array_keys( $entities ) as $name ) {
						$registry->unregister( $kind, $name );
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
	 * Registers fields on `fields_api_init` for the duration of the test,
	 * with the `test-plugin` origin: the registry is reset on tear down.
	 *
	 * @param string      $kind   The entity kind.
	 * @param string      $name   The entity name.
	 * @param array[]     $fields The field definitions.
	 * @param string|null $module The script module id, if any.
	 * @return bool Whether the fields were registered.
	 */
	private function register_fields( $kind, $name, $fields, $module = null ) {
		$registered = false;
		$this->on_fields_api_init(
			static function ( $registry ) use ( &$registered, $kind, $name, $fields, $module ) {
				$registered = $registry->register( 'test-plugin', $kind, $name, $fields, $module );
			}
		);
		return $registered;
	}

	/**
	 * Registers the fields of fixture collections instead of the core
	 * collections, for the duration of the test: the loader of the core
	 * collections is unhooked, then hooked back on tear down.
	 *
	 * @param string   $fixture     The folder of the collections, in
	 *                              data/core-fields/collections.
	 * @param string[] $collections The collections to register, in order.
	 * @return bool[] What gutenberg_register_field_collection() returned for
	 *                each collection, keyed by collection.
	 */
	private function register_fixture_collections( $fixture, $collections ) {
		remove_action( 'fields_api_init', 'gutenberg_register_core_field_collections', 0 );
		$this->core_collections_unhooked = true;

		$directory = __DIR__ . '/data/core-fields/collections/' . $fixture;
		$results   = array();
		$this->on_fields_api_init(
			static function ( $registry ) use ( $directory, $collections, &$results ) {
				foreach ( $collections as $collection ) {
					$results[ $collection ] = gutenberg_register_field_collection( $registry, $directory . '/' . $collection );
				}
			},
			0
		);
		return $results;
	}

	/**
	 * Registers the fixture post types a test uses, exposed in the REST API
	 * unless hidden. They are unregistered on tear down.
	 *
	 * @param array<string, array> $post_types The supports, keyed by post type.
	 * @param string[]             $hidden     The post types not exposed in
	 *                                         the REST API.
	 */
	private function register_post_types( $post_types, $hidden = array() ) {
		foreach ( $post_types as $post_type => $supports ) {
			$this->post_types[] = $post_type;
			register_post_type(
				$post_type,
				array(
					'show_in_rest' => ! in_array( $post_type, $hidden, true ),
					'supports'     => $supports,
				)
			);
		}
	}

	/**
	 * Builds a minimal field definition.
	 *
	 * @param string $id The field id.
	 * @return array The field definition.
	 */
	private function field( $id ) {
		return array(
			'id'    => $id,
			'type'  => 'text',
			'label' => $id,
		);
	}

	/**
	 * The modules are added on `admin_footer`, which fires before the import
	 * map is printed, both in the admin template and in the pages rendered
	 * outside it.
	 */
	public function test_the_modules_are_added_on_admin_footer() {
		$this->assertSame( 10, has_action( 'admin_footer', '_gutenberg_add_field_modules_to_editor_script' ) );
		$this->assertFalse( has_action( 'admin_init', '_gutenberg_add_field_modules_to_editor_script' ) );
	}

	/**
	 * A page that registers the editor script without loading it is left
	 * untouched, and the registry is not read.
	 */
	public function test_nothing_happens_when_the_editor_script_is_not_enqueued() {
		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );

		$fired = did_action( 'fields_api_init' );
		self::reset_registry();
		_gutenberg_add_field_modules_to_editor_script( $scripts );

		$this->assertSame( array(), $scripts->get_data( 'wp-editor', 'module_dependencies' ) );
		$this->assertSame( $fired, did_action( 'fields_api_init' ), 'The registry is not read.' );
	}

	/**
	 * The modules are added when the editor script is only a dependency of
	 * the scripts the page enqueues, as on the pages booted by
	 * `@wordpress/boot`.
	 */
	public function test_the_modules_are_added_when_the_editor_script_is_a_dependency() {
		$this->unregister_all_field_modules();
		$this->register_fields( 'postType', 'page', array( $this->field( 'color' ) ), 'plugin/color' );

		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );
		$scripts->add( 'boot', '/boot.js', array( 'wp-editor' ) );
		$scripts->enqueue( 'boot' );
		_gutenberg_add_field_modules_to_editor_script( $scripts );

		$this->assertSame( array( 'plugin/color' ), $this->get_module_dependency_ids( $scripts, 'wp-editor' ) );
	}

	/**
	 * A scripts registry without the editor script is left untouched, even
	 * when field script modules are registered.
	 */
	public function test_nothing_happens_without_the_editor_script() {
		$this->register_fields( 'postType', 'page', array( $this->field( 'color' ) ), 'plugin/color' );

		$scripts = new WP_Scripts();
		// The default scripts register the real editor script.
		$scripts->remove( 'wp-editor' );
		_gutenberg_add_field_modules_to_editor_script( $scripts );

		$this->assertFalse( $scripts->query( 'wp-editor', 'registered' ) );
		$this->assertFalse( $scripts->get_data( 'wp-editor', 'module_dependencies' ) );
	}

	/**
	 * The dependencies of the editor script stay untouched when no entity has
	 * a script module registered.
	 */
	public function test_nothing_happens_without_registered_field_modules() {
		$this->unregister_all_field_modules();
		$this->assertSame( array(), gutenberg_get_all_registered_field_modules(), 'No field script module is registered.' );

		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->enqueue( 'wp-editor' );
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );
		_gutenberg_add_field_modules_to_editor_script( $scripts );

		$this->assertSame( array(), $scripts->get_data( 'wp-editor', 'module_dependencies' ) );
	}

	/**
	 * The script module of a field becomes a dynamic dependency of the editor
	 * script.
	 */
	public function test_field_script_modules_become_dynamic_dependencies_of_the_editor_script() {
		$this->unregister_all_field_modules();
		$this->register_fields( 'postType', 'page', array( $this->field( 'color' ) ), 'plugin/color' );

		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->enqueue( 'wp-editor' );
		// Only the dependencies added by the function are of interest.
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );
		_gutenberg_add_field_modules_to_editor_script( $scripts );

		$this->assertSame(
			array(
				array(
					'id'     => 'plugin/color',
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
		$this->register_fields( 'postType', 'page', array( $this->field( 'color' ) ), 'plugin/color' );

		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->enqueue( 'wp-editor' );
		$scripts->add_data( 'wp-editor', 'module_dependencies', array( '@wordpress/existing' ) );

		_gutenberg_add_field_modules_to_editor_script( $scripts );
		$dependencies = $scripts->get_data( 'wp-editor', 'module_dependencies' );
		_gutenberg_add_field_modules_to_editor_script( $scripts );

		$this->assertSame( $dependencies, $scripts->get_data( 'wp-editor', 'module_dependencies' ), 'A second run adds nothing.' );
		$ids = $this->get_module_dependency_ids( $scripts, 'wp-editor' );
		$this->assertSame( '@wordpress/existing', $ids[0], 'The declared dependency is kept first.' );
		$this->assertSame( 1, count( array_keys( $ids, 'plugin/color', true ) ), 'The module is declared once.' );
		$this->assertContains(
			array(
				'id'     => 'plugin/color',
				'import' => 'dynamic',
			),
			$dependencies
		);
	}

	/**
	 * A module registered for several entities is declared once.
	 */
	public function test_a_module_shared_by_several_entities_is_declared_once() {
		$this->register_fields( 'postType', 'page', array( $this->field( 'color' ) ), 'plugin/fields' );
		$this->register_fields( 'taxonomy', 'category', array( $this->field( 'color' ) ), 'plugin/fields' );

		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->enqueue( 'wp-editor' );
		// Only the dependencies added by the function are of interest.
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );
		_gutenberg_add_field_modules_to_editor_script( $scripts );

		$ids = $this->get_module_dependency_ids( $scripts, 'wp-editor' );
		$this->assertSame( array( 'plugin/fields' ), array_values( array_intersect( $ids, array( 'plugin/fields' ) ) ) );
	}

	/**
	 * The script module of the default post fields is declared by default,
	 * since the author field of every post type supporting authors ships its
	 * JavaScript parts in it.
	 */
	public function test_the_default_fields_module_is_a_dependency_of_the_editor_script() {
		$scripts = new WP_Scripts();
		$scripts->add( 'wp-editor', '/editor.js' );
		$scripts->enqueue( 'wp-editor' );
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );
		_gutenberg_add_field_modules_to_editor_script( $scripts );

		$this->assertContains(
			array(
				'id'     => '@wordpress/core-fields/post_supports',
				'import' => 'dynamic',
			),
			$scripts->get_data( 'wp-editor', 'module_dependencies' )
		);
	}

	/**
	 * The script modules of the fields reach the import map of a page that
	 * loads the editor script.
	 */
	public function test_field_script_modules_reach_the_import_map() {
		global $wp_scripts;
		$original_scripts = $wp_scripts;
		$wp_scripts       = new WP_Scripts();

		try {
			// Only the test module is of interest: the built modules may not be
			// registered in the test environment.
			$this->unregister_all_field_modules();
			$this->register_fields( 'postType', 'page', array( $this->field( 'color' ) ), 'plugin/color' );
			$wp_scripts->add( 'wp-editor', '/editor.js' );
			wp_register_script_module( 'plugin/color', '/color.js' );

			$wp_scripts->enqueue( 'wp-editor' );
			_gutenberg_add_field_modules_to_editor_script( $wp_scripts );

			$processor = new WP_HTML_Tag_Processor( get_echo( array( wp_script_modules(), 'print_import_map' ) ) );
			$this->assertTrue( $processor->next_tag( 'SCRIPT' ), 'An import map is printed.' );
			$this->assertSame( 'importmap', $processor->get_attribute( 'type' ) );
			$import_map = json_decode( $processor->get_modifiable_text(), true );
		} finally {
			$wp_scripts = $original_scripts;
			wp_deregister_script_module( 'plugin/color' );
		}

		$this->assertArrayHasKey( 'plugin/color', $import_map['imports'] );
	}

	/**
	 * Any post type supporting authors, comments, or notes, including a
	 * custom one, gets the default fields: the defaults derive from the post
	 * types registered when the action fires.
	 */
	public function test_a_custom_post_type_gets_the_default_fields_of_its_supports() {
		register_post_type(
			'gutenberg_book',
			array(
				'show_in_rest' => true,
				'supports'     => array(
					'title',
					'author',
					'comments',
					'editor' => array( 'notes' => true ),
				),
			)
		);

		try {
			self::reset_registry();
			$fields  = gutenberg_get_registered_fields( 'postType', 'gutenberg_book' );
			$modules = gutenberg_get_registered_field_modules( 'postType', 'gutenberg_book' );
		} finally {
			unregister_post_type( 'gutenberg_book' );
		}

		$this->assertSame( array( 'author', 'comment_status', 'notesCount' ), array_column( $fields, 'id' ) );
		$this->assertSame( array( 'core' ), array_unique( array_column( array_column( $fields, 'origin' ), 'registeredBy' ) ), 'The fields carry the origin of their collection.' );
		$this->assertSame(
			array( '@wordpress/core-fields/post_supports' => array( 'author', 'comment_status', 'notesCount' ) ),
			$modules,
			'Every default field is registered with the module of its folder.'
		);
	}

	/**
	 * The notes field follows the `notes` argument of the `editor` support,
	 * which WordPress stores as a list of argument arrays; a bare `editor`
	 * support does not enable it.
	 */
	public function test_the_notes_field_follows_the_editor_support_argument() {
		register_post_type(
			'gutenberg_book',
			array(
				'show_in_rest' => true,
				'supports'     => array( 'editor' => array( 'notes' => true ) ),
			)
		);
		register_post_type(
			'gutenberg_note',
			array(
				'show_in_rest' => true,
				'supports'     => array( 'editor' ),
			)
		);

		try {
			self::reset_registry();
			$with_notes    = array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_book' ), 'id' );
			$without_notes = array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_note' ), 'id' );
		} finally {
			unregister_post_type( 'gutenberg_book' );
			unregister_post_type( 'gutenberg_note' );
		}

		$this->assertContains( 'notesCount', $with_notes );
		$this->assertNotContains( 'notesCount', $without_notes );
	}

	/**
	 * The build copies the collections as they are: the configurations and
	 * the fields come out byte-identical.
	 */
	public function test_the_build_copies_the_collections_as_they_are() {
		$source = __DIR__ . '/../packages/core-fields/src';
		$build  = __DIR__ . '/../build/scripts/core-fields';
		$files  = array_merge( glob( $source . '/*/index.php' ), glob( $source . '/*/*/field.php' ) );

		$this->assertNotEmpty( $files );
		foreach ( $files as $file ) {
			$this->assertFileEquals( $file, $build . substr( $file, strlen( $source ) ) );
		}
	}

	/**
	 * The build prefixes the functions the core-fields loader defines, and
	 * the public functions it calls, and nothing else.
	 */
	public function test_the_build_prefixes_the_functions_of_the_core_fields_loader() {
		$source = file_get_contents( __DIR__ . '/../packages/core-fields/src/index.php' );
		$built  = file_get_contents( __DIR__ . '/../build/scripts/core-fields/index.php' );

		$this->assertStringContainsString( 'function gutenberg_register_core_post_supports_fields( $registry )', $built );
		$this->assertStringContainsString( 'function gutenberg_register_core_field_collections( $registry )', $built );
		$this->assertStringContainsString( "gutenberg_get_field_collection_fields( __DIR__ . '/post_supports' );", $built );
		$this->assertStringContainsString( 'gutenberg_register_core_post_supports_fields( $registry );', $built );
		$this->assertStringContainsString( "gutenberg_register_field_collection( \$registry, __DIR__ . '/wp_template' );", $built );
		$this->assertStringContainsString( "add_action( 'fields_api_init', 'gutenberg_register_core_field_collections', 0 );", $built );
		$this->assertStringNotContainsString( 'wp_register_field_collection', $built );
		$this->assertStringNotContainsString( 'wp_get_field_collection_fields', $built );
		$this->assertSame(
			str_replace(
				array( 'wp_register_field_collection', 'wp_get_field_collection_fields', 'register_core_post_supports_fields', 'register_core_field_collections' ),
				array( 'gutenberg_register_field_collection', 'gutenberg_get_field_collection_fields', 'gutenberg_register_core_post_supports_fields', 'gutenberg_register_core_field_collections' ),
				$source
			),
			$built,
			'Only the function names change.'
		);
	}

	/**
	 * The default fields come from the `field.php` files of the
	 * `post_supports` folder.
	 */
	public function test_the_default_fields_come_from_the_post_supports_folder() {
		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'post' ), null, 'id' );
		$this->assertSame( 'integer', $fields['author']['type'] );
		$this->assertSame( 'core', $fields['author']['origin']['registeredBy'] );
		$this->assertSame( 'radio', $fields['comment_status']['Edit'] );
	}

	/**
	 * A collection lists a folder per field: the id of a field is the name
	 * of its folder unless its `field.php` sets one, and the fields are in
	 * the alphabetical order of their folders, keyed by id.
	 */
	public function test_a_collection_has_a_field_per_folder() {
		$fields = gutenberg_get_field_collection_fields( __DIR__ . '/data/core-fields/fixture' );

		$this->assertSame( array( 'zeta', 'beta' ), array_keys( $fields ), 'The folder name is the id, unless the field sets one; the folders set the order.' );
		$this->assertSame( array( 'zeta', 'beta' ), array_column( $fields, 'id' ), 'Each field has its id.' );
		$this->assertSame( 'id', array_keys( $fields['beta'] )[0], 'The id comes first.' );
		$this->assertSame( 'Zeta', $fields['zeta']['label'] );
	}

	/**
	 * A missing collection has no fields.
	 */
	public function test_a_missing_collection_has_no_fields() {
		$this->assertSame( array(), gutenberg_get_field_collection_fields( __DIR__ . '/data/core-fields/missing' ) );
	}

	/**
	 * The core fields are registered on `fields_api_init` at priority 0,
	 * before the plugins hooking the action at the default priority.
	 */
	public function test_the_core_collections_are_registered_at_priority_zero() {
		$this->assertSame( 0, has_action( 'fields_api_init', 'gutenberg_register_core_field_collections' ) );
		$this->assertFalse( function_exists( 'register_core_field_collections' ), 'The Gutenberg build prefixes the function.' );
		$this->assertFalse( function_exists( 'register_core_post_supports_fields' ), 'The Gutenberg build prefixes the function.' );
	}

	/**
	 * The defaults make no exception for any post type: on their own, they
	 * register the author field on templates, template parts, and
	 * attachments, which support authors. Their collections unregister it,
	 * as a plugin would.
	 */
	public function test_the_defaults_make_no_exception() {
		remove_action( 'fields_api_init', 'gutenberg_register_core_field_collections', 0 );
		$this->core_collections_unhooked = true;
		$this->on_fields_api_init( 'gutenberg_register_core_post_supports_fields', 0 );

		foreach ( array( 'wp_template', 'wp_template_part', 'attachment' ) as $post_type ) {
			$fields = array_column( gutenberg_get_registered_fields( 'postType', $post_type ), null, 'id' );
			$this->assertArrayHasKey( 'author', $fields, "The defaults register the author field on $post_type." );
			$this->assertSame( 'integer', $fields['author']['type'] );
		}
	}

	/**
	 * Template parts support authors but have their own client-side author
	 * field, so they opt out of the default one.
	 */
	public function test_template_parts_do_not_get_the_default_author_field() {
		$this->assertTrue( post_type_supports( 'wp_template_part', 'author' ), 'The post type supports authors.' );
		$this->assertSame( array(), gutenberg_get_registered_fields( 'postType', 'wp_template_part' ) );
	}

	/**
	 * Templates support authors but their author is the theme, plugin, site,
	 * or user that provides them: they opt out of the default author field
	 * and their collection has its own, with its own script module.
	 */
	public function test_templates_get_their_own_author_field() {
		$this->assertTrue( post_type_supports( 'wp_template', 'author' ), 'The post type supports authors.' );

		$fields = gutenberg_get_registered_fields( 'postType', 'wp_template' );
		$this->assertSame( array( 'author' ), array_column( $fields, 'id' ), 'The default author field is not registered.' );
		$this->assertArrayNotHasKey( 'type', $fields[0], 'The template author is not the integer post author.' );
		$this->assertSame( 'core', $fields[0]['origin']['registeredBy'] );
		$this->assertSame(
			array( '@wordpress/core-fields/wp_template' => array( 'author' ) ),
			gutenberg_get_registered_field_modules( 'postType', 'wp_template' ),
			'The template author ships its JavaScript parts in the module of its collection.'
		);
	}

	/**
	 * A plugin can replace the author field of templates.
	 */
	public function test_a_plugin_can_replace_the_author_field_of_templates() {
		$this->on_fields_api_init(
			static function ( $registry ) {
				$registry->unregister( 'postType', 'wp_template', array( 'author' ) );
				$registry->register(
					'my-plugin',
					'postType',
					'wp_template',
					array(
						array(
							'id'    => 'author',
							'type'  => 'text',
							'label' => 'Maker',
						),
					)
				);
			}
		);

		$author = array_column( gutenberg_get_registered_fields( 'postType', 'wp_template' ), null, 'id' )['author'];
		$this->assertSame( 'my-plugin', $author['origin']['registeredBy'] );
		$this->assertSame( array(), gutenberg_get_registered_field_modules( 'postType', 'wp_template' ) );
	}

	/**
	 * Attachments support authors and comments but the media editor has its
	 * own fields, so they opt out of every default field and their
	 * collection has the media fields, plain data without a script module.
	 */
	public function test_attachments_get_the_media_fields_instead_of_the_defaults() {
		$this->assertTrue( post_type_supports( 'attachment', 'author' ), 'The post type supports authors.' );
		$this->assertTrue( post_type_supports( 'attachment', 'comments' ), 'The post type supports comments.' );

		$fields = gutenberg_get_registered_fields( 'postType', 'attachment' );
		$this->assertSame( array( 'date' ), array_column( $fields, 'id' ), 'Only the media fields are registered.' );
		$this->assertSame( 'datetime', $fields[0]['type'], 'The media fields come from the attachment collection.' );
		$this->assertSame( 'core', $fields[0]['origin']['registeredBy'] );
		$this->assertSame( array(), gutenberg_get_registered_field_modules( 'postType', 'attachment' ), 'The media fields registered so far are plain data: no script module.' );
	}

	/**
	 * A plugin registering attachment fields keeps them next to the media
	 * fields.
	 */
	public function test_attachments_keep_the_fields_plugins_register() {
		$this->register_fields( 'postType', 'attachment', array( $this->field( 'credit' ) ) );

		$this->assertSame( array( 'date', 'credit' ), array_column( gutenberg_get_registered_fields( 'postType', 'attachment' ), 'id' ) );
	}

	/**
	 * A plugin drops a default field from its post type by unregistering
	 * it at the default priority, keeping the others.
	 */
	public function test_a_plugin_can_drop_a_default_field_from_a_post_type() {
		$this->register_post_types(
			array(
				'gutenberg_book' => array( 'title', 'author', 'comments' ),
				'gutenberg_note' => array( 'title', 'author', 'comments' ),
			)
		);
		$this->on_fields_api_init(
			static function ( $registry ) {
				$registry->unregister( 'postType', 'gutenberg_book', array( 'comment_status' ) );
			}
		);

		$this->assertSame( array( 'author' ), array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_book' ), 'id' ) );
		$this->assertSame( array( 'author', 'comment_status' ), array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_note' ), 'id' ), 'The other post types keep the field.' );
	}

	/**
	 * A collection registers its fields on its entity, after the fields
	 * registered on it before, with its origin and its module. Like the
	 * registry, it does not check that the entity exists or is exposed in
	 * the REST API.
	 */
	public function test_a_collection_places_its_fields() {
		$this->register_post_types(
			array(
				'gutenberg_book'     => array( 'title' ),
				'gutenberg_magazine' => array( 'title' ),
				'gutenberg_hidden'   => array( 'title' ),
			),
			array( 'gutenberg_hidden' )
		);
		$this->register_fields( 'postType', 'gutenberg_book', array( $this->field( 'isbn' ) ) );
		$results = $this->register_fixture_collections( 'valid', array( 'book', 'magazine', 'hidden' ) );

		$this->assertSame(
			array(
				'book'     => true,
				'magazine' => true,
				'hidden'   => true,
			),
			$results
		);

		$book = gutenberg_get_registered_fields( 'postType', 'gutenberg_book' );
		$this->assertSame( array( 'subtitle', 'isbn' ), array_column( $book, 'id' ), 'The fields registered first come first: the fixture collections run at priority 0.' );
		$this->assertSame( 'fixture', $book[0]['origin']['registeredBy'], 'The fields carry the origin of their collection.' );
		$this->assertSame( array( 'fixture/book' => array( 'subtitle' ) ), gutenberg_get_registered_field_modules( 'postType', 'gutenberg_book' ), 'Each field is registered with the module of its collection.' );

		$this->assertSame( array( 'issue' ), array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_magazine' ), 'id' ) );
		$this->assertSame( array(), gutenberg_get_registered_field_modules( 'postType', 'gutenberg_magazine' ), 'A collection without module registers none.' );
		$this->assertSame( array( 'secret' ), array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_hidden' ), 'id' ), 'A post type not exposed in the REST API gets its fields too.' );
	}

	/**
	 * There is no precedence between collections: a collection redefining a
	 * field registered before it without unregistering it is refused by the
	 * registry, like a plugin registering it twice.
	 */
	public function test_a_collection_redefining_a_field_it_does_not_unregister_is_refused() {
		$this->register_post_types( array( 'gutenberg_book' => array( 'title' ) ) );
		remove_action( 'fields_api_init', 'gutenberg_register_core_field_collections', 0 );
		$this->core_collections_unhooked = true;

		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::register' );
		$directory = __DIR__ . '/data/core-fields/collections/duplicate/book';
		$result    = null;
		$this->on_fields_api_init(
			static function ( $registry ) use ( $directory, &$result ) {
				$registry->register(
					'defaults',
					'postType',
					'gutenberg_book',
					array(
						array(
							'id'    => 'authorship',
							'type'  => 'text',
							'label' => 'Authorship',
						),
					)
				);
				$result = gutenberg_register_field_collection( $registry, $directory );
			},
			0
		);
		$fields = gutenberg_get_registered_fields( 'postType', 'gutenberg_book' );

		$this->assertFalse( $result, 'The refused collection returns false.' );
		$this->assertSame( array( 'authorship' ), array_column( $fields, 'id' ) );
		$this->assertSame( 'Authorship', $fields[0]['label'], 'The field registered first is kept.' );
	}

	/**
	 * A collection for a single entity unregisters the fields of its
	 * `unregister` before registering its own, so it can replace or drop
	 * fields registered before it: a list of ids, which may name fields
	 * that are not registered, or true for all of them. A collection
	 * without fields of its own still unregisters.
	 */
	public function test_a_collection_unregisters_the_fields_it_replaces() {
		$this->register_post_types(
			array(
				'gutenberg_book'     => array( 'title' ),
				'gutenberg_novel'    => array( 'title' ),
				'gutenberg_magazine' => array( 'title' ),
			)
		);
		remove_action( 'fields_api_init', 'gutenberg_register_core_field_collections', 0 );
		$this->core_collections_unhooked = true;

		$directory = __DIR__ . '/data/core-fields/collections/replacing';
		$results   = array();
		$this->on_fields_api_init(
			function ( $registry ) use ( $directory, &$results ) {
				foreach ( array( 'gutenberg_book', 'gutenberg_novel', 'gutenberg_magazine' ) as $post_type ) {
					$registry->register( 'defaults', 'postType', $post_type, array( $this->field( 'authorship' ), $this->field( 'discussion' ) ), 'defaults/module' );
				}
				foreach ( array( 'book', 'novel', 'magazine' ) as $collection ) {
					$results[ $collection ] = gutenberg_register_field_collection( $registry, $directory . '/' . $collection );
				}
			},
			0
		);

		$this->assertSame(
			array(
				'book'     => true,
				'novel'    => true,
				'magazine' => true,
			),
			$results
		);

		$book = gutenberg_get_registered_fields( 'postType', 'gutenberg_book' );
		$this->assertSame( array( 'discussion', 'authorship' ), array_column( $book, 'id' ), 'The replacing field follows the fields kept.' );
		$this->assertSame( 'Book authorship', $book[1]['label'] );
		$this->assertSame( 'fixture', $book[1]['origin']['registeredBy'] );
		$this->assertSame(
			array(
				'defaults/module' => array( 'discussion' ),
				'fixture/book'    => array( 'authorship' ),
			),
			gutenberg_get_registered_field_modules( 'postType', 'gutenberg_book' ),
			'The replaced field leaves the module it was registered with.'
		);

		$this->assertSame( array( 'discussion' ), array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_novel' ), 'id' ), 'A collection without fields drops the fields it lists.' );
		$this->assertSame( array( 'issue' ), array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_magazine' ), 'id' ), 'True drops every field registered before.' );
		$this->assertSame( array(), gutenberg_get_registered_field_modules( 'postType', 'gutenberg_magazine' ) );
	}

	/**
	 * An `unregister` other than true or a list of field ids is reported,
	 * and the collection skipped.
	 */
	public function test_an_invalid_unregister_skips_the_collection() {
		$this->register_post_types( array( 'gutenberg_book' => array( 'title' ) ) );

		$this->setExpectedIncorrectUsage( 'gutenberg_register_field_collection' );
		$results = $this->register_fixture_collections( 'invalid', array( 'unregister_string' ) );

		$this->assertSame( array( 'unregister_string' => false ), $results );
		$this->assertSame( array(), gutenberg_get_registered_fields( 'postType', 'gutenberg_book' ) );
	}

	/**
	 * An invalid collection is reported and skipped; the valid ones are
	 * registered.
	 */
	public function test_an_invalid_collection_is_skipped() {
		$this->register_post_types( array( 'gutenberg_book' => array( 'title' ) ) );

		$this->setExpectedIncorrectUsage( 'gutenberg_register_field_collection' );
		$reported = array();
		$report   = static function ( $function_name, $message ) use ( &$reported ) {
			if ( 'gutenberg_register_field_collection' === $function_name ) {
				$reported[] = $message;
			}
		};
		add_action( 'doing_it_wrong_run', $report, 10, 2 );
		$results = $this->register_fixture_collections( 'invalid', array( 'book', 'no_name', 'null_name', 'no_origin', 'missing' ) );
		$ids     = array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_book' ), 'id' );

		$this->assertSame( array( 'subtitle' ), $ids );
		$this->assertSame(
			array(
				'book'      => true,
				'no_name'   => false,
				'null_name' => false,
				'no_origin' => false,
				'missing'   => false,
			),
			$results,
			'An invalid configuration returns false.'
		);
		$this->assertCount(
			4,
			$reported,
			'Each invalid collection is reported: no name, a null name, no origin, and a missing `index.php`.'
		);
	}

	/**
	 * A collection is registered on the registry `fields_api_init` passes.
	 */
	public function test_a_collection_needs_the_registry() {
		$this->setExpectedIncorrectUsage( 'gutenberg_register_field_collection' );
		$this->assertFalse( gutenberg_register_field_collection( null, __DIR__ . '/data/core-fields/collections/valid/book' ) );
	}

	/**
	 * Reading the registry fires `fields_api_init` once, whichever
	 * getter is read first and however many times it is read.
	 */
	public function test_reading_the_registry_fires_the_action_once() {
		self::reset_registry();
		$registry = Gutenberg_Fields_Registry::get_instance();
		$fired    = did_action( 'fields_api_init' );

		gutenberg_get_registered_fields( 'postType', 'page' );
		$this->assertSame( $fired + 1, did_action( 'fields_api_init' ), 'The first read fires the action.' );

		gutenberg_get_registered_fields( 'postType', 'post' );
		gutenberg_get_registered_field_modules( 'postType', 'page' );
		gutenberg_get_all_registered_field_modules();
		$registry->get_all_registered();
		$this->assertSame( $fired + 1, did_action( 'fields_api_init' ), 'Further reads do not fire it again.' );
	}

	/**
	 * The action receives the registry, so a callback can read and adjust it.
	 */
	public function test_the_action_receives_the_registry() {
		$received = null;
		$callback = static function ( $registry ) use ( &$received ) {
			$received = $registry;
		};
		add_action( 'fields_api_init', $callback );

		try {
			self::reset_registry();
			gutenberg_get_registered_fields( 'postType', 'page' );
		} finally {
			remove_action( 'fields_api_init', $callback );
		}

		$this->assertSame( Gutenberg_Fields_Registry::get_instance(), $received );
	}

	/**
	 * A plugin hooking the action at the default priority sees the final
	 * defaults: on the registry it receives, it can update a default field,
	 * or remove it.
	 */
	public function test_a_callback_at_the_default_priority_alters_the_defaults() {
		$callback = static function ( $registry ) {
			$registry->update(
				'test-plugin',
				'postType',
				'page',
				array(
					array(
						'id'            => 'comment_status',
						'enableSorting' => true,
					),
				)
			);
			$registry->unregister( 'postType', 'page', array( 'author' ) );
		};
		add_action( 'fields_api_init', $callback );

		try {
			self::reset_registry();
			$fields = gutenberg_get_registered_fields( 'postType', 'page' );
		} finally {
			remove_action( 'fields_api_init', $callback );
		}

		$fields = array_column( $fields, null, 'id' );
		$this->assertArrayHasKey( 'comment_status', $fields, 'The default field is kept.' );
		$this->assertTrue( $fields['comment_status']['enableSorting'], 'The property is updated.' );
		$this->assertSame( 'text', $fields['comment_status']['type'], 'The rest of the default definition is kept.' );
		$this->assertSame(
			array(
				'registeredBy' => 'core',
				'updatedBy'    => array( 'test-plugin' ),
			),
			$fields['comment_status']['origin'],
			'Updating a field keeps who registered it and records who updated it.'
		);
		$this->assertArrayNotHasKey( 'author', $fields, 'The default field is removed.' );
	}

	/**
	 * The origin a field is registered with is stored on its definition,
	 * over any `origin` the definition sets; the default fields come from
	 * `core`.
	 */
	public function test_fields_carry_the_origin_they_are_registered_with() {
		$this->register_fields( 'postType', 'page', array( $this->field( 'color' ) + array( 'origin' => 'spoofed' ) ) );

		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'origin', 'id' );
		$this->assertSame(
			array(
				'registeredBy' => 'test-plugin',
				'updatedBy'    => array(),
			),
			$fields['color']
		);
		$this->assertSame( 'core', $fields['author']['registeredBy'] );
	}

	/**
	 * A field can only be registered once: registering the id of a
	 * registered field is refused and leaves it untouched.
	 */
	public function test_registering_a_registered_field_is_refused() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::register' );
		$registered = $this->register_fields(
			'postType',
			'page',
			array(
				$this->field( 'color' ),
				array(
					'id'    => 'author',
					'label' => 'Writer',
				),
			),
			'plugin/fields'
		);

		$this->assertFalse( $registered );
		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'page' ), null, 'id' );
		$this->assertArrayNotHasKey( 'color', $fields, 'None of the fields of the call is registered.' );
		$this->assertSame( 'Author', $fields['author']['label'], 'The registered field is left untouched.' );
		$this->assertArrayNotHasKey( 'plugin/fields', gutenberg_get_registered_field_modules( 'postType', 'page' ) );
	}

	/**
	 * Registering the same id twice in a call is refused.
	 */
	public function test_registering_the_same_field_twice_is_refused() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::register' );
		$registered = $this->register_fields( 'postType', 'page', array( $this->field( 'color' ), $this->field( 'color' ) ) );

		$this->assertFalse( $registered );
		$this->assertNotContains( 'color', array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'id' ) );
	}

	/**
	 * A field unregistered can be registered anew, with a new origin.
	 */
	public function test_an_unregistered_field_can_be_registered_again() {
		$registered = false;
		$this->on_fields_api_init(
			static function ( $registry ) use ( &$registered ) {
				$registry->unregister( 'postType', 'page', array( 'author' ) );
				$registered = $registry->register( 'test-plugin', 'postType', 'page', array( array( 'id' => 'author' ) ) );
			}
		);

		$this->assertTrue( $registered );
		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'page' ), null, 'id' );
		$this->assertSame(
			array(
				'id'     => 'author',
				'origin' => array(
					'registeredBy' => 'test-plugin',
					'updatedBy'    => array(),
				),
			),
			$fields['author']
		);
	}

	/**
	 * Entities are told apart by their kind and name, not by a key joining
	 * them: `a/b` + `c` and `a` + `b/c` are two entities, whose fields and
	 * script modules do not mix.
	 */
	public function test_entities_whose_kind_and_name_join_alike_are_kept_apart() {
		$result = array();
		$this->on_fields_api_init(
			function ( $registry ) use ( &$result ) {
				$result['first']        = $registry->register( 'test-plugin', 'a/b', 'c', array( $this->field( 'color' ) ), 'plugin/first' );
				$result['second']       = $registry->register( 'test-plugin', 'a', 'b/c', array( $this->field( 'color' ), $this->field( 'size' ) ), 'plugin/second' );
				$result['unregistered'] = $registry->unregister( 'a/b', 'c' );
			}
		);

		$this->assertTrue( $result['first'], 'The first entity registers its field.' );
		$this->assertTrue( $result['second'], 'The second entity registers a field with the same id.' );
		$this->assertSame( array( 'color' ), array_column( $result['unregistered'], 'id' ), 'Unregistering the first entity only removes its own field.' );
		$this->assertSame( array(), gutenberg_get_registered_fields( 'a/b', 'c' ) );
		$this->assertSame( array( 'color', 'size' ), array_column( gutenberg_get_registered_fields( 'a', 'b/c' ), 'id' ), 'The second entity keeps its fields.' );
		$this->assertSame( array( 'plugin/second' => array( 'color', 'size' ) ), gutenberg_get_registered_field_modules( 'a', 'b/c' ), 'The second entity keeps only its own module.' );
		$this->assertSame( array( 'b/c' => array( 'plugin/second' ) ), gutenberg_get_all_registered_field_modules()['a'], 'Only the second entity has modules under its kind.' );
		$this->assertArrayNotHasKey( 'a/b', gutenberg_get_all_registered_field_modules(), 'The kind of the first entity, emptied, is forgotten.' );
	}

	/**
	 * Unregistering returns the definitions it removes, in registration
	 * order and with their origin, whatever the order of the ids asked for;
	 * ids not registered are ignored, and nothing is returned when none is.
	 */
	public function test_unregistering_returns_the_unregistered_fields() {
		$unregistered = array();
		$this->on_fields_api_init(
			function ( $registry ) use ( &$unregistered ) {
				$registry->register( 'test-plugin', 'test', 'entity', array( $this->field( 'a' ), $this->field( 'b' ), $this->field( 'c' ) ), 'plugin/fields' );
				$unregistered['by_id']   = $registry->unregister( 'test', 'entity', array( 'c', 'missing', 'a' ) );
				$unregistered['missing'] = $registry->unregister( 'test', 'entity', array( 'a' ) );
				$unregistered['every']   = $registry->unregister( 'test', 'entity' );
				$unregistered['empty']   = $registry->unregister( 'test', 'entity' );
			}
		);

		$origin = array(
			'registeredBy' => 'test-plugin',
			'updatedBy'    => array(),
		);
		$this->assertSame(
			array(
				array_merge( $this->field( 'a' ), array( 'origin' => $origin ) ),
				array_merge( $this->field( 'c' ), array( 'origin' => $origin ) ),
			),
			$unregistered['by_id'],
			'The fields unregistered by id are returned in registration order.'
		);
		$this->assertSame( array(), $unregistered['missing'], 'Nothing is returned when no field is registered.' );
		$this->assertSame(
			array( array_merge( $this->field( 'b' ), array( 'origin' => $origin ) ) ),
			$unregistered['every'],
			'Unregistering every field returns them all.'
		);
		$this->assertSame( array(), $unregistered['empty'], 'Nothing is returned for an entity without fields.' );
		$this->assertSame( array(), gutenberg_get_registered_fields( 'test', 'entity' ), 'The entity has no fields left.' );
		$this->assertArrayNotHasKey( 'test', gutenberg_get_all_registered_field_modules(), 'The entity has no script module left.' );
	}

	/**
	 * Updating merges each definition into the registered field, keeping
	 * its position; the origin cannot be updated, and each origin that
	 * updates the field is recorded once, in update order. The script module
	 * applies to the field on top of the modules it has.
	 */
	public function test_updating_merges_into_the_registered_field() {
		$updated = array();
		$this->on_fields_api_init(
			static function ( $registry ) use ( &$updated ) {
				$update    = array(
					array(
						'id'     => 'author',
						'label'  => 'Writer',
						'origin' => 'spoofed',
					),
				);
				$updated[] = $registry->update( 'plugin-a', 'postType', 'page', $update, 'plugin/author' );
				$updated[] = $registry->update(
					'plugin-b',
					'postType',
					'page',
					array(
						array(
							'id'       => 'author',
							'readOnly' => true,
						),
					)
				);
				$updated[] = $registry->update(
					'plugin-a',
					'postType',
					'page',
					array(
						array(
							'id'    => 'author',
							'label' => 'Byline',
						),
					)
				);
			}
		);

		$this->assertSame( array( true, true, true ), $updated );
		$fields = gutenberg_get_registered_fields( 'postType', 'page' );
		$this->assertSame( 'author', $fields[0]['id'], 'The field keeps its position.' );
		$this->assertSame( 'Byline', $fields[0]['label'], 'The last update wins.' );
		$this->assertTrue( $fields[0]['readOnly'], 'The updates add up.' );
		$this->assertSame( 'integer', $fields[0]['type'], 'The rest of the definition is kept.' );
		$this->assertSame(
			array(
				'registeredBy' => 'core',
				'updatedBy'    => array( 'plugin-a', 'plugin-b' ),
			),
			$fields[0]['origin']
		);
		$modules = gutenberg_get_registered_field_modules( 'postType', 'page' );
		$this->assertContains( 'author', $modules['@wordpress/core-fields/post_supports'], 'The field keeps its modules.' );
		$this->assertSame( array( 'author' ), $modules['plugin/author'], 'The module applies to the field.' );
	}

	/**
	 * Only registered fields can be updated: updating a field that is not is
	 * refused and updates none of the fields of the call.
	 */
	public function test_updating_an_unregistered_field_is_refused() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::update' );
		$updated = true;
		$this->on_fields_api_init(
			static function ( $registry ) use ( &$updated ) {
				$updated = $registry->update(
					'test-plugin',
					'postType',
					'page',
					array(
						array(
							'id'    => 'author',
							'label' => 'Writer',
						),
						array(
							'id'    => 'color',
							'label' => 'Color',
						),
					),
					'plugin/fields'
				);
			}
		);

		$this->assertFalse( $updated );
		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'page' ), null, 'id' );
		$this->assertArrayNotHasKey( 'color', $fields, 'The field is not registered.' );
		$this->assertSame( 'Author', $fields['author']['label'], 'None of the fields of the call is updated.' );
		$this->assertSame( array(), $fields['author']['origin']['updatedBy'] );
		$this->assertArrayNotHasKey( 'plugin/fields', gutenberg_get_registered_field_modules( 'postType', 'page' ) );
	}

	/**
	 * An origin that is not a non-empty string is refused.
	 */
	public function test_registering_with_an_invalid_origin_is_refused() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::register' );
		$registered = true;
		$this->on_fields_api_init(
			static function ( $registry ) use ( &$registered ) {
				$registered = $registry->register( '', 'postType', 'page', array( array( 'id' => 'color' ) ) );
			}
		);

		$this->assertFalse( $registered );
		$this->assertNotContains( 'color', array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'id' ) );
	}

	/**
	 * Fields that are not a list, such as fields keyed by id, are refused.
	 */
	public function test_registering_fields_that_are_not_a_list_is_refused() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::register' );
		$registered = true;
		$this->on_fields_api_init(
			static function ( $registry ) use ( &$registered ) {
				$registered = $registry->register( 'test-plugin', 'postType', 'page', array( 'color' => array( 'id' => 'color' ) ) );
			}
		);

		$this->assertFalse( $registered );
		$this->assertNotContains( 'color', array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'id' ) );
	}

	/**
	 * Registering only runs on the action: elsewhere it is refused and the
	 * registry is left untouched. Before the action a registration would
	 * keep the defaults from being registered; after it the fields have been read and
	 * the import map of the editor script built from them.
	 */
	public function test_registering_outside_the_action_is_refused() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::register' );
		self::reset_registry();
		$registry = Gutenberg_Fields_Registry::get_instance();
		$fired    = did_action( 'fields_api_init' );

		$this->assertFalse( $registry->register( 'test-plugin', 'postType', 'page', array( $this->field( 'color' ) ), 'plugin/color' ) );
		$this->assertSame( $fired, did_action( 'fields_api_init' ), 'Refusing does not fire the action.' );
		$this->assertNotContains( 'color', array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'id' ) );
		$this->assertArrayNotHasKey( 'plugin/color', gutenberg_get_registered_field_modules( 'postType', 'page' ) );
	}

	/**
	 * Updating only runs on the action, like registering: elsewhere it is
	 * refused and the registry is left untouched.
	 */
	public function test_updating_outside_the_action_is_refused() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::update' );
		self::reset_registry();
		$registry = Gutenberg_Fields_Registry::get_instance();
		$fired    = did_action( 'fields_api_init' );

		$this->assertFalse(
			$registry->update(
				'test-plugin',
				'postType',
				'page',
				array(
					array(
						'id'    => 'author',
						'label' => 'Writer',
					),
				)
			)
		);
		$this->assertSame( $fired, did_action( 'fields_api_init' ), 'Refusing does not fire the action.' );
		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'page' ), null, 'id' );
		$this->assertSame( 'Author', $fields['author']['label'] );
	}

	/**
	 * Unregistering only runs on the action: elsewhere it is refused before
	 * reading the registry, so a stray call, from an `init` callback say,
	 * neither drops a default field nor fires the action early against
	 * post types still being registered.
	 */
	public function test_unregistering_outside_the_action_is_refused() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::unregister' );
		self::reset_registry();
		$registry = Gutenberg_Fields_Registry::get_instance();
		$fired    = did_action( 'fields_api_init' );

		$this->assertSame( array(), $registry->unregister( 'postType', 'page', array( 'author' ) ), 'Unregistering fields by id is refused.' );
		$this->assertSame( array(), $registry->unregister( 'postType', 'page' ), 'Unregistering every field is refused.' );
		$this->assertSame( $fired, did_action( 'fields_api_init' ), 'Refusing does not fire the action.' );
		$this->assertContains( 'author', array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'id' ), 'The default field is kept.' );
	}

	/**
	 * A read before `init` is refused and returns nothing, without firing
	 * the action: the post types the defaults derive from are registered on
	 * `init`, and the action fires once. The next read after `init` fires it.
	 */
	public function test_reading_before_init_does_not_fire_the_action() {
		global $wp_actions;

		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::initialize' );
		self::reset_registry();
		$fired = did_action( 'fields_api_init' );

		// did_action() counts the times a hook fired: forget `init` fired, as
		// before it runs.
		$did_init = $wp_actions['init'];
		unset( $wp_actions['init'] );
		try {
			$this->assertFalse( (bool) did_action( 'init' ) );
			$this->assertSame( array(), gutenberg_get_registered_fields( 'postType', 'page' ) );
			$this->assertSame( array(), gutenberg_get_all_registered_field_modules() );
			$this->assertSame( $fired, did_action( 'fields_api_init' ), 'A read before `init` does not fire the action.' );
		} finally {
			$wp_actions['init'] = $did_init;
		}

		$this->assertContains( 'author', array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'id' ), 'The next read fires the action and registers the defaults.' );
		$this->assertSame( $fired + 1, did_action( 'fields_api_init' ) );
	}

	/**
	 * A read during `init` is refused too: did_action() is true from the
	 * first `init` callback on, while the post types are still being
	 * registered. The next read after `init` fires the action.
	 */
	public function test_reading_during_init_does_not_fire_the_action() {
		global $wp_current_filter;

		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::initialize' );
		self::reset_registry();
		$fired = did_action( 'fields_api_init' );

		// doing_action() reads the stack of hooks being run: put `init` on it,
		// as when an `init` callback runs.
		$wp_current_filter[] = 'init';
		try {
			$this->assertTrue( doing_action( 'init' ) );
			$this->assertSame( array(), gutenberg_get_registered_fields( 'postType', 'page' ) );
			$this->assertSame( array(), gutenberg_get_all_registered_field_modules() );
			$this->assertSame( $fired, did_action( 'fields_api_init' ), 'A read during `init` does not fire the action.' );
		} finally {
			array_pop( $wp_current_filter );
		}

		$this->assertContains( 'author', array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'id' ), 'The next read fires the action and registers the defaults.' );
		$this->assertSame( $fired + 1, did_action( 'fields_api_init' ) );
	}

	/**
	 * The post editor preloads the fields of the edited post type, with the
	 * path the `getFieldsConfig` core data resolver requests.
	 */
	public function test_the_post_editor_preloads_the_fields_of_the_post_type() {
		$post    = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$context = new WP_Block_Editor_Context( array( 'post' => $post ) );

		$paths = apply_filters( 'block_editor_rest_api_preload_paths', array(), $context );

		$this->assertContains( '/wp/v2/fields?kind=postType&name=page', $paths );
	}

	/**
	 * The preloaded path serves the fields of the post type.
	 */
	public function test_the_preloaded_fields_path_serves_the_fields() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$post    = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$context = new WP_Block_Editor_Context( array( 'post' => $post ) );
		$paths   = _gutenberg_preload_entity_fields( array(), $context );

		$preloaded = array_reduce( $paths, 'rest_preload_api_request', array() );

		$this->assertSame( 'page', $preloaded[ $paths[0] ]['body']['name'] );
		$this->assertContains( 'author', wp_list_pluck( $preloaded[ $paths[0] ]['body']['fields'], 'id' ) );
	}

	/**
	 * The site editor preloads the fields of the post types its screen lists,
	 * from the `p` query arg.
	 *
	 * @dataProvider data_site_editor_screens
	 *
	 * @param string   $path       The `p` query arg.
	 * @param string[] $post_types The post types whose fields are preloaded.
	 */
	public function test_the_site_editor_preloads_the_fields_of_its_screen( $path, $post_types ) {
		$_GET['p'] = $path;
		$context   = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );

		$paths = _gutenberg_preload_entity_fields( array(), $context );
		unset( $_GET['p'] );

		$expected = array();
		foreach ( $post_types as $post_type ) {
			$expected[] = '/wp/v2/fields?kind=postType&name=' . $post_type;
		}
		$this->assertSame( $expected, $paths );
	}

	/**
	 * Data provider for test_the_site_editor_preloads_the_fields_of_its_screen().
	 *
	 * @return array[]
	 */
	public function data_site_editor_screens() {
		return array(
			'pages'         => array( '/page', array( 'page' ) ),
			'page'          => array( '/page/12', array( 'page' ) ),
			'templates'     => array( '/template', array( 'wp_template' ) ),
			'template'      => array( '/wp_template/emptytheme//index', array( 'wp_template' ) ),
			'patterns'      => array( '/pattern', array( 'wp_block', 'wp_template_part' ) ),
			'pattern'       => array( '/wp_block/12', array( 'wp_block' ) ),
			'template part' => array( '/wp_template_part/emptytheme//header', array( 'wp_template_part' ) ),
			'root'          => array( '/', array() ),
			'styles'        => array( '/styles', array() ),
			'navigation'    => array( '/navigation', array() ),
		);
	}

	/**
	 * The site editor preloads the fields of the edited post, once, next to
	 * those of its screen.
	 */
	public function test_the_site_editor_preloads_the_fields_of_the_edited_post() {
		$post      = self::factory()->post->create_and_get( array( 'post_type' => 'page' ) );
		$_GET['p'] = '/page';
		$context   = new WP_Block_Editor_Context(
			array(
				'name' => 'core/edit-site',
				'post' => $post,
			)
		);

		$paths = _gutenberg_preload_entity_fields( array(), $context );
		unset( $_GET['p'] );

		$this->assertSame( array( '/wp/v2/fields?kind=postType&name=page' ), $paths );
	}

	/**
	 * Other editors, a post editor context without a post, and a site editor
	 * screen that lists no post fields are left untouched.
	 */
	public function test_other_editors_do_not_preload_the_fields() {
		$site_editor = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );
		$no_post     = new WP_Block_Editor_Context( array( 'name' => 'core/edit-post' ) );
		$widgets     = new WP_Block_Editor_Context( array( 'name' => 'core/edit-widgets' ) );

		$this->assertSame( array(), _gutenberg_preload_entity_fields( array(), $site_editor ) );
		$this->assertSame( array(), _gutenberg_preload_entity_fields( array(), $no_post ) );
		$this->assertSame( array(), _gutenberg_preload_entity_fields( array(), $widgets ) );
	}
}
