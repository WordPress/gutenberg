<?php

if ( is_multisite() ) :

/**
 * Tests specific to networks in multisite.
 *
 * @group ms-network
 * @group multisite
 */
class Tests_Multisite_Network extends WP_UnitTestCase {
	protected $plugin_hook_count = 0;
	protected $suppress = false;

	function setUp() {
		global $wpdb;
		parent::setUp();
		$this->suppress = $wpdb->suppress_errors();

		$_SERVER[ 'REMOTE_ADDR' ] = '';
	}

	function tearDown() {
		global $wpdb, $current_site;
		$wpdb->suppress_errors( $this->suppress );
		$current_site->id = 1;
		parent::tearDown();
	}

	/**
	 * By default, only one network exists and has a network ID of 1.
	 */
	function test_get_main_network_id_default() {
		$this->assertEquals( 1, get_main_network_id() );
	}

	/**
	 * If a second network is created, network ID 1 should still be returned
	 * as the main network ID.
	 */
	function test_get_main_network_id_two_networks() {
		$this->factory->network->create();

		$this->assertEquals( 1, get_main_network_id() );
	}

	/**
	 * When the `$current_site` global is populated with another network, the
	 * main network should still return as 1.
	 */
	function test_get_main_network_id_after_network_switch() {
		global $current_site;

		$id = $this->factory->network->create();

		$current_site->id = (int) $id;

		$this->assertEquals( 1, get_main_network_id() );
	}

	/**
	 * When the first network is removed, the next should return as the main
	 * network ID.
	 *
	 * @todo In the future, we'll have a smarter way of deleting a network. For now,
	 * fake the process with UPDATE queries.
	 */
	function test_get_main_network_id_after_network_delete() {
		global $wpdb, $current_site;
		$id = $this->factory->network->create();

		$current_site->id = (int) $id;
		$wpdb->query( "UPDATE {$wpdb->site} SET id=100 WHERE id=1" );
		$this->assertEquals( $id, get_main_network_id() );
		$wpdb->query( "UPDATE {$wpdb->site} SET id=1 WHERE id=100" );
	}

	function test_get_main_network_id_filtered() {
		add_filter( 'get_main_network_id', array( $this, '_get_main_network_id' ) );
		$this->assertEquals( 3, get_main_network_id() );
		remove_filter( 'get_main_network_id', array( $this, '_get_main_network_id' ) );
	}

	function _get_main_network_id() {
		return 3;
	}

	/**
	 * @ticket 22917
	 */
	function test_enable_live_network_site_counts_filter() {
		$site_count_start = get_blog_count();
		// false for large networks by default
		add_filter( 'enable_live_network_counts', '__return_false' );
		$this->factory->blog->create_many( 4 );

		// count only updated when cron runs, so unchanged
		$this->assertEquals( $site_count_start, (int) get_blog_count() );

		add_filter( 'enable_live_network_counts', '__return_true' );
		$site_ids = $this->factory->blog->create_many( 4 );

		$this->assertEquals( $site_count_start + 9, (int) get_blog_count() );

		//clean up
		remove_filter( 'enable_live_network_counts', '__return_false' );
		remove_filter( 'enable_live_network_counts', '__return_true' );
		foreach ( $site_ids as $site_id ) {
			wpmu_delete_blog( $site_id, true );
		}
	}
	/**
	 * @ticket 22917
	 */
	function test_enable_live_network_user_counts_filter() {
		// false for large networks by default
		add_filter( 'enable_live_network_counts', '__return_false' );

		// Refresh the cache
		wp_update_network_counts();
		$start_count = get_user_count();

		wpmu_create_user( 'user', 'pass', 'email' );

		// No change, cache not refreshed
		$count = get_user_count();

		$this->assertEquals( $start_count, $count );

		wp_update_network_counts();
		$start_count = get_user_count();

		add_filter( 'enable_live_network_counts', '__return_true' );

		wpmu_create_user( 'user2', 'pass2', 'email2' );

		$count = get_user_count();
		$this->assertEquals( $start_count + 1, $count );

		remove_filter( 'enable_live_network_counts', '__return_false' );
		remove_filter( 'enable_live_network_counts', '__return_true' );
	}

