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
		$logo_path = WP_PLUGIN_DIR . '/my-plugin/logo.svg';

		// Create the file so file_exists() passes.
		wp_mkdir_p( dirname( $logo_path ) );
		file_put_contents( $logo_path, '<svg></svg>' );

		try {
			$result = _gutenberg_resolve_ai_provider_logo_url( $logo_path );
			$this->assertSame( site_url( '/wp-content/plugins/my-plugin/logo.svg' ), $result );
		} finally {
			unlink( $logo_path );
			rmdir( dirname( $logo_path ) );
		}
	}

	public function test_resolves_mu_plugin_dir_path_to_url() {
		$logo_path = WPMU_PLUGIN_DIR . '/my-mu-plugin/logo.svg';

		// Create the file so file_exists() passes.
		wp_mkdir_p( dirname( $logo_path ) );
		file_put_contents( $logo_path, '<svg></svg>' );

		try {
			$result = _gutenberg_resolve_ai_provider_logo_url( $logo_path );
			$this->assertSame( site_url( '/wp-content/mu-plugins/my-mu-plugin/logo.svg' ), $result );
		} finally {
			unlink( $logo_path );
			rmdir( dirname( $logo_path ) );
		}
	}

	public function test_returns_null_when_file_does_not_exist() {
		$result = _gutenberg_resolve_ai_provider_logo_url( WP_PLUGIN_DIR . '/nonexistent/logo.svg' );
		$this->assertNull( $result );
	}

	/**
	 * @expectedIncorrectUsage _gutenberg_resolve_ai_provider_logo_url
	 */
	public function test_returns_null_and_triggers_doing_it_wrong_for_path_outside_plugin_dirs() {
		$tmp_file = tempnam( sys_get_temp_dir(), 'logo_' );
		file_put_contents( $tmp_file, '<svg></svg>' );

		try {
			$result = _gutenberg_resolve_ai_provider_logo_url( $tmp_file );
			$this->assertNull( $result );
		} finally {
			unlink( $tmp_file );
		}
	}
}
