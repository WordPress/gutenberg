<?php
/**
 * Tests for the translations of the script modules that classic scripts
 * depend on.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_print_script_module_translations
 * @covers ::gutenberg_get_classic_script_module_dependencies
 * @covers ::gutenberg_replace_script_module_translations_hooks
 */
class Gutenberg_Script_Module_Translations_Test extends WP_UnitTestCase {

	/**
	 * The script modules registry before the test.
	 *
	 * @var WP_Script_Modules|null
	 */
	private $original_script_modules;

	/**
	 * The classic scripts registry before the test.
	 *
	 * @var WP_Scripts|null
	 */
	private $original_scripts;

	/**
	 * Sets up each test with new script modules and classic scripts registries.
	 */
	public function set_up() {
		global $wp_script_modules, $wp_scripts;
		parent::set_up();

		$this->original_script_modules = $wp_script_modules;
		$this->original_scripts        = $wp_scripts;
		$wp_script_modules             = new WP_Script_Modules();
		$wp_scripts                    = new WP_Scripts();
	}

	/**
	 * Restores the registries.
	 */
	public function tear_down() {
		global $wp_script_modules, $wp_scripts;
		$wp_script_modules = $this->original_script_modules;
		$wp_scripts        = $this->original_scripts;

		parent::tear_down();
	}

	/**
	 * Provides translations for the given script modules through the
	 * `pre_load_script_translations` filter.
	 *
	 * @param string[] $ids Script module IDs.
	 */
	private function add_script_module_translations( array $ids ) {
		add_filter(
			'pre_load_script_translations',
			static function ( $translations, $file, $handle ) use ( $ids ) {
				if ( ! in_array( $handle, $ids, true ) ) {
					return $translations;
				}
				return wp_json_encode(
					array(
						'locale_data' => array(
							'messages' => array(
								''                   => array(
									'domain' => 'messages',
									'lang'   => 'es',
								),
								"Hello from $handle" => array( "Hola desde $handle" ),
							),
						),
					)
				);
			},
			10,
			3
		);
	}

	/**
	 * Gets the translation scripts in the given markup.
	 *
	 * @param string $markup Markup with the translation scripts.
	 * @return array[] For each script, in the order they are printed, the ID of
	 *                 its script module and its text.
	 */
	private function get_script_module_translations( $markup ) {
		$prefix       = 'wp-script-module-translation-data-';
		$translations = array();
		$processor    = new WP_HTML_Tag_Processor( $markup );
		while ( $processor->next_tag( 'SCRIPT' ) ) {
			$id = $processor->get_attribute( 'id' );
			if ( is_string( $id ) && str_starts_with( $id, $prefix ) ) {
				$translations[] = array( substr( $id, strlen( $prefix ) ), $processor->get_modifiable_text() );
			}
		}
		return $translations;
	}

	/**
	 * Gets the IDs of the script modules whose translations are in the given
	 * markup.
	 *
	 * @param string $markup Markup with the translation scripts.
	 * @return string[] Script module IDs, once per translation script.
	 */
	private function get_script_module_translation_ids( $markup ) {
		return array_column( $this->get_script_module_translations( $markup ), 0 );
	}

	/**
	 * Removes the hooks of `gutenberg_print_script_module_translations()`,
	 * which the plugin adds when it loads. The hooks are restored on tear
	 * down.
	 */
	private function remove_gutenberg_hooks() {
		remove_action( 'wp_footer', 'gutenberg_print_script_module_translations', 21 );
		remove_action( 'admin_print_footer_scripts', 'gutenberg_print_script_module_translations', 11 );
	}

