<?php
/**
 * Ajax test cases
 *
 * @package    WordPress
 * @subpackage UnitTests
 * @since      3.4.0
 */

/**
 * Ajax test case class
 *
 * @package    WordPress
 * @subpackage UnitTests
 * @since      3.4.0
 */
abstract class WP_Ajax_UnitTestCase extends WP_UnitTestCase {

	/**
	 * Last AJAX response.  This is set via echo -or- wp_die.
	 * @var type
	 */
	protected $_last_response = '';

	/**
	 * List of ajax actions called via POST
	 * @var type
	 */
	protected $_core_actions_get = array( 'fetch-list', 'ajax-tag-search', 'wp-compression-test', 'imgedit-preview', 'oembed_cache' );

	/**
	 * Saved error reporting level
	 * @var int
	 */
	protected $_error_level = 0;

	/**
	 * List of ajax actions called via GET
	 * @var type
	 */
	protected $_core_actions_post = array(
		'oembed_cache', 'image-editor', 'delete-comment', 'delete-tag', 'delete-link',
		'delete-meta', 'delete-post', 'trash-post', 'untrash-post', 'delete-page', 'dim-comment',
		'add-link-category', 'add-tag', 'get-tagcloud', 'get-comments', 'replyto-comment',
		'edit-comment', 'add-menu-item', 'add-meta', 'add-user', 'closed-postboxes',
		'hidden-columns', 'update-welcome-panel', 'menu-get-metabox', 'wp-link-ajax',
		'menu-locations-save', 'menu-quick-search', 'meta-box-order', 'get-permalink',
		'sample-permalink', 'inline-save', 'inline-save-tax', 'find_posts', 'widgets-order',
		'save-widget', 'set-post-thumbnail', 'date_format', 'time_format', 'wp-fullscreen-save-post',
		'wp-remove-post-lock', 'dismiss-wp-pointer', 'heartbeat', 'nopriv_heartbeat',
	);

	/**
	 * Set up the test fixture.
	 * Override wp_die(), pretend to be ajax, and suppres E_WARNINGs
	 */
	public function setUp() {
		parent::setUp();

		// Register the core actions
		foreach ( array_merge( $this->_core_actions_get, $this->_core_actions_post ) as $action )
			if ( function_exists( 'wp_ajax_' . str_replace( '-', '_', $action ) ) )
				add_action( 'wp_ajax_' . $action, 'wp_ajax_' . str_replace( '-', '_', $action ), 1 );

		add_filter( 'wp_die_ajax_handler', array( $this, 'getDieHandler' ), 1, 1 );
		if ( !defined( 'DOING_AJAX' ) )
			define( 'DOING_AJAX', true );
		set_current_screen( 'ajax' );

		// Clear logout cookies
		add_action( 'clear_auth_cookie', array( $this, 'logout' ) );

		// Suppress warnings from "Cannot modify header information - headers already sent by"
		$this->_error_level = error_reporting();
		error_reporting( $this->_error_level & ~E_WARNING );

		// Make some posts
		$this->factory->post->create_many( 5 );
	}

	/**
	 * Tear down the test fixture.
	 * Reset $_POST, remove the wp_die() override, restore error reporting
	 */
	public function tearDown() {
		parent::tearDown();
		$_POST = array();
		$_GET = array();
		unset( $GLOBALS['post'] );
		unset( $GLOBALS['comment'] );
		remove_filter( 'wp_die_ajax_handler', array( $this, 'getDieHandler' ), 1, 1 );
		remove_action( 'clear_auth_cookie', array( $this, 'logout' ) );
		error_reporting( $this->_error_level );
		set_current_screen( 'front' );
	}

	/**
	 * Clear login cookies, unset the current user
	 */
	public function logout() {
		unset( $GLOBALS['current_user'] );
		$cookies = array(AUTH_COOKIE, SECURE_AUTH_COOKIE, LOGGED_IN_COOKIE, USER_COOKIE, PASS_COOKIE);
		foreach ( $cookies as $c )
			unset( $_COOKIE[$c] );
	}

	/**
	 * Return our callback handler
	 * @return callback
	 */
	public function getDieHandler() {
		return array( $this, 'dieHandler' );
	}

	/**
	 * Handler for wp_die()
	 * Save the output for analysis, stop execution by throwing an exception.
	 * Error conditions (no output, just die) will throw <code>WPAjaxDieStopException( $message )</code>
	 * You can test for this with:
	 * <code>
	 * $this->setExpectedException( 'WPAjaxDieStopException', 'something contained in $message' );
	 * </code>
	 * Normal program termination (wp_die called at then end of output) will throw <code>WPAjaxDieContinueException( $message )</code>
	 * You can test for this with:
	 * <code>
	 * $this->setExpectedException( 'WPAjaxDieContinueException', 'something contained in $message' );
	 * </code>
	 * @param string $message
	 */
	public function dieHandler( $message ) {
		$this->_last_response .= ob_get_clean();

		if ( '' === $this->_last_response ) {
			if ( is_scalar( $message ) ) {
				throw new WPAjaxDieStopException( (string) $message );
			} else {
				throw new WPAjaxDieStopException( '0' );
			}
		} else {
			throw new WPAjaxDieContinueException( $message );
		}
	}

	/**
	 * Switch between user roles
	 * E.g. administrator, editor, author, contributor, subscriber
	 * @param string $role
	 */
	protected function _setRole( $role ) {
		$post = $_POST;
		$user_id = $this->factory->user->create( array( 'role' => $role ) );
		wp_set_current_user( $user_id );
		$_POST = array_merge($_POST, $post);
	}

	/**
	 * Mimic the ajax handling of admin-ajax.php
	 * Capture the output via output buffering, and if there is any, store
	 * it in $this->_last_message.
	 * @param string $action
	 */
	protected function _handleAjax($action) {

		// Start output buffering
		ini_set( 'implicit_flush', false );
		ob_start();

		// Build the request
		$_POST['action'] = $action;
		$_GET['action']  = $action;
		$_REQUEST        = array_merge( $_POST, $_GET );

		// Call the hooks
		do_action( 'admin_init' );
		do_action( 'wp_ajax_' . $_REQUEST['action'], null );

		// Save the output
		$buffer = ob_get_clean();
		if ( !empty( $buffer ) )
			$this->_last_response = $buffer;
	}
}
