<?php

if ( is_multisite() ) :

/**
 * @group ms-site
 * @group multisite
 */
class Tests_Multisite_WP_Get_Sites extends WP_UnitTestCase {

	/**
	 * Test the default arguments for wp_get_sites, which should return only
	 * public sites from the current network.
	 *
	 * @ticket 14511
	 * @expectedDeprecated wp_get_sites
	 */
	function test_wp_get_sites_with_default_arguments() {
		self::factory()->blog->create( array( 'site_id' => 2 ) );

		$this->assertCount( 1, wp_get_sites() );
	}

	/**
	 * No sites should match a query that specifies an invalid network ID.
	 *
	 * @expectedDeprecated wp_get_sites
	 */
	function test_wp_get_sites_with_invalid_network_id() {
		$this->assertcount( 0, wp_get_sites( array( 'network_id' => 999 ) ) );
	}

	/**
	 * A network ID of null should query for all public sites on all networks.
	 *
	 * @expectedDeprecated wp_get_sites
	 */
	function test_wp_get_sites_with_network_id_null() {
		self::factory()->blog->create( array( 'site_id' => 2 ) );

		$this->assertCount( 2, wp_get_sites( array( 'network_id' => null ) ) );
	}

	/**
	 * Expect only sites on the specified network ID to be returned.
	 *
	 * @expectedDeprecated wp_get_sites
	 */
	function test_wp_get_sites_with_specific_network_id() {
		self::factory()->blog->create( array( 'site_id' => 2 ) );

		$this->assertCount( 1, wp_get_sites( array( 'network_id' => 2 ) ) );
	}

	/**
	 * Expect sites from both networks if both network IDs are specified.
	 *
	 * @expectedDeprecated wp_get_sites
	 */
	function test_wp_get_sites_with_multiple_network_ids() {
		self::factory()->blog->create( array( 'site_id' => 2 ) );

		$this->assertCount( 2, wp_get_sites( array( 'network_id' => array( 1, 2 ) ) ) );
	}

	/**
	 * Queries for public or non public sites should work across all networks if network ID is null.
	 *
	 * @expectedDeprecated wp_get_sites
	 */
	function test_wp_get_sites_with_public_meta_on_all_networks() {
		self::factory()->blog->create( array( 'site_id' => 2, 'meta' => array( 'public' => 0 ) ) );

		$this->assertCount( 1, wp_get_sites( array( 'public' => 1, 'network_id' => null ) ) );
		$this->assertcount( 1, wp_get_sites( array( 'public' => 0, 'network_id' => null ) ) );
	}

	/**
	 * If a network ID is specified, queries for public sites should be restricted to that network.
	 *
	 * @expectedDeprecated wp_get_sites
	 */
	function test_wp_get_sites_with_public_meta_restrict_to_one_network() {
		self::factory()->blog->create( array( 'site_id' => 1, 'meta' => array( 'public' => 0 ) ) );

		$this->assertCount( 1, wp_get_sites( array( 'public' => 1, 'network_id' => 1 ) ) );
		$this->assertCount( 0, wp_get_sites( array( 'public' => 1, 'network_id' => 2 ) ) );
	}

	/**
	 * Test the limit and offset arguments for wp_get_sites when multiple sites are available.
	 *
	 * @expectedDeprecated wp_get_sites
	 */
	function test_wp_get_sites_limit_offset() {
		// Create 2 more sites (in addition to the default one)
		self::factory()->blog->create_many( 2 );

		// Expect first 2 sites when using limit
		$this->assertCount( 2, wp_get_sites( array( 'limit' => 2 ) ) );

		// Expect only the last 2 sites when using offset of 1 (limit will default to 100)
		$this->assertCount( 2, wp_get_sites( array( 'offset' => 1 ) ) );

		// Expect only the last 1 site when using offset of 2 and limit of 2
		$this->assertCount( 1, wp_get_sites( array( 'limit' => 2, 'offset' => 2 ) ) );
	}

	/**
	 * Expect 0 sites when using an offset larger than the total number of sites.
	 *
	 * @expectedDeprecated wp_get_sites
	 */
	function test_wp_get_sites_offset_greater_than_available_sites() {
		$this->assertCount( 0, wp_get_sites( array( 'offset' => 20 ) ) );
	}
}

endif;
