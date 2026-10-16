<?php
/**
 * Tests for the Connectors compatibility shims.
 *
 * @package gutenberg
 *
 * @covers ::_gutenberg_register_mcp_adapter_connector
 * @covers ::_gutenberg_add_connectors_application_passwords_data
 */
class Tests_Connectors_Compat extends WP_UnitTestCase {

	public function test_registers_mcp_adapter_connector() {
		$registry = new WP_Connector_Registry();

		_gutenberg_register_mcp_adapter_connector( $registry );

		$connector = $registry->get_registered( 'mcp-adapter' );
		$this->assertSame( 'mcp_server', $connector['type'] );
		$this->assertSame( array( 'method' => 'none' ), $connector['authentication'] );
		$this->assertSame( 'mcp-adapter/mcp-adapter.php', $connector['plugin']['file'] );
		$this->assertFalse( call_user_func( $connector['plugin']['is_active'] ) );
	}

	public function test_keeps_connector_registered_by_core() {
		$registry = new WP_Connector_Registry();
		$registry->register(
			'mcp-adapter',
			array(
				'name'           => 'Core MCP',
				'type'           => 'mcp_server',
				'authentication' => array( 'method' => 'none' ),
			)
		);

		_gutenberg_register_mcp_adapter_connector( $registry );

		$this->assertSame( 'Core MCP', $registry->get_registered( 'mcp-adapter' )['name'] );
	}

	public function test_skips_mcp_adapter_connector_when_ai_is_not_supported() {
		add_filter( 'wp_supports_ai', '__return_false' );
		$registry = new WP_Connector_Registry();

		_gutenberg_register_mcp_adapter_connector( $registry );

		$this->assertFalse( $registry->is_registered( 'mcp-adapter' ) );
	}

	public function test_adds_application_passwords_data() {
		$user = self::factory()->user->create_and_get( array( 'role' => 'administrator' ) );
		wp_set_current_user( $user->ID );
		add_filter( 'wp_is_application_passwords_available', '__return_true' );

		$data = _gutenberg_add_connectors_application_passwords_data( array() );

		$this->assertSame(
			array(
				'isSupported'        => wp_is_application_passwords_supported(),
				'isAvailable'        => true,
				'isAvailableForUser' => true,
				'canCreate'          => true,
				'username'           => $user->user_login,
				'profileUrl'         => admin_url( 'profile.php#application-passwords-section' ),
			),
			$data['applicationPasswords']
		);
	}

	public function test_keeps_application_passwords_data_from_core() {
		$data = array( 'applicationPasswords' => array( 'username' => 'from-core' ) );

		$this->assertSame( $data, _gutenberg_add_connectors_application_passwords_data( $data ) );
	}
}
