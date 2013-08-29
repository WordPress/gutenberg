<?php

/**
 * @group xmlrpc
 * @group user
 */
class Tests_XMLRPC_wp_editProfile extends WP_XMLRPC_UnitTestCase {

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_editProfile( array( 1, 'username', 'password', array() ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

    function test_subscriber_profile() {
        $subscriber_id = $this->make_user_by_role( 'subscriber' );

        $new_data = array(
            'first_name' => rand_str(),
            'last_name' => rand_str(),
            'url' => 'http://www.example.org/subscriber',
            'display_name' => rand_str(),
            'nickname' => rand_str(),
            'nicename' => rand_str(),
            'bio' => rand_str(200)
        );
        $result = $this->myxmlrpcserver->wp_editProfile( array( 1, 'subscriber', 'subscriber', $new_data ) );
        $this->assertNotInstanceOf( 'IXR_Error', $result );
        $this->assertTrue( $result );

        // verify that the new values were stored
        $user_data = get_userdata( $subscriber_id );
        $this->assertEquals( $new_data['first_name'], $user_data->first_name );
        $this->assertEquals( $new_data['last_name'], $user_data->last_name );
        $this->assertEquals( $new_data['url'], $user_data->user_url );
        $this->assertEquals( $new_data['display_name'], $user_data->display_name );
        $this->assertEquals( $new_data['nickname'], $user_data->nickname );
        $this->assertEquals( $new_data['nicename'], $user_data->user_nicename );
        $this->assertEquals( $new_data['bio'], $user_data->description );
    }

    function test_ignore_password_change() {
        $this->make_user_by_role( 'author' );
        $new_pass = rand_str();
        $new_data = array( 'password' => $new_pass );

        $result = $this->myxmlrpcserver->wp_editProfile( array( 1, 'author', 'author', $new_data ) );
        $this->assertNotInstanceOf( 'IXR_Error', $result );
        $this->assertTrue( $result );

        $auth_old = wp_authenticate( 'author', 'author' );
        $auth_new = wp_authenticate( 'author', $new_pass );
        $this->assertInstanceOf( 'WP_User', $auth_old );
        $this->assertTrue( is_wp_error( $auth_new ) );
    }

    function test_ignore_email_change() {
        $editor_id = $this->make_user_by_role( 'editor' );
        $new_email = rand_str() . '@example.com';
        $new_data = array( 'email' => $new_email );

        $result = $this->myxmlrpcserver->wp_editProfile( array( 1, 'editor', 'editor', $new_data ) );
        $this->assertNotInstanceOf( 'IXR_Error', $result );
        $this->assertTrue( $result );

        $user_data = get_userdata( $editor_id );
        $this->assertNotEquals( $new_email, $user_data->email );
    }
}
