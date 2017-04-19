<?php

if ( is_multisite() ) :
/**
 * Test 'site_details' functionality.
 *
 * @group ms-site
 * @group multisite
 */
class Tests_Multisite_Site_Details extends WP_UnitTestCase {
	/**
	 * @dataProvider data_whitelisted_options
	 *
	 * @ticket 40063
	 */
	public function test_update_whitelisted_option_deletes_site_details_cache( $whitelisted_option, $temporary_value ) {
		$site = get_site();

		$original_value = $site->$whitelisted_option;
		update_option( $whitelisted_option, $temporary_value );

		$cached_result = wp_cache_get( $site->id, 'site-details' );

		/* Reset to original value. */
		update_option( $whitelisted_option, $original_value );

		$this->assertFalse( $cached_result );
	}

	/**
	 * @dataProvider data_whitelisted_options
	 *
	 * @ticket 40063
	 */
	public function test_update_whitelisted_option_deletes_blog_details_cache( $whitelisted_option, $temporary_value ) {
		$blog_details = get_blog_details();

		$original_value = $blog_details->$whitelisted_option;
		update_option( $whitelisted_option, $temporary_value );

		$cached_result = wp_cache_get( $blog_details->id, 'blog-details' );

		/* Reset to original value. */
		update_option( $whitelisted_option, $original_value );

		$this->assertFalse( $cached_result );
	}

	/**
	 * @dataProvider data_whitelisted_options
	 *
	 * @ticket 40063
	 */
	public function test_update_whitelisted_option_does_not_delete_site_cache( $whitelisted_option, $temporary_value ) {
		$site = get_site();

		$original_value = $site->$whitelisted_option;
		update_option( $whitelisted_option, $temporary_value );

		$cached_result = wp_cache_get( $site->id, 'sites' );

		/* Reset to original value. */
		update_option( $whitelisted_option, $original_value );

		$this->assertNotFalse( $cached_result );
	}

	/**
	 * @dataProvider data_whitelisted_options
	 *
	 * @ticket 40063
	 */
	public function test_update_whitelisted_option_does_not_delete_short_blog_details_cache( $whitelisted_option, $temporary_value ) {
		$blog_details = get_blog_details( null, false );

		$original_value = get_option( $whitelisted_option );
		update_option( $whitelisted_option, $temporary_value );

		$cached_result = wp_cache_get( $blog_details->id . 'short', 'blog-details' );

		/* Reset to original value. */
		update_option( $whitelisted_option, $original_value );

		$this->assertNotFalse( $cached_result );
	}

	/**
	 * @dataProvider data_whitelisted_options
	 *
	 * @ticket 40063
	 */
	public function test_update_whitelisted_option_does_not_update_sites_last_changed( $whitelisted_option, $temporary_value ) {
		$last_changed = wp_cache_get_last_changed( 'sites' );

		$original_value = get_option( $whitelisted_option );
		update_option( $whitelisted_option, $temporary_value );

		$new_last_changed = wp_cache_get_last_changed( 'sites' );

		/* Reset to original value. */
		update_option( $whitelisted_option, $original_value );

		$this->assertSame( $new_last_changed, $last_changed );
	}

	public function data_whitelisted_options() {
		return array(
			array( 'blogname', 'Custom Site' ),
			array( 'home', 'http://custom-site-url.org' ),
			array( 'siteurl', 'http://custom-site-url.org' ),
			array( 'post_count', '4' ),
		);
	}

	/**
	 * @ticket 40063
	 */
	public function test_update_random_blog_option_does_not_delete_cache() {
		$site = get_site();

		update_option( 'foobar_option', 'foobar_value' );
		$cached_result = wp_cache_get( $site->id, 'sites' );

		delete_option( 'foobar_option' );

		$this->assertNotFalse( $cached_result );
	}

	/**
	 * @ticket 40247
	 */
	public function test_site_details_cached_including_false_values() {
		$id = self::factory()->blog->create();

		$site = get_site( $id );

		// Trigger retrieving site details (post_count is not set on new sites)
		$post_count = $site->post_count;

		$cached_details = wp_cache_get( $site->id, 'site-details' );

		wpmu_delete_blog( $id, true );
		wp_update_network_site_counts();

		$this->assertNotFalse( $cached_details );
	}

	public function test_site_details_filter_with_blogname() {
		add_filter( 'site_details', array( $this, '_filter_site_details_blogname' ) );
		$site = get_site();
		$blogname = $site->blogname;
		remove_filter( 'site_details', array( $this, '_filter_site_details_blogname' ) );

		$this->assertSame( 'Foo Bar', $blogname );
	}

	public function _filter_site_details_blogname( $details ) {
		$details->blogname = 'Foo Bar';
		return $details;
	}

	/**
	 * @ticket 40458
	 */
	public function test_site_details_filter_with_custom_value_isetter() {
		add_filter( 'site_details', array( $this, '_filter_site_details_custom_value' ) );
		$site = get_site();
		$custom_value_isset = isset( $site->custom_value );
		remove_filter( 'site_details', array( $this, '_filter_site_details_custom_value' ) );

		$this->assertTrue( $custom_value_isset );
	}

	/**
	 * @ticket 40458
	 */
	public function test_site_details_filter_with_custom_value_getter() {
		add_filter( 'site_details', array( $this, '_filter_site_details_custom_value' ) );
		$site = get_site();
		$custom_value = $site->custom_value;
		remove_filter( 'site_details', array( $this, '_filter_site_details_custom_value' ) );

		$this->assertSame( 'foo', $custom_value );
	}

	public function _filter_site_details_custom_value( $details ) {
		$details->custom_value = 'foo';
		return $details;
	}
}

endif;
