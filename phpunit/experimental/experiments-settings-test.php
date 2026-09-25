<?php
/**
 * Tests for the experiments setting exposed through the REST API.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_initialize_experiments_settings
 */
class Gutenberg_Experiments_Settings_Test extends WP_UnitTestCase {

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected static $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$admin_id );
		remove_all_filters( 'pre_option_gutenberg-experiments' );

		global $wp_rest_server;
		$wp_rest_server = new Spy_REST_Server();
		do_action( 'rest_api_init', $wp_rest_server );
	}

	public function tear_down() {
		delete_option( 'gutenberg-experiments' );

		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tear_down();
	}

	private function get_experiments_setting() {
		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/wp/v2/settings' ) );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'gutenberg-experiments', $data );
		return $data['gutenberg-experiments'];
	}

	public function test_returns_registered_experiments() {
		$experiments = array( 'gutenberg-block-experiments' => true );
		update_option( 'gutenberg-experiments', $experiments );

		$this->assertSame( $experiments, $this->get_experiments_setting() );
	}

	public function test_unregistered_experiments_do_not_invalidate_the_setting() {
		update_option(
			'gutenberg-experiments',
			array(
				'gutenberg-block-experiments' => true,
				'some-removed-experiment'     => true,
			)
		);

		$value = $this->get_experiments_setting();
		$this->assertIsArray( $value );
		$this->assertTrue( $value['gutenberg-block-experiments'] );
	}

	public function test_unregistered_experiments_are_preserved() {
		$experiments = array(
			'some-removed-experiment'    => true,
			'another-removed-experiment' => false,
		);
		update_option( 'gutenberg-experiments', $experiments );

		$this->assertSame( $experiments, $this->get_experiments_setting() );
	}

	public function test_saving_an_experiment_keeps_unregistered_ones() {
		update_option( 'gutenberg-experiments', array( 'some-removed-experiment' => true ) );

		$experiments = $this->get_experiments_setting();

		$experiments['gutenberg-block-experiments'] = true;

		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_body_params( array( 'gutenberg-experiments' => $experiments ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'some-removed-experiment'     => true,
				'gutenberg-block-experiments' => true,
			),
			get_option( 'gutenberg-experiments' )
		);
	}

	public function test_rest_sanitizes_legacy_checkbox_values_to_booleans() {
		$legacy = array(
			'gutenberg-block-experiments' => '1',
			'some-removed-experiment'     => '1',
			'another-removed-experiment'  => '0',
		);
		update_option( 'gutenberg-experiments', $legacy );
		$expected = array(
			'gutenberg-block-experiments' => true,
			'some-removed-experiment'     => true,
			'another-removed-experiment'  => false,
		);

		$this->assertSame( $expected, $this->get_experiments_setting() );

		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_body_params( array( 'gutenberg-experiments' => $legacy ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $expected, get_option( 'gutenberg-experiments' ) );
	}

	public function test_rest_rejects_a_value_that_is_not_a_map() {
		$experiments = array( 'gutenberg-block-experiments' => true );
		update_option( 'gutenberg-experiments', $experiments );

		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_body_params( array( 'gutenberg-experiments' => 'not-an-array' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
		$this->assertSame( $experiments, get_option( 'gutenberg-experiments' ) );
	}
}
