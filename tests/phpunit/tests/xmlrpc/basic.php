<?php

require_once ABSPATH . 'wp-admin/includes/admin.php';
require_once ABSPATH . WPINC . '/class-IXR.php';
require_once ABSPATH . WPINC . '/class-wp-xmlrpc-server.php';

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_Basic extends WP_XMLRPC_UnitTestCase {
	function test_enabled() {
		$result = $this->myxmlrpcserver->wp_getOptions( array( 1, 'username', 'password' ) );

		$this->assertIXRError( $result );
		// If disabled, 405 would result.
		$this->assertEquals( 403, $result->code );
	}

	function test_login_pass_ok() {
		$user_id = $this->make_user_by_role( 'subscriber' );

		$this->assertTrue( $this->myxmlrpcserver->login_pass_ok( 'subscriber', 'subscriber' ) );
		$this->assertInstanceOf( 'WP_User', $this->myxmlrpcserver->login( 'subscriber', 'subscriber' ) );
	}

	function test_login_pass_bad() {
		$user_id = $this->make_user_by_role( 'subscriber' );

		$this->assertFalse( $this->myxmlrpcserver->login_pass_ok( 'username', 'password' ) );
		$this->assertFalse( $this->myxmlrpcserver->login( 'username', 'password' ) );

		// The auth will still fail due to authentication blocking after the first failed attempt
		$this->assertFalse( $this->myxmlrpcserver->login_pass_ok( 'subscriber', 'subscriber' ) );
	}

	/**
	 * @ticket 34336
	 */
	function test_multicall_invalidates_all_calls_after_invalid_call() {
		$editor_id = $this->make_user_by_role( 'editor' );
		$post_id = self::factory()->post->create( array(
			'post_author' => $editor_id,
		) );

		$method_calls = array(
			// Valid login
			array(
				'methodName' => 'wp.editPost',
				'params'     => array(
					0,
					'editor',
					'editor',
					$post_id,
					array(
						'title' => 'Title 1',
					),
				),
			),
			// *Invalid* login
			array(
				'methodName' => 'wp.editPost',
				'params'     => array(
					0,
					'editor',
					'password',
					$post_id,
					array(
						'title' => 'Title 2',
					),
				),
			),
			// Valid login
			array(
				'methodName' => 'wp.editPost',
				'params'     => array(
					0,
					'editor',
					'editor',
					$post_id,
					array(
						'title' => 'Title 3',
					),
				),
			),
		);

		$this->myxmlrpcserver->callbacks = $this->myxmlrpcserver->methods;

		$result = $this->myxmlrpcserver->multiCall( $method_calls );

		$this->assertArrayNotHasKey( 'faultCode', $result[0] );
		$this->assertArrayHasKey( 'faultCode', $result[1] );
		$this->assertArrayHasKey( 'faultCode', $result[2] );

	}

	/**
	 * @ticket 36586
	 */
	function test_isStruct_on_non_numerically_indexed_array() {
		$value  = new IXR_Value( array( '0.0' => 100 ) );

		$return  = "<struct>\n";
		$return .= "  <member><name>0.0</name><value><int>100</int></value></member>\n";
		$return .= "</struct>";

		$this->assertXmlStringEqualsXmlString( $return, $value->getXML() );
	}
}
