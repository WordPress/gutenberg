<?php
/**
 * Unit tests covering WP_Script_Modules functionality.
 *
 * @package WordPress
 * @subpackage Script Modules
 *
 * @since 6.5.0
 *
 * @group script-modules
 *
 * @coversDefaultClass WP_Script_Modules
 */
class Tests_WP_Script_Modules extends WP_UnitTestCase {
	/**
	 * Instance of WP_Script_Modules.
	 *
	 * @var WP_Script_Modules
	 */
	protected $modules;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->modules = new WP_Script_Modules();
	}

	/**
	 * Gets a list of the enqueued modules.
	 *
	 * @return array Enqueued module URLs, keyed by module identifier.
	 */
	public function get_enqueued_modules() {
		$modules_markup   = get_echo( array( $this->modules, 'print_enqueued_modules' ) );
		$p                = new WP_HTML_Tag_Processor( $modules_markup );
		$enqueued_modules = array();

		while ( $p->next_tag(
			array(
				'tag'    => 'SCRIPT',
				'import' => 'module',
			)
		) ) {
			$id                      = preg_replace( '/-js-module$/', '', $p->get_attribute( 'id' ) );
			$enqueued_modules[ $id ] = $p->get_attribute( 'src' );
		}

		return $enqueued_modules;
	}

	/**
	 * Gets the modules listed in the import map.
	 *
	 * @return array Import map entry URLs, keyed by module identifier.
	 */
	public function get_import_map() {
		$import_map_markup = get_echo( array( $this->modules, 'print_import_map' ) );
		preg_match( '/<script type="importmap" id="wp-importmap">.*?(\{.*\}).*?<\/script>/s', $import_map_markup, $import_map_string );
		return json_decode( $import_map_string[1], true )['imports'];
	}

	/**
	 * Gets a list of preloaded modules.
	 *
	 * @return array Preloaded module URLs, keyed by module identifier.
	 */
	public function get_preloaded_modules() {
		$preloaded_markup  = get_echo( array( $this->modules, 'print_module_preloads' ) );
		$p                 = new WP_HTML_Tag_Processor( $preloaded_markup );
		$preloaded_modules = array();

		while ( $p->next_tag(
			array(
				'tag' => 'LINK',
				'rel' => 'modulepreload',
			)
		) ) {
			$id                       = preg_replace( '/-js-modulepreload$/', '', $p->get_attribute( 'id' ) );
			$preloaded_modules[ $id ] = $p->get_attribute( 'href' );
		}

		return $preloaded_modules;
	}

	/**
	 * Tests that a module gets enqueued correctly after being registered.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_enqueued_modules()
	 */
	public function test_wp_enqueue_module() {
		$this->modules->register( 'foo', '/foo.js' );
		$this->modules->register( 'bar', '/bar.js' );
		$this->modules->enqueue( 'foo' );
		$this->modules->enqueue( 'bar' );

		$enqueued_modules = $this->get_enqueued_modules();

		$this->assertCount( 2, $enqueued_modules );
		$this->assertStringStartsWith( '/foo.js', $enqueued_modules['foo'] );
		$this->assertStringStartsWith( '/bar.js', $enqueued_modules['bar'] );
	}

	/**
	* Tests that a module can be dequeued after being enqueued.
	*
	* @ticket 56313
	*
	* @covers ::register()
	* @covers ::enqueue()
	* @covers ::dequeue()
	* @covers ::print_enqueued_modules()
	*/
	public function test_wp_dequeue_module() {
		$this->modules->register( 'foo', '/foo.js' );
		$this->modules->register( 'bar', '/bar.js' );
		$this->modules->enqueue( 'foo' );
		$this->modules->enqueue( 'bar' );
		$this->modules->dequeue( 'foo' ); // Dequeued.

		$enqueued_modules = $this->get_enqueued_modules();

		$this->assertCount( 1, $enqueued_modules );
		$this->assertFalse( isset( $enqueued_modules['foo'] ) );
		$this->assertTrue( isset( $enqueued_modules['bar'] ) );
	}

	/**
	* Tests that a module can be enqueued before it is registered, and will be
	* handled correctly once registered.
	*
	* @ticket 56313
	*
	* @covers ::register()
	* @covers ::enqueue()
	* @covers ::print_enqueued_modules()
	*/
	public function test_wp_enqueue_module_works_before_register() {
		$this->modules->enqueue( 'foo' );
		$this->modules->register( 'foo', '/foo.js' );
		$this->modules->enqueue( 'bar' ); // Not registered.

		$enqueued_modules = $this->get_enqueued_modules();

		$this->assertCount( 1, $enqueued_modules );
		$this->assertStringStartsWith( '/foo.js', $enqueued_modules['foo'] );
		$this->assertFalse( isset( $enqueued_modules['bar'] ) );
	}

	/**
	 * Tests that a module can be dequeued before it is registered and ensures
	 * that it is not enqueued after registration.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::dequeue()
	 * @covers ::print_enqueued_modules()
	 */
	public function test_wp_dequeue_module_works_before_register() {
		$this->modules->enqueue( 'foo' );
		$this->modules->enqueue( 'bar' );
		$this->modules->dequeue( 'foo' );
		$this->modules->register( 'foo', '/foo.js' );
		$this->modules->register( 'bar', '/bar.js' );

		$enqueued_modules = $this->get_enqueued_modules();

		$this->assertCount( 1, $enqueued_modules );
		$this->assertFalse( isset( $enqueued_modules['foo'] ) );
		$this->assertTrue( isset( $enqueued_modules['bar'] ) );
	}

	/**
	 * Tests that dependencies for a registered module are added to the import map
	 * when the module is enqueued.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_import_map()
	 */
	public function test_wp_import_map_dependencies() {
		$this->modules->register( 'foo', '/foo.js', array( 'dep' ) );
		$this->modules->register( 'dep', '/dep.js' );
		$this->modules->register( 'no-dep', '/no-dep.js' );
		$this->modules->enqueue( 'foo' );

		$import_map = $this->get_import_map();

		$this->assertCount( 1, $import_map );
		$this->assertStringStartsWith( '/dep.js', $import_map['dep'] );
		$this->assertFalse( isset( $import_map['no-dep'] ) );
	}

	/**
	 * Tests that dependencies are not duplicated in the import map when multiple
	 * modules require the same dependency.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_import_map()
	 */
	public function test_wp_import_map_no_duplicate_dependencies() {
		$this->modules->register( 'foo', '/foo.js', array( 'dep' ) );
		$this->modules->register( 'bar', '/bar.js', array( 'dep' ) );
		$this->modules->register( 'dep', '/dep.js' );
		$this->modules->enqueue( 'foo' );
		$this->modules->enqueue( 'bar' );

		$import_map = $this->get_import_map();

		$this->assertCount( 1, $import_map );
		$this->assertStringStartsWith( '/dep.js', $import_map['dep'] );
	}

	/**
	 * Tests that all recursive dependencies (both static and dynamic) are
	 * included in the import map.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_import_map()
	 */
	public function test_wp_import_map_recursive_dependencies() {
		$this->modules->register(
			'foo',
			'/foo.js',
			array(
				'static-dep',
				array(
					'id'     => 'dynamic-dep',
					'import' => 'dynamic',
				),
			)
		);
		$this->modules->register(
			'static-dep',
			'/static-dep.js',
			array(
				array(
					'id'     => 'nested-static-dep',
					'import' => 'static',
				),
				array(
					'id'     => 'nested-dynamic-dep',
					'import' => 'dynamic',
				),
			)
		);
		$this->modules->register( 'dynamic-dep', '/dynamic-dep.js' );
		$this->modules->register( 'nested-static-dep', '/nested-static-dep.js' );
		$this->modules->register( 'nested-dynamic-dep', '/nested-dynamic-dep.js' );
		$this->modules->register( 'no-dep', '/no-dep.js' );
		$this->modules->enqueue( 'foo' );

		$import_map = $this->get_import_map();

		$this->assertStringStartsWith( '/static-dep.js', $import_map['static-dep'] );
		$this->assertStringStartsWith( '/dynamic-dep.js', $import_map['dynamic-dep'] );
		$this->assertStringStartsWith( '/nested-static-dep.js', $import_map['nested-static-dep'] );
		$this->assertStringStartsWith( '/nested-dynamic-dep.js', $import_map['nested-dynamic-dep'] );
		$this->assertFalse( isset( $import_map['no-dep'] ) );
	}

	/**
	 * Tests that the import map is not printed at all if there are no
	 * dependencies.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_import_map()
	 */
	public function test_wp_import_map_doesnt_print_if_no_dependencies() {
		$this->modules->register( 'foo', '/foo.js' ); // No deps.
		$this->modules->enqueue( 'foo' );

		$import_map_markup = get_echo( array( $this->modules, 'print_import_map' ) );

		$this->assertEmpty( $import_map_markup );
	}

	/**
	 * Tests that only static dependencies are preloaded and dynamic ones are
	 * excluded.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_module_preloads()
	 */
	public function test_wp_enqueue_preloaded_static_dependencies() {
		$this->modules->register(
			'foo',
			'/foo.js',
			array(
				'static-dep',
				array(
					'id'     => 'dynamic-dep',
					'import' => 'dynamic',
				),
			)
		);
		$this->modules->register(
			'static-dep',
			'/static-dep.js',
			array(
				array(
					'id'     => 'nested-static-dep',
					'import' => 'static',
				),
				array(
					'id'     => 'nested-dynamic-dep',
					'import' => 'dynamic',
				),
			)
		);
		$this->modules->register( 'dynamic-dep', '/dynamic-dep.js' );
		$this->modules->register( 'nested-static-dep', '/nested-static-dep.js' );
		$this->modules->register( 'nested-dynamic-dep', '/nested-dynamic-dep.js' );
		$this->modules->register( 'no-dep', '/no-dep.js' );
		$this->modules->enqueue( 'foo' );

		$preloaded_modules = $this->get_preloaded_modules();

		$this->assertCount( 2, $preloaded_modules );
		$this->assertStringStartsWith( '/static-dep.js', $preloaded_modules['static-dep'] );
		$this->assertStringStartsWith( '/nested-static-dep.js', $preloaded_modules['nested-static-dep'] );
		$this->assertFalse( isset( $preloaded_modules['no-dep'] ) );
		$this->assertFalse( isset( $preloaded_modules['dynamic-dep'] ) );
		$this->assertFalse( isset( $preloaded_modules['nested-dynamic-dep'] ) );
	}

	/**
	 * Tests that static dependencies of dynamic depenendencies are not preloaded.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_module_preloads()
	 */
	public function test_wp_dont_preload_static_dependencies_of_dynamic_dependencies() {
		$this->modules->register(
			'foo',
			'/foo.js',
			array(
				'static-dep',
				array(
					'id'     => 'dynamic-dep',
					'import' => 'dynamic',
				),
			)
		);
		$this->modules->register( 'static-dep', '/static-dep.js' );
		$this->modules->register( 'dynamic-dep', '/dynamic-dep.js', array( 'nested-static-dep' ) );
		$this->modules->register( 'nested-static-dep', '/nested-static-dep.js' );
		$this->modules->register( 'no-dep', '/no-dep.js' );
		$this->modules->enqueue( 'foo' );

		$preloaded_modules = $this->get_preloaded_modules();

		$this->assertCount( 1, $preloaded_modules );
		$this->assertStringStartsWith( '/static-dep.js', $preloaded_modules['static-dep'] );
		$this->assertFalse( isset( $preloaded_modules['dynamic-dep'] ) );
		$this->assertFalse( isset( $preloaded_modules['nested-static-dep'] ) );
		$this->assertFalse( isset( $preloaded_modules['no-dep'] ) );
	}

	/**
	 * Tests that preloaded dependencies don't include enqueued modules.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_module_preloads()
	 */
	public function test_wp_preloaded_dependencies_filter_enqueued_modules() {
		$this->modules->register(
			'foo',
			'/foo.js',
			array(
				'dep',
				'enqueued-dep',
			)
		);
		$this->modules->register( 'dep', '/dep.js' );
		$this->modules->register( 'enqueued-dep', '/enqueued-dep.js' );
		$this->modules->enqueue( 'foo' );
		$this->modules->enqueue( 'enqueued-dep' ); // Not preloaded.

		$preloaded_modules = $this->get_preloaded_modules();

		$this->assertCount( 1, $preloaded_modules );
		$this->assertTrue( isset( $preloaded_modules['dep'] ) );
		$this->assertFalse( isset( $preloaded_modules['enqueued-dep'] ) );
	}

	/**
	 * Tests that enqueued modules with dependants correctly add both the module
	 * and its dependencies to the import map.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_import_map()
	 */
	public function test_wp_enqueued_modules_with_dependants_add_import_map() {
		$this->modules->register(
			'foo',
			'/foo.js',
			array(
				'dep',
				'enqueued-dep',
			)
		);
		$this->modules->register( 'dep', '/dep.js' );
		$this->modules->register( 'enqueued-dep', '/enqueued-dep.js' );
		$this->modules->enqueue( 'foo' );
		$this->modules->enqueue( 'enqueued-dep' ); // Also in the import map.

		$import_map = $this->get_import_map();

		$this->assertCount( 2, $import_map );
		$this->assertTrue( isset( $import_map['dep'] ) );
		$this->assertTrue( isset( $import_map['enqueued-dep'] ) );
	}

	/**
	 * Tests the functionality of the `get_versioned_src` method to ensure
	 * proper URLs with version strings are returned.
	 *
	 * @ticket 56313
	 *
	 * @covers ::get_versioned_src()
	 */
	public function test_get_versioned_src() {
		$get_versioned_src = new ReflectionMethod( $this->modules, 'get_versioned_src' );
		$get_versioned_src->setAccessible( true );

		$module_with_version = array(
			'src'     => 'http://example.com/module.js',
			'version' => '1.0',
		);

		$result = $get_versioned_src->invoke( $this->modules, $module_with_version );
		$this->assertEquals( 'http://example.com/module.js?ver=1.0', $result );

		$module_without_version = array(
			'src'     => 'http://example.com/module.js',
			'version' => null,
		);

		$result = $get_versioned_src->invoke( $this->modules, $module_without_version );
		$this->assertEquals( 'http://example.com/module.js', $result );

		$module_with_wp_version = array(
			'src'     => 'http://example.com/module.js',
			'version' => false,
		);

		$result = $get_versioned_src->invoke( $this->modules, $module_with_wp_version );
		$this->assertEquals( 'http://example.com/module.js?ver=' . get_bloginfo( 'version' ), $result );

		$module_with_existing_query_string = array(
			'src'     => 'http://example.com/module.js?foo=bar',
			'version' => '1.0',
		);

		$result = $get_versioned_src->invoke( $this->modules, $module_with_existing_query_string );
		$this->assertEquals( 'http://example.com/module.js?foo=bar&ver=1.0', $result );
	}

	/**
	 * Tests that the correct version is propagated to the import map, enqueued
	 * modules and preloaded modules.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_enqueued_modules()
	 * @covers ::print_import_map()
	 * @covers ::print_module_preloads()
	 * @covers ::get_version_query_string()
	 */
	public function test_version_is_propagated_correctly() {
		$this->modules->register(
			'foo',
			'/foo.js',
			array(
				'dep',
			),
			'1.0'
		);
		$this->modules->register( 'dep', '/dep.js', array(), '2.0' );
		$this->modules->enqueue( 'foo' );

		$enqueued_modules = $this->get_enqueued_modules();
		$this->assertEquals( '/foo.js?ver=1.0', $enqueued_modules['foo'] );

		$import_map = $this->get_import_map();
		$this->assertEquals( '/dep.js?ver=2.0', $import_map['dep'] );

		$preloaded_modules = $this->get_preloaded_modules();
		$this->assertEquals( '/dep.js?ver=2.0', $preloaded_modules['dep'] );
	}

	/**
	 * Tests that it can print the enqueued modules multiple times, and it will
	 * only print the modules that have not been printed before.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_enqueued_modules()
	 */
	public function test_print_enqueued_modules_can_be_called_multiple_times() {
		$this->modules->register( 'foo', '/foo.js' );
		$this->modules->register( 'bar', '/bar.js' );
		$this->modules->enqueue( 'foo' );

		$enqueued_modules = $this->get_enqueued_modules();
		$this->assertCount( 1, $enqueued_modules );
		$this->assertTrue( isset( $enqueued_modules['foo'] ) );

		$this->modules->enqueue( 'bar' );

		$enqueued_modules = $this->get_enqueued_modules();
		$this->assertCount( 1, $enqueued_modules );
		$this->assertTrue( isset( $enqueued_modules['bar'] ) );

		$enqueued_modules = $this->get_enqueued_modules();
		$this->assertCount( 0, $enqueued_modules );
	}

	/**
	 * Tests that it can print the preloaded modules multiple times, and it will
	 * only print the modules that have not been printed before.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_module_preloads()
	 */
	public function test_print_preloaded_modules_can_be_called_multiple_times() {
		$this->modules->register( 'foo', '/foo.js', array( 'static-dep-1', 'static-dep-2' ) );
		$this->modules->register( 'bar', '/bar.js', array( 'static-dep-3' ) );
		$this->modules->register( 'static-dep-1', '/static-dep-1.js' );
		$this->modules->register( 'static-dep-3', '/static-dep-3.js' );
		$this->modules->enqueue( 'foo' );

		$preloaded_modules = $this->get_preloaded_modules();
		$this->assertCount( 1, $preloaded_modules );
		$this->assertTrue( isset( $preloaded_modules['static-dep-1'] ) );

		$this->modules->register( 'static-dep-2', '/static-dep-2.js' );
		$this->modules->enqueue( 'bar' );

		$preloaded_modules = $this->get_preloaded_modules();
		$this->assertCount( 2, $preloaded_modules );
		$this->assertTrue( isset( $preloaded_modules['static-dep-2'] ) );
		$this->assertTrue( isset( $preloaded_modules['static-dep-3'] ) );

		$preloaded_modules = $this->get_preloaded_modules();
		$this->assertCount( 0, $preloaded_modules );
	}

	/**
	 * Tests that a module is not registered when calling enqueue without a valid
	 * src.
	 *
	 * @ticket 56313
	 *
	 * @covers ::enqueue()
	 * @covers ::print_enqueued_modules()
	 */
	public function test_wp_enqueue_module_doesnt_register_without_a_valid_src() {
		$this->modules->enqueue( 'foo' );

		$enqueued_modules = $this->get_enqueued_modules();

		$this->assertCount( 0, $enqueued_modules );
		$this->assertFalse( isset( $enqueued_modules['foo'] ) );
	}

	/**
	 * Tests that a module is registered when calling enqueue with a valid src.
	 *
	 * @ticket 56313
	 *
	 * @covers ::enqueue()
	 * @covers ::print_enqueued_modules()
	 */
	public function test_wp_enqueue_module_registers_with_valid_src() {
		$this->modules->enqueue( 'foo', '/foo.js' );

		$enqueued_modules = $this->get_enqueued_modules();

		$this->assertCount( 1, $enqueued_modules );
		$this->assertStringStartsWith( '/foo.js', $enqueued_modules['foo'] );
	}

	/**
	 * Tests that a module is registered when calling enqueue with a valid src the
	 * second time.
	 *
	 * @ticket 56313
	 *
	 * @covers ::enqueue()
	 * @covers ::print_enqueued_modules()
	 */
	public function test_wp_enqueue_module_registers_with_valid_src_the_second_time() {
		$this->modules->enqueue( 'foo' ); // Not valid src.

		$enqueued_modules = $this->get_enqueued_modules();

		$this->assertCount( 0, $enqueued_modules );
		$this->assertFalse( isset( $enqueued_modules['foo'] ) );

		$this->modules->enqueue( 'foo', '/foo.js' ); // Valid src.

		$enqueued_modules = $this->get_enqueued_modules();

		$this->assertCount( 1, $enqueued_modules );
		$this->assertStringStartsWith( '/foo.js', $enqueued_modules['foo'] );
	}

	/**
	 * Tests that a module is registered with all the params when calling enqueue.
	 *
	 * @ticket 56313
	 *
	 * @covers ::register()
	 * @covers ::enqueue()
	 * @covers ::print_enqueued_modules()
	 * @covers ::print_import_map()
	 */
	public function test_wp_enqueue_module_registers_all_params() {
		$this->modules->enqueue( 'foo', '/foo.js', array( 'dep' ), '1.0' );
		$this->modules->register( 'dep', '/dep.js' );

		$enqueued_modules = $this->get_enqueued_modules();
		$import_map       = $this->get_import_map();

		$this->assertCount( 1, $enqueued_modules );
		$this->assertEquals( '/foo.js?ver=1.0', $enqueued_modules['foo'] );
		$this->assertCount( 1, $import_map );
		$this->assertStringStartsWith( '/dep.js', $import_map['dep'] );
	}
}
