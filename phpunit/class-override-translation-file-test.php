<?php
/**
 * Test `gutenberg_override_translation_file`.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_override_translation_file
 */
class Override_Translation_File_Test extends WP_UnitTestCase {

	/**
	 * The script modules registry before the test.
	 *
	 * @var WP_Script_Modules|null
	 */
	private $original_script_modules;

	/**
	 * Sets up each test with a new script modules registry.
	 */
	public function set_up() {
		global $wp_script_modules;
		parent::set_up();

		$this->original_script_modules = $wp_script_modules;
		$wp_script_modules             = new WP_Script_Modules();
	}

	/**
	 * Restores the script modules registry.
	 */
	public function tear_down() {
		global $wp_script_modules;
		$wp_script_modules = $this->original_script_modules;

		parent::tear_down();
	}

	/**
	 * Gets the translation files that WordPress tries for a script module.
	 *
	 * @param string $id Script module ID.
	 * @return string[] Paths of the translation files, as filtered by `gutenberg_override_translation_file()`.
	 */
	private function get_script_module_translation_files( $id ) {
		$files = array();
		add_filter(
			'load_script_translation_file',
			static function ( $file ) use ( &$files ) {
				$files[] = $file;
				return $file;
			},
			11
		);

		load_script_module_textdomain( $id );

		return $files;
	}

	/**
	 * The translations of a script module served from the plugin's `build/`
	 * folder are looked up in the plugin translation file, named after the
	 * unminified path of the script module.
	 *
	 * @dataProvider data_plugin_script_modules
	 *
	 * @param string $id   Script module ID.
	 * @param string $path Path of the script module in the plugin, without the extension.
	 */
	public function test_looks_up_the_plugin_translation_file_of_a_plugin_script_module( $id, $path ) {
		wp_register_script_module( $id, gutenberg_url( $path . '.min.js' ) );

		$this->assertContains(
			WP_LANG_DIR . '/plugins/gutenberg-' . determine_locale() . '-' . md5( $path . '.js' ) . '.json',
			$this->get_script_module_translation_files( $id )
		);
	}

	/**
	 * Data provider: the script modules the plugin serves.
	 *
	 * @return array[]
	 */
	public function data_plugin_script_modules() {
		return array(
			'script module'       => array( '@wordpress/boot', 'build/modules/boot/index' ),
			'route script module' => array( 'wp/routes/connectors-home/content', 'build/routes/connectors-home/content' ),
		);
	}

	/**
	 * The translations of a script module served by another plugin are
	 * looked up in the default translation file.
	 */
	public function test_looks_up_the_default_translation_file_of_another_plugin_script_module() {
		wp_register_script_module( 'other-plugin/module', plugins_url( 'build/index.min.js', WP_PLUGIN_DIR . '/other-plugin/other-plugin.php' ) );

		$this->assertContains(
			WP_LANG_DIR . '/plugins/' . determine_locale() . '-' . md5( 'build/index.js' ) . '.json',
			$this->get_script_module_translation_files( 'other-plugin/module' )
		);
	}
}
