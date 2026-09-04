<?php
/**
 * Tests for the `page_for_privacy_policy` REST settings field.
 *
 * @package gutenberg
 */

/**
 * @covers ::gutenberg_register_privacy_policy_page_setting
 */
class Gutenberg_Privacy_Policy_Page_Setting_Test extends WP_Test_REST_TestCase {
	protected static $admin_id;
	protected static $subscriber_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$subscriber_id );
	}

	public function tear_down() {
		delete_option( 'wp_page_for_privacy_policy' );
		parent::tear_down();
	}

	public function test_setting_is_registered_for_rest() {
		$registered = get_registered_settings();

		$this->assertArrayHasKey( 'wp_page_for_privacy_policy', $registered );
		$this->assertSame(
			'page_for_privacy_policy',
			$registered['wp_page_for_privacy_policy']['show_in_rest']['name']
		);
	}

	public function test_get_settings_includes_privacy_policy_page() {
		wp_set_current_user( self::$admin_id );
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'wp_page_for_privacy_policy', $page_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/settings' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'page_for_privacy_policy', $data );
		$this->assertSame( $page_id, $data['page_for_privacy_policy'] );
	}

	public function test_update_settings_changes_privacy_policy_page() {
		wp_set_current_user( self::$admin_id );
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );

		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_param( 'page_for_privacy_policy', $page_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $page_id, (int) get_option( 'wp_page_for_privacy_policy' ) );
	}

	public function test_settings_require_manage_options() {
		wp_set_current_user( self::$subscriber_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/settings' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}
}
