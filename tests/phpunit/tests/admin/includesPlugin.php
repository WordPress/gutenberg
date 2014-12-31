<?php
/**
 * @group plugins
 * @group admin
 */
class Tests_Admin_includesPlugin extends WP_UnitTestCase {
	function test_get_plugin_data() {
		$data = get_plugin_data( DIR_TESTDATA . '/plugins/hello.php' );

		$default_headers = array(
			'Name' => 'Hello Dolly',
			'Title' => '<a href="http://wordpress.org/#">Hello Dolly</a>',
			'PluginURI' => 'http://wordpress.org/#',
			'Description' => 'This is not just a plugin, it symbolizes the hope and enthusiasm of an entire generation summed up in two words sung most famously by Louis Armstrong: Hello, Dolly. When activated you will randomly see a lyric from Hello, Dolly in the upper right of your admin screen on every page. <cite>By <a href="http://ma.tt/">Matt Mullenweg</a>.</cite>',
			'Author' => '<a href="http://ma.tt/">Matt Mullenweg</a>',
			'AuthorURI' => 'http://ma.tt/',
			'Version' => '1.5.1',
			'TextDomain' => 'hello-dolly',
			'DomainPath' => ''
		);

		$this->assertTrue( is_array($data) );

		foreach ($default_headers as $name => $value) {
			$this->assertTrue(isset($data[$name]));
			$this->assertEquals($value, $data[$name]);
		}
	}

	function test_menu_page_url() {
		$current_user = get_current_user_id();
		wp_set_current_user( $this->factory->user->create( array( 'role' => 'administrator' ) ) );
		update_option( 'siteurl', 'http://example.com' );

		// add some pages
		add_options_page( 'Test Settings', 'Test Settings', 'manage_options', 'testsettings', 'mt_settings_page' );
		add_management_page( 'Test Tools', 'Test Tools', 'manage_options', 'testtools', 'mt_tools_page' );
		add_menu_page( 'Test Toplevel', 'Test Toplevel', 'manage_options', 'mt-top-level-handle', 'mt_toplevel_page' );
		add_submenu_page( 'mt-top-level-handle', 'Test Sublevel', 'Test Sublevel', 'manage_options', 'sub-page', 'mt_sublevel_page' );
		add_submenu_page( 'mt-top-level-handle', 'Test Sublevel 2', 'Test Sublevel 2', 'manage_options', 'sub-page2', 'mt_sublevel_page2' );
		add_theme_page( 'With Spaces', 'With Spaces', 'manage_options', 'With Spaces', 'mt_tools_page' );
		add_pages_page( 'Appending Query Arg', 'Test Pages', 'edit_pages', 'testpages', 'mt_pages_page' );

		$expected['testsettings'] = 'http://example.com/wp-admin/options-general.php?page=testsettings';
		$expected['testtools'] = 'http://example.com/wp-admin/tools.php?page=testtools';
		$expected['mt-top-level-handle'] = 'http://example.com/wp-admin/admin.php?page=mt-top-level-handle';
		$expected['sub-page'] = 'http://example.com/wp-admin/admin.php?page=sub-page';
		$expected['sub-page2'] = 'http://example.com/wp-admin/admin.php?page=sub-page2';
		$expected['not_registered'] = '';
		$expected['With Spaces'] = 'http://example.com/wp-admin/themes.php?page=WithSpaces';
		$expected['testpages'] = 'http://example.com/wp-admin/edit.php?post_type=page&#038;page=testpages';

		foreach ($expected as $name => $value) {
			$this->assertEquals( $value, menu_page_url( $name, false ) );
		}

		wp_set_current_user( $current_user );
	}

	function test_is_plugin_active_true() {
		activate_plugin( 'hello.php' );
		$test = is_plugin_active( 'hello.php' );
		$this->assertTrue( $test );

		deactivate_plugins( 'hello.php' );
	}

	function test_is_plugin_active_false() {
		deactivate_plugins( 'hello.php' );
		$test = is_plugin_active( 'hello.php' );
		$this->assertFalse( $test );
	}

	function test_is_plugin_inactive_true() {
		deactivate_plugins( 'hello.php' );
		$test = is_plugin_inactive( 'hello.php' );
		$this->assertTrue( $test );
	}

