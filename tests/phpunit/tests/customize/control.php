<?php
/**
 * Test_WP_Customize_Control tests.
 *
 * @package WordPress
 */

/**
 * Tests for the Test_WP_Customize_Control class.
 *
 * @todo This is missing dedicated tests for all but one of the methods.
 *
 * @group customize
 */
class Test_WP_Customize_Control extends WP_UnitTestCase {

	/**
	 * Manager.
	 *
	 * @var WP_Customize_Manager
	 */
	public $wp_customize;

	/**
	 * Set up.
	 */
	function setUp() {
		parent::setUp();
		require_once( ABSPATH . WPINC . '/class-wp-customize-manager.php' );
		// @codingStandardsIgnoreStart
		$GLOBALS['wp_customize'] = new WP_Customize_Manager();
		// @codingStandardsIgnoreEnd
		$this->wp_customize = $GLOBALS['wp_customize'];
	}

	/**
	 * Test WP_Customize_Control::check_capabilities().
	 *
	 * @see WP_Customize_Control::check_capabilities()
	 */
	function test_check_capabilities() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		do_action( 'customize_register', $this->wp_customize );
		$control = new WP_Customize_Control( $this->wp_customize, 'blogname', array(
			'settings' => array( 'blogname' ),
		) );
		$this->assertTrue( $control->check_capabilities() );

		$control = new WP_Customize_Control( $this->wp_customize, 'blogname', array(
			'settings' => array( 'blogname', 'non_existing' ),
		) );
		$this->assertFalse( $control->check_capabilities() );

		$this->wp_customize->add_setting( 'top_secret_message', array(
			'capability' => 'top_secret_clearance',
		) );
		$control = new WP_Customize_Control( $this->wp_customize, 'blogname', array(
			'settings' => array( 'blogname', 'top_secret_clearance' ),
		) );
		$this->assertFalse( $control->check_capabilities() );

		$control = new WP_Customize_Control( $this->wp_customize, 'no_setting', array(
			'settings' => array(),
		) );
		$this->assertTrue( $control->check_capabilities() );

		$control = new WP_Customize_Control( $this->wp_customize, 'no_setting', array(
			'settings' => array(),
			'capability' => 'top_secret_clearance',
		) );
		$this->assertFalse( $control->check_capabilities() );

		$control = new WP_Customize_Control( $this->wp_customize, 'no_setting', array(
			'settings' => array(),
			'capability' => 'edit_theme_options',
		) );
		$this->assertTrue( $control->check_capabilities() );
	}

	/**
	 * Tear down.
	 */
	function tearDown() {
		$this->wp_customize = null;
		unset( $GLOBALS['wp_customize'] );
		parent::tearDown();
	}
}