	/**
	 * The translations of a script module that only a classic script
	 * imports are printed, along with the translations of the static and
	 * dynamic dependencies of the script module.
	 *
	 * @dataProvider data_module_dependencies
	 *
	 * @param array $module_dependencies The `module_dependencies` of the classic script.
	 */
	public function test_prints_the_translations_of_the_script_modules_that_a_classic_script_depends_on( $module_dependencies ) {
		wp_register_script_module( 'static-dependency', '/static-dependency.js' );
		wp_register_script_module( 'dynamic-dependency', '/dynamic-dependency.js' );
		wp_register_script_module(
			'imported',
			'/imported.js',
			array(
				'static-dependency',
				array(
					'id'     => 'dynamic-dependency',
					'import' => 'dynamic',
				),
			)
		);
		wp_enqueue_script(
			'classic',
			'/classic.js',
			array(),
			false,
			array(
				'in_footer'           => true,
				'module_dependencies' => $module_dependencies,
			)
		);
		$this->add_script_module_translations( array( 'imported', 'static-dependency', 'dynamic-dependency' ) );

		$output = get_echo( 'gutenberg_print_script_module_translations' );

		$this->assertEqualSets(
			array( 'imported', 'static-dependency', 'dynamic-dependency' ),
			$this->get_script_module_translation_ids( $output ),
			'The translations of the imported script module and of each of its dependencies are printed once.'
		);
		$this->assertStringContainsString( 'Hola desde imported', $output );
	}

	/**
	 * Data provider: the forms an entry of `module_dependencies` can take.
	 *
	 * @return array[]
	 */
	public function data_module_dependencies() {
		return array(
			'script module ID' => array( array( 'imported' ) ),
			'static import'    => array(
				array(
					array(
						'id'     => 'imported',
						'import' => 'static',
					),
				),
			),
			'dynamic import'   => array(
				array(
					array(
						'id'     => 'imported',
						'import' => 'dynamic',
					),
				),
			),
		);
	}

	/**
	 * The translations of a script module that a dependency of the enqueued
	 * classic script imports are printed.
	 */
	public function test_prints_the_translations_of_the_script_modules_that_a_classic_script_dependency_depends_on() {
		wp_register_script_module( 'imported', '/imported.js' );
		wp_register_script(
			'classic-dependency',
			'/classic-dependency.js',
			array(),
			false,
			array(
				'in_footer'           => true,
				'module_dependencies' => array( 'imported' ),
			)
		);
		wp_enqueue_script( 'classic', '/classic.js', array( 'classic-dependency' ), false, array( 'in_footer' => true ) );
		$this->add_script_module_translations( array( 'imported' ) );

		$output = get_echo( 'gutenberg_print_script_module_translations' );

		$this->assertSame( array( 'imported' ), $this->get_script_module_translation_ids( $output ) );
	}

	/**
	 * Nothing is printed for the script modules of a classic script that is
	 * not enqueued.
	 */
	public function test_prints_nothing_for_a_classic_script_that_is_not_enqueued() {
		wp_register_script_module( 'imported', '/imported.js' );
		wp_register_script(
			'classic',
			'/classic.js',
			array(),
			false,
			array(
				'in_footer'           => true,
				'module_dependencies' => array( 'imported' ),
			)
		);
		$this->add_script_module_translations( array( 'imported' ) );

		$this->assertSame( '', get_echo( 'gutenberg_print_script_module_translations' ) );
	}

	/**
	 * The translations of a script module that is both enqueued and a
	 * dependency of a classic script are printed once.
	 */
	public function test_prints_the_translations_of_a_script_module_once() {
		wp_register_script_module( 'imported', '/imported.js' );
		wp_enqueue_script_module( 'imported' );
		wp_enqueue_script(
			'classic',
			'/classic.js',
			array(),
			false,
			array(
				'in_footer'           => true,
				'module_dependencies' => array( 'imported' ),
			)
		);
		$this->add_script_module_translations( array( 'imported' ) );

		$output = get_echo( 'gutenberg_print_script_module_translations' );

		$this->assertSame( array( 'imported' ), $this->get_script_module_translation_ids( $output ) );
	}

