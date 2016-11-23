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
	 * @covers wp_get_custom_css()
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

		$this->assertTrue( false !== $saved );
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

		// Check for Unclosed Comment.
		$unclosed_comment = $basic_css . ' /* This is a comment. ';
		$result = $this->setting->validate( $unclosed_comment );
		$this->assertTrue( array_key_exists( 'unclosed_comment', $result->errors ) );

		// Check for Unopened Comment.
		$unclosed_comment = $basic_css . ' This is a comment.*/';
		$result = $this->setting->validate( $unclosed_comment );
		$this->assertTrue( array_key_exists( 'imbalanced_comments', $result->errors ) );

		// Check for Unclosed Curly Brackets.
		$unclosed_curly_bracket = $basic_css . '  a.link { text-decoration: none;';
		$result = $this->setting->validate( $unclosed_curly_bracket );
		$this->assertTrue( array_key_exists( 'imbalanced_curly_brackets', $result->errors ) );

		// Check for Unopened Curly Brackets.
		$unopened_curly_bracket = $basic_css . '  a.link text-decoration: none; }';
		$result = $this->setting->validate( $unopened_curly_bracket );
		$this->assertTrue( array_key_exists( 'imbalanced_curly_brackets', $result->errors ) );

		// Check for Unclosed Braces.
		$unclosed_brace = $basic_css . '  input[type="text" { color: #f00; } ';
		$result = $this->setting->validate( $unclosed_brace );
		$this->assertTrue( array_key_exists( 'imbalanced_braces', $result->errors ) );

		// Check for Unopened Braces.
		$unopened_brace = $basic_css . ' inputtype="text"] { color: #f00; } ';
		$result = $this->setting->validate( $unopened_brace );
		$this->assertTrue( array_key_exists( 'imbalanced_braces', $result->errors ) );

		// Check for Imbalanced Double Quotes.
		$imbalanced_double_quotes = $basic_css . ' div.background-image { background-image: url( "image.jpg ); } ';
		$result = $this->setting->validate( $imbalanced_double_quotes );
		$this->assertTrue( array_key_exists( 'unequal_double_quotes', $result->errors ) );

		// Check for Imbalanced Single Quotes.
		$imbalanced_single_quotes = $basic_css . " div.background-image { background-image: url( 'image.jpg ); } ";
		$result = $this->setting->validate( $imbalanced_single_quotes );
		$this->assertTrue( array_key_exists( 'unequal_single_quotes', $result->errors ) );

		// Check for Unclosed Parentheses.
		$unclosed_parentheses = $basic_css . ' div.background-image { background-image: url( "image.jpg" ; } ';
		$result = $this->setting->validate( $unclosed_parentheses );
		$this->assertTrue( array_key_exists( 'imbalanced_parentheses', $result->errors ) );

		// Check for Unopened Parentheses.
		$unopened_parentheses = $basic_css . ' div.background-image { background-image: url "image.jpg" ); } ';
		$result = $this->setting->validate( $unopened_parentheses );
		$this->assertTrue( array_key_exists( 'imbalanced_parentheses', $result->errors ) );

		// A basic Content declaration with no other errors should not throw an error.
		$content_declaration = $basic_css . ' a:before { content: ""; display: block; }';
		$result = $this->setting->validate( $content_declaration );
		$this->assertTrue( $result );

		// An error, along with a Content declaration will throw two errors.
		// In this case, we're using an extra opening brace.
		$content_declaration = $basic_css . ' a:before { content: "["; display: block; }';
		$result = $this->setting->validate( $content_declaration );
		$this->assertTrue( array_key_exists( 'imbalanced_braces', $result->errors ) );
		$this->assertTrue( array_key_exists( 'possible_false_positive', $result->errors ) );

		$css = 'body { background: #f00; } h1.site-title { font-size: 36px; } a:hover { text-decoration: none; } input[type="text"] { padding: 1em; } /* This is a comment */';
		$this->assertTrue( $this->setting->validate( $css ) );

		$validity = $this->setting->validate( $css . ' /* This is another comment.' );
		$this->assertInstanceOf( 'WP_Error', $validity );
		$this->assertContains( 'unclosed code comment', join( ' ', $validity->get_error_messages() ) );

		$css = '/* This is comment one. */  /* This is comment two. */';
		$this->assertTrue( $this->setting->validate( $css ) );

		$basic_css = 'body { background: #f00; } h1.site-title { font-size: 36px; } a:hover { text-decoration: none; } input[type="text"] { padding: 1em; }';
		$this->assertTrue( $this->setting->validate( $basic_css ) );

		$css = $basic_css . ' .link:before { content: "*"; display: block; }';
		$this->assertTrue( $this->setting->validate( $css ) );

		$css .= ' ( trailing';
		$validity = $this->setting->validate( $css );
		$this->assertWPError( $validity );
		$this->assertNotEmpty( $result->get_error_message( 'possible_false_positive' ) );
	}
}
