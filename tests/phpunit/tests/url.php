<?php

// tests for link-template.php and related URL functions
/**
 * @group url
 */
class Tests_URL extends WP_UnitTestCase {

	function setUp() {
		parent::setUp();
		$GLOBALS['pagenow'] = '';
	}

	/**
	 * @dataProvider data_is_ssl
	 */
	function test_is_ssl( $value, $expected ) {
		$_SERVER['HTTPS'] = $value;

		$is_ssl = is_ssl();
		$this->assertSame( $expected, $is_ssl );
	}

	function data_is_ssl() {
		return array(
			array(
				'on',
				true,
			),
			array(
				'ON',
				true,
			),
			array(
				'1',
				true,
			),
			array(
				'off',
				false,
			),
			array(
				'OFF',
				false,
			),
		);
	}

	function test_is_ssl_by_port() {
		unset( $_SERVER['HTTPS'] );
		$_SERVER['SERVER_PORT'] = '443';

		$is_ssl = is_ssl();
		$this->assertTrue( $is_ssl );
	}

	function test_is_ssl_with_no_value() {
		unset( $_SERVER['HTTPS'] );

		$is_ssl = is_ssl();
		$this->assertFalse( $is_ssl );
	}

	/**
	 * @dataProvider data_admin_urls
	 *
	 * @param string $url      Test URL.
	 * @param string $expected Expected result.
	 */
	function test_admin_url( $url, $expected ) {
		$siteurl_http   = get_option( 'siteurl' );
		$admin_url_http = admin_url( $url );

		$_SERVER['HTTPS'] = 'on';

		$siteurl_https   = set_url_scheme( $siteurl_http, 'https' );
		$admin_url_https = admin_url( $url );

		$this->assertEquals( $siteurl_http . $expected, $admin_url_http );
		$this->assertEquals( $siteurl_https . $expected, $admin_url_https );
	}

	function data_admin_urls() {
		return array(
			array(
				null,
				'/wp-admin/'
			),
			array(
				0,
				'/wp-admin/'
			),
			array(
				-1,
				'/wp-admin/'
			),
			array(
				'///',
				'/wp-admin/'
			),
			array(
				'',
				'/wp-admin/',
			),
			array(
				'foo',
				'/wp-admin/foo',
			),
			array(
				'/foo',
				'/wp-admin/foo',
			),
			array(
				'/foo/',
				'/wp-admin/foo/',
			),
			array(
				'foo.php',
				'/wp-admin/foo.php',
			),
			array(
				'/foo.php',
				'/wp-admin/foo.php',
			),
			array(
				'/foo.php?bar=1',
				'/wp-admin/foo.php?bar=1',
			),
		);
	}

	/**
	 * @dataProvider data_home_urls
	 *
	 * @param string $url      Test URL.
	 * @param string $expected Expected result.
	 */
	function test_home_url( $url, $expected ) {
		$homeurl_http  = get_option( 'home' );
		$home_url_http = home_url( $url );

		$_SERVER['HTTPS'] = 'on';

		$homeurl_https  = set_url_scheme( $homeurl_http, 'https' );
		$home_url_https = home_url( $url );

		$this->assertEquals( $homeurl_http . $expected, $home_url_http );
		$this->assertEquals( $homeurl_https . $expected, $home_url_https );
	}

	function data_home_urls() {
		return array(
			array(
				null,
				"",
			),
			array(
				0,
				"",
			),
			array(
				-1,
				"",
			),
			array(
				'///',
				"/",
			),
			array(
				'',
				"",
			),
			array(
				'foo',
				"/foo",
			),
			array(
				'/foo',
				"/foo",
			),
			array(
				'/foo/',
				"/foo/",
			),
			array(
				'foo.php',
				"/foo.php",
			),
			array(
				'/foo.php',
				"/foo.php",
			),
			array(
				'/foo.php?bar=1',
				"/foo.php?bar=1",
			),
		);
	}

	function test_home_url_from_admin() {
		$screen = get_current_screen();

		// Pretend to be in the site admin
		set_current_screen( 'dashboard' );
		$home = get_option('home');

		// home_url() should return http when in the admin
		$_SERVER['HTTPS'] = 'on';
		$this->assertEquals( $home, home_url() );

		$_SERVER['HTTPS'] = 'off';
		$this->assertEquals( $home, home_url() );

		// If not in the admin, is_ssl() should determine the scheme
		set_current_screen( 'front' );
		$this->assertEquals( $home, home_url() );
		$_SERVER['HTTPS'] = 'on';
		$home = str_replace('http://', 'https://', $home);
		$this->assertEquals( $home, home_url() );


		// Test with https in home
		update_option( 'home', set_url_scheme( $home, 'https' ) );

		// Pretend to be in the site admin
		set_current_screen( 'dashboard' );
		$home = get_option('home');

		// home_url() should return whatever scheme is set in the home option when in the admin
		$_SERVER['HTTPS'] = 'on';
		$this->assertEquals( $home, home_url() );

		$_SERVER['HTTPS'] = 'off';
		$this->assertEquals( $home, home_url() );

		// If not in the admin, is_ssl() should determine the scheme unless https hard-coded in home
		set_current_screen( 'front' );
		$this->assertEquals( $home, home_url() );
		$_SERVER['HTTPS'] = 'on';
		$this->assertEquals( $home, home_url() );
		$_SERVER['HTTPS'] = 'off';
		$this->assertEquals( $home, home_url() );

		update_option( 'home', set_url_scheme( $home, 'http' ) );

		$GLOBALS['current_screen'] = $screen;
	}

