<?php
/**
 * A set of unit tests for functions in wp-includes/general-template.php
 *
 * @group template
 * @group site_icon
 */

require_once( ABSPATH . 'wp-admin/includes/class-wp-site-icon.php' );

class Tests_General_Template extends WP_UnitTestCase {
	protected $wp_site_icon;
	public $site_icon_id;
	public $site_icon_url;

	public $custom_logo_id;
	public $custom_logo_url;

	function setUp() {
		parent::setUp();

		$this->wp_site_icon = new WP_Site_Icon();
	}

	function tearDown() {
		global $wp_customize;
		$this->_remove_custom_logo();
		$this->_remove_site_icon();
		$wp_customize = null;

		parent::tearDown();
	}

	/**
	 * @group site_icon
	 */
	function test_get_site_icon_url() {
		$this->assertEmpty( get_site_icon_url() );

		$this->_set_site_icon();
		$this->assertEquals( $this->site_icon_url, get_site_icon_url() );

		$this->_remove_site_icon();
		$this->assertEmpty( get_site_icon_url() );
	}

	/**
	 * @group site_icon
	 */
	function test_site_icon_url() {
		$this->expectOutputString( '' );
		site_icon_url();

		$this->_set_site_icon();
		$this->expectOutputString( $this->site_icon_url );
		site_icon_url();
	}

	/**
	 * @group site_icon
	 */
	function test_has_site_icon() {
		$this->assertFalse( has_site_icon() );

		$this->_set_site_icon();
		$this->assertTrue( has_site_icon() );

		$this->_remove_site_icon();
		$this->assertFalse( has_site_icon() );
	}

