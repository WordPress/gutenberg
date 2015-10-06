<?php

/**
 * @group rewrite
 */
class Tests_Rewrite_AddRewriteRule extends WP_UnitTestCase {

	public function setUp() {
		global $wp_rewrite;
		parent::setUp();

		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules();
	}

	public function tearDown() {
		global $wp_rewrite;
		$wp_rewrite->init();

		parent::tearDown();
	}

	/**
	 * @ticket 16840
	 */
	public function test_add_rewrite_rule_redirect() {
		global $wp_rewrite;

		$pattern  = 'path/to/rewrite/([^/]+)/?$';
		$redirect = 'index.php?test_var1=$matches[1]&test_var2=1';
		add_rewrite_rule( $pattern, $redirect );

		flush_rewrite_rules();

		$rewrite_rules = $wp_rewrite->rewrite_rules();

		$this->assertSame( $redirect, $rewrite_rules[ $pattern ] );
	}

	/**
	 * @ticket 16840
	 */
	public function test_add_rewrite_rule_redirect_array() {
		global $wp_rewrite;

		$pattern  = 'path/to/rewrite/([^/]+)/?$';
		$redirect = 'index.php?test_var1=$matches[1]&test_var2=1';

		add_rewrite_rule( $pattern, array(
			'test_var1' => '$matches[1]',
			'test_var2' => '1'
		) );

		flush_rewrite_rules();

		$rewrite_rules = $wp_rewrite->rewrite_rules();

		$this->assertSame( $redirect, $rewrite_rules[ $pattern ] );
	}
}
