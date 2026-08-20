<?php
/**
 * Tests for core/loginout Gutenberg block.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Class for testing the core/loginout Gutenberg block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Loginout extends WP_UnitTestCase {

	/**
	 * The `$_SERVER` superglobal as it was before the test ran.
	 *
	 * @var array
	 */
	private $original_server;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		$this->original_server  = $_SERVER;
		$_SERVER['HTTP_HOST']   = 'example.org';
		$_SERVER['REQUEST_URI'] = '/members/';
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		$_SERVER = $this->original_server;

		parent::tear_down();
	}

	/**
	 * Returns the `href` of the first link in the given markup.
	 *
	 * @param string $html The rendered block.
	 * @return string|null The link target, or null when there is no link.
	 */
	private function get_link_href( $html ) {
		$processor = new WP_HTML_Tag_Processor( $html );

		if ( ! $processor->next_tag( 'A' ) ) {
			return null;
		}

		return $processor->get_attribute( 'href' );
	}

	/**
	 * @covers ::render_block_core_loginout
	 */
	public function test_custom_login_url_replaces_the_default_login_page() {
		$html = gutenberg_render_block_core_loginout(
			array(
				'loginUrl'          => 'https://example.org/sign-in/',
				'redirectToCurrent' => false,
			)
		);

		$this->assertSame( 'https://example.org/sign-in/', $this->get_link_href( $html ) );
	}

	/**
	 * @covers ::render_block_core_loginout
	 */
	public function test_custom_login_url_keeps_the_redirect_to_current_url() {
		$html = gutenberg_render_block_core_loginout(
			array(
				'loginUrl'          => 'https://example.org/sign-in/',
				'redirectToCurrent' => true,
			)
		);

		$this->assertSame(
			'https://example.org/sign-in/?redirect_to=' . rawurlencode( 'http://example.org/members/' ),
			$this->get_link_href( $html )
		);
	}

	/**
	 * @covers ::render_block_core_loginout
	 */
	public function test_custom_login_url_is_appended_to_an_existing_query_string() {
		$html = gutenberg_render_block_core_loginout(
			array(
				'loginUrl'          => 'https://example.org/account/?tab=login',
				'redirectToCurrent' => true,
			)
		);

		$this->assertSame(
			'https://example.org/account/?tab=login&redirect_to=' . rawurlencode( 'http://example.org/members/' ),
			$this->get_link_href( $html )
		);
	}

	/**
	 * @covers ::render_block_core_loginout
	 */
	public function test_empty_custom_login_url_falls_back_to_the_default_login_page() {
		$html = gutenberg_render_block_core_loginout(
			array(
				'loginUrl'          => '',
				'redirectToCurrent' => false,
			)
		);

		$this->assertSame( wp_login_url(), $this->get_link_href( $html ) );
	}

	/**
	 * @covers ::render_block_core_loginout
	 */
	public function test_non_string_custom_login_url_falls_back_to_the_default_login_page() {
		$html = gutenberg_render_block_core_loginout(
			array(
				'loginUrl'          => array( 'https://example.org/sign-in/' ),
				'redirectToCurrent' => false,
			)
		);

		$this->assertSame( wp_login_url(), $this->get_link_href( $html ) );
	}

	/**
	 * @covers ::render_block_core_loginout
	 */
	public function test_unsafe_custom_login_url_is_not_rendered() {
		$html = gutenberg_render_block_core_loginout(
			array(
				'loginUrl'          => 'javascript:alert(1)',
				'redirectToCurrent' => false,
			)
		);

		$this->assertSame( '', $this->get_link_href( $html ) );
	}

	/**
	 * @covers ::render_block_core_loginout
	 */
	public function test_custom_login_url_does_not_affect_the_logout_link() {
		wp_set_current_user( self::factory()->user->create() );

		$html = gutenberg_render_block_core_loginout(
			array(
				'loginUrl'          => 'https://example.org/sign-in/',
				'redirectToCurrent' => false,
			)
		);

		$this->assertStringContainsString( 'action=logout', $this->get_link_href( $html ) );
	}

	/**
	 * @covers ::render_block_core_loginout
	 */
	public function test_custom_login_url_is_ignored_when_the_login_form_is_displayed() {
		$html = gutenberg_render_block_core_loginout(
			array(
				'loginUrl'           => 'https://example.org/sign-in/',
				'displayLoginAsForm' => true,
				'redirectToCurrent'  => false,
			)
		);

		$this->assertStringContainsString( 'id="loginform"', $html );
		$this->assertStringNotContainsString( 'https://example.org/sign-in/', $html );
	}
}
