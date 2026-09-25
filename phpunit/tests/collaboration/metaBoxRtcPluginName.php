<?php
/**
 * Tests resolving the plugin behind a meta box that blocks collaboration.
 *
 * @package Gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */

class Tests_Collaboration_Meta_Box_Rtc_Plugin_Name extends WP_UnitTestCase {

	public function test_plugin_name_is_resolved_for_a_meta_box_registered_by_a_plugin() {
		/*
		 * Gutenberg is itself an installed plugin under WP_PLUGIN_DIR, so a
		 * callback declared in its own source stands in for a third-party
		 * plugin's render callback.
		 */
		$plugin_name = gutenberg_get_rtc_meta_box_plugin_name(
			array( 'callback' => 'gutenberg_get_rtc_meta_box_plugin_name' )
		);

		$this->assertSame( 'Gutenberg', $plugin_name );
	}

	public function test_plugin_name_is_resolved_for_a_meta_box_registered_by_a_must_use_plugin() {
		/*
		 * Must-use plugins load from their own directory and are named by
		 * file rather than by directory, a layout Core's own resolver does
		 * not recognise.
		 */
		$plugin_name = gutenberg_get_rtc_meta_box_plugin_name(
			array( 'callback' => 'gutenberg_enable_templates_ui' )
		);

		$this->assertSame(
			'Gutenberg Test Plugin, Enable Templates UI',
			$plugin_name
		);
	}

	public function test_no_plugin_name_is_resolved_for_a_meta_box_registered_outside_a_plugin() {
		/*
		 * Meta boxes registered by a theme, a must-use plugin or Core resolve
		 * to no plugin. Callers fall back to the meta box title instead.
		 */
		$plugin_name = gutenberg_get_rtc_meta_box_plugin_name(
			array( 'callback' => 'wp_get_current_user' )
		);

		$this->assertNull( $plugin_name );
	}

	public function test_no_plugin_name_is_resolved_when_the_meta_box_has_no_callback() {
		$this->assertNull( gutenberg_get_rtc_meta_box_plugin_name( array() ) );
	}

	public function test_no_plugin_name_is_resolved_for_an_uncallable_callback() {
		$this->assertNull(
			gutenberg_get_rtc_meta_box_plugin_name(
				array( 'callback' => 'gutenberg_no_such_meta_box_callback' )
			)
		);
	}
}
