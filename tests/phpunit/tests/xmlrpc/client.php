<?php
require_once ABSPATH . WPINC . '/class-IXR.php';
require_once ABSPATH . WPINC . '/class-wp-http-ixr-client.php';

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_Client extends WP_XMLRPC_UnitTestCase {

	/**
	 * @ticket 26947
	 */
	function test_ixr_client_allows_query_strings() {
		$client = new IXR_Client( 'http://example.com/server.php?this-is-needed=true#not-this' );
		$this->assertEquals( 'example.com', $client->server );
		$this->assertEquals( 80, $client->port );
		$this->assertEquals( '/server.php?this-is-needed=true', $client->path );
	}

	/**
	 * @ticket 26947
	 */
	function test_wp_ixr_client_allows_query_strings() {
		$client = new WP_HTTP_IXR_Client( 'http://example.com/server.php?this-is-needed=true#not-this' );
		$this->assertEquals( 'example.com', $client->server );
		$this->assertFalse( $client->port );
		$this->assertEquals( '/server.php?this-is-needed=true', $client->path );
	}
}

