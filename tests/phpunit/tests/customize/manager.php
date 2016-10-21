<?php
/**
 * WP_Customize_Manager tests.
 *
 * @package WordPress
 */

/**
 * Tests for the WP_Customize_Manager class.
 *
 * @group customize
 */
class Tests_WP_Customize_Manager extends WP_UnitTestCase {

	/**
	 * Customize manager instance re-instantiated with each test.
	 *
	 * @var WP_Customize_Manager
	 */
	public $manager;

	/**
	 * Symbol.
	 *
	 * @var stdClass
	 */
	public $undefined;

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	protected static $admin_user_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	protected static $subscriber_user_id;

	/**
	 * Set up before class.
	 *
	 * @param WP_UnitTest_Factory $factory Factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$subscriber_user_id = $factory->user->create( array( 'role' => 'subscriber' ) );
		self::$admin_user_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Set up test.
	 */
	function setUp() {
		parent::setUp();
		require_once( ABSPATH . WPINC . '/class-wp-customize-manager.php' );
		$this->manager = $this->instantiate();
		$this->undefined = new stdClass();

		// Remove default theme actions that interfere with tests
		remove_action( 'customize_register', 'twentyseventeen_customize_register' );
	}

	/**
	 * Tear down test.
	 */
	function tearDown() {
		$this->manager = null;
		unset( $GLOBALS['wp_customize'] );
		$_REQUEST = array();
		parent::tearDown();
	}

	/**
	 * Get a core theme that is not the same as the current theme.
	 *
	 * @throws Exception If an inactive core Twenty* theme cannot be found.
	 * @return string Theme slug (stylesheet).
	 */
	function get_inactive_core_theme() {
		$stylesheet = get_stylesheet();
		foreach ( wp_get_themes() as $theme ) {
			if ( $theme->stylesheet !== $stylesheet && 0 === strpos( $theme->stylesheet, 'twenty' ) ) {
				return $theme->stylesheet;
			}
		}
		throw new Exception( 'Unable to find inactive twenty* theme.' );
	}

	/**
	 * Instantiate class, set global $wp_customize, and return instance.
	 *
	 * @return WP_Customize_Manager
	 */
	function instantiate() {
		$GLOBALS['wp_customize'] = new WP_Customize_Manager();
		return $GLOBALS['wp_customize'];
	}

	/**
	 * Test WP_Customize_Manager::__construct().
	 *
	 * @covers WP_Customize_Manager::__construct()
	 */
	function test_constructor() {
		$uuid = wp_generate_uuid4();
		$theme = 'twentyfifteen';
		$messenger_channel = 'preview-123';
		$wp_customize = new WP_Customize_Manager( array(
			'changeset_uuid' => $uuid,
			'theme' => $theme,
			'messenger_channel' => $messenger_channel,
		) );
		$this->assertEquals( $uuid, $wp_customize->changeset_uuid() );
		$this->assertEquals( $theme, $wp_customize->get_stylesheet() );
		$this->assertEquals( $messenger_channel, $wp_customize->get_messenger_channel() );

		$theme = 'twentyfourteen';
		$messenger_channel = 'preview-456';
		$_REQUEST['theme'] = $theme;
		$_REQUEST['customize_messenger_channel'] = $messenger_channel;
		$wp_customize = new WP_Customize_Manager( array( 'changeset_uuid' => $uuid ) );
		$this->assertEquals( $theme, $wp_customize->get_stylesheet() );
		$this->assertEquals( $messenger_channel, $wp_customize->get_messenger_channel() );

		$theme = 'twentyfourteen';
		$_REQUEST['customize_theme'] = $theme;
		$wp_customize = new WP_Customize_Manager();
		$this->assertEquals( $theme, $wp_customize->get_stylesheet() );
		$this->assertNotEmpty( $wp_customize->changeset_uuid() );
	}

	/**
	 * Test WP_Customize_Manager::setup_theme() for admin screen.
	 *
	 * @covers WP_Customize_Manager::setup_theme()
	 */
	function test_setup_theme_in_customize_admin() {
		global $pagenow, $wp_customize;
		$pagenow = 'customize.php';
		set_current_screen( 'customize' );

		// Unauthorized.
		$exception = null;
		$wp_customize = new WP_Customize_Manager();
		wp_set_current_user( self::$subscriber_user_id );
		try {
			$wp_customize->setup_theme();
		} catch ( Exception $e ) {
			$exception = $e;
		}
		$this->assertInstanceOf( 'WPDieException', $exception );
		$this->assertContains( 'you are not allowed to customize this site', $exception->getMessage() );

		// Bad changeset.
		$exception = null;
		wp_set_current_user( self::$admin_user_id );
		$wp_customize = new WP_Customize_Manager( array( 'changeset_uuid' => 'bad' ) );
		try {
			$wp_customize->setup_theme();
		} catch ( Exception $e ) {
			$exception = $e;
		}
		$this->assertInstanceOf( 'WPDieException', $exception );
		$this->assertContains( 'Invalid changeset UUID', $exception->getMessage() );

		$wp_customize = new WP_Customize_Manager();
		$wp_customize->setup_theme();
	}

	/**
	 * Test WP_Customize_Manager::setup_theme() for frontend.
	 *
	 * @covers WP_Customize_Manager::setup_theme()
	 */
	function test_setup_theme_in_frontend() {
		global $wp_customize, $pagenow, $show_admin_bar;
		$pagenow = 'front';
		set_current_screen( 'front' );

		wp_set_current_user( 0 );
		$exception = null;
		$wp_customize = new WP_Customize_Manager();
		wp_set_current_user( self::$subscriber_user_id );
		try {
			$wp_customize->setup_theme();
		} catch ( Exception $e ) {
			$exception = $e;
		}
		$this->assertInstanceOf( 'WPDieException', $exception );
		$this->assertContains( 'Non-existent changeset UUID', $exception->getMessage() );

		wp_set_current_user( self::$admin_user_id );
		$wp_customize = new WP_Customize_Manager( array( 'messenger_channel' => 'preview-1' ) );
		$wp_customize->setup_theme();
		$this->assertFalse( $show_admin_bar );

		show_admin_bar( true );
		wp_set_current_user( self::$admin_user_id );
		$wp_customize = new WP_Customize_Manager( array( 'messenger_channel' => null ) );
		$wp_customize->setup_theme();
		$this->assertTrue( $show_admin_bar );
	}

	/**
	 * Test WP_Customize_Manager::changeset_uuid().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::changeset_uuid()
	 */
	function test_changeset_uuid() {
		$uuid = wp_generate_uuid4();
		$wp_customize = new WP_Customize_Manager( array( 'changeset_uuid' => $uuid ) );
		$this->assertEquals( $uuid, $wp_customize->changeset_uuid() );
	}

	/**
	 * Test WP_Customize_Manager::wp_loaded().
	 *
	 * Ensure that post values are previewed even without being in preview.
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::wp_loaded()
	 */
	function test_wp_loaded() {
		wp_set_current_user( self::$admin_user_id );
		$wp_customize = new WP_Customize_Manager();
		$title = 'Hello World';
		$wp_customize->set_post_value( 'blogname', $title );
		$this->assertNotEquals( $title, get_option( 'blogname' ) );
		$wp_customize->wp_loaded();
		$this->assertFalse( $wp_customize->is_preview() );
		$this->assertEquals( $title, $wp_customize->get_setting( 'blogname' )->value() );
		$this->assertEquals( $title, get_option( 'blogname' ) );
	}

	/**
	 * Test WP_Customize_Manager::find_changeset_post_id().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::find_changeset_post_id()
	 */
	function test_find_changeset_post_id() {
		$uuid = wp_generate_uuid4();
		$post_id = $this->factory()->post->create( array(
			'post_name' => $uuid,
			'post_type' => 'customize_changeset',
			'post_status' => 'auto-draft',
			'post_content' => '{}',
		) );

		$wp_customize = new WP_Customize_Manager();
		$this->assertNull( $wp_customize->find_changeset_post_id( wp_generate_uuid4() ) );
		$this->assertEquals( $post_id, $wp_customize->find_changeset_post_id( $uuid ) );
	}

	/**
	 * Test WP_Customize_Manager::changeset_post_id().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::changeset_post_id()
	 */
	function test_changeset_post_id() {
		$uuid = wp_generate_uuid4();
		$wp_customize = new WP_Customize_Manager( array( 'changeset_uuid' => $uuid ) );
		$this->assertNull( $wp_customize->changeset_post_id() );

		$uuid = wp_generate_uuid4();
		$wp_customize = new WP_Customize_Manager( array( 'changeset_uuid' => $uuid ) );
		$post_id = $this->factory()->post->create( array(
			'post_name' => $uuid,
			'post_type' => 'customize_changeset',
			'post_status' => 'auto-draft',
			'post_content' => '{}',
		) );
		$this->assertEquals( $post_id, $wp_customize->changeset_post_id() );
	}

