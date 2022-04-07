<?php

/**
 * Test functions.php
 *
 * @package Gutenberg
 */

class WP_Functions_Test extends WP_UnitTestCase {
	function test_wp_recursive_ksort() {
		// Create an array to test.
		$theme_json = array(
			'version'  => 1,
			'settings' => array(
				'typography' => array(
					'fontFamilies' => array(
						'fontFamily' => 'DM Sans, sans-serif',
						'slug'       => 'dm-sans',
						'name'       => 'DM Sans',
					),
				),
				'color'      => array(
					'palette' => array(
						array(
							'slug'  => 'foreground',
							'color' => '#242321',
							'name'  => 'Foreground',
						),
						array(
							'slug'  => 'background',
							'color' => '#FCFBF8',
							'name'  => 'Background',
						),
						array(
							'slug'  => 'primary',
							'color' => '#71706E',
							'name'  => 'Primary',
						),
						array(
							'slug'  => 'tertiary',
							'color' => '#CFCFCF',
							'name'  => 'Tertiary',
						),
					),
				),
			),
		);

		// Sort the array.
		wp_recursive_ksort( $theme_json );

		// Expected result.
		$expected_theme_json = array(
			'settings' => array(
				'color'      => array(
					'palette' => array(
						array(
							'color' => '#242321',
							'name'  => 'Foreground',
							'slug'  => 'foreground',
						),
						array(
							'color' => '#FCFBF8',
							'name'  => 'Background',
							'slug'  => 'background',
						),
						array(
							'color' => '#71706E',
							'name'  => 'Primary',
							'slug'  => 'primary',
						),
						array(
							'color' => '#CFCFCF',
							'name'  => 'Tertiary',
							'slug'  => 'tertiary',
						),
					),
				),
				'typography' => array(
					'fontFamilies' => array(
						'fontFamily' => 'DM Sans, sans-serif',
						'name'       => 'DM Sans',
						'slug'       => 'dm-sans',
					),
				),
			),
			'version'  => 1,
		);
		$this->assertEquals( $theme_json, $expected_theme_json );
	}
}
