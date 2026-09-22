<?php
/**
 * Tests for the entity fields API.
 *
 * @package gutenberg
 *
 * @covers ::_gutenberg_add_field_modules_to_editor_script
 * @covers ::_gutenberg_register_posttype_fields
 * @covers ::_gutenberg_register_wp_template_fields
 * @covers ::_gutenberg_register_wp_template_part_fields
 * @covers ::_gutenberg_register_attachment_fields
 */
class Tests_Fields_API extends WP_UnitTestCase {

	/**
	 * Entities whose fields a test registered, as `[ $kind, $name ]`,
	 * unregistered on tear down.
	 *
	 * @var array[]
	 */
	private $registered_field_entities = array();

	/**
	 * Tears down each test.
	 */
	public function tear_down() {
		foreach ( $this->registered_field_entities as $args ) {
			gutenberg_unregister_fields( ...$args );
		}
		$this->registered_field_entities = array();

		parent::tear_down();
	}

	/**
	 * Registers fields for the duration of the test.
	 *
	 * @param string      $kind   The entity kind.
	 * @param string      $name   The entity name.
	 * @param array[]     $fields The field definitions.
	 * @param string|null $module The script module id, if any.
	 * @return bool Whether the fields were registered.
	 */
	private function register_fields( $kind, $name, $fields, $module = null ) {
		$this->registered_field_entities[] = array( $kind, $name );
		return gutenberg_register_fields( $kind, $name, $fields, $module );
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
		_gutenberg_add_field_modules_to_editor_script( $scripts );

		$this->assertSame(
			array(
				'@wordpress/existing',
				array(
					'id'      => 'plugin/color',
					'dynamic' => true,
				),
			),
			$scripts->get_data( 'wp-editor', 'module_dependencies' )
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

		$this->assertSame(
			array(
				array(
					'id'      => 'plugin/fields',
					'dynamic' => true,
				),
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
	 * default author field.
	 */
	public function test_a_custom_post_type_supporting_authors_gets_the_author_field() {
		register_post_type(
			'gutenberg_book',
			array(
				'show_in_rest' => true,
				'supports'     => array( 'title', 'author' ),
			)
		);
		$this->registered_field_entities[] = array( 'postType', 'gutenberg_book' );

		try {
			_gutenberg_register_posttype_fields();
			$ids = array_column( gutenberg_get_registered_fields( 'postType', 'gutenberg_book' ), 'id' );
		} finally {
			unregister_post_type( 'gutenberg_book' );
		}

		$this->assertContains( 'author', $ids );
	}

	/**
	 * Templates and template parts support authors but have their own
	 * client-side author field, so the default one is removed.
	 *
	 * @dataProvider data_template_post_types
	 *
	 * @param string   $post_type The post type.
	 * @param callable $callback  The callback adjusting its fields.
	 */
	public function test_templates_do_not_get_the_default_author_field( $post_type, $callback ) {
		$this->assertTrue( post_type_supports( $post_type, 'author' ), 'The post type supports authors.' );

		_gutenberg_register_posttype_fields();
		$this->assertContains( 'author', array_column( gutenberg_get_registered_fields( 'postType', $post_type ), 'id' ), 'The default author field is registered first.' );

		$callback();
		$this->assertNotContains( 'author', array_column( gutenberg_get_registered_fields( 'postType', $post_type ), 'id' ) );
	}

	/**
	 * Attachments support authors and comments but the media editor has its
	 * own fields, so the defaults derived from the supports are replaced.
	 */
	public function test_attachments_get_the_media_fields_instead_of_the_defaults() {
		_gutenberg_register_posttype_fields();
		$ids = array_column( gutenberg_get_registered_fields( 'postType', 'attachment' ), 'id' );
		$this->assertContains( 'author', $ids, 'The default author field is registered first.' );
		$this->assertContains( 'comment_status', $ids, 'The default comment status field is registered first.' );

		_gutenberg_register_attachment_fields();
		$ids = array_column( gutenberg_get_registered_fields( 'postType', 'attachment' ), 'id' );
		$this->assertNotContains( 'author', $ids );
		$this->assertNotContains( 'comment_status', $ids );
		$this->assertContains( 'date', $ids );
	}

	/**
	 * @return array[]
	 */
	public function data_template_post_types() {
		return array(
			'template'      => array( 'wp_template', '_gutenberg_register_wp_template_fields' ),
			'template part' => array( 'wp_template_part', '_gutenberg_register_wp_template_part_fields' ),
		);
	}
}
