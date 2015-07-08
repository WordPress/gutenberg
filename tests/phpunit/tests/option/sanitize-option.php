<?php

/**
 * @group option
 */
class Tests_Sanitize_Option extends WP_UnitTestCase {

	/**
	 * Data provider to test all of the sanitize_option() case
	 *
	 * Inner array params: $option_name, $sanitized, $original
	 * @return array
	 *
	 */
	public function sanitize_option_provider() {
		return array(
			array( 'admin_email', 'mail@example.com', 'mail@example.com' ),
			array( 'admin_email', get_option( 'admin_email' ), 'invalid' ),
			array( 'page_on_front', 0, 0 ),
			array( 'page_on_front', 10, '-10' ),
			array( 'posts_per_page', 10, 10 ),
			array( 'posts_per_page', -1, -1 ),
			array( 'posts_per_page', 2, -2 ),
			array( 'posts_per_page', 1, 'ten' ),
			array( 'default_ping_status', 'open', 'open' ),
			array( 'default_ping_status', 'closed', '' ),
			array( 'blogname', 'My Site', 'My Site' ),
			array( 'blogname', '&lt;i&gt;My Site&lt;/i&gt;', '<i>My Site</i>' ),
			array( 'blog_charset', 'UTF-8', 'UTF-8' ),
			array( 'blog_charset', 'charset', '">charset<"' ),
			array( 'blog_public', 1, null ),
			array( 'blog_public', 1, '1' ),
			array( 'blog_public', -2, '-2' ),
			array( 'date_format', 'F j, Y', 'F j, Y' ),
			array( 'date_format', 'F j, Y', 'F j, <strong>Y</strong>' ),
			array( 'ping_sites', 'http://rpc.pingomatic.com/', 'http://rpc.pingomatic.com/' ),
			array( 'ping_sites', "http://www.example.com\nhttp://example.org", "www.example.com \n\texample.org\n\n" ),
			array( 'gmt_offset', '0', 0 ),
			array( 'gmt_offset', '1.5', '1.5' ),
			array( 'siteurl', 'http://example.org', 'http://example.org' ),
			array( 'siteurl', 'http://example.org/subdir', 'http://example.org/subdir' ),
			array( 'siteurl', get_option( 'siteurl' ), '' ),
			array( 'home', 'http://example.org', 'example.org' ),
			array( 'home', 'https://example.org', 'https://example.org' ),
			array( 'home', 'http://localhost:8000', 'http://localhost:8000' ),
			array( 'home', get_option( 'home' ), '' ),
			array( 'WPLANG', 0, 0 ),
			array( 'WPLANG', '', '' ),
			array(
				'illegal_names',
				array( 'www', 'web', 'root', 'admin', 'main', 'invite', 'administrator', 'files' ),
				array( 'www', 'web', 'root', 'admin', 'main', 'invite', 'administrator', 'files' ),
			),
			array(
				'illegal_names',
				array( 'www', 'web', 'root', 'admin', 'main', 'invite', 'administrator', 'files' ),
				"www     web root admin main invite administrator files",
			),
			array(
				'banned_email_domains',
				array( 'mail.com', 'gmail.com' ),
				array( 'mail.com', 'gmail.com' ),
			),
			array(
				'banned_email_domains',
				array( 'mail.com' ),
				"mail.com\ngmail,com",
			),
			array( 'timezone_string', 0, 0 ),
			array( 'timezone_string', 'Europe/London', 'Europe/London' ),
			array( 'timezone_string', get_option( 'timezone_string' ), 'invalid' ),
			array( 'permalink_structure', '', '' ),
			array( 'permalink_structure', '/%year%/%postname%', '/%year%/ %postname%' ),
			array( 'default_role', 'subscriber', 'subscriber' ),
			array( 'default_role', 'subscriber', 'invalid' ),
			array( 'default_role', 'editor', 'editor' ),
			array( 'moderation_keys', 'string of words', 'string of words' ),
			array( 'moderation_keys', "one\ntwo three", "one\none\ntwo three" ),
		);
	}

	/**
	 * @dataProvider sanitize_option_provider
	 */
	public function test_sanitize_option( $option_name, $sanitized, $original ) {
		$this->assertSame( $sanitized, sanitize_option( $option_name, $original ) );
	}

	public function upload_path_provider()  {
		return array(
			array( '<a href="http://www.example.com">Link</a>', 'Link' ),
			array( '<scr' . 'ipt>url</scr' . 'ipt>', 'url' ),
			array( '/path/to/things', '/path/to/things' ),
			array( '\path\to\things', '\path\to\things' ),
		);
	}

	/**
	 * @dataProvider upload_path_provider
	 */
	public function test_sanitize_option_upload_path( $provided, $expected ) {
		$this->assertSame( $expected, sanitize_option( 'upload_path', $provided ) );
	}

}
