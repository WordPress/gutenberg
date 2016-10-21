<?php
/**
 * Test_WP_Customize_Partial tests.
 *
 * @package WordPress
 */

/**
 * Tests for the Test_WP_Customize_Partial class.
 *
 * @group customize
 */
class Test_WP_Customize_Partial extends WP_UnitTestCase {

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
	 * Set up.
	 */
	function setUp() {
		parent::setUp();
		require_once( ABSPATH . WPINC . '/class-wp-customize-manager.php' );
		// @codingStandardsIgnoreStart
		$GLOBALS['wp_customize'] = new WP_Customize_Manager();
		// @codingStandardsIgnoreEnd
		$this->wp_customize = $GLOBALS['wp_customize'];
		if ( isset( $this->wp_customize->selective_refresh ) ) {
			$this->selective_refresh = $this->wp_customize->selective_refresh;
		}

		// Remove default theme actions that interfere with tests
		remove_action( 'customize_register', 'twentyseventeen_customize_register' );
	}

	/**
	 * Test WP_Customize_Partial::__construct().
	 *
	 * @see WP_Customize_Partial::__construct()
	 */
	function test_construct_default_args() {
		$partial_id = 'blogname';
		$partial = new WP_Customize_Partial( $this->selective_refresh, $partial_id );
		$this->assertEquals( $partial_id, $partial->id );
		$this->assertEquals( $this->selective_refresh, $partial->component );
		$this->assertEquals( 'default', $partial->type );
		$this->assertEmpty( $partial->selector );
		$this->assertEquals( array( $partial_id ), $partial->settings );
		$this->assertEquals( $partial_id, $partial->primary_setting );
		$this->assertEquals( array( $partial, 'render_callback' ), $partial->render_callback );
		$this->assertEquals( false, $partial->container_inclusive );
		$this->assertEquals( true, $partial->fallback_refresh );
	}

	/**
	 * Render post content partial.
	 *
	 * @param WP_Customize_Partial $partial Partial.
	 * @return string|false Content or false if error.
	 */
	function render_post_content_partial( $partial ) {
		$id_data = $partial->id_data();
		$post_id = intval( $id_data['keys'][0] );
		if ( empty( $post_id ) ) {
			return false;
		}
		$post = get_post( $post_id );
		if ( ! $post ) {
			return false;
		}
		return apply_filters( 'the_content', $post->post_content );
	}

	/**
	 * Test WP_Customize_Partial::__construct().
	 *
	 * @see WP_Customize_Partial::__construct()
	 */
	function test_construct_non_default_args() {

		$post_id = self::factory()->post->create( array(
			'post_title' => 'Hello World',
			'post_content' => 'Lorem Ipsum',
		) );

		$partial_id = sprintf( 'post_content[%d]', $post_id );
		$args = array(
			'type' => 'post',
			'selector' => "article.post-$post_id .entry-content",
			'settings' => array( 'user[1]', "post[$post_id]" ),
			'primary_setting' => "post[$post_id]",
			'render_callback' => array( $this, 'render_post_content_partial' ),
			'container_inclusive' => false,
			'fallback_refresh' => false,
		);
		$partial = new WP_Customize_Partial( $this->selective_refresh, $partial_id, $args );
		$this->assertEquals( $partial_id, $partial->id );
		$this->assertEquals( $this->selective_refresh, $partial->component );
		$this->assertEquals( $args['type'], $partial->type );
		$this->assertEquals( $args['selector'], $partial->selector );
		$this->assertEqualSets( $args['settings'], $partial->settings );
		$this->assertEquals( $args['primary_setting'], $partial->primary_setting );
		$this->assertEquals( $args['render_callback'], $partial->render_callback );
		$this->assertEquals( false, $partial->container_inclusive );
		$this->assertEquals( false, $partial->fallback_refresh );
		$this->assertContains( 'Lorem Ipsum', $partial->render() );

		$partial = new WP_Customize_Partial( $this->selective_refresh, $partial_id, array(
			'settings' => 'blogdescription',
		) );
		$this->assertEquals( array( 'blogdescription' ), $partial->settings );
		$this->assertEquals( 'blogdescription', $partial->primary_setting );
	}

