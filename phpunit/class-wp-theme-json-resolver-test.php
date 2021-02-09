<?php

/**
 * Test WP_Theme_JSON_Resolver class.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Test extends WP_UnitTestCase {

    function test_presets_are_extracted() {
        $actual   = WP_Theme_JSON_Resolver::get_presets_to_translate();

        $expected = array(
            array(
                'path'              => array( 'settings', '*', 'typography', 'fontSizes' ),
                'translatable_keys' => array( 'name' ),
            ),
            array(
                'path'              => array( 'settings', '*', 'typography', 'fontStyles' ),
                'translatable_keys' => array( 'name' ),
            ),
            array(
                'path'              => array( 'settings', '*', 'typography', 'fontWeights' ),
                'translatable_keys' => array( 'name' ),
            ),
            array(
                'path'              => array( 'settings', '*', 'typography', 'fontFamilies' ),
                'translatable_keys' => array( 'name' ),
            ),
            array(
                'path'              => array( 'settings', '*', 'typography', 'textTransforms' ),
                'translatable_keys' => array( 'name' ),
            ),
            array(
                'path'              => array( 'settings', '*', 'typography', 'textDecorations' ),
                'translatable_keys' => array( 'name' ),
            ),
            array(
                'path'              => array( 'settings', '*', 'color', 'palette' ),
                'translatable_keys' => array( 'name' ),
            ),
            array(
                'path'              => array( 'settings', '*', 'color', 'gradients' ),
                'translatable_keys' => array( 'name' ),
            ),
        );

        $this->assertEquals( $expected, $actual );
    }

}