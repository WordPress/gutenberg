<?php

class Gutenberg_REST_Server_Test extends WP_Test_REST_TestCase {

	protected static $admin_id;
	protected static $post_id;

	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);

		self::$post_id = $factory->post->create();
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		wp_delete_post( self::$post_id );
	}

	public function set_up() {
		parent::set_up();
		add_filter(
			'wp_rest_server_class',
			function () {
				return 'Gutenberg_REST_Server';
			}
		);
	}

	public function test_populates_target_hints_for_administrator() {
		wp_set_current_user( self::$admin_id );
		$response = rest_do_request( '/wp/v2/posts' );
		$post     = $response->get_data()[0];

		$link = $post['_links']['self'][0];
		$this->assertArrayHasKey( 'targetHints', $link );
		$this->assertArrayHasKey( 'allow', $link['targetHints'] );
		$this->assertSame( array( 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' ), $link['targetHints']['allow'] );
	}

	public function test_populates_target_hints_for_logged_out_user() {
		$response = rest_do_request( '/wp/v2/posts' );
		$post     = $response->get_data()[0];

		$link = $post['_links']['self'][0];
		$this->assertArrayHasKey( 'targetHints', $link );
		$this->assertArrayHasKey( 'allow', $link['targetHints'] );
		$this->assertSame( array( 'GET' ), $link['targetHints']['allow'] );
	}

	public function test_does_not_error_on_invalid_urls() {
		$response = new WP_REST_Response();
		$response->add_link( 'self', 'this is not a real URL' );

		$links = rest_get_server()::get_response_links( $response );
		$this->assertArrayNotHasKey( 'targetHints', $links['self'][0] );
	}

	public function test_does_not_error_on_bad_rest_api_routes() {
		$response = new WP_REST_Response();
		$response->add_link( 'self', rest_url( '/this/is/not/a/real/route' ) );

		$links = rest_get_server()::get_response_links( $response );
		$this->assertArrayNotHasKey( 'targetHints', $links['self'][0] );
	}

	public function test_prefers_developer_defined_target_hints() {
		$response = new WP_REST_Response();
		$response->add_link(
			'self',
			'/wp/v2/posts/' . self::$post_id,
			array(
				'targetHints' => array(
					'allow' => array( 'GET', 'PUT' ),
				),
			)
		);

		$links = rest_get_server()::get_response_links( $response );
		$link  = $links['self'][0];
		$this->assertArrayHasKey( 'targetHints', $link );
		$this->assertArrayHasKey( 'allow', $link['targetHints'] );
		$this->assertSame( array( 'GET', 'PUT' ), $link['targetHints']['allow'] );
	}
}
