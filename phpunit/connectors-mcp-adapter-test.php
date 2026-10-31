<?php
/**
 * Tests the MCP Adapter data sent to the Connectors page.
 *
 * @package gutenberg
 */

class Gutenberg_Connectors_Mcp_Adapter_Test extends WP_UnitTestCase {
	const PLUGIN_FILE = 'mcp-adapter/mcp-adapter.php';

	public function tear_down() {
		$dir = WP_PLUGIN_DIR . '/mcp-adapter';
		if ( file_exists( $dir . '/mcp-adapter.php' ) ) {
			unlink( $dir . '/mcp-adapter.php' );
			rmdir( $dir );
		}
		wp_clean_plugins_cache( false );

		parent::tear_down();
	}

	private function install_stub_plugin() {
		$dir = WP_PLUGIN_DIR . '/mcp-adapter';
		if ( ! is_dir( $dir ) ) {
			mkdir( $dir );
		}
		file_put_contents( $dir . '/mcp-adapter.php', "<?php\n/**\n * Plugin Name: MCP Adapter\n */\n" );
		wp_clean_plugins_cache( false );
	}

	public function test_reports_missing_plugin() {
		$data = _gutenberg_connectors_mcp_adapter_data( array() );

		$this->assertSame( 'not-installed', $data['mcpAdapter']['status'] );
	}

	public function test_reports_installed_plugin_as_inactive() {
		$this->install_stub_plugin();

		$data = _gutenberg_connectors_mcp_adapter_data( array() );

		$this->assertSame( 'inactive', $data['mcpAdapter']['status'] );
	}

	public function test_reports_active_plugin() {
		$this->install_stub_plugin();
		update_option( 'active_plugins', array( self::PLUGIN_FILE ) );

		$data = _gutenberg_connectors_mcp_adapter_data( array() );

		$this->assertSame( 'active', $data['mcpAdapter']['status'] );
	}

	public function test_reports_network_active_plugin() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Network activation only exists on multisite.' );
		}

		$this->install_stub_plugin();
		update_site_option( 'active_sitewide_plugins', array( self::PLUGIN_FILE => time() ) );

		$data = _gutenberg_connectors_mcp_adapter_data( array() );

		$this->assertSame( 'network-active', $data['mcpAdapter']['status'] );
	}

	public function test_endpoint_follows_the_site_address() {
		// Filtered rather than updated: the test site pins both with constants.
		add_filter(
			'option_home',
			static function () {
				return 'http://example.org';
			},
			20
		);
		add_filter(
			'option_siteurl',
			static function () {
				return 'http://example.org/wp';
			},
			20
		);

		$data = _gutenberg_connectors_mcp_adapter_data( array() );

		$this->assertSame( rest_url( 'mcp/mcp-adapter-default-server' ), $data['mcpAdapter']['endpoint'] );
		$this->assertStringStartsWith( 'http://example.org/', $data['mcpAdapter']['endpoint'] );
		$this->assertStringNotContainsString( 'example.org/wp/', $data['mcpAdapter']['endpoint'] );
	}

	public function test_reports_plugin_management_permissions() {
		$admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		if ( is_multisite() ) {
			grant_super_admin( $admin );
		}
		wp_set_current_user( $admin );

		$data = _gutenberg_connectors_mcp_adapter_data( array() );

		$this->assertTrue( $data['mcpAdapter']['canInstall'] );
		$this->assertTrue( $data['mcpAdapter']['canActivate'] );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$data = _gutenberg_connectors_mcp_adapter_data( array() );

		$this->assertFalse( $data['mcpAdapter']['canInstall'] );
		$this->assertFalse( $data['mcpAdapter']['canActivate'] );
	}

	public function test_keeps_existing_data() {
		$data = _gutenberg_connectors_mcp_adapter_data( array( 'isFileModDisabled' => true ) );

		$this->assertTrue( $data['isFileModDisabled'] );
	}

	public function test_preloads_the_mcp_adapter_plugin_record() {
		$paths = _gutenberg_connectors_preload_paths( array() );

		$this->assertContains( '/wp/v2/plugins/mcp-adapter/mcp-adapter?context=edit', $paths );
	}
}