	function test_is_plugin_inactive_false() {
		activate_plugin( 'hello.php' );
		$test = is_plugin_inactive( 'hello.php' );
		$this->assertFalse( $test );

		deactivate_plugins( 'hello.php' );
	}

	/**
	 * @covers ::get_plugin_files
	 */
	public function test_get_plugin_files_single() {
		$name = 'hello.php';
		$this->assertEquals( array( $name ), get_plugin_files( $name ) );
	}

	/**
	 * @covers ::get_mu_plugins
	 */
	public function test_get_mu_plugins_when_mu_plugins_exists_but_is_empty() {
		if ( is_dir( WPMU_PLUGIN_DIR ) ) {
			$exists = true;
			$this->_back_up_mu_plugins();
		} else {
			$exists = false;
			mkdir( WPMU_PLUGIN_DIR );
		}

		$this->assertEquals( array(), get_mu_plugins() );

		// Clean up.
		if ( $exists ) {
			$this->_restore_mu_plugins();
		} else {
			rmdir( WPMU_PLUGIN_DIR );
		}
	}

	/**
	 * @covers ::get_mu_plugins
	 */
	public function test_get_mu_plugins_when_mu_plugins_directory_does_not_exist() {
		$exists = false;
		if ( is_dir( WPMU_PLUGIN_DIR ) ) {
			$exists = true;
			$this->_back_up_mu_plugins();
			rmdir( WPMU_PLUGIN_DIR );
		}

		$this->assertEquals( array(), get_mu_plugins() );

		// Clean up.
		if ( $exists ) {
			mkdir( WPMU_PLUGIN_DIR );
			$this->_restore_mu_plugins();
		}
	}

	/**
	 * @covers ::get_mu_plugins
	 */
	public function test_get_mu_plugins_should_ignore_index_php_containing_silence_is_golden() {
		if ( is_dir( WPMU_PLUGIN_DIR ) ) {
			$exists = true;
			$this->_back_up_mu_plugins();
		} else {
			$exists = false;
			mkdir( WPMU_PLUGIN_DIR );
		}

		$this->_create_plugin( '<?php\n//Silence is golden.', 'index.php', WPMU_PLUGIN_DIR );
		$this->assertEquals( array(), get_mu_plugins() );

		// Clean up.
		unlink( WPMU_PLUGIN_DIR . '/index.php' );
		if ( $exists ) {
			$this->_restore_mu_plugins();
		} else {
			rmdir( WPMU_PLUGIN_DIR );
		}
	}

	/**
	 * @covers ::get_mu_plugins
	 */
	public function test_get_mu_plugins_should_not_ignore_index_php_containing_something_other_than_silence_is_golden() {
		if ( is_dir( WPMU_PLUGIN_DIR ) ) {
			$exists = true;
			$this->_back_up_mu_plugins();
		} else {
			$exists = false;
			mkdir( WPMU_PLUGIN_DIR );
		}

		$this->_create_plugin( '<?php\n//Silence is not golden.', 'index.php', WPMU_PLUGIN_DIR );
		$found = get_mu_plugins();
		$this->assertEquals( array( 'index.php' ), array_keys( $found ) );

		// Clean up.
		unlink( WPMU_PLUGIN_DIR . '/index.php' );
		if ( $exists ) {
			$this->_restore_mu_plugins();
		} else {
			rmdir( WPMU_PLUGIN_DIR );
		}
	}

	/**
	 * @covers ::get_mu_plugins
	 */
	public function test_get_mu_plugins_should_ignore_files_without_php_extensions() {
		if ( is_dir( WPMU_PLUGIN_DIR ) ) {
			$exists = true;
			$this->_back_up_mu_plugins();
		} else {
			$exists = false;
			mkdir( WPMU_PLUGIN_DIR );
		}

		$this->_create_plugin( '<?php\n//Test', 'foo.php', WPMU_PLUGIN_DIR );
		$this->_create_plugin( '<?php\n//Test 2', 'bar.txt', WPMU_PLUGIN_DIR );
		$found = get_mu_plugins();
		$this->assertEquals( array( 'foo.php' ), array_keys( $found ) );

		// Clean up.
		unlink( WPMU_PLUGIN_DIR . '/foo.php' );
		unlink( WPMU_PLUGIN_DIR . '/bar.txt' );
		if ( $exists ) {
			$this->_restore_mu_plugins();
		} else {
			rmdir( WPMU_PLUGIN_DIR );
		}
	}

