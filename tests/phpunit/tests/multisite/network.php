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

	protected static $different_network_id;
	protected static $different_site_ids = array();

	function setUp() {
		global $wpdb;
		parent::setUp();
		$this->suppress = $wpdb->suppress_errors();
	}

	function tearDown() {
		global $wpdb, $current_site;
		$wpdb->suppress_errors( $this->suppress );
		$current_site->id = 1;
		parent::tearDown();
	}

	public static function wpSetUpBeforeClass( $factory ) {
		self::$different_network_id = $factory->network->create( array( 'domain' => 'wordpress.org', 'path' => '/' ) );

		$sites = array(
			array( 'domain' => 'wordpress.org', 'path' => '/',     'site_id' => self::$different_network_id ),
			array( 'domain' => 'wordpress.org', 'path' => '/foo/', 'site_id' => self::$different_network_id ),
			array( 'domain' => 'wordpress.org', 'path' => '/bar/', 'site_id' => self::$different_network_id ),
		);

		foreach ( $sites as $site ) {
			self::$different_site_ids[] = $factory->blog->create( $site );
		}
	}

	public static function wpTearDownAfterClass() {
		global $wpdb;

		foreach( self::$different_site_ids as $id ) {
			wpmu_delete_blog( $id, true );
		}

		$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->sitemeta} WHERE site_id = %d", self::$different_network_id ) );
		$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->site} WHERE id= %d", self::$different_network_id ) );

		wp_update_network_site_counts();
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
		self::factory()->network->create();

		$this->assertEquals( 1, get_main_network_id() );
	}

	/**
	 * When the `$current_site` global is populated with another network, the
	 * main network should still return as 1.
	 */
	function test_get_main_network_id_after_network_switch() {
		global $current_site;

		$id = self::factory()->network->create();

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

		$temp_id = self::$different_network_id + 1;

		$current_site->id = (int) self::$different_network_id;
		$wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->site} SET id=%d WHERE id=1", $temp_id ) );
		$main_network_id = get_main_network_id();
		$wpdb->query( $wpdb->prepare( "UPDATE {$wpdb->site} SET id=1 WHERE id=%d", $temp_id ) );

		$this->assertEquals( self::$different_network_id, $main_network_id );
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
	 * @ticket 37050
	 */
	function test_wp_network_object_id_property_is_int() {
		$id = self::factory()->network->create();

		$network = WP_Network::get_instance( $id );

		$this->assertSame( (int) $id, $network->id );
	}

	/**
	 * @ticket 22917
	 */
	public function test_get_blog_count_no_filter_applied() {
		wp_update_network_counts();
		$site_count_start = get_blog_count();

		$site_ids = self::factory()->blog->create_many( 1 );
		$actual = (int) get_blog_count(); // count only updated when cron runs, so unchanged

		foreach ( $site_ids as $site_id ) {
			wpmu_delete_blog( $site_id, true );
		}
		wp_update_network_counts();

		$this->assertEquals( $site_count_start + 1, $actual );
	}

	/**
	 * @ticket 22917
	 */
	public function test_get_blog_count_enable_live_network_counts_false() {
		wp_update_network_counts();
		$site_count_start = get_blog_count();

		add_filter( 'enable_live_network_counts', '__return_false' );
		$site_ids = self::factory()->blog->create_many( 1 );
		$actual = (int) get_blog_count(); // count only updated when cron runs, so unchanged
		remove_filter( 'enable_live_network_counts', '__return_false' );

		foreach ( $site_ids as $site_id ) {
			wpmu_delete_blog( $site_id, true );
		}
		wp_update_network_counts();

		$this->assertEquals( $site_count_start, $actual );
	}

	/**
	 * @ticket 22917
	 */
	public function test_get_blog_count_enabled_live_network_counts_true() {
		wp_update_network_counts();
		$site_count_start = get_blog_count();

		add_filter( 'enable_live_network_counts', '__return_true' );
		$site_ids = self::factory()->blog->create_many( 1 );
		$actual = get_blog_count();
		remove_filter( 'enable_live_network_counts', '__return_true' );

		foreach ( $site_ids as $site_id ) {
			wpmu_delete_blog( $site_id, true );
		}
		wp_update_network_counts();

		$this->assertEquals( $site_count_start + 1, $actual );
	}

	/**
	 * @ticket 37865
	 */
	public function test_get_blog_count_on_different_network() {
		global $current_site, $wpdb;

		// switch_to_network()...
		$orig_network_id = $current_site->id;
		$orig_wpdb_network_id = $wpdb->siteid;
		$current_site->id = self::$different_network_id;
		$wpdb->siteid = self::$different_network_id;
		wp_update_network_site_counts();
		$current_site->id = $orig_network_id;
		$wpdb->siteid = $orig_wpdb_network_id;

		$site_count = get_blog_count( self::$different_network_id );

		$this->assertSame( count( self::$different_site_ids ), $site_count );
	}

	/**
	 * @ticket 37866
	 */
	public function test_get_user_count_on_different_network() {
		global $current_site, $wpdb;

		wp_update_network_user_counts();
		$current_network_user_count = get_user_count();

		// switch_to_network()...
		$orig_network_id = $current_site->id;
		$orig_wpdb_network_id = $wpdb->siteid;
		$current_site->id = self::$different_network_id;
		$wpdb->siteid = self::$different_network_id;

		// Add another user to fake the network user count to be different.
		wpmu_create_user( 'user', 'pass', 'email' );

		wp_update_network_user_counts();

		// restore_current_network()...
		$current_site->id = $orig_network_id;
		$wpdb->siteid = $orig_wpdb_network_id;

		$user_count = get_user_count( self::$different_network_id );

		$this->assertEquals( $current_network_user_count + 1, $user_count );
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
		self::factory()->user->create( array( 'role' => 'administrator' ) );

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

		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$blog_id = self::factory()->blog->create( array( 'user_id' => $user_id ) );
		$this->assertInternalType( 'int', $blog_id );

		// set the dashboard blog to another one
		update_site_option( 'dashboard_blog', $blog_id );
		$dashboard_blog = get_dashboard_blog();
		$this->assertEquals( $blog_id, $dashboard_blog->blog_id );
	}

	/**
	 * @ticket 37528
	 */
	function test_wp_update_network_site_counts() {
		update_network_option( null, 'blog_count', 40 );

		$expected = get_sites( array(
			'network_id' => get_current_network_id(),
			'spam'       => 0,
			'deleted'    => 0,
			'archived'   => 0,
			'count'      => true,
		) );

		wp_update_network_site_counts();

		$result = get_blog_count();
		$this->assertEquals( $expected, $result );
	}

	/**
	 * @ticket 37528
	 */
	function test_wp_update_network_site_counts_on_different_network() {
		update_network_option( self::$different_network_id, 'blog_count', 40 );

		wp_update_network_site_counts( self::$different_network_id );

		$result = get_blog_count( self::$different_network_id );
		$this->assertEquals( 3, $result );
	}

	/**
	 * @ticket 40349
	 */
	public function test_wp_update_network_user_counts() {
		global $wpdb;

		update_network_option( null, 'user_count', 40 );

		$expected = $wpdb->get_var( "SELECT COUNT(ID) as c FROM $wpdb->users WHERE spam = '0' AND deleted = '0'" );

		wp_update_network_user_counts();

		$result = get_user_count();
		$this->assertEquals( $expected, $result );
	}

	/**
	 * @ticket 40349
	 */
	public function test_wp_update_network_user_counts_on_different_network() {
		global $wpdb;

		update_network_option( self::$different_network_id, 'user_count', 40 );

		$expected = $wpdb->get_var( "SELECT COUNT(ID) as c FROM $wpdb->users WHERE spam = '0' AND deleted = '0'" );

		wp_update_network_user_counts( self::$different_network_id );

		$result = get_user_count( self::$different_network_id );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * @ticket 40386
	 */
	public function test_wp_update_network_counts() {
		delete_network_option( null, 'site_count' );
		delete_network_option( null, 'user_count' );

		wp_update_network_counts();

		$site_count = (int) get_blog_count();
		$user_count = (int) get_user_count();

		$this->assertTrue( $site_count > 0 && $user_count > 0 );
	}

	/**
	 * @ticket 40386
	 */
	public function test_wp_update_network_counts_on_different_network() {
		delete_network_option( self::$different_network_id, 'site_count' );
		delete_network_option( self::$different_network_id, 'user_count' );

		wp_update_network_counts( self::$different_network_id );

		$site_count = (int) get_blog_count( self::$different_network_id );
		$user_count = (int) get_user_count( self::$different_network_id );

		$this->assertTrue( $site_count > 0 && $user_count > 0 );
	}

	/**
	 * @ticket 40489
	 * @dataProvider data_wp_is_large_network
	 */
	public function test_wp_is_large_network( $using, $count, $expected, $different_network ) {
		$network_id = $different_network ? self::$different_network_id : null;
		$network_option = 'users' === $using ? 'user_count' : 'blog_count';

		update_network_option( $network_id, $network_option, $count );

		$result = wp_is_large_network( $using, $network_id );
		if ( $expected ) {
			$this->assertTrue( $result );
		} else {
			$this->assertFalse( $result );
		}
	}

	public function data_wp_is_large_network() {
		return array(
			array( 'sites', 10000, false, false ),
			array( 'sites', 10001, true, false ),
			array( 'users', 10000, false, false ),
			array( 'users', 10001, true, false ),
			array( 'sites', 10000, false, true ),
			array( 'sites', 10001, true, true ),
			array( 'users', 10000, false, true ),
			array( 'users', 10001, true, true ),
		);
	}

	/**
	 * @ticket 40489
	 * @dataProvider data_wp_is_large_network_filtered_by_component
	 */
	public function test_wp_is_large_network_filtered_by_component( $using, $count, $expected, $different_network ) {
		$network_id = $different_network ? self::$different_network_id : null;
		$network_option = 'users' === $using ? 'user_count' : 'blog_count';

		update_network_option( $network_id, $network_option, $count );

		add_filter( 'wp_is_large_network', array( $this, 'filter_wp_is_large_network_for_users' ), 10, 3 );
		$result = wp_is_large_network( $using, $network_id );
		remove_filter( 'wp_is_large_network', array( $this, 'filter_wp_is_large_network_for_users' ), 10 );

		if ( $expected ) {
			$this->assertTrue( $result );
		} else {
			$this->assertFalse( $result );
		}
	}

	public function data_wp_is_large_network_filtered_by_component() {
		return array(
			array( 'sites', 10000, false, false ),
			array( 'sites', 10001, true, false ),
			array( 'users', 1000, false, false ),
			array( 'users', 1001, true, false ),
			array( 'sites', 10000, false, true ),
			array( 'sites', 10001, true, true ),
			array( 'users', 1000, false, true ),
			array( 'users', 1001, true, true ),
		);
	}

	public function filter_wp_is_large_network_for_users( $is_large_network, $using, $count ) {
		if ( 'users' === $using ) {
			return $count > 1000;
		}

		return $is_large_network;
	}

	/**
	 * @ticket 40489
	 * @dataProvider data_wp_is_large_network_filtered_by_network
	 */
	public function test_wp_is_large_network_filtered_by_network( $using, $count, $expected, $different_network ) {
		$network_id = $different_network ? self::$different_network_id : null;
		$network_option = 'users' === $using ? 'user_count' : 'blog_count';

		update_network_option( $network_id, $network_option, $count );

		add_filter( 'wp_is_large_network', array( $this, 'filter_wp_is_large_network_on_different_network' ), 10, 4 );
		$result = wp_is_large_network( $using, $network_id );
		remove_filter( 'wp_is_large_network', array( $this, 'filter_wp_is_large_network_on_different_network' ), 10 );

		if ( $expected ) {
			$this->assertTrue( $result );
		} else {
			$this->assertFalse( $result );
		}
	}

	public function data_wp_is_large_network_filtered_by_network() {
		return array(
			array( 'sites', 10000, false, false ),
			array( 'sites', 10001, true, false ),
			array( 'users', 10000, false, false ),
			array( 'users', 10001, true, false ),
			array( 'sites', 1000, false, true ),
			array( 'sites', 1001, true, true ),
			array( 'users', 1000, false, true ),
			array( 'users', 1001, true, true ),
		);
	}

	public function filter_wp_is_large_network_on_different_network( $is_large_network, $using, $count, $network_id ) {
		if ( $network_id === (int) self::$different_network_id ) {
			return $count > 1000;
		}

		return $is_large_network;
	}
}

endif;
