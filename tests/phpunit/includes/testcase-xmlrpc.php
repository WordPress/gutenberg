<?php
include_once(ABSPATH . 'wp-admin/includes/admin.php');
include_once(ABSPATH . WPINC . '/class-IXR.php');
include_once(ABSPATH . WPINC . '/class-wp-xmlrpc-server.php');

class WP_XMLRPC_UnitTestCase extends WP_UnitTestCase {
	protected $myxmlrpcserver;

	function setUp() {
		parent::setUp();

		add_filter( 'pre_option_enable_xmlrpc', '__return_true' );

		$this->myxmlrpcserver = new WP_XMLRPC_Server_UnitTestable();
	}

	function tearDown() {
		remove_filter( 'pre_option_enable_xmlrpc', '__return_true' );

		 $this->myxmlrpcserver->reset_failed_auth();

		$this->remove_added_uploads();

		parent::tearDown();
	}

	protected function make_user_by_role( $role ) {
		return self::factory()->user->create( array(
			'user_login' => $role,
			'user_pass'  => $role,
			'role'       => $role
		));
	}
}

class WP_XMLRPC_Server_UnitTestable extends wp_xmlrpc_server {
	public function reset_failed_auth() {
		$this->auth_failed = false;
	}
}