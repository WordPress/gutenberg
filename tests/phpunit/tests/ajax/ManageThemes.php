<?php
/**
 * Admin ajax functions to be tested
 */
require_once( ABSPATH . 'wp-admin/includes/ajax-actions.php' );

/**
 * Testing Ajax handler for instlaling, updating, and deleting themes.
 *
 * @group ajax
 */
class Tests_Ajax_Manage_Themes extends WP_Ajax_UnitTestCase {
	private $orig_theme_dir;
	private $theme_root;

	function setUp() {
		parent::setUp();

		$this->theme_root     = DIR_TESTDATA . '/themedir1';
		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		add_filter( 'theme_root',      array( $this, 'filter_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_theme_root' ) );
		add_filter( 'template_root',   array( $this, 'filter_theme_root' ) );

		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
	}

	function tearDown() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		remove_filter( 'theme_root',      array( $this, 'filter_theme_root' ) );
		remove_filter( 'stylesheet_root', array( $this, 'filter_theme_root' ) );
		remove_filter( 'template_root',   array( $this, 'filter_theme_root' ) );
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		parent::tearDown();
	}

	/**
	 * Replace the normal theme root dir with our pre-made test dir.
	 */
	public function filter_theme_root() {
		return $this->theme_root;
	}

	public function test_missing_slug() {
		$_POST['_ajax_nonce'] = wp_create_nonce( 'updates' );

		// Make the request.
		try {
			$this->_handleAjax( 'update-theme' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response.
		$response = json_decode( $this->_last_response, true );

		$expected = array(
			'success' => false,
			'data'    => array(
				'slug'         => '',
				'errorCode'    => 'no_theme_specified',
				'errorMessage' => 'No theme specified.',
			),
		);

		$this->assertEqualSets( $expected, $response );
	}

	public function test_missing_capability() {
		$_POST['_ajax_nonce'] = wp_create_nonce( 'updates' );
		$_POST['slug']        = 'foo';

		// Make the request.
		try {
			$this->_handleAjax( 'update-theme' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response.
		$response = json_decode( $this->_last_response, true );

		$expected = array(
			'success' => false,
			'data'    => array(
				'update'       => 'theme',
				'slug'         => 'foo',
				'errorMessage' => 'Sorry, you are not allowed to update themes for this site.',
				'newVersion'   => '',
			),
		);

		$this->assertEqualSets( $expected, $response );
	}

	public function test_update_theme() {
		$this->_setRole( 'administrator' );

		$_POST['_ajax_nonce'] = wp_create_nonce( 'updates' );
		$_POST['slug']        = 'twentyten';

		// Make the request.
		try {

			// Prevent wp_update_themes() from running.
			wp_installing( true );
			$this->_handleAjax( 'update-theme' );
			wp_installing( false );

		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response.
		$response = json_decode( $this->_last_response, true );

		$expected = array(
			'success' => false,
			'data'    => array(
				'update'       => 'theme',
				'slug'         => 'twentyten',
				'errorMessage' => 'The theme is at the latest version.',
				'newVersion'   => '',
				'debug'        => array( 'The theme is at the latest version.' ),
			),
		);

		$this->assertEqualSets( $expected, $response );
	}

	function test_uppercase_theme_slug() {
		$this->_setRole( 'administrator' );

		$_POST['_ajax_nonce'] = wp_create_nonce( 'updates' );
		$_POST['slug']        = 'camelCase';

		// Make the request.
		try {
			$this->_handleAjax( 'update-theme' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// Get the response.
		$response = json_decode( $this->_last_response, true );

		$expected = array(
			'success' => false,
			'data'    => array(
				'update'       => 'theme',
				'slug'         => 'camelCase',
				'newVersion'   => '',
				'errorMessage' => 'The theme is at the latest version.',
				'debug'        => array( 'The theme is at the latest version.' ),
			),
		);

		$this->assertEqualSets( $expected, $response );
	}
}
