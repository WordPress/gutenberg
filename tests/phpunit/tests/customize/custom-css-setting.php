<?php
/**
 * Test Test_WP_Customize_Custom_CSS_Setting.
 *
 * Tests WP_Customize_Custom_CSS_Setting.
 *
 * @group customize
 */
class Test_WP_Customize_Custom_CSS_Setting extends WP_UnitTestCase {

	/**
	 * Instance of WP_Customize_Manager which is reset for each test.
	 *
	 * @var WP_Customize_Manager
	 */
	public $wp_customize;

	/**
	 * The Setting instance.
	 *
	 * @var WP_Customize_Custom_CSS_Setting
	 */
	public $setting;

	/**
	 * Set up the test case.
	 *
	 * @see WP_UnitTestCase::setup()
	 */
	function setUp() {
		parent::setUp();
		require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';

		$user_id = self::factory()->user->create( array(
			'role' => 'administrator',
		) );
		if ( is_multisite() ) {
			grant_super_admin( $user_id );
		}

		wp_set_current_user( $user_id );

		global $wp_customize;
		$this->wp_customize = new WP_Customize_Manager();
		$wp_customize = $this->wp_customize;

		do_action( 'customize_register', $this->wp_customize );
		$this->setting = new WP_Customize_Custom_CSS_Setting( $this->wp_customize, 'custom_css[' . get_stylesheet() . ']' );
		$this->wp_customize->add_setting( $this->setting );
	}

	/**
	 * Tear down the test case.
	 */
	function tearDown() {
		parent::tearDown();
		$this->setting = null;
	}

	/**
	 * Delete the $wp_customize global when cleaning up scope.
	 */
	function clean_up_global_scope() {
		global $wp_customize;
		$wp_customize = null;
		parent::clean_up_global_scope();
	}

	/**
	 * Test constructor.
	 *
	 * Mainly validates that the correct hooks exist.
	 *
	 * Also checks for the post type and the Setting Type.
	 *
	 * @covers WP_Customize_Custom_CSS_Setting::__construct()
	 */
	function test_construct() {
		$this->assertTrue( post_type_exists( 'custom_css' ) );
		$this->assertEquals( 'custom_css', $this->setting->type );
		$this->assertEquals( get_stylesheet(), $this->setting->stylesheet );
		$this->assertEquals( 'edit_css', $this->setting->capability );

		$exception = null;
		try {
			$x = new WP_Customize_Custom_CSS_Setting( $this->wp_customize, 'bad' );
			unset( $x );
		} catch ( Exception $e ) {
			$exception = $e;
		}
		$this->assertInstanceOf( 'Exception', $exception );

		$exception = null;
		try {
			$x = new WP_Customize_Custom_CSS_Setting( $this->wp_customize, 'custom_css' );
			unset( $x );
		} catch ( Exception $e ) {
			$exception = $e;
		}
		$this->assertInstanceOf( 'Exception', $exception );
	}

