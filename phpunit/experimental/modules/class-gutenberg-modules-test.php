<?php
/**
 * Tests Gutenberg_Classic_To_Block_Menu_Converter
 *
 * @package WordPress
 */

/**
 * Tests for the Gutenberg_Classic_To_Block_Menu_Converter_Test class.
 */
class Gutenberg_Modules_Test extends WP_UnitTestCase {
	public function test_register() {
		$module_identifier = 'test_module';
		$src               = 'test_src';
		$dependencies      = array(
			'static'  => array( 'dep1' ),
			'dynamic' => array( 'dep2' ),
		);
		$version           = '1.0.0';

		Gutenberg_Modules::register( $module_identifier, $src, $dependencies, $version );

		// Use reflection to access the private static property $registered.
		$reflection = new ReflectionClass( 'Gutenberg_Modules' );
		$property   = $reflection->getProperty( 'registered' );
		$property->setAccessible( true );
		$registered = $property->getValue();

		// Assert that the module was registered correctly.
		$this->assertArrayHasKey( $module_identifier, $registered );
		$this->assertSame( $src, $registered[ $module_identifier ]['src'] );
		$this->assertSame( $version, $registered[ $module_identifier ]['version'] );
		$this->assertSame( $dependencies, $registered[ $module_identifier ]['dependencies'] );
	}

	public function test_enqueue() {
		$module_identifier = 'test_module_enqueued';
		Gutenberg_Modules::enqueue( $module_identifier );

		// Use reflection to access the private static property $enqueued.
		$reflection = new ReflectionClass( 'Gutenberg_Modules' );
		$property   = $reflection->getProperty( 'enqueued' );
		$property->setAccessible( true );
		$enqueued = $property->getValue();

		// Assert that the module was enqueued correctly.
		$this->assertContains( $module_identifier, $enqueued );
	}

	public function test_get_dependencies() {
		$parent_module         = 'module_1';
		$parent_module_src     = 'module_1_src';
		$dependant_module      = 'module_2';
		$dependant_module_src  = 'module_2_src';
		$dependant_module_deps = array(
			$parent_module,
		);
		$version               = '1.0.0';
		$empty_deps            = array();

		Gutenberg_Modules::register( $parent_module, $parent_module_src, $empty_deps, $version );
		Gutenberg_Modules::register( $dependant_module, $dependant_module_src, $dependant_module_deps, $version );

		// Use reflection to call the private method get_dependencies.
		$reflection = new ReflectionClass( 'Gutenberg_Modules' );
		$method     = $reflection->getMethod( 'get_dependencies' );
		$method->setAccessible( true );
		$dependencies = $method->invokeArgs( null, array( array( $dependant_module ) ) );
		$this->assertArrayHasKey( $parent_module, $dependencies );
		$this->assertArrayHasKey( 'src', $dependencies[ $parent_module ] );
		$this->assertArrayHasKey( 'version', $dependencies[ $parent_module ] );
		$this->assertArrayHasKey( 'dependencies', $dependencies[ $parent_module ] );
	}

	public function test_get_version_query_string() {
		$version = '1.0.0';
		// Use reflection to call the private method get_version_query_string.
		$reflection = new ReflectionClass( 'Gutenberg_Modules' );
		$method     = $reflection->getMethod( 'get_version_query_string' );
		$method->setAccessible( true );
		$version_query_string = $method->invokeArgs( null, array( $version ) );

		// Assert that the version query string is correct.
		$this->assertSame( '?ver=' . $version, $version_query_string );

		// Version is false.
		$version_query_string = $method->invokeArgs( null, array( false ) );
		$this->assertSame( '?ver=' . get_bloginfo( 'version' ), $version_query_string );
		// Default.
		$version_query_string = $method->invokeArgs( null, array( null ) );
		$this->assertSame( '', $version_query_string );
	}

	public function test_get_import_map() {
		$parent_module         = 'module_1';
		$parent_module_src     = 'module_1_src';
		$dependant_module      = 'module_2';
		$dependant_module_src  = 'module_2_src';
		$dependant_module_deps = array(
			$parent_module,
		);
		$version               = '1.0.0';
		$empty_deps            = array();

		Gutenberg_Modules::register( $parent_module, $parent_module_src, $empty_deps, $version );
		Gutenberg_Modules::register( $dependant_module, $dependant_module_src, $dependant_module_deps, $version );
		Gutenberg_Modules::enqueue( $parent_module );
		Gutenberg_Modules::enqueue( $dependant_module );

		$import_map = Gutenberg_Modules::get_import_map();

		// Assert that the import map is correct.
		$this->assertArrayHasKey( 'imports', $import_map );
		$this->assertArrayHasKey( $parent_module, $import_map['imports'] );
		$this->assertSame( $parent_module_src . '?ver=' . $version, $import_map['imports'][ $parent_module ] );
	}
}
