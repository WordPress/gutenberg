<?php

/**
 * Tests for plugin_basename()
 *
 * @group functions.php
 * @group plugins
 */
class Tests_Plugin_Basename extends WP_UnitTestCase {

	/**
	 * @ticket 29154
	 */
	function test_should_return_correct_basename_for_symlinked_plugins() {
		global $wp_plugin_paths;

		$old_wp_plugin_paths = $wp_plugin_paths;

		$wp_plugin_paths[ wp_normalize_path( WP_PLUGIN_DIR ) . '/a-symlinked-plugin' ] = 'C:/www/path/plugins/a-plugin';

		$basename = plugin_basename( 'c:\www\path\plugins\a-plugin\plugin.php' );

		$wp_plugin_paths = $old_wp_plugin_paths;

		$this->assertSame( 'a-symlinked-plugin/plugin.php', $basename );
	}
}
