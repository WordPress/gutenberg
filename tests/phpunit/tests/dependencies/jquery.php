<?php

/**
 * @group dependencies
 * @group scripts
 */
class Tests_Dependencies_jQuery extends WP_UnitTestCase {

	function test_location_of_jquery() {
		$scripts = new WP_Scripts;
		wp_default_scripts( $scripts );

		$jquery_scripts = array(
			'jquery-core' => '/wp-includes/js/jquery/jquery.js',
		);
		if ( SCRIPT_DEBUG )
			$jquery_scripts['jquery-migrate'] = '/wp-includes/js/jquery/jquery-migrate.js';
		else
			$jquery_scripts['jquery-migrate'] = '/wp-includes/js/jquery/jquery-migrate.min.js';

		$object = $scripts->query( 'jquery', 'registered' );
		$this->assertInstanceOf( '_WP_Dependency', $object );
        $this->assertEqualSets( $object->deps, array_keys( $jquery_scripts ) );
        foreach( $object->deps as $dep ) {
            $o = $scripts->query( $dep, 'registered' );
            $this->assertInstanceOf( '_WP_Dependency', $object );
            $this->assertTrue( isset( $jquery_scripts[ $dep ] ) );
            $this->assertEquals( $jquery_scripts[ $dep ], $o->src );
        }
	}

	function test_presence_of_jquery_no_conflict() {
		$contents = trim( file_get_contents( ABSPATH . WPINC . '/js/jquery/jquery.js' ) );
		$noconflict = 'jQuery.noConflict();';
		$end = substr( $contents, - strlen( $noconflict ) );
		$this->assertEquals( $noconflict, $end );
	}

	/**
	 * @ticket 22896
	 *
	 * @expectedIncorrectUsage wp_deregister_script
	 */
	function test_dont_allow_deregister_core_scripts_in_admin() {
		set_current_screen( 'edit.php' );
		$this->assertTrue( is_admin() ) ;
		$libraries = array(
			'jquery', 'jquery-core', 'jquery-migrate', 'jquery-ui-core', 'jquery-ui-accordion',
			'jquery-ui-autocomplete', 'jquery-ui-button', 'jquery-ui-datepicker', 'jquery-ui-dialog',
			'jquery-ui-draggable', 'jquery-ui-droppable', 'jquery-ui-menu', 'jquery-ui-mouse',
			'jquery-ui-position', 'jquery-ui-progressbar', 'jquery-ui-resizable', 'jquery-ui-selectable',
			'jquery-ui-slider', 'jquery-ui-sortable', 'jquery-ui-spinner', 'jquery-ui-tabs',
			'jquery-ui-tooltip', 'jquery-ui-widget', 'backbone', 'underscore',
		);

		foreach ( $libraries as $library ) {
			// Try to deregister the script, which should fail.
			wp_deregister_script( $library );
			$this->assertTrue( wp_script_is( $library, 'registered' ) );
		}

		set_current_screen( 'front' );
	}

	/**
	 * @ticket 24994
	 */
	function test_exclusion_of_sourcemaps() {
		$contents = trim( file_get_contents( ABSPATH . WPINC . '/js/jquery/jquery.js' ) );
		$this->assertFalse( strpos( $contents, 'sourceMappingURL' ), 'Presence of sourceMappingURL' );
	}

	/**
	 * @ticket 28404
	 */
	function test_wp_script_is_dep_enqueued() {
		wp_enqueue_script( 'jquery-ui-accordion' );

		$this->assertTrue( wp_script_is( 'jquery', 'enqueued' ) );
		$this->assertFalse( wp_script_is( 'underscore', 'enqueued' ) );

		unset( $GLOBALS['wp_scripts'] );
	}
}
