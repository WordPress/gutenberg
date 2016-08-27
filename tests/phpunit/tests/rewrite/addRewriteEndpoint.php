<?php

/**
 * @group rewrite
 */
class Tests_Rewrite_AddRewriteEndpoint extends WP_UnitTestCase {
	private $qvs;
	protected static $test_page_id;
	protected static $test_post_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$test_page_id = $factory->post->create( array(
			'post_type' => 'page',
		) );
		self::$test_post_id = $factory->post->create();
	}

	public function setUp() {
		parent::setUp();

		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		$this->qvs = $GLOBALS['wp']->public_query_vars;
	}

	public function tearDown() {
		$GLOBALS['wp']->public_query_vars = $this->qvs;
		parent::tearDown();
	}

	public function test_should_register_query_using_name_param_by_default() {
		add_rewrite_endpoint( 'foo', EP_ALL );
		$this->assertContains( 'foo', $GLOBALS['wp']->public_query_vars );
	}

	public function test_should_register_query_using_name_param_if_null_is_passed_as_query_var() {
		add_rewrite_endpoint( 'foo', EP_ALL, null );
		$this->assertContains( 'foo', $GLOBALS['wp']->public_query_vars );
	}

	public function test_should_register_query_using_query_var_param_if_not_null() {
		add_rewrite_endpoint( 'foo', EP_ALL, 'bar' );
		$this->assertContains( 'bar', $GLOBALS['wp']->public_query_vars );
	}

	/**
	 * @ticket 25143
	 */
	public function test_should_register_query_var_using_name_param_if_true_is_passed_as_query_var() {
		add_rewrite_endpoint( 'foo', EP_ALL, true );
		$this->assertContains( 'foo', $GLOBALS['wp']->public_query_vars );
	}

	/**
	 * @ticket 25143
	 */
	public function test_should_not_register_query_var_if_query_var_param_is_false() {
		$qvs = $GLOBALS['wp']->public_query_vars;
		add_rewrite_endpoint( 'foo', EP_ALL, false );
		$this->assertSame( $qvs, $GLOBALS['wp']->public_query_vars );
	}

	/**
	 * @ticket 25143
	 */
	public function test_is_home_should_be_false_when_visiting_custom_endpoint_without_a_registered_query_var_and_page_on_front_is_set() {

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', self::$test_page_id );

		add_rewrite_endpoint( 'test', EP_ALL, false );
		flush_rewrite_rules();

		$this->go_to( home_url( '/test/1' ) );

		$this->assertQueryTrue( 'is_front_page', 'is_page', 'is_singular' );
		$this->assertFalse( is_home() );
	}

	public function test_permalink_endpoint_only_applies_on_permalink() {
		add_rewrite_endpoint( 'permalink_endpoint', EP_PERMALINK );
		flush_rewrite_rules();

		$this->go_to( get_permalink( self::$test_post_id ) . 'permalink_endpoint/foo/' );

		$this->assertTrue( is_single( self::$test_post_id ) );
		$this->assertSame( 'foo', get_query_var( 'permalink_endpoint' ) );

		$this->go_to( home_url( 'permalink_endpoint/foo/' ) );

		$this->assertTrue( is_404() );
		$this->assertSame( '', get_query_var( 'permalink_endpoint' ) );
	}

	public function test_page_endpoint_only_applies_on_page() {
		add_rewrite_endpoint( 'page_endpoint', EP_PAGES );
		flush_rewrite_rules();

		$this->go_to( get_permalink( self::$test_page_id ) . 'page_endpoint/foo/' );

		$this->assertTrue( is_page( self::$test_page_id ) );
		$this->assertSame( 'foo', get_query_var( 'page_endpoint' ) );

		$this->go_to( home_url( 'page_endpoint/foo/' ) );

		$this->assertTrue( is_404() );
		$this->assertSame( '', get_query_var( 'page_endpoint' ) );
	}

}
