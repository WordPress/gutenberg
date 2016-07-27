<?php
/**
 * Admin ajax functions to be tested
 */
require_once( ABSPATH . 'wp-admin/includes/ajax-actions.php' );

/**
 * Testing Ajax handler for updating a plugin.
 *
 * @group ajax
 */
class Tests_Ajax_Update_Plugin extends WP_Ajax_UnitTestCase {
	/**
	 * @expectedException WPAjaxDieStopException
	 * @expectedExceptionMessage -1
	 */
	public function test_missing_nonce() {
		$this->_handleAjax( 'update-plugin' );
	}

	public function test_missing_plugin() {
		$_POST['_ajax_nonce'] = wp_create_nonce( 'updates' );
		$_POST['slug']        = 'foo';

		// Make the request
		try {
			$this->_handleAjax( 'update-plugin' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response.
		$response = json_decode( $this->_last_response, true );

		$expected = array(
			'success' => false,
			'data'    => array(
				'slug'         => '',
				'errorCode'    => 'no_plugin_specified',
				'errorMessage' => 'No plugin specified.',
			),
		);

		$this->assertEqualSets( $expected, $response );
	}

	public function test_missing_slug() {
		$_POST['_ajax_nonce'] = wp_create_nonce( 'updates' );
		$_POST['plugin']      = 'foo/bar.php';

		// Make the request
		try {
			$this->_handleAjax( 'update-plugin' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response.
		$response = json_decode( $this->_last_response, true );

		$expected = array(
			'success' => false,
			'data'    => array(
				'slug'         => '',
				'errorCode'    => 'no_plugin_specified',
				'errorMessage' => 'No plugin specified.',
			),
		);

		$this->assertEqualSets( $expected, $response );
	}

	public function test_missing_capability() {
		$_POST['_ajax_nonce'] = wp_create_nonce( 'updates' );
		$_POST['plugin']      = 'foo/bar.php';
		$_POST['slug']        = 'foo';

		// Make the request
		try {
			$this->_handleAjax( 'update-plugin' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response.
		$response = json_decode( $this->_last_response, true );

		$expected = array(
			'success' => false,
			'data'    => array(
				'update'       => 'plugin',
				'slug'         => 'foo',
				'errorMessage' => 'Sorry, you are not allowed to update plugins for this site.',
				'oldVersion'   => '',
				'newVersion'   => '',
			),
		);

		$this->assertEqualSets( $expected, $response );
	}

	public function test_invalid_file() {
		$this->_setRole( 'administrator' );

		$_POST['_ajax_nonce'] = wp_create_nonce( 'updates' );
		$_POST['plugin']      = '../foo/bar.php';
		$_POST['slug']        = 'foo';

		// Make the request
		try {
			$this->_handleAjax( 'update-plugin' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response.
		$response = json_decode( $this->_last_response, true );

		$expected = array(
			'success' => false,
			'data'    => array(
				'update'       => 'plugin',
				'slug'         => 'foo',
				'errorMessage' => 'Sorry, you are not allowed to update plugins for this site.',
				'oldVersion'   => '',
				'newVersion'   => '',
			),
		);

		$this->assertEqualSets( $expected, $response );
	}

	public function test_update_plugin() {
		$this->_setRole( 'administrator' );

		$_POST['_ajax_nonce'] = wp_create_nonce( 'updates' );
		$_POST['plugin']      = 'hello.php';
		$_POST['slug']        = 'hello-dolly';

		// Make the request
		try {
			// Prevent wp_update_plugins() from running
			wp_installing( true );
			$this->_handleAjax( 'update-plugin' );
			wp_installing( false );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response.
		$response = json_decode( $this->_last_response, true );

		$expected = array(
			'success' => false,
			'data'    => array(
				'update'       => 'plugin',
				'slug'         => 'hello-dolly',
				'plugin'       => 'hello.php',
				'pluginName'   => 'Hello Dolly',
				'errorMessage' => 'Plugin update failed.',
				'oldVersion'   => 'Version 1.6',
				'newVersion'   => '',
				'debug'        => array( 'The plugin is at the latest version.' ),
			),
		);

		$this->assertEqualSets( $expected, $response );
	}
}
