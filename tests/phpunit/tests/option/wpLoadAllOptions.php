<?php
/**
 * Test wp_load_alloptions().
 *
 * @group option
 */
class Tests_Option_WP_Load_Alloptions extends WP_UnitTestCase {
	protected $alloptions = null;

	function tearDown() {
		$this->alloptions = null;
		parent::tearDown();
	}

	function test_if_alloptions_is_cached() {
		$this->assertNotEmpty( wp_cache_get( 'alloptions', 'options' ) );
	}

	/**
	 * @depends test_if_alloptions_is_cached
	 */
	function test_if_cached_alloptions_is_deleted() {
		$this->assertTrue( wp_cache_delete( 'alloptions', 'options' ) );
	}

	/**
	 * @depends test_if_alloptions_is_cached
	 */
	function test_if_alloptions_are_retrieved_from_cache() {
		global $wpdb;
		$before = $wpdb->num_queries;
		wp_load_alloptions();
		$after = $wpdb->num_queries;

		// Database has not been hit.
		$this->assertEquals( $before, $after );
	}

	/**
	 * @depends test_if_cached_alloptions_is_deleted
	 */
	function test_if_alloptions_are_retrieved_from_database() {
		global $wpdb;

		// Delete the existing cache first.
		wp_cache_delete( 'alloptions', 'options' );

		$before = $wpdb->num_queries;
		wp_load_alloptions();
		$after = $wpdb->num_queries;

		// Database has been hit.
		$this->assertEquals( $before + 1, $after );
	}

	/**
	 * @depends test_if_cached_alloptions_is_deleted
	 */
	function test_filter_pre_cache_alloptions_is_called() {
		$temp = wp_installing();

		/**
		 * Set wp_installing() to false.
		 *
		 * If wp_installing is false and the cache is empty, the filter is called regardless if it's multisite or not.
		 */
		wp_installing( false );

		// Delete the existing cache first.
		wp_cache_delete( 'alloptions', 'options' );

		add_filter( 'pre_cache_alloptions', array( $this, 'return_pre_cache_filter' ) );
		$all_options = wp_load_alloptions();

		// Value could leak to other tests if not reset.
		wp_installing( $temp  );

		// Filter was called.
		$this->assertEquals( $this->alloptions, $all_options );
	}

	/**
	 * @depends test_if_alloptions_is_cached
	 */
	function test_filter_pre_cache_alloptions_is_not_called() {
		$temp = wp_installing();

		/**
		 * Set wp_installing() to true.
		 *
		 * If wp_installing is true and it's multisite, the cache and filter are not used.
		 * If wp_installing is true and it's not multisite, the cache is used (if not empty), and the filter not.
		 */
		wp_installing( true );

		add_filter( 'pre_cache_alloptions', array( $this, 'return_pre_cache_filter' ) );
		wp_load_alloptions();

		// Value could leak to other tests if not reset.
		wp_installing( $temp );

		// Filter was not called.
		$this->assertNull( $this->alloptions );
	}

	function return_pre_cache_filter( $alloptions ) {
		return $this->alloptions = $alloptions;
	}
}
