<?php
/**
 * Tests the collaboration database migration.
 *
 * @package Gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */

class Tests_Collaboration_Upgrade extends WP_UnitTestCase {
	/**
	 * Stores an option directly in the database, bypassing test bootstrap filters.
	 *
	 * @param string $option_name Option name.
	 * @param mixed  $value       Option value.
	 */
	private function set_stored_option( $option_name, $value ) {
		global $wpdb;

		$wpdb->replace(
			$wpdb->options,
			array(
				'option_name'  => $option_name,
				'option_value' => maybe_serialize( $value ),
				'autoload'     => 'yes',
			)
		);
	}

	/**
	 * Gets an option directly from the database, bypassing test bootstrap filters.
	 *
	 * @param string $option_name Option name.
	 * @return mixed Stored option value.
	 */
	private function get_stored_option( $option_name ) {
		global $wpdb;

		$value = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT option_value FROM {$wpdb->options} WHERE option_name = %s",
				$option_name
			)
		);

		return maybe_unserialize( $value );
	}

	public function test_removes_legacy_collaboration_options_without_enabling_the_experiment() {
		// 23.7.2 shipped without this migration, so sites upgrading from any
		// 23.7.x release must still run it.
		update_option( 'gutenberg_version_migration', '23.7.2' );
		update_option( 'enable_real_time_collaboration', '1' );
		update_option( 'wp_enable_real_time_collaboration', '1' );
		update_option( 'wp_collaboration_enabled', '1' );
		$this->set_stored_option(
			'gutenberg-experiments',
			array( 'gutenberg-dashboard-widgets' => true )
		);

		_gutenberg_migrate_database();

		$this->assertFalse( get_option( 'enable_real_time_collaboration' ) );
		$this->assertFalse( get_option( 'wp_enable_real_time_collaboration' ) );
		$this->assertFalse( get_option( 'wp_collaboration_enabled' ) );
		$this->assertSame(
			array( 'gutenberg-dashboard-widgets' => true ),
			$this->get_stored_option( 'gutenberg-experiments' )
		);
		$this->assertSame( _GUTENBERG_VERSION_MIGRATION, get_option( 'gutenberg_version_migration' ) );
	}
}
