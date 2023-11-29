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

	protected $old_wp_scripts;
	protected $old_modules_markup;

	public function set_up() {
		parent::set_up();

		$this->old_wp_scripts = isset( $GLOBALS['wp_scripts'] ) ? $GLOBALS['wp_scripts'] : null;
		remove_action( 'wp_default_scripts', 'wp_default_scripts' );
		remove_action( 'wp_default_scripts', 'wp_default_packages' );
		$GLOBALS['wp_scripts']    = new WP_Scripts();
		$this->old_modules_markup = get_echo( array( 'Gutenberg_Modules', 'print_enqueued_modules' ) );
	}

	public function tear_down() {
		$GLOBALS['wp_scripts'] = $this->old_wp_scripts;
		add_action( 'wp_default_scripts', 'wp_default_scripts' );
		parent::tear_down();
	}

	public function test_wp_enqueue_module() {
		global $wp_version;
		gutenberg_register_module( 'no-deps-no-version', 'interactivity-api-1.js' );
		gutenberg_enqueue_module( 'no-deps-no-version' );
		gutenberg_register_module( 'deps-no-version', 'interactivity-api-2.js', array( 'no-deps-no-version' ) );
		gutenberg_enqueue_module( 'deps-no-version' );

		$modules_markup    = get_echo( array( 'Gutenberg_Modules', 'print_enqueued_modules' ) );
		$import_map_markup = get_echo( array( 'Gutenberg_Modules', 'print_import_map' ) );
		$preload_markup    = get_echo( array( 'Gutenberg_Modules', 'print_module_preloads' ) );

		$previous_tags      = new WP_HTML_Tag_Processor( $this->old_modules_markup );
		$previous_src_stack = array();
		while ( $previous_tags->next_tag( array( 'type' => 'module' ) ) ) {
			$previous_src_stack[] = $previous_tags->get_attribute( 'src' );
		}
		// Test that there are 2 new <script type="module"> added to the markup.
		$tags      = new WP_HTML_Tag_Processor( $modules_markup );
		$src_stack = array();
		while ( $tags->next_tag( array( 'type' => 'module' ) ) ) {
			$src_stack[] = $tags->get_attribute( 'src' );
		}
		$new_src_stack = array_values( array_diff( $src_stack, $previous_src_stack ) );
		$this->assertEquals( 2, count( $new_src_stack ) );
		$this->assertEquals( 'interactivity-api-1.js?ver=' . $wp_version, $new_src_stack[0] );
		$this->assertEquals( 'interactivity-api-2.js?ver=' . $wp_version, $new_src_stack[1] );
		// Test that there is 1 <script type="importmap"> added to the markup.
		$tags = new WP_HTML_Tag_Processor( $import_map_markup );
		$this->assertEquals( true, $tags->next_tag( array( 'rel' => 'importmap' ) ) );

		// Test that there is 1 <link type="modulepreload"> added to the markup.
		$tags = new WP_HTML_Tag_Processor( $preload_markup );
		$this->assertEquals( true, $tags->next_tag( array( 'rel' => 'modulepreload' ) ) );
	}
}