	function test_network_home_url_from_admin() {
		$screen = get_current_screen();

		// Pretend to be in the site admin
		set_current_screen( 'dashboard' );
		$home = network_home_url();

		// home_url() should return http when in the admin
		$this->assertEquals( 0, strpos( $home, 'http://') );
		$_SERVER['HTTPS'] = 'on';
		$this->assertEquals( $home, network_home_url() );

		$_SERVER['HTTPS'] = 'off';
		$this->assertEquals( $home, network_home_url() );

		// If not in the admin, is_ssl() should determine the scheme
		set_current_screen( 'front' );
		$this->assertEquals( $home, network_home_url() );
		$_SERVER['HTTPS'] = 'on';
		$home = str_replace('http://', 'https://', $home);
		$this->assertEquals( $home, network_home_url() );

		$GLOBALS['current_screen'] = $screen;
	}

	function test_set_url_scheme() {
		if ( ! function_exists( 'set_url_scheme' ) )
			return;

		$links = array(
			'http://wordpress.org/',
			'https://wordpress.org/',
			'http://wordpress.org/news/',
			'http://wordpress.org',
		);

		$https_links = array(
			'https://wordpress.org/',
			'https://wordpress.org/',
			'https://wordpress.org/news/',
			'https://wordpress.org',
		);

		$http_links = array(
			'http://wordpress.org/',
			'http://wordpress.org/',
			'http://wordpress.org/news/',
			'http://wordpress.org',
		);

		$relative_links = array(
			'/',
			'/',
			'/news/',
			''
		);

		$forced_admin = force_ssl_admin();
		$i = 0;
		foreach ( $links as $link ) {
			$this->assertEquals( $https_links[ $i ], set_url_scheme( $link, 'https' ) );
			$this->assertEquals( $http_links[ $i ], set_url_scheme( $link, 'http' ) );
			$this->assertEquals( $relative_links[ $i ], set_url_scheme( $link, 'relative' ) );

			$_SERVER['HTTPS'] = 'on';
			$this->assertEquals( $https_links[ $i ], set_url_scheme( $link ) );

			$_SERVER['HTTPS'] = 'off';
			$this->assertEquals( $http_links[ $i ], set_url_scheme( $link ) );

			force_ssl_admin( true );
			$this->assertEquals( $https_links[ $i ], set_url_scheme( $link, 'admin' ) );
			$this->assertEquals( $https_links[ $i ], set_url_scheme( $link, 'login_post' ) );
			$this->assertEquals( $https_links[ $i ], set_url_scheme( $link, 'login' ) );
			$this->assertEquals( $https_links[ $i ], set_url_scheme( $link, 'rpc' ) );

			force_ssl_admin( false );
			$this->assertEquals( $http_links[ $i ], set_url_scheme( $link, 'admin' ) );
			$this->assertEquals( $http_links[ $i ], set_url_scheme( $link, 'login_post' ) );
			$this->assertEquals( $http_links[ $i ], set_url_scheme( $link, 'login' ) );
			$this->assertEquals( $http_links[ $i ], set_url_scheme( $link, 'rpc' ) );

			$i++;
		}

		force_ssl_admin( $forced_admin );
	}

	public function test_get_adjacent_post() {
		$now = time();
		$post_id = self::factory()->post->create( array( 'post_date' => date( 'Y-m-d H:i:s', $now - 1 ) ) );
		$post_id2 = self::factory()->post->create( array( 'post_date' => date( 'Y-m-d H:i:s', $now ) ) );

		if ( ! isset( $GLOBALS['post'] ) )
			$GLOBALS['post'] = null;
		$orig_post = $GLOBALS['post'];
		$GLOBALS['post'] = get_post( $post_id2 );

		$p = get_adjacent_post();
		$this->assertInstanceOf( 'WP_Post', $p );
		$this->assertEquals( $post_id, $p->ID );

		// The same again to make sure a cached query returns the same result
		$p = get_adjacent_post();
		$this->assertInstanceOf( 'WP_Post', $p );
		$this->assertEquals( $post_id, $p->ID );

		// Test next
		$p = get_adjacent_post( false, '', false );
		$this->assertEquals( '', $p );

		unset( $GLOBALS['post'] );
		$this->assertNull( get_adjacent_post() );

		$GLOBALS['post'] = $orig_post;
	}

