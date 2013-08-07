<?php

/**
 * Admin ajax functions to be tested
 */
require_once( ABSPATH . 'wp-admin/includes/ajax-actions.php' );

/**
 * Testing ajax tag search functionality
 *
 * @package    WordPress
 * @subpackage UnitTests
 * @since      3.4.0
 * @group      ajax
 */
class Tests_Ajax_TagSearch extends WP_Ajax_UnitTestCase {

	/**
	 * List of terms to insert on setup
	 * @var array
	 */
	private $_terms = array(
		'chattels', 'depo', 'energumen', 'figuriste', 'habergeon', 'impropriation'
	);

	/**
	 * Setup
	 * @todo use a term factory
	 */
	public function setUp() {
		parent::setUp();

		foreach ( $this->_terms as $term )
			wp_insert_term( $term, 'post_tag' );
	}

	/**
	 * Test as an admin
	 */
	public function test_post_tag() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_GET['tax'] = 'post_tag';
		$_GET['q']   = 'chat';

		// Make the request
		try {
			$this->_handleAjax( 'ajax-tag-search' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Ensure we found the right match
		$this->assertEquals( $this->_last_response, 'chattels' );
	}

	/**
	 * Test with no results
	 */
	public function test_no_results() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_GET['tax'] = 'post_tag';
		$_GET['q']   = md5(uniqid());

		// Make the request
		// No output, so we get a stop exception
		$this->setExpectedException( 'WPAjaxDieStopException', '0' );
		$this->_handleAjax( 'ajax-tag-search' );
	}

	/**
	 * Test with commas
	 */
	public function test_with_comma() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_GET['tax'] = 'post_tag';
		$_GET['q']   = 'some,nonsense, terms,chat'; // Only the last term in the list is searched

		// Make the request
		try {
			$this->_handleAjax( 'ajax-tag-search' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Ensure we found the right match
		$this->assertEquals( $this->_last_response, 'chattels' );
	}

	/**
	 * Test as a logged out user
	 */
	public function test_logged_out() {

		// Log out
		wp_logout();

		// Set up a default request
		$_GET['tax'] = 'post_tag';
		$_GET['q']   = 'chat';

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'ajax-tag-search' );
	}

	/**
	 * Test with an invalid taxonomy type
	 */
	public function test_invalid_tax() {

		// Become an administrator
		$this->_setRole( 'administrator' );

		// Set up a default request
		$_GET['tax'] = 'invalid-taxonomy';
		$_GET['q']   = 'chat';

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '0' );
		$this->_handleAjax( 'ajax-tag-search' );
	}

	/**
	 * Test as an unprivileged user
	 */
	public function test_unprivileged_user() {

		// Become an administrator
		$this->_setRole( 'subscriber' );

		// Set up a default request
		$_GET['tax'] = 'post_tag';
		$_GET['q']   = 'chat';

		// Make the request
		$this->setExpectedException( 'WPAjaxDieStopException', '-1' );
		$this->_handleAjax( 'ajax-tag-search' );
	}

}