	/**
	 * Test WP_Customize_Manager::changeset_data().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::changeset_data()
	 */
	function test_changeset_data() {
		$uuid = wp_generate_uuid4();
		$wp_customize = new WP_Customize_Manager( array( 'changeset_uuid' => $uuid ) );
		$this->assertEquals( array(), $wp_customize->changeset_data() );

		$uuid = wp_generate_uuid4();
		$data = array( 'blogname' => array( 'value' => 'Hello World' ) );
		$this->factory()->post->create( array(
			'post_name' => $uuid,
			'post_type' => 'customize_changeset',
			'post_status' => 'auto-draft',
			'post_content' => wp_json_encode( $data ),
		) );
		$wp_customize = new WP_Customize_Manager( array( 'changeset_uuid' => $uuid ) );
		$this->assertEquals( $data, $wp_customize->changeset_data() );
	}

	/**
	 * Test WP_Customize_Manager::customize_preview_init().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::customize_preview_init()
	 */
	function test_customize_preview_init() {

		// Test authorized admin user.
		wp_set_current_user( self::$admin_user_id );
		$did_action_customize_preview_init = did_action( 'customize_preview_init' );
		$wp_customize = new WP_Customize_Manager();
		$wp_customize->customize_preview_init();
		$this->assertEquals( $did_action_customize_preview_init + 1, did_action( 'customize_preview_init' ) );

		$this->assertEquals( 10, has_action( 'wp_head', 'wp_no_robots' ) );
		$this->assertEquals( 10, has_filter( 'wp_headers', array( $wp_customize, 'filter_iframe_security_headers' ) ) );
		$this->assertEquals( 10, has_filter( 'wp_redirect', array( $wp_customize, 'add_state_query_params' ) ) );
		$this->assertTrue( wp_script_is( 'customize-preview', 'enqueued' ) );
		$this->assertEquals( 10, has_action( 'wp_head', array( $wp_customize, 'customize_preview_loading_style' ) ) );
		$this->assertEquals( 20, has_action( 'wp_footer', array( $wp_customize, 'customize_preview_settings' ) ) );

		// Test unauthorized user outside preview (no messenger_channel).
		wp_set_current_user( self::$subscriber_user_id );
		$wp_customize = new WP_Customize_Manager();
		$wp_customize->register_controls();
		$this->assertNotEmpty( $wp_customize->controls() );
		$wp_customize->customize_preview_init();
		$this->assertEmpty( $wp_customize->controls() );

		// Test unauthorized user inside preview (with messenger_channel).
		wp_set_current_user( self::$subscriber_user_id );
		$wp_customize = new WP_Customize_Manager( array( 'messenger_channel' => 'preview-0' ) );
		$exception = null;
		try {
			$wp_customize->customize_preview_init();
		} catch ( WPDieException $e ) {
			$exception = $e;
		}
		$this->assertNotNull( $exception );
		$this->assertContains( 'Unauthorized', $exception->getMessage() );
	}

	/**
	 * Test WP_Customize_Manager::filter_iframe_security_headers().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::filter_iframe_security_headers()
	 */
	function test_filter_iframe_security_headers() {
		$customize_url = admin_url( 'customize.php' );
		$wp_customize = new WP_Customize_Manager();
		$headers = $wp_customize->filter_iframe_security_headers( array() );
		$this->assertArrayHasKey( 'X-Frame-Options', $headers );
		$this->assertArrayHasKey( 'Content-Security-Policy', $headers );
		$this->assertEquals( "ALLOW-FROM $customize_url", $headers['X-Frame-Options'] );
	}

	/**
	 * Test WP_Customize_Manager::add_state_query_params().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::add_state_query_params()
	 */
	function test_add_state_query_params() {
		$preview_theme = $this->get_inactive_core_theme();

		$uuid = wp_generate_uuid4();
		$messenger_channel = 'preview-0';
		$wp_customize = new WP_Customize_Manager( array(
			'changeset_uuid' => $uuid,
			'messenger_channel' => $messenger_channel,
		) );
		$url = $wp_customize->add_state_query_params( home_url( '/' ) );
		$parsed_url = wp_parse_url( $url );
		parse_str( $parsed_url['query'], $query_params );
		$this->assertArrayHasKey( 'customize_messenger_channel', $query_params );
		$this->assertArrayHasKey( 'customize_changeset_uuid', $query_params );
		$this->assertArrayNotHasKey( 'customize_theme', $query_params );
		$this->assertEquals( $uuid, $query_params['customize_changeset_uuid'] );
		$this->assertEquals( $messenger_channel, $query_params['customize_messenger_channel'] );

		$uuid = wp_generate_uuid4();
		$wp_customize = new WP_Customize_Manager( array(
			'changeset_uuid' => $uuid,
			'messenger_channel' => null,
			'theme' => $preview_theme,
		) );
		$url = $wp_customize->add_state_query_params( home_url( '/' ) );
		$parsed_url = wp_parse_url( $url );
		parse_str( $parsed_url['query'], $query_params );
		$this->assertArrayNotHasKey( 'customize_messenger_channel', $query_params );
		$this->assertArrayHasKey( 'customize_changeset_uuid', $query_params );
		$this->assertArrayHasKey( 'customize_theme', $query_params );
		$this->assertEquals( $uuid, $query_params['customize_changeset_uuid'] );
		$this->assertEquals( $preview_theme, $query_params['customize_theme'] );

		$uuid = wp_generate_uuid4();
		$wp_customize = new WP_Customize_Manager( array(
			'changeset_uuid' => $uuid,
			'messenger_channel' => null,
			'theme' => $preview_theme,
		) );
		$url = $wp_customize->add_state_query_params( 'http://not-allowed.example.com/?q=1' );
		$parsed_url = wp_parse_url( $url );
		parse_str( $parsed_url['query'], $query_params );
		$this->assertArrayNotHasKey( 'customize_messenger_channel', $query_params );
		$this->assertArrayNotHasKey( 'customize_changeset_uuid', $query_params );
		$this->assertArrayNotHasKey( 'customize_theme', $query_params );
	}

