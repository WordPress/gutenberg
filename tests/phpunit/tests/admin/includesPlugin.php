<?php
/**
 * @group plugins
 * @group admin
 */
class Tests_Admin_includesPlugin extends WP_UnitTestCase {
	function test_get_plugin_data() {
		$data = get_plugin_data( DIR_TESTDATA . '/plugins/hello.php' );

		$default_headers = array(
			'Name' => 'Hello Dolly',
			'Title' => '<a href="http://wordpress.org/#">Hello Dolly</a>',
			'PluginURI' => 'http://wordpress.org/#',
			'Description' => 'This is not just a plugin, it symbolizes the hope and enthusiasm of an entire generation summed up in two words sung most famously by Louis Armstrong: Hello, Dolly. When activated you will randomly see a lyric from Hello, Dolly in the upper right of your admin screen on every page. <cite>By <a href="http://ma.tt/">Matt Mullenweg</a>.</cite>',
			'Author' => '<a href="http://ma.tt/">Matt Mullenweg</a>',
			'AuthorURI' => 'http://ma.tt/',
			'Version' => '1.5.1',
			'TextDomain' => 'hello-dolly',
			'DomainPath' => ''
		);

		$this->assertTrue( is_array($data) );

		foreach ($default_headers as $name => $value) {
			$this->assertTrue(isset($data[$name]));
			$this->assertEquals($value, $data[$name]);
		}
	}

	function test_menu_page_url() {
		$current_user = get_current_user_id();
		wp_set_current_user( $this->factory->user->create( array( 'role' => 'administrator' ) ) );
		update_option( 'siteurl', 'http://example.com' );

		// add some pages
		add_options_page( 'Test Settings', 'Test Settings', 'manage_options', 'testsettings', 'mt_settings_page' );
		add_management_page( 'Test Tools', 'Test Tools', 'manage_options', 'testtools', 'mt_tools_page' );
		add_menu_page( 'Test Toplevel', 'Test Toplevel', 'manage_options', 'mt-top-level-handle', 'mt_toplevel_page' );
		add_submenu_page( 'mt-top-level-handle', 'Test Sublevel', 'Test Sublevel', 'manage_options', 'sub-page', 'mt_sublevel_page' );
		add_submenu_page( 'mt-top-level-handle', 'Test Sublevel 2', 'Test Sublevel 2', 'manage_options', 'sub-page2', 'mt_sublevel_page2' );
		add_theme_page( 'With Spaces', 'With Spaces', 'manage_options', 'With Spaces', 'mt_tools_page' );
		add_pages_page( 'Appending Query Arg', 'Test Pages', 'edit_pages', 'testpages', 'mt_pages_page' );

		$expected['testsettings'] = 'http://example.com/wp-admin/options-general.php?page=testsettings';
		$expected['testtools'] = 'http://example.com/wp-admin/tools.php?page=testtools';
		$expected['mt-top-level-handle'] = 'http://example.com/wp-admin/admin.php?page=mt-top-level-handle';
		$expected['sub-page'] = 'http://example.com/wp-admin/admin.php?page=sub-page';
		$expected['sub-page2'] = 'http://example.com/wp-admin/admin.php?page=sub-page2';
		$expected['not_registered'] = '';
		$expected['With Spaces'] = 'http://example.com/wp-admin/themes.php?page=WithSpaces';
		$expected['testpages'] = 'http://example.com/wp-admin/edit.php?post_type=page&#038;page=testpages';

		foreach ($expected as $name => $value) {
			$this->assertEquals( $value, menu_page_url( $name, false ) );
		}

		wp_set_current_user( $current_user );
	}
}