	/**
	 * Test get_adjacent_post returns the next private post when the author is the currently logged in user.
	 *
	 * @ticket 30287
	 */
	public function test_get_adjacent_post_should_return_private_posts_belonging_to_the_current_user() {
		$u = self::factory()->user->create( array( 'role' => 'author' ) );
		$old_uid = get_current_user_id();
		wp_set_current_user( $u );

		$now = time();
		$p1 = self::factory()->post->create( array( 'post_author' => $u, 'post_status' => 'private', 'post_date' => date( 'Y-m-d H:i:s', $now - 1 ) ) );
		$p2 = self::factory()->post->create( array( 'post_author' => $u, 'post_date' => date( 'Y-m-d H:i:s', $now ) ) );

		if ( ! isset( $GLOBALS['post'] ) ) {
			$GLOBALS['post'] = null;
		}
		$orig_post = $GLOBALS['post'];

		$GLOBALS['post'] = get_post( $p2 );

		$p = get_adjacent_post();
		$this->assertEquals( $p1, $p->ID );

		$GLOBALS['post'] = $orig_post;
		wp_set_current_user( $old_uid );
	}

	/**
	 * @ticket 30287
	 */
	public function test_get_adjacent_post_should_return_private_posts_belonging_to_other_users_if_the_current_user_can_read_private_posts() {
		$u1 = self::factory()->user->create( array( 'role' => 'author' ) );
		$u2 = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$old_uid = get_current_user_id();
		wp_set_current_user( $u2 );

		$now = time();
		$p1 = self::factory()->post->create( array( 'post_author' => $u1, 'post_status' => 'private', 'post_date' => date( 'Y-m-d H:i:s', $now - 1 ) ) );
		$p2 = self::factory()->post->create( array( 'post_author' => $u1, 'post_date' => date( 'Y-m-d H:i:s', $now ) ) );

		if ( ! isset( $GLOBALS['post'] ) ) {
			$GLOBALS['post'] = null;
		}
		$orig_post = $GLOBALS['post'];

		$GLOBALS['post'] = get_post( $p2 );

		$p = get_adjacent_post();
		$this->assertEquals( $p1, $p->ID );

		$GLOBALS['post'] = $orig_post;
		wp_set_current_user( $old_uid );
	}

	/**
	 * @ticket 30287
	 */
	public function test_get_adjacent_post_should_not_return_private_posts_belonging_to_other_users_if_the_current_user_cannot_read_private_posts() {
		$u1 = self::factory()->user->create( array( 'role' => 'author' ) );
		$u2 = self::factory()->user->create( array( 'role' => 'author' ) );
		$old_uid = get_current_user_id();
		wp_set_current_user( $u2 );

		$now = time();
		$p1 = self::factory()->post->create( array( 'post_author' => $u1, 'post_date' => date( 'Y-m-d H:i:s', $now - 2 ) ) );
		$p2 = self::factory()->post->create( array( 'post_author' => $u1, 'post_status' => 'private', 'post_date' => date( 'Y-m-d H:i:s', $now - 1 ) ) );
		$p3 = self::factory()->post->create( array( 'post_author' => $u1, 'post_date' => date( 'Y-m-d H:i:s', $now ) ) );

		if ( ! isset( $GLOBALS['post'] ) ) {
			$GLOBALS['post'] = null;
		}
		$orig_post = $GLOBALS['post'];

		$GLOBALS['post'] = get_post( $p3 );

		$p = get_adjacent_post();
		$this->assertEquals( $p1, $p->ID );

		$GLOBALS['post'] = $orig_post;
		wp_set_current_user( $old_uid );
	}

	/**
	 * Test that *_url functions handle paths with ".."
	 *
	 * @ticket 19032
	 */
	public function test_url_functions_for_dots_in_paths() {
		$functions = array(
			'site_url',
			'home_url',
			'admin_url',
			'network_admin_url',
			'user_admin_url',
			'includes_url',
			'network_site_url',
			'network_home_url',
			'content_url',
			'plugins_url',
		);

		foreach ( $functions as $function ) {
			$this->assertEquals( call_user_func( $function, '/' ) . '../',
				call_user_func( $function, '../' ) );
			$this->assertEquals( call_user_func( $function, '/' ) . 'something...here',
				call_user_func( $function, 'something...here' ) );
		}

		// These functions accept a blog ID argument.
		foreach ( array( 'get_site_url', 'get_home_url', 'get_admin_url' ) as $function ) {
			$this->assertEquals( call_user_func( $function, null, '/' ) . '../',
				call_user_func( $function, null, '../' ) );
			$this->assertEquals( call_user_func( $function, null, '/' ) . 'something...here',
				call_user_func( $function, null, 'something...here' ) );
		}
	}
}