	/**
	 * Test WP_Customize_Manager::save_changeset_post().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::save_changeset_post()
	 */
	function test_save_changeset_post_without_theme_activation() {
		wp_set_current_user( self::$admin_user_id );

		$did_action = array(
			'customize_save_validation_before' => did_action( 'customize_save_validation_before' ),
			'customize_save' => did_action( 'customize_save' ),
			'customize_save_after' => did_action( 'customize_save_after' ),
		);
		$uuid = wp_generate_uuid4();

		$manager = new WP_Customize_Manager( array(
			'changeset_uuid' => $uuid,
		) );
		$manager->register_controls();
		$manager->set_post_value( 'blogname', 'Changeset Title' );
		$manager->set_post_value( 'blogdescription', 'Changeset Tagline' );

		$r = $manager->save_changeset_post( array(
			'status' => 'auto-draft',
			'title' => 'Auto Draft',
			'date_gmt' => '2010-01-01 00:00:00',
			'data' => array(
				'blogname' => array(
					'value' => 'Overridden Changeset Title',
				),
				'blogdescription' => array(
					'custom' => 'something',
				),
			),
		) );
		$this->assertInternalType( 'array', $r );

		$this->assertEquals( $did_action['customize_save_validation_before'] + 1, did_action( 'customize_save_validation_before' ) );

		$post_id = $manager->find_changeset_post_id( $uuid );
		$this->assertNotNull( $post_id );
		$saved_data = json_decode( get_post( $post_id )->post_content, true );
		$this->assertEquals( $manager->unsanitized_post_values(), wp_list_pluck( $saved_data, 'value' ) );
		$this->assertEquals( 'Overridden Changeset Title', $saved_data['blogname']['value'] );
		$this->assertEquals( 'something', $saved_data['blogdescription']['custom'] );
		$this->assertEquals( 'Auto Draft', get_post( $post_id )->post_title );
		$this->assertEquals( 'auto-draft', get_post( $post_id )->post_status );
		$this->assertEquals( '2010-01-01 00:00:00', get_post( $post_id )->post_date_gmt );
		$this->assertNotEquals( 'Changeset Title', get_option( 'blogname' ) );
		$this->assertArrayHasKey( 'setting_validities', $r );

		// Test saving with invalid settings, ensuring transaction blocked.
		$previous_saved_data = $saved_data;
		$manager->add_setting( 'foo_unauthorized', array(
			'capability' => 'do_not_allow',
		) );
		$manager->add_setting( 'baz_illegal', array(
			'validate_callback' => array( $this, 'return_illegal_error' ),
		) );
		$r = $manager->save_changeset_post( array(
			'status' => 'auto-draft',
			'data' => array(
				'blogname' => array(
					'value' => 'OK',
				),
				'foo_unauthorized' => array(
					'value' => 'No',
				),
				'bar_unknown' => array(
					'value' => 'No',
				),
				'baz_illegal' => array(
					'value' => 'No',
				),
			),
		) );
		$this->assertInstanceOf( 'WP_Error', $r );
		$this->assertEquals( 'transaction_fail', $r->get_error_code() );
		$this->assertInternalType( 'array', $r->get_error_data() );
		$this->assertArrayHasKey( 'setting_validities', $r->get_error_data() );
		$error_data = $r->get_error_data();
		$this->assertArrayHasKey( 'blogname', $error_data['setting_validities'] );
		$this->assertTrue( $error_data['setting_validities']['blogname'] );
		$this->assertArrayHasKey( 'foo_unauthorized', $error_data['setting_validities'] );
		$this->assertInstanceOf( 'WP_Error', $error_data['setting_validities']['foo_unauthorized'] );
		$this->assertEquals( 'unauthorized', $error_data['setting_validities']['foo_unauthorized']->get_error_code() );
		$this->assertArrayHasKey( 'bar_unknown', $error_data['setting_validities'] );
		$this->assertInstanceOf( 'WP_Error', $error_data['setting_validities']['bar_unknown'] );
		$this->assertEquals( 'unrecognized', $error_data['setting_validities']['bar_unknown']->get_error_code() );
		$this->assertArrayHasKey( 'baz_illegal', $error_data['setting_validities'] );
		$this->assertInstanceOf( 'WP_Error', $error_data['setting_validities']['baz_illegal'] );
		$this->assertEquals( 'illegal', $error_data['setting_validities']['baz_illegal']->get_error_code() );

		// Since transactional, ensure no changes have been made.
		$this->assertEquals( $previous_saved_data, json_decode( get_post( $post_id )->post_content, true ) );

		// Attempt a non-transactional/incremental update.
		$manager = new WP_Customize_Manager( array(
			'changeset_uuid' => $uuid,
		) );
		$manager->register_controls(); // That is, register settings.
		$r = $manager->save_changeset_post( array(
			'status' => null,
			'data' => array(
				'blogname' => array(
					'value' => 'Non-Transactional \o/ <script>unsanitized</script>',
				),
				'bar_unknown' => array(
					'value' => 'No',
				),
			),
		) );
		$this->assertInternalType( 'array', $r );
		$this->assertArrayHasKey( 'setting_validities', $r );
		$this->assertTrue( $r['setting_validities']['blogname'] );
		$this->assertInstanceOf( 'WP_Error', $r['setting_validities']['bar_unknown'] );
		$saved_data = json_decode( get_post( $post_id )->post_content, true );
		$this->assertNotEquals( $previous_saved_data, $saved_data );
		$this->assertEquals( 'Non-Transactional \o/ <script>unsanitized</script>', $saved_data['blogname']['value'] );

		// Ensure the filter applies.
		$customize_changeset_save_data_call_count = $this->customize_changeset_save_data_call_count;
		add_filter( 'customize_changeset_save_data', array( $this, 'filter_customize_changeset_save_data' ), 10, 2 );
		$manager->save_changeset_post( array(
			'status' => null,
			'data' => array(
				'blogname' => array(
					'value' => 'Filtered',
				),
			),
		) );
		$this->assertEquals( $customize_changeset_save_data_call_count + 1, $this->customize_changeset_save_data_call_count );

		// Publish the changeset.
		$manager = new WP_Customize_Manager( array( 'changeset_uuid' => $uuid ) );
		$manager->register_controls();
		$GLOBALS['wp_customize'] = $manager;
		$r = $manager->save_changeset_post( array(
			'status' => 'publish',
			'data' => array(
				'blogname' => array(
					'value' => 'Do it live \o/',
				),
			),
		) );
		$this->assertInternalType( 'array', $r );
		$this->assertEquals( 'Do it live \o/', get_option( 'blogname' ) );
		$this->assertEquals( 'trash', get_post_status( $post_id ) ); // Auto-trashed.

		// Test revisions.
		add_post_type_support( 'customize_changeset', 'revisions' );
		$uuid = wp_generate_uuid4();
		$manager = new WP_Customize_Manager( array( 'changeset_uuid' => $uuid ) );
		$manager->register_controls();
		$GLOBALS['wp_customize'] = $manager;

		$manager->set_post_value( 'blogname', 'Hello Surface' );
		$manager->save_changeset_post( array( 'status' => 'auto-draft' ) );

		$manager->set_post_value( 'blogname', 'Hello World' );
		$manager->save_changeset_post( array( 'status' => 'draft' ) );
		$this->assertTrue( wp_revisions_enabled( get_post( $manager->changeset_post_id() ) ) );

		$manager->set_post_value( 'blogname', 'Hello Solar System' );
		$manager->save_changeset_post( array( 'status' => 'draft' ) );

		$manager->set_post_value( 'blogname', 'Hello Galaxy' );
		$manager->save_changeset_post( array( 'status' => 'draft' ) );
		$this->assertCount( 3, wp_get_post_revisions( $manager->changeset_post_id() ) );
	}

	/**
	 * Call count for customize_changeset_save_data filter.
	 *
	 * @var int
	 */
	protected $customize_changeset_save_data_call_count = 0;

	/**
	 * Filter customize_changeset_save_data.
	 *
	 * @param array $data    Data.
	 * @param array $context Context.
	 * @returns array Data.
	 */
	function filter_customize_changeset_save_data( $data, $context ) {
		$this->customize_changeset_save_data_call_count += 1;
		$this->assertInternalType( 'array', $data );
		$this->assertInternalType( 'array', $context );
		$this->assertArrayHasKey( 'uuid', $context );
		$this->assertArrayHasKey( 'title', $context );
		$this->assertArrayHasKey( 'status', $context );
		$this->assertArrayHasKey( 'date_gmt', $context );
		$this->assertArrayHasKey( 'post_id', $context );
		$this->assertArrayHasKey( 'previous_data', $context );
		$this->assertArrayHasKey( 'manager', $context );
		return $data;
	}

	/**
	 * Return illegal error.
	 *
	 * @return WP_Error Error.
	 */
	function return_illegal_error() {
		return new WP_Error( 'illegal' );
	}

	/**
	 * Test WP_Customize_Manager::save_changeset_post().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::save_changeset_post()
	 * @covers WP_Customize_Manager::update_stashed_theme_mod_settings()
	 */
	function test_save_changeset_post_with_theme_activation() {
		wp_set_current_user( self::$admin_user_id );

		$preview_theme = $this->get_inactive_core_theme();
		$stashed_theme_mods = array(
			$preview_theme => array(
				'background_color' => array(
					'value' => '#123456',
				),
			),
		);
		update_option( 'customize_stashed_theme_mods', $stashed_theme_mods );
		$uuid = wp_generate_uuid4();
		$manager = new WP_Customize_Manager( array(
			'changeset_uuid' => $uuid,
			'theme' => $preview_theme,
		) );
		$manager->register_controls();
		$GLOBALS['wp_customize'] = $manager;

		$manager->set_post_value( 'blogname', 'Hello Preview Theme' );
		$post_values = $manager->unsanitized_post_values();
		$manager->save_changeset_post( array( 'status' => 'publish' ) ); // Activate.

		$this->assertEquals( '#123456', $post_values['background_color'] );
		$this->assertEquals( $preview_theme, get_stylesheet() );
		$this->assertEquals( 'Hello Preview Theme', get_option( 'blogname' ) );
	}

	/**
	 * Test WP_Customize_Manager::is_cross_domain().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::is_cross_domain()
	 */
	function test_is_cross_domain() {
		$wp_customize = new WP_Customize_Manager();

		update_option( 'home', 'http://example.com' );
		update_option( 'siteurl', 'http://example.com' );
		$this->assertFalse( $wp_customize->is_cross_domain() );

		update_option( 'home', 'http://example.com' );
		update_option( 'siteurl', 'https://admin.example.com' );
		$this->assertTrue( $wp_customize->is_cross_domain() );
	}

	/**
	 * Test WP_Customize_Manager::get_allowed_urls().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::get_allowed_urls()
	 */
	function test_get_allowed_urls() {
		$wp_customize = new WP_Customize_Manager();
		$this->assertFalse( is_ssl() );
		$this->assertFalse( $wp_customize->is_cross_domain() );
		$allowed = $wp_customize->get_allowed_urls();
		$this->assertEquals( $allowed, array( home_url( '/', 'http' ) ) );

		add_filter( 'customize_allowed_urls', array( $this, 'filter_customize_allowed_urls' ) );
		$allowed = $wp_customize->get_allowed_urls();
		$this->assertEqualSets( $allowed, array( 'http://headless.example.com/', home_url( '/', 'http' ) ) );
	}

	/**
	 * Callback for customize_allowed_urls filter.
	 *
	 * @param array $urls URLs.
	 * @return array URLs.
	 */
	function filter_customize_allowed_urls( $urls ) {
		$urls[] = 'http://headless.example.com/';
		return $urls;
	}

	/**
	 * Test WP_Customize_Manager::doing_ajax().
	 *
	 * @group ajax
	 */
	function test_doing_ajax() {
		if ( ! defined( 'DOING_AJAX' ) ) {
			define( 'DOING_AJAX', true );
		}

		$manager = $this->manager;
		$this->assertTrue( $manager->doing_ajax() );

		$_REQUEST['action'] = 'customize_save';
		$this->assertTrue( $manager->doing_ajax( 'customize_save' ) );
		$this->assertFalse( $manager->doing_ajax( 'update-widget' ) );
	}

	/**
	 * Test ! WP_Customize_Manager::doing_ajax().
	 */
	function test_not_doing_ajax() {
		if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
			$this->markTestSkipped( 'Cannot test when DOING_AJAX' );
		}

