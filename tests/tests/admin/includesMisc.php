<?php

/**
 * @group admin
 */
class Tests_Admin_includesMisc extends WP_UnitTestCase {
	function test_shorten_url() {
		$tests = array(
			'wordpress\.org/about/philosophy'
				=> 'wordpress\.org/about/philosophy', // no longer strips slashes
			'wordpress.org/about/philosophy'
				=> 'wordpress.org/about/philosophy',
			'http://wordpress.org/about/philosophy/'
				=> 'wordpress.org/about/philosophy', // remove http, trailing slash
			'http://www.wordpress.org/about/philosophy/'
				=> 'wordpress.org/about/philosophy', // remove http, www
			'http://wordpress.org/about/philosophy/#box'
				=> 'wordpress.org/about/philosophy/#box', // don't shorten 35 characters
			'http://wordpress.org/about/philosophy/#decisions'
				=> 'wordpress.org/about/philosophy/#&hellip;', // shorten to 32 if > 35 after cleaning
		);
		foreach ( $tests as $k => $v )
			$this->assertEquals( $v, url_shorten( $k ) );
	}
}
