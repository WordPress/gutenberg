<?php
/**
 * Tests for how an experiment's enabled state is resolved.
 *
 * @package gutenberg
 */

class Experiments_Test extends WP_UnitTestCase {
	/**
	 * The `gutenberg-experiments` option as the test suite set it up.
	 *
	 * @var mixed
	 */
	private $original_experiments;

	/**
	 * Plugin files written by `activate_mock_plugin()`, to remove afterwards.
	 *
	 * @var string[]
	 */
	private $mock_plugins = array();

	public function set_up() {
		parent::set_up();

		$this->original_experiments = get_option( 'gutenberg-experiments' );

		// Other tests short-circuit the option; read the stored value here.
		remove_all_filters( 'pre_option_gutenberg-experiments' );
	}

	public function tear_down() {
		foreach ( $this->mock_plugins as $basename ) {
			$path = WP_PLUGIN_DIR . '/' . $basename;

			if ( file_exists( $path ) ) {
				unlink( $path );
				rmdir( dirname( $path ) );
			}
		}
		$this->mock_plugins = array();

		if ( false === $this->original_experiments ) {
			delete_option( 'gutenberg-experiments' );
		} else {
			update_option( 'gutenberg-experiments', $this->original_experiments );
		}

		parent::tear_down();
	}

	/**
	 * Adds a plugin to the active plugins list, optionally writing a plugin
	 * file with the given version for the header reader to find.
	 *
	 * @param string      $basename Plugin basename, e.g. `foo/foo.php`.
	 * @param string|null $version  Version header, or null to leave the file out.
	 */
	private function activate_mock_plugin( $basename, $version = null ) {
		if ( null !== $version ) {
			$path = WP_PLUGIN_DIR . '/' . $basename;

			wp_mkdir_p( dirname( $path ) );
			file_put_contents( $path, "<?php\n/*\nPlugin Name: Mock\nVersion: $version\n*/\n" );

			$this->mock_plugins[] = $basename;
		}

		add_filter(
			'option_active_plugins',
			static function () use ( $basename ) {
				return array( $basename );
			}
		);
	}

	public function test_experiment_the_site_has_not_chosen_is_off() {
		update_option( 'gutenberg-experiments', array() );

		$this->assertFalse( gutenberg_is_experiment_enabled( 'gutenberg-block-experiments' ) );
	}

	public function test_experiment_the_site_switched_on_is_on() {
		update_option( 'gutenberg-experiments', array( 'gutenberg-block-experiments' => true ) );

		$this->assertTrue( gutenberg_is_experiment_enabled( 'gutenberg-block-experiments' ) );
	}

	public function test_experiment_the_site_switched_off_is_off() {
		update_option( 'gutenberg-experiments', array( 'gutenberg-block-experiments' => false ) );

		$this->assertFalse( gutenberg_is_experiment_enabled( 'gutenberg-block-experiments' ) );
	}

	public function test_react_19_is_on_when_the_site_has_not_chosen() {
		update_option( 'gutenberg-experiments', array() );

		$this->assertTrue( gutenberg_get_experiment_default( 'gutenberg-react-19' ) );
		$this->assertTrue( gutenberg_is_experiment_enabled( 'gutenberg-react-19' ) );
	}

	public function test_react_19_is_off_when_the_site_switched_it_off() {
		update_option( 'gutenberg-experiments', array( 'gutenberg-react-19' => false ) );

		$this->assertFalse( gutenberg_is_experiment_enabled( 'gutenberg-react-19' ) );
	}

	public function test_no_incompatible_extension_is_detected_on_a_plain_site() {
		$this->assertFalse( gutenberg_has_react_19_incompatible_extension() );
	}

	public function test_an_active_plugin_with_no_fix_released_is_detected() {
		$this->activate_mock_plugin( 'meetinghub/meetinghub.php', '1.2.3' );

		$this->assertTrue( gutenberg_has_react_19_incompatible_extension() );
	}

	public function test_an_active_plugin_older_than_its_fix_is_detected() {
		$this->activate_mock_plugin( 'ultimate-blocks/ultimate-blocks.php', '3.5.9' );

		$this->assertTrue( gutenberg_has_react_19_incompatible_extension() );
	}

	public function test_an_active_plugin_that_shipped_its_fix_is_not_detected() {
		$this->activate_mock_plugin( 'ultimate-blocks/ultimate-blocks.php', '3.6.0' );

		$this->assertFalse( gutenberg_has_react_19_incompatible_extension() );
	}

	public function test_an_active_plugin_without_a_version_header_is_detected() {
		$this->activate_mock_plugin( 'ultimate-blocks/ultimate-blocks.php', '' );

		$this->assertTrue( gutenberg_has_react_19_incompatible_extension() );
	}

	public function test_an_active_plugin_missing_from_disk_is_not_detected() {
		$this->activate_mock_plugin( 'meetinghub/meetinghub.php' );

		$this->assertFalse( gutenberg_has_react_19_incompatible_extension() );
	}

	public function test_an_unrelated_active_plugin_is_not_detected() {
		$this->activate_mock_plugin( 'mock-unrelated-plugin/mock-unrelated-plugin.php', '1.0.0' );

		$this->assertFalse( gutenberg_has_react_19_incompatible_extension() );
	}

	public function test_an_active_incompatible_theme_is_detected() {
		add_filter(
			'template',
			static function () {
				return 'Divi';
			}
		);

		$this->assertTrue( gutenberg_has_react_19_incompatible_extension() );
	}
}