	/**
	 * @covers ::_sort_uname_callback
	 */
	public function test__sort_uname_callback() {
		$this->assertLessThan( 0, _sort_uname_callback( array( 'Name' => 'a' ), array( 'Name' => 'b' ) ) );
		$this->assertGreaterThan( 0, _sort_uname_callback( array( 'Name' => 'c' ), array( 'Name' => 'b' ) ) );
		$this->assertEquals( 0, _sort_uname_callback( array( 'Name' => 'a' ), array( 'Name' => 'a' ) ) );
	}

	/**
	 * @covers ::get_dropins
	 */
	public function test_get_dropins_empty() {
		$this->_back_up_drop_ins();

		$this->assertEquals( array(), get_dropins() );

		// Clean up.
		$this->_restore_drop_ins();
	}

	/**
	 * @covers ::get_dropins
	 */
	public function test_get_dropins_not_empty() {
		$this->_back_up_drop_ins();

		$p1 = $this->_create_plugin( "<?php\n//Test", 'advanced-cache.php', WP_CONTENT_DIR );
		$p2 = $this->_create_plugin( "<?php\n//Test", 'not-a-dropin.php', WP_CONTENT_DIR );

		$dropins = get_dropins();
		$this->assertEquals( array( 'advanced-cache.php' ), array_keys( $dropins ) );

		unlink( $p1[1] );
		unlink( $p2[1] );

		// Clean up.
		$this->_restore_drop_ins();
	}

	/**
	 * @covers ::is_network_only_plugin
	 */
	public function test_is_network_only_plugin_hello() {
		$this->assertFalse( is_network_only_plugin( 'hello.php' ) );
	}

	/**
	 * @covers ::is_network_only_plugin
	 */
	public function test_is_network_only_plugin() {
		$p = $this->_create_plugin( "<?php\n/*\nPlugin Name: test\nNetwork: true" );

		$this->assertTrue( is_network_only_plugin( $p[0] ) );

		unlink( $p[1] );
	}

	/**
	 * @covers ::activate_plugins
	 */
	public function test_activate_plugins_single_no_array() {
		$name = 'hello.php';
		activate_plugins( $name );
		$this->assertTrue( is_plugin_active( $name ) );
		deactivate_plugins( $name );
	}

	/**
	 * @covers ::activate_plugins
	 */
	public function test_activate_plugins_single_array() {
		$name = 'hello.php';
		activate_plugins( array( $name ) );
		$this->assertTrue( is_plugin_active( $name ) );
		deactivate_plugins( $name );
	}

	/**
	 * @covers ::validate_active_plugins
	 */
	public function test_validate_active_plugins_remove_invalid() {
		$plugin = $this->_create_plugin();

		activate_plugin( $plugin[ 0 ] );
		unlink( $plugin[ 1 ] );

		$result = validate_active_plugins();
		$this->assertTrue( isset( $result[ $plugin[ 0 ] ] ) );
	}

	/**
	 * @covers ::validate_active_plugins
	 */
	public function test_validate_active_plugins_empty() {
		$this->assertEquals( array(), validate_active_plugins() );
	}

	/**
	 * @covers ::is_uninstallable_plugin
	 */
	public function test_is_uninstallable_plugin() {
		$this->assertFalse( is_uninstallable_plugin( 'hello' ) );
	}

	/**
	 * @covers ::is_uninstallable_plugin
	 */
	public function test_is_uninstallable_plugin_true() {
		$plugin = $this->_create_plugin();

		$uninstallable_plugins = (array) get_option( 'uninstall_plugins' );
		$uninstallable_plugins[ $plugin[0] ] = true;
		update_option( 'uninstall_plugins', $uninstallable_plugins );

		$this->assertTrue( is_uninstallable_plugin( $plugin[0] ) );

		unset( $uninstallable_plugins[ $plugin[0] ] );
		update_option( 'uninstall_plugins', $uninstallable_plugins );

		unlink( $plugin[1] );
	}

