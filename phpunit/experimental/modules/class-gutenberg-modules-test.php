<?php
/**
 * Tests Gutenberg_Modules_Test
 *
 * @package WordPress
 */

/**
 * Tests for the Gutenberg_Modules_Test class.
 */
class Gutenberg_Modules_Test extends WP_UnitTestCase {
	protected $registered;
	protected $old_registered;

	public function set_up() {
		parent::set_up();
		$this->registered = new ReflectionProperty( 'Gutenberg_Modules', 'registered' );
		$this->registered->setAccessible( true );
		$this->old_registered = $this->registered->getValue();
		$this->registered->setValue( array() );
	}

	public function tear_down() {
		$this->registered->setValue( $this->old_registered );
		parent::tear_down();
	}

	public function get_enqueued_modules() {
		$modules_markup   = get_echo( array( 'Gutenberg_Modules', 'print_enqueued_modules' ) );
		$p                = new WP_HTML_Tag_Processor( $modules_markup );
		$enqueued_modules = array();

		while ( $p->next_tag(
			array(
				'tag'  => 'SCRIPT',
				'type' => 'module',
			)
		) ) {
			$enqueued_modules[ $p->get_attribute( 'id' ) ] = $p->get_attribute( 'src' );
		}

		return $enqueued_modules;
	}

	public function get_import_map() {
		$import_map_markup = get_echo( array( 'Gutenberg_Modules', 'print_import_map' ) );
		preg_match( '/<script type="importmap">([^<]+)<\/script>/s', $import_map_markup, $import_map_string );
		return json_decode( $import_map_string[1], true )['imports'];
	}

	public function get_preloaded_modules() {
		$preloaded_markup  = get_echo( array( 'Gutenberg_Modules', 'print_module_preloads' ) );
		$p                 = new WP_HTML_Tag_Processor( $preloaded_markup );
		$preloaded_modules = array();

		while ( $p->next_tag(
			array(
				'tag' => 'LINK',
				'rel' => 'modulepreload',
			)
		) ) {
			$preloaded_modules[ $p->get_attribute( 'id' ) ] = $p->get_attribute( 'href' );
		}

		return $preloaded_modules;
	}

	public function test_gutenberg_enqueue_module() {
		gutenberg_register_module( 'foo', '/foo.js' );
		gutenberg_register_module( 'bar', '/bar.js' );
		gutenberg_enqueue_module( 'foo' );
		gutenberg_enqueue_module( 'bar' );

		$enqueued_modules = $this->get_enqueued_modules();

		$this->assertEquals( 2, count( $enqueued_modules ) );
		$this->assertEquals( true, str_starts_with( $enqueued_modules['foo'], '/foo.js' ) );
		$this->assertEquals( true, str_starts_with( $enqueued_modules['bar'], '/bar.js' ) );
	}

	public function test_gutenberg_dequeue_module() {
		gutenberg_register_module( 'foo', '/foo.js' );
		gutenberg_register_module( 'bar', '/bar.js' );
		gutenberg_enqueue_module( 'foo' );
		gutenberg_enqueue_module( 'bar' );
		gutenberg_dequeue_module( 'foo' ); // Dequeued.

		$enqueued_modules = $this->get_enqueued_modules();

		$this->assertEquals( 1, count( $enqueued_modules ) );
		$this->assertEquals( false, isset( $enqueued_modules['foo'] ) );
		$this->assertEquals( true, isset( $enqueued_modules['bar'] ) );
	}

	public function test_gutenberg_enqueue_module_works_before_register() {
		gutenberg_enqueue_module( 'foo' );
		gutenberg_register_module( 'foo', '/foo.js' );
		gutenberg_enqueue_module( 'bar' ); // Not registered.

		$enqueued_modules = $this->get_enqueued_modules();

		$this->assertEquals( 1, count( $enqueued_modules ) );
		$this->assertEquals( true, str_starts_with( $enqueued_modules['foo'], '/foo.js' ) );
		$this->assertEquals( false, isset( $enqueued_modules['bar'] ) );
	}

	public function test_gutenberg_dequeue_module_works_before_register() {
		gutenberg_enqueue_module( 'foo' );
		gutenberg_enqueue_module( 'bar' );
		gutenberg_dequeue_module( 'foo' );
		gutenberg_register_module( 'foo', '/foo.js' );
		gutenberg_register_module( 'bar', '/bar.js' );

		$enqueued_modules = $this->get_enqueued_modules();

		$this->assertEquals( 1, count( $enqueued_modules ) );
		$this->assertEquals( false, isset( $enqueued_modules['foo'] ) );
		$this->assertEquals( true, isset( $enqueued_modules['bar'] ) );
	}

	public function test_gutenberg_import_map_dependencies() {
		gutenberg_register_module( 'foo', '/foo.js', array( 'dep' ) );
		gutenberg_register_module( 'dep', '/dep.js' );
		gutenberg_register_module( 'no-dep', '/no-dep.js' );
		gutenberg_enqueue_module( 'foo' );

		$import_map = $this->get_import_map();

		$this->assertEquals( 1, count( $import_map ) );
		$this->assertEquals( true, str_starts_with( $import_map['dep'], '/dep.js' ) );
		$this->assertEquals( false, isset( $import_map['no-dep'] ) );
	}

	public function test_gutenberg_import_map_no_duplicate_dependencies() {
		gutenberg_register_module( 'foo', '/foo.js', array( 'dep' ) );
		gutenberg_register_module( 'bar', '/bar.js', array( 'dep' ) );
		gutenberg_register_module( 'dep', '/dep.js' );
		gutenberg_enqueue_module( 'foo' );
		gutenberg_enqueue_module( 'bar' );

		$import_map = $this->get_import_map();

		$this->assertEquals( 1, count( $import_map ) );
		$this->assertEquals( true, str_starts_with( $import_map['dep'], '/dep.js' ) );
	}

