<?php
/**
 * Tests for the experiments setting exposed through the REST API.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_initialize_experiments_settings
 */
class Gutenberg_Experiments_Settings_Test extends WP_Test_REST_TestCase {

	protected static int $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public function set_up(): void {
		parent::set_up();

		wp_set_current_user( self::$admin_id );
		remove_all_filters( 'pre_option_gutenberg-experiments' );
		global $wp_rest_server;
		$wp_rest_server = null;
		rest_get_server();
	}

	public function tear_down(): void {
		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tear_down();
	}
	/**
	 * @return array< string,  array{ 'input': mixed, 'output': array|null, 'should_fail_on_save': bool }>;
	 */
	public function experiment_values_provider(): array {
		return array(
			'unregistered experiment, non bool, fails schema validation and returns null.' =>
			array(
				'input'               => array( 'test-experiment' => '' ),
				'output'              => null,
				'should_fail_on_save' => true,
			),
			'all experiments are returned, including bool unregistered ones.' =>
			array(
				'input'               => array(
					'gutenberg-block-experiments' => false,
					'test-experiment'             => true,
				),
				'output'              => array(
					'gutenberg-block-experiments' => false,
					'test-experiment'             => true,
				),
				'should_fail_on_save' => false,
			),
			'empty string is object like.'                => array(
				'input'               => '',
				'output'              => array(),
				'should_fail_on_save' => false,
			),
			'non-empty string fails schema validation.'   => array(
				'input'               => 'test',
				'output'              => null,
				'should_fail_on_save' => true,
			),
			'object is object like.'                      => array(
				'input'               => new stdClass(),
				'output'              => array(),
				'should_fail_on_save' => false,
			),
			'legacy checkbox values are coerced to bool.' => array(
				'input'               => array(
					'gutenberg-block-experiments' => '1',
					'some-removed-experiment'     => '1',
					'another-removed-experiment'  => '0',
				),
				'output'              => array(
					'gutenberg-block-experiments' => true,
					'some-removed-experiment'     => true,
					'another-removed-experiment'  => false,
				),
				'should_fail_on_save' => false,
			),
		);
	}

	/**
	 * @dataProvider experiment_values_provider
	 */
	public function test_reads_experiment_values( $initial_experiments, $read_experiments ) {
		update_option( 'gutenberg-experiments', $initial_experiments );
		$this->assertSame( $read_experiments, $this->get_experiments_setting() );
	}

	/**
	 * @dataProvider experiment_values_provider
	 */
	public function test_saves_experiment_values( $saved_experiments, $expected, $should_fail_on_save ) {
		$initial_state = array(
			'existing-experiment'         => true,
			'invalid-existing-experiment' => array(),
		);
		update_option(
			'gutenberg-experiments',
			$initial_state,
		);
		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_body_params( array( 'gutenberg-experiments' => $saved_experiments ) );
		$response = rest_get_server()->dispatch( $request );

		if ( $should_fail_on_save ) {
			$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
			$this->assertSame( $initial_state, get_option( 'gutenberg-experiments' ) );
		} else {
			$this->assertSame( 200, $response->get_status() );
			$data = $response->get_data();
			$this->assertArrayHasKey( 'gutenberg-experiments', $data );
			$this->assertSame(
				$data['gutenberg-experiments'],
				get_option( 'gutenberg-experiments' )
			);
			$this->assertSame(
				$expected,
				get_option( 'gutenberg-experiments' )
			);
		}
	}

	public function test_null_handling() {
		update_option(
			'gutenberg-experiments',
			null,
		);
		$this->assertSame( array(), $this->get_experiments_setting(), 'null should be coerced to array on read.' );

		update_option(
			'gutenberg-experiments',
			array( 'unregistered-experiment' => true ),
		);
		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_body_params( array( 'gutenberg-experiments' => null ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'gutenberg-experiments', $data );
		$this->assertFalse( get_option( 'gutenberg-experiments', false ), 'should delete option when gutenberg-experiments matches schema.' );

		update_option(
			'gutenberg-experiments',
			array( 'unregistered-experiment' => array() ), // fails schema validation
		);
		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_body_params( array( 'gutenberg-experiments' => null ) );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_invalid_stored_value', $response, 500 );
		$this->assertSame( array( 'unregistered-experiment' => array() ), get_option( 'gutenberg-experiments' ), 'should reject null when gutenberg-experiments fails schema validation.' );
	}

	private function get_experiments_setting() {
		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/wp/v2/settings' ) );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'gutenberg-experiments', $data );

		return $data['gutenberg-experiments'];
	}
}
