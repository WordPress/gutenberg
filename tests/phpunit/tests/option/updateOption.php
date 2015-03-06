<?php

/**
 * @group option
 */
class Tests_Option_UpdateOption extends WP_UnitTestCase {
	/**
	 * @ticket 31047
	 */
	public function test_should_respect_default_option_filter_when_option_does_not_yet_exist_in_database() {
		add_filter( 'default_option_doesnotexist', array( $this, '__return_foo' ) );
		$added = update_option( 'doesnotexist', 'bar' );
		remove_filter( 'default_option_doesnotexist', array( $this, '__return_foo' ) );

		$this->assertTrue( $added );
		$this->assertSame( 'bar', get_option( 'doesnotexist' ) );
	}

	/**
	 * @ticket 26394
	 */
	public function test_should_set_autoload_yes_for_nonexistent_option_when_autoload_param_is_missing() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING, which causes cache misses.' );
		}

		global $wpdb;
		wp_cache_flush();
		update_option( 'test_update_option_default', 'value' );
		wp_cache_flush();

		// Populate the alloptions cache, which includes autoload=yes options.
		wp_load_alloptions();

		$before = $wpdb->num_queries;
		$value = get_option( 'test_update_option_default' );
		$after = $wpdb->num_queries;

		$this->assertEquals( $before, $after );
		$this->assertEquals( $value, 'value' );
	}

	/**
	 * @ticket 26394
	 */
	public function test_should_set_autoload_yes_for_nonexistent_option_when_autoload_param_is_yes() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING, which causes cache misses.' );
		}

		global $wpdb;
		wp_cache_flush();
		update_option( 'test_update_option_default', 'value', 'yes' );
		wp_cache_flush();

		// Populate the alloptions cache, which includes autoload=yes options.
		wp_load_alloptions();

		$before = $wpdb->num_queries;
		$value = get_option( 'test_update_option_default' );
		$after = $wpdb->num_queries;

		$this->assertEquals( $before, $after );
		$this->assertEquals( $value, 'value' );
	}

	/**
	 * @ticket 26394
	 */
	public function test_should_set_autoload_yes_for_nonexistent_option_when_autoload_param_is_no() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING, which causes cache misses.' );
		}

		global $wpdb;
		wp_cache_flush();
		update_option( 'test_update_option_default', 'value', 'no' );
		wp_cache_flush();

		// Populate the alloptions cache, which does not include autoload=no options.
		wp_load_alloptions();

		$before = $wpdb->num_queries;
		$value = get_option( 'test_update_option_default' );
		$after = $wpdb->num_queries;

		// Database has been hit.
		$this->assertEquals( $before + 1, $after );
		$this->assertEquals( $value, 'value' );
	}

	/**
	 * @ticket 26394
	 */
	public function test_should_set_autoload_yes_for_nonexistent_option_when_autoload_param_is_false() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING, which causes cache misses.' );
		}

		global $wpdb;
		wp_cache_flush();
		update_option( 'test_update_option_default', 'value', false );
		wp_cache_flush();

		// Populate the alloptions cache, which does not include autoload=no options.
		wp_load_alloptions();

		$before = $wpdb->num_queries;
		$value = get_option( 'test_update_option_default' );
		$after = $wpdb->num_queries;

		// Database has been hit.
		$this->assertEquals( $before + 1, $after );
		$this->assertEquals( $value, 'value' );
	}

	/**
	 * @group 26394
	 */
	public function test_autoload_should_be_updated_for_existing_option_when_value_is_changed() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING, which causes cache misses.' );
		}

		global $wpdb;
		add_option( 'foo', 'bar', '', 'no' );
		$updated = update_option( 'foo', 'bar2', true );
		$this->assertTrue( $updated );

		wp_cache_flush();

		// Populate the alloptions cache, which includes autoload=yes options.
		wp_load_alloptions();

		$before = $wpdb->num_queries;
		$value = get_option( 'foo' );

		$this->assertEquals( $before, $wpdb->num_queries );
		$this->assertEquals( $value, 'bar2' );
	}

	/**
	 * @group 26394
	 */
	public function test_autoload_should_not_be_updated_for_existing_option_when_value_is_unchanged() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING, which causes cache misses.' );
		}

		global $wpdb;
		add_option( 'foo', 'bar', '', 'yes' );
		$updated = update_option( 'foo', 'bar', false );
		$this->assertFalse( $updated );

		wp_cache_flush();

		// Populate the alloptions cache, which includes autoload=yes options.
		wp_load_alloptions();

		$before = $wpdb->num_queries;
		$value = get_option( 'foo' );

		// 'foo' should still be autoload=yes, so we should see no additional querios.
		$this->assertEquals( $before, $wpdb->num_queries );
		$this->assertEquals( $value, 'bar' );
	}

	/**
	 * @group 26394
	 */
	public function test_autoload_should_not_be_updated_for_existing_option_when_value_is_changed_but_no_value_of_autoload_is_provided() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING, which causes cache misses.' );
		}

		global $wpdb;
		add_option( 'foo', 'bar', '', 'yes' );

		// Don't pass a value for `$autoload`.
		$updated = update_option( 'foo', 'bar2' );
		$this->assertTrue( $updated );

		wp_cache_flush();

		// Populate the alloptions cache, which includes autoload=yes options.
		wp_load_alloptions();

		$before = $wpdb->num_queries;
		$value = get_option( 'foo' );

		// 'foo' should still be autoload=yes, so we should see no additional querios.
		$this->assertEquals( $before, $wpdb->num_queries );
		$this->assertEquals( $value, 'bar2' );
	}

	/**
	 * `add_filter()` callback for test_should_respect_default_option_filter_when_option_does_not_yet_exist_in_database().
	 */
	public function __return_foo() {
		return 'foo';
	}
}
