<?php
/**
 * Tests for turning off auto-attach of media when attachment pages are enabled.
 *
 * @package gutenberg
 */

/**
 * @covers ::gutenberg_disable_auto_attach_media_with_attachment_pages
 */
class Gutenberg_Disable_Auto_Attach_Media_Test extends WP_UnitTestCase {
	public function test_disables_auto_attach_when_attachment_pages_enabled() {
		update_option( 'wp_attachment_pages_enabled', '1' );

		$settings = apply_filters( 'block_editor_settings_all', array(), new WP_Block_Editor_Context() );

		$this->assertFalse( $settings['autoAttachMediaEnabled'] );
	}

	public function test_leaves_setting_unset_when_attachment_pages_disabled() {
		update_option( 'wp_attachment_pages_enabled', '0' );

		$settings = apply_filters( 'block_editor_settings_all', array(), new WP_Block_Editor_Context() );

		$this->assertArrayNotHasKey( 'autoAttachMediaEnabled', $settings );
	}

	public function test_site_filter_can_turn_auto_attach_back_on() {
		update_option( 'wp_attachment_pages_enabled', '1' );

		$enable = static function ( $settings ) {
			$settings['autoAttachMediaEnabled'] = true;
			return $settings;
		};
		add_filter( 'block_editor_settings_all', $enable );

		$settings = apply_filters( 'block_editor_settings_all', array(), new WP_Block_Editor_Context() );

		remove_filter( 'block_editor_settings_all', $enable );

		$this->assertTrue( $settings['autoAttachMediaEnabled'] );
	}
}
