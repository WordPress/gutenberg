<?php
/**
 * Tests for the `gutenberg-experiments` setting as exposed through the REST API.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_initialize_experiments_settings
 */
class Gutenberg_Experiments_Settings_Test extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function set_up() {
		parent::set_up();

		wp_set_current_user( self::$admin_id );

		// The bootstrap seeds this option through `$wp_tests_options`, which
		// short-circuits `get_option()` and cannot be overwritten per test.
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

	/**
	 * Reads the `gutenberg-experiments` value out of `GET /wp/v2/settings`.
	 *
	 * @return mixed
	 */
	private function get_experiments_setting() {
		$response = rest_get_server()->dispatch( new WP_REST_Request( 'GET', '/wp/v2/settings' ) );

		$this->assertSame( 200, $response->get_status() );

		$data = $response->get_data();

		$this->assertArrayHasKey( 'gutenberg-experiments', $data );

		return $data['gutenberg-experiments'];
	}

	public function test_returns_registered_experiments() {
		update_option(
			'gutenberg-experiments',
			array( 'gutenberg-block-experiments' => true )
		);

		$this->assertSame(
			array( 'gutenberg-block-experiments' => true ),
			$this->get_experiments_setting()
		);
	}

	/**
	 * Stale keys are routine: switching between branches that register
	 * different experiments leaves behind experiments that no longer exist.
	 * They must not invalidate the whole option, which would make every
	 * toggle on the Experiments screen read as "off".
	 */
	public function test_unregistered_experiments_do_not_invalidate_the_setting() {
		update_option(
			'gutenberg-experiments',
			array(
				'gutenberg-block-experiments' => true,
				'some-removed-experiment'     => true,
			)
		);

		$value = $this->get_experiments_setting();

		$this->assertIsArray( $value, 'The setting should not be null when an unknown experiment is stored.' );
		$this->assertTrue( $value['gutenberg-block-experiments'] );
	}

	/**
	 * A stale key belongs to a branch the user may switch back to, so reading
	 * the setting must not drop it.
	 */
	public function test_unregistered_experiments_are_preserved() {
		update_option(
			'gutenberg-experiments',
			array(
				'gutenberg-block-experiments' => true,
				'some-removed-experiment'     => true,
			)
		);

		$value = $this->get_experiments_setting();

		$this->assertArrayHasKey( 'some-removed-experiment', $value );
		$this->assertTrue( $value['some-removed-experiment'] );
	}

	/**
	 * Saving one experiment must not drop the ones already stored, including
	 * those that are no longer registered.
	 */
	public function test_saving_an_experiment_keeps_unregistered_ones() {
		update_option(
			'gutenberg-experiments',
			array( 'some-removed-experiment' => true )
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/settings' );
		$request->set_body_params(
			array(
				'gutenberg-experiments' => array(
					'some-removed-experiment'     => true,
					'gutenberg-block-experiments' => true,
				),
			)
		);

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

	/**
	 * @covers ::gutenberg_sanitize_experiments_option
	 */
	public function test_sanitize_casts_legacy_checkbox_values_to_booleans() {
		// The pre-React screen submitted a checkbox form, which stores '1'.
		update_option(
			'gutenberg-experiments',
			array( 'gutenberg-block-experiments' => '1' )
		);

		$this->assertSame(
			array( 'gutenberg-block-experiments' => true ),
			get_option( 'gutenberg-experiments' )
		);
	}

	/**
	 * @covers ::gutenberg_sanitize_experiments_option
	 */
	public function test_sanitize_rejects_a_value_that_is_not_a_map() {
		update_option( 'gutenberg-experiments', 'not-an-array' );

		$this->assertSame( array(), get_option( 'gutenberg-experiments' ) );
	}
}