	/**
	 * A script module that a classic script depends on but is not registered
	 * is skipped with no notice, since WordPress already triggers one when it
	 * prints the import map.
	 */
	public function test_skips_a_script_module_that_is_not_registered() {
		wp_enqueue_script(
			'classic',
			'/classic.js',
			array(),
			false,
			array(
				'in_footer'           => true,
				'module_dependencies' => array( 'not-registered' ),
			)
		);

		$this->assertSame( '', get_echo( 'gutenberg_print_script_module_translations' ) );
	}

	/**
	 * The translations of the enqueued script modules and of their
	 * dependencies are printed as WordPress prints them, with the text
	 * domain the script module sets.
	 */
	public function test_prints_the_translations_of_the_enqueued_script_modules_as_wordpress_does() {
		wp_register_script_module( 'dependency', '/dependency.js' );
		wp_register_script_module( 'enqueued', '/enqueued.js', array( 'dependency' ) );
		wp_set_script_module_translations( 'enqueued', 'my-plugin' );
		wp_enqueue_script_module( 'enqueued' );
		$this->add_script_module_translations( array( 'dependency', 'enqueued' ) );

		$expected = $this->get_script_module_translations( get_echo( array( wp_script_modules(), 'print_script_module_translations' ) ) );
		$actual   = $this->get_script_module_translations( get_echo( 'gutenberg_print_script_module_translations' ) );

		$this->assertCount( 2, $expected, 'WordPress prints the translations of both script modules.' );
		$this->assertEqualSets( $expected, $actual );
		$this->assertStringContainsString( '"my-plugin"', array_column( $actual, 1, 0 )['enqueued'], 'The text domain of the script module is used.' );
	}

	/**
	 * The plugin replaced the hooks of WordPress when it loaded.
	 */
	public function test_the_hooks_were_replaced_when_the_plugin_loaded() {
		$this->assertSame( 11, has_action( 'after_setup_theme', 'gutenberg_replace_script_module_translations_hooks' ), 'The hooks are replaced after WordPress adds them, on `after_setup_theme`.' );
		$this->assertSame( 21, has_action( 'wp_footer', 'gutenberg_print_script_module_translations' ) );
		$this->assertSame( 11, has_action( 'admin_print_footer_scripts', 'gutenberg_print_script_module_translations' ) );
	}

	/**
	 * The hooks of `WP_Script_Modules::print_script_module_translations()`
	 * are replaced with `gutenberg_print_script_module_translations()`, at
	 * the same priorities.
	 */
	public function test_replaces_the_hooks_of_wordpress() {
		$this->remove_gutenberg_hooks();
		wp_script_modules()->add_hooks();

		gutenberg_replace_script_module_translations_hooks();

		$callback = array( wp_script_modules(), 'print_script_module_translations' );
		$this->assertFalse( has_action( 'wp_footer', $callback ) );
		$this->assertFalse( has_action( 'admin_print_footer_scripts', $callback ) );
		$this->assertSame( 21, has_action( 'wp_footer', 'gutenberg_print_script_module_translations' ) );
		$this->assertSame( 11, has_action( 'admin_print_footer_scripts', 'gutenberg_print_script_module_translations' ) );
	}

	/**
	 * A hook of `WP_Script_Modules::print_script_module_translations()` that
	 * was removed stays removed.
	 */
	public function test_does_not_replace_a_hook_that_was_removed() {
		$this->remove_gutenberg_hooks();
		wp_script_modules()->add_hooks();
		remove_action( 'wp_footer', array( wp_script_modules(), 'print_script_module_translations' ), 21 );

		gutenberg_replace_script_module_translations_hooks();

		$this->assertFalse( has_action( 'wp_footer', 'gutenberg_print_script_module_translations' ) );
		$this->assertSame( 11, has_action( 'admin_print_footer_scripts', 'gutenberg_print_script_module_translations' ) );
	}
}
