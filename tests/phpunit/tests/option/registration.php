<?php

/**
 * @group option
 */
class Tests_Option_Registration extends WP_UnitTestCase {
	public function test_register() {
		register_setting( 'test_group', 'test_option' );

		$registered = get_registered_settings();
		$this->assertArrayHasKey( 'test_option', $registered );

		$args = $registered['test_option'];
		$this->assertEquals( 'test_group', $args['group'] );

		// Check defaults.
		$this->assertEquals( 'string', $args['type'] );
		$this->assertEquals( false, $args['show_in_rest'] );
		$this->assertEquals( '', $args['description'] );
	}

	public function test_register_with_callback() {
		register_setting( 'test_group', 'test_option', array( $this, 'filter_registered_setting' ) );

		$filtered = apply_filters( 'sanitize_option_test_option', 'smart', 'test_option', 'smart' );
		$this->assertEquals( 'S-M-R-T', $filtered );
	}

	public function test_register_with_array() {
		register_setting( 'test_group', 'test_option', array(
			'sanitize_callback' => array( $this, 'filter_registered_setting' ),
		));

		$filtered = apply_filters( 'sanitize_option_test_option', 'smart', 'test_option', 'smart' );
		$this->assertEquals( 'S-M-R-T', $filtered );
	}

	public function filter_registered_setting() {
		return 'S-M-R-T';
	}

	/**
	 * @ticket 38176
	 */
	public function test_register_with_default() {
		register_setting( 'test_group', 'test_default', array(
			'default' => 'Fuck Cancer'
		));

		$this->assertEquals( 'Fuck Cancer', get_option( 'test_default' ) );
	}

	/**
	 * @ticket 38176
	 */
	public function test_register_with_default_override() {
		register_setting( 'test_group', 'test_default', array(
			'default' => 'Fuck Cancer'
		));

		$this->assertEquals( 'Fuck Leukemia', get_option( 'test_default', 'Fuck Leukemia' ) );
	}

	/**
	 * @expectedDeprecated register_setting
	 */
	public function test_register_deprecated_group_misc() {
		register_setting( 'misc', 'test_option' );
	}

	/**
	 * @expectedDeprecated register_setting
	 */
	public function test_register_deprecated_group_privacy() {
		register_setting( 'privacy', 'test_option' );
	}
}
