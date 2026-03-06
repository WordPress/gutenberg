<?php
/**
 * Unit tests for _gutenberg_resolve_ai_provider_logo_url().
 *
 * @package Gutenberg
 */
class Tests_Resolve_AI_Provider_Logo_URL extends WP_UnitTestCase {

	public function test_returns_null_when_path_is_empty() {
		$this->assertNull( _gutenberg_resolve_ai_provider_logo_url( '' ) );
	}

	public function test_resolves_plugin_dir_path_to_url() {
		$result = _gutenberg_resolve_ai_provider_logo_url( WP_PLUGIN_DIR . '/my-plugin/logo.svg' );
		$this->assertSame( 'http://localhost:8889/wp-content/plugins/my-plugin/logo.svg', $result );
	}

	public function test_resolves_mu_plugin_dir_path_to_url() {
		$result = _gutenberg_resolve_ai_provider_logo_url( WPMU_PLUGIN_DIR . '/my-mu-plugin/logo.svg' );
		$this->assertSame( 'http://localhost:8889/wp-content/mu-plugins/my-mu-plugin/logo.svg', $result );
	}

	/**
	 * @expectedIncorrectUsage _gutenberg_resolve_ai_provider_logo_url
	 */
	public function test_returns_null_and_triggers_doing_it_wrong_for_path_outside_plugin_dirs() {
		$result = _gutenberg_resolve_ai_provider_logo_url( '/some/random/path/logo.svg' );
		$this->assertNull( $result );
	}
}