		$manager = $this->manager;
		$this->assertFalse( $manager->doing_ajax() );
	}

	/**
	 * Test WP_Customize_Manager::unsanitized_post_values().
	 *
	 * @ticket 30988
	 */
	function test_unsanitized_post_values_from_input() {
		wp_set_current_user( self::$admin_user_id );
		$manager = $this->manager;

		$customized = array(
			'foo' => 'bar',
			'baz[quux]' => 123,
		);
		$_POST['customized'] = wp_slash( wp_json_encode( $customized ) );
		$post_values = $manager->unsanitized_post_values();
		$this->assertEquals( $customized, $post_values );
		$this->assertEmpty( $manager->unsanitized_post_values( array( 'exclude_post_data' => true ) ) );

		$manager->set_post_value( 'foo', 'BAR' );
		$post_values = $manager->unsanitized_post_values();
		$this->assertEquals( 'BAR', $post_values['foo'] );
		$this->assertEmpty( $manager->unsanitized_post_values( array( 'exclude_post_data' => true ) ) );

		// If user is unprivileged, the post data is ignored.
		wp_set_current_user( 0 );
		$this->assertEmpty( $manager->unsanitized_post_values() );
	}

	/**
	 * Test WP_Customize_Manager::unsanitized_post_values().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::unsanitized_post_values()
	 */
	function test_unsanitized_post_values_with_changeset_and_stashed_theme_mods() {
		wp_set_current_user( self::$admin_user_id );

		$preview_theme = $this->get_inactive_core_theme();
		$stashed_theme_mods = array(
			$preview_theme => array(
				'background_color' => array(
					'value' => '#000000',
				),
			),
		);
		$stashed_theme_mods[ get_stylesheet() ] = array(
			'background_color' => array(
				'value' => '#FFFFFF',
			),
		);
		update_option( 'customize_stashed_theme_mods', $stashed_theme_mods );

		$post_values = array(
			'blogdescription' => 'Post Input Tagline',
		);
		$_POST['customized'] = wp_slash( wp_json_encode( $post_values ) );

		$uuid = wp_generate_uuid4();
		$changeset_data = array(
			'blogname' => array(
				'value' => 'Changeset Title',
			),
			'blogdescription' => array(
				'value' => 'Changeset Tagline',
			),
		);
		$this->factory()->post->create( array(
			'post_type' => 'customize_changeset',
			'post_status' => 'auto-draft',
			'post_name' => $uuid,
			'post_content' => wp_json_encode( $changeset_data ),
		) );

		$manager = new WP_Customize_Manager( array(
			'changeset_uuid' => $uuid,
		) );
		$this->assertTrue( $manager->is_theme_active() );

		$this->assertArrayNotHasKey( 'background_color', $manager->unsanitized_post_values() );

		$this->assertEquals(
			array(
				'blogname' => 'Changeset Title',
				'blogdescription' => 'Post Input Tagline',
			),
			$manager->unsanitized_post_values()
		);
		$this->assertEquals(
			array(
				'blogdescription' => 'Post Input Tagline',
			),
			$manager->unsanitized_post_values( array( 'exclude_changeset' => true ) )
		);

		$manager->set_post_value( 'blogdescription', 'Post Override Tagline' );
		$this->assertEquals(
			array(
				'blogname' => 'Changeset Title',
				'blogdescription' => 'Post Override Tagline',
			),
			$manager->unsanitized_post_values()
		);

		$this->assertEquals(
			array(
				'blogname' => 'Changeset Title',
				'blogdescription' => 'Changeset Tagline',
			),
			$manager->unsanitized_post_values( array( 'exclude_post_data' => true ) )
		);

		$this->assertEmpty( $manager->unsanitized_post_values( array( 'exclude_post_data' => true, 'exclude_changeset' => true ) ) );

		// Test unstashing theme mods.
		$manager = new WP_Customize_Manager( array(
			'changeset_uuid' => $uuid,
			'theme' => $preview_theme,
		) );
		$this->assertFalse( $manager->is_theme_active() );
		$values = $manager->unsanitized_post_values( array( 'exclude_post_data' => true, 'exclude_changeset' => true ) );
		$this->assertNotEmpty( $values );
		$this->assertArrayHasKey( 'background_color', $values );
		$this->assertEquals( '#000000', $values['background_color'] );

		$values = $manager->unsanitized_post_values( array( 'exclude_post_data' => false, 'exclude_changeset' => false ) );
		$this->assertArrayHasKey( 'background_color', $values );
		$this->assertArrayHasKey( 'blogname', $values );
		$this->assertArrayHasKey( 'blogdescription', $values );
	}

	/**
	 * Test the WP_Customize_Manager::post_value() method.
	 *
	 * @ticket 30988
	 */
	function test_post_value() {
		wp_set_current_user( self::$admin_user_id );
		$posted_settings = array(
			'foo' => 'OOF',
		);
		$_POST['customized'] = wp_slash( wp_json_encode( $posted_settings ) );

		$manager = $this->manager;

		$manager->add_setting( 'foo', array( 'default' => 'foo_default' ) );
		$foo_setting = $manager->get_setting( 'foo' );
		$this->assertEquals( 'foo_default', $manager->get_setting( 'foo' )->value(), 'Expected non-previewed setting to return default when value() method called.' );
		$this->assertEquals( $posted_settings['foo'], $manager->post_value( $foo_setting, 'post_value_foo_default' ), 'Expected post_value($foo_setting) to return value supplied in $_POST[customized][foo]' );

		$manager->add_setting( 'bar', array( 'default' => 'bar_default' ) );
		$bar_setting = $manager->get_setting( 'bar' );
		$this->assertEquals( 'post_value_bar_default', $manager->post_value( $bar_setting, 'post_value_bar_default' ), 'Expected post_value($bar_setting, $default) to return $default since no value supplied in $_POST[customized][bar]' );
	}

	/**
	 * Test the WP_Customize_Manager::post_value() method for a setting value that fails validation.
	 *
	 * @ticket 34893
	 */
	function test_invalid_post_value() {
		wp_set_current_user( self::$admin_user_id );
		$default_value = 'foo_default';
		$setting = $this->manager->add_setting( 'foo', array(
			'validate_callback' => array( $this, 'filter_customize_validate_foo' ),
			'sanitize_callback' => array( $this, 'filter_customize_sanitize_foo' ),
		) );
		$this->assertEquals( $default_value, $this->manager->post_value( $setting, $default_value ) );
		$this->assertEquals( $default_value, $setting->post_value( $default_value ) );

		$post_value = 'bar';
		$this->manager->set_post_value( 'foo', $post_value );
		$this->assertEquals( strtoupper( $post_value ), $this->manager->post_value( $setting, $default_value ) );
		$this->assertEquals( strtoupper( $post_value ), $setting->post_value( $default_value ) );

		$this->manager->set_post_value( 'foo', 'return_wp_error_in_sanitize' );
		$this->assertEquals( $default_value, $this->manager->post_value( $setting, $default_value ) );
		$this->assertEquals( $default_value, $setting->post_value( $default_value ) );

		$this->manager->set_post_value( 'foo', 'return_null_in_sanitize' );
		$this->assertEquals( $default_value, $this->manager->post_value( $setting, $default_value ) );
		$this->assertEquals( $default_value, $setting->post_value( $default_value ) );

		$post_value = '<script>evil</script>';
		$this->manager->set_post_value( 'foo', $post_value );
		$this->assertEquals( $default_value, $this->manager->post_value( $setting, $default_value ) );
		$this->assertEquals( $default_value, $setting->post_value( $default_value ) );
	}

	/**
	 * Filter customize_validate callback.
	 *
	 * @param mixed $value Value.
	 * @return string|WP_Error
	 */
	function filter_customize_sanitize_foo( $value ) {
		if ( 'return_null_in_sanitize' === $value ) {
			$value = null;
		} elseif ( is_string( $value ) ) {
			$value = strtoupper( $value );
			if ( false !== stripos( $value, 'return_wp_error_in_sanitize' ) ) {
				$value = new WP_Error( 'invalid_value_in_sanitize', __( 'Invalid value.' ), array( 'source' => 'filter_customize_sanitize_foo' ) );
			}
		}
		return $value;
	}

	/**
	 * Filter customize_validate callback.
	 *
	 * @param WP_Error $validity Validity.
	 * @param mixed    $value    Value.
	 * @return WP_Error
	 */
	function filter_customize_validate_foo( $validity, $value ) {
		if ( false !== stripos( $value, '<script' ) ) {
			$validity->add( 'invalid_value_in_validate', __( 'Invalid value.' ), array( 'source' => 'filter_customize_validate_foo' ) );
		}
		return $validity;
	}

	/**
	 * Test the WP_Customize_Manager::post_value() method to make sure that the validation and sanitization are done in the right order.
	 *
	 * @ticket 37247
	 */
	function test_post_value_validation_sanitization_order() {
		wp_set_current_user( self::$admin_user_id );
		$default_value = '0';
		$setting = $this->manager->add_setting( 'numeric', array(
			'validate_callback' => array( $this, 'filter_customize_validate_numeric' ),
			'sanitize_callback' => array( $this, 'filter_customize_sanitize_numeric' ),
		) );
		$this->assertEquals( $default_value, $this->manager->post_value( $setting, $default_value ) );
		$this->assertEquals( $default_value, $setting->post_value( $default_value ) );

		$post_value = '42';
		$this->manager->set_post_value( 'numeric', $post_value );
		$this->assertEquals( $post_value, $this->manager->post_value( $setting, $default_value ) );
		$this->assertEquals( $post_value, $setting->post_value( $default_value ) );
	}

	/**
	 * Filter customize_validate callback for a numeric value.
	 *
	 * @param mixed $value Value.
	 * @return string|WP_Error
	 */
	function filter_customize_sanitize_numeric( $value ) {
		return absint( $value );
	}

	/**
	 * Filter customize_validate callback for a numeric value.
	 *
	 * @param WP_Error $validity Validity.
	 * @param mixed    $value    Value.
	 * @return WP_Error
	 */
	function filter_customize_validate_numeric( $validity, $value ) {
		if ( ! is_string( $value ) || ! is_numeric( $value ) ) {
			$validity->add( 'invalid_value_in_validate', __( 'Invalid value.' ), array( 'source' => 'filter_customize_validate_numeric' ) );
		}
		return $validity;
	}

	/**
	 * Test WP_Customize_Manager::validate_setting_values().
	 *
	 * @see WP_Customize_Manager::validate_setting_values()
	 */
	function test_validate_setting_values() {
		wp_set_current_user( self::$admin_user_id );
		$setting = $this->manager->add_setting( 'foo', array(
			'validate_callback' => array( $this, 'filter_customize_validate_foo' ),
			'sanitize_callback' => array( $this, 'filter_customize_sanitize_foo' ),
		) );

		$post_value = 'bar';
		$this->manager->set_post_value( 'foo', $post_value );
		$validities = $this->manager->validate_setting_values( $this->manager->unsanitized_post_values() );
		$this->assertCount( 1, $validities );
		$this->assertEquals( array( 'foo' => true ), $validities );

		$this->manager->set_post_value( 'foo', 'return_wp_error_in_sanitize' );
		$invalid_settings = $this->manager->validate_setting_values( $this->manager->unsanitized_post_values() );
		$this->assertCount( 1, $invalid_settings );
		$this->assertArrayHasKey( $setting->id, $invalid_settings );
		$this->assertInstanceOf( 'WP_Error', $invalid_settings[ $setting->id ] );
		$error = $invalid_settings[ $setting->id ];
		$this->assertEquals( 'invalid_value_in_sanitize', $error->get_error_code() );
		$this->assertEquals( array( 'source' => 'filter_customize_sanitize_foo' ), $error->get_error_data() );

		$this->manager->set_post_value( 'foo', 'return_null_in_sanitize' );
		$invalid_settings = $this->manager->validate_setting_values( $this->manager->unsanitized_post_values() );
		$this->assertCount( 1, $invalid_settings );
		$this->assertArrayHasKey( $setting->id, $invalid_settings );
		$this->assertInstanceOf( 'WP_Error', $invalid_settings[ $setting->id ] );
		$this->assertNull( $invalid_settings[ $setting->id ]->get_error_data() );

		$post_value = '<script>evil</script>';
		$this->manager->set_post_value( 'foo', $post_value );
		$invalid_settings = $this->manager->validate_setting_values( $this->manager->unsanitized_post_values() );
		$this->assertCount( 1, $invalid_settings );
		$this->assertArrayHasKey( $setting->id, $invalid_settings );
		$this->assertInstanceOf( 'WP_Error', $invalid_settings[ $setting->id ] );
		$error = $invalid_settings[ $setting->id ];
		$this->assertEquals( 'invalid_value_in_validate', $error->get_error_code() );
		$this->assertEquals( array( 'source' => 'filter_customize_validate_foo' ), $error->get_error_data() );
	}

	/**
	 * Test WP_Customize_Manager::validate_setting_values().
	 *
	 * @ticket 37638
	 * @covers WP_Customize_Manager::validate_setting_values()
	 */
	function test_late_validate_setting_values() {
		$setting = new Test_Setting_Without_Applying_Validate_Filter( $this->manager, 'required' );
		$this->manager->add_setting( $setting );

		$this->assertInstanceOf( 'WP_Error', $setting->validate( '' ) );
		$setting_validities = $this->manager->validate_setting_values( array( $setting->id => '' ) );
		$this->assertInstanceOf( 'WP_Error', $setting_validities[ $setting->id ] );

		$this->assertTrue( $setting->validate( 'ok' ) );
		$setting_validities = $this->manager->validate_setting_values( array( $setting->id => 'ok' ) );
		$this->assertTrue( $setting_validities[ $setting->id ] );

		add_filter( "customize_validate_{$setting->id}", array( $this, 'late_validate_length' ), 10, 3 );
		$this->assertTrue( $setting->validate( 'bad' ) );
		$setting_validities = $this->manager->validate_setting_values( array( $setting->id => 'bad' ) );
		$validity = $setting_validities[ $setting->id ];
		$this->assertInstanceOf( 'WP_Error', $validity );
		$this->assertEquals( 'minlength', $validity->get_error_code() );
	}

	/**
	 * Test WP_Customize_Manager::validate_setting_values().
	 *
	 * @ticket 30937
	 * @covers WP_Customize_Manager::validate_setting_values()
	 */
	function test_validate_setting_values_args() {
		wp_set_current_user( self::$admin_user_id );
		$this->manager->register_controls();

		$validities = $this->manager->validate_setting_values( array( 'unknown' => 'X' ) );
		$this->assertEmpty( $validities );

		$validities = $this->manager->validate_setting_values( array( 'unknown' => 'X' ), array( 'validate_existence' => false ) );
		$this->assertEmpty( $validities );

		$validities = $this->manager->validate_setting_values( array( 'unknown' => 'X' ), array( 'validate_existence' => true ) );
		$this->assertNotEmpty( $validities );
		$this->assertArrayHasKey( 'unknown', $validities );
		$error = $validities['unknown'];
		$this->assertInstanceOf( 'WP_Error', $error );
		$this->assertEquals( 'unrecognized', $error->get_error_code() );

		$this->manager->get_setting( 'blogname' )->capability = 'do_not_allow';
		$validities = $this->manager->validate_setting_values( array( 'blogname' => 'X' ), array( 'validate_capability' => false ) );
		$this->assertArrayHasKey( 'blogname', $validities );
		$this->assertTrue( $validities['blogname'] );
		$validities = $this->manager->validate_setting_values( array( 'blogname' => 'X' ), array( 'validate_capability' => true ) );
		$this->assertArrayHasKey( 'blogname', $validities );
		$error = $validities['blogname'];
		$this->assertInstanceOf( 'WP_Error', $error );
		$this->assertEquals( 'unauthorized', $error->get_error_code() );
	}

	/**
	 * Add a length constraint to a setting.
	 *
	 * Adds minimum-length error code if the length is less than 10.
	 *
	 * @param WP_Error             $validity Validity.
	 * @param mixed                $value    Value.
	 * @param WP_Customize_Setting $setting  Setting.
	 * @return WP_Error Validity.
	 */
	function late_validate_length( $validity, $value, $setting ) {
		$this->assertInstanceOf( 'WP_Customize_Setting', $setting );
		if ( strlen( $value ) < 10 ) {
			$validity->add( 'minlength', '' );
		}
		return $validity;
	}

	/**
	 * Test the WP_Customize_Manager::validate_setting_values() method to make sure that the validation and sanitization are done in the right order.
	 *
	 * @ticket 37247
	 */
	function test_validate_setting_values_validation_sanitization_order() {
		wp_set_current_user( self::$admin_user_id );
		$setting = $this->manager->add_setting( 'numeric', array(
			'validate_callback' => array( $this, 'filter_customize_validate_numeric' ),
			'sanitize_callback' => array( $this, 'filter_customize_sanitize_numeric' ),
		) );
		$post_value = '42';
		$this->manager->set_post_value( 'numeric', $post_value );
		$validities = $this->manager->validate_setting_values( $this->manager->unsanitized_post_values() );
		$this->assertCount( 1, $validities );
		$this->assertEquals( array( 'numeric' => true ), $validities );
	}

	/**
	 * Test WP_Customize_Manager::prepare_setting_validity_for_js().
	 *
	 * @see WP_Customize_Manager::prepare_setting_validity_for_js()
	 */
	function test_prepare_setting_validity_for_js() {
		$this->assertTrue( $this->manager->prepare_setting_validity_for_js( true ) );
		$error = new WP_Error();
		$error->add( 'bad_letter', 'Bad letter', 'A' );
		$error->add( 'bad_letter', 'Bad letra', 123 );
		$error->add( 'bad_number', 'Bad number', array( 'number' => 123 ) );
		$validity = $this->manager->prepare_setting_validity_for_js( $error );
		$this->assertInternalType( 'array', $validity );
		foreach ( $error->errors as $code => $messages ) {
			$this->assertArrayHasKey( $code, $validity );
			$this->assertInternalType( 'array', $validity[ $code ] );
			$this->assertEquals( join( ' ', $messages ), $validity[ $code ]['message'] );
			$this->assertArrayHasKey( 'data', $validity[ $code ] );
			$this->assertEquals( $validity[ $code ]['data'], $error->get_error_data( $code ) );
		}
		$this->assertArrayHasKey( 'number', $validity['bad_number']['data'] );
		$this->assertEquals( 123, $validity['bad_number']['data']['number'] );
	}

	/**
	 * Test WP_Customize_Manager::set_post_value().
	 *
	 * @see WP_Customize_Manager::set_post_value()
	 */
	function test_set_post_value() {
		wp_set_current_user( self::$admin_user_id );
		$this->manager->add_setting( 'foo', array(
			'sanitize_callback' => array( $this, 'sanitize_foo_for_test_set_post_value' ),
		) );
		$setting = $this->manager->get_setting( 'foo' );

		$this->assertEmpty( $this->captured_customize_post_value_set_actions );
		add_action( 'customize_post_value_set', array( $this, 'capture_customize_post_value_set_actions' ), 10, 3 );
		add_action( 'customize_post_value_set_foo', array( $this, 'capture_customize_post_value_set_actions' ), 10, 2 );
		$this->manager->set_post_value( $setting->id, '123abc' );
		$this->assertCount( 2, $this->captured_customize_post_value_set_actions );
		$this->assertEquals( 'customize_post_value_set_foo', $this->captured_customize_post_value_set_actions[0]['action'] );
		$this->assertEquals( 'customize_post_value_set', $this->captured_customize_post_value_set_actions[1]['action'] );
		$this->assertEquals( array( '123abc', $this->manager ), $this->captured_customize_post_value_set_actions[0]['args'] );
		$this->assertEquals( array( $setting->id, '123abc', $this->manager ), $this->captured_customize_post_value_set_actions[1]['args'] );

		$unsanitized = $this->manager->unsanitized_post_values();
		$this->assertArrayHasKey( $setting->id, $unsanitized );

		$this->assertEquals( '123abc', $unsanitized[ $setting->id ] );
		$this->assertEquals( 123, $setting->post_value() );
	}

	/**
	 * Sanitize a value for Tests_WP_Customize_Manager::test_set_post_value().
	 *
	 * @see Tests_WP_Customize_Manager::test_set_post_value()
	 *
	 * @param mixed $value Value.
	 * @return int Value.
	 */
	function sanitize_foo_for_test_set_post_value( $value ) {
		return intval( $value );
	}

	/**
	 * Store data coming from customize_post_value_set action calls.
	 *
	 * @see Tests_WP_Customize_Manager::capture_customize_post_value_set_actions()
	 * @var array
	 */
	protected $captured_customize_post_value_set_actions = array();

	/**
	 * Capture the actions fired when calling WP_Customize_Manager::set_post_value().
	 *
	 * @see Tests_WP_Customize_Manager::test_set_post_value()
	 */
	function capture_customize_post_value_set_actions() {
		$action = current_action();
		$args = func_get_args();
		$this->captured_customize_post_value_set_actions[] = compact( 'action', 'args' );
	}

	/**
	 * Test the WP_Customize_Manager::add_dynamic_settings() method.
	 *
	 * @ticket 30936
	 */
	function test_add_dynamic_settings() {
		$manager = $this->manager;
		$setting_ids = array( 'foo', 'bar' );
		$manager->add_setting( 'foo', array( 'default' => 'foo_default' ) );
		$this->assertEmpty( $manager->get_setting( 'bar' ), 'Expected there to not be a bar setting up front.' );
		$manager->add_dynamic_settings( $setting_ids );
		$this->assertEmpty( $manager->get_setting( 'bar' ), 'Expected the bar setting to remain absent since filters not added.' );

		$this->action_customize_register_for_dynamic_settings();
		$manager->add_dynamic_settings( $setting_ids );
		$this->assertNotEmpty( $manager->get_setting( 'bar' ), 'Expected bar setting to be created since filters were added.' );
		$this->assertEquals( 'foo_default', $manager->get_setting( 'foo' )->default, 'Expected static foo setting to not get overridden by dynamic setting.' );
		$this->assertEquals( 'dynamic_bar_default', $manager->get_setting( 'bar' )->default, 'Expected dynamic setting bar to have default providd by filter.' );
	}

	/**
	 * Test WP_Customize_Manager::has_published_pages().
	 *
	 * @ticket 38013
	 * @covers WP_Customize_Manager::has_published_pages()
	 */
	function test_has_published_pages() {
		foreach ( get_pages() as $page ) {
			wp_delete_post( $page->ID, true );
		}
		$this->assertFalse( $this->manager->has_published_pages() );

		$this->factory()->post->create( array( 'post_type' => 'page', 'post_status' => 'private' ) );
		$this->assertFalse( $this->manager->has_published_pages() );

		$this->factory()->post->create( array( 'post_type' => 'page', 'post_status' => 'publish' ) );
		$this->assertTrue( $this->manager->has_published_pages() );
	}

	/**
	 * Ensure that page stubs created via nav menus will cause has_published_pages to return true.
	 *
	 * @ticket 38013
	 * @covers WP_Customize_Manager::has_published_pages()
	 */
	function test_has_published_pages_when_nav_menus_created_posts() {
		foreach ( get_pages() as $page ) {
			wp_delete_post( $page->ID, true );
		}
		$this->assertFalse( $this->manager->has_published_pages() );

		wp_set_current_user( self::$admin_user_id );
		$this->manager->nav_menus->customize_register();
		$setting_id = 'nav_menus_created_posts';
		$setting = $this->manager->get_setting( $setting_id );
		$this->assertInstanceOf( 'WP_Customize_Filter_Setting', $setting );
		$auto_draft_page = $this->factory()->post->create( array( 'post_type' => 'page', 'post_status' => 'auto-draft' ) );
		$this->manager->set_post_value( $setting_id, array( $auto_draft_page ) );
		$setting->preview();
		$this->assertTrue( $this->manager->has_published_pages() );
	}

	/**
	 * Test the WP_Customize_Manager::register_dynamic_settings() method.
	 *
	 * This is similar to test_add_dynamic_settings, except the settings are passed via $_POST['customized'].
	 *
	 * @ticket 30936
	 */
	function test_register_dynamic_settings() {
		wp_set_current_user( self::$admin_user_id );
		$posted_settings = array(
			'foo' => 'OOF',
			'bar' => 'RAB',
		);
		$_POST['customized'] = wp_slash( wp_json_encode( $posted_settings ) );

		add_action( 'customize_register', array( $this, 'action_customize_register_for_dynamic_settings' ) );

		$manager = $this->manager;
		$manager->add_setting( 'foo', array( 'default' => 'foo_default' ) );

		$this->assertEmpty( $manager->get_setting( 'bar' ), 'Expected dynamic setting "bar" to not be registered.' );
		do_action( 'customize_register', $manager );
		$this->assertNotEmpty( $manager->get_setting( 'bar' ), 'Expected dynamic setting "bar" to be automatically registered after customize_register action.' );
		$this->assertEmpty( $manager->get_setting( 'baz' ), 'Expected unrecognized dynamic setting "baz" to remain unregistered.' );
	}

	/**
	 * In lieu of closures, callback for customize_register action added in test_register_dynamic_settings().
	 */
	function action_customize_register_for_dynamic_settings() {
		add_filter( 'customize_dynamic_setting_args', array( $this, 'filter_customize_dynamic_setting_args_for_test_dynamic_settings' ), 10, 2 );
		add_filter( 'customize_dynamic_setting_class', array( $this, 'filter_customize_dynamic_setting_class_for_test_dynamic_settings' ), 10, 3 );
	}

	/**
	 * In lieu of closures, callback for customize_dynamic_setting_args filter added for test_register_dynamic_settings().
	 *
	 * @param array  $setting_args Setting args.
	 * @param string $setting_id   Setting ID.
	 * @return array
	 */
	function filter_customize_dynamic_setting_args_for_test_dynamic_settings( $setting_args, $setting_id ) {
		$this->assertInternalType( 'string', $setting_id );
		if ( in_array( $setting_id, array( 'foo', 'bar' ) ) ) {
			$setting_args = array( 'default' => "dynamic_{$setting_id}_default" );
		}
		return $setting_args;
	}

	/**
	 * In lieu of closures, callback for customize_dynamic_setting_class filter added for test_register_dynamic_settings().
	 *
	 * @param string $setting_class Setting class.
	 * @param string $setting_id    Setting ID.
	 * @param array  $setting_args  Setting args.
	 * @return string
	 */
	function filter_customize_dynamic_setting_class_for_test_dynamic_settings( $setting_class, $setting_id, $setting_args ) {
		$this->assertEquals( 'WP_Customize_Setting', $setting_class );
		$this->assertInternalType( 'string', $setting_id );
		$this->assertInternalType( 'array', $setting_args );
		return $setting_class;
	}

	/**
	 * Test is_ios() method.
	 *
	 * @see WP_Customize_Manager::is_ios()
	 */
	function test_is_ios() {
		$this->markTestSkipped( 'WP_Customize_Manager::is_ios() cannot be tested because it uses wp_is_mobile() which contains a static var.' );
	}

	/**
	 * Test get_document_title_template() method.
	 *
	 * @see WP_Customize_Manager::get_document_title_template()
	 */
	function test_get_document_title_template() {
		$tpl = $this->manager->get_document_title_template();
		$this->assertContains( '%s', $tpl );
	}

	/**
	 * Test get_preview_url()/set_preview_url methods.
	 *
	 * @see WP_Customize_Manager::get_preview_url()
	 * @see WP_Customize_Manager::set_preview_url()
	 */
	function test_preview_url() {
		$this->assertEquals( home_url( '/' ), $this->manager->get_preview_url() );
		$preview_url = home_url( '/foo/bar/baz/' );
		$this->manager->set_preview_url( $preview_url );
		$this->assertEquals( $preview_url, $this->manager->get_preview_url() );
		$this->manager->set_preview_url( 'http://illegalsite.example.com/food/' );
		$this->assertEquals( home_url( '/' ), $this->manager->get_preview_url() );
	}

	/**
	 * Test get_return_url()/set_return_url() methods.
	 *
	 * @see WP_Customize_Manager::get_return_url()
	 * @see WP_Customize_Manager::set_return_url()
	 */
	function test_return_url() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'author' ) ) );
		$this->assertEquals( home_url( '/' ), $this->manager->get_return_url() );

		wp_set_current_user( self::$admin_user_id );
		$this->assertTrue( current_user_can( 'edit_theme_options' ) );
		$this->assertEquals( home_url( '/' ), $this->manager->get_return_url() );

		$preview_url = home_url( '/foo/' );
		$this->manager->set_preview_url( $preview_url );
		$this->assertEquals( $preview_url, $this->manager->get_return_url() );

		$_SERVER['HTTP_REFERER'] = wp_slash( admin_url( 'customize.php' ) );
		$this->assertEquals( $preview_url, $this->manager->get_return_url() );

		// See #35355.
		$_SERVER['HTTP_REFERER'] = wp_slash( admin_url( 'wp-login.php' ) );
		$this->assertEquals( $preview_url, $this->manager->get_return_url() );

		$url = home_url( '/referred/' );
		$_SERVER['HTTP_REFERER'] = wp_slash( $url );
		$this->assertEquals( $url, $this->manager->get_return_url() );

		$url = 'http://badreferer.example.com/';
		$_SERVER['HTTP_REFERER'] = wp_slash( $url );
		$this->assertNotEquals( $url, $this->manager->get_return_url() );
		$this->assertEquals( $preview_url, $this->manager->get_return_url() );

		$this->manager->set_return_url( admin_url( 'edit.php?trashed=1' ) );
		$this->assertEquals( admin_url( 'edit.php' ), $this->manager->get_return_url() );
	}

	/**
	 * Test get_autofocus()/set_autofocus() methods.
	 *
	 * @see WP_Customize_Manager::get_autofocus()
	 * @see WP_Customize_Manager::set_autofocus()
	 */
	function test_autofocus() {
		$this->assertEmpty( $this->manager->get_autofocus() );

		$this->manager->set_autofocus( array( 'unrecognized' => 'food' ) );
		$this->assertEmpty( $this->manager->get_autofocus() );

		$autofocus = array( 'control' => 'blogname' );
		$this->manager->set_autofocus( $autofocus );
		$this->assertEquals( $autofocus, $this->manager->get_autofocus() );

		$autofocus = array( 'section' => 'colors' );
		$this->manager->set_autofocus( $autofocus );
		$this->assertEquals( $autofocus, $this->manager->get_autofocus() );

		$autofocus = array( 'panel' => 'widgets' );
		$this->manager->set_autofocus( $autofocus );
		$this->assertEquals( $autofocus, $this->manager->get_autofocus() );

		$autofocus = array( 'control' => array( 'blogname', 'blogdescription' ) );
		$this->manager->set_autofocus( $autofocus );
		$this->assertEmpty( $this->manager->get_autofocus() );
	}

	/**
	 * Test get_nonces() method.
	 *
	 * @see WP_Customize_Manager::get_nonces()
	 */
	function test_nonces() {
		$nonces = $this->manager->get_nonces();
		$this->assertInternalType( 'array', $nonces );
		$this->assertArrayHasKey( 'save', $nonces );
		$this->assertArrayHasKey( 'preview', $nonces );

		add_filter( 'customize_refresh_nonces', array( $this, 'filter_customize_refresh_nonces' ), 10, 2 );
		$nonces = $this->manager->get_nonces();
		$this->assertArrayHasKey( 'foo', $nonces );
		$this->assertEquals( wp_create_nonce( 'foo' ), $nonces['foo'] );
	}

	/**
	 * Filter for customize_refresh_nonces.
	 *
	 * @param array                $nonces  Nonces.
	 * @param WP_Customize_Manager $manager Manager.
	 * @return array Nonces.
	 */
	function filter_customize_refresh_nonces( $nonces, $manager ) {
		$this->assertInstanceOf( 'WP_Customize_Manager', $manager );
		$nonces['foo'] = wp_create_nonce( 'foo' );
		return $nonces;
	}

	/**
	 * Test customize_pane_settings() method.
	 *
	 * @see WP_Customize_Manager::customize_pane_settings()
	 */
	function test_customize_pane_settings() {
		wp_set_current_user( self::$admin_user_id );
		$this->manager->register_controls();
		$this->manager->prepare_controls();
		$autofocus = array( 'control' => 'blogname' );
		$this->manager->set_autofocus( $autofocus );

		ob_start();
		$this->manager->customize_pane_settings();
		$content = ob_get_clean();

		$this->assertContains( 'var _wpCustomizeSettings =', $content );
		$this->assertContains( '"blogname"', $content );
		$this->assertContains( '"type":"option"', $content );
		$this->assertContains( '_wpCustomizeSettings.controls', $content );
		$this->assertContains( '_wpCustomizeSettings.settings', $content );
		$this->assertContains( '</script>', $content );

		$this->assertNotEmpty( preg_match( '#var _wpCustomizeSettings\s*=\s*({.*?});\s*\n#', $content, $matches ) );
		$json = $matches[1];
		$data = json_decode( $json, true );
		$this->assertNotEmpty( $data );

		$this->assertEqualSets( array( 'theme', 'url', 'browser', 'panels', 'sections', 'nonce', 'autofocus', 'documentTitleTmpl', 'previewableDevices', 'changeset', 'timeouts', 'l10n' ), array_keys( $data ) );
		$this->assertEquals( $autofocus, $data['autofocus'] );
		$this->assertArrayHasKey( 'save', $data['nonce'] );
		$this->assertArrayHasKey( 'preview', $data['nonce'] );
	}

	/**
	 * Test customize_preview_settings() method.
	 *
	 * @see WP_Customize_Manager::customize_preview_settings()
	 */
	function test_customize_preview_settings() {
		wp_set_current_user( self::$admin_user_id );
		$this->manager->register_controls();
		$this->manager->prepare_controls();
		$this->manager->set_post_value( 'foo', 'bar' );
		$_POST['customize_messenger_channel'] = 'preview-0';

		ob_start();
		$this->manager->customize_preview_settings();
		$content = ob_get_clean();

		$this->assertEquals( 1, preg_match( '/var _wpCustomizeSettings = ({.+});/', $content, $matches ) );
		$settings = json_decode( $matches[1], true );

		$this->assertArrayHasKey( 'theme', $settings );
		$this->assertArrayHasKey( 'url', $settings );
		$this->assertArrayHasKey( 'channel', $settings );
		$this->assertArrayHasKey( 'activePanels', $settings );
		$this->assertArrayHasKey( 'activeSections', $settings );
		$this->assertArrayHasKey( 'activeControls', $settings );
		$this->assertArrayHasKey( 'settingValidities', $settings );
		$this->assertArrayHasKey( 'nonce', $settings );
		$this->assertArrayHasKey( '_dirty', $settings );
		$this->assertArrayHasKey( 'timeouts', $settings );
		$this->assertArrayHasKey( 'changeset', $settings );

		$this->assertArrayHasKey( 'preview', $settings['nonce'] );
	}

	/**
	 * @ticket 33552
	 */
	function test_customize_loaded_components_filter() {
		$manager = new WP_Customize_Manager();
		$this->assertInstanceOf( 'WP_Customize_Widgets', $manager->widgets );
		$this->assertInstanceOf( 'WP_Customize_Nav_Menus', $manager->nav_menus );

		add_filter( 'customize_loaded_components', array( $this, 'return_array_containing_widgets' ), 10, 2 );
		$manager = new WP_Customize_Manager();
		$this->assertInstanceOf( 'WP_Customize_Widgets', $manager->widgets );
		$this->assertEmpty( $manager->nav_menus );
		remove_all_filters( 'customize_loaded_components' );

		add_filter( 'customize_loaded_components', array( $this, 'return_array_containing_nav_menus' ), 10, 2 );
		$manager = new WP_Customize_Manager();
		$this->assertInstanceOf( 'WP_Customize_Nav_Menus', $manager->nav_menus );
		$this->assertEmpty( $manager->widgets );
		remove_all_filters( 'customize_loaded_components' );

		add_filter( 'customize_loaded_components', '__return_empty_array' );
		$manager = new WP_Customize_Manager();
		$this->assertEmpty( $manager->widgets );
		$this->assertEmpty( $manager->nav_menus );
		remove_all_filters( 'customize_loaded_components' );
	}

	/**
	 * @see Tests_WP_Customize_Manager::test_customize_loaded_components_filter()
	 *
	 * @param array                $components         Components.
	 * @param WP_Customize_Manager $customize_manager  Manager.
	 *
	 * @return array Components.
	 */
	function return_array_containing_widgets( $components, $customize_manager ) {
		$this->assertInternalType( 'array', $components );
		$this->assertContains( 'widgets', $components );
		$this->assertContains( 'nav_menus', $components );
		$this->assertInternalType( 'array', $components );
		$this->assertInstanceOf( 'WP_Customize_Manager', $customize_manager );
		return array( 'widgets' );
	}

	/**
	 * @see Tests_WP_Customize_Manager::test_customize_loaded_components_filter()
	 *
	 * @param array                $components         Components.
	 * @param WP_Customize_Manager $customize_manager  Manager.
	 *
	 * @return array Components.
	 */
	function return_array_containing_nav_menus( $components, $customize_manager ) {
		$this->assertInternalType( 'array', $components );
		$this->assertContains( 'widgets', $components );
		$this->assertContains( 'nav_menus', $components );
		$this->assertInternalType( 'array', $components );
		$this->assertInstanceOf( 'WP_Customize_Manager', $customize_manager );
		return array( 'nav_menus' );
	}

	/**
	 * @ticket 30225
	 * @ticket 34594
	 */
	function test_prepare_controls_stable_sorting() {
		$manager = new WP_Customize_Manager();
		$manager->register_controls();
		$section_id = 'foo-section';
		wp_set_current_user( self::$admin_user_id );
		$manager->add_section( $section_id, array(
			'title'      => 'Section',
			'priority'   => 1,
		) );

		$added_control_ids = array();
		$count = 9;
		for ( $i = 0; $i < $count; $i += 1 ) {
			$id = 'sort-test-' . $i;
			$added_control_ids[] = $id;
			$manager->add_setting( $id );
			$control = new WP_Customize_Control( $manager, $id, array(
				'section' => $section_id,
				'priority' => 1,
				'setting' => $id,
			) );
			$manager->add_control( $control );
		}

		$manager->prepare_controls();

		$sorted_control_ids = wp_list_pluck( $manager->get_section( $section_id )->controls, 'id' );
		$this->assertEquals( $added_control_ids, $sorted_control_ids );
	}

	/**
	 * @ticket 34596
	 */
	function test_add_section_return_instance() {
		$manager = new WP_Customize_Manager();
		wp_set_current_user( self::$admin_user_id );

		$section_id = 'foo-section';
		$result_section = $manager->add_section( $section_id, array(
			'title'    => 'Section',
			'priority' => 1,
		) );

		$this->assertInstanceOf( 'WP_Customize_Section', $result_section );
		$this->assertEquals( $section_id, $result_section->id );

		$section = new WP_Customize_Section( $manager, $section_id, array(
			'title'    => 'Section 2',
			'priority' => 2,
		) );
		$result_section = $manager->add_section( $section );

		$this->assertInstanceOf( 'WP_Customize_Section', $result_section );
		$this->assertEquals( $section_id, $result_section->id );
		$this->assertEquals( $section, $result_section );
	}

	/**
	 * @ticket 34596
	 */
	function test_add_setting_return_instance() {
		$manager = new WP_Customize_Manager();
		wp_set_current_user( self::$admin_user_id );

		$setting_id = 'foo-setting';
		$result_setting = $manager->add_setting( $setting_id );

		$this->assertInstanceOf( 'WP_Customize_Setting', $result_setting );
		$this->assertEquals( $setting_id, $result_setting->id );

		$setting = new WP_Customize_Setting( $manager, $setting_id );
		$result_setting = $manager->add_setting( $setting );

		$this->assertInstanceOf( 'WP_Customize_Setting', $result_setting );
		$this->assertEquals( $setting, $result_setting );
		$this->assertEquals( $setting_id, $result_setting->id );
	}

	/**
	 * @ticket 34597
	 */
	function test_add_setting_honoring_dynamic() {
		$manager = new WP_Customize_Manager();

		$setting_id = 'dynamic';
		$setting = $manager->add_setting( $setting_id );
		$this->assertEquals( 'WP_Customize_Setting', get_class( $setting ) );
		$this->assertObjectNotHasAttribute( 'custom', $setting );
		$manager->remove_setting( $setting_id );

		add_filter( 'customize_dynamic_setting_class', array( $this, 'return_dynamic_customize_setting_class' ), 10, 3 );
		add_filter( 'customize_dynamic_setting_args', array( $this, 'return_dynamic_customize_setting_args' ), 10, 2 );
		$setting = $manager->add_setting( $setting_id );
		$this->assertEquals( 'Test_Dynamic_Customize_Setting', get_class( $setting ) );
		$this->assertObjectHasAttribute( 'custom', $setting );
		$this->assertEquals( 'foo', $setting->custom );
	}

	/**
	 * Return 'Test_Dynamic_Customize_Setting' in 'customize_dynamic_setting_class.
	 *
	 * @param string $class Setting class.
	 * @param array  $args  Setting args.
	 * @param string $id    Setting ID.
	 * @return string       Setting class.
	 */
	function return_dynamic_customize_setting_class( $class, $id, $args ) {
		unset( $args );
		if ( 0 === strpos( $id, 'dynamic' ) ) {
			$class = 'Test_Dynamic_Customize_Setting';
		}
		return $class;
	}

	/**
	 * Return 'Test_Dynamic_Customize_Setting' in 'customize_dynamic_setting_class.
	 *
	 * @param array  $args Setting args.
	 * @param string $id   Setting ID.
	 * @return string      Setting args.
	 */
	function return_dynamic_customize_setting_args( $args, $id ) {
		if ( 0 === strpos( $id, 'dynamic' ) ) {
			$args['custom'] = 'foo';
		}
		return $args;
	}

	/**
	 * @ticket 34596
	 */
	function test_add_panel_return_instance() {
		$manager = new WP_Customize_Manager();
		wp_set_current_user( self::$admin_user_id );

		$panel_id = 'foo-panel';
		$result_panel = $manager->add_panel( $panel_id, array(
			'title'    => 'Test Panel',
			'priority' => 2,
		) );

		$this->assertInstanceOf( 'WP_Customize_Panel', $result_panel );
		$this->assertEquals( $panel_id, $result_panel->id );

		$panel = new WP_Customize_Panel( $manager, $panel_id, array(
			'title' => 'Test Panel 2',
		) );
		$result_panel = $manager->add_panel( $panel );

		$this->assertInstanceOf( 'WP_Customize_Panel', $result_panel );
		$this->assertEquals( $panel, $result_panel );
		$this->assertEquals( $panel_id, $result_panel->id );
	}

	/**
	 * @ticket 34596
	 */
	function test_add_control_return_instance() {
		$manager = new WP_Customize_Manager();
		$section_id = 'foo-section';
		wp_set_current_user( self::$admin_user_id );
		$manager->add_section( $section_id, array(
			'title'    => 'Section',
			'priority' => 1,
		) );

		$control_id = 'foo-control';
		$manager->add_setting( $control_id );

		$result_control = $manager->add_control( $control_id, array(
			'section'  => $section_id,
			'priority' => 1,
			'setting'  => $control_id,
		) );
		$this->assertInstanceOf( 'WP_Customize_Control', $result_control );
		$this->assertEquals( $control_id, $result_control->id );

		$control = new WP_Customize_Control( $manager, $control_id, array(
			'section'  => $section_id,
			'priority' => 1,
			'setting'  => $control_id,
		) );
		$result_control = $manager->add_control( $control );

		$this->assertInstanceOf( 'WP_Customize_Control', $result_control );
		$this->assertEquals( $control, $result_control );
		$this->assertEquals( $control_id, $result_control->id );
	}


	/**
	 * Testing the return values both with and without filter.
	 *
	 * @ticket 31195
	 */
	function test_get_previewable_devices() {

		// Setup the instance.
		$manager = new WP_Customize_Manager();

		// The default devices list.
		$default_devices = array(
			'desktop' => array(
				'label'   => __( 'Enter desktop preview mode' ),
				'default' => true,
			),
			'tablet'  => array(
				'label' => __( 'Enter tablet preview mode' ),
			),
			'mobile'  => array(
				'label' => __( 'Enter mobile preview mode' ),
			),
		);

		// Control test.
		$devices = $manager->get_previewable_devices();
		$this->assertSame( $default_devices, $devices );

		// Adding the filter.
		add_filter( 'customize_previewable_devices', array( $this, 'filter_customize_previewable_devices' ) );
		$devices = $manager->get_previewable_devices();
		$this->assertSame( $this->filtered_device_list(), $devices );

		// Clean up.
		remove_filter( 'customize_previewable_devices', array( $this, 'filter_customize_previewable_devices' ) );
	}

	/**
	 * Helper method for test_get_previewable_devices.
	 *
	 * @return array
	 */
	function filtered_device_list() {
		return array(
			'custom-device' => array(
				'label' => __( 'Enter custom-device preview mode' ),
				'default' => true,
			),
		);
	}

	/**
	 * Callback for the customize_previewable_devices filter.
	 *
	 * @param array $devices The list of devices.
	 *
	 * @return array
	 */
	function filter_customize_previewable_devices( $devices ) {
		return $this->filtered_device_list();
	}
}

require_once ABSPATH . WPINC . '/class-wp-customize-setting.php';

/**
 * Class Test_Dynamic_Customize_Setting
 *
 * @see Tests_WP_Customize_Manager::test_add_setting_honoring_dynamic()
 */
class Test_Dynamic_Customize_Setting extends WP_Customize_Setting {
	public $type = 'dynamic';
	public $custom;
}

/**
 * Class Test_Setting_Without_Applying_Validate_Filter.
 *
 * @see Tests_WP_Customize_Manager::test_late_validate_setting_values()
 */
class Test_Setting_Without_Applying_Validate_Filter extends WP_Customize_Setting {

	/**
	 * Validates an input.
	 *
	 * @param mixed $value Value to validate.
	 * @return true|WP_Error True if the input was validated, otherwise WP_Error.
	 */
	public function validate( $value ) {
		if ( empty( $value ) ) {
			return new WP_Error( 'empty_value', __( 'You must supply a value' ) );
		}
		return true;
	}

}