	public function test_gutenberg_import_map_recursive_dependencies() {
		gutenberg_register_module(
			'foo',
			'/foo.js',
			array(
				'static-dep',
				array(
					'id'   => 'dynamic-dep',
					'type' => 'dynamic',
				),
			)
		);
		gutenberg_register_module(
			'static-dep',
			'/static-dep.js',
			array(
				array(
					'id'   => 'nested-static-dep',
					'type' => 'static',
				),
				array(
					'id'   => 'nested-dynamic-dep',
					'type' => 'dynamic',
				),
			)
		);
		gutenberg_register_module( 'dynamic-dep', '/dynamic-dep.js' );
		gutenberg_register_module( 'nested-static-dep', '/nested-static-dep.js' );
		gutenberg_register_module( 'nested-dynamic-dep', '/nested-dynamic-dep.js' );
		gutenberg_register_module( 'no-dep', '/no-dep.js' );
		gutenberg_enqueue_module( 'foo' );

		$import_map = $this->get_import_map();

		$this->assertEquals( true, str_starts_with( $import_map['static-dep'], '/static-dep.js' ) );
		$this->assertEquals( true, str_starts_with( $import_map['dynamic-dep'], '/dynamic-dep.js' ) );
		$this->assertEquals( true, str_starts_with( $import_map['nested-static-dep'], '/nested-static-dep.js' ) );
		$this->assertEquals( true, str_starts_with( $import_map['nested-dynamic-dep'], '/nested-dynamic-dep.js' ) );
		$this->assertEquals( false, isset( $import_map['no-dep'] ) );
	}

	public function test_gutenberg_enqueue_preloaded_static_dependencies() {
		gutenberg_register_module(
			'foo',
			'/foo.js',
			array(
				'static-dep',
				array(
					'id'   => 'dynamic-dep',
					'type' => 'dynamic',
				),
			)
		);
		gutenberg_register_module(
			'static-dep',
			'/static-dep.js',
			array(
				array(
					'id'   => 'nested-static-dep',
					'type' => 'static',
				),
				array(
					'id'   => 'nested-dynamic-dep',
					'type' => 'dynamic',
				),
			)
		);
		gutenberg_register_module( 'dynamic-dep', '/dynamic-dep.js' );
		gutenberg_register_module( 'nested-static-dep', '/nested-static-dep.js' );
		gutenberg_register_module( 'nested-dynamic-dep', '/nested-dynamic-dep.js' );
		gutenberg_register_module( 'no-dep', '/no-dep.js' );
		gutenberg_enqueue_module( 'foo' );

		$preloaded_modules = $this->get_preloaded_modules();

		$this->assertEquals( 2, count( $preloaded_modules ) );
		$this->assertEquals( true, str_starts_with( $preloaded_modules['static-dep'], '/static-dep.js' ) );
		$this->assertEquals( true, str_starts_with( $preloaded_modules['nested-static-dep'], '/nested-static-dep.js' ) );
		$this->assertEquals( false, isset( $import_map['no-dep'] ) );
		$this->assertEquals( false, isset( $import_map['dynamic-dep'] ) );
		$this->assertEquals( false, isset( $import_map['nested-dynamic-dep'] ) );
	}

	public function test_gutenberg_preloaded_dependencies_filter_enqueued_modules() {
		gutenberg_register_module(
			'foo',
			'/foo.js',
			array(
				'dep',
				'enqueued-dep',
			)
		);
		gutenberg_register_module( 'dep', '/dep.js' );
		gutenberg_register_module( 'enqueued-dep', '/enqueued-dep.js' );
		gutenberg_enqueue_module( 'foo' );
		gutenberg_enqueue_module( 'enqueued-dep' ); // Not preloaded.

		$preloaded_modules = $this->get_preloaded_modules();

		$this->assertEquals( 1, count( $preloaded_modules ) );
		$this->assertEquals( true, isset( $preloaded_modules['dep'] ) );
		$this->assertEquals( false, isset( $preloaded_modules['enqueued-dep'] ) );
	}

	public function test_gutenberg_enqueued_modules_with_dependants_add_import_map() {
		gutenberg_register_module(
			'foo',
			'/foo.js',
			array(
				'dep',
				'enqueued-dep',
			)
		);
		gutenberg_register_module( 'dep', '/dep.js' );
		gutenberg_register_module( 'enqueued-dep', '/enqueued-dep.js' );
		gutenberg_enqueue_module( 'foo' );
		gutenberg_enqueue_module( 'enqueued-dep' ); // Also in the import map.

		$import_map = $this->get_import_map();

		$this->assertEquals( 2, count( $import_map ) );
		$this->assertEquals( true, isset( $import_map['dep'] ) );
		$this->assertEquals( true, isset( $import_map['enqueued-dep'] ) );
	}

	public function test_get_version_query_string() {
		$get_version_query_string = new ReflectionMethod( 'Gutenberg_Modules', 'get_version_query_string' );
		$get_version_query_string->setAccessible( true );

		$result = $get_version_query_string->invoke( null, '1.0' );
		$this->assertEquals( '?ver=1.0', $result );

		$result = $get_version_query_string->invoke( null, false );
		$this->assertEquals( '?ver=' . get_bloginfo( 'version' ), $result );

		$result = $get_version_query_string->invoke( null, null );
		$this->assertEquals( '', $result );
	}
}