	/**
 	 * @group site_icon
	 * @group multisite
	 * @group ms-required
	 */
	function test_has_site_icon_returns_true_when_called_for_other_site_with_site_icon_set() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test requires multisite.' );
		}

		$blog_id = $this->factory->blog->create();
		switch_to_blog( $blog_id );
		$this->_set_site_icon();
		restore_current_blog();

		$this->assertTrue( has_site_icon( $blog_id ) );
	}

	/**
	 * @group site_icon
	 * @group multisite
	 * @group ms-required
	 */
	function test_has_site_icon_returns_false_when_called_for_other_site_without_site_icon_set() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test requires multisite.' );
		}

		$blog_id = $this->factory->blog->create();

		$this->assertFalse( has_site_icon( $blog_id ) );
	}

	/**
	 * @group site_icon
	 */
	function test_wp_site_icon() {
		$this->expectOutputString( '' );
		wp_site_icon();

		$this->_set_site_icon();
		$output = array(
			sprintf( '<link rel="icon" href="%s" sizes="32x32" />', esc_url( get_site_icon_url( 32 ) ) ),
			sprintf( '<link rel="icon" href="%s" sizes="192x192" />', esc_url( get_site_icon_url( 192 ) ) ),
			sprintf( '<link rel="apple-touch-icon-precomposed" href="%s" />', esc_url( get_site_icon_url( 180 ) ) ),
			sprintf( '<meta name="msapplication-TileImage" content="%s" />', esc_url( get_site_icon_url( 270 ) ) ),
			'',
		);
		$output = implode( "\n", $output );

		$this->expectOutputString( $output );
		wp_site_icon();
	}

	/**
	 * @group site_icon
	 */
	function test_wp_site_icon_with_filter() {
		$this->expectOutputString( '' );
		wp_site_icon();

		$this->_set_site_icon();
		$output = array(
			sprintf( '<link rel="icon" href="%s" sizes="32x32" />', esc_url( get_site_icon_url( 32 ) ) ),
			sprintf( '<link rel="icon" href="%s" sizes="192x192" />', esc_url( get_site_icon_url( 192 ) ) ),
			sprintf( '<link rel="apple-touch-icon-precomposed" href="%s" />', esc_url( get_site_icon_url( 180 ) ) ),
			sprintf( '<meta name="msapplication-TileImage" content="%s" />', esc_url( get_site_icon_url( 270 ) ) ),
			sprintf( '<link rel="apple-touch-icon" sizes="150x150" href="%s" />', esc_url( get_site_icon_url( 150 ) ) ),
			'',
		);
		$output = implode( "\n", $output );

		$this->expectOutputString( $output );
		add_filter( 'site_icon_meta_tags', array( $this, '_custom_site_icon_meta_tag' ) );
		wp_site_icon();
		remove_filter( 'site_icon_meta_tags', array( $this, '_custom_site_icon_meta_tag' ) );
	}

	/**
	 * @group site_icon
	 * @ticket 38377
	 */
	function test_customize_preview_wp_site_icon_empty() {
		global $wp_customize;
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );

		require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
		$wp_customize = new WP_Customize_Manager();
		$wp_customize->register_controls();
		$wp_customize->start_previewing_theme();

		$this->expectOutputString( '<link rel="icon" href="/favicon.ico" sizes="32x32" />' . "\n" );
		wp_site_icon();
	}

	/**
	 * @group site_icon
	 * @ticket 38377
	 */
	function test_customize_preview_wp_site_icon_dirty() {
		global $wp_customize;
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );

		require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
		$wp_customize = new WP_Customize_Manager();
		$wp_customize->register_controls();
		$wp_customize->start_previewing_theme();

		$attachment_id = $this->_insert_attachment();
		$wp_customize->set_post_value( 'site_icon', $attachment_id );
		$wp_customize->get_setting( 'site_icon' )->preview();
		$output = array(
			sprintf( '<link rel="icon" href="%s" sizes="32x32" />', esc_url( wp_get_attachment_image_url( $attachment_id, 32 ) ) ),
			sprintf( '<link rel="icon" href="%s" sizes="192x192" />', esc_url( wp_get_attachment_image_url( $attachment_id, 192 ) ) ),
			sprintf( '<link rel="apple-touch-icon-precomposed" href="%s" />', esc_url( wp_get_attachment_image_url( $attachment_id, 180 ) ) ),
			sprintf( '<meta name="msapplication-TileImage" content="%s" />', esc_url( wp_get_attachment_image_url( $attachment_id, 270 ) ) ),
			'',
		);
		$output = implode( "\n", $output );
		$this->expectOutputString( $output );
		wp_site_icon();
	}

	/**
	 * Builds and retrieves a custom site icon meta tag.
	 *
	 * @since 4.3.0
	 *
	 * @param $meta_tags
	 * @return array
	 */
	function _custom_site_icon_meta_tag( $meta_tags ) {
		$meta_tags[] = sprintf( '<link rel="apple-touch-icon" sizes="150x150" href="%s" />', esc_url( get_site_icon_url( 150 ) ) );

		return $meta_tags;
	}

	/**
	 * Sets a site icon in options for testing.
	 *
	 * @since 4.3.0
	 */
	function _set_site_icon() {
		if ( ! $this->site_icon_id ) {
			add_filter( 'intermediate_image_sizes_advanced', array( $this->wp_site_icon, 'additional_sizes' ) );
			$this->_insert_attachment();
			remove_filter( 'intermediate_image_sizes_advanced', array( $this->wp_site_icon, 'additional_sizes' ) );
		}

		update_option( 'site_icon', $this->site_icon_id );
	}

	/**
	 * Removes the site icon from options.
	 *
	 * @since 4.3.0
	 */
	function _remove_site_icon() {
		delete_option( 'site_icon' );
	}

	/**
	 * Inserts an attachment for testing site icons.
	 *
	 * @since 4.3.0
	 */
	function _insert_attachment() {
		$filename = DIR_TESTDATA . '/images/test-image.jpg';
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$this->site_icon_url = $upload['url'];


		// Save the data
		$this->site_icon_id = $this->_make_attachment( $upload );
		return $this->site_icon_id;
	}

	/**
	 * @group custom_logo
	 *
	 * @since 4.5.0
	 */
	function test_has_custom_logo() {
		$this->assertFalse( has_custom_logo() );

		$this->_set_custom_logo();
		$this->assertTrue( has_custom_logo() );

		$this->_remove_custom_logo();
		$this->assertFalse( has_custom_logo() );
	}

	/**
	 * @group custom_logo
	 * @group multisite
	 * @group ms-required
	 */
	function test_has_custom_logo_returns_true_when_called_for_other_site_with_custom_logo_set() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test requires multisite.' );
		}

		$blog_id = $this->factory->blog->create();
		switch_to_blog( $blog_id );
		$this->_set_custom_logo();
		restore_current_blog();

		$this->assertTrue( has_custom_logo( $blog_id ) );
	}

	/**
	 * @group custom_logo
	 * @group multisite
	 * @group ms-required
	 */
	function test_has_custom_logo_returns_false_when_called_for_other_site_without_custom_logo_set() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test requires multisite.' );
		}

		$blog_id = $this->factory->blog->create();

		$this->assertFalse( has_custom_logo( $blog_id ) );
	}

	/**
	 * @group custom_logo
	 *
	 * @since 4.5.0
	 */
	function test_get_custom_logo() {
		$this->assertEmpty( get_custom_logo() );

		$this->_set_custom_logo();
		$custom_logo = get_custom_logo();
		$this->assertNotEmpty( $custom_logo );
		$this->assertInternalType( 'string', $custom_logo );

		$this->_remove_custom_logo();
		$this->assertEmpty( get_custom_logo() );
	}

	/**
	 * @group custom_logo
	 * @group multisite
	 * @group ms-required
	 */
	function test_get_custom_logo_returns_logo_when_called_for_other_site_with_custom_logo_set() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test requires multisite.' );
		}

		$blog_id = $this->factory->blog->create();
		switch_to_blog( $blog_id );

		$this->_set_custom_logo();
		$home_url = get_home_url( $blog_id, '/' );
		$image    = wp_get_attachment_image( $this->custom_logo_id, 'full', false, array(
			'class'     => 'custom-logo',
			'itemprop'  => 'logo',
		) );
		restore_current_blog();

		$expected_custom_logo =  '<a href="' . $home_url . '" class="custom-logo-link" rel="home" itemprop="url">' . $image . '</a>';
		$this->assertEquals( $expected_custom_logo, get_custom_logo( $blog_id ) );
	}

	/**
	 * @group custom_logo
	 *
	 * @since 4.5.0
	 */
	function test_the_custom_logo() {
		$this->expectOutputString( '' );
		the_custom_logo();

		$this->_set_custom_logo();
		$image = wp_get_attachment_image( $this->custom_logo_id, 'full', false, array(
			'class'     => 'custom-logo',
			'itemprop'  => 'logo',
		) );

		$this->expectOutputString( '<a href="http://' . WP_TESTS_DOMAIN . '/" class="custom-logo-link" rel="home" itemprop="url">' . $image . '</a>' );
		the_custom_logo();
	}

	/**
	 * Sets a site icon in options for testing.
	 *
	 * @since 4.5.0
	 */
	function _set_custom_logo() {
		if ( ! $this->custom_logo_id ) {
			$this->_insert_custom_logo();
		}

		set_theme_mod( 'custom_logo', $this->custom_logo_id );
	}

	/**
	 * Removes the site icon from options.
	 *
	 * @since 4.5.0
	 */
	function _remove_custom_logo() {
		remove_theme_mod( 'custom_logo' );
	}

	/**
	 * Inserts an attachment for testing custom logos.
	 *
	 * @since 4.5.0
	 */
	function _insert_custom_logo() {
		$filename = DIR_TESTDATA . '/images/test-image.jpg';
		$contents = file_get_contents( $filename );
		$upload   = wp_upload_bits( basename( $filename ), null, $contents );

		// Save the data.
		$this->custom_logo_url = $upload['url'];
		$this->custom_logo_id  = $this->_make_attachment( $upload );
		return $this->custom_logo_id;
	}

	/**
	 * Test get_the_modified_time
	 *
	 * @ticket 37059
	 *
	 * @since 4.6.0
	 */
	function test_get_the_modified_time_default() {
		$details = array(
				'post_date' => '2016-01-21 15:34:36',
				'post_date_gmt' => '2016-01-21 15:34:36',
		);
		$post_id = $this->factory->post->create( $details );
		$post = get_post( $post_id );

		$GLOBALS['post'] = $post;

		$expected = '1453390476';
		$d = 'G';
		$actual = get_the_modified_time( $d );
		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Test get_the_modified_time failures are filtered
	 *
	 * @ticket 37059
	 *
	 * @since 4.6.0
	 */
	function test_get_the_modified_time_failures_are_filtered() {
		// Remove global post objet
		$GLOBALS['post'] = null;

		$expected = 'filtered modified time failure result';
		add_filter( 'get_the_modified_time', array( $this, '_filter_get_the_modified_time_failure' ) );
		$actual = get_the_modified_time();
		$this->assertEquals( $expected, $actual );
		remove_filter( 'get_the_modified_time', array( $this, '_filter_get_the_modified_time_failure' ) );
	}

	function _filter_get_the_modified_time_failure( $the_time ) {
		$expected = false;
		$actual   = $the_time;
		$this->assertEquals( $expected, $actual );

		if ( false === $the_time ) {
			return 'filtered modified time failure result';
		}
		return $the_time;
	}

	/**
	 * Test get_the_modified_time with post_id parameter.
	 *
	 * @ticket 37059
	 *
	 * @since 4.6.0
	 */
	function test_get_the_modified_date_with_post_id() {
		$details = array(
				'post_date' => '2016-01-21 15:34:36',
				'post_date_gmt' => '2016-01-21 15:34:36',
		);
		$post_id = $this->factory->post->create( $details );
		$d = 'Y-m-d';
		$expected = '2016-01-21';
		$actual = get_the_modified_date( $d, $post_id );
		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Test get_the_modified_date
	 *
	 * @ticket 37059
	 *
	 * @since 4.6.0
	 */
	function test_get_the_modified_date_default() {
		$details = array(
				'post_date' => '2016-01-21 15:34:36',
				'post_date_gmt' => '2016-01-21 15:34:36',
		);
		$post_id = $this->factory->post->create( $details );
		$post = get_post( $post_id );

		$GLOBALS['post'] = $post;

		$expected = '2016-01-21';
		$d = 'Y-m-d';
		$actual = get_the_modified_date( $d );
		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Test get_the_modified_date failures are filtered
	 *
	 * @ticket 37059
	 *
	 * @since 4.6.0
	 */
	function test_get_the_modified_date_failures_are_filtered() {
		// Remove global post objet
		$GLOBALS['post'] = null;

		$expected = 'filtered modified date failure result';
		add_filter( 'get_the_modified_date', array( $this, '_filter_get_the_modified_date_failure' ) );
		$actual = get_the_modified_date();
		$this->assertEquals( $expected, $actual );
		remove_filter( 'get_the_modified_date', array( $this, '_filter_get_the_modified_date_failure' ) );
	}

	function _filter_get_the_modified_date_failure( $the_date ) {
		$expected = false;
		$actual   = $the_date;
		$this->assertEquals( $expected, $actual );

		if ( false === $the_date ) {
			return 'filtered modified date failure result';
		}
		return $the_date;
	}

	/**
	 * Test get_the_modified_time with post_id parameter.
	 *
	 * @ticket 37059
	 *
	 * @since 4.6.0
	 */
	function test_get_the_modified_time_with_post_id() {
		$details = array(
				'post_date' => '2016-01-21 15:34:36',
				'post_date_gmt' => '2016-01-21 15:34:36',
		);
		$post_id = $this->factory->post->create( $details );
		$d = 'G';
		$expected = '1453390476';
		$actual = get_the_modified_time( $d, $post_id );
		$this->assertEquals( $expected, $actual );
	}

	/**
	 * @ticket 38253
	 * @group ms-required
	 */
	function test_get_site_icon_url_preserves_switched_state() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test requires multisite.' );
		}

		$blog_id = $this->factory->blog->create();
		switch_to_blog( $blog_id );

		$expected = $GLOBALS['_wp_switched_stack'];

		get_site_icon_url( 512, '', $blog_id );

		$result = $GLOBALS['_wp_switched_stack'];

		restore_current_blog();

		$this->assertSame( $expected, $result );
	}

	/**
	 * @ticket 38253
	 * @group ms-required
	 */
	function test_has_custom_logo_preserves_switched_state() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test requires multisite.' );
		}

		$blog_id = $this->factory->blog->create();
		switch_to_blog( $blog_id );

		$expected = $GLOBALS['_wp_switched_stack'];

		has_custom_logo( $blog_id );

		$result = $GLOBALS['_wp_switched_stack'];

		restore_current_blog();

		$this->assertSame( $expected, $result );
	}

	/**
	 * @ticket 38253
	 * @group ms-required
	 */
	function test_get_custom_logo_preserves_switched_state() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test requires multisite.' );
		}

		$blog_id = $this->factory->blog->create();
		switch_to_blog( $blog_id );

		$expected = $GLOBALS['_wp_switched_stack'];

		get_custom_logo( $blog_id );

		$result = $GLOBALS['_wp_switched_stack'];

		restore_current_blog();

		$this->assertSame( $expected, $result );
	}
}
