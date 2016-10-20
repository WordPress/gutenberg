<?php
/**
 * WP_Customize_Selective_Refresh Ajax tests.
 *
 * @package    WordPress
 * @subpackage UnitTests
 */

/**
 * Tests for the WP_Customize_Selective_Refresh class Ajax.
 *
 * Note that this is intentionally not extending WP_Ajax_UnitTestCase because it
 * is not admin ajax.
 *
 * @since      4.5.0
 * @group      ajax
 */
class Test_WP_Customize_Selective_Refresh_Ajax extends WP_UnitTestCase {

	/**
	 * Manager.
	 *
	 * @var WP_Customize_Manager
	 */
	public $wp_customize;

	/**
	 * Component.
	 *
	 * @var WP_Customize_Selective_Refresh
	 */
	public $selective_refresh;

	/**
	 * Set up the test fixture.
	 */
	function setUp() {
		parent::setUp();

		// Define DOING_AJAX so that wp_die() will be used instead of die().
		if ( ! defined( 'DOING_AJAX' ) ) {
			define( 'DOING_AJAX', true );
		}
		add_filter( 'wp_die_ajax_handler', array( $this, 'get_wp_die_handler' ), 1, 1 );

		require_once( ABSPATH . WPINC . '/class-wp-customize-manager.php' );
		// @codingStandardsIgnoreStart
		$GLOBALS['wp_customize'] = new WP_Customize_Manager();
		// @codingStandardsIgnoreEnd
		$this->wp_customize = $GLOBALS['wp_customize'];
		if ( isset( $this->wp_customize->selective_refresh ) ) {
			$this->selective_refresh = $this->wp_customize->selective_refresh;
		}

	}

	/**
	 * Do Customizer boot actions.
	 */
	function do_customize_boot_actions() {
		// Remove actions that call add_theme_support( 'title-tag' ).
		remove_action( 'after_setup_theme', 'twentyfifteen_setup' );
		remove_action( 'after_setup_theme', 'twentysixteen_setup' );
		remove_action( 'after_setup_theme', 'twentyseventeen_setup' );

		$_SERVER['REQUEST_METHOD'] = 'POST';
		do_action( 'setup_theme' );
		do_action( 'after_setup_theme' );
		do_action( 'init' );
		do_action( 'customize_register', $this->wp_customize );
		$this->wp_customize->customize_preview_init();
		do_action( 'wp', $GLOBALS['wp'] );
	}

	/**
	 * Test WP_Customize_Selective_Refresh::handle_render_partials_request().
	 *
	 * @see WP_Customize_Selective_Refresh::handle_render_partials_request()
	 */
	function test_handle_render_partials_request_for_unauthenticated_user() {
		$_POST[ WP_Customize_Selective_Refresh::RENDER_QUERY_VAR ] = '1';

		// Check current_user_cannot_customize.
		ob_start();
		try {
			$this->selective_refresh->handle_render_partials_request();
		} catch ( WPDieException $e ) {
			unset( $e );
		}
		$output = json_decode( ob_get_clean(), true );
		$this->assertFalse( $output['success'] );
		$this->assertEquals( 'expected_customize_preview', $output['data'] );

		// Check expected_customize_preview.
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$_REQUEST['nonce'] = wp_create_nonce( 'preview-customize_' . $this->wp_customize->theme()->get_stylesheet() );
		ob_start();
		try {
			$this->selective_refresh->handle_render_partials_request();
		} catch ( WPDieException $e ) {
			unset( $e );
		}
		$output = json_decode( ob_get_clean(), true );
		$this->assertFalse( $output['success'] );
		$this->assertEquals( 'expected_customize_preview', $output['data'] );

		// Check missing_partials.
		$this->do_customize_boot_actions();
		ob_start();
		try {
			$this->selective_refresh->handle_render_partials_request();
		} catch ( WPDieException $e ) {
			unset( $e );
		}
		$output = json_decode( ob_get_clean(), true );
		$this->assertFalse( $output['success'] );
		$this->assertEquals( 'missing_partials', $output['data'] );

		// Check missing_partials.
		$_POST['partials'] = 'bad';
		$this->do_customize_boot_actions();
		ob_start();
		try {
			$this->selective_refresh->handle_render_partials_request();
		} catch ( WPDieException $e ) {
			$this->assertEquals( '', $e->getMessage() );
		}
		$output = json_decode( ob_get_clean(), true );
		$this->assertFalse( $output['success'] );
		$this->assertEquals( 'malformed_partials', $output['data'] );
	}

