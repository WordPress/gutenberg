<?php

/**
 * Test WP_Theme_JSON_Resolver class.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Resolver_Test extends WP_UnitTestCase {

	function test_presets_are_extracted() {
		$actual = WP_Theme_JSON_Resolver::get_presets_to_translate();

		$expected = array(
			array(
				'path'    => array( 'settings', '*', 'typography', 'fontSizes' ),
				'key'     => 'name',
				'context' => 'Font size name',
			),
			array(
				'path'    => array( 'settings', '*', 'typography', 'fontStyles' ),
				'key'     => 'name',
				'context' => 'Font style name',
			),
			array(
				'path'    => array( 'settings', '*', 'typography', 'fontWeights' ),
				'key'     => 'name',
				'context' => 'Font weight name',
			),
			array(
				'path'    => array( 'settings', '*', 'typography', 'fontFamilies' ),
				'key'     => 'name',
				'context' => 'Font family name',
			),
			array(
				'path'    => array( 'settings', '*', 'typography', 'textTransforms' ),
				'key'     => 'name',
				'context' => 'Text transform name',
			),
			array(
				'path'    => array( 'settings', '*', 'typography', 'textDecorations' ),
				'key'     => 'name',
				'context' => 'Text decoration name',
			),
			array(
				'path'    => array( 'settings', '*', 'color', 'palette' ),
				'key'     => 'name',
				'context' => 'Color name',
			),
			array(
				'path'    => array( 'settings', '*', 'color', 'gradients' ),
				'key'     => 'name',
				'context' => 'Gradient name',
			),
		);

		$this->assertEquals( $expected, $actual );
	}
}
