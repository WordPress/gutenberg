<?php
/**
 * Login/out block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Login/out block.
 *
 * @group blocks
 */
class Render_Block_Loginout_Test extends WP_UnitTestCase {

	/**
	 * User ID for testing logged in state.
	 *
	 * @var int
	 */
	private static $user_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$user_id = $factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);
	}

	public function tearDown() {
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * Renders the loginout block.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered block output.
	 */
	private function render_block( $attributes = array() ) {
		if ( function_exists( 'gutenberg_render_block_core_loginout' ) ) {
			return gutenberg_render_block_core_loginout( $attributes );
		}
		return render_block_core_loginout( $attributes );
	}

	/**
	 * @covers ::gutenberg_render_block_core_loginout
	 */
	public function test_renders_default_login_link_when_logged_out() {
		wp_set_current_user( 0 );

		$output = $this->render_block();

		$this->assertStringContainsString( 'class="wp-block-loginout logged-out"', $output );
		$this->assertStringContainsString( '>Log in</a>', $output );
		$this->assertStringContainsString( wp_login_url(), $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_loginout
	 */
	public function test_renders_custom_login_text_when_logged_out() {
		wp_set_current_user( 0 );

		$attributes = array(
			'loginText' => 'Sign In',
		);

		$output = $this->render_block( $attributes );

		$this->assertStringContainsString( '>Sign In</a>', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_loginout
	 */
	public function test_escapes_login_text() {
		wp_set_current_user( 0 );

		$attributes = array(
			'loginText' => 'Sign In <script>alert(1)</script> & Join',
		);

		$output = $this->render_block( $attributes );

		$this->assertStringContainsString( 'Sign In &lt;script&gt;alert(1)&lt;/script&gt; &amp; Join', $output );
		$this->assertStringNotContainsString( '<script>', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_loginout
	 */
	public function test_renders_default_logout_link_when_logged_in() {
		wp_set_current_user( self::$user_id );

		$output = $this->render_block();

		$this->assertStringContainsString( 'class="wp-block-loginout logged-in"', $output );
		$this->assertStringContainsString( '>Log out</a>', $output );
		$this->assertStringContainsString( wp_logout_url(), $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_loginout
	 */
	public function test_renders_custom_logout_text_when_logged_in() {
		wp_set_current_user( self::$user_id );

		$attributes = array(
			'logoutText' => 'Sign Out',
		);

		$output = $this->render_block( $attributes );

		$this->assertStringContainsString( '>Sign Out</a>', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_loginout
	 */
	public function test_escapes_logout_text() {
		wp_set_current_user( self::$user_id );

		$attributes = array(
			'logoutText' => 'Sign Out <script>alert("xss")</script>',
		);

		$output = $this->render_block( $attributes );

		$this->assertStringContainsString( 'Sign Out &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;', $output );
		$this->assertStringNotContainsString( '<script>', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_loginout
	 */
	public function test_renders_login_form_when_display_login_as_form_is_true() {
		wp_set_current_user( 0 );

		$attributes = array(
			'displayLoginAsForm' => true,
			'loginText'          => 'Enter Site',
		);

		$output = $this->render_block( $attributes );

		$this->assertStringContainsString( 'has-login-form', $output );
		$this->assertStringContainsString( 'id="loginform"', $output );
		$this->assertStringContainsString( 'Enter Site', $output );
	}
}
