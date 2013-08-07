<?php

/**
 * Test widget template tags
 *
 * @group widgets
 */
class Tests_Widgets extends WP_UnitTestCase {

	function test_register_widget_core_widget() {

		global $wp_widget_factory;

		unregister_widget( 'WP_Widget_Search' );
		register_widget( 'WP_Widget_Search' );

		$this->assertTrue( isset( $wp_widget_factory->widgets['WP_Widget_Search'] ) );

	}

	function test_unregister_widget_core_widget() {

		global $wp_widget_factory;

		unregister_widget( 'WP_Widget_Search' );

		$this->assertFalse( isset( $wp_widget_factory->widgets['WP_Widget_Search'] ) );

	}

	function test_register_sidebars_single() {

		global $wp_registered_sidebars;

		register_sidebars( 1, array( 'id' => 'wp-unit-test' ) );

		$this->assertTrue( isset( $wp_registered_sidebars['wp-unit-test'] ) );

	}

	function test_register_sidebars_multiple() {

		global $wp_registered_sidebars;

		$num = 3;
		$id_base = 'WP Unit Test';
		register_sidebars( $num, array( 'name' => $id_base . ' %d' ) );

		$names = wp_list_pluck( $wp_registered_sidebars, 'name' );
		for ( $i = 1; $i <= $num; $i++ ) {
			if ( in_array( "$id_base $i", $names ) )
				$result[] = true;
		}

		$this->assertEquals( $num, count( $result ) );

	}

	function test_register_sidebar() {

		global $wp_registered_sidebars;

		register_sidebar( array( 'id' => 'wp-unit-test' ) );

		$this->assertTrue( isset( $wp_registered_sidebars['wp-unit-test'] ) );

	}

	function test_unregister_sidebar() {

		global $wp_registered_sidebars;

		unregister_sidebar( 'sidebar-1' );

		$this->assertFalse( isset( $wp_registered_sidebars['sidebar-1'] ) );

	}
}
