<?php

/**
 * @group canonical
 * @group rewrite
 * @group query
 */
class Tests_Canonical_HTTPS extends WP_Canonical_UnitTestCase {
	function setUp() {
		parent::setUp();

		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
		create_initial_taxonomies();

		$this->http  = set_url_scheme( home_url( 'sample-page/' ), 'http' );
		$this->https = set_url_scheme( home_url( 'sample-page/' ), 'https' );
	}

	public function set_https( $url ) {
		return set_url_scheme( $url, 'https' );
	}

	/**
	 * @ticket 27954
	 */
	public function test_http_request_with_http_home() {

		$redirect = redirect_canonical( $this->http, false );

		$this->assertEquals( $redirect, false );

	}

	/**
	 * @ticket 27954
	 */
	public function test_https_request_with_http_home() {

		$redirect = redirect_canonical( $this->https, false );

		$this->assertEquals( $redirect, false );

	}

	/**
	 * @ticket 27954
	 */
	public function test_https_request_with_https_home() {

		add_filter( 'home_url', array( $this, 'set_https' ) );

		$redirect = redirect_canonical( $this->https, false );

		$this->assertEquals( $redirect, false );

		remove_filter( 'home_url', array( $this, 'set_https' ) );

	}

}