	/**
	 * Test WP_Customize_Partial::id_data().
	 *
	 * @see WP_Customize_Partial::id_data()
	 */
	function test_id_data() {
		$partial = new WP_Customize_Partial( $this->selective_refresh, 'foo' );
		$id_data = $partial->id_data();
		$this->assertEquals( 'foo', $id_data['base'] );
		$this->assertEquals( array(), $id_data['keys'] );

		$partial = new WP_Customize_Partial( $this->selective_refresh, 'bar[baz][quux]' );
		$id_data = $partial->id_data();
		$this->assertEquals( 'bar', $id_data['base'] );
		$this->assertEquals( array( 'baz', 'quux' ), $id_data['keys'] );
	}

	/**
	 * Keep track of filter calls to customize_partial_render.
	 *
	 * @var int
	 */
	protected $count_filter_customize_partial_render = 0;

	/**
	 * Keep track of filter calls to customize_partial_render_{$partial->id}.
	 *
	 * @var int
	 */
	protected $count_filter_customize_partial_render_with_id = 0;

	/**
	 * Filter customize_partial_render.
	 *
	 * @param string|false         $rendered          Content.
	 * @param WP_Customize_Partial $partial           Partial.
	 * @param array                $container_context Data.
	 * @return string|false Content.
	 */
	function filter_customize_partial_render( $rendered, $partial, $container_context ) {
		$this->assertTrue( false === $rendered || is_string( $rendered ) );
		$this->assertInstanceOf( 'WP_Customize_Partial', $partial );
		$this->assertInternalType( 'array', $container_context );
		$this->count_filter_customize_partial_render += 1;
		return $rendered;
	}

	/**
	 * Filter customize_partial_render_{$partial->id}.
	 *
	 * @param string|false         $rendered          Content.
	 * @param WP_Customize_Partial $partial           Partial.
	 * @param array                $container_context Data.
	 * @return string|false Content.
	 */
	function filter_customize_partial_render_with_id( $rendered, $partial, $container_context ) {
		$this->assertEquals( sprintf( 'customize_partial_render_%s', $partial->id ), current_filter() );
		$this->assertTrue( false === $rendered || is_string( $rendered ) );
		$this->assertInstanceOf( 'WP_Customize_Partial', $partial );
		$this->assertInternalType( 'array', $container_context );
		$this->count_filter_customize_partial_render_with_id += 1;
		return $rendered;
	}

	/**
	 * Bad render_callback().
	 *
	 * @return string Content.
	 */
	function render_echo_and_return() {
		echo 'foo';
		return 'bar';
	}

	/**
	 * Echo render_callback().
	 */
	function render_echo() {
		echo 'foo';
	}

	/**
	 * Return render_callback().
	 *
	 * @return string Content.
	 */
	function render_return() {
		return 'bar';
	}

	/**
	 * Test WP_Customize_Partial::render() with a bad return_callback.
	 *
	 * @see WP_Customize_Partial::render()
	 */
	function test_render_with_bad_callback_should_give_preference_to_return_value() {
		$partial = new WP_Customize_Partial( $this->selective_refresh, 'foo', array(
			'render_callback' => array( $this, 'render_echo_and_return' ),
		) );
		$this->setExpectedIncorrectUsage( 'render' );
		$this->assertSame( 'bar', $partial->render() );
	}

	/**
	 * Test WP_Customize_Partial::render() with a return_callback that echos.
	 *
	 * @see WP_Customize_Partial::render()
	 */
	function test_render_echo_callback() {
		$partial = new WP_Customize_Partial( $this->selective_refresh, 'foo', array(
			'render_callback' => array( $this, 'render_echo' ),
		) );
		$count_filter_customize_partial_render = $this->count_filter_customize_partial_render;
		$count_filter_customize_partial_render_with_id = $this->count_filter_customize_partial_render_with_id;
		add_filter( 'customize_partial_render', array( $this, 'filter_customize_partial_render' ), 10, 3 );
		add_filter( "customize_partial_render_{$partial->id}", array( $this, 'filter_customize_partial_render_with_id' ), 10, 3 );
		$rendered = $partial->render();
		$this->assertEquals( 'foo', $rendered );
		$this->assertEquals( $count_filter_customize_partial_render + 1, $this->count_filter_customize_partial_render );
		$this->assertEquals( $count_filter_customize_partial_render_with_id + 1, $this->count_filter_customize_partial_render_with_id );
	}

