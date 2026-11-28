<?php
/**
 * Tests for the head code setting.
 *
 * @package gutenberg
 */
class Gutenberg_Head_Code_Test extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static $admin_id;

	/**
	 * @var int
	 */
	private static $editor_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		if ( is_multisite() ) {
			grant_super_admin( self::$admin_id );
		}
	}

	public function tear_down() {
		delete_option( 'gutenberg_head_code' );
		parent::tear_down();
	}

	/**
	 * @covers ::gutenberg_print_head_code
	 */
	public function test_prints_head_code() {
		update_option( 'gutenberg_head_code', '<meta name="test" content="1">' );

		$this->assertSame( "<meta name=\"test\" content=\"1\">\n", get_echo( 'gutenberg_print_head_code' ) );
	}

	/**
	 * @covers ::gutenberg_print_head_code
	 */
	public function test_prints_nothing_when_empty() {
		$this->assertSame( '', get_echo( 'gutenberg_print_head_code' ) );
	}

	/**
	 * @covers ::gutenberg_sanitize_head_code
	 */
	public function test_saves_without_a_user() {
		wp_set_current_user( 0 );

		update_option( 'gutenberg_head_code', '<meta name="cli" content="1">' );

		$this->assertSame( '<meta name="cli" content="1">', get_option( 'gutenberg_head_code' ) );
	}

	/**
	 * @covers ::gutenberg_sanitize_head_code
	 */
	public function test_user_with_unfiltered_html_can_save() {
		wp_set_current_user( self::$admin_id );

		update_option( 'gutenberg_head_code', '  <script>window.test = 1;</script>  ' );

		$this->assertSame( '<script>window.test = 1;</script>', get_option( 'gutenberg_head_code' ) );
	}

	/**
	 * @covers ::gutenberg_sanitize_head_code
	 */
	public function test_user_without_unfiltered_html_cannot_change_it() {
		wp_set_current_user( self::$admin_id );
		update_option( 'gutenberg_head_code', '<meta name="kept" content="1">' );

		wp_set_current_user( self::$editor_id );
		add_filter( 'map_meta_cap', array( $this, 'disallow_unfiltered_html' ), 10, 2 );
		update_option( 'gutenberg_head_code', '<script>alert(1)</script>' );
		remove_filter( 'map_meta_cap', array( $this, 'disallow_unfiltered_html' ), 10 );

		$this->assertSame( '<meta name="kept" content="1">', get_option( 'gutenberg_head_code' ) );
	}

	/**
	 * Removes unfiltered_html regardless of role, since single-site editors
	 * have it by default.
	 *
	 * @param string[] $caps Primitive capabilities.
	 * @param string   $cap  Capability being checked.
	 * @return string[]
	 */
	public function disallow_unfiltered_html( $caps, $cap ) {
		if ( 'unfiltered_html' === $cap ) {
			return array( 'do_not_allow' );
		}
		return $caps;
	}
}
