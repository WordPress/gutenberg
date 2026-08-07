<?php
/**
 * Tests for the WebSocket transport's web-process half (registration,
 * token route, announced socket URL). The daemon itself is a long-running
 * process verified by a live smoke, not here.
 *
 * @package Gutenberg
 *
 * @group collaboration
 */
class Tests_Collaboration_WpWebSocketSyncTransport extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();
		global $wp_rest_server;
		$wp_rest_server = new Spy_REST_Server();
		do_action( 'rest_api_init', $wp_rest_server );
	}

	public function tear_down() {
		global $wp_rest_server;
		$wp_rest_server = null;
		parent::tear_down();
	}

	private function transport(): WP_WebSocket_Sync_Transport {
		$storage = new WP_Sync_Post_Meta_Storage();
		return new WP_WebSocket_Sync_Transport( $storage, new WP_Sync_Engine_Registry( $storage ) );
	}

	public function test_slug_and_protocol() {
		$transport = $this->transport();
		$this->assertSame( 'websocket', $transport->get_slug() );
		$this->assertSame( 1, $transport->get_protocol_version() );
	}

	public function test_registers_the_one_time_token_route() {
		$this->transport()->register_routes();
		$this->assertArrayHasKey(
			'/wp-sync/v1/ws-token',
			rest_get_server()->get_routes()
		);
	}

	public function test_default_socket_url_is_ws_and_filterable_to_wss() {
		$this->assertStringStartsWith(
			'ws://',
			WP_WebSocket_Sync_Transport::get_socket_url()
		);

		add_filter(
			'wp_sync_websocket_url',
			static fn() => 'wss://example.com/collab'
		);
		$this->assertSame(
			'wss://example.com/collab',
			WP_WebSocket_Sync_Transport::get_socket_url()
		);
	}

	public function test_selectable_as_the_active_transport_and_announced_first() {
		add_filter( 'wp_collaboration_transport', static fn() => 'websocket' );
		$registry = wp_get_collaboration_transport_registry();

		$this->assertSame( 'websocket', $registry->get_active_slug() );
		$this->assertSame( 'websocket', $registry->get_announced_slugs()[0] );
		$this->assertInstanceOf(
			'WP_WebSocket_Sync_Transport',
			$registry->get_transport( 'websocket' )
		);
	}

	public function test_the_daemon_binds_to_the_shared_engine_seam() {
		// The daemon is constructed over the polling server (the shared
		// engine seam), NOT a Yjs-specific core — the whole point of the
		// port. Constructing it must not fatal.
		$storage = new WP_Sync_Post_Meta_Storage();
		$sync    = new WP_HTTP_Polling_Sync_Server( $storage );
		$server  = new WP_WebSocket_Sync_Server( $sync, '127.0.0.1', 8799 );
		$this->assertInstanceOf( 'WP_WebSocket_Sync_Server', $server );
	}
}
