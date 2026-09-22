<?php
/**
 * Tests for the `page_for_privacy_policy` REST settings field.
 *
 * @package gutenberg
 */

/**
 * @covers ::gutenberg_register_privacy_policy_page_setting
 * @covers ::gutenberg_restrict_privacy_policy_page_setting_update
 */
class Gutenberg_Privacy_Policy_Page_Setting_Test extends WP_Test_REST_TestCase {
	protected static $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
		if ( is_multisite() ) {
			grant_super_admin( self::$admin_id );
		}
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function tear_down() {
		delete_option( 'wp_page_for_privacy_policy' );
		remove_filter( 'map_meta_cap', array( $this, 'deny_manage_privacy_options' ), 10 );
		parent::tear_down();
	}

	/**
	 * Maps `manage_privacy_options` to `do_not_allow`, as happens for a site
	 * administrator on multisite.
	 *
	 * @param string[] $caps Primitive capabilities required.
	 * @param string   $cap  Capability being checked.
	 * @return string[] Primitive capabilities required.
	 */
	public function deny_manage_privacy_options( $caps, $cap ) {
		if ( 'manage_privacy_options' === $cap ) {
			return array( 'do_not_allow' );
		}
		return $caps;
	}

	public function test_setting_is_registered_for_rest() {
		// Settings are registered on `rest_api_init`, which booting the server fires.
		rest_get_server();
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

	public function test_update_settings_ignores_privacy_policy_page_without_capability() {
		wp_set_current_user( self::$admin_id );
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'wp_page_for_privacy_policy', $page_id );
		$other_page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		add_filter( 'map_meta_cap', array( $this, 'deny_manage_privacy_options' ), 10, 2 );

		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_param( 'page_for_privacy_policy', $other_page_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $page_id, $data['page_for_privacy_policy'], 'The response should still report the previous page.' );
		$this->assertSame( $page_id, (int) get_option( 'wp_page_for_privacy_policy' ), 'The option should not change.' );
	}
}
