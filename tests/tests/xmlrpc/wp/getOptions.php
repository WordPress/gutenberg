<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getOptions extends WP_XMLRPC_UnitTestCase {

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getOptions( array( 1, 'username', 'password' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_valid_username_password() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_getOptions( array( 1, 'subscriber', 'subscriber' ) );
		$this->assertInternalType( 'array', $result );
		$this->assertEquals( 'WordPress', $result['software_name']['value'] );
	}

	function test_option_value() {
		$this->make_user_by_role( 'administrator' );

		$result = $this->myxmlrpcserver->wp_getOptions( array( 1, 'administrator', 'administrator', 'default_comment_status' ) );
		$this->assertInternalType( 'array', $result );

		$this->assertEquals( get_option( 'default_comment_status' ), $result['default_comment_status']['value'] );
		$this->assertFalse( $result['default_comment_status']['readonly'] );
	}

	/**
	 * @ticket 20201
	 */
	function test_option_values_subscriber() {
		global $wp_version;
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_getOptions( array( 1, 'subscriber', 'subscriber' ) );
		$this->assertInternalType( 'array', $result );

		// Read Only options
		$this->assertEquals( 'WordPress', $result['software_name']['value'] );
		$this->assertTrue( $result['software_name']['readonly'] );

		$this->assertEquals( $wp_version, $result['software_version']['value'] );
		$this->assertTrue( $result['software_version']['readonly'] );

		$this->assertEquals( get_site_url(), $result['blog_url']['value'] );
		$this->assertTrue( $result['blog_url']['readonly'] );

		$this->assertEquals( wp_login_url(), $result['login_url']['value'] );
		$this->assertTrue( $result['login_url']['readonly'] );

		$this->assertEquals( get_admin_url(), $result['admin_url']['value'] );
		$this->assertTrue( $result['admin_url']['readonly'] );

		$this->assertEquals( get_option( 'image_default_link_type' ), $result['image_default_link_type']['value'] );
		$this->assertTrue( $result['image_default_link_type']['readonly'] );

		$this->assertEquals( get_option( 'image_default_size' ), $result['image_default_size']['value'] );
		$this->assertTrue( $result['image_default_size']['readonly'] );

		$this->assertEquals( get_option( 'image_default_align' ), $result['image_default_align']['value'] );
		$this->assertTrue( $result['image_default_align']['readonly'] );

		$this->assertEquals( get_template(), $result['template']['value'] );
		$this->assertTrue( $result['template']['readonly'] );

		$this->assertEquals( get_stylesheet(), $result['stylesheet']['value'] );
		$this->assertTrue( $result['stylesheet']['readonly'] );

		$this->assertEquals( current_theme_supports( 'post-thumbnails' ), $result['post_thumbnail']['value'] );
		$this->assertTrue( $result['post_thumbnail']['readonly'] );

		// Updatable options
		$this->assertEquals( get_option( 'gmt_offset' ), $result['time_zone']['value'] );
		$this->assertTrue( $result['time_zone']['readonly'] );

		$this->assertEquals( get_option( 'blogname' ), $result['blog_title']['value'] );
		$this->assertTrue( $result['blog_title']['readonly'] );

		$this->assertEquals( get_option( 'blogdescription' ), $result['blog_tagline']['value'] );
		$this->assertTrue( $result['blog_tagline']['readonly'] );

		$this->assertEquals( get_option( 'date_format' ), $result['date_format']['value'] );
		$this->assertTrue( $result['date_format']['readonly'] );

		$this->assertEquals( get_option( 'time_format' ), $result['time_format']['value'] );
		$this->assertTrue( $result['time_format']['readonly'] );

		$this->assertEquals( get_option( 'users_can_register' ), $result['users_can_register']['value'] );
		$this->assertTrue( $result['users_can_register']['readonly'] );

		$this->assertEquals( get_option( 'thumbnail_size_w' ), $result['thumbnail_size_w']['value'] );
		$this->assertTrue( $result['thumbnail_size_w']['readonly'] );

		$this->assertEquals( get_option( 'thumbnail_size_h' ), $result['thumbnail_size_h']['value'] );
		$this->assertTrue( $result['thumbnail_size_h']['readonly'] );

		$this->assertEquals( get_option( 'thumbnail_crop' ), $result['thumbnail_crop']['value'] );
		$this->assertTrue( $result['thumbnail_crop']['readonly'] );

		$this->assertEquals( get_option( 'medium_size_w' ), $result['medium_size_w']['value'] );
		$this->assertTrue( $result['medium_size_w']['readonly'] );

		$this->assertEquals( get_option( 'medium_size_h' ), $result['medium_size_h']['value'] );
		$this->assertTrue( $result['medium_size_h']['readonly'] );

		$this->assertEquals( get_option( 'large_size_w' ), $result['large_size_w']['value'] );
		$this->assertTrue( $result['large_size_w']['readonly'] );

		$this->assertEquals( get_option( 'large_size_h' ), $result['large_size_h']['value'] );
		$this->assertTrue( $result['large_size_h']['readonly'] );

		$this->assertEquals( get_option( 'default_comment_status' ), $result['default_comment_status']['value'] );
		$this->assertTrue( $result['default_comment_status']['readonly'] );

		$this->assertEquals( get_option( 'default_ping_status' ), $result['default_ping_status']['value'] );
		$this->assertTrue( $result['default_ping_status']['readonly'] );
	}

	function test_option_values_admin() {
		global $wp_version;

		$this->make_user_by_role( 'administrator' );

		$result = $this->myxmlrpcserver->wp_getOptions( array( 1, 'administrator', 'administrator' ) );
		$this->assertInternalType( 'array', $result );

		// Read Only options
		$this->assertEquals( 'WordPress', $result['software_name']['value'] );
		$this->assertTrue( $result['software_name']['readonly'] );

		$this->assertEquals( $wp_version, $result['software_version']['value'] );
		$this->assertTrue( $result['software_version']['readonly'] );

		$this->assertEquals( get_site_url(), $result['blog_url']['value'] );
		$this->assertTrue( $result['blog_url']['readonly'] );

		$this->assertEquals( wp_login_url(), $result['login_url']['value'] );
		$this->assertTrue( $result['login_url']['readonly'] );

		$this->assertEquals( get_admin_url(), $result['admin_url']['value'] );
		$this->assertTrue( $result['admin_url']['readonly'] );

		$this->assertEquals( get_option( 'image_default_link_type' ), $result['image_default_link_type']['value'] );
		$this->assertTrue( $result['image_default_link_type']['readonly'] );

		$this->assertEquals( get_option( 'image_default_size' ), $result['image_default_size']['value'] );
		$this->assertTrue( $result['image_default_size']['readonly'] );

		$this->assertEquals( get_option( 'image_default_align' ), $result['image_default_align']['value'] );
		$this->assertTrue( $result['image_default_align']['readonly'] );

		$this->assertEquals( get_template(), $result['template']['value'] );
		$this->assertTrue( $result['template']['readonly'] );

		$this->assertEquals( get_stylesheet(), $result['stylesheet']['value'] );
		$this->assertTrue( $result['stylesheet']['readonly'] );

		$this->assertEquals( current_theme_supports( 'post-thumbnails' ), $result['post_thumbnail']['value'] );
		$this->assertTrue( $result['post_thumbnail']['readonly'] );

		// Updatable options
		$this->assertEquals( get_option( 'gmt_offset' ), $result['time_zone']['value'] );
		$this->assertFalse( $result['time_zone']['readonly'] );

		$this->assertEquals( get_option( 'blogname' ), $result['blog_title']['value'] );
		$this->assertFalse( $result['blog_title']['readonly'] );

		$this->assertEquals( get_option( 'blogdescription' ), $result['blog_tagline']['value'] );
		$this->assertFalse( $result['blog_tagline']['readonly'] );

		$this->assertEquals( get_option( 'date_format' ), $result['date_format']['value'] );
		$this->assertFalse( $result['date_format']['readonly'] );

		$this->assertEquals( get_option( 'time_format' ), $result['time_format']['value'] );
		$this->assertFalse( $result['time_format']['readonly'] );

		$this->assertEquals( get_option( 'users_can_register' ), $result['users_can_register']['value'] );
		$this->assertFalse( $result['users_can_register']['readonly'] );

		$this->assertEquals( get_option( 'thumbnail_size_w' ), $result['thumbnail_size_w']['value'] );
		$this->assertFalse( $result['thumbnail_size_w']['readonly'] );

		$this->assertEquals( get_option( 'thumbnail_size_h' ), $result['thumbnail_size_h']['value'] );
		$this->assertFalse( $result['thumbnail_size_h']['readonly'] );

		$this->assertEquals( get_option( 'thumbnail_crop' ), $result['thumbnail_crop']['value'] );
		$this->assertFalse( $result['thumbnail_crop']['readonly'] );

		$this->assertEquals( get_option( 'medium_size_w' ), $result['medium_size_w']['value'] );
		$this->assertFalse( $result['medium_size_w']['readonly'] );

		$this->assertEquals( get_option( 'medium_size_h' ), $result['medium_size_h']['value'] );
		$this->assertFalse( $result['medium_size_h']['readonly'] );

		$this->assertEquals( get_option( 'large_size_w' ), $result['large_size_w']['value'] );
		$this->assertFalse( $result['large_size_w']['readonly'] );

		$this->assertEquals( get_option( 'large_size_h' ), $result['large_size_h']['value'] );
		$this->assertFalse( $result['large_size_h']['readonly'] );

		$this->assertEquals( get_option( 'default_comment_status' ), $result['default_comment_status']['value'] );
		$this->assertFalse( $result['default_comment_status']['readonly'] );

		$this->assertEquals( get_option( 'default_ping_status' ), $result['default_ping_status']['value'] );
		$this->assertFalse( $result['default_ping_status']['readonly'] );
	}
}