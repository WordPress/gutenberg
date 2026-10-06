<?php
/**
 * Tests for the entity fields API.
 *
 * @package gutenberg
 *
 * @covers ::_gutenberg_add_field_modules_to_editor_script
 * @covers ::gutenberg_get_field_collection_fields
 * @covers ::_gutenberg_get_field_collection
 * @covers ::gutenberg_register_field_collection
 * @covers ::gutenberg_register_core_post_type_supports_fields
 * @covers ::gutenberg_register_core_field_collections
 * @covers Gutenberg_Fields_Registry::initialize
 * @covers Gutenberg_Fields_Registry::register
 * @covers Gutenberg_Fields_Registry::unregister
 */
class Tests_Fields_API extends WP_UnitTestCase {

	/**
	 * The ids of the default fields every post type gets, whatever it
	 * supports, but for the design post types, which exclude some of them.
	 *
	 * @var string[]
	 */
	const EVERY_POST_TYPE_FIELDS = array( 'date', 'last_edited_date', 'password', 'scheduled_date', 'status', 'template' );

	/**
	 * The ids of the default fields the design post types exclude: those
	 * about publishing a post, and the template that renders it.
	 *
	 * @var string[]
	 */
	const DESIGN_EXCLUDED_FIELDS = array( 'date', 'password', 'scheduled_date', 'slug', 'status', 'template' );

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
	 * @return string[] The ids of the fields registered.
	 */
	private function register_fields( $kind, $name, $fields, $module = null ) {
		$registered = array();
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
	 * The ids of the fields registered on a post type, but for the defaults
	 * every post type gets, see EVERY_POST_TYPE_FIELDS.
	 *
	 * @param string $post_type The post type.
	 * @return string[] The ids, in registration order.
	 */
	private static function get_support_field_ids( $post_type ) {
		return self::without_every_post_type_fields( array_column( gutenberg_get_registered_fields( 'postType', $post_type ), 'id' ) );
	}

	/**
	 * Removes the defaults every post type gets from a list of field ids.
	 *
	 * @param string[] $ids The field ids.
	 * @return string[] The ids, but for those of EVERY_POST_TYPE_FIELDS.
	 */
	private static function without_every_post_type_fields( $ids ) {
		return array_values( array_diff( $ids, self::EVERY_POST_TYPE_FIELDS ) );
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
				'id'     => '@wordpress/core-fields/post_type_supports',
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

		$this->assertSame( array( 'author', 'comment_status', 'discussion', 'notesCount', 'post-content-info', 'title' ), self::without_every_post_type_fields( array_column( $fields, 'id' ) ) );
		$this->assertSame( array( 'core' ), array_unique( array_column( array_column( $fields, 'origin' ), 'registeredBy' ) ), 'The fields carry the origin of their collection.' );
		$this->assertSame(
			array( '@wordpress/core-fields/post_type_supports' => array_column( $fields, 'id' ) ),
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
	 * The defaults derived from a single support, each with the supports
	 * that give it to a post type.
	 *
	 * @return array[] The id of each field and the supports that give it.
	 */
	public function data_default_fields_and_their_supports() {
		return array(
			'discussion'        => array( 'discussion', array( 'comments', 'trackbacks' ) ),
			'excerpt'           => array( 'excerpt', array( 'excerpt' ) ),
			'parent'            => array( 'parent', array( 'page-attributes' ) ),
			'ping_status'       => array( 'ping_status', array( 'trackbacks' ) ),
			'title'             => array( 'title', array( 'title' ) ),
			'post-content-info' => array( 'post-content-info', array( 'editor' ) ),
		);
	}

	/**
	 * The defaults every post type gets, whatever it supports, each with
	 * whether the design post types exclude it.
	 *
	 * @return array[] The id of each field and whether the design post
	 *                 types exclude it.
	 */
	public function data_default_fields_of_every_post_type() {
		return array(
			'date'             => array( 'date', true ),
			'last_edited_date' => array( 'last_edited_date', false ),
			'password'         => array( 'password', true ),
			'scheduled_date'   => array( 'scheduled_date', true ),
			'status'           => array( 'status', true ),
			'template'         => array( 'template', true ),
		);
	}

	/**
	 * A default field of every post type is registered on a post type
	 * supporting nothing, and on the design post types unless they exclude
	 * it.
	 *
	 * @dataProvider data_default_fields_of_every_post_type
	 *
	 * @param string $field_id              The id of the field.
	 * @param bool   $excluded_for_design The design post types exclude it.
	 */
	public function test_a_default_field_of_every_post_type( $field_id, $excluded_for_design ) {
		$this->assertContains( $field_id, self::EVERY_POST_TYPE_FIELDS, 'The tests know the field applies to every post type.' );
		$this->register_post_types( array( 'gutenberg_plain' => array( 'title' ) ) );
		self::reset_registry();

		$this->assertContains( $field_id, array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_plain' ), 'id' ) );
		foreach ( array( 'wp_template', 'wp_template_part', 'wp_block', 'wp_navigation' ) as $post_type ) {
			$ids = array_column( gutenberg_get_registered_fields( 'postType', $post_type ), 'id' );
			if ( $excluded_for_design ) {
				$this->assertNotContains( $field_id, $ids, "$post_type excludes the field." );
			} else {
				$this->assertContains( $field_id, $ids, "$post_type gets the field." );
			}
		}
	}

	/**
	 * A default field is registered on the post types with one of its
	 * supports, and only on them.
	 *
	 * @dataProvider data_default_fields_and_their_supports
	 *
	 * @param string   $field_id The id of the field.
	 * @param string[] $supports The supports that give the field.
	 */
	public function test_a_default_field_follows_its_supports( $field_id, $supports ) {
		$with_support = array();
		foreach ( $supports as $index => $support ) {
			$with_support[ "gutenberg_with_$index" ] = array( 'title', $support );
		}
		$this->register_post_types( $with_support + array( 'gutenberg_without' => array( 'author' ) ) );

		self::reset_registry();

		foreach ( array_keys( $with_support ) as $post_type ) {
			$this->assertContains( $field_id, array_column( gutenberg_get_registered_fields( 'postType', $post_type ), 'id' ), "$post_type gets the field." );
		}
		$this->assertNotContains( $field_id, array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_without' ), 'id' ) );
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

		$this->assertStringContainsString( 'function gutenberg_register_core_post_type_supports_fields( $registry )', $built );
		$this->assertStringContainsString( 'function gutenberg_register_core_field_collections( $registry )', $built );
		$this->assertStringContainsString( "gutenberg_get_field_collection_fields( __DIR__ . '/post_type_supports' );", $built );
		$this->assertStringContainsString( 'gutenberg_register_core_post_type_supports_fields( $registry );', $built );
		$this->assertStringContainsString( "gutenberg_register_field_collection( \$registry, __DIR__ . '/wp_template' );", $built );
		$this->assertStringContainsString( "add_action( 'fields_api_init', 'gutenberg_register_core_field_collections', 0 );", $built );
		$this->assertStringNotContainsString( 'wp_register_field_collection', $built );
		$this->assertStringNotContainsString( 'wp_get_field_collection_fields', $built );
		$this->assertSame(
			strtr(
				$source,
				array(
					'wp_register_field_collection'    => 'gutenberg_register_field_collection',
					'wp_get_field_collection_fields'  => 'gutenberg_get_field_collection_fields',
					'register_core_post_type_supports_fields' => 'gutenberg_register_core_post_type_supports_fields',
					'register_core_field_collections' => 'gutenberg_register_core_field_collections',
				)
			),
			$built,
			'Only the function names change.'
		);
	}

	/**
	 * The default fields come from the `field.php` files of the
	 * `post_type_supports` folder.
	 */
	public function test_the_default_fields_come_from_the_post_type_supports_folder() {
		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'post' ), null, 'id' );
		$this->assertSame( 'integer', $fields['author']['type'] );
		$this->assertSame( 'core', $fields['author']['origin']['registeredBy'] );
		$this->assertSame( 'radio', $fields['comment_status']['Edit'] );
		$this->assertSame( 'boolean', $fields['ping_status']['type'] );
		$this->assertSame( 'Discussion', $fields['discussion']['label'] );
		$this->assertSame( 'textarea', $fields['excerpt']['Edit']['control'] );
		$this->assertTrue( $fields['post-content-info']['readOnly'] );
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
		$this->assertFalse( function_exists( 'register_core_post_type_supports_fields' ), 'The Gutenberg build prefixes the function.' );
	}

	/**
	 * The defaults make no exception for any post type: on their own, they
	 * register the author field on templates, template parts, and
	 * attachments, which support authors.
	 */
	public function test_the_defaults_make_no_exception() {
		remove_action( 'fields_api_init', 'gutenberg_register_core_field_collections', 0 );
		$this->core_collections_unhooked = true;
		$this->on_fields_api_init( 'gutenberg_register_core_post_type_supports_fields', 0 );

		foreach ( array( 'wp_template', 'wp_template_part', 'attachment' ) as $post_type ) {
			$fields = array_column( gutenberg_get_registered_fields( 'postType', $post_type ), null, 'id' );
			$this->assertArrayHasKey( 'author', $fields, "The defaults register the author field on $post_type." );
			$this->assertSame( 'integer', $fields['author']['type'] );
		}
	}

	/**
	 * Template parts support authors but their author is the theme, plugin,
	 * site, or user that provides them: they opt out of the default author
	 * field and their collection has its own, with its own script module.
	 */
	public function test_template_parts_get_their_own_author_field() {
		$this->assertTrue( post_type_supports( 'wp_template_part', 'author' ), 'The post type supports authors.' );

		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'wp_template_part' ), null, 'id' );
		$this->assertSame( array( 'author', 'title' ), self::get_support_field_ids( 'wp_template_part' ), 'The fields are the ones of the collection, not the default author and title fields.' );
		$this->assertArrayNotHasKey( 'type', $fields['author'], 'The template part author is not the integer post author.' );
		$this->assertArrayHasKey( 'title', $fields, 'The collection registers the template part title.' );
		$this->assertSame( 'Title', $fields['title']['label'], 'The title is the one of the collection.' );
		$this->assertSame(
			array( 'author', 'title' ),
			gutenberg_get_registered_field_modules( 'postType', 'wp_template_part' )['@wordpress/core-fields/wp_template_part']
		);
	}

	/**
	 * Patterns have their description, title, and sync status in their
	 * collection instead of the default excerpt and title fields.
	 */
	public function test_patterns_get_their_own_fields() {
		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'wp_block' ), null, 'id' );
		$this->assertArrayHasKey( 'excerpt', $fields );
		$this->assertArrayHasKey( 'sync-status', $fields );
		$this->assertArrayHasKey( 'title', $fields );
		$this->assertSame( 'Description', $fields['excerpt']['label'] );
		$this->assertSame( 'Title', $fields['title']['label'] );
		$this->assertTrue( $fields['sync-status']['readOnly'] );
		$this->assertSame(
			array( 'excerpt', 'sync-status', 'title' ),
			gutenberg_get_registered_field_modules( 'postType', 'wp_block' )['@wordpress/core-fields/wp_block']
		);
	}

	/**
	 * The slug field is registered on the viewable post types, which have a
	 * permalink, but for the design ones.
	 */
	public function test_the_viewable_post_types_get_the_slug_field() {
		register_post_type(
			'gutenberg_book',
			array(
				'public'       => true,
				'show_in_rest' => true,
			)
		);
		register_post_type(
			'gutenberg_note',
			array(
				'public'       => false,
				'show_in_rest' => true,
			)
		);
		$this->post_types[] = 'gutenberg_book';
		$this->post_types[] = 'gutenberg_note';
		self::reset_registry();

		$this->assertContains( 'slug', array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_book' ), 'id' ) );
		$this->assertNotContains( 'slug', array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_note' ), 'id' ), 'A post type that is not viewable has no permalink.' );
		$this->assertContains( 'slug', array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'id' ) );
		$this->assertNotContains( 'slug', array_column( gutenberg_get_registered_fields( 'postType', 'wp_template' ), 'id' ) );
	}

	/**
	 * Only posts have sticky posts, so only they get the sticky field.
	 */
	public function test_only_posts_get_the_sticky_field() {
		$this->register_post_types( array( 'gutenberg_book' => array( 'title', 'editor' ) ) );
		self::reset_registry();

		$this->assertContains( 'sticky', array_column( gutenberg_get_registered_fields( 'postType', 'post' ), 'id' ) );
		$this->assertNotContains( 'sticky', array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'id' ) );
		$this->assertNotContains( 'sticky', array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_book' ), 'id' ) );
	}

	/**
	 * The featured media field needs the post type to support `thumbnail`
	 * and the theme to support post thumbnails for that post type, which a
	 * theme may opt into for some post types only.
	 */
	public function test_the_featured_media_field_follows_the_post_type_support_and_the_theme() {
		$this->register_post_types(
			array(
				'gutenberg_book' => array( 'title', 'thumbnail' ),
				'gutenberg_note' => array( 'title', 'thumbnail' ),
				'gutenberg_page' => array( 'title' ),
			)
		);
		$original_support = get_theme_support( 'post-thumbnails' );

		try {
			// Naming post types only narrows the support when the theme does
			// not already support post thumbnails for every post type.
			remove_theme_support( 'post-thumbnails' );
			add_theme_support( 'post-thumbnails', array( 'gutenberg_book' ) );
			self::reset_registry();

			$this->assertContains( 'featured_media', self::get_support_field_ids( 'gutenberg_book' ) );
			$this->assertNotContains(
				'featured_media',
				self::get_support_field_ids( 'gutenberg_note' ),
				'The theme did not opt the post type into post thumbnails.'
			);
			$this->assertNotContains(
				'featured_media',
				self::get_support_field_ids( 'gutenberg_page' ),
				'The post type does not support thumbnails.'
			);

			// A theme may also opt every post type in at once.
			remove_theme_support( 'post-thumbnails' );
			add_theme_support( 'post-thumbnails' );
			self::reset_registry();

			$this->assertContains( 'featured_media', self::get_support_field_ids( 'gutenberg_note' ) );

			remove_theme_support( 'post-thumbnails' );
			self::reset_registry();

			$this->assertNotContains(
				'featured_media',
				self::get_support_field_ids( 'gutenberg_book' ),
				'A theme without post thumbnails has no featured image to set.'
			);
		} finally {
			remove_theme_support( 'post-thumbnails' );
			if ( is_array( $original_support ) ) {
				add_theme_support( 'post-thumbnails', ...$original_support );
			} elseif ( true === $original_support ) {
				add_theme_support( 'post-thumbnails' );
			}
		}
	}

	/**
	 * The format field needs the post type to support `post-formats` and
	 * the theme to support post formats: a theme without formats has none
	 * to assign. Its elements are the formats of the theme, plus
	 * `standard`, which the themes route exposes for every theme
	 * supporting formats, sorted by label.
	 *
	 * It has a test of its own rather than a row in
	 * data_default_fields_and_their_supports(), whose fields follow a post
	 * type support alone.
	 */
	public function test_the_format_field_follows_the_post_type_support_and_the_theme() {
		$this->register_post_types(
			array(
				'gutenberg_book' => array( 'title', 'post-formats' ),
				'gutenberg_note' => array( 'title' ),
			)
		);
		$original_support = get_theme_support( 'post-formats' );

		try {
			add_theme_support( 'post-formats', array( 'gallery', 'aside' ) );
			self::reset_registry();
			$fields = array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_book' ), null, 'id' );

			$this->assertArrayHasKey( 'format', $fields );
			$this->assertNotContains(
				'format',
				array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_note' ), 'id' ),
				'A post type that does not support post formats has no format field.'
			);
			$this->assertSame(
				array( 'aside', 'gallery', 'standard' ),
				array_column( $fields['format']['elements'], 'value' ),
				'The elements are the formats of the theme, plus standard, sorted by label.'
			);

			remove_theme_support( 'post-formats' );
			self::reset_registry();

			$this->assertNotContains(
				'format',
				array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_book' ), 'id' ),
				'A theme without post formats has none to assign.'
			);
		} finally {
			remove_theme_support( 'post-formats' );
			if ( is_array( $original_support ) ) {
				add_theme_support( 'post-formats', ...$original_support );
			}
		}
	}

	/**
	 * Pages support titles but their title shows the page's role on the
	 * site: they opt out of the default title field and their collection has
	 * its own, with its own script module.
	 */
	public function test_pages_get_their_own_title_field() {
		$fields  = array_column( gutenberg_get_registered_fields( 'postType', 'page' ), null, 'id' );
		$modules = gutenberg_get_registered_field_modules( 'postType', 'page' );

		$this->assertFalse( $fields['title']['enableHiding'], 'The page title is the one of the collection.' );
		$this->assertSame( 'core', $fields['title']['origin']['registeredBy'] );
		$this->assertSame( array( 'title' ), $modules['@wordpress/core-fields/page'] );
		$this->assertNotContains( 'title', $modules['@wordpress/core-fields/post_type_supports'], 'The default title field is not registered.' );
	}

	/**
	 * Patterns support excerpts but their excerpt is their description,
	 * which their collection defines with a field of the same id, so they
	 * opt out of the default excerpt field.
	 */
	public function test_patterns_do_not_get_the_default_excerpt_field() {
		$this->assertTrue( post_type_supports( 'wp_block', 'excerpt' ), 'The post type supports excerpts.' );

		$modules = gutenberg_get_registered_field_modules( 'postType', 'wp_block' );
		$this->assertContains( 'excerpt', $modules['@wordpress/core-fields/wp_block'], 'The excerpt is the description field of the collection.' );
		$this->assertNotContains( 'excerpt', $modules['@wordpress/core-fields/post_type_supports'], 'The default excerpt field is not registered.' );
	}

	/**
	 * Navigation menus support the editor, but their content is blocks
	 * laying out a site rather than text to read, so they opt out of the
	 * content information field. Patterns keep it.
	 */
	public function test_navigation_menus_do_not_get_the_content_information_field() {
		$this->assertTrue( post_type_supports( 'wp_navigation', 'editor' ), 'The post type supports the editor.' );
		$this->assertNotContains( 'post-content-info', array_column( gutenberg_get_registered_fields( 'postType', 'wp_navigation' ), 'id' ) );
		$this->assertContains( 'post-content-info', array_column( gutenberg_get_registered_fields( 'postType', 'wp_block' ), 'id' ) );
	}

	/**
	 * Templates support authors but their author is the theme, plugin, site,
	 * or user that provides them: they opt out of the default author field
	 * and their collection has its own, with its own script module.
	 */
	public function test_templates_get_their_own_author_field() {
		$this->assertTrue( post_type_supports( 'wp_template', 'author' ), 'The post type supports authors.' );

		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'wp_template' ), null, 'id' );
		$this->assertSame( array( 'author', 'default_comment_status', 'description', 'description_readonly', 'posts_page_title', 'posts_per_page', 'title' ), self::get_support_field_ids( 'wp_template' ), 'The fields are the ones of the collection, not the default author and title fields.' );
		$this->assertSame( 'Template', $fields['title']['label'], 'The title is the one of the collection.' );
		$this->assertArrayNotHasKey( 'type', $fields['author'], 'The template author is not the integer post author.' );
		$this->assertSame( 'core', $fields['author']['origin']['registeredBy'] );
		$this->assertSame(
			array( 'author', 'default_comment_status', 'description', 'description_readonly', 'posts_page_title', 'posts_per_page', 'title' ),
			gutenberg_get_registered_field_modules( 'postType', 'wp_template' )['@wordpress/core-fields/wp_template'],
			'The fields of templates ship their JavaScript parts in the module of the collection.'
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
		$modules = gutenberg_get_registered_field_modules( 'postType', 'wp_template' );
		$this->assertNotContains( 'author', $modules['@wordpress/core-fields/wp_template'] ?? array(), 'The module of the replaced field no longer applies to it.' );
	}

	/**
	 * Attachments support authors and comments but the media editor has its
	 * own fields, so they opt out of every default field and their
	 * collection has the media fields, with its script module.
	 */
	public function test_attachments_get_the_media_fields_instead_of_the_defaults() {
		$this->assertTrue( post_type_supports( 'attachment', 'author' ), 'The post type supports authors.' );
		$this->assertTrue( post_type_supports( 'attachment', 'comments' ), 'The post type supports comments.' );

		$ids    = array( 'alt_text', 'attached_to', 'author', 'caption', 'date', 'description', 'filename', 'filesize', 'media_dimensions', 'mime_type', 'title' );
		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'attachment' ), null, 'id' );
		$this->assertSame( $ids, array_keys( $fields ), 'Only the media fields are registered.' );
		$this->assertSame( 'datetime', $fields['date']['type'], 'The media fields come from the attachment collection.' );
		$this->assertSame( 'core', $fields['date']['origin']['registeredBy'] );
		$this->assertSame(
			array( '@wordpress/core-fields/attachment' => $ids ),
			gutenberg_get_registered_field_modules( 'postType', 'attachment' ),
			'Every media field is registered with the module of the collection.'
		);
	}

	/**
	 * A plugin registering attachment fields keeps them next to the media
	 * fields.
	 */
	public function test_attachments_keep_the_fields_plugins_register() {
		$this->register_fields( 'postType', 'attachment', array( $this->field( 'credit' ) ) );

		$ids = array_column( gutenberg_get_registered_fields( 'postType', 'attachment' ), 'id' );
		$this->assertContains( 'date', $ids, 'The media fields are kept.' );
		$this->assertSame( 'credit', end( $ids ), 'The plugin field follows the media fields.' );
	}

	/**
	 * The site is not a post type: its collection has all of its fields,
	 * the ones the identity screen of the site editor shows, with its
	 * script module.
	 */
	public function test_the_site_gets_the_fields_of_its_collection() {
		$ids    = array( 'description', 'site_icon', 'site_logo', 'title' );
		$fields = array_column( gutenberg_get_registered_fields( 'root', 'site' ), null, 'id' );
		$this->assertSame( $ids, array_keys( $fields ) );
		$this->assertSame( 'text', $fields['title']['type'] );
		$this->assertSame( 'media', $fields['site_logo']['type'] );
		$this->assertSame( 'core', $fields['title']['origin']['registeredBy'] );
		$this->assertSame(
			array( '@wordpress/core-fields/root_site' => $ids ),
			gutenberg_get_registered_field_modules( 'root', 'site' ),
			'Every field of the site is registered with the module of the collection.'
		);
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

		$this->assertSame( array( 'author', 'discussion', 'title' ), self::get_support_field_ids( 'gutenberg_book' ) );
		$this->assertSame( array( 'author', 'comment_status', 'discussion', 'title' ), self::get_support_field_ids( 'gutenberg_note' ), 'The other post types keep the field.' );
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

		$this->assertSame( array( 'issue' ), self::get_support_field_ids( 'gutenberg_magazine' ) );
		$this->assertSame( array(), gutenberg_get_registered_field_modules( 'postType', 'gutenberg_magazine' ), 'A collection without module registers none.' );
		$this->assertSame( array( 'secret' ), self::get_support_field_ids( 'gutenberg_hidden' ), 'A post type not exposed in the REST API gets its fields too.' );
	}

	/**
	 * There is no precedence between collections: a field of a collection
	 * that redefines a field registered before it is skipped by the registry,
	 * like a plugin registering it twice.
	 */
	public function test_a_collection_redefining_a_registered_field_is_skipped() {
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

		$this->assertFalse( $result, 'A collection that loses a field returns false.' );
		$this->assertSame( array( 'authorship' ), array_column( $fields, 'id' ) );
		$this->assertSame( 'Authorship', $fields[0]['label'], 'The field registered first is kept.' );
	}

	/**
	 * Records the `_doing_it_wrong()` notices a method reports, so a test can
	 * assert what the notice names.
	 *
	 * @param string $method The method whose notices to record.
	 * @return array A list that fills with the reported messages.
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
	 * A field can only be registered once: a field with the id of a
	 * registered field is skipped and leaves it untouched, and the rest of
	 * the fields of the call are registered.
	 */
	public function test_registering_a_registered_field_is_skipped() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::register' );
		$reported   = &$this->record_notices( 'Gutenberg_Fields_Registry::register' );
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

		$this->assertSame( array( 'color' ), $registered, 'The ids of the fields registered are returned.' );
		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'page' ), null, 'id' );
		$this->assertArrayHasKey( 'color', $fields, 'The rest of the fields of the call are registered.' );
		$this->assertSame( 'Author', $fields['author']['label'], 'The registered field is left untouched.' );
		$this->assertSame( 'core', $fields['author']['origin']['registeredBy'] );
		$this->assertSame( array( 'color' ), gutenberg_get_registered_field_modules( 'postType', 'page' )['plugin/fields'], 'The script module only applies to the fields registered.' );
		$this->assertCount( 1, $reported );
		$this->assertStringContainsString( 'postType "page"', $reported[0], 'The notice names the entity.' );
		$this->assertStringContainsString( 'already registered: author', $reported[0], 'The notice names the field that is already registered, not the others of the call.' );
	}

	/**
	 * An id that appears more than once in a call is registered once, with
	 * its first definition, and the rest of the fields of the call are
	 * registered.
	 */
	public function test_registering_the_same_field_twice_keeps_the_first_definition() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::register' );
		$reported   = &$this->record_notices( 'Gutenberg_Fields_Registry::register' );
		$registered = $this->register_fields(
			'postType',
			'page',
			array(
				$this->field( 'color' ),
				array(
					'id'    => 'color',
					'label' => 'Colour',
				),
				$this->field( 'size' ),
			)
		);

		$this->assertSame( array( 'color', 'size' ), $registered );
		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'page' ), null, 'id' );
		$this->assertSame( $this->field( 'color' )['label'], $fields['color']['label'], 'The first definition is kept.' );
		$this->assertArrayHasKey( 'size', $fields, 'The rest of the fields of the call are registered.' );
		$this->assertCount( 1, $reported );
		$this->assertStringContainsString( 'postType "page"', $reported[0], 'The notice names the entity.' );
		$this->assertStringContainsString( 'more than once in the same call: color', $reported[0], 'The notice names the duplicated field.' );
	}

	/**
	 * A field unregistered can be registered anew, with a new origin.
	 */
	public function test_an_unregistered_field_can_be_registered_again() {
		$registered = array();
		$this->on_fields_api_init(
			static function ( $registry ) use ( &$registered ) {
				$registry->unregister( 'postType', 'page', array( 'author' ) );
				$registered = $registry->register( 'test-plugin', 'postType', 'page', array( array( 'id' => 'author' ) ) );
			}
		);

		$this->assertSame( array( 'author' ), $registered );
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

		$this->assertSame( array( 'color' ), $result['first'], 'The first entity registers its field.' );
		$this->assertSame( array( 'color', 'size' ), $result['second'], 'The second entity registers a field with the same id.' );
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

		$this->assertSame( array( array( 'author' ), array( 'author' ), array( 'author' ) ), $updated );
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
		$this->assertContains( 'author', $modules['@wordpress/core-fields/post_type_supports'], 'The field keeps its modules.' );
		$this->assertSame( array( 'author' ), $modules['plugin/author'], 'The module applies to the field.' );
	}

	/**
	 * A field whose `type` DataViews does not provide renders without a
	 * control, so it is reported, and registered anyway. A field without a
	 * `type` is not reported.
	 */
	public function test_registering_a_field_with_an_unknown_type_is_reported() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::register' );
		$reported   = &$this->record_notices( 'Gutenberg_Fields_Registry::register' );
		$registered = $this->register_fields(
			'postType',
			'page',
			array(
				$this->field( 'color' ),
				array(
					'id'    => 'size',
					'type'  => 'interger',
					'label' => 'Size',
				),
				array(
					'id'    => 'weight',
					'label' => 'Weight',
				),
			)
		);

		$this->assertSame( array( 'color', 'size', 'weight' ), $registered, 'The field is registered anyway.' );
		$this->assertCount( 1, $reported );
		$this->assertStringContainsString( 'postType "page"', $reported[0], 'The notice names the entity.' );
		$this->assertStringContainsString( ': size (type is not one of ', $reported[0], 'The notice names the field and the error of its type, not the others of the call.' );
	}

	/**
	 * Only registered fields can be updated: a field that is not is skipped,
	 * and the rest of the fields of the call are updated.
	 */
	public function test_updating_an_unregistered_field_is_skipped() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::update' );
		$reported = &$this->record_notices( 'Gutenberg_Fields_Registry::update' );
		$updated  = array();
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

		$this->assertSame( array( 'author' ), $updated, 'The ids of the fields updated are returned.' );
		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'page' ), null, 'id' );
		$this->assertArrayNotHasKey( 'color', $fields, 'The field is not registered.' );
		$this->assertSame( 'Writer', $fields['author']['label'], 'The rest of the fields of the call are updated.' );
		$this->assertSame( array( 'test-plugin' ), $fields['author']['origin']['updatedBy'] );
		$this->assertSame( array( 'author' ), gutenberg_get_registered_field_modules( 'postType', 'page' )['plugin/fields'], 'The script module only applies to the fields updated.' );
		$this->assertCount( 1, $reported );
		$this->assertStringContainsString( 'postType "page"', $reported[0], 'The notice names the entity.' );
		$this->assertStringContainsString( 'not registered: color', $reported[0], 'The notice names only the field that is not registered.' );
	}

	/**
	 * A definition that is not an array with a non-empty string `id` is
	 * reported by its position and skipped, like a duplicated field: the
	 * rest of the fields of the call are registered, or updated.
	 */
	public function test_an_invalid_definition_is_skipped() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::register' );
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::update' );
		$reported   = &$this->record_notices( 'Gutenberg_Fields_Registry::register' );
		$registered = null;
		$updated    = null;
		$this->on_fields_api_init(
			function ( $registry ) use ( &$registered, &$updated ) {
				$registered = $registry->register(
					'test-plugin',
					'postType',
					'page',
					array(
						$this->field( 'color' ),
						'size',
						array( 'label' => 'No id' ),
						array(
							'id'    => 7,
							'label' => 'Numeric id',
						),
						$this->field( 'weight' ),
					)
				);
				$updated    = $registry->update(
					'test-plugin',
					'postType',
					'page',
					array(
						array( 'label' => 'No id' ),
						array(
							'id'    => 'color',
							'label' => 'Colour',
						),
					)
				);
			}
		);

		$this->assertSame( array( 'color', 'weight' ), $registered, 'The valid definitions are registered.' );
		$this->assertSame( array( 'color' ), $updated, 'The valid definitions are updated.' );
		$fields = array_column( gutenberg_get_registered_fields( 'postType', 'page' ), null, 'id' );
		$this->assertSame( 'Colour', $fields['color']['label'] );
		$this->assertArrayHasKey( 'weight', $fields );
		$this->assertCount( 1, $reported );
		$this->assertStringContainsString( 'postType "page"', $reported[0], 'The notice names the entity.' );
		$this->assertStringContainsString( 'skipped: #2, #3, #4', $reported[0], 'The notice names the positions of the invalid definitions.' );
	}

	/**
	 * An origin that is not a non-empty string is refused.
	 */
	public function test_registering_with_an_invalid_origin_is_refused() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::register' );
		$registered = null;
		$this->on_fields_api_init(
			static function ( $registry ) use ( &$registered ) {
				$registered = $registry->register( '', 'postType', 'page', array( array( 'id' => 'color' ) ) );
			}
		);

		$this->assertSame( array(), $registered );
		$this->assertNotContains( 'color', array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'id' ) );
	}

	/**
	 * Fields that are not a list, such as fields keyed by id, are refused.
	 */
	public function test_registering_fields_that_are_not_a_list_is_refused() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::register' );
		$registered = null;
		$this->on_fields_api_init(
			static function ( $registry ) use ( &$registered ) {
				$registered = $registry->register( 'test-plugin', 'postType', 'page', array( 'color' => array( 'id' => 'color' ) ) );
			}
		);

		$this->assertSame( array(), $registered );
		$this->assertNotContains( 'color', array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'id' ) );
	}

	/**
	 * Unregistering with an entity kind or name that is not a non-empty
	 * string is refused with a notice rather than a fatal error, and the
	 * registry is left untouched.
	 */
	public function test_unregistering_with_an_invalid_entity_is_refused() {
		$this->setExpectedIncorrectUsage( 'Gutenberg_Fields_Registry::unregister' );
		$results = array();
		$this->on_fields_api_init(
			static function ( $registry ) use ( &$results ) {
				$results['no name']    = $registry->unregister( 'postType', array( 'author' ) );
				$results['empty kind'] = $registry->unregister( '', 'page', array( 'author' ) );
			}
		);

		$this->assertSame(
			array(
				'no name'    => array(),
				'empty kind' => array(),
			),
			$results
		);
		$this->assertContains( 'author', array_column( gutenberg_get_registered_fields( 'postType', 'page' ), 'id' ), 'The default field is kept.' );
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

		$this->assertSame( array(), $registry->register( 'test-plugin', 'postType', 'page', array( $this->field( 'color' ) ), 'plugin/color' ) );
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

		$this->assertSame(
			array(),
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
}
