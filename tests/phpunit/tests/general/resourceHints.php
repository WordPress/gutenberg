<?php

/**
 * @group  template
 * @ticket 34292
 */
class Tests_WP_Resource_Hints extends WP_UnitTestCase {
	private $old_wp_scripts;
	private $old_wp_styles;

	function setUp() {
		parent::setUp();
		$this->old_wp_scripts = isset( $GLOBALS['wp_scripts'] ) ? $GLOBALS['wp_scripts'] : null;
		$this->old_wp_styles = isset( $GLOBALS['wp_styles'] ) ? $GLOBALS['wp_styles'] : null;

		remove_action( 'wp_default_scripts', 'wp_default_scripts' );
		remove_action( 'wp_default_styles', 'wp_default_styles' );

		$GLOBALS['wp_scripts'] = new WP_Scripts();
		$GLOBALS['wp_scripts']->default_version = get_bloginfo( 'version' );
		$GLOBALS['wp_styles'] = new WP_Styles();
		$GLOBALS['wp_styles']->default_version = get_bloginfo( 'version' );
	}

	function tearDown() {
		$GLOBALS['wp_scripts'] = $this->old_wp_scripts;
		$GLOBALS['wp_styles']  = $this->old_wp_styles;
		add_action( 'wp_default_scripts', 'wp_default_scripts' );
		add_action( 'wp_default_styles', 'wp_default_styles' );
		parent::tearDown();
	}

	function test_should_have_defaults_on_frontend() {
		$expected = "<link rel='preconnect' href='http://s.w.org'>\r\n";

		$this->expectOutputString( $expected );

		wp_resource_hints();
	}

	function test_dns_prefetching() {
		$expected = "<link rel='dns-prefetch' href='http://wordpress.org'>\r\n" .
					"<link rel='dns-prefetch' href='https://google.com'>\r\n" .
					"<link rel='dns-prefetch' href='make.wordpress.org'>\r\n" .
					"<link rel='preconnect' href='http://s.w.org'>\r\n";

		add_filter( 'wp_resource_hints', array( $this, '_add_dns_prefetch_domains' ), 10, 2 );

		$actual = get_echo( 'wp_resource_hints' );

		remove_filter( 'wp_resource_hints', array( $this, '_add_dns_prefetch_domains' ) );

		$this->assertEquals( $expected, $actual );
	}

	function _add_dns_prefetch_domains( $hints, $method ) {
		if ( 'dns-prefetch' === $method ) {
			$hints[] = 'http://wordpress.org';
			$hints[] = 'https://google.com';
			$hints[] = '//make.wordpress.org';
		}

		return $hints;
	}

	function test_prerender() {
		$expected = "<link rel='preconnect' href='http://s.w.org'>\r\n" .
					"<link rel='prerender' href='https://make.wordpress.org/great-again'>\r\n" .
					"<link rel='prerender' href='http://jobs.wordpress.net'>\r\n" .
					"<link rel='prerender' href='//core.trac.wordpress.org'>\r\n";

		add_filter( 'wp_resource_hints', array( $this, '_add_prerender_urls' ), 10, 2 );

		$actual = get_echo( 'wp_resource_hints' );

		remove_filter( 'wp_resource_hints', array( $this, '_add_prerender_urls' ) );

		$this->assertEquals( $expected, $actual );
	}

	function _add_prerender_urls( $hints, $method ) {
		if ( 'prerender' === $method ) {
			$hints[] = 'https://make.wordpress.org/great-again';
			$hints[] = 'http://jobs.wordpress.net';
			$hints[] = '//core.trac.wordpress.org';
		}

		return $hints;
	}

	function test_parse_url_dns_prefetch() {
		$expected = "<link rel='dns-prefetch' href='http://make.wordpress.org'>\r\n" .
					"<link rel='preconnect' href='http://s.w.org'>\r\n";

		add_filter( 'wp_resource_hints', array( $this, '_add_dns_prefetch_long_urls' ), 10, 2 );

		$actual = get_echo( 'wp_resource_hints' );

		remove_filter( 'wp_resource_hints', array( $this, '_add_dns_prefetch_long_urls' ) );

		$this->assertEquals( $expected, $actual );
	}

	function _add_dns_prefetch_long_urls( $hints, $method ) {
		if ( 'dns-prefetch' === $method ) {
			$hints[] = 'http://make.wordpress.org/wp-includes/css/editor.css';
		}

		return $hints;
	}

	/**
	 * @group foo
	 */
	function test_dns_prefetch_styles() {
		$expected = "<link rel='dns-prefetch' href='http://fonts.googleapis.com'>\r\n" .
					"<link rel='preconnect' href='http://s.w.org'>\r\n";

		$args = array(
			'family' => 'Open+Sans:400',
			'subset' => 'latin',
		);

		wp_enqueue_style( 'googlefonts', add_query_arg( $args, '//fonts.googleapis.com/css' ) );

		$actual = get_echo( 'wp_resource_hints' );

		wp_dequeue_style( 'googlefonts' );

		$this->assertEquals( $expected, $actual );

	}

	function test_dns_prefetch_scripts() {
		$expected = "<link rel='dns-prefetch' href='http://fonts.googleapis.com'>\r\n" .
					"<link rel='preconnect' href='http://s.w.org'>\r\n";

		$args = array(
			'family' => 'Open+Sans:400',
			'subset' => 'latin',
		);

		wp_enqueue_script( 'googlefonts', add_query_arg( $args, '//fonts.googleapis.com/css' ) );

		$actual = get_echo( 'wp_resource_hints' );

		wp_dequeue_style( 'googlefonts' );

		$this->assertEquals( $expected, $actual );
	}

}