	/**
	 * Set the current user to be an admin, add the preview nonce, and set the query var.
	 */
	function setup_valid_render_partials_request_environment() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$_REQUEST['nonce'] = wp_create_nonce( 'preview-customize_' . $this->wp_customize->theme()->get_stylesheet() );
		$_POST[ WP_Customize_Selective_Refresh::RENDER_QUERY_VAR ] = '1';
		$this->do_customize_boot_actions();
	}

	/**
	 * Test WP_Customize_Selective_Refresh::handle_render_partials_request() for an unrecognized partial.
	 *
	 * @see WP_Customize_Selective_Refresh::handle_render_partials_request()
	 */
	function test_handle_render_partials_request_for_unrecognized_partial() {
		$this->setup_valid_render_partials_request_environment();
		$context_data = array();
		$placements = array( $context_data );

		$_POST['partials'] = wp_slash( wp_json_encode( array(
			'foo' => $placements,
		) ) );

		ob_start();
		try {
			$this->expected_partial_ids = array( 'foo' );
			add_filter( 'customize_render_partials_response', array( $this, 'filter_customize_render_partials_response' ), 10, 3 );
			add_action( 'customize_render_partials_before', array( $this, 'handle_action_customize_render_partials_before' ), 10, 2 );
			add_action( 'customize_render_partials_after', array( $this, 'handle_action_customize_render_partials_after' ), 10, 2 );
			$this->selective_refresh->handle_render_partials_request();
		} catch ( WPDieException $e ) {
			$this->assertEquals( '', $e->getMessage() );
		}
		$output = json_decode( ob_get_clean(), true );
		$this->assertTrue( $output['success'] );
		$this->assertInternalType( 'array', $output['data'] );
		$this->assertArrayHasKey( 'contents', $output['data'] );
		$this->assertArrayHasKey( 'errors', $output['data'] );
		$this->assertArrayHasKey( 'foo', $output['data']['contents'] );
		$this->assertEquals( null, $output['data']['contents']['foo'] );
	}

	/**
	 * Test WP_Customize_Selective_Refresh::handle_render_partials_request() for a partial that does not render.
	 *
	 * @see WP_Customize_Selective_Refresh::handle_render_partials_request()
	 */
	function test_handle_render_partials_request_for_non_rendering_partial() {
		$this->setup_valid_render_partials_request_environment();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$this->wp_customize->add_setting( 'home' );
		$this->wp_customize->selective_refresh->add_partial( 'foo', array( 'settings' => array( 'home' ) ) );
		$context_data = array();
		$placements = array( $context_data );

		$_POST['partials'] = wp_slash( wp_json_encode( array(
			'foo' => $placements,
		) ) );

		$count_customize_render_partials_before = has_action( 'customize_render_partials_before' );
		$count_customize_render_partials_after = has_action( 'customize_render_partials_after' );
		ob_start();
		try {
			$this->expected_partial_ids = array( 'foo' );
			add_filter( 'customize_render_partials_response', array( $this, 'filter_customize_render_partials_response' ), 10, 3 );
			add_action( 'customize_render_partials_before', array( $this, 'handle_action_customize_render_partials_before' ), 10, 2 );
			add_action( 'customize_render_partials_after', array( $this, 'handle_action_customize_render_partials_after' ), 10, 2 );
			$this->selective_refresh->handle_render_partials_request();
		} catch ( WPDieException $e ) {
			$this->assertEquals( '', $e->getMessage() );
		}
		$this->assertEquals( $count_customize_render_partials_before + 1, has_action( 'customize_render_partials_before' ) );
		$this->assertEquals( $count_customize_render_partials_after + 1, has_action( 'customize_render_partials_after' ) );
		$output = json_decode( ob_get_clean(), true );
		$this->assertEquals( array( false ), $output['data']['contents']['foo'] );
	}

	/**
	 * Test WP_Customize_Selective_Refresh::handle_render_partials_request() for a partial the user doesn't have the capability to edit.
	 *
	 * @see WP_Customize_Selective_Refresh::handle_render_partials_request()
	 */
	function test_handle_rendering_disallowed_partial() {
		$this->setup_valid_render_partials_request_environment();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$this->wp_customize->add_setting( 'secret_message', array(
			'capability' => 'top_secret_clearance',
		) );
		$this->wp_customize->selective_refresh->add_partial( 'secret_message', array( 'settings' => 'secret_message' ) );

		$context_data = array();
		$placements = array( $context_data );
		$_POST['partials'] = wp_slash( wp_json_encode( array(
			'secret_message' => $placements,
		) ) );

		ob_start();
		try {
			$this->selective_refresh->handle_render_partials_request();
		} catch ( WPDieException $e ) {
			$this->assertEquals( '', $e->getMessage() );
		}
		$output = json_decode( ob_get_clean(), true );
		$this->assertNull( $output['data']['contents']['secret_message'] );
	}

	/**
	 * Test WP_Customize_Selective_Refresh::handle_render_partials_request() for a partial for which an associated setting does not exist.
	 *
	 * @see WP_Customize_Selective_Refresh::handle_render_partials_request()
	 */
	function test_handle_rendering_partial_with_missing_settings() {
		$this->setup_valid_render_partials_request_environment();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$this->wp_customize->selective_refresh->add_partial( 'bar', array( 'settings' => 'bar' ) );

		$context_data = array();
		$placements = array( $context_data );
		$_POST['partials'] = wp_slash( wp_json_encode( array(
			'bar' => $placements,
		) ) );

		ob_start();
		try {
			$this->selective_refresh->handle_render_partials_request();
		} catch ( WPDieException $e ) {
			$this->assertEquals( '', $e->getMessage() );
		}
		$output = json_decode( ob_get_clean(), true );
		$this->assertNull( $output['data']['contents']['bar'] );
	}

	/**
	 * Get the rendered blogname.
	 *
	 * @param WP_Customize_Partial $partial Partial.
	 * @param array                $context Context data.
	 * @return string
	 */
	function render_callback_blogname( $partial, $context ) {
		$this->assertInternalType( 'array', $context );
		$this->assertInstanceOf( 'WP_Customize_Partial', $partial );
		return get_bloginfo( 'name', 'display' );
	}

	/**
	 * Get the rendered blogdescription.
	 *
	 * @param WP_Customize_Partial $partial Partial.
	 * @param array                $context Context data.
	 * @return string
	 */
	function render_callback_blogdescription( $partial, $context ) {
		$this->assertInternalType( 'array', $context );
		$this->assertInstanceOf( 'WP_Customize_Partial', $partial );
		$x = get_bloginfo( 'description', 'display' );
		return $x;
	}

	/**
	 * Test WP_Customize_Selective_Refresh::handle_render_partials_request() for a partial that does render.
	 *
	 * @see WP_Customize_Selective_Refresh::handle_render_partials_request()
	 */
	function test_handle_render_partials_request_with_single_valid_placement() {
		$this->setup_valid_render_partials_request_environment();

		$this->wp_customize->selective_refresh->add_partial( 'test_blogname', array(
			'settings' => array( 'blogname' ),
			'render_callback' => array( $this, 'render_callback_blogname' ),
		) );

		$context_data = array();
		$placements = array( $context_data );

		$_POST['partials'] = wp_slash( wp_json_encode( array(
			'test_blogname' => $placements,
		) ) );

		$count_customize_render_partials_before = has_action( 'customize_render_partials_before' );
		$count_customize_render_partials_after = has_action( 'customize_render_partials_after' );
		ob_start();
		try {
			$this->expected_partial_ids = array( 'test_blogname' );
			add_filter( 'customize_render_partials_response', array( $this, 'filter_customize_render_partials_response' ), 10, 3 );
			add_action( 'customize_render_partials_before', array( $this, 'handle_action_customize_render_partials_before' ), 10, 2 );
			add_action( 'customize_render_partials_after', array( $this, 'handle_action_customize_render_partials_after' ), 10, 2 );
			$this->selective_refresh->handle_render_partials_request();
		} catch ( WPDieException $e ) {
			$this->assertEquals( '', $e->getMessage() );
		}
		$this->assertEquals( $count_customize_render_partials_before + 1, has_action( 'customize_render_partials_before' ) );
		$this->assertEquals( $count_customize_render_partials_after + 1, has_action( 'customize_render_partials_after' ) );
		$output = json_decode( ob_get_clean(), true );
		$this->assertEquals( array( get_bloginfo( 'name', 'display' ) ), $output['data']['contents']['test_blogname'] );
		$this->assertArrayHasKey( 'setting_validities', $output['data'] );
	}

	/**
	 * Filter customize_dynamic_partial_args.
	 *
	 * @param array  $partial_args Partial args.
	 * @param string $partial_id   Partial ID.
	 *
	 * @return array|false Args.
	 */
	function filter_customize_dynamic_partial_args( $partial_args, $partial_id ) {
		if ( 'test_dynamic_blogname' === $partial_id ) {
			$partial_args = array(
				'settings' => array( 'blogname' ),
				'render_callback' => array( $this, 'render_callback_blogname' ),
			);
		}
		return $partial_args;
	}

	/**
	 * Filter customize_render_partials_response.
	 *
	 * @param array                          $response            Response.
	 * @param WP_Customize_Selective_Refresh $component Selective refresh component.
	 * @param array                          $partial_placements  Placements' context data for the partials rendered in the request.
	 *                                                            The array is keyed by partial ID, with each item being an array of
	 *                                                            the placements' context data.
	 * @return array Response.
	 */
	function filter_customize_render_partials_response( $response, $component, $partial_placements ) {
		$this->assertInternalType( 'array', $response );
		$this->assertInstanceOf( 'WP_Customize_Selective_Refresh', $component );
		if ( isset( $this->expected_partial_ids ) ) {
			$this->assertEqualSets( $this->expected_partial_ids, array_keys( $partial_placements ) );
		}
		return $response;
	}

	/**
	 * Expected partial IDs.
	 *
	 * @var array
	 */
	protected $expected_partial_ids;

	/**
	 * Handle 'customize_render_partials_before' action.
	 *
	 * @param WP_Customize_Selective_Refresh $component          Selective refresh component.
	 * @param array                          $partial_placements Partial IDs.
	 */
	function handle_action_customize_render_partials_after( $component, $partial_placements ) {
		$this->assertInstanceOf( 'WP_Customize_Selective_Refresh', $component );
		if ( isset( $this->expected_partial_ids ) ) {
			$this->assertEqualSets( $this->expected_partial_ids, array_keys( $partial_placements ) );
		}
	}

	/**
	 * Handle 'customize_render_partials_after' action.
	 *
	 * @param WP_Customize_Selective_Refresh $component          Selective refresh component.
	 * @param array                          $partial_placements Partial IDs.
	 */
	function handle_action_customize_render_partials_before( $component, $partial_placements ) {
		$this->assertInstanceOf( 'WP_Customize_Selective_Refresh', $component );
		if ( isset( $this->expected_partial_ids ) ) {
			$this->assertEqualSets( $this->expected_partial_ids, array_keys( $partial_placements ) );
		}
	}

	/**
	 * Test WP_Customize_Selective_Refresh::handle_render_partials_request()dynamic partials are recognized.
	 *
	 * @see WP_Customize_Selective_Refresh::handle_render_partials_request()
	 */
	function test_handle_render_partials_request_for_dynamic_partial() {
		$this->setup_valid_render_partials_request_environment();
		add_filter( 'customize_dynamic_partial_args', array( $this, 'filter_customize_dynamic_partial_args' ), 10, 2 );

		$context_data = array();
		$placements = array( $context_data );

		$_POST['partials'] = wp_slash( wp_json_encode( array(
			'test_dynamic_blogname' => $placements,
		) ) );

		$count_customize_render_partials_before = has_action( 'customize_render_partials_before' );
		$count_customize_render_partials_after = has_action( 'customize_render_partials_after' );
		ob_start();
		try {
			$this->expected_partial_ids = array( 'test_dynamic_blogname' );
			add_filter( 'customize_render_partials_response', array( $this, 'filter_customize_render_partials_response' ), 10, 3 );
			add_action( 'customize_render_partials_before', array( $this, 'handle_action_customize_render_partials_before' ), 10, 2 );
			add_action( 'customize_render_partials_after', array( $this, 'handle_action_customize_render_partials_after' ), 10, 2 );
			$this->selective_refresh->handle_render_partials_request();
		} catch ( WPDieException $e ) {
			$this->assertEquals( '', $e->getMessage() );
		}
		$this->assertEquals( $count_customize_render_partials_before + 1, has_action( 'customize_render_partials_before' ) );
		$this->assertEquals( $count_customize_render_partials_after + 1, has_action( 'customize_render_partials_after' ) );
		$output = json_decode( ob_get_clean(), true );
		$this->assertEquals( array( get_bloginfo( 'name', 'display' ) ), $output['data']['contents']['test_dynamic_blogname'] );
	}

	/**
	 * Test WP_Customize_Selective_Refresh::handle_render_partials_request() to multiple partials can be requested at once.
	 *
	 * @see WP_Customize_Selective_Refresh::handle_render_partials_request()
	 */
	function test_handle_render_partials_request_for_multiple_partials_placements() {
		$this->setup_valid_render_partials_request_environment();

		$this->wp_customize->selective_refresh->add_partial( 'test_blogname', array(
			'settings' => array( 'blogname' ),
			'render_callback' => array( $this, 'render_callback_blogname' ),
		) );
		$this->wp_customize->selective_refresh->add_partial( 'test_blogdescription', array(
			'settings' => array( 'blogdescription' ),
			'render_callback' => array( $this, 'render_callback_blogdescription' ),
		) );

		$placement_context_data = array();

		$_POST['partials'] = wp_slash( wp_json_encode( array(
			'test_blogname' => array( $placement_context_data ),
			'test_blogdescription' => array( $placement_context_data, $placement_context_data ),
		) ) );

		$count_customize_render_partials_before = has_action( 'customize_render_partials_before' );
		$count_customize_render_partials_after = has_action( 'customize_render_partials_after' );
		ob_start();
		try {
			$this->expected_partial_ids = array( 'test_blogname', 'test_blogdescription' );
			add_filter( 'customize_render_partials_response', array( $this, 'filter_customize_render_partials_response' ), 10, 3 );
			add_action( 'customize_render_partials_before', array( $this, 'handle_action_customize_render_partials_before' ), 10, 2 );
			add_action( 'customize_render_partials_after', array( $this, 'handle_action_customize_render_partials_after' ), 10, 2 );
			$this->selective_refresh->handle_render_partials_request();
		} catch ( WPDieException $e ) {
			$this->assertEquals( '', $e->getMessage() );
		}
		$this->assertEquals( $count_customize_render_partials_before + 1, has_action( 'customize_render_partials_before' ) );
		$this->assertEquals( $count_customize_render_partials_after + 1, has_action( 'customize_render_partials_after' ) );
		$output = json_decode( ob_get_clean(), true );
		$this->assertEquals( array( get_bloginfo( 'name', 'display' ) ), $output['data']['contents']['test_blogname'] );
		$this->assertEquals( array_fill( 0, 2, get_bloginfo( 'description', 'display' ) ), $output['data']['contents']['test_blogdescription'] );
	}

	/**
	 * Tear down.
	 */
	function tearDown() {
		$this->expected_partial_ids = null;
		$this->wp_customize = null;
		unset( $GLOBALS['wp_customize'] );
		unset( $GLOBALS['wp_scripts'] );
		parent::tearDown();
	}
}
