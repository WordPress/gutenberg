<?php
/**
 * Tests for Font Family Utils class
 *
 * @package Gutenberg
 */

class WP_Font_Family_Test extends WP_UnitTestCase {

    const FONT_DATA_1 = array(
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

    const FONT_DATA_2 = array(
        'name' => 'Arial',
        'slug' => 'arial',
        'fontFamily' => 'Arial',
    );

    function test_get_data () {
        $font = new WP_Font_Family( self::FONT_DATA_1 );
        $this->assertEquals( $font->get_data()['slug'], 'piazzolla' );
        $this->assertEquals( count( $font->get_data()['fontFace'] ), 1 );
    }

    function test_get_data_as_json () {
        $font = new WP_Font_Family( self::FONT_DATA_1 );
        $this->assertEquals( $font->get_data_as_json(), wp_json_encode( self::FONT_DATA_1 ) );
    }

    function test_has_font_faces () {
        $font1 = new WP_Font_Family( self::FONT_DATA_1 );
        $this->assertTrue( $font1->has_font_faces() );
        
        $font2 = new WP_Font_Family( self::FONT_DATA_2 );
        $this->assertFalse( $font2->has_font_faces() );
    }


}
