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

	public function test_gutenberg_enqueue_module() {
		gutenberg_register_module( '@wordpress/some-module', '/some-module.js' );
		gutenberg_enqueue_module( '@wordpress/some-module' );
		gutenberg_register_module( '@wordpress/other-module', '/other-module.js' );
		gutenberg_enqueue_module( '@wordpress/other-module' );

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

		$this->assertEquals( 2, count( $enqueued_modules ) );
		$this->assertEquals( true, strpos( $enqueued_modules['@wordpress/some-module'], '/some-module.js' ) === 0 );
		$this->assertEquals( true, strpos( $enqueued_modules['@wordpress/other-module'], '/other-module.js' ) === 0 );
	}

	public function test_gutenberg_enqueue_module_works_before_register() {
		gutenberg_enqueue_module( '@wordpress/some-module' );
		gutenberg_register_module( '@wordpress/some-module', '/some-module.js' );
		gutenberg_enqueue_module( '@wordpress/other-module' ); // Not enqueued.

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

		$this->assertEquals( 1, count( $enqueued_modules ) );
		$this->assertEquals( true, strpos( $enqueued_modules['@wordpress/some-module'], '/some-module.js' ) === 0 );
	}

	public function test_gutenberg_import_map_dependencies() {
		gutenberg_register_module( '@wordpress/no-dep', '/no-dep.js' );
		gutenberg_register_module( '@wordpress/some-dep', '/some-dep.js' );
		gutenberg_register_module( '@wordpress/some-module', '/some-module.js', array( '@wordpress/some-dep' ) );
		gutenberg_enqueue_module( '@wordpress/some-module' );

		$import_map_markup = get_echo( array( 'Gutenberg_Modules', 'print_import_map' ) );
		preg_match( '/<script type="importmap">([^<]+)<\/script>/s', $import_map_markup, $import_map_string );
		$import_map = json_decode( $import_map_string[1], true )['imports'];

		$this->assertEquals( true, strpos( $import_map['@wordpress/some-dep'], '/some-dep.js' ) === 0 );
		$this->assertEquals( false, isset( $import_map['@wordpress/no-dep'] ) );
	}

	public function test_gutenberg_import_map_recursive_dependencies() {
		gutenberg_register_module( '@wordpress/no-dep', '/no-dep.js' );
		gutenberg_register_module( '@wordpress/some-nested-static-dep', '/some-nested-static-dep.js' );
		gutenberg_register_module( '@wordpress/some-nested-dynamic-dep', '/some-nested-dynamic-dep.js' );
		gutenberg_register_module(
			'@wordpress/some-static-dep',
			'/some-static-dep.js',
			array(
				array(
					'id'   => '@wordpress/some-nested-static-dep',
					'type' => 'static',
				),
				array(
					'id'   => '@wordpress/some-nested-dynamic-dep',
					'type' => 'dynamic',
				),
			)
		);
		gutenberg_register_module( '@wordpress/some-dynamic-dep', '/some-dynamic-dep.js' );
		gutenberg_register_module(
			'@wordpress/some-module',
			'/some-module.js',
			array(
				'@wordpress/some-static-dep',
				array(
					'id'   => '@wordpress/some-dynamic-dep',
					'type' => 'dynamic',
				),
			)
		);
		gutenberg_enqueue_module( '@wordpress/some-module' );

		$import_map_markup = get_echo( array( 'Gutenberg_Modules', 'print_import_map' ) );
		preg_match( '/<script type="importmap">([^<]+)<\/script>/s', $import_map_markup, $import_map_string );
		$import_map = json_decode( $import_map_string[1], true )['imports'];

		$this->assertEquals( true, strpos( $import_map['@wordpress/some-static-dep'], '/some-static-dep.js' ) === 0 );
		$this->assertEquals( true, strpos( $import_map['@wordpress/some-dynamic-dep'], '/some-dynamic-dep.js' ) === 0 );
		$this->assertEquals( true, strpos( $import_map['@wordpress/some-nested-static-dep'], '/some-nested-static-dep.js' ) === 0 );
		$this->assertEquals( true, strpos( $import_map['@wordpress/some-nested-dynamic-dep'], '/some-nested-dynamic-dep.js' ) === 0 );
		$this->assertEquals( false, isset( $import_map['@wordpress/no-dep'] ) );
	}

	public function test_gutenberg_enqueue_module_preloads_static_dependencies() {
		gutenberg_register_module( '@wordpress/no-dep', '/no-dep.js' );
		gutenberg_register_module( '@wordpress/some-nested-static-dep', '/some-nested-static-dep.js' );
		gutenberg_register_module( '@wordpress/some-nested-dynamic-dep', '/some-nested-dynamic-dep.js' );
		gutenberg_register_module(
			'@wordpress/some-static-dep',
			'/some-static-dep.js',
			array(
				array(
					'id'   => '@wordpress/some-nested-static-dep',
					'type' => 'static',
				),
				array(
					'id'   => '@wordpress/some-nested-dynamic-dep',
					'type' => 'dynamic',
				),
			)
		);
		gutenberg_register_module( '@wordpress/some-dynamic-dep', '/some-dynamic-dep.js', array( '@wordpress/some-nested-dep' ) );
		gutenberg_register_module(
			'@wordpress/some-module',
			'/some-module.js',
			array(
				'@wordpress/some-static-dep',
				array(
					'id'   => 'some-dynamic-dep',
					'type' => 'dynamic',
				),
			)
		);
		gutenberg_enqueue_module( '@wordpress/some-module' );

		$preloaded_markup  = get_echo( array( 'Gutenberg_Modules', 'print_preloaded_modules' ) );
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

		$this->assertEquals( 2, count( $preloaded_modules ) );
		$this->assertEquals( true, strpos( $preloaded_modules['@wordpress/some-static-dep'], '/some-static-dep.js' ) === 0 );
		$this->assertEquals( true, strpos( $preloaded_modules['@wordpress/some-nested-static-dep'], '/some-nested-static-dep.js' ) === 0 );
		$this->assertEquals( false, isset( $import_map['@wordpress/no-dep'] ) );
		$this->assertEquals( false, isset( $import_map['@wordpress/some-dynamic-dep'] ) );
		$this->assertEquals( false, isset( $import_map['@wordpress/some-nested-dynamic-dep'] ) );
	}

	// public function test_gutenberg_modules_get_version() {}.
	// public function test_gutenberg_dont_crash_on_missing_dependency() {}.
}