	/**
	 * Generate a plugin.
	 *
	 * This creates a single-file plugin.
	 *
	 * @since 4.2.0
	 *
	 * @access private
	 *
	 * @param string $data     Optional. Data for the plugin file. Default is a dummy plugin header.
	 * @param string $filename Optional. Filename for the plugin file. Default is a random string.
	 * @param string $dir_path Optional. Path for directory where the plugin should live.
	 * @return array Two-membered array of filename and full plugin path.
	 */
	private function _create_plugin( $data = "<?php\n/*\nPlugin Name: Test\n*/", $filename = false, $dir_path = false ) {
		if ( false === $filename ) {
			$filename = rand_str() . '.php';
		}

		if ( false === $dir_path ) {
			$dir_path = WP_PLUGIN_DIR;
		}

		$full_name = $dir_path . '/' . wp_unique_filename( $dir_path, $filename );

		$file = fopen( $full_name, 'w' );
		fwrite( $file, $data );
		fclose( $file );

		return array( $filename, $full_name );
	}

	/**
	 * Move existing mu-plugins to wp-content/mu-plugin/backup.
	 *
	 * @since 4.2.0
	 *
	 * @access private
	 */
	private function _back_up_mu_plugins() {
		if ( is_dir( WPMU_PLUGIN_DIR ) ) {
			$mu_bu_dir = WP_CONTENT_DIR . '/mu-plugin-backup';
			if ( ! is_dir( $mu_bu_dir ) ) {
				mkdir( $mu_bu_dir );
			}

			$files_to_move = array();
			if ( $mu_plugins = opendir( WPMU_PLUGIN_DIR ) ) {
				while ( false !== $plugin = readdir( $mu_plugins ) ) {
					if ( 0 !== strpos( $plugin, '.' ) ) {
						$files_to_move[] = $plugin;
					}
				}
			}

			@closedir( $mu_plugins );

			foreach ( $files_to_move as $file_to_move ) {
				$f = rename( WPMU_PLUGIN_DIR . '/' . $file_to_move, $mu_bu_dir . '/' . $file_to_move );
			}
		}
	}

	/**
	 * Restore backed-up mu-plugins.
	 *
	 * @since 4.2.0
	 *
	 * @access private
	 */
	private function _restore_mu_plugins() {
		$mu_bu_dir = WP_CONTENT_DIR . '/mu-plugin-backup';
		$files_to_move = array();
		if ( is_dir( $mu_bu_dir ) && $mu_plugins = opendir( $mu_bu_dir ) ) {
			while ( false !== $plugin = readdir( $mu_plugins ) ) {
				if ( 0 !== strpos( $plugin, '.' ) ) {
					$files_to_move[] = $plugin;
				}
			}
		}

		@closedir( $mu_plugins );

		foreach ( $files_to_move as $file_to_move ) {
			rename( $mu_bu_dir . '/' . $file_to_move, WPMU_PLUGIN_DIR . '/' . $file_to_move );
		}

		if ( is_dir( $mu_bu_dir ) ) {
			rmdir( $mu_bu_dir );
		}
	}

	/**
	 * Move existing drop-ins to wp-content/drop-ins-backup.
	 *
	 * @since 4.2.0
	 *
	 * @access private
	 */
	private function _back_up_drop_ins() {
		$di_bu_dir = WP_CONTENT_DIR . '/drop-ins-backup';
		if ( ! is_dir( $di_bu_dir ) ) {
			mkdir( $di_bu_dir );
		}

		foreach( _get_dropins() as $file_to_move => $v ) {
			if ( file_exists( WP_CONTENT_DIR . '/' . $file_to_move ) ) {
				rename( WP_CONTENT_DIR . '/' . $file_to_move, $di_bu_dir . '/' . $file_to_move );
			}
		}
	}

	/**
	 * Restore backed-up drop-ins.
	 *
	 * @since 4.2.0
	 *
	 * @access private
	 */
	private function _restore_drop_ins() {
		$di_bu_dir = WP_CONTENT_DIR . '/drop-ins-backup';

		foreach( _get_dropins() as $file_to_move => $v ) {
			if ( file_exists( $di_bu_dir . '/' . $file_to_move ) ) {
				rename( $di_bu_dir . '/' . $file_to_move, WP_CONTENT_DIR . '/' . $file_to_move );
			}
		}

		if ( is_dir( $di_bu_dir ) ) {
			rmdir( $di_bu_dir );
		}
	}
}
