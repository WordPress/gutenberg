<?php

/**
 * @group xmlrpc
 * @group user
 */
class Tests_XMLRPC_wp_getUser extends WP_XMLRPC_UnitTestCase {
	protected $administrator_id;

	function setUp() {
		parent::setUp();

		// create a super-admin
		$this->administrator_id = $this->make_user_by_role( 'administrator' );
		if ( is_multisite() )
			grant_super_admin( $this->administrator_id );
	}

	function tearDown() {
		if ( is_multisite() )
			revoke_super_admin( $this->administrator_id );

		parent::tearDown();
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getUser( array( 1, 'username', 'password', 1 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_invalid_user() {
		$result = $this->myxmlrpcserver->wp_getUser( array( 1, 'administrator', 'administrator', 34902348908234 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 404, $result->code );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );
		$editor_id = $this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getUser( array( 1, 'subscriber', 'subscriber', $editor_id ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_subscriber_self() {
		$subscriber_id = $this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_getUser( array( 1, 'subscriber', 'subscriber', $subscriber_id ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $subscriber_id, $result['user_id'] );
	}

	function test_valid_user() {
		$registered_date = strtotime( '-1 day' );
		$user_data = array(
			'user_login' => 'getusertestuser',
			'user_pass' => rand_str(),
			'first_name' => rand_str(),
			'last_name' => rand_str(),
			'description' => rand_str( 100 ),
			'user_email' => 'getUserTestUser@example.com',
			'nickname' => rand_str(),
			'user_nicename' => rand_str(),
			'display_name' => rand_str(),
			'user_url' => 'http://www.example.com/testuser',
			'role' => 'author',
			'aim' => rand_str(),
			'user_registered' => strftime( "%Y-%m-%d %H:%M:%S", $registered_date )
		);
		$user_id = wp_insert_user( $user_data );

		$result = $this->myxmlrpcserver->wp_getUser( array( 1, 'administrator', 'administrator', $user_id ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );

		// check data types
		$this->assertInternalType( 'string', $result['user_id'] );
		$this->assertStringMatchesFormat( '%d', $result['user_id'] );
		$this->assertInternalType( 'string', $result['username'] );
		$this->assertInternalType( 'string', $result['first_name'] );
		$this->assertInternalType( 'string', $result['last_name'] );
		$this->assertInstanceOf( 'IXR_Date', $result['registered'] );
		$this->assertInternalType( 'string', $result['bio'] );
		$this->assertInternalType( 'string', $result['email'] );
		$this->assertInternalType( 'string', $result['nickname'] );
		$this->assertInternalType( 'string', $result['nicename'] );
		$this->assertInternalType( 'string', $result['url'] );
		$this->assertInternalType( 'string', $result['display_name'] );
		$this->assertInternalType( 'array', $result['roles'] );

		// check expected values
		$this->assertEquals( $user_id, $result['user_id'] );
		$this->assertEquals( $user_data['user_login'], $result['username'] );
		$this->assertEquals( $user_data['first_name'], $result['first_name'] );
		$this->assertEquals( $user_data['last_name'], $result['last_name'] );
		$this->assertEquals( $registered_date, $result['registered']->getTimestamp() );
		$this->assertEquals( $user_data['description'], $result['bio'] );
		$this->assertEquals( $user_data['user_email'], $result['email'] );
		$this->assertEquals( $user_data['nickname'], $result['nickname'] );
		$this->assertEquals( $user_data['user_nicename'], $result['nicename'] );
		$this->assertEquals( $user_data['user_url'], $result['url'] );
		$this->assertEquals( $user_data['display_name'], $result['display_name'] );
		$this->assertEquals( $user_data['user_login'], $result['username'] );
		$this->assertContains( $user_data['role'], $result['roles'] );

		wp_delete_user( $user_id );
	}

	function test_no_fields() {
		$editor_id = $this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getUser( array( 1, 'administrator', 'administrator', $editor_id, array() ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $editor_id, $result['user_id'] );

		$expected_fields = array( 'user_id' );
		$this->assertEquals( $expected_fields, array_keys( $result ) );
	}

	function test_basic_fields() {
		$editor_id = $this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getUser( array( 1, 'administrator', 'administrator', $editor_id, array( 'basic' ) ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $editor_id, $result['user_id'] );

		$expected_fields = array( 'user_id', 'username', 'email', 'registered', 'display_name', 'nicename' );
		$keys = array_keys( $result );
		sort( $expected_fields );
		sort( $keys );
		$this->assertEqualSets( $expected_fields, $keys );
	}

	function test_arbitrary_fields() {
		$editor_id = $this->make_user_by_role( 'editor' );

		$fields = array( 'email', 'bio', 'user_contacts' );

		$result = $this->myxmlrpcserver->wp_getUser( array( 1, 'administrator', 'administrator', $editor_id, $fields ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $editor_id, $result['user_id'] );

		$expected_fields = array( 'user_id', 'email', 'bio' );
		$keys = array_keys( $result );
		sort( $expected_fields );
		sort( $keys );
		$this->assertEqualSets( $expected_fields, $keys );
	}
}