	/**
	 * Test WP_Customize_Partial::render() with a return_callback that echos.
	 *
	 * @see WP_Customize_Partial::render()
	 */
	function test_render_return_callback() {
		$partial = new WP_Customize_Partial( $this->selective_refresh, 'foo', array(
			'render_callback' => array( $this, 'render_return' ),
		) );
		$count_filter_customize_partial_render = $this->count_filter_customize_partial_render;
		$count_filter_customize_partial_render_with_id = $this->count_filter_customize_partial_render_with_id;
		add_filter( 'customize_partial_render', array( $this, 'filter_customize_partial_render' ), 10, 3 );
		add_filter( "customize_partial_render_{$partial->id}", array( $this, 'filter_customize_partial_render_with_id' ), 10, 3 );
		$rendered = $partial->render();
		$this->assertEquals( 'bar', $rendered );
		$this->assertEquals( $count_filter_customize_partial_render + 1, $this->count_filter_customize_partial_render );
		$this->assertEquals( $count_filter_customize_partial_render_with_id + 1, $this->count_filter_customize_partial_render_with_id );
	}

	/**
	 * Test WP_Customize_Partial::render_callback() default.
	 *
	 * @see WP_Customize_Partial::render_callback()
	 */
	function test_render_callback_default() {
		$partial = new WP_Customize_Partial( $this->selective_refresh, 'foo' );
		$this->assertFalse( $partial->render_callback( $partial, array() ) );
		$this->assertFalse( call_user_func( $partial->render_callback, $partial, array() ) );
	}

	/**
	 * Test WP_Customize_Partial::json().
	 *
	 * @see WP_Customize_Partial::json()
	 */
	function test_json() {
		$post_id = 123;
		$partial_id = sprintf( 'post_content[%d]', $post_id );
		$args = array(
			'type' => 'post',
			'selector' => "article.post-$post_id .entry-content",
			'settings' => array( 'user[1]', "post[$post_id]" ),
			'primary_setting' => "post[$post_id]",
			'render_callback' => array( $this, 'render_post_content_partial' ),
			'container_inclusive' => false,
			'fallback_refresh' => false,
		);
		$partial = new WP_Customize_Partial( $this->selective_refresh, $partial_id, $args );

		$exported = $partial->json();
		$this->assertArrayHasKey( 'settings', $exported );
		$this->assertArrayHasKey( 'primarySetting', $exported );
		$this->assertArrayHasKey( 'selector', $exported );
		$this->assertArrayHasKey( 'type', $exported );
		$this->assertArrayHasKey( 'fallbackRefresh', $exported );
		$this->assertArrayHasKey( 'containerInclusive', $exported );
	}

	/**
	 * Test WP_Customize_Partial::check_capabilities().
	 *
	 * @see WP_Customize_Partial::check_capabilities()
	 */
	function test_check_capabilities() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		do_action( 'customize_register', $this->wp_customize );
		$partial = new WP_Customize_Partial( $this->selective_refresh, 'blogname', array(
			'settings' => array( 'blogname' ),
		) );
		$this->assertTrue( $partial->check_capabilities() );

		$partial = new WP_Customize_Partial( $this->selective_refresh, 'blogname', array(
			'settings' => array( 'blogname', 'non_existing' ),
		) );
		$this->assertFalse( $partial->check_capabilities() );

		$this->wp_customize->add_setting( 'top_secret_message', array(
			'capability' => 'top_secret_clearance',
		) );
		$partial = new WP_Customize_Partial( $this->selective_refresh, 'blogname', array(
			'settings' => array( 'blogname', 'top_secret_clearance' ),
		) );
		$this->assertFalse( $partial->check_capabilities() );

		$partial = new WP_Customize_Partial( $this->selective_refresh, 'no_setting', array(
			'settings' => array(),
		) );
		$this->assertTrue( $partial->check_capabilities() );

		$partial = new WP_Customize_Partial( $this->selective_refresh, 'no_setting', array(
			'settings' => array(),
			'capability' => 'top_secret_clearance',
		) );
		$this->assertFalse( $partial->check_capabilities() );

		$partial = new WP_Customize_Partial( $this->selective_refresh, 'no_setting', array(
			'settings' => array(),
			'capability' => 'edit_theme_options',
		) );
		$this->assertTrue( $partial->check_capabilities() );
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