	/**
	 * Test crud methods on WP_Customize_Custom_CSS_Setting.
	 *
	 * @covers ::wp_get_custom_css
	 * @covers WP_Customize_Custom_CSS_Setting::value()
	 * @covers WP_Customize_Custom_CSS_Setting::preview()
	 * @covers WP_Customize_Custom_CSS_Setting::update()
	 */
	function test_crud() {

		$this->setting->default = '/* Hello World */';
		$this->assertEquals( $this->setting->default, $this->setting->value() );

		$this->assertNull( wp_get_custom_css_post() );
		$this->assertNull( wp_get_custom_css_post( $this->setting->stylesheet ) );
		$this->assertNull( wp_get_custom_css_post( 'twentyten' ) );

		$original_css = 'body { color: black; }';
		$post_id = $this->factory()->post->create( array(
			'post_title' => $this->setting->stylesheet,
			'post_name' => $this->setting->stylesheet,
			'post_content' => $original_css,
			'post_status' => 'publish',
			'post_type' => 'custom_css',
		) );
		$twentyten_css = 'body { color: red; }';
		$twentyten_post_id = $this->factory()->post->create( array(
			'post_title' => 'twentyten',
			'post_name' => 'twentyten',
			'post_content' => $twentyten_css,
			'post_status' => 'publish',
			'post_type' => 'custom_css',
		) );
		$twentyten_setting = new WP_Customize_Custom_CSS_Setting( $this->wp_customize, 'custom_css[twentyten]' );

		remove_theme_mod( 'custom_css_post_id' );

		$this->assertEquals( $post_id, wp_get_custom_css_post()->ID );
		$this->assertEquals( $post_id, wp_get_custom_css_post( $this->setting->stylesheet )->ID );
		$this->assertEquals( $twentyten_post_id, wp_get_custom_css_post( 'twentyten' )->ID );

		$this->assertEquals( $original_css, wp_get_custom_css( $this->setting->stylesheet ) );
		$this->assertEquals( $original_css, $this->setting->value() );
		$this->assertEquals( $twentyten_css, wp_get_custom_css( 'twentyten' ) );
		$this->assertEquals( $twentyten_css, $twentyten_setting->value() );

		$updated_css = 'body { color: blue; }';
		$this->wp_customize->set_post_value( $this->setting->id, $updated_css );
		$saved = $this->setting->save();

		$this->assertNotFalse( $saved );
		$this->assertEquals( $updated_css, $this->setting->value() );
		$this->assertEquals( $updated_css, wp_get_custom_css( $this->setting->stylesheet ) );
		$this->assertEquals( $updated_css, get_post( $post_id )->post_content );

		$previewed_css = 'body { color: red; }';
		$this->wp_customize->set_post_value( $this->setting->id, $previewed_css );
		$this->setting->preview();
		$this->assertEquals( $previewed_css, $this->setting->value() );
		$this->assertEquals( $previewed_css, wp_get_custom_css( $this->setting->stylesheet ) );

		// Make sure that wp_update_custom_css_post() works as expected for updates.
		$r = wp_update_custom_css_post( 'body { color:red; }', array(
			'stylesheet' => $this->setting->stylesheet,
			'preprocessed' => "body\n\tcolor:red;",
		) );
		$this->assertInstanceOf( 'WP_Post', $r );
		$this->assertEquals( $post_id, $r->ID );
		$this->assertEquals( 'body { color:red; }', get_post( $r )->post_content );
		$this->assertEquals( "body\n\tcolor:red;", get_post( $r )->post_content_filtered );
		$r = wp_update_custom_css_post( 'body { content: "\o/"; }' );
		$this->assertEquals( $this->wp_customize->get_stylesheet(), get_post( $r )->post_name );
		$this->assertEquals( 'body { content: "\o/"; }', get_post( $r )->post_content );
		$this->assertEquals( '', get_post( $r )->post_content_filtered );

		// Make sure that wp_update_custom_css_post() works as expected for insertion.
		$r = wp_update_custom_css_post( 'body { background:black; }', array(
			'stylesheet' => 'other',
		) );
		$this->assertInstanceOf( 'WP_Post', $r );
		$this->assertEquals( 'other', get_post( $r )->post_name );
		$this->assertEquals( 'body { background:black; }', get_post( $r )->post_content );
		$this->assertEquals( 'publish', get_post( $r )->post_status );

		// Test deletion.
		wp_delete_post( $post_id );
		$this->assertNull( wp_get_custom_css_post() );
		$this->assertNull( wp_get_custom_css_post( get_stylesheet() ) );
		$this->assertEquals( $previewed_css, wp_get_custom_css( get_stylesheet() ), 'Previewed value remains in spite of deleted post.' );
		wp_delete_post( $twentyten_post_id );
		$this->assertNull( wp_get_custom_css_post( 'twentyten' ) );
		$this->assertEquals( '', wp_get_custom_css( 'twentyten' ) );
	}

	/**
	 * Test revision saving on initial save of Custom CSS.
	 *
	 * @ticket 39032
	 */
	function test_custom_css_revision_saved() {
		$inserted_css = 'body { background: black; }';
		$updated_css = 'body { background: red; }';

		$post = wp_update_custom_css_post( $inserted_css, array(
			'stylesheet' => 'testtheme',
		) );

		$this->assertSame( $inserted_css, $post->post_content );
		$revisions = array_values( wp_get_post_revisions( $post ) );
		$this->assertCount( 1, $revisions );
		$this->assertSame( $inserted_css, $revisions[0]->post_content );

		wp_update_custom_css_post( $updated_css, array(
			'stylesheet' => 'testtheme',
		) );

		$revisions = array_values( wp_get_post_revisions( $post ) );
		$this->assertCount( 2, $revisions );
		$this->assertSame( $updated_css, $revisions[0]->post_content );
		$this->assertSame( $inserted_css, $revisions[1]->post_content );
	}

	/**
	 * Test that wp_get_custom_css_post() doesn't query for a post after caching a failed lookup.
	 *
	 * @ticket 39259
	 */
	function test_get_custom_css_post_queries_after_failed_lookup() {
		set_theme_mod( 'custom_css_post_id', -1 );
		$queries_before = get_num_queries();
		wp_get_custom_css_post();
		$this->assertSame( get_num_queries(), $queries_before );
	}

