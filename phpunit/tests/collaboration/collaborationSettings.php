<?php
/**
 * Tests the collaboration settings.
 *
 * @package Gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */

class Tests_Collaboration_Settings extends WP_UnitTestCase {
	public function tear_down() {
		delete_option( 'wp_collaboration_enabled' );
		parent::tear_down();
	}

	public function test_collaboration_is_disabled_by_default() {
		global $wp_registered_settings;

		gutenberg_register_real_time_collaboration_setting();

		$this->assertFalse( $wp_registered_settings['wp_collaboration_enabled']['default'] );
	}

	public function test_activation_disables_collaboration_when_option_does_not_exist() {
		delete_option( 'wp_collaboration_enabled' );

		gutenberg_set_collaboration_option_on_activation();

		$this->assertSame( '0', get_option( 'wp_collaboration_enabled' ) );
	}

	public function test_activation_preserves_existing_collaboration_preference() {
		update_option( 'wp_collaboration_enabled', '1' );

		gutenberg_set_collaboration_option_on_activation();

		$this->assertSame( '1', get_option( 'wp_collaboration_enabled' ) );
	}
}
