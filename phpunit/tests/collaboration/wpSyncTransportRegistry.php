<?php
/**
 * Tests for the sync transport registry and the single config value that
 * selects the active transport.
 *
 * @package Gutenberg
 *
 * @group collaboration
 */
class Tests_Collaboration_WpSyncTransportRegistry extends WP_UnitTestCase {
	/**
	 * Builds a registry over throwaway storage.
	 *
	 * @return WP_Sync_Transport_Registry Registry.
	 */
	private function registry(): WP_Sync_Transport_Registry {
		$storage = new WP_Sync_Post_Meta_Storage();
		return new WP_Sync_Transport_Registry( $storage, new WP_Sync_Engine_Registry( $storage ) );
	}

	public function test_http_polling_is_registered_and_default_active() {
		$registry = $this->registry();

		$this->assertInstanceOf(
			'WP_HTTP_Polling_Sync_Server',
			$registry->get_transport( 'http-polling' )
		);
		$this->assertSame( 'http-polling', $registry->get_active_slug() );
		// Default active is announced FIRST; other built-ins follow.
		$this->assertSame( 'http-polling', $registry->get_announced_slugs()[0] );
	}

	public function test_config_value_selects_the_active_transport() {
		$fake = new class() implements WP_Sync_Transport {
			public function get_slug(): string {
				return 'fake-transport';
			}
			public function get_protocol_version(): int {
				return 3;
			}
			public function register_routes(): void {}
		};

		add_filter(
			'wp_sync_transports',
			static function ( $transports ) use ( $fake ) {
				$transports[] = $fake;
				return $transports;
			}
		);
		add_filter(
			'wp_collaboration_transport',
			static function () {
				return 'fake-transport';
			}
		);

		$registry = $this->registry();

		$this->assertSame( 'fake-transport', $registry->get_active_slug() );
		// Active is announced FIRST, then the rest.
		$announced = $registry->get_announced_slugs();
		$this->assertSame( 'fake-transport', $announced[0] );
		$this->assertContains( 'http-polling', $announced );
	}

	public function test_unknown_config_value_falls_back_to_http_polling() {
		add_filter(
			'wp_collaboration_transport',
			static function () {
				return 'does-not-exist';
			}
		);

		$this->assertSame( 'http-polling', $this->registry()->get_active_slug() );
	}

	public function test_announcement_lists_registered_transports() {
		add_filter( 'wp_sync_engine', '__return_null' );

		$fake = new class() implements WP_Sync_Transport {
			public function get_slug(): string {
				return 'x-transport';
			}
			public function get_protocol_version(): int {
				return 1;
			}
			public function register_routes(): void {}
		};
		add_filter(
			'wp_sync_transports',
			static function ( $transports ) use ( $fake ) {
				$transports[] = $fake;
				return $transports;
			}
		);

		$slugs = $this->registry()->get_announced_slugs();
		$this->assertContains( 'http-polling', $slugs );
		$this->assertContains( 'x-transport', $slugs );
	}
}
