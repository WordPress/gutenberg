<?php

/**
 * @group formatting
 */
class Tests_Formatting_EscHtml extends WP_UnitTestCase {
	function test_esc_html_basics() {
		// Simple string
		$html = "The quick brown fox.";
		$this->assertEquals( $html, esc_html( $html ) );

		// URL with &
		$html = "http://localhost/trunk/wp-login.php?action=logout&_wpnonce=cd57d75985";
		$escaped = "http://localhost/trunk/wp-login.php?action=logout&amp;_wpnonce=cd57d75985";
		$this->assertEquals( $escaped, esc_html( $html ) );

		// SQL query
		$html = "SELECT meta_key, meta_value FROM wp_trunk_sitemeta WHERE meta_key IN ('site_name', 'siteurl', 'active_sitewide_plugins', '_site_transient_timeout_theme_roots', '_site_transient_theme_roots', 'site_admins', 'can_compress_scripts', 'global_terms_enabled') AND site_id = 1";
		$escaped = "SELECT meta_key, meta_value FROM wp_trunk_sitemeta WHERE meta_key IN (&#039;site_name&#039;, &#039;siteurl&#039;, &#039;active_sitewide_plugins&#039;, &#039;_site_transient_timeout_theme_roots&#039;, &#039;_site_transient_theme_roots&#039;, &#039;site_admins&#039;, &#039;can_compress_scripts&#039;, &#039;global_terms_enabled&#039;) AND site_id = 1";
		$this->assertEquals( $escaped, esc_html( $html ) );
	}

	function test_escapes_ampersands() {
		$source = "penn & teller & at&t";
		$res = "penn &amp; teller &amp; at&amp;t";
		$this->assertEquals( $res, esc_html($source) );
	}

	function test_escapes_greater_and_less_than() {
		$source = "this > that < that <randomhtml />";
		$res = "this &gt; that &lt; that &lt;randomhtml /&gt;";
		$this->assertEquals( $res, esc_html($source) );
	}

	function test_ignores_existing_entities() {
		$source = '&#038; &#x00A3; &#x22; &amp;';
		$res = '&#038; &#xA3; &#x22; &amp;';
		$this->assertEquals( $res, esc_html($source) );
	}
}