	function test_active_network_plugins() {
		$path = "hello.php";

		// local activate, should be invisible for the network
		activate_plugin($path); // $network_wide = false
		$active_plugins = wp_get_active_network_plugins();
		$this->assertEquals( Array(), $active_plugins );

		add_action( 'deactivated_plugin', array( $this, '_helper_deactivate_hook' ) );

		// activate the plugin sitewide
		activate_plugin($path, '', $network_wide = true);
		$active_plugins = wp_get_active_network_plugins();
		$this->assertEquals( Array(WP_PLUGIN_DIR . '/hello.php'), $active_plugins );

		//deactivate the plugin
		deactivate_plugins($path);
		$active_plugins = wp_get_active_network_plugins();
		$this->assertEquals( Array(), $active_plugins );

		$this->assertEquals( 1, $this->plugin_hook_count ); // testing actions and silent mode

		activate_plugin($path, '', $network_wide = true);
		deactivate_plugins($path, true); // silent

		$this->assertEquals( 1, $this->plugin_hook_count ); // testing actions and silent mode
	}

	/**
	 * @ticket 28651
	 */
	function test_duplicate_network_active_plugin() {
		$path = "hello.php";
		$mock = new MockAction();
		add_action( 'activate_' . $path, array ( $mock, 'action' ) );

		// should activate on the first try
		activate_plugin( $path, '', true );
		$active_plugins = wp_get_active_network_plugins();
		$this->assertCount( 1, $active_plugins );
		$this->assertEquals( 1, $mock->get_call_count() );

		// should do nothing on the second try
		activate_plugin( $path, '', true );
		$active_plugins = wp_get_active_network_plugins();
		$this->assertCount( 1, $active_plugins );
		$this->assertEquals( 1, $mock->get_call_count() );

		remove_action( 'activate_' . $path, array ( $mock, 'action' ) );
	}

	function test_is_plugin_active_for_network_true() {
		activate_plugin( 'hello.php', '', true );
		$this->assertTrue( is_plugin_active_for_network( 'hello.php' ) );
	}

	function test_is_plugin_active_for_network_false() {
		deactivate_plugins( 'hello.php', false, true );
		$this->assertFalse( is_plugin_active_for_network( 'hello.php' ) );
	}

	function _helper_deactivate_hook() {
		$this->plugin_hook_count++;
	}

	function test_get_user_count() {
		// Refresh the cache
		wp_update_network_counts();
		$start_count = get_user_count();

		// Only false for large networks as of 3.7
		add_filter( 'enable_live_network_counts', '__return_false' );
		$this->factory->user->create( array( 'role' => 'administrator' ) );

		$count = get_user_count(); // No change, cache not refreshed
		$this->assertEquals( $start_count, $count );

		wp_update_network_counts(); // Magic happens here

		$count = get_user_count();
		$this->assertEquals( $start_count + 1, $count );
		remove_filter( 'enable_live_network_counts', '__return_false' );
	}

	function test_wp_schedule_update_network_counts() {
		$this->assertFalse(wp_next_scheduled('update_network_counts'));

		// We can't use wp_schedule_update_network_counts() because WP_INSTALLING is set
		wp_schedule_event(time(), 'twicedaily', 'update_network_counts');

		$this->assertInternalType('int', wp_next_scheduled('update_network_counts'));
	}

	/**
	 * @expectedDeprecated get_dashboard_blog
	 */
	function test_get_dashboard_blog() {
		// if there is no dashboard blog set, current blog is used
		$dashboard_blog = get_dashboard_blog();
		$this->assertEquals( 1, $dashboard_blog->blog_id );

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$blog_id = $this->factory->blog->create( array( 'user_id' => $user_id ) );
		$this->assertInternalType( 'int', $blog_id );

		// set the dashboard blog to another one
		update_site_option( 'dashboard_blog', $blog_id );
		$dashboard_blog = get_dashboard_blog();
		$this->assertEquals( $blog_id, $dashboard_blog->blog_id );
	}
}

endif;
