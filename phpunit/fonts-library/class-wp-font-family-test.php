<?php
/**
 * Tests for Font Family Utils class
 *
 * @package Gutenberg
 */

class WP_Font_Family_Test extends WP_UnitTestCase {

    function test_construct () {

        $data = array(
            'name' => 'Piazzolla',
            'slug' => 'piazzolla',
            'fontFamily' => 'Piazzolla',
            'fontFace' => [
                array(
                    'fontFamily' => 'Piazzolla',
                    'fontStyle' => 'italic',
                    'fontWeight' => '400',
                    'src' => [
                        'http://example.com/fonts/piazzolla1.ttf',
                    ]
                )
            ]
        );

        $font = new WP_Font_Family( $data );
        $this->assertEquals( $font->get_data()['slug'], 'piazzolla' );
        $this->assertEquals( count( $font->get_data()['fontFace'] ), 1 );
    }


}
