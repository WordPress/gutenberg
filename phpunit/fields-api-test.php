<?php
/**
 * Tests for the entity fields API.
 *
 * @package gutenberg
 *
 * @covers ::_gutenberg_add_field_modules_to_editor_script
 * @covers ::_gutenberg_register_posttype_supports_fields
 * @covers ::_gutenberg_register_posttype_wp_template_fields
 * @covers ::_gutenberg_register_posttype_wp_template_part_fields
 * @covers ::_gutenberg_register_posttype_attachment_fields
 * @covers Gutenberg_Fields_Registry::initialize
 * @covers Gutenberg_Fields_Registry::reset
 */
class Tests_Fields_API extends WP_UnitTestCase {

	/**
	 * Tears down each test.
	 *
	 * Resetting the registry drops the fields a test registered along with
	 * the defaults; the next read fires `fields_api_init` again and
	 * registers the defaults anew.
	 */
	public function tear_down() {
		Gutenberg_Fields_Registry::get_instance()->reset();

		parent::tear_down();
	}

	/**
	 * Unregisters the fields of every entity with a script module, so a
	 * test can start from a registry without modules. The registry is reset
	 * on tear down.
	 */
	private function unregister_all_field_modules() {
		$registry = Gutenberg_Fields_Registry::get_instance();
		foreach ( array_keys( $registry->get_all_registered_field_modules() ) as $entity ) {
			list( $kind, $name ) = explode( '/', $entity, 2 );
			$registry->unregister( $kind, $name );
		}
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
	 * Registers fields for the duration of the test: the registry is reset
	 * on tear down.
	 *
	 * @param string      $kind   The entity kind.
	 * @param string      $name   The entity name.
	 * @param array[]     $fields The field definitions.
	 * @param string|null $module The script module id, if any.
	 * @return bool Whether the fields were registered.
	 */
	private function register_fields( $kind, $name, $fields, $module = null ) {
		return Gutenberg_Fields_Registry::get_instance()->register( $kind, $name, $fields, $module );
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
	 * The modules are added early on `admin_init`, before the pages that
	 * render and exit at the default priority.
	 */
	public function test_the_modules_are_added_early_on_admin_init() {
		$this->assertSame( 5, has_action( 'admin_init', '_gutenberg_add_field_modules_to_editor_script' ) );
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
		// Only the dependencies added by the function are of interest.
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );
		_gutenberg_add_field_modules_to_editor_script( $scripts );

		$this->assertSame(
			array(
				array(
					'id'      => 'plugin/color',
					'dynamic' => true,
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
				'id'      => 'plugin/color',
				'dynamic' => true,
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
		$scripts->add_data( 'wp-editor', 'module_dependencies', array() );
		_gutenberg_add_field_modules_to_editor_script( $scripts );

		$this->assertContains(
			array(
				'id'      => '@wordpress/fields/server-fields',
				'dynamic' => true,
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

			_gutenberg_add_field_modules_to_editor_script( $wp_scripts );
			$wp_scripts->enqueue( 'wp-editor' );

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
	 * Any post type supporting authors, including a custom one, gets the
	 * default author field: the defaults derive from the post types
	 * registered when the action fires.
	 */
	public function test_a_custom_post_type_supporting_authors_gets_the_author_field() {
		register_post_type(
			'gutenberg_book',
			array(
				'show_in_rest' => true,
				'supports'     => array( 'title', 'author' ),
			)
		);

		try {
			Gutenberg_Fields_Registry::get_instance()->reset();
			$ids = array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_book' ), 'id' );
		} finally {
			unregister_post_type( 'gutenberg_book' );
		}

		$this->assertContains( 'author', $ids );
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
			Gutenberg_Fields_Registry::get_instance()->reset();
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
	 * The author field is the only default field with JavaScript parts, so
	 * it is the only one registered with the default fields script module.
	 */
	public function test_the_author_field_ships_its_script_module() {
		Gutenberg_Fields_Registry::get_instance()->reset();

		$this->assertSame(
			array( '@wordpress/fields/server-fields' => array( 'author' ) ),
			gutenberg_get_registered_field_modules( 'postType', 'post' )
		);
		$this->assertContains( 'comment_status', array_column( gutenberg_get_registered_fields( 'postType', 'post' ), 'id' ), 'The comment status field is registered without a module.' );
	}

	/**
	 * Templates and template parts support authors but have their own
	 * client-side author field, so the default one is removed.
	 *
	 * The action registers the defaults and adjusts them in one go, so the
	 * intermediate state is not observable through the getters: the test
	 * reads once, then replays the two steps by hand.
	 *
	 * @dataProvider data_template_post_types
	 *
	 * @param string   $post_type The post type.
	 * @param callable $callback  The callback adjusting its fields.
	 */
	public function test_templates_do_not_get_the_default_author_field( $post_type, $callback ) {
		$registry = Gutenberg_Fields_Registry::get_instance();
		$this->assertTrue( post_type_supports( $post_type, 'author' ), 'The post type supports authors.' );
		$this->assertNotContains( 'author', array_column( gutenberg_get_registered_fields( 'postType', $post_type ), 'id' ), 'The action leaves no author field.' );

		_gutenberg_register_posttype_supports_fields( $registry );
		$this->assertContains( 'author', array_column( gutenberg_get_registered_fields( 'postType', $post_type ), 'id' ), 'The default author field is registered first.' );

		$callback( $registry );
		$this->assertNotContains( 'author', array_column( gutenberg_get_registered_fields( 'postType', $post_type ), 'id' ) );
	}

	/**
	 * Attachments support authors and comments but the media editor has its
	 * own fields, so the defaults derived from the supports are replaced.
	 *
	 * The action registers the defaults and adjusts them in one go, so the
	 * intermediate state is not observable through the getters: the test
	 * reads once, then replays the two steps by hand.
	 */
	public function test_attachments_get_the_media_fields_instead_of_the_defaults() {
		$registry = Gutenberg_Fields_Registry::get_instance();
		$ids      = array_column( gutenberg_get_registered_fields( 'postType', 'attachment' ), 'id' );
		$this->assertNotContains( 'author', $ids, 'The action leaves no author field.' );
		$this->assertContains( 'date', $ids, 'The action registers the media fields.' );

		_gutenberg_register_posttype_supports_fields( $registry );
		$ids = array_column( gutenberg_get_registered_fields( 'postType', 'attachment' ), 'id' );
		$this->assertContains( 'author', $ids, 'The default author field is registered first.' );
		$this->assertContains( 'comment_status', $ids, 'The default comment status field is registered first.' );

		_gutenberg_register_posttype_attachment_fields( $registry );
		$ids = array_column( gutenberg_get_registered_fields( 'postType', 'attachment' ), 'id' );
		$this->assertNotContains( 'author', $ids );
		$this->assertNotContains( 'comment_status', $ids );
		$this->assertContains( 'date', $ids );
		$this->assertSame( array(), gutenberg_get_registered_field_modules( 'postType', 'attachment' ), 'The media fields registered so far are plain data: no script module.' );
	}

	/**
	 * Reading the registry fires `fields_api_init` once, whichever
	 * getter is read first and however many times it is read.
	 */
	public function test_reading_the_registry_fires_the_action_once() {
		$registry = Gutenberg_Fields_Registry::get_instance();
		$registry->reset();
		$fired = did_action( 'fields_api_init' );

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
			Gutenberg_Fields_Registry::get_instance()->reset();
			gutenberg_get_registered_fields( 'postType', 'page' );
		} finally {
			remove_action( 'fields_api_init', $callback );
		}

		$this->assertSame( Gutenberg_Fields_Registry::get_instance(), $received );
	}

	/**
	 * A plugin hooking the action at the default priority sees the final
	 * defaults: on the registry it receives, it can patch a default field by
	 * registering it again, or remove it.
	 */
	public function test_a_callback_at_the_default_priority_alters_the_defaults() {
		$callback = static function ( $registry ) {
			$registry->register(
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
			Gutenberg_Fields_Registry::get_instance()->reset();
			$fields = gutenberg_get_registered_fields( 'postType', 'page' );
		} finally {
			remove_action( 'fields_api_init', $callback );
		}

		$fields = array_column( $fields, null, 'id' );
		$this->assertArrayHasKey( 'comment_status', $fields, 'The default field is kept.' );
		$this->assertTrue( $fields['comment_status']['enableSorting'], 'The property is patched.' );
		$this->assertSame( 'text', $fields['comment_status']['type'], 'The rest of the default definition is kept.' );
		$this->assertArrayNotHasKey( 'author', $fields, 'The default field is removed.' );
	}

	/**
	 * Registering does not read the registry, so a registration made before
	 * the action fires does not fire it early.
	 */
	public function test_registering_does_not_fire_the_action() {
		Gutenberg_Fields_Registry::get_instance()->reset();
		$fired = did_action( 'fields_api_init' );

		$this->register_fields( 'postType', 'page', array( $this->field( 'color' ) ) );

		$this->assertSame( $fired, did_action( 'fields_api_init' ) );
	}

	/**
	 * Resetting the registry empties it and the next read fires the action
	 * again.
	 */
	public function test_resetting_fires_the_action_again_on_the_next_read() {
		$registry = Gutenberg_Fields_Registry::get_instance();
		gutenberg_get_registered_fields( 'postType', 'page' );
		$fired = did_action( 'fields_api_init' );

		$registry->reset();
		$this->assertSame( $fired, did_action( 'fields_api_init' ), 'Resetting does not fire the action by itself.' );

		gutenberg_get_registered_fields( 'postType', 'page' );
		$this->assertSame( $fired + 1, did_action( 'fields_api_init' ) );
	}

	/**
	 * @return array[]
	 */
	public function data_template_post_types() {
		return array(
			'template'      => array( 'wp_template', '_gutenberg_register_posttype_wp_template_fields' ),
			'template part' => array( 'wp_template_part', '_gutenberg_register_posttype_wp_template_part_fields' ),
		);
	}
}
