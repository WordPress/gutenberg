<?php
include_once(ABSPATH . 'wp-admin/includes/admin.php');
include_once(ABSPATH . WPINC . '/class-IXR.php');
include_once(ABSPATH . WPINC . '/class-wp-xmlrpc-server.php');

class WP_XMLRPC_UnitTestCase extends WP_UnitTestCase {
	protected $myxmlrpcserver;

	function setUp() {
		parent::setUp();

		add_filter( 'pre_option_enable_xmlrpc', '__return_true' );

		$this->myxmlrpcserver = new wp_xmlrpc_server();
	}

	function tearDown() {
		remove_filter( 'pre_option_enable_xmlrpc', '__return_true' );

		parent::tearDown();
	}

	protected function make_user_by_role( $role ) {
		return $this->factory->user->create( array(
			'user_login' => $role,
			'user_pass'  => $role,
			'role'       => $role
		));
	}
}