	/**
	 * Test that wp_update_custom_css_post() updates the 'custom_css_post_id' theme mod.
	 *
	 * @ticket 39259
	 */
	function test_update_custom_css_updates_theme_mod() {
		set_theme_mod( 'custom_css_post_id', -1 );
		$post = wp_update_custom_css_post( 'body { background: blue; }' );
		$this->assertSame( $post->ID, get_theme_mod( 'custom_css_post_id' ) );
	}

	/**
	 * Test crud methods on WP_Customize_Custom_CSS_Setting.
	 *
	 * @covers WP_Customize_Custom_CSS_Setting::value()
	 */
	function test_value_filter() {
		add_filter( 'customize_value_custom_css', array( $this, 'filter_value' ), 10, 2 );
		$this->setting->default = '/*default*/';
		$this->assertEquals( '/*default*//*filtered*/', $this->setting->value() );

		$this->factory()->post->create( array(
			'post_title' => $this->setting->stylesheet,
			'post_name' => $this->setting->stylesheet,
			'post_content' => '/*custom*/',
			'post_status' => 'publish',
			'post_type' => 'custom_css',
		) );
		remove_theme_mod( 'custom_css_post_id' );
		$this->assertEquals( '/*custom*//*filtered*/', $this->setting->value() );

		$this->wp_customize->set_post_value( $this->setting->id, '/*overridden*/' );
		$this->setting->preview();
		$this->assertEquals( '/*overridden*/', $this->setting->value(), 'Expected value to not be filtered since post value is present.' );
	}

	/**
	 * Filter value.
	 *
	 * @param string $value                 Value.
	 * @param WP_Customize_Setting $setting Setting.
	 * @return string
	 */
	function filter_value( $value, $setting ) {
		$this->assertInstanceOf( 'WP_Customize_Custom_CSS_Setting', $setting );
		$value .= '/*filtered*/';
		return $value;
	}

	/**
	 * Test update filter on WP_Customize_Custom_CSS_Setting.
	 *
	 * @covers WP_Customize_Custom_CSS_Setting::update()
	 */
	function test_update_filter() {
		$original_css = 'body { color:red; }';
		$post_id = $this->factory()->post->create( array(
			'post_title' => $this->setting->stylesheet,
			'post_name' => $this->setting->stylesheet,
			'post_content' => $original_css,
			'post_status' => 'publish',
			'post_type' => 'custom_css',
		) );

		$overridden_css = 'body { color:green; }';
		$this->wp_customize->set_post_value( $this->setting->id, $overridden_css );

		$post = get_post( $post_id );
		$original_title = $post->post_title;

		add_filter( 'update_custom_css_data', array( $this, 'filter_update_custom_css_data' ), 10, 3 );
		$this->setting->save();

		$post = get_post( $post_id );
		$this->assertEquals( $original_title, $post->post_title );
		$this->assertContains( $overridden_css, $post->post_content );
		$this->assertContains( '/* filtered post_content */', $post->post_content );
		$this->assertContains( '/* filtered post_content_filtered */', $post->post_content_filtered );
	}

	/**
	 * Filter `customize_update_custom_css_post_content_args`.
	 *
	 * @param array  $data Data.
	 * @param string $args Args.
	 * @return array Data.
	 */
	function filter_update_custom_css_data( $data, $args ) {
		$this->assertInternalType( 'array', $data );
		$this->assertEqualSets( array( 'css', 'preprocessed' ), array_keys( $data ) );
		$this->assertEquals( '', $data['preprocessed'] );
		$this->assertInternalType( 'array', $args );
		$this->assertEqualSets( array( 'css', 'preprocessed', 'stylesheet' ), array_keys( $args ) );
		$this->assertEquals( $args['css'], $data['css'] );
		$this->assertEquals( $args['preprocessed'], $data['preprocessed'] );

		$data['css'] .= '/* filtered post_content */';
		$data['preprocessed'] = '/* filtered post_content_filtered */';
		$data['post_title'] = 'Ignored';
		return $data;
	}

	/**
	 * Tests that validation errors are caught appropriately.
	 *
	 * Note that the $validity \WP_Error object must be reset each time
	 * as it picks up the Errors and passes them to the next assertion.
	 *
	 * @covers WP_Customize_Custom_CSS_Setting::validate()
	 */
	function test_validate() {

		// Empty CSS throws no errors.
		$result = $this->setting->validate( '' );
		$this->assertTrue( $result );

		// Basic, valid CSS throws no errors.
		$basic_css = 'body { background: #f00; } h1.site-title { font-size: 36px; } a:hover { text-decoration: none; } input[type="text"] { padding: 1em; }';
		$result = $this->setting->validate( $basic_css );
		$this->assertTrue( $result );

		// Check for markup.
		$unclosed_comment = $basic_css . '</style>';
		$result = $this->setting->validate( $unclosed_comment );
		$this->assertTrue( array_key_exists( 'illegal_markup', $result->errors ) );
	}
}
